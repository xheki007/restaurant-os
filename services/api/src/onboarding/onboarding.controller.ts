import { Body, Controller, Post } from "@nestjs/common";
import { OnboardingService } from "./onboarding.service";
import { CreateOnboardingDto } from "./dto/create-onboarding.dto";

@Controller("onboarding")
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  onboard(@Body() dto: CreateOnboardingDto) {
    return this.onboardingService.onboard(dto);
  }
}