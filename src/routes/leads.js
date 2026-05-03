const express = require('express');
const router = express.Router();
const sheetsService = require('../services/sheets');

router.get('/', async (req, res) => {
  try {
    const { status, limit } = req.query;
    let leads = await sheetsService.getLeads(2, parseInt(limit) || 100);
    
    if (status) {
      leads = leads.filter(lead => lead.status === status);
    }
    
    res.json({
      total: leads.length,
      leads
    });
  } catch (error) {
    console.error('❌ Get leads error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:rowNumber', async (req, res) => {
  try {
    const { rowNumber } = req.params;
    const leads = await sheetsService.getLeads(parseInt(rowNumber), 1);
    
    if (leads.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    res.json(leads[0]);
  } catch (error) {
    console.error('❌ Get lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:rowNumber', async (req, res) => {
  try {
    const { rowNumber } = req.params;
    const data = req.body;
    
    const result = await sheetsService.updateLead(parseInt(rowNumber), data);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Update lead error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;