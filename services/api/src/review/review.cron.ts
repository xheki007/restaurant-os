import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ReviewService } from "./review.service";

@Injectable()
export class ReviewCron {
  private readonly logger = new Logger(ReviewCron.name);

  constructor(private readonly reviewService: ReviewService) {}

  @Cron("0 * * * * *")
  async handle() {
    const processed = await this.reviewService.processPending();

    if (processed > 0) {
      this.logger.log(`processed ${processed} review request(s)`);
    }
  }
}