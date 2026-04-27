// PATH: C:\restaurant-os\services\api\src\auth\jwt.strategy.ts

import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: "restaurant-os-dev-secret",
    });
  }

  async validate(payload: {
    sub: string;
    tenantId: string;
    tenantSlug: string;
    email: string;
  }) {
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      email: payload.email,
    };
  }
}