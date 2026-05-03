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

app.use('/api/campaign', campaignRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/webhook', webhookRoutes);

// Direct call endpoint for dashboard
app.post('/api/call', async (req, res) => {
  try {
    const { phone, lead_name, language } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'phone required' });
    }
    
    console.log(`📞 API Call: ${phone}`);
    
    const dialerService = require('./services/dialer');
    const result = await dialerService.makeCall(phone, language || 'hi-IN');
    
    if (result.success) {
      res.json({ status: 'dispatched', phone, room: result.callId });
    } else {
      res.status(500).json({ error: result.error || 'Call failed' });
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