# Threat Model

## Project Overview

NVDA Alerts is a stock-alerting application with a production Express 5 API in `artifacts/api-server` and a React/Vite dashboard in `artifacts/nvda-alerts`. The API stores alert thresholds in PostgreSQL, polls market data from Yahoo/Polygon/Tradier, receives TradingView webhooks, and sends Telegram notifications. The deployed production trust model assumes the internet can reach public API routes; the client is untrusted, the server holds all secrets, and the mockup sandbox is not deployed to production.

## Assets

- **Telegram bot capabilities** — `BOT_TOKEN`, `CHAT_ID`, and the ability to send or delete messages in the target Telegram supergroup. Abuse would let an attacker spam, delete, or spoof operational alerts.
- **Trading signal integrity** — alert thresholds, triggered state, and webhook-driven CALL/PUT signals. Tampering would produce false market signals or suppress legitimate ones.
- **Application secrets** — `TRADINGVIEW_SECRET`, `POLYGON_API_KEY`, `TRADIER_API_KEY`, and `DATABASE_URL`. Leakage can enable webhook spoofing, third-party API abuse, or database compromise.
- **Operational market data and alert history** — current alert configuration, notes, trigger history, and fetched market data. Exposure can reveal operator intent and internal monitoring state.
- **Service availability** — the API’s ability to process real signals and deliver Telegram alerts without quota exhaustion or spam.

## Trust Boundaries

- **Browser to API** — all dashboard requests cross from an untrusted client into the Express API. Every read or mutation endpoint must be treated as internet-facing unless explicitly protected.
- **TradingView / external caller to webhook** — `POST /api/webhook/tradingview` accepts input from outside the system and is trusted only if the shared secret is validated correctly and not leaked.
- **API to PostgreSQL** — the API has direct write access to global alert state. Any injection or broken access control in route handlers can tamper with production alert data.
- **API to Telegram** — the server can cause irreversible external side effects by posting and deleting messages. Operational endpoints that reach this boundary are high risk.
- **API to market-data providers** — the server calls Yahoo, Polygon, and Tradier with server-side credentials. User-controlled inputs must not be allowed to alter target hosts or expose API keys.
- **Production vs dev-only artifacts** — `artifacts/mockup-sandbox` is a non-production sandbox and should be ignored in scans unless there is evidence it is deployed or reachable in production.

## Scan Anchors

- Production API entry: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`
- Public route surface: `artifacts/api-server/src/routes/alerts.ts`, `stock.ts`, `health.ts`, `webhook.ts`
- Highest-risk code areas: Telegram integration in `artifacts/api-server/src/lib/telegram.ts`, webhook auth in `routes/webhook.ts`, secret logging/startup behavior in `src/index.ts`
- Public vs authenticated surfaces: all current dashboard and API routes appear public; no server-side auth middleware or role checks are present
- Dev-only area to ignore by default: `artifacts/mockup-sandbox`

## Threat Categories

### Spoofing

The main spoofing risk is forged TradingView webhook traffic or unauthorized use of operational API routes. The system must keep `TRADINGVIEW_SECRET` confidential, validate it on every webhook request, and avoid exposing it in logs or URLs that may be copied into telemetry. Any endpoint that can send Telegram messages or mutate global alert state must require a server-side authentication mechanism rather than relying on obscurity or the frontend.

### Tampering

Alert records in PostgreSQL are global application state. An attacker who can call alert-management routes without authorization can create, disable, edit, or delete thresholds and thereby alter what signals operators receive. The application must enforce server-side authorization on every alert read/write path and must not trust the dashboard alone to define who may manage alerts.

### Information Disclosure

This project holds multiple high-value secrets and operational details in environment variables and runtime logs. Secrets such as `TRADINGVIEW_SECRET`, Telegram bot credentials, and database connection strings must never be emitted to logs, API responses, or client bundles. Alert history and operator notes should only be returned to authorized callers.

### Denial of Service

Several public endpoints trigger expensive or externally visible work: Telegram sends, stock/options lookups, and webhook processing. Repeated unauthenticated access could spam Telegram, exhaust third-party API quotas, or crowd out legitimate alerts. Production-exposed operational endpoints must be authenticated and bounded so attackers cannot convert them into abuse amplifiers.

### Elevation of Privilege

Because the API currently represents global system control rather than per-user data, missing authorization is effectively an elevation from anonymous internet user to alert operator. The application must ensure that only explicitly trusted operators can manage alerts, invoke test signaling paths, or cause Telegram side effects. Database interactions should continue to use parameterized ORM queries so control cannot be escalated through injection.
