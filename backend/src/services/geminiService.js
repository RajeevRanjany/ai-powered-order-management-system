const { GoogleGenerativeAI } = require('@google/generative-ai');

// Model preference order — try newest first, fall back on 404 (deprecated model)
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

let genAI;

function getClient() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

async function callGemini(prompt) {
  let lastErr;
  for (const modelName of MODELS) {
    try {
      const model = getClient().getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      lastErr = err;
      if (err.message.includes('404') || err.message.includes('not found')) {
        continue; // try next model in list
      }
      throw err; // quota / auth errors bubble to caller's catch
    }
  }
  throw lastErr;
}

async function generateAlertMessage(order, prediction) {
  const prompt = `You are an operations assistant for an eyewear lab. Write a concise 2-sentence alert for the team.

Order: ${order.order_number}
Customer: ${order.customer_name}
Lens Type: ${order.lens_type} | Index: ${order.lens_index} | Coating: ${order.coating}
Current Stage: ${order.current_status}
Risk Level: ${prediction.riskLevel}
SLA Deadline: ${new Date(order.sla_deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Predicted Completion: ${prediction.predictedCompletionDate ? new Date(prediction.predictedCompletionDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown'}
Reason: ${prediction.reason}

Write a clear, actionable 2-sentence alert message. Focus on the risk and what action is needed. Be specific.`;

  try {
    return await callGemini(prompt);
  } catch (err) {
    console.error('Gemini alert generation failed:', err.message);
    return `Order ${order.order_number} is ${prediction.riskLevel}. ${prediction.reason}`;
  }
}

async function explainOrderRisk(order, prediction, statusHistory) {
  const stagesText = statusHistory
    .map(h => `  - ${h.status} at ${new Date(h.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}${h.delay_reason ? ` (Delay: ${h.delay_reason})` : ''}`)
    .join('\n');

  const prompt = `You are a senior operations analyst for an eyewear manufacturing lab. Explain in 3-4 sentences why this order is at risk.

Order Details:
- Order: ${order.order_number} | Customer: ${order.customer_name}
- Lens: ${order.lens_type} ${order.lens_index} with ${order.coating} coating
- Channel: ${order.source_channel} | Store: ${order.store_location || 'N/A'}
- Lens In House: ${order.lens_in_house ? 'Yes' : 'No (Procurement Required)'}
- SLA Deadline: ${new Date(order.sla_deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- Predicted Completion: ${prediction.predictedCompletionDate ? new Date(prediction.predictedCompletionDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown'}
- Risk Level: ${prediction.riskLevel}
- Hours in current stage: ${prediction.hoursInCurrentStage}h

Stage History:
${stagesText}

Explain the root cause of the delay and what specific action the team should take now.`;

  try {
    return await callGemini(prompt);
  } catch (err) {
    console.error('Gemini risk explanation failed:', err.message);
    return prediction.reason;
  }
}

async function recommendInventoryStocking(lowStockItems, recentOrders) {
  const lowStockText = lowStockItems
    .map(i => `  - ${i.sku}: ${i.quantity_on_hand} units (reorder point: ${i.reorder_point})`)
    .join('\n');

  const demandMap = {};
  for (const o of recentOrders) {
    const key = `${o.lens_type}_${o.lens_index}_${o.coating}`;
    demandMap[key] = (demandMap[key] || 0) + 1;
  }
  const demandText = Object.entries(demandMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([k, v]) => `  - ${k.replace(/_/g, ' ')}: ${v} orders`)
    .join('\n');

  const prompt = `You are an inventory manager for an eyewear lab. Based on current stock levels and recent demand, provide 3-5 specific stocking recommendations.

Low Stock Items:
${lowStockText || '  (none)'}

Recent Order Demand (last 30 days):
${demandText || '  (no data)'}

Provide concise, actionable stocking recommendations. For each, specify: what to stock, how much, and why. Format as a numbered list.`;

  try {
    return await callGemini(prompt);
  } catch (err) {
    console.error('Gemini inventory recommendation failed:', err.message);
    return 'Unable to generate recommendations at this time. Please check your Gemini API quota.';
  }
}

module.exports = { generateAlertMessage, explainOrderRisk, recommendInventoryStocking };
