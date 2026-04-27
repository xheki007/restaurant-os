import { Module } from "@nestjs/common";
import { WaitlistService } from "./waitlist.service";
import { WaitlistController } from "./waitlist.controller";
import { WaitlistExpirationProcessor } from "./waitlist-expiration.processor";

@Module({
  controllers: [WaitlistController],
  providers: [WaitlistService, WaitlistExpirationProcessor],
  exports: [WaitlistService],
})
export class WaitlistModule {}