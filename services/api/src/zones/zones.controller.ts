import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ZonesService } from "./zones.service";

@Controller("zones")
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  findAll(
    @Query("tenantId") tenantId?: string,
    @Query("branchId") branchId?: string,
    @Query("floorPlanId") floorPlanId?: string,
    @Query("isActive") isActive?: string
  ) {
    return this.zonesService.findAll({
      tenantId,
      branchId,
      floorPlanId,
      isActive
    });
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.zonesService.findById(id);
  }

  @Post()
  create(
    @Body()
    body: {
      tenantId: string;
      branchId: string;
      floorPlanId: string;
      name: string;
      code: string;
      type: string;
      color?: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return this.zonesService.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      floorPlanId?: string;
      name?: string;
      code?: string;
      type?: string;
      color?: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return this.zonesService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.zonesService.remove(id);
  }
}
