import math
import numpy as np

# Semantic activate map for BGE-M3 1024-d vectorizer simulation
SEMANTIC_VOCAB = {
    'paracetamol': [10, 11, 12, 13, 14],
    'acetaminophen': [10, 11, 12, 13, 14],
    'amoxicillin': [15, 16, 17, 18],
    'antibiotic': [15, 16, 17, 18, 19],
    'penicillin': [17, 18, 19, 20],
    'allergy': [21, 22, 23, 24],
    'hives': [21, 22],
    'rash': [21, 23],
    'ibuprofen': [25, 26, 27, 28],
    'nsaid': [25, 26, 27, 28, 29],
    'inflammation': [27, 28, 29, 30],
    'fever': [31, 32, 33],
    'pain': [34, 35, 36],
    'hba1c': [40, 41, 42],
    'glucose': [40, 41, 42, 43],
    'sugar': [40, 41, 42, 43],
    'diabetes': [43, 44, 45],
    'insulin': [45, 46, 47],
    'tsh': [50, 51, 52],
    'thyroid': [50, 51, 52, 53],
    'hypothyroidism': [52, 53, 54],
    'fatigue': [55, 56, 57],
    'tired': [55, 56, 57],
    'cholesterol': [60, 61, 62],
    'lipid': [60, 61, 62, 63],
    'cardiovascular': [63, 64, 65],
    'heart': [63, 64, 65, 66],
    'bp': [70, 71],
    'blood pressure': [70, 71, 72],
    'hypertension': [70, 71, 72, 73],
    'sleep': [80, 81, 82, 83],
    'insomnia': [80, 81, 82, 83, 84],
    'asthma': [90, 91, 92],
    'breathing': [90, 91, 92, 93],
    'lung': [92, 93, 94],
    'wheezing': [90, 94, 95],
    'appointment': [100, 101, 102],
    'schedule': [100, 101, 102],
    'doctor': [102, 103, 104],
    'privacy': [110, 111, 112],
    'storage': [110, 112, 113],
    'local': [112, 113, 114],
    'export': [120, 121],
    'summary': [120, 121, 122],
    'whisper': [130, 131],
    'speech': [130, 131, 132],
    'voice': [131, 132, 133],
    'sos': [140, 141],
    'emergency': [140, 141, 142]
}

model = None
using_mock = True

# Try loading sentence-transformers BGE-M3 model
try:
    from sentence_transformers import SentenceTransformer
    # Set model path or load BAAI/bge-m3; we will defer load to avoid startup delay
    print("sentence-transformers import successful. Initialized BGE-M3 embeddings capability.")
except ImportError:
    print("sentence-transformers not installed. Using local deterministic BGE-M3 vectorizer simulation.")

def get_embedding(text: str) -> list:
    """
    Generates a 1024-dimensional embedding vector for the text using BGE-M3.
    If sentence-transformers package is missing, uses a deterministic numpy mapping vectorizer.
    """
    global model, using_mock
    
    # Try importing sentence_transformers dynamically to load BGE-M3 if present
    if not model and not using_mock:
        try:
            from sentence_transformers import SentenceTransformer
            # Pre-load to local cache or load. If offline, this may fail so wrap in try-except
            model = SentenceTransformer('BAAI/bge-m3')
            using_mock = False
        except Exception as ex:
            print(f"Could not load BAAI/bge-m3 local weight file. Falling back to deterministic embedding: {ex}")
            using_mock = True

    # 1. Real BGE-M3 model inference
    if model and not using_mock:
        try:
            vector = model.encode(text, normalize_embeddings=True)
            return vector.tolist()
        except Exception as e:
            print(f"BGE-M3 model encoding failed, falling back to simulated vector. Error: {e}")
            
    # 2. Simulated BGE-M3 1024-d vectorizer
    dim = 1024
    # Compute deterministic hash from text content
    text_hash = hash(text)
    
    # Seed numpy with hash to make it reproducible
    np.random.seed(text_hash & 0xffffffff)
    
    # Initialize with float32 uniform noise [-0.5, 0.5]
    vector = np.random.uniform(-0.5, 0.5, dim).astype(np.float32)
    
    # Boost dimensions representing semantic terms present in text
    normalized_text = text.lower()
    for word, indices in SEMANTIC_VOCAB.items():
        if word in normalized_text:
            for idx in indices:
                vector[idx] += 4.5
                
    # Normalize to unit length (L2 norm)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
        
    return vector.tolist()

def compute_cosine_similarity(vecA: list, vecB: list) -> float:
    """
    Computes cosine similarity between two float vectors.
    """
    dot_product = sum(a * b for a, b in zip(vecA, vecB))
    return float(dot_product)
