import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { GuestsService } from "./guests.service";

@Controller("guests")
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Get()
  findAll() {
    return this.guestsService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.guestsService.findById(id);
  }

  @Post()
  create(
    @Body()
    body: {
      tenantId: string;
      firstName: string;
      lastName?: string;
      fullName: string;
      phone?: string;
      email?: string;
      birthDate?: string;
      preferredLanguage?: string;
      marketingOptIn?: boolean;
    },
  ) {
    return this.guestsService.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      phone?: string;
      email?: string;
      birthDate?: string | null;
      preferredLanguage?: string;
      marketingOptIn?: boolean;
    },
  ) {
    return this.guestsService.update(id, body);
  }
}