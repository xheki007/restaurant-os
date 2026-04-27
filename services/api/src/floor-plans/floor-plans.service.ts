import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FloorPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    tenantId?: string;
    branchId?: string;
    isActive?: string | boolean;
  }) {
    const where: any = {};

    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (typeof filters?.isActive === "boolean") {
      where.isActive = filters.isActive;
    } else if (typeof filters?.isActive === "string" && filters.isActive.trim() !== "") {
      where.isActive = filters.isActive.toLowerCase() === "true";
    }

    return this.prisma.floorPlan.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: true,
        branch: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.floorPlan.findUnique({
      where: { id },
      include: {
        tenant: true,
        branch: true,
        zones: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        tables: {
          orderBy: {
            code: "asc",
          },
        },
      },
    });
  }
}