const express = require('express');
const router = express.Router();

router.all('/vobiz/answer', async (req, res) => {
  // Handle both GET and POST
  try {
    const { CallUUID, From, To, RequestUUID } = req.body || req.query;
    
    console.log(`📞 INCOMING CALL: CallUUID=${CallUUID}, From=${From}, To=${To}`);
    console.log('📥 Method:', req.method, 'Body:', JSON.stringify(req.body || {}));
    
    // Simple Hindi greeting using Vobiz TTS
    const greeting = "Namaste, main aapko baat kar raha hoon. Kya aap kisi course mein interested hain?";
    
    const vobizXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak language="hi-IN">${greeting}</Speak>
  <Gather numDigits="1" timeout="15" finishOnKey="#">
    <Speak language="hi-IN">Press 1 for admission details. Press 2 to speak with advisor.</Speak>
  </Gather>
  <Speak language="hi-IN">Thank you. Goodbye.</Speak>
  <Hangup/>
</Response>`;
    
    console.log('📤 Sending XML to Vobiz');
    res.type('text/xml').send(vobizXml);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
  }
});
  try {
    const { CallUUID, From, To, RequestUUID } = req.body;
    
    console.log(`📞 INCOMING CALL: CallUUID=${CallUUID}, From=${From}, To=${To}`);
    console.log('📥 Full body:', JSON.stringify(req.body));
    
    // Simple Hindi greeting - Vobiz TTS
    const greeting = "Namaste, main aapko baat kar raha hoon. Kya aap kisi course mein interested hain?";
    
    const vobizXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak language="hi-IN">${greeting}</Speak>
  <Gather numDigits="1" timeout="10" finishOnKey="#">
    <Speak language="hi-IN">Press 1 for admission details. Press 2 to speak with advisor.</Speak>
  </Gather>
  <Speak language="hi-IN">Thank you. Goodbye.</Speak>
  <Hangup/>
</Response>`;
    
    console.log('📤 Sending XML to Vobiz:', vobizXml);
    res.type('text/xml').send(vobizXml);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
  }
});

router.post('/vobiz/hangup', async (req, res) => {
  try {
    const { CallUUID, Duration, CallStatus } = req.body;
    console.log(`📴 CALL ENDED: CallUUID=${CallUUID}, Duration=${Duration}s, Status=${CallStatus}`);
    res.send('OK');
  } catch (error) {
    res.send('OK');
  }
});

router.post('/vobiz/dtmf', async (req, res) => {
  try {
    const { CallUUID, Digits } = req.body;
    console.log(`🔢 DTMF: CallUUID=${CallUUID}, Pressed: ${Digits}`);
    
    let message = "";
    if (Digits === "1") {
      message = "Sure, hum admission ke baare mein baat karte hain. Kya aap kaunsa course dekhna chahte hain?";
    } else if (Digits === "2") {
      message = "Connecting you to our advisor. Please wait.";
    } else {
      message = "Thank you for calling. Goodbye.";
    }
    
    const vobizXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak voice="WOMAN" language="hi-IN">${message}</Speak>
  <Gather numDigits="1" timeout="10" finishOnKey="#">
    <Speak voice="WOMAN" language="hi-IN">Press 1 for more details. Press 2 to end.</Speak>
  </Gather>
  <Hangup/>
</Response>`;
    
    res.send(vobizXml);
  } catch (error) {
    res.send('OK');
  }
});

router.post('/vobiz/machine-detection', async (req, res) => {
  console.log('🤖 Machine detection event');
  res.send('OK');
});

router.post('/exotel', async (req, res) => {
  console.log('📞 Exotel webhook');
  res.send('OK');
});

router.post('/exotel/callback', async (req, res) => {
  console.log('📞 Exotel callback');
  res.send('OK');
});

router.get('/test', (req, res) => {
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak language="hi-IN">Namaste, ye test call hai. Press 1 to continue.</Speak>
  <Gather numDigits="1" timeout="10" finishOnKey="#">
    <Speak language="hi-IN">Press 1 for details.</Speak>
  </Gather>
  <Hangup/>
</Response>`;
  res.type('text/xml').send(testXml);
});

module.exports = router;