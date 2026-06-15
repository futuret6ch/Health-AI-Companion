import os
import json
from datetime import datetime
from backend.ai.embeddings import get_embedding, compute_cosine_similarity

VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "./healthcare_db")

# Default medical reference documents
DEFAULT_DOCS = [
    {
        "id": "rag-med-1",
        "category": "Medicine Information",
        "title": "Paracetamol (Acetaminophen) Clinical Profile",
        "content": "Paracetamol is a common analgesic (pain reliever) and antipyretic (fever reducer) drug. It is used to treat mild-to-moderate pain, headache, and fever. It does not possess significant anti-inflammatory properties. Typical adult dosage is 500mg-1000mg every 4-6 hours. Maximum daily limit is 4000mg (4g) to prevent acute hepatotoxicity (liver damage).",
        "keywords": "paracetamol acetaminophen pain relief fever dose limit liver toxicity"
    },
    {
        "id": "rag-med-2",
        "category": "Medicine Information",
        "title": "Amoxicillin Antibiotic Safety Guidelines",
        "content": "Amoxicillin is a moderate-spectrum beta-lactam antibiotic used to treat bacterial infections (pneumonia, strep throat, ear infections, UTI). Dosage depends on infection type and severity. Essential warning: Contraindicated in patients with a history of severe penicillin allergy. Always complete the entire prescribed course of antibiotics to prevent bacterial resistance.",
        "keywords": "amoxicillin antibiotic infection throat penicillin allergy course resistance"
    },
    {
        "id": "rag-med-3",
        "category": "Medicine Information",
        "title": "Ibuprofen (NSAID) Dosage & Warnings",
        "content": "Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) used for pain relief, reducing swelling/inflammation, and lowering fever. Side effects include gastrointestinal irritation, acid reflux, and renal (kidney) strain when used chronically. Avoid taking on an empty stomach to prevent gastric ulcers.",
        "keywords": "ibuprofen nsaid pain inflammation kidney stomach side effects ulcer"
    },
    {
        "id": "rag-rep-1",
        "category": "Medical Reports",
        "title": "Understanding Blood Sugar (HbA1c) Metrics",
        "content": "HbA1c (Glycated Hemoglobin) represents average blood glucose levels over the past 2-3 months. Normal range: below 5.7%. Prediabetes range: 5.7% to 6.4%. Diabetes range: 6.5% and higher. Monitoring HbA1c is essential to assess metabolic health, insulin resistance, and diabetes progress.",
        "keywords": "hba1c blood sugar glucose prediabetes diabetes insulin metabolic"
    },
    {
        "id": "rag-rep-2",
        "category": "Medical Reports",
        "title": "Thyroid Panel Markers (TSH & Free T4)",
        "content": "TSH (Thyroid Stimulating Hormone) regulates thyroid hormones. Normal range: 0.4 to 4.5 mIU/L. High TSH indicates hypothyroidism (underactive thyroid, leading to fatigue, weight gain, cold sensitivity). Low TSH suggests hyperthyroidism (overactive thyroid). Free T4 measures active hormone levels.",
        "keywords": "tsh thyroid metabolic hypothyroidism hyperthyroidism panel fatigue"
    },
    {
        "id": "rag-rep-3",
        "category": "Medical Reports",
        "title": "Lipid Panel & Cholesterol Indicators",
        "content": "A lipid panel measures blood fat metrics to evaluate cardiovascular health. Total cholesterol: <200 mg/dL (optimal). LDL (bad cholesterol) should be <100 mg/dL. HDL (good cholesterol) should be >40 mg/dL for men and >50 mg/dL for women. Triglycerides should be <150 mg/dL.",
        "keywords": "lipid panel cholesterol ldl hdl triglycerides heart cardiovas"
    },
    {
        "id": "rag-edu-1",
        "category": "Health Education",
        "title": "Hypertension Management Guidelines",
        "content": "Hypertension (high blood pressure) is defined as blood pressure consistently exceeding 130/80 mmHg. Lifestyle modifications: reduce dietary sodium (<2300mg/day), adopt the DASH diet (high potassium, calcium, fiber), complete 150 minutes of moderate aerobic exercise weekly, and monitor blood pressure regularly.",
        "keywords": "hypertension blood pressure bp sodium dash diet exercise weekly"
    },
    {
        "id": "rag-edu-2",
        "category": "Health Education",
        "title": "Sleep Hygiene & Fatigue Recovery",
        "content": "Chronic fatigue and tiredness are managed by aligning circadian rhythms: maintain a dark, cool sleeping room (<68°F), avoid screens/blue light for 1 hour before bedtime, limit caffeine after 2 PM, and aim for 7-9 hours of continuous sleep.",
        "keywords": "sleep fatigue insomnia tired exhaustion circadian bedtime caffeine"
    },
    {
        "id": "rag-edu-3",
        "category": "Health Education",
        "title": "Asthma and Pulmonary Management",
        "content": "Asthma symptoms include wheezing, coughing, and shortness of breath. Optimize alveolar volume via diaphragmatic breathing. Avoid cold air triggers, dust mites, and smoke. Carry a rescue albuterol inhaler at all times and follow a doctor\'s action plan.",
        "keywords": "asthma shortness of breath lung breathing wheezing albuterol inhaler"
    },
    {
        "id": "rag-faq-1",
        "category": "FAQ Answers",
        "title": "Booking and Scheduling Consultations",
        "content": "To book a virtual or clinic appointment, navigate to the Appointments tab in the sidebar navigation. Select a medical specialist (e.g. Cardiology, Pediatrics, General Medicine), select a convenient date and time slot, write doctor notes, and click book.",
        "keywords": "appointment book schedule specialist slot doctor appointments"
    },
    {
        "id": "rag-faq-2",
        "category": "FAQ Answers",
        "title": "Data Confidentiality & Storage Policy",
        "content": "All chat logs, medical reports, and health tracker details are stored strictly locally in the browser\'s localStorage. Encryption is applied to locally saved patient profiles, and records are never uploaded to remote servers or shared.",
        "keywords": "privacy storage localStorage encryption data local server confidentiality"
    },
    {
        "id": "rag-faq-3",
        "category": "FAQ Answers",
        "title": "Exporting Health Summaries & Data Logs",
        "content": "Users can export their entire health data log (including wellness tracker indexes, daily logs, and recent chat summaries) by navigating to Profile -> Export Health Summary, or through the Profile page options.",
        "keywords": "export summary logs download data details record profile"
    }
]

