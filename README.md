# Sohrab Air International

Bilingual Hajj, Umrah, ticketing, recruitment and group-leader website. The codebase has two independent services:

- `frontend/`: Next.js website and admin dashboard.
- `backend/`: Java 21 / Spring Boot API with PostgreSQL, Flyway migrations and private passport file storage.

## Deploy the demo on Vercel

The `frontend/` app also runs without the Java backend. When `API_INTERNAL_URL` is **not** set, it builds in demo mode:

- the public website, package list and request forms work, saving to the visitor's browser;
- **Admin Login** in the top bar opens the CRM directly with no password, pre-filled with fictional sample data (leads pipeline, accounts, packages, employees with attendance/tasks/payroll/performance, and a "Needs attention" queue).

On Vercel: import this repository, set **Root Directory** to `frontend`, keep the Next.js preset, and leave `API_INTERNAL_URL` unset. Do not collect real passports on the demo — data never leaves the browser and the admin has no password. Use the Docker stack below for real customer data.

## Run locally

Requirements: Docker and Docker Compose. Copy `.env.example` to `.env`, set a real domain, a random database password, an owner Admin ID and a strong owner password (at least 12 characters). Point the domain's DNS A/AAAA record to the server and open ports 80 and 443.

```bash
docker compose up --build -d
docker compose ps
```

Caddy serves the website over HTTPS and renews certificates. The Java API and PostgreSQL are private to the Compose network. After start, check `https://<SITE_DOMAIN>/api/health`, open `/admin`, and sign in with `OWNER_LOGIN` and `OWNER_PASSWORD`. Create manager accounts from the Team access tab. Publish verified packages in the Packages tab before advertising them.

For separate development, start PostgreSQL, set `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `OWNER_LOGIN`, `OWNER_PASSWORD`, `PUBLIC_ORIGIN=http://localhost:3000`, and `UPLOAD_DIR`, then run `mvn spring-boot:run` from `backend/`. In `frontend/`, run `npm ci`, set `API_INTERNAL_URL=http://localhost:8080`, then run `npm run dev`.

## Production checks

- Confirm the business name, address, phone, email, licences and all regulatory links before publication.
- Add only verified packages and prices. The public website has no sample price or job listing fallback.
- Back up the PostgreSQL volume and the passport files volume together. Restore both in a rehearsal before accepting real applications.
- Protect the server, restrict SSH, and store `.env` outside Git. Rotate owner credentials from the Admin page. Changing `OWNER_PASSWORD` after first startup does not reset the stored password.
- The old Cloudflare D1 and R2 data are **not migrated**. Export and import existing records and files before switching a live site to this stack.
- Update the existing deployment to use this Docker Compose stack. The old Sites/Cloudflare deployment cannot execute the Java service.

CI verifies the frontend lint/build and backend Maven tests. No production deployment occurs automatically.
