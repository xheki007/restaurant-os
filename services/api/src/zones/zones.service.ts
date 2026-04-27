import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    tenantId?: string;
    branchId?: string;
    floorPlanId?: string;
    isActive?: string | boolean;
  }) {
    const where: any = {};

    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.floorPlanId) {
      where.floorPlanId = filters.floorPlanId;
    }

    if (typeof filters?.isActive === "boolean") {
      where.isActive = filters.isActive;
    }

    if (filters?.isActive === "true") {
      where.isActive = true;
    }

    if (filters?.isActive === "false") {
      where.isActive = false;
    }

    return this.prisma.zone.findMany({
      where,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" }
      ],
      include: {
        tenant: true,
        branch: true,
        floorPlan: true,
        availabilityRules: {
          orderBy: {
            createdAt: "asc"
          }
        },
        tables: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
  }

  async findById(id: string) {
    return this.prisma.zone.findUnique({
      where: { id },
      include: {
        tenant: true,
        branch: true,
        floorPlan: true,
        availabilityRules: {
          orderBy: {
            createdAt: "asc"
          }
        },
        tables: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
  }

  async create(data: {
    tenantId: string;
    branchId: string;
    floorPlanId: string;
    name: string;
    code: string;
    type: string;
    color?: string;
    posX?: number;
    posY?: number;
    width?: number;
    height?: number;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    return this.prisma.zone.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        floorPlanId: data.floorPlanId,
        name: data.name,
        code: data.code,
        type: data.type as any,
        color: data.color ?? "#2563EB",
        posX: data.posX ?? 0,
        posY: data.posY ?? 0,
        width: data.width ?? 600,
        height: data.height ?? 400,
        sortOrder: data.sortOrder ?? 1,
        isActive: data.isActive ?? true
      },
      include: {
        tenant: true,
        branch: true,
        floorPlan: true,
        availabilityRules: {
          orderBy: {
            createdAt: "asc"
          }
        },
        tables: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
  }

  async update(
    id: string,
    data: {
      floorPlanId?: string;
      name?: string;
      code?: string;
      type?: string;
      color?: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    const existing = await this.prisma.zone.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existing) {
      throw new NotFoundException("Zone not found");
    }

    return this.prisma.zone.update({
      where: { id },
      data: {
        floorPlanId: data.floorPlanId,
        name: data.name,
        code: data.code,
        type: data.type as any,
        color: data.color,
        posX: data.posX,
        posY: data.posY,
        width: data.width,
        height: data.height,
        sortOrder: data.sortOrder,
        isActive: data.isActive
      },
      include: {
        tenant: true,
        branch: true,
        floorPlan: true,
        availabilityRules: {
          orderBy: {
            createdAt: "asc"
          }
        },
        tables: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        tables: {
          select: { id: true }
        }
      }
    });

    if (!existing) {
      throw new NotFoundException("Zone not found");
    }

    if (existing.tables.length > 0) {
      throw new Error("Cannot delete zone with existing tables");
    }

    return this.prisma.zone.delete({
      where: { id }
    });
  }
}
