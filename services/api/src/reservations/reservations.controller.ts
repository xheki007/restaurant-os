// PATH: C:\restaurant-os\services\api\src\reservations\reservations.controller.ts

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Permissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { QueryReservationsDto } from "./dto/query-reservations.dto";

@Controller("reservations")
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.read")
  @Get()
  findAll(
    @Query() query: QueryReservationsDto,
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.findAll(user.tenantId, user.userId, query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.read")
  @Get(":id")
  findById(
    @Param("id") id: string,
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.findById(id, user.tenantId, user.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.create")
  @Post("walk-in")
  createWalkIn(
    @Body()
    body: {
      branchId?: string;
      tableId?: string;
      partySize?: number;
      startAt?: string;
      durationMinutes?: number;
    },
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.createWalkIn({
      tenantId: user.tenantId,
      userId: user.userId,
      branchId: String(body.branchId || ""),
      tableId: String(body.tableId || ""),
      partySize: Number(body.partySize || 1),
      startAt: body.startAt,
      durationMinutes:
        body.durationMinutes === undefined ? undefined : Number(body.durationMinutes),
    });
  }
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.create")
  @Post()
  create(
    @Body() body: any,
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.create({
      ...body,
      tenantId: user.tenantId,
      userId: user.userId,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.update")
  @Patch(":id/status")
  changeStatus(
    @Param("id") id: string,
    @Body() body: { newStatus: any; reason?: string },
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.changeStatus({
      reservationId: id,
      tenantId: user.tenantId,
      userId: user.userId,
      newStatus: body.newStatus,
      reason: body.reason,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.cancel")
  @Patch(":id/cancel")
  cancel(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.cancel(id, user.tenantId, body.reason);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.update")
  @Patch(":id/seat")
  seat(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.seat(id, user.tenantId, body.reason);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.update")
  @Patch(":id/complete")
  complete(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.complete(id, user.tenantId, body.reason);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("reservations.assign")
  @Patch(":id/assign")
  assign(
    @Param("id") id: string,
    @Body()
    body: {
      assignedTableId?: string;
      assignedZoneId?: string;
      assignedCombinationId?: string;
      reason?: string;
    },
    @CurrentUser()
    user: {
      userId: string;
      tenantId: string;
    },
  ) {
    return this.reservationsService.assignTable({
      userId: user.userId,
      reservationId: id,
      tenantId: user.tenantId,
      assignedTableId: body.assignedTableId,
      assignedZoneId: body.assignedZoneId,
      assignedCombinationId: body.assignedCombinationId,
      reason: body.reason,
    });
  }
}