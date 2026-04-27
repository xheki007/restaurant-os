import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BookingRulesService {
  constructor(private readonly prisma: PrismaService) {}

  private buildUtcDate(dateOnly: string, timeHHmm: string): Date {
    return new Date(`${dateOnly}T${timeHHmm}:00.000Z`);
  }

  async validateRequest(params: {
    branchId: string;
    date: string;
    partySize: number;
  }) {
    const settings = await this.prisma.branchSettings.findUnique({
      where: {
        branchId: params.branchId,
      },
    });

    if (!settings) {
      throw new BadRequestException("Branch settings not found");
    }

    if (!settings.allowOnlineBooking) {
      throw new BadRequestException("Online booking is disabled for this branch");
    }

    if (params.partySize <= 0) {
      throw new BadRequestException("Party size must be greater than zero");
    }

    const now = new Date();
    const requestedDayStart = new Date(`${params.date}T00:00:00.000Z`);

    const leadBoundary = new Date(
      now.getTime() + settings.reservationLeadTimeMin * 60000,
    );

    const todayStr = now.toISOString().slice(0, 10);
    const requestedStr = params.date;
    const isToday = todayStr === requestedStr;

    if (!isToday) {
      if (
        requestedDayStart <
        new Date(leadBoundary.toISOString().slice(0, 10) + "T00:00:00.000Z")
      ) {
        throw new BadRequestException(
          `Booking must respect minimum lead time of ${settings.reservationLeadTimeMin} minutes`,
        );
      }
    }

    return {
      ok: true,
      rules: {
        maxPartySize: settings.maxPartySize,
        reservationLeadTimeMin: settings.reservationLeadTimeMin,
        reservationCutoffMin: settings.reservationCutoffMin,
        defaultReservationDurationMin: settings.defaultReservationDurationMin,
        allowOnlineBooking: settings.allowOnlineBooking,
      },
      availabilityPolicy: {
        exceedsMaxPartySize: params.partySize > settings.maxPartySize,
      },
    };
  }

  async validateReservationCreation(params: {
    branchId: string;
    partySize: number;
    startAt: string;
  }) {
    const settings = await this.prisma.branchSettings.findUnique({
      where: {
        branchId: params.branchId,
      },
    });

    if (!settings) {
      throw new BadRequestException("Branch settings not found");
    }

    if (!settings.allowOnlineBooking) {
      throw new BadRequestException("Online booking is disabled for this branch");
    }

    if (params.partySize <= 0) {
      throw new BadRequestException("Party size must be greater than zero");
    }

    if (params.partySize > settings.maxPartySize) {
      throw new BadRequestException(
        `Party size exceeds max allowed (${settings.maxPartySize})`,
      );
    }

    const requestedStart = new Date(params.startAt);
    const now = new Date();

    const minAllowedStart = new Date(
      now.getTime() + settings.reservationLeadTimeMin * 60000,
    );

    if (requestedStart < minAllowedStart) {
      throw new BadRequestException(
        `Reservation must be created at least ${settings.reservationLeadTimeMin} minutes in advance`,
      );
    }

    const diffMinutes = Math.floor(
      (requestedStart.getTime() - now.getTime()) / 60000,
    );

    if (diffMinutes < settings.reservationCutoffMin) {
      throw new BadRequestException(
        `Reservation is inside cutoff window (${settings.reservationCutoffMin} minutes)`,
      );
    }

    return {
      ok: true,
      rules: {
        maxPartySize: settings.maxPartySize,
        reservationLeadTimeMin: settings.reservationLeadTimeMin,
        reservationCutoffMin: settings.reservationCutoffMin,
        defaultReservationDurationMin: settings.defaultReservationDurationMin,
      },
    };
  }
}