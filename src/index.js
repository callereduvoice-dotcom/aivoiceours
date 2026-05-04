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

// Direct call endpoint - uses LiveKit if configured, otherwise Vobiz
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
    
    // Check if LiveKit is configured
    const livekitUrl = process.env.LIVEKIT_URL;
    const livekitKey = process.env.LIVEKIT_API_KEY;
    const livekitSecret = process.env.LIVEKIT_API_SECRET;
    
    if (livekitUrl && livekitKey && livekitSecret) {
      // Use LiveKit
      console.log(`🚀 Using LiveKit for call to ${phone}`);
      
      const { v4: uuidv4 } = require('uuid');
      const callId = uuidv4();
      const roomName = `call-${phone.replace('+', '')}-${Date.now()}`;
      
      const metadata = {
        phone_number: phone,
        lead_name: lead_name || 'User',
        language: language || 'hi-IN'
      };
      
      // Create room and dispatch agent via LiveKit API
      const lk = require('./services/livekit-client');
      const result = await lk.dispatchCall(roomName, metadata);
      
      if (result.success) {
        console.log(`✅ LiveKit call dispatched: ${roomName}`);
        res.json({ 
          status: 'dispatched', 
          phone, 
          room: roomName,
          type: 'livekit',
          message: 'AI agent will call you shortly'
        });
      } else {
        throw new Error(result.error);
      }
    } else {
      // Fallback to Vobiz direct
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
          message: 'Call initiated'
        });
      } else {
        throw new Error(result.error);
      }
    }
  } catch (error) {
    console.error('Call error:', error);
    res.status(500).json({ error: error.message });
  }
    
    const dialerService = require('./services/dialer');
    const telephonyService = require('./services/telephony');
    
    // Log the attempt
    console.log(`🔄 Calling Vobiz API...`);
    
    const answerUrl = `${process.env.CALLBACK_URL || 'http://localhost:3000'}/api/webhook/vobiz/answer`;
    const result = await telephonyService.makeCall(phone, answerUrl, true);
    
    console.log(`📊 Vobiz response:`, result);
    
    if (result.success) {
      console.log(`✅ Call dispatched: ${result.callSid}`);
      res.json({ 
        status: 'dispatched', 
        phone, 
        callSid: result.callSid,
        message: 'Call initiated successfully'
      });
    } else {
      console.log(`❌ Call failed:`, result.error);
      res.status(500).json({ 
        error: result.error || 'Call failed',
        details: 'Check Vobiz API credentials and balance'
      });
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