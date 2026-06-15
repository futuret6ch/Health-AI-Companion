// RAG Engine using BGE-M3 1024-dimensional embeddings simulation

// Initial Healthcare Knowledge Base (RAG Reference Documents)
export const INITIAL_RAG_DOCUMENTS = [
  // 1. Medicine Information
  {
    id: 'rag-med-1',
    category: 'Medicine Information',
    title: 'Paracetamol (Acetaminophen) Clinical Profile',
    content: 'Paracetamol is a common analgesic (pain reliever) and antipyretic (fever reducer) drug. It is used to treat mild-to-moderate pain, headache, and fever. It does not possess significant anti-inflammatory properties. Typical adult dosage is 500mg-1000mg every 4-6 hours. Maximum daily limit is 4000mg (4g) to prevent acute hepatotoxicity (liver damage).',
    keywords: 'paracetamol acetaminophen pain relief fever dose limit liver toxicity'
  },
  {
    id: 'rag-med-2',
    category: 'Medicine Information',
    title: 'Amoxicillin Antibiotic Safety Guidelines',
    content: 'Amoxicillin is a moderate-spectrum beta-lactam antibiotic used to treat bacterial infections (pneumonia, strep throat, ear infections, UTI). Dosage depends on infection type and severity. Essential warning: Contraindicated in patients with a history of severe penicillin allergy. Always complete the entire prescribed course of antibiotics to prevent bacterial resistance.',
    keywords: 'amoxicillin antibiotic infection throat penicillin allergy course resistance'
  },
  {
    id: 'rag-med-3',
    category: 'Medicine Information',
    title: 'Ibuprofen (NSAID) Dosage & Warnings',
    content: 'Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) used for pain relief, reducing swelling/inflammation, and lowering fever. Side effects include gastrointestinal irritation, acid reflux, and renal (kidney) strain when used chronically. Avoid taking on an empty stomach to prevent gastric ulcers.',
    keywords: 'ibuprofen nsaid pain inflammation kidney stomach side effects ulcer'
  },
  // 2. Medical Reports
  {
    id: 'rag-rep-1',
    category: 'Medical Reports',
    title: 'Understanding Blood Sugar (HbA1c) Metrics',
    content: 'HbA1c (Glycated Hemoglobin) represents average blood glucose levels over the past 2-3 months. Normal range: below 5.7%. Prediabetes range: 5.7% to 6.4%. Diabetes range: 6.5% and higher. Monitoring HbA1c is essential to assess metabolic health, insulin resistance, and diabetes progress.',
    keywords: 'hba1c blood sugar glucose prediabetes diabetes insulin metabolic'
  },
  {
    id: 'rag-rep-2',
    category: 'Medical Reports',
    title: 'Thyroid Panel Markers (TSH & Free T4)',
    content: 'TSH (Thyroid Stimulating Hormone) regulates thyroid hormones. Normal range: 0.4 to 4.5 mIU/L. High TSH indicates hypothyroidism (underactive thyroid, leading to fatigue, weight gain, cold sensitivity). Low TSH suggests hyperthyroidism (overactive thyroid). Free T4 measures active hormone levels.',
    keywords: 'tsh thyroid metabolic hypothyroidism hyperthyroidism panel fatigue'
  },
  {
    id: 'rag-rep-3',
    category: 'Medical Reports',
    title: 'Lipid Panel & Cholesterol Indicators',
    content: 'A lipid panel measures blood fat metrics to evaluate cardiovascular health. Total cholesterol: <200 mg/dL (optimal). LDL (bad cholesterol) should be <100 mg/dL. HDL (good cholesterol) should be >40 mg/dL for men and >50 mg/dL for women. Triglycerides should be <150 mg/dL.',
    keywords: 'lipid panel cholesterol ldl hdl triglycerides heart cardiovas'
  },
  // 3. Health Education
  {
    id: 'rag-edu-1',
    category: 'Health Education',
    title: 'Hypertension Management Guidelines',
    content: 'Hypertension (high blood pressure) is defined as blood pressure consistently exceeding 130/80 mmHg. Lifestyle modifications: reduce dietary sodium (<2300mg/day), adopt the DASH diet (high potassium, calcium, fiber), complete 150 minutes of moderate aerobic exercise weekly, and monitor blood pressure regularly.',
    keywords: 'hypertension blood pressure bp sodium dash diet exercise weekly'
  },
  {
    id: 'rag-edu-2',
    category: 'Health Education',
    title: 'Sleep Hygiene & Fatigue Recovery',
    content: 'Chronic fatigue and tiredness are managed by aligning circadian rhythms: maintain a dark, cool sleeping room (<68°F), avoid screens/blue light for 1 hour before bedtime, limit caffeine after 2 PM, and aim for 7-9 hours of continuous sleep.',
    keywords: 'sleep fatigue insomnia tired exhaustion circadian bedtime caffeine'
  },
  {
    id: 'rag-edu-3',
    category: 'Health Education',
    title: 'Asthma and Pulmonary Management',
    content: 'Asthma symptoms include wheezing, coughing, and shortness of breath. Optimize alveolar volume via diaphragmatic breathing. Avoid cold air triggers, dust mites, and smoke. Carry a rescue albuterol inhaler at all times and follow a doctor\'s action plan.',
    keywords: 'asthma shortness of breath lung breathing wheezing albuterol inhaler'
  },
  // 4. FAQ Answers
  {
    id: 'rag-faq-1',
    category: 'FAQ Answers',
    title: 'Booking and Scheduling Consultations',
    content: 'To book a virtual or clinic appointment, navigate to the Appointments tab in the sidebar navigation. Select a medical specialist (e.g. Cardiology, Pediatrics, General Medicine), select a convenient date and time slot, write doctor notes, and click book.',
    keywords: 'appointment book schedule specialist slot doctor appointments'
  },
  {
    id: 'rag-faq-2',
    category: 'FAQ Answers',
    title: 'Data Confidentiality & Storage Policy',
    content: 'All chat logs, medical reports, and health tracker details are stored strictly locally in the browser\'s localStorage. Encryption is applied to locally saved patient profiles, and records are never uploaded to remote servers or shared.',
    keywords: 'privacy storage localStorage encryption data local server confidentiality'
  },
  {
    id: 'rag-faq-3',
    category: 'FAQ Answers',
    title: 'Exporting Health Summaries & Data Logs',
    content: 'Users can export their entire health data log (including wellness tracker indexes, daily logs, and recent chat summaries) by navigating to Profile -> Export Health Summary, or through the Profile page options.',
    keywords: 'export summary logs download data details record profile'
  }
];

