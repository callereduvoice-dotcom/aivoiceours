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

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Documentation: http://localhost:${PORT}`);
});

module.exports = app;