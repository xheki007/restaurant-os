import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.guest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        tenant: true,
        profile: true,
        tagMaps: {
          include: {
            tag: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
        reservations: {
          orderBy: {
            createdAt: "desc",
          },
        },
        waitlistEntries: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.guest.findUnique({
      where: { id },
      include: {
        tenant: true,
        profile: true,
        tagMaps: {
          include: {
            tag: true,
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
        reservations: {
          orderBy: {
            createdAt: "desc",
          },
        },
        waitlistEntries: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  }

  async create(data: {
    tenantId: string;
    firstName: string;
    lastName?: string;
    fullName: string;
    phone?: string;
    email?: string;
    birthDate?: string;
    preferredLanguage?: string;
    marketingOptIn?: boolean;
  }) {
    return this.prisma.guest.create({
      data: {
        tenantId: data.tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        preferredLanguage: data.preferredLanguage,
        marketingOptIn: data.marketingOptIn ?? false,
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      phone?: string;
      email?: string;
      birthDate?: string | null;
      preferredLanguage?: string;
      marketingOptIn?: boolean;
    },
  ) {
    return this.prisma.guest.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        birthDate:
          data.birthDate === null
            ? null
            : data.birthDate
              ? new Date(data.birthDate)
              : undefined,
        preferredLanguage: data.preferredLanguage,
        marketingOptIn: data.marketingOptIn,
      },
    });
  }
}