"""
LiveKit Agent with Sarvam AI - Indian Languages Voice Agent
Replaces Deepgram/Groq with Sarvam for STT, LLM, and TTS
"""

import asyncio
import json
import logging
import os
import ssl
import certifi
import base64
import aiohttp
from typing import Optional

from dotenv import load_dotenv

_orig_ssl = ssl.create_default_context
def _certifi_ssl(purpose=ssl.Purpose.SERVER_AUTH, **kwargs):
    if not kwargs.get("cafile") and not kwargs.get("capath") and not kwargs.get("cadata"):
        kwargs["cafile"] = certifi.where()
    return _orig_ssl(purpose, **kwargs)
ssl.create_default_context = _certifi_ssl

from livekit import agents, api, rtc
from livekit.agents import Agent, AgentSession, AutoSubscribe, JobContext
from livekit.plugins import openai as lk_openai

load_dotenv(".env")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sarvam-agent")

# Sarvam API Configuration
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
SARVAM_BASE_URL = "https://api.sarvam.ai"

# Language mapping for Sarvam
LANGUAGE_MAP = {
    "hi": "hi-IN",  # Hindi
    "ta": "ta-IN",  # Tamil
    "te": "te-IN",  # Telugu
    "kn": "kn-IN",  # Kannada
    "bn": "bn-IN",  # Bengali
    "mr": "mr-IN",  # Marathi
    "ml": "ml-IN",  # Malayalam
    "gu": "gu-IN",  # Gujarati
    "pa": "pa-IN",  # Punjabi
    "en": "en-IN",  # English
}

# Voice mapping for Sarvam Bulbul
VOICE_MAP = {
    "shubh": "shubh",
    "aditya": "aditya",
    "ritu": "ritu",
    "priya": "priya",
    "neha": "neha",
    "rahul": "rahul",
    "pooja": "pooja",
    "rohan": "rohan",
    "simran": "simran",
    "kavya": "kavya",
    "amit": "amit",
    "dev": "dev",
    "ishita": "ishita",
    "shreya": "shreya",
    "anand": "anand",
    "roopa": "roopa",
}


class SarvamLLM:
    """Sarvam-M LLM wrapper for LiveKit"""
    
    def __init__(self, api_key: str, model: str = "sarvam-m"):
        self.api_key = api_key
        self.model = model
        self.base_url = SARVAM_BASE_URL
        self._session = None
    
    async def _get_session(self):
        if self._session is None:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def chat(self, messages: list, **kwargs) -> str:
        """Send chat request to Sarvam-M"""
        session = await self._get_session()
        
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Convert messages to Sarvam format
        sarvam_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            if role == "assistant":
                role = "model"
            sarvam_messages.append({"role": role, "content": msg.get("content", "")})
        
        payload = {
            "model": self.model,
            "messages": sarvam_messages,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 500),
        }
        
        try:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("choices", [{}])[0].get("message", {}).get("content", "")
                else:
                    logger.error(f"Sarvam LLM error: {resp.status}")
                    return "Sorry, I'm having trouble understanding. Could you please repeat?"
        except Exception as e:
            logger.error(f"Sarvam LLM exception: {e}")
            return "Sorry, something went wrong. Please try again."


