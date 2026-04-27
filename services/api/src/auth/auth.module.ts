// PATH: C:\restaurant-os\services\api\src\auth\auth.module.ts

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { PermissionsGuard } from "./permissions.guard";

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt",
    }),
    JwtModule.register({
      secret: "restaurant-os-dev-secret",
      signOptions: {
        expiresIn: "7d",
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionsGuard],
  exports: [AuthService, JwtModule, PassportModule, PermissionsGuard],
})
export class AuthModule {}