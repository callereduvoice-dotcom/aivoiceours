const express = require('express');
const router = express.Router();
const dialer = require('../services/dialer');

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