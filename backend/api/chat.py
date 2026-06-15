from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.ai.ollama_client import generate_chat_completion
from backend.database.chromadb_store import search_vector_documents

router = APIRouter(prefix="/api")

class MessageItem(BaseModel):
    role: str = Field(..., description="Either 'user' or 'assistant' or 'ai'")
    content: str = Field(..., description="Text content of the message")

class UserProfileSchema(BaseModel):
    name: str = "User"
    age: str = "30"
    gender: str = "Female"
    bloodGroup: Optional[str] = "O-Positive"
    allergies: Optional[str] = ""
    medicalHistory: Optional[str] = ""

class ChatRequest(BaseModel):
    message: str
    conversationHistory: List[MessageItem]
    userProfile: UserProfileSchema
    model: Optional[str] = "llama3.1"

class ChatResponse(BaseModel):
    response: str
    model: str
    timestamp: str
    ragDoc: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
async def post_chat(request: ChatRequest):
    """
    RAG-assisted Chat endpoint:
    1. Retrieve relevant medical documents from ChromaDB/JSON database.
    2. Build context.
    3. Generate response with Ollama LLM.
    """
    try:
        # Convert conversationHistory format for Ollama messages
        history_formatted = []
        for msg in request.conversationHistory:
            role = msg.role
            # Map 'ai' or 'assistant' role to 'assistant'
            if role == "ai":
                role = "assistant"
            history_formatted.append({"role": role, "content": msg.content})
            
        # 1. Vector Search for RAG context
        context_doc = None
        context_text = None
        
        matches = search_vector_documents(request.message, top_k=1, threshold=0.35)
        if matches:
            match = matches[0]
            context_doc = {
                "title": match["title"],
                "content": match["content"],
                "similarity": match["similarity"]
            }
            context_text = match["content"]
            
        # 2. Invoke Ollama/Fallback completion
        ai_result = generate_chat_completion(
            message=request.message,
            history=history_formatted,
            profile=request.userProfile.dict(),
            model_name=request.model,
            context=context_text
        )
        
        return ChatResponse(
            response=ai_result["response"],
            model=ai_result["model"],
            timestamp=ai_result["timestamp"],
            ragDoc=context_doc
        )
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
