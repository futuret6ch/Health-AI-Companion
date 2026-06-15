import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Import routers
from backend.api.chat import router as chat_router
from backend.api.upload import router as upload_router
from backend.api.voice import router as voice_router

# Import DB and client status helpers
from backend.database.chromadb_store import using_mock_db
from backend.ai.ollama_client import check_ollama_status

app = FastAPI(
    title="HealthAI Companion API Backend",
    description="Local AI service layer providing Ollama, Whisper, and ChromaDB/Vector RAG integrations.",
    version="1.0.0"
)

# Enable CORS for frontend clients (typically running on local ports like 5173, 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local deployment ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chat_router)
app.include_router(upload_router)
app.include_router(voice_router)

@app.get("/api/health")
async def health_check():
    """
    Exposes health status indicators, including connected database type,
    Ollama server connectivity, and available models.
    """
    ollama_status = check_ollama_status()
    db_store_type = "JSONVectorStore (Fallback)" if using_mock_db else "ChromaDB (Persistent)"
    
    return {
        "status": "healthy",
        "backend": "python",
        "ollama": {
            "connected": ollama_status["connected"],
            "url": ollama_status["url"],
            "available_models": ollama_status["available_models"],
            "error": ollama_status.get("error")
        },
        "database": {
            "store_type": db_store_type,
            "vector_dimension": 1024,
            "embedding_model": "BGE-M3 (or fallback)"
        },
        "voice_stt": {
            "model": "Whisper AI STT"
        }
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
