import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "restaurant-os-api",
    };
  }

  @Get("db")
  async getDatabaseHealth() {
    const tenantCount = await this.prisma.tenant.count();

    return {
      status: "ok",
      database: "connected",
      tenantCount,
    };
  }
}