import { Module } from "@nestjs/common";
import { TableCombinationsController } from "./table-combinations.controller";
import { TableCombinationsService } from "./table-combinations.service";

@Module({
  controllers: [TableCombinationsController],
  providers: [TableCombinationsService]
})
export class TableCombinationsModule {}
