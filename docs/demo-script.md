# Demo Script — Eyewear OMS (5–8 minutes)

## Setup (before demo)
- Backend running: `cd backend && npm run dev`
- Frontend running: `cd frontend && npm run dev`
- Browser open at: `http://localhost:5173`
- Have the Postman or terminal ready for the manual TAT scan trigger

---

## Scene 1 — Dashboard Overview (1.5 min)

**Say:** "This is the live operations dashboard. Every order in the system is visible here with its current stage, SLA countdown, and AI-computed risk level."

**Show:**
- Point to the 6 summary cards: Active Orders, Delivered Today, At Risk, Breached SLA, Needs Attention, Pending Procurement
- Scroll the orders table — show the red BREACHED badge on ORD-2026-00005 (COATING stage, SLA passed)
- Show the amber AT_RISK badge on ORD-2026-00004 (QC, ~4h left)
- Show the SLA countdown timers in the SLA column

**Demo filters:**
- Filter by Lens Type = SINGLE_VISION → table narrows to 7 orders
- Filter by Risk Level = BREACHED → shows only the breached order
- Clear filters

---

## Scene 2 — Update an Order Status (1 min)

**Say:** "Any team member can advance an order to its next stage and log a delay reason. The system enforces valid transitions — you can't skip stages or go backwards without going through ON_HOLD."

**Demo:**
- Click "Update" on ORD-2026-00001 (currently LENS_CUTTING)
- Select "COATING" from the dropdown
- Type "Lens cut completed, passed inspection" in the delay reason field
- Click "Update Status"
- Watch the badge change to COATING in the table

---

## Scene 3 — Order Detail + TAT Prediction (1.5 min)

**Say:** "Each order has a full timeline and a live TAT prediction. The prediction engine computes remaining stage hours from historical averages and flags orders likely to breach SLA before it happens."

**Demo:**
- Click on ORD-2026-00005 (BREACHED, COATING stage)
- Show the prescription table (right eye / left eye SPH, CYL, AXIS)
- Show the TAT Prediction card: risk level BREACHED, predicted completion date, reason
- Click "Explain Risk (AI)" → Gemini generates a 3-4 sentence root cause explanation
- Show the Status Timeline at the bottom: every stage change with timestamp and actor

---

## Scene 4 — Module 1: Lens Inventory (1 min)

**Say:** "The system manages in-house lens stock. When an order is created, it automatically checks inventory and deducts stock if available — no manual lookup required."

**Demo on Inventory page:**
- Show the 29 SKU table with stock levels
- Point out the low-stock highlighting (red "Low Stock" badge when qty ≤ reorder point)
- Inline-edit one SKU's quantity (e.g. set SV-156-AR-M0M6 to 2) → shows Low Stock
- Click "AI Recommendations" → Gemini suggests which SKUs to restock and why

---

## Scene 5 — Create a New Order + Inventory Check (1 min)

**Say:** "Let me show the full intake flow. Before submitting, staff can check whether the lens is in-house."

**Demo on New Order page:**
- Fill in customer name: "Live Demo Customer"
- Fill prescription: SPH right -2.00, CYL right -0.75, axis 90; SPH left -1.50, CYL left -0.50, axis 85
- Select Lens Type: SINGLE_VISION, Index: 1.56, Coating: AR
- Click "Check Stock Availability" → shows IN_HOUSE_AVAILABLE with quantity
- Submit → redirects to Order Detail showing `lens_in_house: true` and SLA deadline

---

## Scene 6 — TAT Scan + Alerts (1 min)

**Say:** "The alert engine scans all open orders every 15 minutes. Let me trigger it manually to show what the team would receive."

**Demo:**
Run in terminal:
```bash
curl -s -X POST http://localhost:5000/api/alerts/trigger-scan | python3 -m json.tool
```

- Show the JSON response: `scanned: N, alerts_created: N`
- Navigate to the Alerts page
- Show the alert cards with order number, risk badge, Gemini-generated message, email-sent indicator
- Click "Acknowledge" on one alert to show the workflow

---

## Key Talking Points

- **No ML model needed:** The rule-based TAT engine uses historical stage averages and works from day one. It improves automatically as more orders complete.
- **Atomic inventory deduction:** The stock decrement and order insert happen in a single database transaction — no race condition possible with concurrent orders.
- **SLA clock uses business hours:** A 3-day SLA for Single Vision counts only Mon–Sat 09:00–19:00. The system adds modifier hours for coatings, high-index lenses, B2B channel, and procurement delays.
- **Alert deduplication:** The same at-risk order won't spam the team — alerts have a 4-hour cooldown per order per risk level.
- **Gemini for the "why":** The AI doesn't make decisions — it explains them. Gemini reads the stage history and writes a plain-language root cause that a non-technical manager can act on.
