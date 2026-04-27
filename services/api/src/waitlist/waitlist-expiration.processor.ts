import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { WaitlistService } from "./waitlist.service";

@Injectable()
export class WaitlistExpirationProcessor {
  private readonly logger = new Logger(WaitlistExpirationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waitlistService: WaitlistService,
  ) {}

  @Cron("*/1 * * * *")
  async handleExpiredPromotions() {
    const now = new Date();

    const expiredEntries = await this.prisma.waitlistEntry.findMany({
      where: {
        status: "PENDING",
        promotionExpiresAt: {
          lte: now,
        },
        promotedReservationId: {
          not: null,
        },
      },
      orderBy: {
        promotionExpiresAt: "asc",
      },
      select: {
        id: true,
      },
    });

    if (expiredEntries.length === 0) {
      return;
    }

    this.logger.log(
      `Found ${expiredEntries.length} expired waitlist promotion(s) to process.`,
    );

    for (const entry of expiredEntries) {
      try {
        const result = await this.waitlistService.expirePromotionAndRetry(entry.id);

        this.logger.log(
          `Processed expired waitlist entry ${entry.id}: ${JSON.stringify(result)}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed processing expired waitlist entry ${entry.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }
  }
}