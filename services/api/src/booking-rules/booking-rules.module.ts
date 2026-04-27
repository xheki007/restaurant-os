import { Global, Module } from "@nestjs/common";
import { BookingRulesService } from "./booking-rules.service";

@Global()
@Module({
  providers: [BookingRulesService],
  exports: [BookingRulesService],
})
export class BookingRulesModule {}