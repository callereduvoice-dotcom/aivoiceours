const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const qualificationAgent = require('../agents/qualification');
const ttsService = require('../services/tts');
const llmService = require('../services/llm');

router.post('/call', async (req, res) => {
  try {
    const { name, language } = req.body;
    
    const callId = uuidv4();
    console.log(`🧪 Test call started, Call ID: ${callId}`);
    
    const leadData = {
      phone: '+919999999999',
      name: name || 'Test User',
      course: 'Test Course'
    };
    
    await qualificationAgent.startCall(callId, leadData);
    
    const introMessage = qualificationAgent.getIntroMessage(name || 'User');
    const ttsResult = await ttsService.synthesize(introMessage, language || 'hi-IN');
    
    res.json({
      success: true,
      callId,
      introMessage,
      audioGenerated: ttsResult.success,
      language: language || 'hi-IN',
      message: 'Test call created. Use /api/test/chat to continue conversation.'
    });
  } catch (error) {
    console.error('❌ Test call error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { callId, message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const useCallId = callId || uuidv4();
    console.log(`🧪 Chat test: ${message}`);
    
    const result = await qualificationAgent.processText(useCallId, message);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      callId: useCallId,
      userMessage: message,
      aiResponse: result.agentText,
      action: result.action,
      data: result.data,
      language: result.language
    });
  } catch (error) {
    console.error('❌ Chat test error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/tts', async (req, res) => {
  try {
    const { text, language } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    console.log(`🧪 Testing TTS: ${text.substring(0, 50)}... in ${language || 'hi-IN'}`);
    
    const result = await ttsService.synthesize(text, language || 'hi-IN');
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({
      success: true,
      text,
      language: language || 'hi-IN',
      audioSize: result.audio ? result.audio.length : 0,
      message: 'TTS working!'
    });
  } catch (error) {
    console.error('❌ TTS test error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/stt', async (req, res) => {
  res.json({
    message: 'STT uses Sarvam Saarika in real calls',
    note: 'Audio input required for actual STT testing'
  });
});

router.get('/status', (req, res) => {
  res.json({
    status: 'ready',
    services: {
      sarvam: 'configured',
      llm: 'sarvam-m (free)',
      tts: 'sarvam-bulbul-v2',
      stt: 'sarvam-saarika-v2'
    },
    endpoints: {
      testCall: 'POST /api/test/call',
      testChat: 'POST /api/test/chat',
      testTTS: 'POST /api/test/tts'
    }
  });
});

module.exports = router;