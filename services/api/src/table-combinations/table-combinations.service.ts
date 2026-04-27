import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TableCombinationsService {
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
    }

    if (filters?.isActive === "true") {
      where.isActive = true;
    }

    if (filters?.isActive === "false") {
      where.isActive = false;
    }

    return this.prisma.tableCombination.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        tenant: true,
        branch: true,
        items: {
          orderBy: {
            sortOrder: "asc"
          },
          include: {
            table: {
              include: {
                zone: true,
                floorPlan: true
              }
            }
          }
        }
      }
    });
  }

  async findById(id: string) {
    return this.prisma.tableCombination.findUnique({
      where: { id },
      include: {
        tenant: true,
        branch: true,
        items: {
          orderBy: {
            sortOrder: "asc"
          },
          include: {
            table: {
              include: {
                zone: true,
                floorPlan: true
              }
            }
          }
        }
      }
    });
  }

  async create(data: {
    tenantId: string;
    branchId: string;
    name: string;
    tableIds: string[];
    isActive?: boolean;
  }) {
    const normalizedTableIds = Array.from(
      new Set((data.tableIds || []).filter(Boolean))
    );

    if (normalizedTableIds.length < 2) {
      throw new BadRequestException("A combination requires at least 2 tables");
    }

    const tables = await this.prisma.restaurantTable.findMany({
      where: {
        id: {
          in: normalizedTableIds
        }
      },
      include: {
        zone: true,
        floorPlan: true
      }
    });

    if (tables.length !== normalizedTableIds.length) {
      throw new BadRequestException("Some selected tables were not found");
    }

    const invalidTenant = tables.some((table) => table.tenantId !== data.tenantId);
    if (invalidTenant) {
      throw new BadRequestException("All tables must belong to the same tenant");
    }

    const invalidBranch = tables.some((table) => table.branchId !== data.branchId);
    if (invalidBranch) {
      throw new BadRequestException("All tables must belong to the same branch");
    }

    if (!this.isPhysicallyValidTableSequence(tables)) {
      throw new BadRequestException(
        "Selected tables must be in the same zone, same row, and directly adjacent",
      );
    }

    const existingCombinations = await this.prisma.tableCombination.findMany({
      where: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        isActive: true,
      },
      include: {
        items: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    const selectedKey = [...normalizedTableIds].sort().join("|");

    const exactExistingCombination = existingCombinations.find((combination) => {
      const existingKey = combination.items
        .map((item) => item.tableId)
        .filter(Boolean)
        .sort()
        .join("|");

      return existingKey === selectedKey;
    });

    if (exactExistingCombination) {
      return this.findById(exactExistingCombination.id);
    }
    const capacityMin = tables.reduce((sum, table) => sum + table.capacityMin, 0);
    const capacityMax = tables.reduce((sum, table) => sum + table.capacityMax, 0);

    return this.prisma.tableCombination.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        name: data.name,
        capacityMin,
        capacityMax,
        isActive: data.isActive ?? true,
        items: {
          create: normalizedTableIds.map((tableId, index) => ({
            tableId,
            sortOrder: index + 1
          }))
        }
      },
      include: {
        tenant: true,
        branch: true,
        items: {
          orderBy: {
            sortOrder: "asc"
          },
          include: {
            table: {
              include: {
                zone: true,
                floorPlan: true
              }
            }
          }
        }
      }
    });
  }

  private toPositionedTable(table: any) {
    const safeWidth = Math.max(1, Number(table?.width ?? 80) || 80);
    const safeHeight = Math.max(1, Number(table?.height ?? 80) || 80);
    const left = Number(table?.posX ?? 0) || 0;
    const top = Number(table?.posY ?? 0) || 0;

    return {
      id: String(table?.id || ""),
      name: String(table?.name || ""),
      code: String(table?.code || ""),
      zoneId: table?.zoneId ?? null,
      isActive: table?.isActive,
      left,
      top,
      right: left + safeWidth,
      bottom: top + safeHeight,
      centerX: left + safeWidth / 2,
      centerY: top + safeHeight / 2,
      safeWidth,
      safeHeight,
    };
  }

  private isDirectHorizontalNeighbor(leftTable: any, rightTable: any): boolean {
    if ((leftTable.zoneId ?? null) !== (rightTable.zoneId ?? null)) {
      return false;
    }

    const verticalTolerance = Math.max(
      32,
      Math.min(leftTable.safeHeight, rightTable.safeHeight) * 0.65,
    );

    if (Math.abs(leftTable.centerY - rightTable.centerY) > verticalTolerance) {
      return false;
    }

    const horizontalGap = rightTable.left - leftTable.right;

    const maxAllowedGap = Math.max(
      64,
      Math.min(leftTable.safeWidth, rightTable.safeWidth) * 1.25,
    );

    const maxAllowedOverlap =
      Math.min(leftTable.safeWidth, rightTable.safeWidth) * 0.25;

    return horizontalGap >= -maxAllowedOverlap && horizontalGap <= maxAllowedGap;
  }

  private isPhysicallyValidTableSequence(tables: any[]): boolean {
    if (!Array.isArray(tables) || tables.length < 2) {
      return false;
    }

    const positionedTables = tables
      .filter(Boolean)
      .map((table) => this.toPositionedTable(table))
      .filter((table) => table.id && table.isActive !== false);

    if (positionedTables.length !== tables.length) {
      return false;
    }

    const firstZoneId = positionedTables[0]?.zoneId ?? null;

    if (!positionedTables.every((table) => (table.zoneId ?? null) === firstZoneId)) {
      return false;
    }

    const orderedTables = [...positionedTables].sort((a, b) => {
      const xCompare = a.left - b.left;

      if (xCompare !== 0) {
        return xCompare;
      }

      return String(a.name || a.code || a.id).localeCompare(String(b.name || b.code || b.id));
    });

    for (let index = 1; index < orderedTables.length; index += 1) {
      if (!this.isDirectHorizontalNeighbor(orderedTables[index - 1], orderedTables[index])) {
        return false;
      }
    }

    return true;
  }
  async remove(id: string) {
    const existing = await this.prisma.tableCombination.findUnique({
      where: { id },
      include: {
        assignedReservations: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED", "SEATED"]
            }
          }
        }
      }
    });

    if (!existing) {
      throw new NotFoundException("Table combination not found");
    }

    if (existing.assignedReservations.length > 0) {
      throw new BadRequestException(
        "Cannot delete combination with active reservations"
      );
    }

    return this.prisma.tableCombination.delete({
      where: { id }
    });
  }
}