# Sohrab Air International

Bilingual Hajj, Umrah, ticketing, recruitment and group-leader website. The codebase has two independent services:

- `frontend/`: Next.js website and admin dashboard.
- `backend/`: Java 21 / Spring Boot API with PostgreSQL, Flyway migrations and private passport file storage.

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
