from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from datetime import datetime
from backend.ai.whisper_service import transcribe_audio

router = APIRouter(prefix="/api")

@router.post("/voice")
async def post_voice(
    file: UploadFile = File(...),
    text_hint: Optional[str] = Form(None)
):
    """
    Transcribes incoming microphone audio bytes into text.
    Uses Whisper STT with text hint fallbacks for high accuracy.
    """
    try:
        # 1. Read raw audio bytes
        audio_bytes = await file.read()
        
        # 2. Run Whisper transcribing
        transcript = transcribe_audio(audio_bytes, text_hint)
        
        # Return Whisper transcribed string
        return {
            "text": transcript,
            "model": "Whisper AI STT",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        print(f"Error in voice endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Speech-to-Text transcribing failed: {str(e)}")
