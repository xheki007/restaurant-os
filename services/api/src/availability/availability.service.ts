import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReservationsService } from "../reservations/reservations.service";

type AvailabilityReason =
  | "NO_AVAILABILITY"
  | "NO_TABLE_COMBINATION"
  | "DAILY_LIMIT_REACHED"
  | "OUTSIDE_BUSINESS_HOURS"
  | "ONLINE_BOOKING_DISABLED"
  | "PARTY_SIZE_EXCEEDS_MAX";

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
  ) {}

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  private overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private center(t: any) {
    return {
      x: Number(t.posX || 0) + Number(t.width || 0) / 2,
      y: Number(t.posY || 0) + Number(t.height || 0) / 2,
    };
  }

  private distance(a: any, b: any) {
    const A = this.center(a);
    const B = this.center(b);
    return Math.hypot(A.x - B.x, A.y - B.y);
  }

  private getUtcDayRange(dateOnly: string) {
    return {
      start: new Date(dateOnly + "T00:00:00.000Z"),
      end: new Date(dateOnly + "T23:59:59.999Z"),
    };
  }

  private getSoftCapInfo(capValue: number | null | undefined) {
    const cap = Number(capValue || 0);

    if (!Number.isFinite(cap) || cap <= 0) {
      return {
        enabled: false,
        cap: 0,
        tolerance: 0,
        hardLimit: 0,
      };
    }

    const tolerance = Math.max(2, Math.ceil(cap * 0.1));

    return {
      enabled: true,
      cap,
      tolerance,
      hardLimit: cap + tolerance,
    };
  }

  private findBestCombination(tables: any[], partySize: number) {
    let best: any = null;

    const tryCombo = (combo: any[]) => {
      const capacity = combo.reduce((s, t) => s + Number(t.capacityMax || 0), 0);

      if (capacity < partySize) {
        return;
      }

      const overflow = capacity - partySize;
      const dist = combo.reduce((sum, t, i) => {
        return sum + combo.slice(i + 1).reduce((s, t2) => s + this.distance(t, t2), 0);
      }, 0);

      const score = { overflow, count: combo.length, dist };

      if (
        !best ||
        score.overflow < best.score.overflow ||
        (score.overflow === best.score.overflow && score.count < best.score.count) ||
        (score.overflow === best.score.overflow && score.count === best.score.count && score.dist < best.score.dist)
      ) {
        best = { tables: combo, capacity, score };
      }
    };

    const n = tables.length;

    for (let i = 0; i < n; i++) {
      tryCombo([tables[i]]);
      for (let j = i + 1; j < n; j++) {
        tryCombo([tables[i], tables[j]]);
        for (let k = j + 1; k < n; k++) {
          tryCombo([tables[i], tables[j], tables[k]]);
          for (let l = k + 1; l < n; l++) {
            tryCombo([tables[i], tables[j], tables[k], tables[l]]);
          }
        }
      }
    }

    return best;
  }

  private buildBusinessHourBlocks(dateOnly: string, hours: any[]) {
    return (hours || [])
      .filter((item) => item && item.isClosed !== true && item.openTime && item.closeTime)
      .sort((a, b) => String(a.openTime).localeCompare(String(b.openTime)))
      .map((item) => {
        const start = new Date(dateOnly + "T" + item.openTime + ":00.000Z");
        const end = new Date(dateOnly + "T" + item.closeTime + ":00.000Z");

        return {
          id: item.id,
          serviceType: item.serviceType,
          openTime: item.openTime,
          closeTime: item.closeTime,
          start,
          end,
        };
      })
      .filter((block) => !Number.isNaN(block.start.getTime()) && !Number.isNaN(block.end.getTime()) && block.start < block.end);
  }

  async getAvailability(params: {
    branchId: string;
    date: string;
    partySize: number;
    zoneId?: string;
  }) {
    const settings = await this.prisma.branchSettings.findUnique({
      where: { branchId: params.branchId },
    });

    if (!settings) {
      return {
        branchId: params.branchId,
        date: params.date,
        partySize: params.partySize,
        reason: "NO_AVAILABILITY" as AvailabilityReason,
        summary: {
          businessHoursBlocks: 0,
          candidateTables: 0,
          candidateCombinations: 0,
          reservedTables: 0,
          reservedCombinations: 0,
          reservationsCount: 0,
          generatedSlots: 0,
          onlineGuestsBooked: 0,
          onlineGuestsHardLimit: 0,
        },
        slots: [],
      };
    }

    if (!settings.allowOnlineBooking) {
      return {
        branchId: params.branchId,
        date: params.date,
        partySize: params.partySize,
        reason: "ONLINE_BOOKING_DISABLED" as AvailabilityReason,
        summary: {
          businessHoursBlocks: 0,
          candidateTables: 0,
          candidateCombinations: 0,
          reservedTables: 0,
          reservedCombinations: 0,
          reservationsCount: 0,
          generatedSlots: 0,
          onlineGuestsBooked: 0,
          onlineGuestsHardLimit: 0,
        },
        slots: [],
      };
    }

    if (params.partySize > Number(settings.maxPartySize || 0)) {
      return {
        branchId: params.branchId,
        date: params.date,
        partySize: params.partySize,
        reason: "PARTY_SIZE_EXCEEDS_MAX" as AvailabilityReason,
        summary: {
          businessHoursBlocks: 0,
          candidateTables: 0,
          candidateCombinations: 0,
          reservedTables: 0,
          reservedCombinations: 0,
          reservationsCount: 0,
          generatedSlots: 0,
          onlineGuestsBooked: 0,
          onlineGuestsHardLimit: 0,
        },
        slots: [],
      };
    }

    const duration = Number(settings.defaultReservationDurationMin || 90);
    const buffer = Number(settings.tableTurnoverBufferMin || 15);
    const dayRange = this.getUtcDayRange(params.date);

    const [tables, reservations, hours] = await Promise.all([
      this.prisma.restaurantTable.findMany({
        where: {
          branchId: params.branchId,
          isActive: true,
          ...(params.zoneId ? { zoneId: params.zoneId } : {}),
        },
        orderBy: [{ posX: "asc" }, { posY: "asc" }],
      }),
      this.prisma.reservation.findMany({
        where: {
          branchId: params.branchId,
          reservationDate: { gte: dayRange.start, lte: dayRange.end },
          status: { in: ["PENDING", "CONFIRMED", "SEATED"] },
        },
        include: {
          assignedCombination: {
            include: { items: true },
          },
        },
      }),
      this.prisma.businessHour.findMany({
        where: {
          branchId: params.branchId,
          dayOfWeek: new Date(params.date + "T12:00:00.000Z").getUTCDay() === 0 ? 7 : new Date(params.date + "T12:00:00.000Z").getUTCDay(),
        },
        orderBy: [{ openTime: "asc" }],
      }),
    ]);

    const onlineGuestsBooked = reservations
      .filter((item) => item.source === "ONLINE")
      .reduce((sum, item) => sum + Number(item.partySize || 0), 0);

    const softCap = this.getSoftCapInfo(settings.maxOnlineGuestsPerDay);
    const projectedGuests = onlineGuestsBooked + Number(params.partySize || 0);

    if (softCap.enabled && projectedGuests > softCap.hardLimit) {
      return {
        branchId: params.branchId,
        date: params.date,
        partySize: params.partySize,
        reason: "DAILY_LIMIT_REACHED" as AvailabilityReason,
        summary: {
          businessHoursBlocks: 0,
          candidateTables: tables.length,
          candidateCombinations: 0,
          reservedTables: reservations.filter((r) => !!r.assignedTableId).length,
          reservedCombinations: reservations.filter((r) => !!r.assignedCombinationId).length,
          reservationsCount: reservations.length,
          generatedSlots: 0,
          onlineGuestsBooked,
          onlineGuestsHardLimit: softCap.hardLimit,
        },
        slots: [],
      };
    }

    const blocks = this.buildBusinessHourBlocks(params.date, hours);

    if (blocks.length === 0) {
      return {
        branchId: params.branchId,
        date: params.date,
        partySize: params.partySize,
        reason: "OUTSIDE_BUSINESS_HOURS" as AvailabilityReason,
        summary: {
          businessHoursBlocks: 0,
          candidateTables: tables.length,
          candidateCombinations: 0,
          reservedTables: reservations.filter((r) => !!r.assignedTableId).length,
          reservedCombinations: reservations.filter((r) => !!r.assignedCombinationId).length,
          reservationsCount: reservations.length,
          generatedSlots: 0,
          onlineGuestsBooked,
          onlineGuestsHardLimit: softCap.hardLimit,
        },
        slots: [],
      };
    }

    const slots: any[] = [];
    const step = 30;
    let sawCombinationFailure = false;

    for (const block of blocks) {
      let cursor = new Date(block.start);

      while (this.addMinutes(cursor, duration + buffer) <= block.end) {
        const start = new Date(cursor);
        const end = this.addMinutes(start, duration + buffer);
        const blocked = new Set<string>();

        for (const r of reservations) {
          const rStart = new Date(r.startAt);
          const rEnd = this.addMinutes(new Date(r.endAt), buffer);

          if (!this.overlaps(start, end, rStart, rEnd)) {
            continue;
          }

          if (r.assignedTableId) {
            blocked.add(r.assignedTableId);
          }

          if (r.assignedCombination?.items) {
            for (const item of r.assignedCombination.items) {
              blocked.add(item.tableId);
            }
          }
        }

        const assignment = await this.reservationsService.canAssignTables({
          branchId: params.branchId,
          partySize: params.partySize,
          startAt: start,
          endAt: this.addMinutes(start, duration),
          requestedZoneId: params.zoneId,
        });

        if (assignment.ok) {
          slots.push({
            time: start.toISOString().slice(11, 16),
            availableTables: [],
          });
        } else if (assignment.freeTablesPoolCount > 0) {
          sawCombinationFailure = true;
        }

        cursor = this.addMinutes(cursor, step);
      }
    }

    const reason: AvailabilityReason | null =
      slots.length > 0
        ? null
        : sawCombinationFailure
          ? "NO_TABLE_COMBINATION"
          : "NO_AVAILABILITY";

    return {
      branchId: params.branchId,
      date: params.date,
      partySize: params.partySize,
      reason,
      summary: {
        businessHoursBlocks: blocks.length,
        candidateTables: tables.length,
        candidateCombinations: 0,
        reservedTables: reservations.filter((r) => !!r.assignedTableId).length,
        reservedCombinations: reservations.filter((r) => !!r.assignedCombinationId).length,
        reservationsCount: reservations.length,
        generatedSlots: slots.length,
        onlineGuestsBooked,
        onlineGuestsHardLimit: softCap.hardLimit,
      },
      slots,
    };
  }
}