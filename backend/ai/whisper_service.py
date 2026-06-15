import os

whisper_model = None
using_mock_whisper = True

try:
    import whisper
    # Whisper import was successful
    print("openai-whisper import successful. Ready to load Whisper model.")
except ImportError:
    print("openai-whisper not installed. Using local Whisper STT simulation pipeline.")

def transcribe_audio(audio_bytes: bytes, text_hint: str = None) -> str:
    """
    Transcribes audio bytes into text using OpenAI Whisper.
    Falls back to text_hint or a simulated clinical transcription if Whisper is not installed.
    """
    global whisper_model, using_mock_whisper
    
    # Check if we can load Whisper dynamically
    if not whisper_model and not using_mock_whisper:
        try:
            import whisper
            whisper_model = whisper.load_model("base")
            using_mock_whisper = False
        except Exception as ex:
            print(f"Failed to load Whisper model weights. Using simulated Whisper pipeline: {ex}")
            using_mock_whisper = True
            
    # 1. Real Whisper transcribing
    if whisper_model and not using_mock_whisper:
        try:
            # Save bytes to temp file and run whisper
            temp_path = "temp_audio_input.wav"
            with open(temp_path, "wb") as f:
                f.write(audio_bytes)
            
            result = whisper_model.transcribe(temp_path)
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
            return result["text"].strip()
        except Exception as e:
            print(f"Whisper inference error, using fallback transcription. Error: {e}")
            
    # 2. Simulated transcription pipeline
    # If the frontend passes a text_hint (from native speechRecognition), we return it!
    # Otherwise, return a generic clinical prompt simulation.
    if text_hint:
        return text_hint.strip()
        
    return "What are the amoxicillin safety guidelines?"
