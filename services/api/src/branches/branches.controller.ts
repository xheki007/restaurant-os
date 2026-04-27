import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { BranchesService } from "./branches.service";

@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.branchesService.findById(id);
  }

  @Patch(":id/settings")
  updateSettings(
    @Param("id") id: string,
    @Body()
    body: {
      defaultReservationDurationMin?: number;
      tableTurnoverBufferMin?: number;
      maxPartySize?: number;
      totalSeatingCapacity?: number;
      maxOnlineGuestsPerDay?: number | null;
      allowOnlineBooking?: boolean;
      allowWalkIns?: boolean;
      allowPhoneReservations?: boolean;
      allowIndoorOnline?: boolean;
      allowTerraceOnline?: boolean;
      defaultOnlineZoneId?: string | null;
      requireGuestPhone?: boolean;
      requireGuestEmail?: boolean;
      reservationLeadTimeMin?: number;
      reservationCutoffMin?: number;
    },
  ) {
    return this.branchesService.updateSettings(id, body);
  }

  @Patch(":id/business-hours")
  updateBusinessHours(
    @Param("id") id: string,
    @Body()
    body: {
      days: Array<{
        dayOfWeek: number;
        slots: Array<{
          openTime: string;
          closeTime: string;
          serviceType: string;
        }>;
      }>;
    },
  ) {
    return this.branchesService.updateBusinessHours(id, body);
  }
}