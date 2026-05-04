const express = require('express');
const router = express.Router();
const axios = require('axios');

// Your Edufast Knowledge Base
const KNOWLEDGE_BASE = {
  "program_overview": "Edufast helps students complete recognized degree programs faster through accredited universities, with end-to-end support from admission to career guidance.",
  "fast_track": "It's an accelerated learning model based on your previous qualifications, allowing you to complete your degree efficiently without skipping learning.",
  "validity": "Yes, the programs are delivered through accredited and recognized universities following proper academic frameworks.",
  "pricing": "Costs depend on your profile and program. A counsellor will provide exact details based on your eligibility.",
  "process": "It follows a 3-step process: profile assessment, guided coursework, and final degree completion with full support.",
  "eligibility": "Eligibility depends on your academic background. Working professionals, students, and individuals with education gaps can apply.",
  "career": "Yes, upgrading your qualification can support career growth, promotions, and new opportunities.",
  "support": "You receive full guidance from admission to completion, including academic and career support."
};

const GREETING_HI = "Namaste! Main Edufast se bol raha hoon. Hum degree programs complete karne mein help karte hain. Kya aap apni education upgrade karna chahte hain?";
const GREETING_EN = "Hello! This is from Edufast. We help students complete recognized degree programs. Are you interested in upgrading your education?";
const GREETING_TA = "Vanakkam! Edufast la irukken. Degree program completion la help pannuvomen. Ungalukku education upgrade venuma?";
const GREETING_TE = "Namaste! Nenu Edufast nundi. Degree complete cheyataniki help chestunna. Nuvvu education upgrade cheyabadhira?";

router.all('/vobiz/answer', async (req, res) => {
  try {
    const { CallUUID, From, To } = req.body || req.query || {};
    
    console.log(`📞 INCOMING CALL from ${From}`);
    
    // Detect language from phone number (India = hi-IN default)
    // In production, you'd use STT to detect
    
    // Use Hindi greeting for now
    const greeting = GREETING_HI;
    
    const vobizXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak language="hi-IN">${greeting}</Speak>
  <Gather numDigits="1" timeout="20" finishOnKey="#">
    <Speak language="hi-IN">Press 1 for program details. Press 2 for eligibility. Press 3 to speak with counsellor.</Speak>
  </Gather>
  <Hangup/>
</Response>`;
    
    console.log('📤 Sending response with Edufast greeting');
    res.type('text/xml').send(vobizXml);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>');
  }
});

router.post('/vobiz/dtmf', async (req, res) => {
  try {
    const { CallUUID, Digits } = req.body;
    
    console.log(`🔢 User pressed: ${Digits}`);
    
    let response = "";
    
    switch (Digits) {
      case "1":
        response = KNOWLEDGE_BASE.program_overview + " " + "Main details ke liye press 1, eligibility ke liye press 2, counsellor se baat ke liye press 3.";
        break;
      case "2":
        response = KNOWLEDGE_BASE.eligibility + " " + "Exact eligibility ke liye humare counsellor se baat karein. Press 3 to connect.";
        break;
      case "3":
        response = "Connecting you to our counsellor. Please wait. Humari team jald hi aapse contact karegi. Thank you!";
        break;
      default:
        response = "Thank you for calling Edufast. Good luck with your education journey!";
    }
    
    const vobizXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak language="hi-IN">${response}</Speak>
  <Hangup/>
</Response>`;
    
    res.type('text/xml').send(vobizXml);
    
  } catch (error) {
    res.send('OK');
  }
});

router.post('/vobiz/hangup', (req, res) => {
  const { CallUUID, Duration, CallStatus } = req.body;
  console.log(`📴 Call ended: ${CallUUID}, Duration: ${Duration}s, Status: ${CallStatus}`);
  res.send('OK');
});

router.get('/test', (req, res) => {
  const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak language="hi-IN">Namaste! This is Edufast test call. Press 1 to know about programs.</Speak>
  <Gather numDigits="1" timeout="10" finishOnKey="#">
    <Speak language="hi-IN">Press 1 for details.</Speak>
  </Gather>
  <Hangup/>
</Response>`;
  res.type('text/xml').send(testXml);
});

module.exports = router;