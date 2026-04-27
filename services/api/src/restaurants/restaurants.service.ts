import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.restaurant.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        tenant: true,
        branches: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }
}