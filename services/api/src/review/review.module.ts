import { Module } from "@nestjs/common";
import { ReviewService } from "./review.service";
import { ReviewCron } from "./review.cron";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [ReviewService, ReviewCron],
})
export class ReviewModule {}