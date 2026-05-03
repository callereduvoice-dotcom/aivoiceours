"""
LiveKit Agent with Sarvam AI - For Render Deployment
"""

import asyncio
import json
import logging
import os
import ssl
import certifi
import base64
import aiohttp
from dotenv import load_dotenv

_orig_ssl = ssl.create_default_context
def _certifi_ssl(purpose=ssl.Purpose.SERVER_AUTH, **kwargs):
    if not kwargs.get("cafile") and not kwargs.get("capath") and not kwargs.get("cadata"):
        kwargs["cafile"] = certifi.where()
    return _orig_ssl(purpose, **kwargs)
ssl.create_default_context = _certifi_ssl

from livekit import agents, api
from livekit.agents import Agent, AgentSession, AutoSubscribe, JobContext

load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sarvam-agent")

# Environment
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
LIVEKIT_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_SECRET = os.getenv("LIVEKIT_API_SECRET", "")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
VOBIZ_SIP_DOMAIN = os.getenv("VOBIZ_SIP_DOMAIN", "0fe4091c.sip.vobiz.ai")

print(f"🔧 LIVEKIT_URL: {LIVEKIT_URL}")
print(f"🔧 SARVAM_API_KEY: {SARVAM_API_KEY[:20]}..." if SARVAM_API_KEY else "🔧 SARVAM_API_KEY: NOT SET")


class SarvamLLM:
    """Sarvam-M LLM wrapper"""
    
    def __init__(self):
        self.api_key = os.getenv("SARVAM_API_KEY", "")
        self.base_url = "https://api.sarvam.ai"
        self._session = None
    
    async def _get_session(self):
        if self._session is None:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def chat(self, messages: list) -> str:
        if not self.api_key:
            return "API key not configured"
        
        session = await self._get_session()
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        sarvam_messages = [{"role": "user" if m.get("role") == "user" else "model", "content": m.get("content", "")} for m in messages]
        
        try:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json={"model": "sarvam-m", "messages": sarvam_messages, "temperature": 0.7},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("choices", [{}])[0].get("message", {}).get("content", "Sorry, I didn't understand.")
                logger.error(f"Sarvam LLM error: {resp.status}")
                return "Sorry, I'm having trouble. Could you repeat?"
        except Exception as e:
            logger.error(f"Sarvam LLM exception: {e}")
            return "Something went wrong. Please try again."


class SarvamTTS:
    """Sarvam Bulbul TTS wrapper"""
    
    def __init__(self):
        self.api_key = os.getenv("SARVAM_API_KEY", "")
        self.base_url = "https://api.sarvam.ai"
        self.voice = "shubh"
        self.language = "hi-IN"
        self._session = None
    
    async def _get_session(self):
        if self._session is None:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def synthesize(self, text: str) -> bytes:
        if not self.api_key:
            logger.error("No SARVAM_API_KEY configured")
            return b""
        
        session = await self._get_session()
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        try:
            async with session.post(
                f"{self.base_url}/text-to-speech",
                headers=headers,
                json={
                    "text": text,
                    "target_language_code": self.language,
                    "model": "bulbul:v3",
                    "speaker": self.voice
                },
                timeout=aiohttp.ClientTimeout(total=15)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    audio_base64 = data.get("audio", "")
                    if audio_base64:
                        return base64.b64decode(audio_base64)
                logger.error(f"Sarvam TTS error: {resp.status}, {await resp.text()}")
                return b""
        except Exception as e:
            logger.error(f"Sarvam TTS exception: {e}")
            return b""


# Conversation storage
conversations = {}


async def entrypoint(ctx: JobContext) -> None:
    """Main entrypoint - handles outbound calls"""
    
    logger.info(f"📞 Job started - room: {ctx.room.name}")
    
    # Get call details from metadata
    phone = None
    lead_name = "there"
    language = "hi-IN"
    
    if ctx.job.metadata:
        try:
            data = json.loads(ctx.job.metadata)
            phone = data.get("phone_number")
            lead_name = data.get("lead_name", "there")
            language = data.get("language", "hi-IN")
        except:
            pass
    
    # Connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"✅ Connected to room: {ctx.room.name}")
    
    # Initialize services
    llm = SarvamLLM()
    tts = SarvamTTS()
    
    # Set language
    tts.language = language
    
    # Session ID
    session_id = f"call-{phone.replace('+', '') if phone else ctx.room.name}"
    conversations[session_id] = []
    
    # System prompt
    system_prompt = f"""You are a friendly Indian voice assistant from Edufast. 
Name: AI Assistant
Language: {language}
Tone: Warm, conversational, natural (use words like "Accha", "Hmm", "basically")
Keep responses short (2-3 sentences).

The person you're calling is named {lead_name}. 
Greet them warmly in {language} and ask if they're interested in our courses."""

    conversations[session_id].append({"role": "system", "content": system_prompt})
    
    # Dial via SIP trunk
    if phone:
        trunk_id = os.getenv("OUTBOUND_TRUNK_ID", "")
        if not trunk_id:
            logger.error("❌ No OUTBOUND_TRUNK_ID configured")
            ctx.shutdown()
            return
        
        try:
            await ctx.api.sip.create_sip_participant(
                api.CreateSIPParticipantRequest(
                    room_name=ctx.room.name,
                    sip_trunk_id=trunk_id,
                    sip_call_to=phone,
                    participant_identity=f"sip_{phone}",
                    wait_until_answered=True,
                )
            )
            logger.info(f"📱 Calling {phone}...")
        except Exception as e:
            logger.error(f"❌ SIP dial failed: {e}")
            ctx.shutdown()
            return
    
    # Wait for connection
    await asyncio.sleep(2)
    
    # Generate greeting
    greetings = {
        "hi-IN": f"Namaste {lead_name}! Main Edufast se bol raha hoon. Kya aap kisi course mein interested hain?",
        "ta-IN": f"Vanakkam {lead_name}! Naan Edufast la irukken. Course interest aanalama?",
        "te-IN": f"Namaste {lead_name}! Nenu Edufast nundi cheptunna. Course lo interest unnada?",
        "kn-IN": f"Namaste {lead_name}! Naanu Edufast. Course nodidare?",
        "en-IN": f"Hello {lead_name}! This is from Edufast. Are you interested in our courses?"
    }
    greeting = greetings.get(language, greetings["hi-IN"])
    
    logger.info(f"🗣️ Greeting: {greeting}")
    
    # Synthesize speech
    audio = await tts.synthesize(greeting)
    if audio:
        # Would need to play audio through LiveKit
        logger.info(f"🔊 Audio synthesized: {len(audio)} bytes")
    
    # Simple conversation loop (for now - returns text response)
    # Full audio streaming requires more complex setup
    
    logger.info(f"✅ Call ready - waiting for response")
    
    # Wait a bit then end for testing
    await asyncio.sleep(5)
    
    logger.info(f"📴 Call session ended")
    ctx.shutdown()


if __name__ == "__main__":
    print("🚀 Starting Sarvam LiveKit Agent...")
    print(f"LiveKit: {LIVEKIT_URL}")
    print(f"Sarvam: {'Configured' if SARVAM_API_KEY else 'NOT CONFIGURED'}")
    
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="sarvam-ai-agent",
        )
    )