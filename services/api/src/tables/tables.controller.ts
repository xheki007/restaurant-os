import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { TablesService } from "./tables.service";

@Controller("tables")
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll(
    @Query("tenantId") tenantId?: string,
    @Query("branchId") branchId?: string,
    @Query("zoneId") zoneId?: string,
    @Query("floorPlanId") floorPlanId?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.tablesService.findAll({
      tenantId,
      branchId,
      zoneId,
      floorPlanId,
      isActive,
    });
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.tablesService.findById(id);
  }

  @Post()
  create(
    @Body()
    body: {
      tenantId: string;
      branchId: string;
      zoneId: string;
      floorPlanId: string;
      name: string;
      code: string;
      capacityMin: number;
      capacityMax: number;
      shape: string;
      posX: number;
      posY: number;
      width: number;
      height: number;
      rotation?: number;
      isActive?: boolean;
    },
  ) {
    return this.tablesService.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      zoneId?: string;
      floorPlanId?: string;
      name?: string;
      code?: string;
      capacityMin?: number;
      capacityMax?: number;
      shape?: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
      rotation?: number;
      isActive?: boolean;
    },
  ) {
    return this.tablesService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tablesService.remove(id);
  }
}
