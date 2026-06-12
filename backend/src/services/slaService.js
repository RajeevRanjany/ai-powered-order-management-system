// SLA calculation using business hours (Mon–Sat, 9:00–19:00)
const BUSINESS_START = 9;
const BUSINESS_END = 19;
const BUSINESS_HOURS_PER_DAY = BUSINESS_END - BUSINESS_START; // 10

// Base SLA in business days
const BASE_SLA_DAYS = {
  SINGLE_VISION: 3,
  BIFOCAL: 5,
  PROGRESSIVE: 7,
};

// Extra hours added on top of base
function getSLAModifierHours(order) {
  let extra = 0;
  if (order.coating === 'PHOTOCHROMIC') extra += 24;
  if (order.coating === 'TINTED') extra += 12;
  if (order.source_channel === 'B2B') extra += 24;
  if (parseFloat(order.lens_index) >= 1.67) extra += 12;
  if (!order.lens_in_house) extra += 48;
  return extra;
}

function addBusinessHours(fromDate, hours) {
  let remaining = hours;
  let current = new Date(fromDate);

  while (remaining > 0) {
    const day = current.getDay(); // 0=Sun
    const hour = current.getHours();

    // Skip Sunday (0)
    if (day === 0) {
      current.setDate(current.getDate() + 1);
      current.setHours(BUSINESS_START, 0, 0, 0);
      continue;
    }

    // Before business hours — jump to start
    if (hour < BUSINESS_START) {
      current.setHours(BUSINESS_START, 0, 0, 0);
      continue;
    }

    // After business hours — jump to next business day start
    if (hour >= BUSINESS_END) {
      current.setDate(current.getDate() + 1);
      current.setHours(BUSINESS_START, 0, 0, 0);
      continue;
    }

    const hoursLeftToday = BUSINESS_END - hour;
    if (remaining <= hoursLeftToday) {
      current.setHours(current.getHours() + remaining, 0, 0, 0);
      remaining = 0;
    } else {
      remaining -= hoursLeftToday;
      current.setDate(current.getDate() + 1);
      current.setHours(BUSINESS_START, 0, 0, 0);
    }
  }

  return current;
}

function calculateSLADeadline(order, fromDate = new Date()) {
  const baseDays = BASE_SLA_DAYS[order.lens_type] || 5;
  const baseHours = baseDays * BUSINESS_HOURS_PER_DAY;
  const modifierHours = getSLAModifierHours(order);
  return addBusinessHours(fromDate, baseHours + modifierHours);
}

function getBusinessHoursBetween(start, end) {
  let hours = 0;
  let current = new Date(start);
  const endDate = new Date(end);

  while (current < endDate) {
    const day = current.getDay();
    if (day !== 0) {
      const dayStart = new Date(current);
      dayStart.setHours(BUSINESS_START, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(BUSINESS_END, 0, 0, 0);

      const from = current > dayStart ? current : dayStart;
      const to = endDate < dayEnd ? endDate : dayEnd;
      if (to > from) hours += (to - from) / 3600000;
    }
    current.setDate(current.getDate() + 1);
    current.setHours(BUSINESS_START, 0, 0, 0);
  }
  return Math.max(0, hours);
}

module.exports = { calculateSLADeadline, getBusinessHoursBetween, addBusinessHours };
