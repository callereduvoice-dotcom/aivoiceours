const axios = require('axios');
const config = require('../config');

class LLMService {
  constructor() {
    this.sarvamApiKey = process.env.SARVAM_API_KEY;
    this.useSarvam = true; 
    this.model = 'sarvam-m';
  }

  async chat(messages, functions = null) {
    console.log('🤖 Processing with Sarvam-M (FREE)...');
    
    const systemPrompt = this.getSystemPrompt();
    
    try {
      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];
      
      const response = await axios.post(
        'https://api.sarvam.ai/chat/completions',
        {
          model: 'sarvam-m',
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.sarvamApiKey
          }
        }
      );
      
      const result = response.data.choices[0].message;
      
      console.log('✅ Sarvam-M Response:', result.content?.substring(0, 100));
      return { success: true, content: result.content };
    } catch (error) {
      console.error('❌ LLM failed:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  getSystemPrompt() {
    return `You are an educational counselor calling from a premier coaching center in India. Your goal is to qualify leads for various courses.

LANGUAGES: You MUST detect and respond in the caller's language (Hindi, Tamil, Telugu, Kannada, or English). The language code will be provided in the conversation context.

CALL FLOW:
1. Greet politely: "Namaste/Hello, this is [Name] from [Company]. May I speak with [Lead Name]?"
2. Ask about interest: "Are you looking to enroll in any course?"
3. Probe for details:
   - Budget range they're considering
   - Which specific course interests them
   - When they're looking to start
   - Best time to follow up
4. Capture intent and categorize:
   - "Interested" - wants to know more, asking questions, willing to share details
   - "Not Interested" - explicitly says no, not looking, not the right time
   - "Callback" - interested but wants to call back later, needs more time to decide

IMPORTANT RULES:
- NEVER disclose that you are an AI - act as a human representative
- Keep responses conversational, natural, and concise
- Adapt to the caller's language seamlessly
- If caller asks a question you don't know, say "Let me check and get back to you"
- End calls politely regardless of outcome
- At the end, provide the status in this format:
  STATUS: interested/not_interested/callback
  BUDGET: [budget mentioned]
  COURSE: [course interested]
  TIMING: [preferred timing]
  NOTES: [any other notes]

Capture ALL relevant information.`;
  }

  createQualificationPrompt(userMessage, conversationHistory) {
    return `${conversationHistory}
User: ${userMessage}

Analyze the user's response and determine their interest level. Then respond appropriately in their language.

Provide your response in this JSON format:
{
  "status": "interested|not_interested|callback",
  "budget": "budget mentioned or null",
  "course_interest": "course mentioned or null", 
  "preferred_timing": "timing mentioned or null",
  "notes": "any relevant notes",
  "response": "your spoken response to the user"
}`;
  }
}

module.exports = new LLMService();