// PATH: C:\restaurant-os\services\api\src\auth\dto\login.dto.ts

import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  tenantSlug: string;
}