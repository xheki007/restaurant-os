// PATH: C:\restaurant-os\services\api\src\tenants\tenants.controller.ts

import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { TenantsService } from "./tenants.service";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("branches.read")
  @Get()
  findAll(
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
      tenantSlug: string;
      email: string;
    },
  ) {
    return this.tenantsService.findById(user.tenantId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("branches.read")
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tenantsService.findById(id);
  }
}