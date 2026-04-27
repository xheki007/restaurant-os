import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async processPending() {
    const now = new Date();

    const items = await this.prisma.reviewRequest.findMany({
      where: {
        status: "PENDING",
        sendAt: {
          lte: now,
        },
      },
      take: 20,
      orderBy: {
        sendAt: "asc",
      },
      include: {
        guest: true,
        reservation: true,
        branch: {
          include: {
            restaurant: true,
            settings: true,
          },
        },
      },
    });

    if (items.length === 0) {
      return 0;
    }

    this.logger.log("pending review requests: " + items.length);

    let processed = 0;

    for (const item of items) {
      try {
        await this.prisma.reviewRequest.update({
          where: { id: item.id },
          data: {
            status: "PROCESSING",
            errorMessage: null,
          },
        });

        const restaurantName =
          item.branch?.restaurant?.name ||
          item.branch?.name ||
          "Restaurant";

        const googleReviewLink =
          item.branch?.settings?.googleReviewLink?.trim() ||
          process.env.GOOGLE_REVIEW_LINK?.trim() ||
          "";

        if (!googleReviewLink) {
          throw new Error("Google review link is missing for this branch");
        }

        const guestPhone = String(item.guest?.phone || "").trim();

        if (!guestPhone) {
          throw new Error("Guest phone is missing. WhatsApp review request cannot be sent.");
        }

        const privateFeedbackLink =
          (process.env.PUBLIC_FEEDBACK_BASE_URL || "").trim()
            ? `${process.env.PUBLIC_FEEDBACK_BASE_URL}/feedback/review/${item.id}`
            : null;

        const deliveryResults: Record<string, unknown> = {};

        deliveryResults.whatsapp = await this.notificationsService.sendReviewWhatsApp({
          to: guestPhone,
          guestName: item.guestName,
          restaurantName,
          reviewLink: googleReviewLink,
          privateFeedbackLink,
        });

        await this.prisma.reviewRequest.update({
          where: { id: item.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            errorMessage: JSON.stringify(deliveryResults),
          },
        });

        processed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        this.logger.error("review request failed: " + message);

        await this.prisma.reviewRequest.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            errorMessage: message,
          },
        });
      }
    }

    return processed;
  }
}