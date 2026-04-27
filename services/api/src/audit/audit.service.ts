// PATH: C:\restaurant-os\services\api\src\audit\audit.service.ts

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    tenantId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
  }) {
    return this.prisma.securityEvent.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId ?? null,
        type: data.action,
        severity: "LOW",
        message: data.entityId
          ? `${data.entity}:${data.entityId}`
          : data.entity,
        metadata: {
          entity: data.entity,
          entityId: data.entityId ?? null,
          ...((data.metadata ?? {}) || {}),
        },
      },
    });
  }
}