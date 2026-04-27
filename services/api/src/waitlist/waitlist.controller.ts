import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { WaitlistService } from "./waitlist.service";

@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get()
  findAll() {
    return this.waitlistService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.waitlistService.findById(id);
  }

  @Post()
  create(
    @Body()
    body: {
      tenantId: string;
      branchId: string;
      guestId: string;
      partySize: number;
      requestedDate: string;
      requestedStartAt?: string;
      requestedZoneId?: string;
      note?: string;
    },
  ) {
    return this.waitlistService.create(body);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body()
    body: {
      status: "WAITLISTED" | "PENDING" | "CONFIRMED" | "CANCELLED" | "NO_SHOW";
      note?: string;
    },
  ) {
    return this.waitlistService.updateStatus(id, body);
  }

  @Patch(":id/confirm-promotion")
  confirmPromotion(@Param("id") id: string) {
    return this.waitlistService.confirmPromotion(id);
  }

  @Patch(":id/expire-promotion")
  expirePromotion(@Param("id") id: string) {
    return this.waitlistService.expirePromotion(id);
  }

  @Patch(":id/expire-and-retry")
  expireAndRetry(@Param("id") id: string) {
    return this.waitlistService.expirePromotionAndRetry(id);
  }
}