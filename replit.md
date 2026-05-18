# NVDA Alerts — نظام تنبيهات الأسهم

نظام احترافي لمراقبة أسهم NVDA وTSLA وAAPL لحظياً مع إرسال إشارات CALL/PUT وتنبيهات سعرية عبر Telegram.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل API server (port 8080)
- `pnpm run typecheck` — فحص TypeScript كامل
- `pnpm run build` — typecheck + build جميع الحزم
- `pnpm --filter @workspace/api-spec run codegen` — إعادة توليد API hooks و Zod schemas
- `pnpm --filter @workspace/db run push` — تطبيق تغييرات DB schema (dev فقط)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/lib/chartMonitor.ts` — حلقة المراقبة + بناء إشارات CALL/PUT
- `artifacts/api-server/src/lib/optionsPicker.ts` — اختيار أفضل عقد خيارات (Tradier → Polygon+Yahoo)
- `artifacts/api-server/src/lib/alertDeduplicator.ts` — منع تكرار التنبيهات (cooldown + hourly cap)
- `artifacts/api-server/src/lib/telegram.ts` — إرسال وحذف رسائل Telegram
- `artifacts/api-server/src/lib/lang.ts` — إعداد اللغة المركزي (DEFAULT_LANGUAGE = "ar")
- `artifacts/api-server/src/routes/webhook.ts` — معالج webhooks من TradingView
- `artifacts/nvda-alerts/src/` — واجهة المستخدم (React + Vite)

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- **Deduplication**: alertDeduplicator مركزي — alert ID = `ticker:direction:priceGrid:timeframe`، 15 دقيقة cooldown، حد 2 إشارة/ساعة
- **Options pipeline**: Tradier (مباشر) → Polygon reference + Yahoo chart v8 (احتياطي)
- **Startup cleanup**: يحذف جميع رسائل البوت القديمة من المجموعة عند كل إعادة تشغيل
- **Language**: جميع رسائل Telegram والواجهة عربية دائماً (DEFAULT_LANGUAGE = "ar")

## Product

- مراقبة NVDA وTSLA وAAPL كل دقيقة خلال Pre-Market و Market Open
- إشارات CALL/PUT مع نقاط قوة 0-100% وحد أدنى 70%
- اختيار أفضل عقد خيارات مع أهداف +30% / +50% / +80%
- تنبيهات سعرية مخصصة من واجهة المستخدم
- منع التكرار: 15 دقيقة cooldown + حد 2 إشارة/ساعة لكل سهم

## User preferences

- **اللغة**: جميع رسائل البوت والتنبيهات والواجهة باللغة العربية فقط — إعداد دائم
- **DEFAULT_LANGUAGE = "ar"** — مُعرَّف في `artifacts/api-server/src/lib/lang.ts`
- الاستثناء المسموح: أسماء الأسهم (NVDA, AAPL, TSLA) والمصطلحات التقنية (CALL, PUT, EMA, VWAP, RSI, Delta)
- تنسيق RTL لجميع النصوص العربية في الواجهة
- التوقيت يُعرض بتوقيت السعودية (KSA / Asia/Riyadh) أولاً

## Gotchas

- لا تُشغّل `pnpm dev` من root — استخدم `restart_workflow` فقط
- `fuser -k $PORT/tcp` يعمل قبل البناء لتجنب تعارض المنافذ
- Polygon options snapshot → 403 (الخطة لا تشمله) — استخدم Polygon reference API بدلاً منه
- Yahoo v7 options → 401 — استخدم Yahoo chart v8 لكل عقد على حدة
- CHAT_ID هو supergroup ID يبدأ بـ `-100`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
