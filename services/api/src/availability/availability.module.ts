import { Module } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";
import { AvailabilityController } from "./availability.controller";
import { ReservationsModule } from "../reservations/reservations.module";

@Module({
  imports: [ReservationsModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}