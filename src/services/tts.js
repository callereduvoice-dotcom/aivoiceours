const axios = require('axios');
const config = require('../config');

class TTSService {
  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY;
    this.baseUrl = 'https://api.sarvam.ai';
    
    this.voiceMapping = {
      'hi-IN': 'bulbul:v2',
      'ta-IN': 'bulbul:v2',
      'te-IN': 'bulbul:v2',
      'kn-IN': 'bulbul:v2',
      'en-IN': 'bulbul:v2'
    };
  }

  async synthesize(text, languageCode = 'hi-IN') {
    console.log(`🔊 Synthesizing with Sarvam: "${text?.substring(0, 50)}..." in ${languageCode}`);
    
    const targetLanguage = this.mapLanguageCode(languageCode);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech`,
        {
          inputs: [text],
          target_language: targetLanguage,
          model: 'bulbul:v2',
          voice_config: {
            enable: true
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this.apiKey
          },
          responseType: 'arraybuffer'
        }
      );
      
      console.log('✅ Sarvam TTS generated:', response.data.length, 'bytes');
      return {
        success: true,
        audio: Buffer.from(response.data),
        format: 'audio',
        language: targetLanguage
      };
    } catch (error) {
      console.error('❌ Sarvam TTS failed:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  mapLanguageCode(code) {
    const mapping = {
      'hi-IN': 'hi',
      'ta-IN': 'ta',
      'te-IN': 'te',
      'kn-IN': 'kn',
      'en-IN': 'en',
      'mr-IN': 'mr',
      'bn-IN': 'bn',
      'gu-IN': 'gu',
      'ml-IN': 'ml',
      'pa-IN': 'pa'
    };
    return mapping[code] || 'hi';
  }

  async synthesizeStream(text, languageCode) {
    return this.synthesize(text, languageCode);
  }

  getVoiceForLanguage(languageCode) {
    return this.voiceMapping[languageCode] || 'bulbul:v2';
  }
}

module.exports = new TTSService();