import { Controller, Get, Query } from "@nestjs/common";
import { AvailabilityService } from "./availability.service";

@Controller("availability")
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  getAvailability(
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
}