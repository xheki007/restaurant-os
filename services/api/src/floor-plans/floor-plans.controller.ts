import { Controller, Get, Param, Query } from "@nestjs/common";
import { FloorPlansService } from "./floor-plans.service";

@Controller("floor-plans")
export class FloorPlansController {
  constructor(private readonly floorPlansService: FloorPlansService) {}

  @Get()
  findAll(
    @Query("tenantId") tenantId?: string,
    @Query("branchId") branchId?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.floorPlansService.findAll({
      tenantId,
      branchId,
      isActive,
    });
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.floorPlansService.findById(id);
  }
}