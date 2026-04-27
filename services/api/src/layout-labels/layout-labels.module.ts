import { Module } from "@nestjs/common";
import { LayoutLabelsController } from "./layout-labels.controller";
import { LayoutLabelsService } from "./layout-labels.service";

@Module({
  controllers: [LayoutLabelsController],
  providers: [LayoutLabelsService],
})
export class LayoutLabelsModule {}
