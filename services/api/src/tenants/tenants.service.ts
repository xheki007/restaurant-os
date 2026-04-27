import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }
}