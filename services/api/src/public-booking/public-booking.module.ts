import { Module } from "@nestjs/common";
import { PublicBookingController } from "./public-booking.controller";
import { ReservationsModule } from "../reservations/reservations.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AvailabilityModule } from "../availability/availability.module";

@Module({
  imports: [ReservationsModule, PrismaModule, AvailabilityModule],
  controllers: [PublicBookingController],
})
export class PublicBookingModule {}