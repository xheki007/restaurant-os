// PATH: C:\restaurant-os\services\api\src\auth\auth.service.ts

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, tenantSlug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new UnauthorizedException("Invalid tenant");
    }

    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("User is not active");
    }

    return { user, tenant };
  }

  async login(email: string, password: string, tenantSlug: string) {
    const { user, tenant } = await this.validateUser(email, password, tenantSlug);

    const roles = await this.prisma.userRole.findMany({
      where: { userId: user.id },
      select: {
        branchId: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        status: user.status,
      },
      roles,
    };
  }
}