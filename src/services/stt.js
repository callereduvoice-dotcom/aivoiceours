const axios = require('axios');
const config = require('../config');

class STTService {
  constructor() {
    this.model = config.stt.model;
    this.projectId = config.stt.googleProjectId;
  }

  async transcribe(audioBuffer) {
    console.log('🔊 Transcribing audio...');
    
    try {
      const base64Audio = audioBuffer.toString('base64');
      
      const response = await axios.post(
        'https://api.sarvam.ai/speech-to-text',
        {
          audio: base64Audio,
          model: 'saarika:v2',
          language_code: 'auto',
          punctuate: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': process.env.SARVAM_API_KEY || ''
          }
        }
      );
      
      console.log('✅ Transcription:', response.data.text);
      return {
        success: true,
        text: response.data.text,
        language: response.data.language_code || 'auto'
      };
    } catch (error) {
      console.error('❌ STT failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async transcribeStream(audioChunk) {
    return this.transcribe(audioChunk);
  }

  detectLanguage(text) {
    const hindiChars = /[\u0900-\u097F]/;
    const tamilChars = /[\u0B80-\u0BFF]/;
    const teluguChars = /[\u0C00-\u0C7F]/;
    const kannadaChars = /[\u0C80-\u0CFF]/;
    
    if (hindiChars.test(text)) return 'hi-IN';
    if (tamilChars.test(text)) return 'ta-IN';
    if (teluguChars.test(text)) return 'te-IN';
    if (kannadaChars.test(text)) return 'kn-IN';
    return 'en-IN';
  }
}

module.exports = new STTService();