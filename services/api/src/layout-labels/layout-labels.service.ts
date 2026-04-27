import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LayoutLabelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.layoutLabel.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  create(data: {
    tenantId: string;
    branchId: string;
    floorPlanId: string;
    text: string;
    posX: number;
    posY: number;
    color?: string;
    fontSize?: number;
  }) {
    return this.prisma.layoutLabel.create({
      data: {
        tenantId: data.tenantId,
        branchId: data.branchId,
        floorPlanId: data.floorPlanId,
        text: data.text,
        posX: data.posX,
        posY: data.posY,
        color: data.color ?? "#111111",
        fontSize: data.fontSize ?? 22,
      },
    });
  }

  update(
    id: string,
    data: {
      text?: string;
      posX?: number;
      posY?: number;
      color?: string;
      fontSize?: number;
    },
  ) {
    return this.prisma.layoutLabel.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.layoutLabel.delete({
      where: { id },
    });
  }
}
