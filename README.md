# Sohrab Air International

Full-stack bilingual website for Hajj and Umrah packages, flight quotation requests, overseas recruitment applications, group-leader enquiries, passport uploads, and agency request management.

## Features

- Bengali/English customer interface with responsive sidebar navigation
- Hajj and Umrah packages with itinerary roadmap and booking form
- Air-ticket quotation workflow
- Overseas job application and official verification links
- Group-leader call requests
- Cloudflare D1 database for durable submission records
- Private R2 storage for passport images
- ChatGPT sign-in protected owner dashboard
- Request status workflow: new, contacted, confirmed, closed

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run db:generate
npm run build
```

For local D1 testing, apply the generated migrations as documented in the starter scripts, then run:

```bash
npm start
```

## Data and security

- Passport uploads accept only valid JPG, PNG, or WebP images up to 5 MB.
- Files are stored separately from database records.
- Admin API routes require an authenticated Sites user.
- Keep the Sites access policy owner-only until an explicit production sharing decision is made.

Package prices and job listings in the interface are sample content and must be confirmed before public launch.
