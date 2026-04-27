import { Body, Controller, Post, Get, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReservationsService } from "../reservations/reservations.service";
import { AvailabilityService } from "../availability/availability.service";

@Controller("public/reservations")
export class PublicBookingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationsService: ReservationsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get("availability")
  async getAvailability(
    @Query("branchId") branchId: string,
    @Query("date") date: string,
    @Query("partySize") partySize: string,
    @Query("zoneId") zoneId?: string,
  ) {
    return this.availabilityService.getAvailability({
      branchId,
      date,
      partySize: Number(partySize),
      zoneId,
    });
  }

  @Post()
  async createReservation(@Body() body: any) {
    const {
      tenantId,
      branchId,
      guestName,
      guestPhone,
      guestEmail,
      partySize,
      date,
      time,
      preferredLanguage,
      requestedZoneId,
      occasion,
      guestNote,
    } = body;

    const safeGuestName =
      typeof guestName === "string" && guestName.trim().length > 0
        ? guestName.trim()
        : "Guest";

    const safeGuestPhone =
      typeof guestPhone === "string" ? guestPhone.trim() : "";

    const safeGuestEmail =
      typeof guestEmail === "string" ? guestEmail.trim() : "";

    const nameParts = safeGuestName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? "Guest";
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Online";

    const startAt = new Date(`${date}T${time}:00`);
    const endAt = new Date(startAt.getTime() + 90 * 60000);

    let guest = await this.prisma.guest.findFirst({
      where: {
        tenantId,
        fullName: safeGuestName,
        phone: safeGuestPhone,
      },
    });

    if (!guest) {
      guest = await this.prisma.guest.create({
        data: {
          tenantId,
          firstName,
          lastName,
          fullName: safeGuestName,
          phone: safeGuestPhone,
          email: safeGuestEmail || null,
          preferredLanguage: preferredLanguage ?? "en",
        },
      });
    } else if (
      (safeGuestEmail && guest.email !== safeGuestEmail) ||
      ((preferredLanguage ?? "en") && guest.preferredLanguage !== (preferredLanguage ?? "en"))
    ) {
      guest = await this.prisma.guest.update({
        where: { id: guest.id },
        data: {
          email: safeGuestEmail || guest.email,
          preferredLanguage: preferredLanguage ?? guest.preferredLanguage ?? "en",
        },
      });
    }

    return this.reservationsService.create({
      tenantId,
      branchId,
      guestId: guest.id,
      source: "ONLINE",
      partySize: Number(partySize),
      reservationDate: startAt.toISOString(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      requestedZoneId,
      occasion,
      guestNote,
    });
  }
}