class JSONVectorStore:
    """
    Fail-safe fallback in-memory/JSON-file vector store.
    """
    def __init__(self, db_dir):
        self.db_dir = db_dir
        self.db_file = os.path.join(db_dir, "vector_store.json")
        self.documents = []
        os.makedirs(db_dir, exist_ok=True)
        self.load()
        
    def load(self):
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
            except Exception as e:
                print(f"Error loading JSON vector store: {e}")
                self._load_defaults()
        else:
            self._load_defaults()
            
    def _load_defaults(self):
        print("Pre-loading default medical vectors in JSON Store...")
        self.documents = []
        for doc in DEFAULT_DOCS:
            embedding = get_embedding(doc["title"] + " " + doc["content"])
            self.documents.append({
                "id": doc["id"],
                "title": doc["title"],
                "category": doc["category"],
                "content": doc["content"],
                "embedding": embedding
            })
        self.save()
        
    def save(self):
        try:
            with open(self.db_file, "w", encoding="utf-8") as f:
                json.dump(self.documents, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving JSON vector store: {e}")
            
    def add_document(self, doc_id, title, category, content, embedding=None):
        if not embedding:
            embedding = get_embedding(title + " " + content)
        # Remove existing if exists
        self.delete_document(doc_id)
        self.documents.append({
            "id": doc_id,
            "title": title,
            "category": category,
            "content": content,
            "embedding": embedding
        })
        self.save()
        
    def delete_document(self, doc_id):
        self.documents = [d for d in self.documents if d["id"] != doc_id]
        self.save()
        
    def get_all_documents(self):
        return [{
            "id": d["id"],
            "title": d["title"],
            "category": d["category"],
            "content": d["content"],
            "embedding": d["embedding"]
        } for d in self.documents]
        
    def search_similarity(self, query_embedding, top_k=3, threshold=0.3):
        scored_docs = []
        for d in self.documents:
            score = compute_cosine_similarity(query_embedding, d["embedding"])
            if score >= threshold:
                scored_docs.append({
                    "id": d["id"],
                    "title": d["title"],
                    "category": d["category"],
                    "content": d["content"],
                    "similarity": score
                })
        # Sort by similarity desc
        scored_docs.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_docs[:top_k]
        
    def reset(self):
        self._load_defaults()

# Try loading ChromaDB client
chroma_client = None
collection = None
using_mock_db = True

try:
    import chromadb
    # Initialize ChromaDB persistent client
    chroma_client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
    # Get or create collection
    collection = chroma_client.get_or_create_collection(
        name="medical_knowledge",
        metadata={"hnsw:space": "cosine"}
    )
    using_mock_db = False
    
    # Check if empty, populate default docs
    if collection.count() == 0:
        print("ChromaDB collection empty. Pre-populating default medical documents...")
        ids = []
        embeddings = []
        metadatas = []
        documents = []
        
        for doc in DEFAULT_DOCS:
            ids.append(doc["id"])
            emb = get_embedding(doc["title"] + " " + doc["content"])
            embeddings.append(emb)
            metadatas.append({
                "title": doc["title"],
                "category": doc["category"]
            })
            documents.append(doc["content"])
            
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        print("Pre-population done.")
except ImportError:
    print("ChromaDB is not installed or failed to compile. Using local JSONVectorStore.")
    using_mock_db = True
except Exception as ex:
    print(f"ChromaDB initialization failed. Falling back to local JSONVectorStore. Error: {ex}")
    using_mock_db = True

# Instantiate active store (Live ChromaDB wrapper or JSON Fallback)
if using_mock_db:
    vector_store = JSONVectorStore(VECTOR_DB_PATH)
else:
    class ChromaStoreWrapper:
        def add_document(self, doc_id, title, category, content, embedding=None):
            if not embedding:
                embedding = get_embedding(title + " " + content)
            collection.upsert(
                ids=[doc_id],
                embeddings=[embedding],
                metadatas=[{"title": title, "category": category}],
                documents=[content]
            )
            
        def delete_document(self, doc_id):
            collection.delete(ids=[doc_id])
            
        def get_all_documents(self):
            results = collection.get(include=["metadatas", "documents", "embeddings"])
            docs = []
            if results["ids"]:
                for idx in range(len(results["ids"])):
                    docs.append({
                        "id": results["ids"][idx],
                        "title": results["metadatas"][idx]["title"],
                        "category": results["metadatas"][idx]["category"],
                        "content": results["documents"][idx],
                        "embedding": results["embeddings"][idx]
                    })
            return docs
            
        def search_similarity(self, query_embedding, top_k=3, threshold=0.3):
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["metadatas", "documents", "distances"]
            )
            
            matches = []
            if results["ids"] and results["ids"][0]:
                for idx in range(len(results["ids"][0])):
                    # ChromaDB distance on cosine space: distance = 1 - cosine_similarity
                    distance = results["distances"][0][idx]
                    similarity = 1.0 - distance
                    
                    if similarity >= threshold:
                        matches.append({
                            "id": results["ids"][0][idx],
                            "title": results["metadatas"][0][idx]["title"],
                            "category": results["metadatas"][0][idx]["category"],
                            "content": results["documents"][0][idx],
                            "similarity": float(similarity)
                        })
            return matches
            
        def reset(self):
            # Clear collection and load defaults
            ids = collection.get()["ids"]
            if ids:
                collection.delete(ids=ids)
            
            ids = []
            embeddings = []
            metadatas = []
            documents = []
            for doc in DEFAULT_DOCS:
                ids.append(doc["id"])
                embeddings.append(get_embedding(doc["title"] + " " + doc["content"]))
                metadatas.append({"title": doc["title"], "category": doc["category"]})
                documents.append(doc["content"])
                
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            
    vector_store = ChromaStoreWrapper()

# Helper access wrappers
def add_vector_document(doc_id, title, category, content, embedding=None):
    vector_store.add_document(doc_id, title, category, content, embedding)

def delete_vector_document(doc_id):
    vector_store.delete_document(doc_id)

def get_vector_documents():
    return vector_store.get_all_documents()

def reset_vector_database():
    vector_store.reset()

def search_vector_documents(query_text: str, top_k=3, threshold=0.3) -> list:
    """
    Encodes the query text and retrieves matched documents exceeding threshold.
    """
    query_emb = get_embedding(query_text)
    return vector_store.search_similarity(query_emb, top_k, threshold)
