require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log('🎙️ AI Voice Agent - Starting...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'AI Voice Agent',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      startCampaign: 'POST /api/campaign/start',
      getLeads: 'GET /api/leads',
      getStats: 'GET /api/stats',
      testCall: 'POST /api/test/call'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const campaignRoutes = require('./routes/campaigns');
const leadsRoutes = require('./routes/leads');
const statsRoutes = require('./routes/stats');
const testRoutes = require('./routes/test');
const webhookRoutes = require('./routes/webhook');
const logsRoutes = require('./routes/logs').router;

app.use('/api/campaign', campaignRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/logs', logsRoutes);

// Direct call endpoint - ALWAYS use Vobiz (LiveKit has auth issues)
app.post('/api/call', async (req, res) => {
  try {
    let { phone, lead_name, language } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'phone required' });
    }
    
    // Clean and format phone number
    phone = String(phone).replace(/\s/g, '').replace(/-/g, '');
    
    // Add +91 if missing (India)
    if (!phone.startsWith('+')) {
      if (phone.startsWith('91') && phone.length >= 11) {
        phone = '+' + phone;
      } else if (phone.length === 10) {
        phone = '+91' + phone;
      } else if (phone.length === 11 && phone.startsWith('0')) {
        phone = '+91' + phone.substring(1);
      }
    }
    
    // ALWAYS use Vobiz for now
    console.log(`📞 Using Vobiz for call to ${phone}`);
    
    const telephonyService = require('./services/telephony');
    const answerUrl = `${process.env.CALLBACK_URL || 'http://localhost:3000'}/api/webhook/vobiz/answer`;
    const result = await telephonyService.makeCall(phone, answerUrl, false);
    
    if (result.success) {
      res.json({ 
        status: 'dispatched', 
        phone, 
        callSid: result.callSid,
        type: 'vobiz',
        message: 'Call initiated - check your phone!'
      });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Call error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Documentation: http://localhost:${PORT}`);
});

module.exports = app;