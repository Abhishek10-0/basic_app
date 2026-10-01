# SME Mobile Platform

A working npm-workspace monorepo with an Expo React Native user application, Next.js admin website, and Express/Prisma/PostgreSQL API.

The user UI follows the supplied six screenshots: cyan-blue gradients, rounded cards, horizontal home event cards, date panels, and **Home / About / Events / Member / More** navigation. The supplied HTML logo/background are reused in the animated native session loader. Profile is available through the home logo and More → My account; Join us remains an enquiry form.

## Run on this computer

Node 22.13+ is required. Dependencies and actual environment files have already been created. The configured remote database is already migrated and seeded.

```bat
start-all.bat
```

This opens three separate, persistent terminals: `SME APP - API`, `SME APP - ADMIN`, and `SME APP - USER`. Close older instances first if those ports are occupied.

- API: http://localhost:4000/api/v1/health
- Database readiness: http://localhost:4000/api/v1/ready
- Admin: http://localhost:3000
- User web preview: http://localhost:8081
- Physical phone: scan the Expo terminal QR code on the same network.

Administrator login accepts either configured phone (`8355928058` or `8828268783`) with the supplied password in `services/api/.env`. It also accepts the seeded admin email. Passwords are stored as bcrypt hashes, not plaintext database fields. Re-running the seed does not reset existing passwords.

PowerShell users can use `npm.cmd` if execution policy blocks `npm.ps1`.

## Actual environment files

No `.env.example` files are needed:

- `services/api/.env`: supplied database, admin, media server, Razorpay, and SMTP credentials; generated access/refresh/webhook secrets; local URLs and service switches.
- `apps/user-app/.env`: public LAN API URL and public Razorpay key only.
- `apps/admin-web/.env`: public API URL only.
- `services/api/.env.test`: isolated local test database; outgoing email disabled.

All `.env` files are gitignored. Do not put server secrets in `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` variables.

The remote PostgreSQL database is **chamber_app_db** on **db.smebusinessforum.com:5432**. The URL has `?schema=sme_platform` appended: the new application owns this schema. Existing legacy tables/types in `public` were not dropped. This avoids the previous type-name clashes and Prisma `P3005` error. In a database viewer, expand `sme_platform` to see the new Prisma tables.

## Database commands

```bat
npm install
npm run prisma:generate
npm run prisma:deploy
npm run seed
```

Use `prisma:deploy` for the configured remote database. It applies the committed migration without resetting data. Use `prisma:migrate` only on a development database when changing the schema:

```bat
npm exec -w @sme/api -- prisma migrate dev --name describe_change
npm run prisma:studio
npm run seed:admin
```

On Windows, stop API processes before `prisma:generate`; the running process can lock Prisma's engine DLL. Restart the API afterwards.

Seed data includes two administrator accounts, three dynamic membership plans, three sample events, three news articles, and editable organization settings. Fees and programme data are seed content, not official live pricing. The reference About page reproduces the supplied presentation copy and impact figures.

## Architecture

```text
sme-mobile-platform/
├── apps/
│   ├── user-app/          Expo 57, React Native, Expo Router
│   │   ├── app/           Tabs, authentication, details, checkout and profile routes
│   │   ├── assets/        Original logo and loading background
│   │   └── src/           Components, screens, API client, session and push helpers
│   └── admin-web/         Next.js 16, React, Tailwind CSS
│       ├── public/        Brand assets
│       └── src/           Login, dashboard, tables, forms, settings and API client
├── services/api/
│   ├── prisma/            Schema, committed SQL migration, seed
│   ├── src/
│   │   ├── config/        Validated environment and Prisma client
│   │   ├── middleware/    JWT authentication and admin role checks
│   │   ├── routes/        Auth, public, account, admin, payments and media APIs
│   │   ├── services/      Gateway, payments, refresh sessions, email worker
│   │   ├── emails/        Escaped HTML confirmation templates
│   │   ├── validators/    Admin request schemas
│   │   ├── utils/         Consistent HTTP responses/errors
│   │   ├── app.ts
│   │   └── server.ts
│   └── tests/             PostgreSQL-backed integration tests
├── packages/
│   ├── types/             Shared API/domain types
│   ├── shared/            Zod schemas, currency/date/tax helpers
│   ├── config/            Brand and theme tokens
│   └── ui/                Shared spacing, radius and typography tokens
├── docs/                  Full file tree and original HTML loader reference
├── scripts/               Browser checks and optional local PostgreSQL
├── docker-compose.yml
├── package.json
├── start-all.bat
└── README.md
```

Full source file inventory: [docs/FILE_TREE.txt](docs/FILE_TREE.txt).

## Implemented flows

- Email/mobile signup and login, bcrypt passwords, expiring JWT access tokens, single-use rotating refresh tokens, replay rejection, logout, reset-password and email-verification links.
- Native refresh tokens use Expo SecureStore. Access tokens stay in memory. The web preview keeps sessions in memory, so a full page reload requires signing in again. Admin refresh sessions use HttpOnly cookies.
- Public event details and guest registration; no login redirect. Free bookings confirm immediately. Paid bookings reserve capacity for 30 minutes and confirm after server-side capture verification. Seat reservation is transaction-protected.
- Membership requires a user login and returns to the selected checkout after authentication. The server calculates tax/amounts and snapshots the purchased title/duration. Renewal dates follow existing membership validity.
- Signature verification uses the stored Razorpay order ID. The API fetches payment details from Razorpay and validates order, captured state, currency and amount. Duplicate callback/webhook delivery does not create duplicate activations or emails.
- Checkout opens a server-hosted Razorpay page, compatible with Expo Go through a browser. Native screens can poll the signed status URL after returning. No custom native payment module is required.
- Profile editing, password changes, membership history, payment history, notifications and bookings. Guest bookings matching an account email become visible only after email verification.
- Admin dashboard, searchable/paginated/filterable tables, events/plans/news create/edit/archive, membership activation/extension/cancellation, booking attendance/cancellation, CSV export, enquiry follow-up, broadcasts, image uploads, organization settings, administrator creation and activity logs.
- HTML confirmation emails use an outbox with retry/backoff. Confirmation creation is part of the booking/payment transaction.

