import { Controller, Get, Query } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("insights")
  async insights(
    @Query("tenantId") tenantId: string,
    @Query("branchId") branchId: string,
    @Query("date") date?: string,
    @Query("locale") locale?: string,
  ) {
    return this.aiService.buildInsights({
      tenantId,
      branchId,
      date,
      locale,
    });
  }
}
