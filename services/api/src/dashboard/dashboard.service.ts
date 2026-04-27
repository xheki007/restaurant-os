// PATH: C:\restaurant-os\services\api\src\dashboard\dashboard.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildDashboardScope(tenantId: string, userId?: string) {
    if (!userId) {
      return { tenantId };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          tenantId,
        },
      },
      select: {
        branchId: true,
      },
    });

    if (userRoles.length === 0) {
      return {
        tenantId,
        branchId: { in: [] as string[] },
      };
    }

    const hasTenantWideAccess = userRoles.some((x) => x.branchId === null);

    if (hasTenantWideAccess) {
      return { tenantId };
    }

    const allowedBranchIds = [
      ...new Set(
        userRoles
          .map((x) => x.branchId)
          .filter((x): x is string => Boolean(x)),
      ),
    ];

    return {
      tenantId,
      branchId: { in: allowedBranchIds },
    };
  }

  async getSummary(
    tenantId: string,
    userId?: string,
    query?: { dateFrom?: string; dateTo?: string },
  ) {
    const dateFrom = query?.dateFrom
      ? new Date(new Date(query.dateFrom).setHours(0, 0, 0, 0))
      : new Date(new Date().setHours(0, 0, 0, 0));

    const dateTo = query?.dateTo
      ? new Date(new Date(query.dateTo).setHours(23, 59, 59, 999))
      : new Date(new Date().setHours(23, 59, 59, 999));

    const scope = await this.buildDashboardScope(tenantId, userId);

    const whereBase: any = {
      ...scope,
      reservationDate: {
        gte: dateFrom,
        lte: dateTo,
      },
    };

    const [
      total,
      confirmed,
      seated,
      cancelled,
      pending,
      completed,
      noShow,
      waitlisted,
    ] = await this.prisma.$transaction([
      this.prisma.reservation.count({ where: whereBase }),
      this.prisma.reservation.count({
        where: { ...whereBase, status: "CONFIRMED" },
      }),
      this.prisma.reservation.count({
        where: { ...whereBase, status: "SEATED" },
      }),
      this.prisma.reservation.count({
        where: { ...whereBase, status: "CANCELLED" },
      }),
      this.prisma.reservation.count({
        where: { ...whereBase, status: "PENDING" },
      }),
      this.prisma.reservation.count({
        where: { ...whereBase, status: "COMPLETED" },
      }),
      this.prisma.reservation.count({
        where: { ...whereBase, status: "NO_SHOW" },
      }),
      this.prisma.reservation.count({
        where: { ...whereBase, status: "WAITLISTED" },
      }),
    ]);

    return {
      range: {
        dateFrom,
        dateTo,
      },
      total,
      confirmed,
      seated,
      cancelled,
      pending,
      completed,
      noShow,
      waitlisted,
    };
  }

  async getDailyBreakdown(
    tenantId: string,
    userId?: string,
    query?: { dateFrom?: string; dateTo?: string },
  ) {
    const dateFrom = query?.dateFrom
      ? new Date(new Date(query.dateFrom).setHours(0, 0, 0, 0))
      : new Date(new Date().setHours(0, 0, 0, 0));

    const dateTo = query?.dateTo
      ? new Date(new Date(query.dateTo).setHours(23, 59, 59, 999))
      : new Date(new Date().setHours(23, 59, 59, 999));

    const scope = await this.buildDashboardScope(tenantId, userId);

    const rows = await this.prisma.reservation.findMany({
      where: {
        ...scope,
        reservationDate: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        reservationDate: true,
        status: true,
      },
      orderBy: {
        reservationDate: "asc",
      },
    });

    const bucketMap = new Map();

    const cursor = new Date(dateFrom);
    while (cursor <= dateTo) {
      const key = cursor.toLocaleDateString("sv-SE");

      bucketMap.set(key, {
        date: key,
        total: 0,
        confirmed: 0,
        seated: 0,
        cancelled: 0,
        pending: 0,
        completed: 0,
        noShow: 0,
        waitlisted: 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    for (const row of rows) {
      const key = new Date(row.reservationDate).toLocaleDateString("sv-SE");
      const bucket = bucketMap.get(key);

      if (!bucket) {
        continue;
      }

      bucket.total += 1;

      if (row.status === "CONFIRMED") bucket.confirmed += 1;
      if (row.status === "SEATED") bucket.seated += 1;
      if (row.status === "CANCELLED") bucket.cancelled += 1;
      if (row.status === "PENDING") bucket.pending += 1;
      if (row.status === "COMPLETED") bucket.completed += 1;
      if (row.status === "NO_SHOW") bucket.noShow += 1;
      if (row.status === "WAITLISTED") bucket.waitlisted += 1;
    }

    return {
      range: {
        dateFrom,
        dateTo,
      },
      items: Array.from(bucketMap.values()),
    };
  }
}