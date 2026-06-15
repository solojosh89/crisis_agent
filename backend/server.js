const express = require('express');
const cors = require('cors');
require('dotenv').config();
const AfricasTalking = require('africastalking');
const { runCrisisAgent } = require('./agent');
const { runHaleAI }     = require('./hale');

const app = express();
app.use(cors());
app.use(express.json());

// Africa's Talking SDK — only active when real credentials are configured.
// Without a valid API key we keep SMS in "queued" mode so the app degrades
// gracefully (the in-app tap-to-call contacts remain the working path).
const SMS_ENABLED = Boolean(
  process.env.AFRICAS_TALKING_API_KEY &&
  process.env.AFRICAS_TALKING_API_KEY.trim().length > 10
);

const sms = SMS_ENABLED
  ? AfricasTalking({
      username: process.env.AFRICAS_TALKING_USERNAME || 'sandbox',
      apiKey:   process.env.AFRICAS_TALKING_API_KEY,
    }).SMS
  : null;

// Returns one of: 'sent' | 'failed' | 'queued' | 'no-contacts'
async function sendSMSAlerts(emergencyData, result) {
  const contacts = [
    { name: emergencyData.profile?.contact1Name, phone: emergencyData.profile?.contact1Phone },
    { name: emergencyData.profile?.contact2Name, phone: emergencyData.profile?.contact2Phone },
    { name: emergencyData.profile?.contact3Name, phone: emergencyData.profile?.contact3Phone },
  ].filter(c => c.name && c.phone);

  if (contacts.length === 0) return 'no-contacts';

  const topHospital = result.hospitals[0];
  const ambulance   = result.ambulance;
  const patient     = emergencyData.patientName || 'Your contact';
  const city        = emergencyData.city || 'Nigeria';

  const message = `🚨 EMERGENCY ALERT from CrisisAgent\n` +
    `${patient} needs urgent medical help in ${city}.\n` +
    `Ambulance: ${ambulance.number} (${ambulance.name})\n` +
    `Nearest Hospital: ${topHospital.name} — ${topHospital.phone}\n` +
    `Please respond immediately.`;

  const phones = contacts.map(c => c.phone.replace(/^0/, '+234'));

  if (!SMS_ENABLED) {
    console.log(`SMS queued (no credentials configured) for ${contacts.length} contact(s):`, phones.join(', '));
    return 'queued';
  }

  try {
    await sms.send({ to: phones, message, from: 'CrisisAgt' });
    console.log('SMS alerts sent to:', phones.join(', '));
    return 'sent';
  } catch (err) {
    // Non-fatal — log but don't break the emergency response
    console.error('SMS send failed (non-fatal):', err.message);
    return 'failed';
  }
}

app.get('/', (req, res) => {
  res.json({ status: 'CrisisAgent is running', message: 'Ready to help' });
});

app.post('/emergency', async (req, res) => {
  try {
    const emergencyData = req.body;
    console.log('Emergency received:', emergencyData.patientName, '|', emergencyData.city);

    const result = await runCrisisAgent(emergencyData);

    // Alert emergency contacts (SMS if configured, otherwise queued)
    const alertStatus = await sendSMSAlerts(emergencyData, result);

    res.json({ success: true, data: { ...result, alertStatus } });
  } catch (error) {
    console.error('Agent error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/hale', async (req, res) => {
  try {
    console.log('Hale AI request:', req.body.disease, '| score:', req.body.severityScore);
    const result = await runHaleAI(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Hale error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CrisisAgent backend running on port ${PORT}`);
});
