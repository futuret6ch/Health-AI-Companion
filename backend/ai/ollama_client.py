import os
import requests
import json
from datetime import datetime

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.1")

# Clinical Educational fallback responses for offline LLM mode
HEALTHCARE_FALLBACKS = {
    "emergency": (
        "⚠️ **CRITICAL EMERGENCY WARNING**\n\n"
        "Your symptoms indicate a high-priority cardiovascular or respiratory emergency. "
        "Please seek immediate medical help. Call emergency services (911/112/102/108) or go to the nearest emergency room immediately.\n\n"
        "Do not wait for AI assessments in emergency conditions."
    ),
    "paracetamol": (
        "### Medicine Information: Paracetamol (Acetaminophen)\n\n"
        "- **Generic Name:** Acetaminophen\n"
        "- **Category:** Analgesic (pain reliever) & Antipyretic (fever reducer)\n"
        "- **General Uses:** Temporary relief of mild-to-moderate pain (headaches, muscle aches, sore throat) and lowering fever.\n"
        "- **Precautions:** Do not exceed 4,000 mg (4g) within a 24-hour period. Heavy dosage can lead to severe hepatotoxicity (liver damage).\n"
        "- **Side Effects:** Nausea, stomach pain, or allergic skin reactions.\n\n"
        "*(Note: Consult a physician before starting new medications. Do not adjust prescribed doses.)*"
    ),
    "amoxicillin": (
        "### Medicine Information: Amoxicillin\n\n"
        "- **Generic Name:** Amoxicillin\n"
        "- **Category:** Beta-lactam Antibiotic (moderate-spectrum)\n"
        "- **General Uses:** Treating bacterial infections (throat, respiratory, ear, or UTI).\n"
        "- **Safety Warning:** Penicillin allergy history is a strict contraindication. Severe allergic reactions (anaphylaxis) can occur.\n"
        "- **Important Advice:** Always complete the entire course prescribed by your physician to avoid antibiotic resistance.\n\n"
        "*(Note: Antibiotics do not treat viral infections. Consult a healthcare provider.)*"
    ),
    "hypertension": (
        "### Health Education: Hypertension Management\n\n"
        "Hypertension refers to blood pressure consistently exceeding 130/80 mmHg.\n\n"
        "**Recommended Lifestyle Modifications:**\n"
        "1. Reduce dietary sodium intake (<2,300 mg per day).\n"
        "2. Adopt the DASH (Dietary Approaches to Stop Hypertension) diet (rich in potassium and calcium).\n"
        "3. Commit to 150 minutes of moderate aerobic exercise weekly.\n"
        "4. Monitor your blood pressure regularly using an automated cuff.\n\n"
        "*(Note: Maintain regular follow-ups with your doctor. Do not alter prescribed antihypertensive dosages.)*"
    ),
    "asthma": (
        "### Health Education: Asthma & Pulmonary Care\n\n"
        "Asthma is a chronic respiratory condition characterized by airway hyper-responsiveness and wheezing.\n\n"
        "**General Guidance:**\n"
        "- Avoid known environmental triggers: cold air, dust mites, pollen, and cigarette smoke.\n"
        "- Practice diaphragmatic breathing exercises to optimize lung volumes.\n"
        "- Ensure your rescue albuterol inhaler is with you at all times.\n"
        "- Establish a written Asthma Action Plan with your pulmonologist.\n\n"
        "*(Note: Seek urgent medical attention if you experience severe shortness of breath or if rescue inhalers fail to work.)*"
    ),
    "default": (
        "### General Health Information\n\n"
        "Thank you for reaching out to HealthAI Companion. "
        "As your local healthcare assistant, I can share educational resources on medical topics to help you formulate questions for your doctor.\n\n"
        "**General Wellness Best Practices:**\n"
        "- Aim for 7-9 hours of restful sleep daily.\n"
        "- Maintain adequate hydration (approx 2-3 liters of water daily).\n"
        "- Stay active with at least 30 minutes of moderate movement daily.\n\n"
        "*(Reminder: This information is for general education only and does not substitute for professional medical advice, diagnosis, or treatment. If you are experiencing symptoms, please consult a qualified healthcare provider.)*"
    )
}

