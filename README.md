# Restaurant OS

Enterprise-grade Restaurant Operating System for restaurant reservations, table management, live floor operations, onboarding, booking widgets, walk-ins, waitlist automation, and review requests.

Repository:
https://github.com/xheki007/restaurant-os

## Project Status

This project is prepared for client testing.

Current working areas:

- Multi-tenant restaurant setup
- Restaurant onboarding
- Branch setup
- Manager dashboard
- Floor plan editor
- Zones and tables
- Logical table combinations
- Online booking widget
- Reservation lifecycle
- Walk-ins
- Capacity-aware table assignment
- Anti-overbooking logic
- Waitlist automation
- Google review link support
- WhatsApp-only review request flow, currently provider-ready and running in stub mode unless Meta credentials are configured

## Applications

services/api
NestJS backend API with Prisma and PostgreSQL.

apps/manager-web
Manager web dashboard, floor plan editor, live floor, reservations, settings, onboarding, and internal restaurant management.

apps/booking-widget
Public booking widget for customers.

## Required Local Setup

Required software:

- Node.js
- npm
- PostgreSQL
- Git

Optional:

- Docker, if the database is started through Docker

## Environment Files

Environment files are not included in GitHub for security reasons.

Use the example files:

- services/api/.env.example
- apps/manager-web/.env.local.example
- apps/booking-widget/.env.local.example

Copy them locally and fill real values:

API:
Copy services/api/.env.example to services/api/.env

Manager web:
Copy apps/manager-web/.env.local.example to apps/manager-web/.env.local

Booking widget:
Copy apps/booking-widget/.env.local.example to apps/booking-widget/.env.local

Never commit real .env files.

## API Setup

Path:
C:\restaurant-os\services\api

Commands:

Set-Location "C:\restaurant-os\services\api"
npm install
Copy-Item ".env.example" ".env"
npm run build
npm run start:dev

Default API URL:
http://localhost:3002

## Manager Web Setup

Path:
C:\restaurant-os\apps\manager-web

Commands:

Set-Location "C:\restaurant-os\apps\manager-web"
npm install
Copy-Item ".env.local.example" ".env.local"
npm run build
npm run dev

Default manager web URL:
http://localhost:3000

## Booking Widget Setup

Path:
C:\restaurant-os\apps\booking-widget

Commands:

Set-Location "C:\restaurant-os\apps\booking-widget"
npm install
Copy-Item ".env.local.example" ".env.local"
npm run build
npm run dev

## Review Request Flow

The system supports review request automation after a reservation is completed.

Current behavior:

- ReviewRequest is created after reservation completion
- Delay is controlled by branch settings
- Google review link is stored in branch settings
- Review flow is WhatsApp-only
- WhatsApp is currently in stub mode unless Meta WhatsApp Cloud API credentials are configured

To enable real WhatsApp delivery, configure:

- WHATSAPP_PROVIDER=meta
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_GRAPH_VERSION
- WHATSAPP_REVIEW_TEMPLATE_NAME
- WHATSAPP_TEMPLATE_LANGUAGE

Do not enable WHATSAPP_PROVIDER=meta before the Meta template is approved.

## Security Notes

Do not commit:

- .env
- .env.local
- API tokens
- SMTP passwords
- WhatsApp access tokens
- database dumps
- backup archives
- local debug files

## Development Rules

- PowerShell only
- Use exact file paths
- Backup before changes
- UTF-8 without BOM
- Full-file rewrites for code changes
- No blind patches
- Do not hardcode tenant or branch IDs
- Do not commit secrets

## Client Testing Notes

This repository contains the source code only. It does not include production secrets, production database credentials, or live provider credentials.

For client testing, configure local .env files, start the API first, then start manager-web and booking-widget.

Recommended startup order:

1. Start PostgreSQL
2. Start services/api
3. Start apps/manager-web
4. Start apps/booking-widget

## Current Repository State

The repository has been cleaned from local debug dumps, backup archives, zip exports, .env files, node_modules, dist folders, and Next.js build folders.