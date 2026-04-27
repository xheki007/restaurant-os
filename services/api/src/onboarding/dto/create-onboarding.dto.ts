export class CreateOnboardingDto {
  tenantName!: string;
  tenantSlug!: string;
  timezone!: string;
  defaultLanguage!: string;
  currency!: string;

  restaurantName!: string;
  legalName?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;

  branchName!: string;
  branchCode!: string;
  addressLine1!: string;
  addressLine2?: string;
  city!: string;
  postalCode?: string;
  country!: string;
  branchPhone?: string;
  branchEmail?: string;

  defaultReservationDurationMin?: number;
  maxPartySize?: number;
  allowOnlineBooking?: boolean;
  allowWalkIns?: boolean;
  allowPhoneReservations?: boolean;
  requireGuestPhone?: boolean;
  requireGuestEmail?: boolean;
  reservationLeadTimeMin?: number;
  reservationCutoffMin?: number;

  adminFullName!: string;
  adminEmail!: string;
  adminPassword!: string;
}