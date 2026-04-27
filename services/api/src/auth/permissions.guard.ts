// PATH: C:\restaurant-os\services\api\src\auth\permissions.guard.ts

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { PERMISSIONS_KEY } from "./permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | {
          userId: string;
          tenantId: string;
          tenantSlug: string;
          email: string;
        }
      | undefined;

    if (!user?.userId || !user?.tenantId) {
      throw new ForbiddenException("User context not found");
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.userId,
        role: {
          tenantId: user.tenantId,
        },
      },
      select: {
        role: {
          select: {
            code: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const grantedPermissions = new Set<string>();

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        grantedPermissions.add(rolePermission.permission.code);
      }
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      grantedPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}