## Payment and email configuration

Your provided Razorpay test key pair is present in the API environment. No real gateway payment was made during automated testing; the gateway is mocked in payment tests while the PostgreSQL transactions and HTTP routes are real.

Set the Razorpay dashboard webhook URL to your deployed HTTPS API `/api/v1/payments/webhook`, subscribe to `payment.captured`, and use the generated `RAZORPAY_WEBHOOK_SECRET` from the API environment. Enable automatic capture in the gateway. Razorpay cannot deliver webhooks to localhost or a private LAN IP.

SMTP settings are present. `MAIL_DELIVERY_ENABLED=false` currently keeps local test runs from sending messages. Set it to `true` and restart the API when ready to deliver queued confirmations/reset links. SMTP delivery itself has not been tested against the supplied mailbox. Inspect `EmailJob` in Prisma Studio for queued/sent/retry states. Failed jobs retry up to eight attempts. Multiple-process delivery is at-least-once if a worker crashes after sending.

Late captured payments after a seat hold expires are confirmed only if capacity can be reclaimed. If capacity is gone, the webhook reports a reconciliation error for administrator follow-up; it does not overbook. Cancellation does not automatically refund a captured payment. Process refunds/reconciliation in Razorpay. PDF generation is not included; invoice numbers and billing/tax snapshots are stored for a later PDF service.

## Media

Uploads currently work through API-local image storage (`MEDIA_MODE=local`) with a 5 MB limit and PNG/JPEG/WebP signature validation. Only URLs are stored in Prisma. The supplied remote media URL and secret are in `.env`.

The remote adapter uses multipart `file`, `Authorization: Bearer <secret>`, and expects `{ "url": "https://..." }` at `MEDIA_UPLOAD_PATH`. The external server's actual upload contract was not provided or verified. Set `MEDIA_MODE=remote` once that contract is confirmed, or adjust `src/routes/media.ts` to the server's documented protocol. Local uploads need persistent disk and an externally reachable `API_PUBLIC_URL` in deployment.

## Expo networking

For a physical phone, `EXPO_PUBLIC_API_URL` must use the computer's LAN IP, not localhost. The current LAN host is `192.168.0.222`.

```text
Physical phone:   http://192.168.0.222:4000/api/v1
Android emulator: http://10.0.2.2:4000/api/v1
iOS simulator:    http://localhost:4000/api/v1
```

If your LAN IP changes, update the user-app environment and the API's `API_PUBLIC_URL`, `USER_APP_WEB_ORIGIN`, and `CORS_ORIGINS`. Restart Expo to pick up public environment changes. Allow Node through the Windows private-network firewall if the phone cannot reach the API.

Remote push-token registration helpers are prepared in `src/lib/notifications.ts`; supply an EAS project ID and call registration after the user's opt-in in a development build. In-app broadcasts work now. Push delivery scheduling and app-store submission are not included.

## Checks and optional local database

```bat
npm run typecheck
npm run lint
npm run build
npm run db:local
npm run test
npm run test:browser
```

`db:local` starts a project-private PostgreSQL instance and keeps it running for tests. Tests are guarded to use localhost only and disable SMTP; they never use the configured remote application database. Test data is uniquely named and cleaned up afterwards. The first local test setup needs the committed migration in its database:

```powershell
$env:DATABASE_URL='postgresql://sme:sme_local_dev@localhost:5432/sme_chamber_utf8?schema=public'
npm.cmd run prisma:deploy
Remove-Item Env:DATABASE_URL
```

Docker is an alternative (`docker compose up -d`) with the matching local development database credentials from `docker-compose.yml`; do not run Docker and embedded PostgreSQL on port 5432 simultaneously.

Browser checks require Chrome and all three app servers running. They cover admin login/routes and mobile public navigation, guest booking entry and the membership login requirement. Screenshots are saved under `.local/screenshots` (gitignored).

Production build outputs: `services/api/dist`, `apps/admin-web/.next`, and `apps/user-app/dist`. Native JS bundle export can be checked with `npm exec -w @sme/user-app -- expo export --platform all`. Native binaries/signing need Android/iOS build tools or EAS.

## Troubleshooting

- **Database unavailable / Prisma initialization error:** verify the remote host is reachable and the URL includes `schema=sme_platform`; run `npm run prisma:deploy`, then restart API. Startup now checks PostgreSQL before serving traffic.
- **P3005 or an existing enum/type:** do not reset the shared `public` schema. This project uses `sme_platform` to avoid legacy table/type conflicts.
- **EADDRINUSE:** close the previous process using that port before launching `start-all.bat` again.
- **Prisma DLL EPERM:** stop the API before generating the Prisma client.
- **API works on PC but not phone:** check the LAN IP, firewall, shared Wi-Fi and CORS origins.
- **Email not arriving:** enable delivery and inspect the outbox; verify SMTP credentials/provider restrictions.
- **No events shown:** publish an event and ensure its dates match Forthcoming/Past filters.

Dependency references: [Expo SDK documentation](https://docs.expo.dev/versions/latest/), [Razorpay server verification](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/).
