<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/14CdGJD9l30BKv37p8TaIIYdnBgMn7Isf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Development

### AI-generated Detailed Report

The **Detailed Report** button can generate an AI-written report via a local server endpoint (`POST /api/report`).

This requires API keys configured **server-side** (not in the browser).

Report access is gated:
- Users can always **email** themselves a report (lead magnet).
- Viewing the report **in-app** (and exporting PDF from the server) requires a **voucher code**.

1. Create `/.env.local` from `/.env.example` and set one or more provider keys:
    - `OPENAI_API_KEY` (for `gpt-5.2-2025-12-11`)
    - `XAI_API_KEY` (for `grok-4-1-fast`)
    - `ANTHROPIC_API_KEY` (for Claude models)
    - `GOOGLE_API_KEY` (for `gemini-3-flash-preview`)

Optional (override / in-app access):
   - `REPORT_VOUCHER_CODE` (defaults to `Skynet2026` if unset)

Optional (email lead magnet): configure SMTP so the app can email users their report from `POST /api/report/email`:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

2. Run the app (this starts Vite + the API server):

```powershell
npm install
npm run dev
```

3. Open `http://localhost:5173` and use **Detailed Report → Generate AI Report**.

Dev notes:
- UI runs on `http://localhost:5173`
- API runs on `http://localhost:5174` but is accessed via the UI at `/api/*` through Vite's proxy

### Email delivery (lead magnet)

Use the **Email report** field/button to send the report to an address.

Server endpoint:
- `POST /api/report/email` (expects `email` and (`model` + `data`))
- If you already unlocked the report in-app, you can also send `markdown` + `voucher` to avoid re-running the model.

### Best-quality PDF export

The **Export PDF** button downloads a server-rendered PDF from `POST /api/report/pdf`.

This uses Playwright + Chromium for highest-quality layout (tables, headings, etc.). One-time setup:

```powershell
npm install
npm run pdf:install
```

To run the production server (serves `dist/` + `/api/report`), build first:

```powershell
npm run build
npm run start
```

## Useful Scripts

- `npm run typecheck` — TypeScript checks (`tsc --noEmit`)
- `npm test` — Run unit tests (Vitest)
- `npm run build` — Production build
- `npm run preview` — Preview production build
