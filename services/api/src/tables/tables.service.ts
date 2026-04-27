import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    tenantId?: string;
    branchId?: string;
    zoneId?: string;
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

    if (filters?.zoneId) {
      where.zoneId = filters.zoneId;
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

    return this.prisma.restaurantTable.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: true,
        branch: true,
        zone: true,
        floorPlan: true,
        combinationItems: {
          include: {
            combination: true,
          },
        },
        stateLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.restaurantTable.findUnique({
      where: { id },
      include: {
        tenant: true,
        branch: true,
        zone: true,
        floorPlan: true,
        combinationItems: {
          include: {
            combination: true,
          },
        },
        stateLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async create(data: {
    tenantId: string;
    branchId: string;
    zoneId: string;
    floorPlanId: string;
    name: string;
    code: string;
    capacityMin: number;
    capacityMax: number;
    shape: string;
    posX: number;
    posY: number;
    width: number;
    height: number;
    rotation?: number;
    isActive?: boolean;
  }) {
    return this.prisma.restaurantTable.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        zoneId: data.zoneId,
        floorPlanId: data.floorPlanId,
        name: data.name,
        code: data.code,
        capacityMin: data.capacityMin,
        capacityMax: data.capacityMax,
        shape: data.shape as any,
        posX: data.posX,
        posY: data.posY,
        width: data.width,
        height: data.height,
        rotation: data.rotation ?? 0,
        isActive: data.isActive ?? true,
      },
      include: {
        tenant: true,
        branch: true,
        zone: true,
        floorPlan: true,
        combinationItems: {
          include: {
            combination: true,
          },
        },
        stateLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      zoneId?: string;
      floorPlanId?: string;
      name?: string;
      code?: string;
      capacityMin?: number;
      capacityMax?: number;
      shape?: string;
      posX?: number;
      posY?: number;
      width?: number;
      height?: number;
      rotation?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.restaurantTable.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Table not found");
    }

    return this.prisma.restaurantTable.update({
      where: { id },
      data: {
        zoneId: data.zoneId,
        floorPlanId: data.floorPlanId,
        name: data.name,
        code: data.code,
        capacityMin: data.capacityMin,
        capacityMax: data.capacityMax,
        shape: data.shape as any,
        posX: data.posX,
        posY: data.posY,
        width: data.width,
        height: data.height,
        rotation: data.rotation,
        isActive: data.isActive,
      },
      include: {
        tenant: true,
        branch: true,
        zone: true,
        floorPlan: true,
        combinationItems: {
          include: {
            combination: true,
          },
        },
        stateLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.restaurantTable.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Table not found");
    }

    return this.prisma.restaurantTable.delete({
      where: { id },
    });
  }
}
