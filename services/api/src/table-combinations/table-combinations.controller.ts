import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { TableCombinationsService } from "./table-combinations.service";

@Controller("table-combinations")
export class TableCombinationsController {
  constructor(private readonly tableCombinationsService: TableCombinationsService) {}

  @Get()
  findAll(
    @Query("tenantId") tenantId?: string,
    @Query("branchId") branchId?: string,
    @Query("isActive") isActive?: string
  ) {
    return this.tableCombinationsService.findAll({
      tenantId,
      branchId,
      isActive
    });
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.tableCombinationsService.findById(id);
  }

  @Post()
  create(
    @Body()
    body: {
      tenantId: string;
      branchId: string;
      name: string;
      tableIds: string[];
      isActive?: boolean;
    }
  ) {
    return this.tableCombinationsService.create(body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.tableCombinationsService.remove(id);
  }
}
