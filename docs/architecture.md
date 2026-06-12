# Architecture Note — AI-Powered Eyewear Order Management System

## What Was Built

A full-stack order management system for an eyewear brand covering three modules: lens inventory management, order lifecycle dashboard, and AI-driven TAT prediction with SLA breach alerts.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│  React + Vite + Tailwind (Frontend — Vercel)         │
│  Dashboard · Orders · Inventory · Alerts · New Order │
└───────────────────┬─────────────────────────────────┘
                    │ REST (Axios)
┌───────────────────▼─────────────────────────────────┐
│  Node.js + Express (Backend — Render)                │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Orders API │  │ Inventory API│  │ Alerts API │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                │                │          │
│  ┌──────▼────────────────▼────────────────▼──────┐  │
│  │              Service Layer                     │  │
│  │  slaService · inventoryService · tatService    │  │
│  │  geminiService · alertService · emailService   │  │
│  └──────────────────────┬─────────────────────────┘  │
│                         │                            │
│  ┌──────────────────────▼─────────────────────────┐  │
│  │  node-cron Job (every 15 min)                   │  │
│  │  → TAT scan → risk scoring → alert dispatch     │  │
│  └────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────┘
                    │ pg (node-postgres)
┌───────────────────▼──────────────┐
│  PostgreSQL (Render managed DB)   │
│  orders · lens_inventory          │
│  order_status_history · alerts    │
│  users                            │
└──────────────────────────────────┘
        │                    │
┌───────▼──────┐    ┌────────▼────────┐
│  Gemini API  │    │  Nodemailer     │
│  (Google AI) │    │  (Gmail SMTP)   │
└──────────────┘    └─────────────────┘
```

---

## Module Breakdown

### Module 1 — Lens Inventory Management
When an order is created, `inventoryService.checkAndDeductStock()` queries `lens_inventory` for a row matching the lens type, index, coating, and prescription power range (SPH/CYL). If a match exists with `quantity_on_hand > 0`, the stock is decremented in the same database transaction as the order insert and the response returns `IN_HOUSE_AVAILABLE`. If no match is found, the response returns `PROCUREMENT_REQUIRED` and `procurement_required = true` is stored on the order. The inventory page shows all SKUs, flags items below `reorder_point`, and can request AI stocking recommendations from Gemini.

### Module 2 — Order Lifecycle Dashboard
Orders move through 10 stages: `ORDER_PLACED → PRESCRIPTION_VERIFIED → LENS_ALLOCATED → LENS_CUTTING → COATING → FRAME_FITTING → QC → PACKED → SHIPPED → DELIVERED`. A QC failure transitions to `REORDER` which loops back to `LENS_ALLOCATED`. Every status change is written to `order_status_history` with the actor name and an optional delay reason. The dashboard computes `hours_until_sla = (sla_deadline - now) / 3600` live per query and surfaces risk badges (SAFE / AT_RISK / BREACHED). SLA deadlines are calculated at order creation using business hours (Mon–Sat 09:00–19:00) with additive modifiers for lens type, coating, channel, power, and stock availability.

### Module 3 — TAT Prediction & SLA Breach Alerts
A `node-cron` job runs every 15 minutes. For each open order it:
1. Fetches historical average stage durations from completed orders of the same lens type
2. Falls back to hardcoded defaults when insufficient history exists
3. Sums remaining stage hours → calls `addBusinessHours()` → `predicted_completion_date`
4. Compares against `sla_deadline` → assigns `risk_level` (SAFE / AT_RISK / BREACHED)
5. For AT_RISK and BREACHED orders, calls Gemini to generate a 2-sentence alert message
6. Deduplicates alerts (no repeat within 4 hours for same order + type)
7. Sends an HTML email via Nodemailer and writes the alert to the `alerts` table

---

## AI Usage — Gemini 1.5 Flash

**Why Gemini Flash over GPT-4 or Claude:** Gemini 1.5 Flash has a free tier sufficient for a demo-scale system, is accessible via a simple Node.js SDK (`@google/generative-ai`), and produces concise, factual text suitable for operational alerts.

**Three uses:**

| Use | Endpoint | Prompt Strategy |
|---|---|---|
| Alert message generation | TAT scan job | Order context + risk reason → 2-sentence alert |
| Risk explanation | `GET /alerts/explain/:order_id` | Full stage history → 3-4 sentence root cause |
| Inventory stocking advice | `GET /inventory/recommendations` | Low-stock items + 30-day demand → numbered list |

**Cost control:** Gemini is called only when `risk_level ≠ SAFE` and no duplicate alert exists in the last 4 hours. For a 100-order operation, this means roughly 5–15 Gemini calls per scan cycle — well within free tier limits.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Rule-based TAT prediction (no ML) | Eyewear orders have well-understood stage durations. A rule engine is interpretable, debuggable, and works from day one without training data. ML would require 500+ completed orders before it outperforms the rules. |
| PostgreSQL over MongoDB | Orders have strict relational structure (prescriptions → lenses → status history). Foreign keys and transactions (inventory deduction + order insert in one atomic operation) are essential. |
| APScheduler-style cron in-process | Eliminates Redis + Celery infrastructure. A 15-minute interval scan is well within the timeout budget of a single Node process. |
| Business-hour SLA arithmetic | Retail eyewear runs Mon–Sat 09:00–19:00. A wall-clock SLA deadline is meaningless to a lab team — the system adds hours only during working windows. |
| Deduplication on alerts | Without dedup, a 1-hour scan window would send 4 emails per at-risk order before the team can acknowledge. The 4-hour cooldown prevents alert fatigue. |

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL 17 |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Email | Nodemailer (Gmail SMTP) |
| Scheduler | node-cron |
| Hosting | Render (backend + DB), Vercel (frontend) |
