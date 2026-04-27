// PATH: C:\restaurant-os\services\api\src\dashboard\dashboard.controller.ts

import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.read")
  @Get("summary")
  getSummary(
    @CurrentUser()
    user: {
      tenantId: string;
      userId: string;
    },
    @Query() query: any,
  ) {
    return this.dashboardService.getSummary(user.tenantId, user.userId, query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.read")
  @Get("daily-breakdown")
  getDailyBreakdown(
    @CurrentUser()
    user: {
      tenantId: string;
      userId: string;
    },
    @Query() query: any,
  ) {
    return this.dashboardService.getDailyBreakdown(
      user.tenantId,
      user.userId,
      query,
    );
  }
}