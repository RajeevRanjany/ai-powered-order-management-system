const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendAlertEmail({ order, prediction, alertMessage }) {
  const riskColor = prediction.riskLevel === 'BREACHED' ? '#dc2626' : '#f59e0b';
  const deadline = new Date(order.sla_deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const predicted = prediction.predictedCompletionDate
    ? new Date(prediction.predictedCompletionDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Unknown';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${riskColor}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin:0">⚠️ SLA ${prediction.riskLevel} — ${order.order_number}</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="font-size:16px; color:#111">${alertMessage}</p>
        <hr style="border-color:#e5e7eb; margin: 16px 0"/>
        <table style="width:100%; border-collapse:collapse; font-size:14px">
          <tr><td style="padding:6px 0; color:#6b7280">Customer</td><td style="font-weight:600">${order.customer_name}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280">Lens</td><td>${order.lens_type} · ${order.lens_index} · ${order.coating}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280">Current Stage</td><td>${order.current_status}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280">SLA Deadline</td><td style="color:${riskColor}; font-weight:600">${deadline}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280">Predicted</td><td>${predicted}</td></tr>
          <tr><td style="padding:6px 0; color:#6b7280">Store</td><td>${order.store_location || 'N/A'}</td></tr>
        </table>
      </div>
    </div>`;

  await getTransporter().sendMail({
    from: `"Eyewear OMS Alerts" <${process.env.SMTP_USER}>`,
    to: process.env.ALERT_EMAIL_TO,
    subject: `[${prediction.riskLevel}] Order ${order.order_number} — SLA Alert`,
    html,
  });
}

module.exports = { sendAlertEmail };
