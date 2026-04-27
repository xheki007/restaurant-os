// PATH: C:\restaurant-os\services\api\src\reservations\dto\query-reservations.dto.ts

import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryReservationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn([
    "PENDING",
    "CONFIRMED",
    "SEATED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
    "WAITLISTED",
  ])
  status?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  guestSearch?: string;
}