def generate_chat_completion(message, history, profile, model_name=None, context=None):
    """
    Sends the conversation prompt to the local Ollama LLM service.
    If Ollama is offline, falls back to a rules-based medical response engine.
    """
    if not model_name:
        model_name = DEFAULT_MODEL
        
    system_prompt = (
        "You are HealthAI Companion, a professional, calm, and friendly AI clinical assistant.\n"
        "Rules:\n"
        "1. Provide general educational health information only.\n"
        "2. NEVER diagnose diseases or prescribe medicines.\n"
        "3. NEVER suggest specific dosages or adjustments to active prescriptions.\n"
        "4. Encourage consulting a qualified healthcare professional in every medical response.\n"
        "5. If high-risk emergency symptoms (e.g. chest pain, severe shortness of breath, loss of consciousness) are detected, immediately advise seeking urgent emergency care.\n"
        "6. Translate complex biochemistry or clinical terms into simple, understandable analogies for the patient."
    )
    
    if context:
        system_prompt += f"\n\nRetrieved Medical RAG Context:\n{context}\nUse this context to inform your educational answer, referencing it where appropriate."
        
    # Standard emergency symptom keywords for fallback detection
    emergency_keywords = [
        "chest pain", "breathing difficulty", "shortness of breath", "severe bleeding", 
        "slurred speech", "numbness", "paralysis", "loss of consciousness", "anaphylaxis"
    ]
    
    # 1. Attempt to send request to local Ollama API
    try:
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                *history[-10:], # Send the last 10 messages for context
                {"role": "user", "content": message}
            ],
            "stream": False,
            "options": {
                "temperature": 0.5
            }
        }
        
        response = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=8)
        if response.status_code == 200:
            result = response.json()
            return {
                "response": result["message"]["content"],
                "model": model_name,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
    except Exception as e:
        print(f"Ollama local server not responding. Falling back to local clinical response template. Error: {e}")
        
    # 2. Local Fallback Generator
    normalized_msg = message.lower()
    
    # Check for emergency triggers
    is_emergency = any(kw in normalized_msg for kw in emergency_keywords)
    if is_emergency:
        reply = HEALTHCARE_FALLBACKS["emergency"]
    elif "paracetamol" in normalized_msg or "acetaminophen" in normalized_msg:
        reply = HEALTHCARE_FALLBACKS["paracetamol"]
    elif "amoxicillin" in normalized_msg or "penicillin" in normalized_msg:
        reply = HEALTHCARE_FALLBACKS["amoxicillin"]
    elif "bp" in normalized_msg or "blood pressure" in normalized_msg or "hypertension" in normalized_msg:
        reply = HEALTHCARE_FALLBACKS["hypertension"]
    elif "asthma" in normalized_msg or "breathing" in normalized_msg or "wheezing" in normalized_msg:
        reply = HEALTHCARE_FALLBACKS["asthma"]
    else:
        # Prepend RAG context to fallback reply if available
        if context:
            reply = f"🔍 *[Retrieved Medical Knowledge (RAG)]*\n> \"{context}\"\n\n{HEALTHCARE_FALLBACKS['default']}"
        else:
            reply = HEALTHCARE_FALLBACKS["default"]
            
    # Format reply with simulation notice
    simulation_banner = f"💡 *[Ollama server offline - Running Local Clinical engine: {model_name} (Simulated)]*\n\n"
    reply = simulation_banner + reply
    
    return {
        "response": reply,
        "model": f"{model_name} (Simulated)",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def check_ollama_status():
    """
    Checks connection to local Ollama server and lists available models.
    """
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        if response.status_code == 200:
            data = response.json()
            models = [m["name"] for m in data.get("models", [])]
            return {
                "connected": True,
                "url": OLLAMA_URL,
                "available_models": models
            }
        else:
            return {
                "connected": False,
                "url": OLLAMA_URL,
                "available_models": [],
                "error": f"Ollama HTTP {response.status_code}"
            }
    except Exception as e:
        return {
            "connected": False,
            "url": OLLAMA_URL,
            "available_models": [],
            "error": str(e)
        }

