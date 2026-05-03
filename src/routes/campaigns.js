const express = require('express');
const router = express.Router();
const dialer = require('../services/dialer');

router.get('/call', async (req, res) => {
  try {
    const { phone, language } = req.query;
    
    if (!phone) {
      return res.status(400).json({ error: 'phone parameter required' });
    }
    
    console.log(`📞 Direct call request to ${phone}`);
    
    const dialerService = require('../services/dialer');
    const result = await dialerService.makeCall(phone, language || 'hi-IN');
    
    res.json({ success: true, phone, result });
  } catch (error) {
    console.error('❌ Direct call error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/start', async (req, res) => {
  try {
    const { leadCount } = req.body;
    const count = leadCount || 10;
    
    console.log(`📨 Campaign start request for ${count} leads`);
    
    const result = await dialer.startCampaign(count);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Campaign start error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  const activeCalls = dialer.getActiveCalls();
  res.json({
    activeCalls: activeCalls.length,
    calls: activeCalls
  });
});

router.post('/stop', (req, res) => {
  res.json({ message: 'Campaign stop not fully implemented yet' });
});

module.exports = router;