const llmService = require('../services/llm');
const ttsService = require('../services/tts');
const sttService = require('../services/stt');
const config = require('../config');

class QualificationAgent {
  constructor() {
    this.conversations = new Map();
    this.introMessages = {
      'hi-IN': 'Namaste, main [NAME] se baat karna chahta hoon. Kya aapko koi course join karna hai?',
      'ta-IN': 'Vanakkam, naan [NAME] theriyum. Ungalukku oru course join pannanum na?',
      'te-IN': 'Namaste, nenu [NAME] ni telsata untunnanu. Mari course join cheyyalante?',
      'kn-IN': 'Namaste, nanu [NAME] helbeku. Courses join madoke?',
      'en-IN': 'Hello, this is [NAME] calling from [Company]. May I know if you are interested in any course?'
    };
  }

  async startCall(callId, leadData) {
    console.log(`🎯 Starting qualification call ${callId} for lead:`, leadData.phone);
    
    this.conversations.set(callId, {
      leadData,
      messages: [],
      language: 'auto',
      stage: 'intro',
      startTime: Date.now()
    });
    
    const introMessage = this.getIntroMessage(leadData.name);
    return { callId, message: introMessage, stage: 'intro' };
  }

  getIntroMessage(name) {
    const defaultLang = config.languages.default;
    const template = this.introMessages[defaultLang] || this.introMessages['en-IN'];
    return template.replace('[NAME]', name || 'aap');
  }

  async processResponse(callId, audioBuffer) {
    const conversation = this.conversations.get(callId);
    if (!conversation) {
      return { error: 'Conversation not found' };
    }
    
    console.log(`📝 Processing response for call ${callId}`);
    
    const transcribeResult = await sttService.transcribe(audioBuffer);
    if (!transcribeResult.success) {
      return { error: 'Transcription failed', detail: transcribeResult.error };
    }
    
    const userText = transcribeResult.text;
    const detectedLanguage = sttService.detectLanguage(userText);
    
    if (conversation.language === 'auto') {
      conversation.language = detectedLanguage;
      console.log(`🌐 Detected language: ${detectedLanguage}`);
    }
    
    conversation.messages.push({ role: 'user', content: userText });
    
    const functions = llmService.createQualificationFunctions();
    const llmResponse = await llmService.chat(conversation.messages, functions);
    
    if (llmResponse.functionCall) {
      console.log('📋 Function call:', llmResponse.functionCall.name);
      return {
        action: llmResponse.functionCall.name,
        data: llmResponse.functionCall.arguments,
        language: conversation.language
      };
    }
    
    const agentResponse = llmResponse.content;
    conversation.messages.push({ role: 'assistant', content: agentResponse });
    
    const ttsResult = await ttsService.synthesize(agentResponse, conversation.language);
    
    return {
      success: true,
      userText,
      agentText: agentResponse,
      audio: ttsResult.audio,
      language: conversation.language,
      stage: conversation.stage
    };
  }

  async processText(callId, userText) {
    const conversation = this.conversations.get(callId);
    if (!conversation) {
      return { error: 'Conversation not found' };
    }
    
    console.log(`📝 Processing text for call ${callId}: ${userText}`);
    
    if (conversation.language === 'auto') {
      conversation.language = sttService.detectLanguage(userText);
      console.log(`🌐 Detected language: ${conversation.language}`);
    }
    
    conversation.messages.push({ role: 'user', content: userText });
    
    const functions = llmService.createQualificationFunctions();
    const llmResponse = await llmService.chat(conversation.messages, functions);
    
    if (llmResponse.functionCall) {
      console.log('📋 Function call:', llmResponse.functionCall.name);
      return {
        action: llmResponse.functionCall.name,
        data: llmResponse.functionCall.arguments,
        language: conversation.language
      };
    }
    
    const agentResponse = llmResponse.content;
    conversation.messages.push({ role: 'assistant', content: agentResponse });
    
    const ttsResult = await ttsService.synthesize(agentResponse, conversation.language);
    
    return {
      success: true,
      userText,
      agentText: agentResponse,
      audio: ttsResult.audio,
      language: conversation.language,
      stage: conversation.stage
    };
  }

  async generateResponse(callId, input) {
    if (Buffer.isBuffer(input)) {
      return this.processResponse(callId, input);
    } else {
      return this.processText(callId, input);
    }
  }

  endCall(callId) {
    const conversation = this.conversations.get(callId);
    if (conversation) {
      const duration = Math.round((Date.now() - conversation.startTime) / 1000);
      console.log(`📊 Call ${callId} ended. Duration: ${duration}s, Messages: ${conversation.messages.length}`);
      this.conversations.delete(callId);
    }
  }

  getConversation(callId) {
    return this.conversations.get(callId);
  }
}

module.exports = new QualificationAgent();