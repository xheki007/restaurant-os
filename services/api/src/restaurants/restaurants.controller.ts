import { Controller, Get, Param } from "@nestjs/common";
import { RestaurantsService } from "./restaurants.service";

@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.restaurantsService.findById(id);
  }
}