class SarvamTTS:
    """Sarvam Bulbul TTS wrapper for LiveKit"""
    
    def __init__(self, api_key: str, voice: str = "shubh", language: str = "hi-IN"):
        self.api_key = api_key
        self.voice = voice
        self.language = language
        self.base_url = SARVAM_BASE_URL
        self._session = None
    
    async def _get_session(self):
        if self._session is None:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def synthesize(self, text: str) -> bytes:
        """Convert text to speech and return audio bytes"""
        session = await self._get_session()
        
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": text,
            "target_language_code": self.language,
            "model": "bulbul:v3",
            "speaker": self.voice,
            "speech_sample_rate": 24000
        }
        
        try:
            async with session.post(
                f"{self.base_url}/text-to-speech",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    audio_base64 = data.get("audio", "")
                    if audio_base64:
                        return base64.b64decode(audio_base64)
                logger.error(f"Sarvam TTS error: {resp.status}")
                return b""
        except Exception as e:
            logger.error(f"Sarvam TTS exception: {e}")
            return b""


class SarvamSTT:
    """Sarvam Saarika STT wrapper"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = SARVAM_BASE_URL
        self._session = None
    
    async def _get_session(self):
        if self._session is None:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def transcribe(self, audio_data: bytes, language_code: str = "auto") -> str:
        """Transcribe audio to text"""
        session = await self._get_session()
        
        headers = {
            "api-subscription-key": self.api_key,
        }
        
        # Encode audio to base64
        audio_base64 = base64.b64encode(audio_data).decode()
        
        payload = {
            "audio": audio_base64,
            "language_code": language_code,
            "model": "saarika:v2"
        }
        
        try:
            async with session.post(
                f"{self.base_url}/speech-to-text",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("text", "")
                logger.error(f"Sarvam STT error: {resp.status}")
                return ""
        except Exception as e:
            logger.error(f"Sarvam STT exception: {e}")
            return ""


# Simple in-memory conversation storage (would use DB in production)
conversation_history = {}


async def entrypoint(ctx: JobContext) -> None:
    """Main entrypoint for outbound calls"""
    
    logger.info(f"Job started — room: {ctx.room.name}")
    
    # Parse metadata
    phone_number = None
    lead_name = "there"
    language = "hi-IN"
    custom_prompt = None
    
    if ctx.job.metadata:
        try:
            data = json.loads(ctx.job.metadata)
            phone_number = data.get("phone_number")
            lead_name = data.get("lead_name", lead_name)
            language = data.get("language", "hi-IN")
            custom_prompt = data.get("system_prompt")
        except (json.JSONDecodeError, AttributeError):
            pass
    
    # Map language code
    if language in LANGUAGE_MAP:
        language = LANGUAGE_MAP[language]
    
    voice = "shubh"  # Default voice
    
    # Create session ID for conversation history
    session_id = f"call-{phone_number.replace('+', '')}" if phone_number else ctx.room.name
    conversation_history[session_id] = []
    
    # Connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connected to LiveKit room: {ctx.room.name}")
    
    # Initialize Sarvam services
    llm = SarvamLLM(SARVAM_API_KEY)
    tts = SarvamTTS(SARVAM_API_KEY, voice=voice, language=language)
    stt = SarvamSTT(SARVAM_API_KEY)
    
    # Build system prompt
    system_prompt = f"""You are a friendly Indian voice agent calling on behalf of Edufast. 
Your name is AI Assistant. You speak {language} naturally with a warm, conversational tone.

IMPORTANT RULES:
- Be natural, not robotic - use casual phrases like "Accha", "Hmm", "basically"
- Keep responses short and conversational (2-4 sentences max)
- If you don't understand, ask caller to repeat
- Never reveal you're an AI unless asked
- Be helpful and professional

The lead's name is {lead_name}. Start by greeting them warmly and asking if they're interested in our courses."""

    if custom_prompt:
        system_prompt = custom_prompt
    
    # Add to conversation history
    conversation_history[session_id].append({"role": "system", "content": system_prompt})
    
    # Dial the phone via Vobiz SIP trunk
    if phone_number:
        trunk_id = os.getenv("OUTBOUND_TRUNK_ID")
        if not trunk_id:
            logger.error("OUTBOUND_TRUNK_ID not set")
            ctx.shutdown()
            return
        
        try:
            await ctx.api.sip.create_sip_participant(
                api.CreateSIPParticipantRequest(
                    room_name=ctx.room.name,
                    sip_trunk_id=trunk_id,
                    sip_call_to=phone_number,
                    participant_identity=f"sip_{phone_number}",
                    wait_until_answered=True,
                )
            )
            logger.info(f"Call placed to {phone_number}")
        except Exception as e:
            logger.error(f"SIP dial failed: {e}")
            ctx.shutdown()
            return
    
    # Wait for call to be answered
    await asyncio.sleep(2)
    
    # Generate greeting
    greeting = f"Namaste {lead_name}! Main Edufast se bol raha hoon. Kya aap kisi course mein interested hain?"
    
    # Convert greeting to speech
    audio_data = await tts.synthesize(greeting)
    
    # Play audio to the room
    if audio_data:
        audio_stream = rtc.AudioFrame(
            sample_rate=24000,
            num_channels=1,
            data=audio_data
        )
        await ctx.room.publish_audio([audio_stream])
    
    # Conversation loop
    max_turns = 20
    turn_count = 0
    
    while turn_count < max_turns:
        turn_count += 1
        
        # Wait for user to speak
        user_audio = await ctx.room.receive_audio(timeout=30)
        
        if user_audio is None:
            logger.info("No audio received, ending call")
            break
        
        # Transcribe user speech
        user_text = await stt.transcribe(user_audio.data)
        
        if not user_text:
            # Send "Could you please repeat?" message
            retry_msg = "Sorry, could you please repeat?"
            audio_data = await tts.synthesize(retry_msg)
            if audio_data:
                audio_frame = rtc.AudioFrame(
                    sample_rate=24000,
                    num_channels=1,
                    data=audio_data
                )
                await ctx.room.publish_audio([audio_frame])
            continue
        
        logger.info(f"User said: {user_text}")
        
        # Add to conversation
        conversation_history[session_id].append({"role": "user", "content": user_text})
        
        # Get LLM response
        response_text = await llm.chat(conversation_history[session_id])
        
        logger.info(f"AI response: {response_text}")
        
        # Add response to history
        conversation_history[session_id].append({"role": "assistant", "content": response_text})
        
        # Convert to speech
        audio_data = await tts.synthesize(response_text)
        
        if audio_data:
            audio_frame = rtc.AudioFrame(
                sample_rate=24000,
                num_channels=1,
                data=audio_data
            )
            await ctx.room.publish_audio([audio_frame])
        
        # Check for end of call signals
        if any(word in response_text.lower() for word in ["thank you", "goodbye", "shukriya", "alvida", "end"]):
            break
    
    logger.info(f"Call ended for {phone_number}")
    ctx.shutdown()


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="sarvam-outbound-agent",
        )
    )