// Helper to calculate L2 norm
function calculateL2Norm(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

// Generate a 1024-dimensional mock embedding (simulating BGE-M3 dense representation)
export function generateBgem3Embedding(text) {
  const dim = 1024;
  const vector = new Float32Array(dim);
  
  // Seed hash deterministically based on text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Initialize deterministic noise in [-0.5, 0.5]
  for (let i = 0; i < dim; i++) {
    const val = Math.sin(hash + i * 13) * 10000;
    vector[i] = val - Math.floor(val) - 0.5;
  }
  
  // Map specific healthcare words to dense dimensions to represent semantic concepts
  const vocabularyMap = {
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
  };
  
  const normalized = text.toLowerCase();
  Object.keys(vocabularyMap).forEach(key => {
    if (normalized.includes(key)) {
      const idxs = vocabularyMap[key];
      idxs.forEach(idx => {
        vector[idx] += 4.5; // Inject highly activated features for similar semantic concepts
      });
    }
  });
  
  // Normalize vector using L2 norm (making dot product equivalent to cosine similarity)
  const norm = calculateL2Norm(vector);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] /= norm;
    }
  }
  
  return Array.from(vector);
}

// Compute cosine similarity between two normalized vector arrays
export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  const len = Math.min(vecA.length, vecB.length, 1024);
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

// Vector Database Class
class VectorDatabase {
  constructor() {
    this.documents = [];
    this.loadFromStorage();
  }
  
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('health_rag_vectors');
      if (stored) {
        this.documents = JSON.parse(stored);
      } else {
        // Build initial database and generate embeddings for them
        this.documents = INITIAL_RAG_DOCUMENTS.map(doc => ({
          ...doc,
          embedding: generateBgem3Embedding(doc.title + " " + doc.content)
        }));
        this.saveToStorage();
      }
    } catch (e) {
      console.error("Failed to load vector database:", e);
      this.documents = INITIAL_RAG_DOCUMENTS.map(doc => ({
        ...doc,
        embedding: generateBgem3Embedding(doc.title + " " + doc.content)
      }));
    }
  }
  
  saveToStorage() {
    try {
      localStorage.setItem('health_rag_vectors', JSON.stringify(this.documents));
    } catch (e) {
      console.error("Failed to save vector database:", e);
    }
  }
  
  getAllDocuments() {
    return this.documents;
  }
  
  addDocument(title, category, content) {
    const id = `rag-custom-${Date.now()}`;
    const newDoc = {
      id,
      title,
      category,
      content,
      embedding: generateBgem3Embedding(title + " " + content)
    };
    this.documents.push(newDoc);
    this.saveToStorage();
    return newDoc;
  }
  
  deleteDocument(id) {
    this.documents = this.documents.filter(d => d.id !== id);
    this.saveToStorage();
  }
  
  resetDatabase() {
    localStorage.removeItem('health_rag_vectors');
    this.loadFromStorage();
  }
  
  // Similarity Search
  search(query, topK = 3, threshold = 0.3) {
    const queryVec = generateBgem3Embedding(query);
    const results = this.documents.map(doc => {
      const score = cosineSimilarity(queryVec, doc.embedding);
      return {
        ...doc,
        similarity: score
      };
    });
    
    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Filter by threshold
    const filtered = results.filter(r => r.similarity >= threshold);
    
    return {
      queryVector: queryVec,
      allResults: results,
      topMatches: filtered.slice(0, topK)
    };
  }
}

export const vectorDb = new VectorDatabase();
