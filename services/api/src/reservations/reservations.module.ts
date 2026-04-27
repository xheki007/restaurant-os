import { Module } from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { ReservationsController } from "./reservations.controller";
import { WaitlistModule } from "../waitlist/waitlist.module";

@Module({
  imports: [WaitlistModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
