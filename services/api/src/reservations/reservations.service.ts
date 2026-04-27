import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { BookingRulesService } from "../booking-rules/booking-rules.service";
import { WaitlistService } from "../waitlist/waitlist.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";

type ReservationSource = "ONLINE" | "WALK_IN" | "PHONE" | "MANUAL";
type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "WAITLISTED";

type TableLike = {
  id: string;
  tenantId: string;
  branchId: string;
  zoneId: string;
  name: string;
  code: string;
  capacityMin: number;
  capacityMax: number;
  posX: number | null;
  posY: number | null;
  width: number | null;
  height: number | null;
  rotation: number | null;
  isActive: boolean;
  zone?: {
    id: string;
    name: string;
    type?: string;
  } | null;
};

type DynamicSelection = {
  tables: TableLike[];
  capacityMin: number;
  capacityMax: number;
  zoneId: string | null;
  score: {
    overflow: number;
    tableCount: number;
    distance: number;
  };
};

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingRules: BookingRulesService,
    private readonly waitlistService: WaitlistService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  private overlaps(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  private tableCenter(table: TableLike) {
    const x = Number(table.posX ?? 0) + Number(table.width ?? 0) / 2;
    const y = Number(table.posY ?? 0) + Number(table.height ?? 0) / 2;
    return { x, y };
  }

  private distanceBetweenTables(a: TableLike, b: TableLike): number {
    const ac = this.tableCenter(a);
    const bc = this.tableCenter(b);
    return Math.hypot(ac.x - bc.x, ac.y - bc.y);
  }

  private totalPairwiseDistance(tables: TableLike[]): number {
    let total = 0;

    for (let i = 0; i < tables.length; i += 1) {
      for (let j = i + 1; j < tables.length; j += 1) {
        total += this.distanceBetweenTables(tables[i], tables[j]);
      }
    }

    return total;
  }

  private compareDynamicSelections(a: DynamicSelection, b: DynamicSelection): number {
    if (a.score.overflow !== b.score.overflow) {
      return a.score.overflow - b.score.overflow;
    }

    if (a.score.tableCount !== b.score.tableCount) {
      return a.score.tableCount - b.score.tableCount;
    }

    if (a.score.distance !== b.score.distance) {
      return a.score.distance - b.score.distance;
    }

    const aNames = a.tables.map((table) => table.name).join("|");
    const bNames = b.tables.map((table) => table.name).join("|");

    return aNames.localeCompare(bNames);
  }

  private findBestDynamicSelection(params: {
    freeTables: TableLike[];
    partySize: number;
    maxTablesToCombine: number;
  }): DynamicSelection | null {
    const { freeTables, partySize, maxTablesToCombine } = params;

    if (freeTables.length === 0 || maxTablesToCombine <= 1) {
      return null;
    }

    const positionedTables = freeTables
      .map((table) => this.toPositionedTable(table))
      .filter((table) => table.isActive !== false && table.safeCapacityMax > 0);

    if (positionedTables.length === 0) {
      return null;
    }

    const rows: Array<{
      zoneId: string | null;
      centerY: number;
      tables: any[];
    }> = [];

    for (const table of positionedTables) {
      const rowTolerance = Math.max(32, table.safeHeight * 0.65);

      const existingRow = rows.find(
        (row) =>
          row.zoneId === table.zoneId &&
          Math.abs(row.centerY - table.centerY) <= rowTolerance,
      );

      if (existingRow) {
        existingRow.tables.push(table);
        existingRow.centerY =
          existingRow.tables.reduce((sum, item) => sum + item.centerY, 0) /
          existingRow.tables.length;
      } else {
        rows.push({
          zoneId: table.zoneId,
          centerY: table.centerY,
          tables: [table],
        });
      }
    }

    let best: DynamicSelection | null = null;

    for (const row of rows) {
      const rowTables = [...row.tables].sort((a, b) => {
        const xCompare = a.left - b.left;

        if (xCompare !== 0) {
          return xCompare;
        }

        return String(a.name || a.code || a.id).localeCompare(String(b.name || b.code || b.id));
      });

      for (let startIndex = 0; startIndex < rowTables.length; startIndex += 1) {
        const current: any[] = [];
        let capacityMin = 0;
        let capacityMax = 0;

        for (
          let index = startIndex;
          index < rowTables.length && current.length < maxTablesToCombine;
          index += 1
        ) {
          const nextTable = rowTables[index];
          const previousTable = current[current.length - 1];

          if (previousTable && !this.isDirectHorizontalNeighbor(previousTable, nextTable)) {
            break;
          }

          current.push(nextTable);
          capacityMin += nextTable.safeCapacityMin;
          capacityMax += nextTable.safeCapacityMax;

          if (current.length > 1 && capacityMax >= partySize) {
            const selection: DynamicSelection = {
              tables: current.map((table) => table.originalTable),
              capacityMin,
              capacityMax,
              zoneId: current[0]?.zoneId ?? null,
              score: {
                overflow: capacityMax - partySize,
                tableCount: current.length,
                distance: current[current.length - 1].right - current[0].left,
              },
            };

            if (!best || this.compareDynamicSelections(selection, best) < 0) {
              best = selection;
            }
          }
        }
      }
    }

    return best;
  }

  private toPositionedTable(table: any) {
    const safeWidth = Math.max(1, Number(table?.width ?? 80) || 80);
    const safeHeight = Math.max(1, Number(table?.height ?? 80) || 80);
    const left = Number(table?.posX ?? 0) || 0;
    const top = Number(table?.posY ?? 0) || 0;

    return {
      originalTable: table,
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
      safeCapacityMin: Math.max(0, Number(table?.capacityMin ?? 0) || 0),
      safeCapacityMax: Math.max(0, Number(table?.capacityMax ?? 0) || 0),
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
  private buildDynamicCombinationName(tables: TableLike[]): string {
    const codePart = tables
      .map((table) => table.code || table.name || table.id)
      .sort((a, b) => a.localeCompare(b))
      .join("+");

    return `AUTO:${codePart}`;
  }

  private async buildReservationScope(tenantId: string, userId?: string) {
    if (!userId) {
      return { tenantId };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: {
          tenantId,
        },
      },
      select: {
        branchId: true,
      },
    });

    if (userRoles.length === 0) {
      return {
        tenantId,
        branchId: { in: [] as string[] },
      };
    }

    const hasTenantWideAccess = userRoles.some((x) => x.branchId === null);

    if (hasTenantWideAccess) {
      return { tenantId };
    }

    const allowedBranchIds = [...new Set(
      userRoles
        .map((x) => x.branchId)
        .filter((x): x is string => Boolean(x)),
    )];

    return {
      tenantId,
      branchId: { in: allowedBranchIds },
    };
  }

  async findAll(tenantId?: string, userId?: string, query?: any) {
    const baseWhere = tenantId
      ? await this.buildReservationScope(tenantId, userId)
      : {};

    const page = Math.max(1, Number(query?.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query?.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: any = {
      ...baseWhere,
    };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.dateFrom || query?.dateTo) {
      where.reservationDate = {};

      if (query?.dateFrom) {
        where.reservationDate.gte = new Date(query.dateFrom);
      }

      if (query?.dateTo) {
        where.reservationDate.lte = new Date(query.dateTo);
      }
    }

    if (query?.guestSearch) {
      where.guest = {
        OR: [
          {
            fullName: {
              contains: query.guestSearch,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: query.guestSearch,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query.guestSearch,
              mode: "insensitive",
            },
          },
        ],
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          tenant: true,
          branch: true,
          guest: true,
          requestedZone: true,
          assignedZone: true,
          assignedTable: true,
          assignedCombination: {
            include: {
              items: {
                orderBy: {
                  sortOrder: "asc"
                },
                include: {
                  table: true
                }
              }
            }
          },
          statusHistory: {
            orderBy: {
              createdAt: "desc",
            },
          },
          tagMaps: {
            include: {
              tag: true,
            },
          },
          assignmentLogs: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, tenantId?: string, userId?: string) {
    const scope = tenantId
      ? await this.buildReservationScope(tenantId, userId)
      : {};

    return this.prisma.reservation.findFirst({
      where: {
        id,
        ...scope,
      },
      include: {
        tenant: true,
        branch: true,
        guest: true,
        requestedZone: true,
        assignedZone: true,
        assignedTable: true,
        assignedCombination: {
          include: {
            items: {
              orderBy: {
                sortOrder: "asc"
              },
              include: {
                table: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
        tagMaps: {
          include: {
            tag: true,
          },
        },
        assignmentLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async canAssignTables(params: {
    branchId: string;
    partySize: number;
    startAt: Date;
    endAt: Date;
    requestedZoneId?: string;
  }) {
    const branchSettings = await this.prisma.branchSettings.findUnique({
      where: {
        branchId: params.branchId,
      },
    });

    const tableTurnoverBufferMin =
      branchSettings?.tableTurnoverBufferMin ?? 15;

    const allActiveTables = await this.prisma.restaurantTable.findMany({
      where: {
        branchId: params.branchId,
        isActive: true,
        ...(params.requestedZoneId ? { zoneId: params.requestedZoneId } : {}),
      },
      include: {
        zone: true,
      },
      orderBy: [
        { zoneId: "asc" },
        { posX: "asc" },
        { posY: "asc" },
        { createdAt: "asc" },
      ],
    });

    const candidateTables = allActiveTables.filter(
      (table) =>
        table.capacityMin <= params.partySize &&
        table.capacityMax >= params.partySize,
    );

    const candidateCombinations = await this.prisma.tableCombination.findMany({
      where: {
        branchId: params.branchId,
        isActive: true,
        capacityMin: {
          lte: params.partySize,
        },
        capacityMax: {
          gte: params.partySize,
        },
      },
      include: {
        items: {
          orderBy: {
            sortOrder: "asc"
          },
          include: {
            table: {
              include: {
                zone: true,
              },
            }
          }
        }
      },
      orderBy: [
        { capacityMax: "asc" },
        { createdAt: "asc" }
      ]
    });

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        branchId: params.branchId,
        status: {
          in: ["PENDING", "CONFIRMED", "SEATED"],
        },
        OR: [
          {
            startAt: {
              lt: this.addMinutes(params.endAt, tableTurnoverBufferMin),
            },
            endAt: {
              gt: this.addMinutes(params.startAt, -tableTurnoverBufferMin),
            },
          },
        ],
      },
      include: {
        assignedCombination: {
          include: {
            items: true,
          },
        },
      },
    });

    const blockedTableIds = new Set<string>();

    for (const reservation of existingReservations) {
      const reservationStart = new Date(reservation.startAt);
      const reservationEndWithBuffer = this.addMinutes(
        new Date(reservation.endAt),
        tableTurnoverBufferMin,
      );

      const overlaps = this.overlaps(
        params.startAt,
        params.endAt,
        reservationStart,
        reservationEndWithBuffer,
      );

      if (!overlaps) {
        continue;
      }

      if (reservation.assignedTableId) {
        blockedTableIds.add(reservation.assignedTableId);
      }

      if (reservation.assignedCombination?.items?.length) {
        for (const item of reservation.assignedCombination.items) {
          blockedTableIds.add(item.tableId);
        }
      }
    }

    const freeTablesPool = allActiveTables.filter(
      (table) => !blockedTableIds.has(table.id),
    );

    const freeTable = candidateTables.find(
      (table) => !blockedTableIds.has(table.id),
    );

    const freeCombination = !freeTable
      ? candidateCombinations.find((combination) => {
          if (combination.items.length === 0) {
            return false;
          }

          const combinationTables = combination.items
            .map((item) => item.table)
            .filter(Boolean);

          if (!this.isPhysicallyValidTableSequence(combinationTables)) {
            return false;
          }

          const sameRequestedZone =
            !params.requestedZoneId ||
            combination.items.every(
              (item) => item.table.zoneId === params.requestedZoneId,
            );

          if (!sameRequestedZone) {
            return false;
          }

          return combination.items.every(
            (item) => !blockedTableIds.has(item.tableId),
          );
        })
      : null;

    const dynamicSelection =
      !freeTable && !freeCombination
        ? this.findBestDynamicSelection({
            freeTables: freeTablesPool,
            partySize: params.partySize,
            maxTablesToCombine: 4,
          })
        : null;

    return {
      ok: !!(freeTable || freeCombination || dynamicSelection),
      freeTable,
      freeCombination,
      dynamicSelection,
      blockedTableIds: Array.from(blockedTableIds),
      freeTablesPoolCount: freeTablesPool.length,
      candidateTablesCount: candidateTables.length,
      candidateCombinationsCount: candidateCombinations.length,
    };
  }
  async create(data: {
    tenantId: string;
    userId?: string;
    branchId: string;
    guestId: string;
    source: ReservationSource;
    partySize: number;
    reservationDate: string;
    startAt: string;
    endAt: string;
    requestedZoneId?: string;
    occasion?: string;
    internalNote?: string;
    guestNote?: string;
    isWalkIn?: boolean;
    isPhoneReservation?: boolean;
  }) {
    if (data.isWalkIn !== true) {
      await this.bookingRules.validateReservationCreation({
        branchId: data.branchId,
        partySize: data.partySize,
        startAt: data.startAt,
      });
    }

    const branchSettings = await this.prisma.branchSettings.findUnique({
      where: {
        branchId: data.branchId,
      },
    });

    const tableTurnoverBufferMin =
      branchSettings?.tableTurnoverBufferMin ?? 15;

    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);
    const reservationDate = new Date(data.reservationDate);

    if (!(startAt < endAt)) {
      throw new BadRequestException("Reservation startAt must be before endAt");
    }

    const allActiveTables = await this.prisma.restaurantTable.findMany({
      where: {
        branchId: data.branchId,
        isActive: true,
        ...(data.requestedZoneId ? { zoneId: data.requestedZoneId } : {}),
      },
      include: {
        zone: true,
      },
      orderBy: [
        { zoneId: "asc" },
        { posX: "asc" },
        { posY: "asc" },
        { createdAt: "asc" },
      ],
    });

    const candidateTables = allActiveTables.filter(
      (table) =>
        table.capacityMin <= data.partySize &&
        table.capacityMax >= data.partySize,
    );

    const candidateCombinations = await this.prisma.tableCombination.findMany({
      where: {
        branchId: data.branchId,
        isActive: true,
        capacityMin: {
          lte: data.partySize,
        },
        capacityMax: {
          gte: data.partySize,
        },
      },
      include: {
        items: {
          orderBy: {
            sortOrder: "asc"
          },
          include: {
            table: {
              include: {
                zone: true,
              },
            }
          }
        }
      },
      orderBy: [
        { capacityMax: "asc" },
        { createdAt: "asc" }
      ]
    });

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        branchId: data.branchId,
        status: {
          in: ["PENDING", "CONFIRMED", "SEATED"],
        },
        OR: [
          {
            startAt: {
              lt: this.addMinutes(endAt, tableTurnoverBufferMin),
            },
            endAt: {
              gt: this.addMinutes(startAt, -tableTurnoverBufferMin),
            },
          },
        ],
      },
      include: {
        assignedCombination: {
          include: {
            items: true,
          },
        },
      },
    });

    const blockedTableIds = new Set<string>();

    for (const reservation of existingReservations) {
      const reservationStart = new Date(reservation.startAt);
      const reservationEndWithBuffer = this.addMinutes(
        new Date(reservation.endAt),
        tableTurnoverBufferMin,
      );

      const overlaps = this.overlaps(
        startAt,
        endAt,
        reservationStart,
        reservationEndWithBuffer,
      );

      if (!overlaps) {
        continue;
      }

      if (reservation.assignedTableId) {
        blockedTableIds.add(reservation.assignedTableId);
      }

      if (reservation.assignedCombination?.items?.length) {
        for (const item of reservation.assignedCombination.items) {
          blockedTableIds.add(item.tableId);
        }
      }
    }

    const freeTablesPool = allActiveTables.filter((table) => !blockedTableIds.has(table.id));

    const freeTable = candidateTables.find((table) => !blockedTableIds.has(table.id));

    const freeCombination = !freeTable
      ? candidateCombinations.find((combination) => {
          if (combination.items.length === 0) {
            return false;
          }

          const combinationTables = combination.items
            .map((item) => item.table)
            .filter(Boolean);

          if (!this.isPhysicallyValidTableSequence(combinationTables)) {
            return false;
          }

          const sameRequestedZone =
            !data.requestedZoneId ||
            combination.items.every((item) => item.table.zoneId === data.requestedZoneId);

          if (!sameRequestedZone) {
            return false;
          }

          return combination.items.every((item) => !blockedTableIds.has(item.tableId));
        })
      : null;

    const dynamicSelection =
      !freeTable && !freeCombination
        ? this.findBestDynamicSelection({
            freeTables: freeTablesPool,
            partySize: data.partySize,
            maxTablesToCombine: 4,
          })
        : null;

    if (!freeTable && !freeCombination && !dynamicSelection) {
      throw new BadRequestException("No available table or combination for the selected time and party size");
    }

    const isWalkIn = data.isWalkIn === true;

    const confirmationCode =
      "RSV-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    const createdReservation = await this.prisma.$transaction(async (tx) => {
      let assignedTableId: string | null = null;
      let assignedCombinationId: string | null = null;
      let assignedZoneId: string | null = null;
      let assignmentReason = "Auto-assigned table on reservation creation";

      if (freeTable) {
        assignedTableId = freeTable.id;
        assignedZoneId = freeTable.zoneId;
      } else if (freeCombination) {
        assignedCombinationId = freeCombination.id;
        assignedZoneId = freeCombination.items[0]?.table?.zoneId ?? null;
        assignmentReason = "Auto-assigned predefined combination on reservation creation";
      } else if (dynamicSelection) {
        const dynamicName = this.buildDynamicCombinationName(dynamicSelection.tables);

        const existingDynamicCombination = await tx.tableCombination.findFirst({
          where: {
            tenantId: data.tenantId,
            branchId: data.branchId,
            name: dynamicName,
          },
          include: {
            items: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        });

        let ensuredCombinationId: string;

        if (existingDynamicCombination) {
          const existingIds = existingDynamicCombination.items
            .map((item) => item.tableId)
            .sort((a, b) => a.localeCompare(b));

          const desiredIds = dynamicSelection.tables
            .map((table) => table.id)
            .sort((a, b) => a.localeCompare(b));

          const sameSet =
            existingIds.length === desiredIds.length &&
            existingIds.every((value, index) => value === desiredIds[index]);

          if (sameSet) {
            ensuredCombinationId = existingDynamicCombination.id;

            await tx.tableCombination.update({
              where: { id: existingDynamicCombination.id },
              data: {
                capacityMin: dynamicSelection.capacityMin,
                capacityMax: dynamicSelection.capacityMax,
                isActive: true,
              },
            });
          } else {
            const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

            const createdDynamicCombination = await tx.tableCombination.create({
              data: {
                tenantId: data.tenantId,
                branchId: data.branchId,
                name: `${dynamicName}#${suffix}`,
                capacityMin: dynamicSelection.capacityMin,
                capacityMax: dynamicSelection.capacityMax,
                isActive: true,
                items: {
                  create: dynamicSelection.tables.map((table, index) => ({
                    tableId: table.id,
                    sortOrder: index,
                  })),
                },
              },
            });

            ensuredCombinationId = createdDynamicCombination.id;
          }
        } else {
          const createdDynamicCombination = await tx.tableCombination.create({
            data: {
              tenantId: data.tenantId,
              branchId: data.branchId,
              name: dynamicName,
              capacityMin: dynamicSelection.capacityMin,
              capacityMax: dynamicSelection.capacityMax,
              isActive: true,
              items: {
                create: dynamicSelection.tables.map((table, index) => ({
                  tableId: table.id,
                  sortOrder: index,
                })),
              },
            },
          });

          ensuredCombinationId = createdDynamicCombination.id;
        }

        assignedCombinationId = ensuredCombinationId;
        assignedZoneId = dynamicSelection.zoneId;
        assignmentReason = "Auto-assigned dynamic proximity combination on reservation creation";
      }

      const reservation = await tx.reservation.create({
        data: {
          tenantId: data.tenantId,
          branchId: data.branchId,
          guestId: data.guestId,
          source: data.source,
          status: "PENDING",
          partySize: data.partySize,
          reservationDate,
          startAt,
          endAt,
          requestedZoneId: data.requestedZoneId,
          assignedZoneId,
          assignedTableId: isWalkIn ? null : assignedTableId,
          assignedCombinationId: isWalkIn ? null : assignedCombinationId,
          occasion: data.occasion,
          internalNote: data.internalNote,
          guestNote: data.guestNote,
          isWalkIn: data.isWalkIn ?? false,
          isPhoneReservation: data.isPhoneReservation ?? false,
          confirmationCode,
        },
      });

      await tx.reservationStatusHistory.create({
        data: {
          tenantId: data.tenantId,
          reservationId: reservation.id,
          oldStatus: null,
          newStatus: "PENDING",
          reason: "Reservation created",
        },
      });

      await tx.reservationAssignmentLog.create({
        data: {
          tenantId: data.tenantId,
          reservationId: reservation.id,
          oldTableId: null,
          newTableId: assignedTableId,
          oldZoneId: null,
          newZoneId: assignedZoneId,
          reason: assignmentReason,
        },
      });

      return tx.reservation.findUnique({
        where: { id: reservation.id },
        include: {
          tenant: true,
          branch: true,
          guest: true,
          requestedZone: true,
          assignedZone: true,
          assignedTable: true,
          assignedCombination: {
            include: {
              items: {
                orderBy: {
                  sortOrder: "asc"
                },
                include: {
                  table: true
                }
              }
            }
          },
          statusHistory: {
            orderBy: {
              createdAt: "desc",
            },
          },
          tagMaps: {
            include: {
              tag: true,
            },
          },
          assignmentLogs: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
    });

    await this.auditService.log({
      tenantId: data.tenantId,
      userId: data.userId,
      action: "reservation.created",
      entity: "reservation",
      entityId: createdReservation?.id,
      metadata: {
        branchId: data.branchId,
        guestId: data.guestId,
        source: data.source,
        partySize: data.partySize,
        reservationDate: reservationDate.toISOString(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        assignedTableId: createdReservation?.assignedTableId ?? null,
        assignedZoneId: createdReservation?.assignedZoneId ?? null,
        assignedCombinationId: createdReservation?.assignedCombinationId ?? null,
      },
    });

    if (createdReservation?.guest) {
      const notification = await this.notificationsService.sendReservationCreated({
        guestPhone: createdReservation.guest.phone,
        guestName: createdReservation.guest.fullName,
        confirmationCode: createdReservation.confirmationCode,
        startAt: createdReservation.startAt.toISOString(),
      });

      return {
        reservation: createdReservation,
        notification,
      };
    }

    return {
      reservation: createdReservation,
      notification: {
        ok: false,
        skipped: true,
        reason: "Guest not loaded for notification",
      },
    };
  }

  async createWalkIn(data: {
    tenantId: string;
    userId?: string;
    branchId: string;
    tableId: string;
    partySize: number;
    startAt?: string;
    durationMinutes?: number;
  }) {
    const tenantId = String(data.tenantId || "").trim();
    const branchId = String(data.branchId || "").trim();
    const tableId = String(data.tableId || "").trim();
    const partySize = Math.max(1, Number(data.partySize || 1));

    if (!tenantId) {
      throw new BadRequestException("tenantId is required for walk-in");
    }

    if (!branchId) {
      throw new BadRequestException("branchId is required for walk-in");
    }

    if (!tableId) {
      throw new BadRequestException("tableId is required for walk-in");
    }

    const branchSettings = await this.prisma.branchSettings.findUnique({
      where: {
        branchId,
      },
    });

    if (branchSettings?.allowWalkIns === false) {
      throw new BadRequestException("Walk-ins are disabled for this branch");
    }

    const table = await this.prisma.restaurantTable.findFirst({
      where: {
        id: tableId,
        tenantId,
        branchId,
        isActive: true,
      },
    });

    if (!table) {
      throw new BadRequestException("Selected table is not valid for this branch");
    }

    if (partySize > Number(table.capacityMax || 0)) {
      throw new BadRequestException("Walk-in party size exceeds selected table capacity");
    }

    const startAt = data.startAt
      ? new Date(data.startAt)
      : new Date(Date.now() + 5 * 60000);

    startAt.setSeconds(0, 0);

    const durationMinutes = Math.max(
      15,
      Number(
        data.durationMinutes ??
          branchSettings?.defaultReservationDurationMin ??
          90,
      ),
    );

    const endAt = this.addMinutes(startAt, durationMinutes);
    const tableTurnoverBufferMin = Number(
      branchSettings?.tableTurnoverBufferMin ?? 15,
    );

    const combinationLinks = await this.prisma.tableCombinationItem.findMany({
      where: {
        tableId,
      },
      select: {
        combinationId: true,
      },
    });

    const combinationIds = combinationLinks.map((item) => item.combinationId);
    const conflictOr: any[] = [
      {
        assignedTableId: tableId,
      },
    ];

    if (combinationIds.length > 0) {
      conflictOr.push({
        assignedCombinationId: {
          in: combinationIds,
        },
      });
    }

    const conflictingReservation = await this.prisma.reservation.findFirst({
      where: {
        tenantId,
        branchId,
        status: {
          in: ["PENDING", "CONFIRMED", "SEATED"],
        },
        startAt: {
          lt: this.addMinutes(endAt, tableTurnoverBufferMin),
        },
        endAt: {
          gt: this.addMinutes(startAt, -tableTurnoverBufferMin),
        },
        OR: conflictOr,
      },
      select: {
        id: true,
        confirmationCode: true,
      },
    });

    if (conflictingReservation) {
      throw new BadRequestException("Selected table is already occupied or reserved");
    }

    let walkInGuest = await this.prisma.guest.findFirst({
      where: {
        tenantId,
        fullName: "Walk-in Guest",
        phone: null,
      },
      select: {
        id: true,
      },
    });

    if (!walkInGuest) {
      walkInGuest = await this.prisma.guest.create({
        data: {
          tenantId,
          firstName: "Walk-in",
          lastName: "Guest",
          fullName: "Walk-in Guest",
          phone: null,
          email: null,
          preferredLanguage: "en",
          marketingOptIn: false,
        },
        select: {
          id: true,
        },
      });
    }

    const createdResult = await this.create({
      tenantId,
      userId: data.userId,
      branchId,
      guestId: walkInGuest.id,
      source: "WALK_IN",
      partySize,
      reservationDate: startAt.toISOString(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      requestedZoneId: table.zoneId,
      internalNote: "Walk-in created from live floor",
      isWalkIn: true,
      isPhoneReservation: false,
    });

    const reservationId = (createdResult as any)?.reservation?.id;

    if (!reservationId) {
      throw new BadRequestException("Walk-in reservation was not created");
    }

    await this.assignTable({
      reservationId,
      tenantId,
      userId: data.userId,
      assignedTableId: table.id,
      assignedZoneId: table.zoneId,
      assignedCombinationId: null,
      reason: "Walk-in assigned to selected table",
    });

    await this.seat(reservationId, tenantId, "Walk-in seated from live floor");

    return this.findById(reservationId, tenantId, data.userId);
  }
  async changeStatus(data: {
    reservationId: string;
    tenantId: string;
    userId?: string;
    newStatus: ReservationStatus;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findUnique({
        where: { id: data.reservationId },
      });

      if (!existing) {
        throw new NotFoundException("Reservation not found");
      }

      const oldStatus = existing.status;

      const updated = await tx.reservation.update({
        where: { id: data.reservationId },
        data: {
          status: data.newStatus,
          cancelledAt:
            data.newStatus === "CANCELLED" ? new Date() : existing.cancelledAt,
          seatedAt:
            data.newStatus === "SEATED" ? new Date() : existing.seatedAt,
          completedAt:
            data.newStatus === "COMPLETED" ? new Date() : existing.completedAt,
        },
      });

      await tx.reservationStatusHistory.create({
        data: {
          tenantId: data.tenantId,
          reservationId: existing.id,
          oldStatus,
          newStatus: data.newStatus,
          reason: data.reason,
        },
      });

      return { updated, oldStatus };
    }).then(async ({ updated, oldStatus }) => {
      await this.auditService.log({
        tenantId: data.tenantId,
        userId: data.userId,
        action: "reservation.status_changed",
        entity: "reservation",
        entityId: data.reservationId,
        metadata: {
          oldStatus,
          newStatus: data.newStatus,
          reason: data.reason ?? null,
        },
      });

      return updated;
    });
  }

  async cancel(reservationId: string, tenantId: string, reason?: string) {
    const cancelled = await this.changeStatus({
      reservationId,
      tenantId,
      newStatus: "CANCELLED",
      reason: reason ?? "Reservation cancelled",
    });

    const fullCancelled = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        assignedTable: true,
      },
    });

    const cancelNotification = fullCancelled?.guest
      ? await this.notificationsService.sendReservationCancelled({
          guestPhone: fullCancelled.guest.phone,
          guestName: fullCancelled.guest.fullName,
          confirmationCode: fullCancelled.confirmationCode,
        })
      : {
          ok: false,
          skipped: true,
          reason: "Guest not loaded for cancellation notification",
        };

    if (cancelled.assignedTableId && cancelled.assignedZoneId) {
      try {
        const promotion = await this.waitlistService.promoteBestCandidate({
          tenantId,
          branchId: cancelled.branchId,
          tableId: cancelled.assignedTableId,
          zoneId: cancelled.assignedZoneId,
          reservationDate: cancelled.reservationDate.toISOString(),
          startAt: cancelled.startAt.toISOString(),
          endAt: cancelled.endAt.toISOString(),
        });

        let promotionNotification: unknown = {
          ok: false,
          skipped: true,
          reason: "No waitlist promotion happened",
        };

        if ((promotion as any)?.promoted === true) {
          const promotedReservationId = (promotion as any)?.reservation?.id as string | undefined;

          if (promotedReservationId) {
            const promotedReservation = await this.prisma.reservation.findUnique({
              where: { id: promotedReservationId },
              include: {
                guest: true,
                assignedTable: true,
              },
            });

            if (promotedReservation?.guest) {
              promotionNotification =
                await this.notificationsService.sendWaitlistPromoted({
                  guestPhone: promotedReservation.guest.phone,
                  guestName: promotedReservation.guest.fullName,
                  startAt: promotedReservation.startAt.toISOString(),
                  tableName: promotedReservation.assignedTable?.name ?? null,
                });
            }
          }
        }

        return {
          reservation: cancelled,
          cancellationNotification: cancelNotification,
          waitlistPromotion: promotion,
          promotionNotification,
        };
      } catch (error) {
        return {
          reservation: cancelled,
          cancellationNotification: cancelNotification,
          waitlistPromotion: {
            promoted: false,
            reason: error instanceof Error ? error.message : "Promotion failed",
          },
          promotionNotification: {
            ok: false,
            skipped: true,
            reason: "Promotion notification skipped",
          },
        };
      }
    }

    return {
      reservation: cancelled,
      cancellationNotification: cancelNotification,
      waitlistPromotion: {
        promoted: false,
        reason: "Cancelled reservation had no assigned table/zone",
      },
      promotionNotification: {
        ok: false,
        skipped: true,
        reason: "Promotion notification skipped",
      },
    };
  }

  async seat(reservationId: string, tenantId: string, reason?: string) {
    return this.changeStatus({
      reservationId,
      tenantId,
      newStatus: "SEATED",
      reason: reason ?? "Guest seated",
    });
  }

  async complete(reservationId: string, tenantId: string, reason?: string) {
    const completed = await this.changeStatus({
      reservationId,
      tenantId,
      newStatus: "COMPLETED",
      reason: reason ?? "Reservation completed",
    });

    const fullReservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        guest: true,
        branch: {
          include: {
            restaurant: true,
            settings: true,
          },
        },
        tenant: true,
      },
    });

    if (!fullReservation?.guest) {
      return completed;
    }

    const guestPhone = String(fullReservation.guest.phone || "").trim();

    if (!guestPhone) {
      return completed;
    }

    const existingReviewRequest = await this.prisma.reviewRequest.findFirst({
      where: {
        reservationId: fullReservation.id,
      },
      select: {
        id: true,
      },
    });

    if (existingReviewRequest) {
      return completed;
    }

    const reviewDelayMinutes = Math.max(
      0,
      Number(fullReservation.branch?.settings?.reviewDelayMinutes ?? 60),
    );

    await this.prisma.reviewRequest.create({
      data: {
        tenantId: fullReservation.tenantId,
        branchId: fullReservation.branchId,
        reservationId: fullReservation.id,
        guestId: fullReservation.guestId,
        guestEmail: fullReservation.guest.email || "",
        guestName: fullReservation.guest.fullName,
        sendAt: new Date(Date.now() + reviewDelayMinutes * 60000),
        status: "PENDING",
      },
    });

    return completed;
  }

  async assignTable(data: {
    reservationId: string;
    tenantId: string;
    userId?: string;
    assignedTableId?: string | null;
    assignedZoneId?: string | null;
    assignedCombinationId?: string | null;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reservation.findFirst({
        where: {
          id: data.reservationId,
          tenantId: data.tenantId,
        },
      });

      if (!existing) {
        throw new NotFoundException("Reservation not found");
      }

      const wantsTableAssignment =
        data.assignedTableId !== undefined &&
        data.assignedTableId !== null &&
        data.assignedTableId !== "";

      const wantsCombinationAssignment =
        data.assignedCombinationId !== undefined &&
        data.assignedCombinationId !== null &&
        data.assignedCombinationId !== "";

      if (wantsTableAssignment && wantsCombinationAssignment) {
        throw new BadRequestException("Assign either a table or a combination, not both");
      }

      let nextTableId: string | null = existing.assignedTableId;
      let nextCombinationId: string | null = existing.assignedCombinationId;
      let nextZoneId: string | null = existing.assignedZoneId;

      if (wantsTableAssignment) {
        const tableId = data.assignedTableId as string;

        const table = await tx.restaurantTable.findFirst({
          where: {
            id: tableId,
            tenantId: data.tenantId,
            branchId: existing.branchId,
            isActive: true,
          },
        });

        if (!table) {
          throw new BadRequestException("Selected table is not valid for this reservation branch");
        }

        const reservationPartySize = Number(existing.partySize || 0);
        const tableCapacityMin = Number(table.capacityMin || 0);
        const tableCapacityMax = Number(table.capacityMax || 0);

        if (
          reservationPartySize < tableCapacityMin ||
          reservationPartySize > tableCapacityMax
        ) {
          throw new BadRequestException(
            `Reservation party size (${reservationPartySize}) does not fit selected table capacity (${tableCapacityMin}-${tableCapacityMax})`,
          );
        }

        nextTableId = table.id;
        nextCombinationId = null;
        nextZoneId = data.assignedZoneId ?? table.zoneId;
      } else if (wantsCombinationAssignment) {
        const combinationId = data.assignedCombinationId as string;

        const combination: any = await tx.tableCombination.findFirst({
          where: {
            id: combinationId,
            tenantId: data.tenantId,
            branchId: existing.branchId,
            isActive: true,
          },
          include: {
            items: {
              orderBy: {
                sortOrder: "asc",
              },
              include: {
                table: true,
              },
            },
          },
        });

        if (!combination || combination.items.length === 0) {
          throw new BadRequestException("Selected combination is not valid for this reservation branch");
        }

        const reservationPartySize = Number(existing.partySize || 0);
        const combinationCapacityMin = Number(combination.capacityMin || 0);
        const combinationCapacityMax = Number(combination.capacityMax || 0);

        if (
          reservationPartySize < combinationCapacityMin ||
          reservationPartySize > combinationCapacityMax
        ) {
          throw new BadRequestException(
            `Reservation party size (${reservationPartySize}) does not fit selected combination capacity (${combinationCapacityMin}-${combinationCapacityMax})`,
          );
        }

        nextTableId = null;
        nextCombinationId = combination.id;
        nextZoneId = data.assignedZoneId ?? combination.items[0]?.table?.zoneId ?? null;
      } else {
        if (Object.prototype.hasOwnProperty.call(data, "assignedTableId")) {
          nextTableId = data.assignedTableId ?? null;
        }

        if (Object.prototype.hasOwnProperty.call(data, "assignedCombinationId")) {
          nextCombinationId = data.assignedCombinationId ?? null;
        }

        if (Object.prototype.hasOwnProperty.call(data, "assignedZoneId")) {
          nextZoneId = data.assignedZoneId ?? null;
        }
      }

      const updated = await tx.reservation.update({
        where: { id: data.reservationId },
        data: {
          assignedTableId: nextTableId,
          assignedZoneId: nextZoneId,
          assignedCombinationId: nextCombinationId,
        },
      });

      await tx.reservationAssignmentLog.create({
        data: {
          tenantId: data.tenantId,
          reservationId: existing.id,
          oldTableId: existing.assignedTableId,
          newTableId: nextTableId,
          oldZoneId: existing.assignedZoneId,
          newZoneId: nextZoneId,
          reason: data.reason ?? "Manual reassignment",
        },
      });

      return { updated, existing };
    }).then(async ({ updated, existing }) => {
      await this.auditService.log({
        tenantId: data.tenantId,
        userId: data.userId,
        action: "reservation.assigned",
        entity: "reservation",
        entityId: data.reservationId,
        metadata: {
          oldTableId: existing.assignedTableId,
          newTableId: updated.assignedTableId ?? null,
          oldZoneId: existing.assignedZoneId,
          newZoneId: updated.assignedZoneId ?? null,
          previousCombinationId: existing.assignedCombinationId,
          newCombinationId: updated.assignedCombinationId ?? null,
          reason: data.reason ?? "Manual reassignment",
        },
      });

      return updated;
    });
  }
}