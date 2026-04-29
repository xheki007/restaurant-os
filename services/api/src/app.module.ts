import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./prisma/prisma.module";
import { TenantsModule } from "./tenants/tenants.module";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { BranchesModule } from "./branches/branches.module";
import { FloorPlansModule } from "./floor-plans/floor-plans.module";
import { ZonesModule } from "./zones/zones.module";
import { TablesModule } from "./tables/tables.module";
import { AvailabilityModule } from "./availability/availability.module";
import { AiModule } from "./ai/ai.module";
import { GuestsModule } from "./guests/guests.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { PublicBookingModule } from "./public-booking/public-booking.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { WaitlistModule } from "./waitlist/waitlist.module";
import { BookingRulesModule } from "./booking-rules/booking-rules.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { LayoutLabelsModule } from "./layout-labels/layout-labels.module";
import { TableCombinationsModule } from "./table-combinations/table-combinations.module";
import { ReviewModule } from "./review/review.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    AuditModule,
    NotificationsModule,
    BookingRulesModule,
    WaitlistModule,
    DashboardModule,
    PublicBookingModule,
    ReservationsModule,
    GuestsModule,
    AvailabilityModule,
    AiModule,
    TablesModule,
    TableCombinationsModule,
    ZonesModule,
    FloorPlansModule,
    BranchesModule,
    RestaurantsModule,
    TenantsModule,
    OnboardingModule,
    LayoutLabelsModule,
    ReviewModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}