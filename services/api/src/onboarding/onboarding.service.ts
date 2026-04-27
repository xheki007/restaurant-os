import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOnboardingDto } from "./dto/create-onboarding.dto";
import * as bcrypt from "bcryptjs";
import { Prisma, ServiceType } from "@prisma/client";

type PermissionSeed = {
  code: string;
  module: string;
  action: string;
  description: string;
};

type RoleTemplate = {
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionCodes: string[];
};

const PERMISSIONS: PermissionSeed[] = [
  { code: "users.create", module: "users", action: "create", description: "Create users" },
  { code: "users.read", module: "users", action: "read", description: "Read users" },
  { code: "users.update", module: "users", action: "update", description: "Update users" },
  { code: "users.delete", module: "users", action: "delete", description: "Delete users" },
  { code: "users.assign_role", module: "users", action: "assign_role", description: "Assign roles to users" },

  { code: "roles.create", module: "roles", action: "create", description: "Create roles" },
  { code: "roles.read", module: "roles", action: "read", description: "Read roles" },
  { code: "roles.update", module: "roles", action: "update", description: "Update roles" },
  { code: "roles.delete", module: "roles", action: "delete", description: "Delete roles" },
  { code: "roles.assign_permissions", module: "roles", action: "assign_permissions", description: "Assign permissions to roles" },

  { code: "reservations.create", module: "reservations", action: "create", description: "Create reservations" },
  { code: "reservations.read", module: "reservations", action: "read", description: "Read reservations" },
  { code: "reservations.update", module: "reservations", action: "update", description: "Update reservations" },
  { code: "reservations.cancel", module: "reservations", action: "cancel", description: "Cancel reservations" },
  { code: "reservations.assign", module: "reservations", action: "assign", description: "Assign reservation seating" },

  { code: "waitlist.read", module: "waitlist", action: "read", description: "Read waitlist entries" },
  { code: "waitlist.manage", module: "waitlist", action: "manage", description: "Manage waitlist entries" },
  { code: "waitlist.promote", module: "waitlist", action: "promote", description: "Promote waitlist entries" },

  { code: "guests.create", module: "guests", action: "create", description: "Create guests" },
  { code: "guests.read", module: "guests", action: "read", description: "Read guests" },
  { code: "guests.update", module: "guests", action: "update", description: "Update guests" },
  { code: "guests.delete", module: "guests", action: "delete", description: "Delete guests" },

  { code: "floorplans.read", module: "floorplans", action: "read", description: "Read floor plans" },
  { code: "floorplans.manage", module: "floorplans", action: "manage", description: "Manage floor plans" },
  { code: "zones.manage", module: "zones", action: "manage", description: "Manage zones" },
  { code: "tables.manage", module: "tables", action: "manage", description: "Manage tables" },

  { code: "branches.read", module: "branches", action: "read", description: "Read branches" },
  { code: "branches.manage", module: "branches", action: "manage", description: "Manage branches" },
  { code: "settings.manage", module: "settings", action: "manage", description: "Manage settings" },

  { code: "reports.read", module: "reports", action: "read", description: "Read reports" },
  { code: "analytics.read", module: "analytics", action: "read", description: "Read analytics" },
  { code: "audit.read", module: "audit", action: "read", description: "Read audit logs" },
  { code: "security.read", module: "security", action: "read", description: "Read security events" },
];

const ALL_PERMISSION_CODES = PERMISSIONS.map((permission) => permission.code);

