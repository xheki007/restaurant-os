import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  private overlaps(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  async findAll() {
    return this.prisma.waitlistEntry.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: true,
        branch: true,
        guest: true,
        requestedZone: true,
        promotedReservation: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        tenant: true,
        branch: true,
        guest: true,
        requestedZone: true,
        promotedReservation: true,
      },
    });
  }

  async create(data: {
    tenantId: string;
    branchId: string;
    guestId: string;
    partySize: number;
    requestedDate: string;
    requestedStartAt?: string;
    requestedZoneId?: string;
    note?: string;
  }) {
    return this.prisma.waitlistEntry.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        guestId: data.guestId,
        partySize: data.partySize,
        requestedDate: new Date(data.requestedDate),
        requestedStartAt: data.requestedStartAt
          ? new Date(data.requestedStartAt)
          : undefined,
        requestedZoneId: data.requestedZoneId,
        note: data.note,
        status: "WAITLISTED",
      },
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: "WAITLISTED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "NO_SHOW";
      note?: string;
    },
  ) {
    return this.prisma.waitlistEntry.update({
      where: { id },
      data: {
        status: data.status,
        note: data.note,
      },
    });
  }

  async promoteBestCandidate(data: {
    tenantId: string;
    branchId: string;
    tableId: string;
    zoneId: string;
    reservationDate: string;
    startAt: string;
    endAt: string;
    expiresInMin?: number;
  }) {
    const branchSettings = await this.prisma.branchSettings.findUnique({
      where: {
        branchId: data.branchId,
      },
    });

    const table = await this.prisma.restaurantTable.findUnique({
      where: {
        id: data.tableId,
      },
    });

    if (!branchSettings) {
      throw new BadRequestException("Branch settings not found");
    }

    if (!table) {
      throw new NotFoundException("Table not found");
    }

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    const reservationDate = new Date(data.reservationDate);
    const tableTurnoverBufferMin = branchSettings.tableTurnoverBufferMin ?? 15;
    const expiresInMin = data.expiresInMin ?? 10;

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        branchId: data.branchId,
        status: {
          in: ["PENDING", "CONFIRMED", "SEATED"],
        },
        assignedTableId: data.tableId,
      },
      orderBy: {
        startAt: "asc",
      },
    });

    const hasConflict = existingReservations.some((reservation) => {
      const reservationStart = new Date(reservation.startAt);
      const reservationEndWithBuffer = this.addMinutes(
        new Date(reservation.endAt),
        tableTurnoverBufferMin,
      );

      return this.overlaps(
        startAt,
        endAt,
        reservationStart,
        reservationEndWithBuffer,
      );
    });

    if (hasConflict) {
      throw new BadRequestException("Table is not actually free for promotion");
    }

    const candidates = await this.prisma.waitlistEntry.findMany({
      where: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        status: "WAITLISTED",
        requestedDate: reservationDate,
        partySize: {
          lte: table.capacityMax,
        },
        ...(data.zoneId
          ? {
              OR: [
                { requestedZoneId: null },
                { requestedZoneId: data.zoneId },
              ],
            }
          : {}),
      },
      include: {
        guest: true,
      },
      orderBy: [{ requestedStartAt: "asc" }, { createdAt: "asc" }],
    });

    const candidate = candidates.find((entry) => {
      if (entry.partySize < table.capacityMin || entry.partySize > table.capacityMax) {
        return false;
      }

      if (!entry.requestedStartAt) {
        return true;
      }

      const requestedStartAt = new Date(entry.requestedStartAt);
      const requestedEndAt = this.addMinutes(
        requestedStartAt,
        branchSettings.defaultReservationDurationMin,
      );

      return this.overlaps(
        requestedStartAt,
        requestedEndAt,
        startAt,
        endAt,
      );
    });

    if (!candidate) {
      return {
        promoted: false,
        reason: "No matching waitlist candidate found",
      };
    }

    const promotedStartAt = candidate.requestedStartAt
      ? new Date(candidate.requestedStartAt)
      : new Date(data.startAt);

    const promotedEndAt = this.addMinutes(
      promotedStartAt,
      branchSettings.defaultReservationDurationMin,
    );

    const promotionExpiresAt = this.addMinutes(new Date(), expiresInMin);

    const confirmationCode =
      "RSV-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const result = await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.create({
        data: {
          tenantId: data.tenantId,
          branchId: data.branchId,
          guestId: candidate.guestId,
          source: "MANUAL",
          status: "PENDING",
          partySize: candidate.partySize,
          reservationDate,
          startAt: promotedStartAt,
          endAt: promotedEndAt,
          requestedZoneId: candidate.requestedZoneId,
          assignedZoneId: data.zoneId,
          assignedTableId: data.tableId,
          internalNote: "Auto-promoted from waitlist",
          guestNote: candidate.note,
          confirmationCode,
        },
      });

      await tx.reservationStatusHistory.create({
        data: {
          tenantId: data.tenantId,
          reservationId: reservation.id,
          oldStatus: null,
          newStatus: "PENDING",
          reason: "Auto-promoted from waitlist pending guest confirmation",
        },
      });

      await tx.reservationAssignmentLog.create({
        data: {
          tenantId: data.tenantId,
          reservationId: reservation.id,
          oldTableId: null,
          newTableId: data.tableId,
          oldZoneId: null,
          newZoneId: data.zoneId,
          reason: "Auto-promoted from waitlist",
        },
      });

      const updatedWaitlist = await tx.waitlistEntry.update({
        where: { id: candidate.id },
        data: {
          status: "PENDING",
          note: "Promoted to reservation automatically, awaiting confirmation",
          promotionExpiresAt,
          promotedReservationId: reservation.id,
        },
      });

      return {
        reservation,
        waitlistEntry: updatedWaitlist,
      };
    });

    return {
      promoted: true,
      candidateId: candidate.id,
      expiresAt: promotionExpiresAt.toISOString(),
      ...result,
    };
  }

  async confirmPromotion(waitlistEntryId: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { id: waitlistEntryId },
      include: {
        promotedReservation: true,
      },
    });

    if (!entry) {
      throw new NotFoundException("Waitlist entry not found");
    }

    if (!entry.promotedReservationId) {
      throw new BadRequestException("Waitlist entry has no promoted reservation");
    }

    const promotedReservationId = entry.promotedReservationId;

    const result = await this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: promotedReservationId },
      });

      if (!reservation) {
        throw new NotFoundException("Promoted reservation not found");
      }

      const previousStatus = reservation.status;

      const updatedReservation = await tx.reservation.update({
        where: { id: promotedReservationId },
        data: {
          status: "CONFIRMED",
        },
      });

      await tx.reservationStatusHistory.create({
        data: {
          tenantId: entry.tenantId,
          reservationId: promotedReservationId,
          oldStatus: previousStatus,
          newStatus: "CONFIRMED",
          reason: "Guest confirmed promoted waitlist reservation",
        },
      });

      const updatedWaitlist = await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          status: "CONFIRMED",
          note: "Promotion confirmed by guest",
          promotionExpiresAt: null,
        },
      });

      return {
        reservation: updatedReservation,
        waitlistEntry: updatedWaitlist,
      };
    });

    return {
      confirmed: true,
      ...result,
    };
  }

  async expirePromotion(waitlistEntryId: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { id: waitlistEntryId },
      include: {
        promotedReservation: true,
      },
    });

    if (!entry) {
      throw new NotFoundException("Waitlist entry not found");
    }

    if (!entry.promotedReservationId) {
      return {
        expired: false,
        reason: "Waitlist entry has no promoted reservation",
      };
    }

    if (!entry.promotionExpiresAt) {
      return {
        expired: false,
        reason: "Waitlist entry has no expiration timestamp",
      };
    }

    const now = new Date();

    if (entry.promotionExpiresAt > now) {
      return {
        expired: false,
        reason: "Promotion has not expired yet",
        expiresAt: entry.promotionExpiresAt.toISOString(),
      };
    }

    const promotedReservationId = entry.promotedReservationId;

    const result = await this.prisma.$transaction(async (tx) => {
      const currentReservation = await tx.reservation.findUnique({
        where: {
          id: promotedReservationId,
        },
      });

      if (!currentReservation) {
        throw new NotFoundException("Promoted reservation not found");
      }

      const previousStatus = currentReservation.status;

      const reservation = await tx.reservation.update({
        where: {
          id: promotedReservationId,
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          internalNote: "Auto-cancelled after promotion expiration",
        },
      });

      await tx.reservationStatusHistory.create({
        data: {
          tenantId: entry.tenantId,
          reservationId: reservation.id,
          oldStatus: previousStatus,
          newStatus: "CANCELLED",
          reason: "Promotion expired without confirmation",
        },
      });

      const waitlistEntry = await tx.waitlistEntry.update({
        where: { id: entry.id },
        data: {
          status: "WAITLISTED",
          note: "Promotion expired, returned to waitlist",
          promotionExpiresAt: null,
          promotedReservationId: null,
        },
      });

      return {
        reservation,
        waitlistEntry,
      };
    });

    return {
      expired: true,
      ...result,
    };
  }

  async expirePromotionAndRetry(waitlistEntryId: string) {
    const before = await this.prisma.waitlistEntry.findUnique({
      where: { id: waitlistEntryId },
      include: {
        promotedReservation: true,
      },
    });

    if (!before) {
      throw new NotFoundException("Waitlist entry not found");
    }

    if (!before.promotedReservation) {
      return {
        expired: false,
        retried: false,
        reason: "No promoted reservation attached",
      };
    }

    const promotedReservation = before.promotedReservation;

    if (!promotedReservation.assignedTableId || !promotedReservation.assignedZoneId) {
      return {
        expired: false,
        retried: false,
        reason: "Promoted reservation has no assigned table/zone",
      };
    }

    const expired = await this.expirePromotion(waitlistEntryId);

    if (!(expired as any).expired) {
      return {
        ...expired,
        retried: false,
      };
    }

    const retry = await this.promoteBestCandidate({
      tenantId: before.tenantId,
      branchId: before.branchId,
      tableId: promotedReservation.assignedTableId,
      zoneId: promotedReservation.assignedZoneId,
      reservationDate: promotedReservation.reservationDate.toISOString(),
      startAt: promotedReservation.startAt.toISOString(),
      endAt: promotedReservation.endAt.toISOString(),
    });

    return {
      expired: true,
      retried: true,
      expirationResult: expired,
      retryResult: retry,
    };
  }
}