import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { LayoutLabelsService } from "./layout-labels.service";

@Controller("layout-labels")
export class LayoutLabelsController {
  constructor(private readonly service: LayoutLabelsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(
    @Body()
    body: {
      tenantId: string;
      branchId: string;
      floorPlanId: string;
      text: string;
      posX: number;
      posY: number;
      color?: string;
      fontSize?: number;
    },
  ) {
    return this.service.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      text?: string;
      posX?: number;
      posY?: number;
      color?: string;
      fontSize?: number;
    },
  ) {
    return this.service.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