const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    code: "tenant_owner",
    name: "Tenant Owner",
    description: "Full access across the tenant",
    isSystem: true,
    permissionCodes: ALL_PERMISSION_CODES,
  },
  {
    code: "tenant_admin",
    name: "Tenant Admin",
    description: "Administrative access across the tenant",
    isSystem: true,
    permissionCodes: ALL_PERMISSION_CODES,
  },
  {
    code: "branch_manager",
    name: "Branch Manager",
    description: "Operational branch access",
    isSystem: true,
    permissionCodes: ALL_PERMISSION_CODES,
  },
  {
    code: "host_staff",
    name: "Host Staff",
    description: "Front desk reservation operations",
    isSystem: true,
    permissionCodes: [
      "reservations.create",
      "reservations.read",
      "reservations.update",
      "reservations.cancel",
      "reservations.assign",
      "waitlist.read",
      "waitlist.manage",
      "waitlist.promote",
      "guests.create",
      "guests.read",
      "guests.update",
      "floorplans.read",
      "branches.read",
    ],
  },
  {
    code: "auditor",
    name: "Auditor",
    description: "Read-only audit and reporting access",
    isSystem: true,
    permissionCodes: [
      "users.read",
      "roles.read",
      "reservations.read",
      "waitlist.read",
      "guests.read",
      "floorplans.read",
      "branches.read",
      "reports.read",
      "analytics.read",
      "audit.read",
      "security.read",
    ],
  },
];

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async onboard(data: CreateOnboardingDto) {
    const tenantSlug = this.normalizeSlug(data.tenantSlug || data.tenantName);
    const branchCode = (data.branchCode || "MAIN").trim().toUpperCase();

    if (!tenantSlug) {
      throw new BadRequestException("Tenant slug is required");
    }

    if (!data.adminPassword || data.adminPassword.length < 8) {
      throw new BadRequestException("Admin password must contain at least 8 characters");
    }

    return this.prisma.$transaction(async (tx) => {
      const existingTenant = await tx.tenant.findFirst({
        where: { slug: tenantSlug },
        select: { id: true },
      });

      if (existingTenant) {
        throw new BadRequestException("Tenant slug already exists");
      }

      const existingUser = await tx.user.findFirst({
        where: { email: data.adminEmail },
        select: { id: true },
      });

      if (existingUser) {
        throw new BadRequestException("Admin email already exists");
      }

      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: tenantSlug,
          status: "TRIAL",
          timezone: data.timezone || "Europe/Belgrade",
          defaultLanguage: data.defaultLanguage || "en",
          currency: data.currency || "EUR",
        },
      });

      const restaurant = await tx.restaurant.create({
        data: {
          tenantId: tenant.id,
          name: data.restaurantName,
          legalName: data.legalName ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
          website: data.website ?? null,
          description: data.description ?? null,
        },
      });

      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          restaurantId: restaurant.id,
          name: data.branchName || "Main Branch",
          code: branchCode,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 ?? null,
          city: data.city,
          postalCode: data.postalCode ?? null,
          country: data.country,
          timezone: data.timezone || "Europe/Belgrade",
          currency: data.currency || "EUR",
          phone: data.branchPhone ?? null,
          email: data.branchEmail ?? null,
          isActive: true,
        },
      });

      const branchSettings = await tx.branchSettings.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          defaultReservationDurationMin: data.defaultReservationDurationMin ?? 90,
          tableTurnoverBufferMin: 15,
          maxPartySize: data.maxPartySize ?? 10,
          allowOnlineBooking: data.allowOnlineBooking ?? true,
          allowWalkIns: data.allowWalkIns ?? true,
          allowPhoneReservations: data.allowPhoneReservations ?? true,
          requireGuestPhone: data.requireGuestPhone ?? true,
          requireGuestEmail: data.requireGuestEmail ?? false,
          reservationLeadTimeMin: data.reservationLeadTimeMin ?? 0,
          reservationCutoffMin: data.reservationCutoffMin ?? 0,
          localeJson: Prisma.JsonNull,
          allowIndoorOnline: true,
          allowTerraceOnline: true,
          defaultOnlineZoneId: null,
          maxOnlineGuestsPerDay: 30,
          totalSeatingCapacity: 0,
          emailSenderEmail: null,
          emailSenderName: null,
          googleReviewLink: null,
          logoUrl: null,
          reviewDelayMinutes: 60,
        },
      });

      const businessHours = [
        { dayOfWeek: 1, openTime: "11:00", closeTime: "15:00", serviceType: ServiceType.LUNCH },
        { dayOfWeek: 1, openTime: "18:00", closeTime: "23:00", serviceType: ServiceType.DINNER },
        { dayOfWeek: 2, openTime: "11:00", closeTime: "15:00", serviceType: ServiceType.LUNCH },
        { dayOfWeek: 2, openTime: "18:00", closeTime: "23:00", serviceType: ServiceType.DINNER },
        { dayOfWeek: 3, openTime: "11:00", closeTime: "15:00", serviceType: ServiceType.LUNCH },
        { dayOfWeek: 3, openTime: "18:00", closeTime: "23:00", serviceType: ServiceType.DINNER },
        { dayOfWeek: 4, openTime: "11:00", closeTime: "15:00", serviceType: ServiceType.LUNCH },
        { dayOfWeek: 4, openTime: "18:00", closeTime: "23:00", serviceType: ServiceType.DINNER },
        { dayOfWeek: 5, openTime: "11:00", closeTime: "15:00", serviceType: ServiceType.LUNCH },
        { dayOfWeek: 5, openTime: "18:00", closeTime: "23:00", serviceType: ServiceType.DINNER },
        { dayOfWeek: 6, openTime: "11:00", closeTime: "15:00", serviceType: ServiceType.LUNCH },
        { dayOfWeek: 6, openTime: "18:00", closeTime: "23:00", serviceType: ServiceType.DINNER },
        { dayOfWeek: 7, openTime: "11:00", closeTime: "15:00", serviceType: ServiceType.LUNCH },
      ];

      for (const item of businessHours) {
        await tx.businessHour.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            dayOfWeek: item.dayOfWeek,
            openTime: item.openTime,
            closeTime: item.closeTime,
            isClosed: false,
            serviceType: item.serviceType,
          },
        });
      }

      const floorPlan = await tx.floorPlan.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: "Main Floor",
          version: 1,
          canvasWidth: 1920,
          canvasHeight: 1080,
          isActive: true,
        },
      });

      const permissionsByCode = new Map<string, string>();

      for (const permission of PERMISSIONS) {
        const existingPermission = await tx.permission.findFirst({
          where: { code: permission.code },
          select: { id: true },
        });

        if (existingPermission) {
          permissionsByCode.set(permission.code, existingPermission.id);
          continue;
        }

        const createdPermission = await tx.permission.create({
          data: permission,
          select: { id: true },
        });

        permissionsByCode.set(permission.code, createdPermission.id);
      }

      const rolesByCode = new Map<string, string>();

      for (const template of ROLE_TEMPLATES) {
        const role = await tx.role.create({
          data: {
            tenantId: tenant.id,
            code: template.code,
            name: template.name,
            description: template.description,
            isSystem: template.isSystem,
          },
        });

        rolesByCode.set(template.code, role.id);

        for (const permissionCode of template.permissionCodes) {
          const permissionId = permissionsByCode.get(permissionCode);

          if (!permissionId) {
            continue;
          }

          await tx.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId,
            },
          });
        }
      }

      const passwordHash = await bcrypt.hash(data.adminPassword, 10);

      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail,
          passwordHash,
          status: "ACTIVE",
        },
      });

      const tenantOwnerRoleId = rolesByCode.get("tenant_owner");
      const branchManagerRoleId = rolesByCode.get("branch_manager");

      if (!tenantOwnerRoleId || !branchManagerRoleId) {
        throw new BadRequestException("Required system roles were not created");
      }

      await tx.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: tenantOwnerRoleId,
          branchId: null,
        },
      });

      await tx.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: branchManagerRoleId,
          branchId: branch.id,
        },
      });

      return {
        tenant,
        restaurant,
        branch,
        branchSettings,
        floorPlan,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
        },
        setup: {
          businessHours: businessHours.length,
          roles: ROLE_TEMPLATES.length,
          permissions: PERMISSIONS.length,
          tables: 0,
          zones: 0,
          combinations: 0,
          note: "Zones, tables, and table combinations must be created from Floor Plan Editor.",
        },
      };
    });
  }
}