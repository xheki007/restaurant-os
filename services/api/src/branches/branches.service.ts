import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: true,
        restaurant: true,
        settings: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.branch.findUnique({
      where: { id },
      include: {
        tenant: true,
        restaurant: true,
        settings: true,
        businessHours: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
        dayOverrides: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });
  }

  async updateSettings(
    branchId: string,
    body: {
      defaultReservationDurationMin?: number;
      tableTurnoverBufferMin?: number;
      maxPartySize?: number;
      totalSeatingCapacity?: number;
      maxOnlineGuestsPerDay?: number | null;
      allowOnlineBooking?: boolean;
      allowWalkIns?: boolean;
      allowPhoneReservations?: boolean;
      allowIndoorOnline?: boolean;
      allowTerraceOnline?: boolean;
      defaultOnlineZoneId?: string | null;
      requireGuestPhone?: boolean;
      requireGuestEmail?: boolean;
      reservationLeadTimeMin?: number;
      reservationCutoffMin?: number;
    },
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found");
    }

    const data: any = {};

    if (body.defaultReservationDurationMin !== undefined) {
      data.defaultReservationDurationMin = Number(body.defaultReservationDurationMin);
    }

    if (body.tableTurnoverBufferMin !== undefined) {
      data.tableTurnoverBufferMin = Number(body.tableTurnoverBufferMin);
    }

    if (body.maxPartySize !== undefined) {
      data.maxPartySize = Number(body.maxPartySize);
    }

    if (body.totalSeatingCapacity !== undefined) {
      data.totalSeatingCapacity = Number(body.totalSeatingCapacity);
    }

    if (body.maxOnlineGuestsPerDay !== undefined) {
      data.maxOnlineGuestsPerDay =
        body.maxOnlineGuestsPerDay === null || body.maxOnlineGuestsPerDay === 0
          ? null
          : Number(body.maxOnlineGuestsPerDay);
    }

    if (body.allowOnlineBooking !== undefined) {
      data.allowOnlineBooking = Boolean(body.allowOnlineBooking);
    }

    if (body.allowWalkIns !== undefined) {
      data.allowWalkIns = Boolean(body.allowWalkIns);
    }

    if (body.allowPhoneReservations !== undefined) {
      data.allowPhoneReservations = Boolean(body.allowPhoneReservations);
    }

    if (body.allowIndoorOnline !== undefined) {
      data.allowIndoorOnline = Boolean(body.allowIndoorOnline);
    }

    if (body.allowTerraceOnline !== undefined) {
      data.allowTerraceOnline = Boolean(body.allowTerraceOnline);
    }

    if (body.defaultOnlineZoneId !== undefined) {
      data.defaultOnlineZoneId = body.defaultOnlineZoneId || null;
    }

    if (body.requireGuestPhone !== undefined) {
      data.requireGuestPhone = Boolean(body.requireGuestPhone);
    }

    if (body.requireGuestEmail !== undefined) {
      data.requireGuestEmail = Boolean(body.requireGuestEmail);
    }

    if (body.reservationLeadTimeMin !== undefined) {
      data.reservationLeadTimeMin = Number(body.reservationLeadTimeMin);
    }

    if (body.reservationCutoffMin !== undefined) {
      data.reservationCutoffMin = Number(body.reservationCutoffMin);
    }

    await this.prisma.branchSettings.upsert({
      where: {
        branchId,
      },
      update: data,
      create: {
        tenantId: branch.tenantId,
        branchId,
        ...data,
      },
    });

    return this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        tenant: true,
        restaurant: true,
        settings: true,
        businessHours: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
        dayOverrides: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });
  }

  async updateBusinessHours(
    branchId: string,
    body: {
      days: Array<{
        dayOfWeek: number;
        slots: Array<{
          openTime: string;
          closeTime: string;
          serviceType: string;
        }>;
      }>;
    },
  ) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        tenantId: true,
      },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found");
    }

    await this.prisma.businessHour.deleteMany({
      where: { branchId },
    });

    const createData: Array<{
      tenantId: string;
      branchId: string;
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      serviceType: any;
      isClosed: boolean;
    }> = [];

    for (const day of body.days || []) {
      for (const slot of day.slots || []) {
        if (!slot.openTime || !slot.closeTime || !slot.serviceType) {
          continue;
        }

        createData.push({
          tenantId: branch.tenantId,
          branchId,
          dayOfWeek: Number(day.dayOfWeek),
          openTime: slot.openTime,
          closeTime: slot.closeTime,
          serviceType: slot.serviceType as any,
          isClosed: false,
        });
      }
    }

    if (createData.length > 0) {
      await this.prisma.businessHour.createMany({
        data: createData,
      });
    }

    return this.prisma.branch.findUnique({
      where: { id: branchId },
      include: {
        tenant: true,
        restaurant: true,
        settings: true,
        businessHours: {
          orderBy: {
            dayOfWeek: "asc",
          },
        },
        dayOverrides: {
          orderBy: {
            date: "asc",
          },
        },
      },
    });
  }
}