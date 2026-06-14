// Mock Database & Storage Layer using LocalStorage for HealthAI Companion

// Helper keys
const KEYS = {
  PROFILE: 'health_ai_profile',
  CHATS: 'health_ai_chats',
  TRACKER_LOGS: 'health_ai_tracker_logs',
  APPOINTMENTS: 'health_ai_appointments',
  REPORTS: 'health_ai_reports',
  PRIVACY: 'health_ai_privacy'
};

// Initial data for pre-populating the database (Premium experience)
const INITIAL_PROFILE = {
  name: 'Jane Doe',
  age: 32,
  gender: 'Female',
  bloodGroup: 'O-Positive',
  allergies: 'Peanuts, Penicillin',
  medicalHistory: 'Mild asthma, seasonal allergies',
  currentMedications: 'Albuterol Inhaler (as needed), Multivitamin (daily)',
  emergencyContact: 'John Doe (Husband) - +1 (555) 123-4567',
  subscriptionPlan: 'premium' // 'free' | 'premium' | 'clinic'
};

const INITIAL_CHATS = [
  {
    id: 'c-1',
    title: 'Welcome & General Queries',
    messages: [
      { sender: 'ai', text: 'Hello! I am your HealthAI Companion, a virtual assistant for general health education. How can I help you support your wellness journey today?\n\n*Please note: I cannot diagnose diseases or prescribe medication. If you are experiencing a medical emergency, please call emergency services immediately.*', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
      { sender: 'user', text: 'What are some simple ways to improve lung capacity for someone with mild asthma?', timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString() },
      { sender: 'ai', text: 'To help support lung capacity with mild asthma, general health education suggests:\n\n1. **Diaphragmatic Breathing**: Focus on breathing from the belly rather than the chest. Breathe in slowly through the nose, let your belly rise, and exhale twice as long through pursed lips.\n2. **Regular Aerobic Activity**: Gentle activities like brisk walking, swimming (in warm, humid environments), or cycling can help reinforce respiratory muscles. Always consult your doctor before starting new regimens.\n3. **Stay Hydrated**: Water helps thin the mucus in your airways, making breathing slightly easier.\n\nWould you like me to ask some follow-up questions about your current physical activity levels or asthma triggers?', timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString() }
    ]
  }
];

// Helper to calculate date string
function getOffsetDateString(daysOffset, friendlyFormat = false) {
  const d = new Date();
  if (friendlyFormat) {
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  } else {
    d.setDate(d.getDate() - daysOffset);
    return d.toISOString().split('T')[0];
  }
}

const INITIAL_TRACKER_LOGS = {
  [getOffsetDateString(4)]: { water: 1500, sleep: 7.2, exercise: 20, steps: 5200, calories: 1900, mood: 4, habits: ['Stretched in the morning'] },
  [getOffsetDateString(3)]: { water: 2000, sleep: 6.8, exercise: 45, steps: 8500, calories: 2100, mood: 3, habits: ['Stretched in the morning', 'Mindful breathing'] },
  [getOffsetDateString(2)]: { water: 2200, sleep: 8.0, exercise: 30, steps: 7200, calories: 1800, mood: 5, habits: ['Drank water before coffee'] },
  [getOffsetDateString(1)]: { water: 1800, sleep: 5.5, exercise: 15, steps: 4100, calories: 2400, mood: 2, habits: [] },
  [getOffsetDateString(0)]: { water: 1200, sleep: 7.5, exercise: 35, steps: 8200, calories: 2150, mood: 4, habits: ['Stretched in the morning', 'Mindful breathing', 'Drank water before coffee'] }
};

const INITIAL_APPOINTMENTS = [
  {
    id: 'apt-1',
    doctorId: 'doc-1',
    doctorName: 'Dr. Marcus Vance',
    doctorSpecialty: 'General Practitioner',
    date: getOffsetDateString(2, true), // 2 days in the future
    time: '10:30 AM',
    notes: 'Routine health assessment & asthma checkup',
    status: 'Confirmed'
  }
];

const INITIAL_REPORTS = [
  {
    id: 'rep-1',
    fileName: 'blood_panel_may2026.txt',
    uploadedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(), // 10 days ago
    summary: 'Routine comprehensive metabolic panel. Hemoglobin is normal at 13.8 g/dL. White blood cell counts are stable. Vitamin D level is slightly low (24 ng/mL). All other primary parameters are within the standard reference ranges.',
    explanations: [
      { term: 'Hemoglobin', definition: 'A protein in red blood cells that carries oxygen from your lungs to the rest of your body.' },
      { term: 'White Blood Cell (WBC) Count', definition: 'Cells of the immune system involved in protecting the body against infectious disease and foreign invaders.' },
      { term: 'Metabolic Panel', definition: 'A group of tests that measures different chemicals in the blood to provide info on kidneys, liver, and energy levels.' }
    ],
    doctorQuestions: [
      'Should I start taking a Vitamin D3 supplement, and if so, at what dosage?',
      'When should we re-test to see if my Vitamin D levels have normalized?',
      'Are there any dietary changes you recommend to help improve these numbers?'
    ]
  }
];

const INITIAL_PRIVACY = {
  autoDelete: 'never', // 'never' | 'logout' | '24h'
  mockEncryption: true,
  dataSharing: false,
  voiceEnabled: true,
  voiceLanguage: 'en', // 'en' | 'hi' | 'hinglish'
  speakingSpeed: 1.0,  // 0.8 to 2.0
  voiceGender: 'female', // 'female' | 'male'
  largeFontMode: false // accessibility
};

// Available Doctors Directory (Read-only reference)
export const DOCTORS = [
  { id: 'doc-1', name: 'Dr. Marcus Vance', specialty: 'General Practitioner', rating: 4.8, experience: '12 years', availability: 'Mon - Fri', location: 'Metropolitan Medical Center, Clinic Room 3B' },
  { id: 'doc-2', name: 'Dr. Sarah Jenkins', specialty: 'Cardiologist', rating: 4.9, experience: '15 years', availability: 'Tue, Thu', location: 'Heart & Vascular Suite, Room 402' },
  { id: 'doc-3', name: 'Dr. Priya Patel', specialty: 'Pediatrician', rating: 4.7, experience: '8 years', availability: 'Mon, Wed, Fri', location: 'Care For Kids Pediatric Annex' },
  { id: 'doc-4', name: 'Dr. Arthur Dent', specialty: 'Neurologist', rating: 4.9, experience: '20 years', availability: 'Wed, Fri', location: 'Neurological Sciences Block, Clinic 12' },
  { id: 'doc-5', name: 'Dr. Elena Rostova', specialty: 'Dermatologist', rating: 4.6, experience: '9 years', availability: 'Mon - Thu', location: 'Skins & Aesthetics Clinic, Suite 101' }
];

// Mock Patients assigned to clinic doctors (Clinic Plan portal feature)
export const DOCTOR_PATIENTS = [
  {
    id: 'p-1',
    name: 'Jane Doe',
    age: 32,
    gender: 'Female',
    bloodGroup: 'O-Positive',
    allergies: 'Peanuts, Penicillin',
    medicalHistory: 'Mild asthma, seasonal allergies',
    currentMedications: 'Albuterol Inhaler (as needed), Multivitamin (daily)',
    emergencyContact: 'John Doe (Husband) - +1 (555) 123-4567',
    trackers: { water: 1200, sleep: 7.5, exercise: 35, steps: 8200, calories: 2150, mood: 4, habits: ['Stretched in the morning', 'Mindful breathing'] },
    reports: [
      {
        id: 'rep-mock-1',
        fileName: 'blood_panel_may2026.txt',
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
        summary: 'Vitamin D is slightly low at 24 ng/mL. Metabolic parameters normal. Hemoglobin stands at 13.8 g/dL.'
      }
    ],
    appointments: [
      { id: 'apt-mock-1', date: getOffsetDateString(2, true), time: '10:30 AM', notes: 'Routine health assessment & asthma checkup' }
    ]
  },
  {
    id: 'p-2',
    name: 'Robert Smith',
    age: 58,
    gender: 'Male',
    bloodGroup: 'A-Negative',
    allergies: 'Sulfa Drugs',
    medicalHistory: 'Hypertension, High Cholesterol',
    currentMedications: 'Lisinopril 10mg (daily), Atorvastatin 20mg (nightly)',
    emergencyContact: 'Mary Smith (Wife) - +1 (555) 987-6543',
    trackers: { water: 1800, sleep: 6.2, exercise: 15, steps: 4500, calories: 2350, mood: 3, habits: ['Walked post-dinner'] },
    reports: [
      {
        id: 'rep-mock-2',
        fileName: 'cholesterol_lipid_panel.txt',
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        summary: 'Total Cholesterol: 245 mg/dL (High). LDL: 165 mg/dL (Elevated). Fasting blood glucose: 98 mg/dL (Normal).'
      }
    ],
    appointments: [
      { id: 'apt-mock-2', date: getOffsetDateString(3, true), time: '01:00 PM', notes: 'Cardiovascular checkup and medication review' }
    ]
  },
  {
    id: 'p-3',
    name: 'Emily Davis',
    age: 24,
    gender: 'Female',
    bloodGroup: 'B-Positive',
    allergies: 'None',
    medicalHistory: 'Type 1 Diabetes',
    currentMedications: 'Humalog Insulin (with meals), Lantus Insulin (nightly)',
    emergencyContact: 'Sarah Davis (Mother) - +1 (555) 456-7890',
    trackers: { water: 2500, sleep: 8.0, exercise: 50, steps: 11200, calories: 1950, mood: 5, habits: ['Checked glucose 4 times', 'Avoided sugary drinks'] },
    reports: [
      {
        id: 'rep-mock-3',
        fileName: 'hba1c_may2026.txt',
        uploadedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
        summary: 'HbA1c level is stable at 6.8% (optimal boundaries). Renal filtration creatinine values are standard.'
      }
    ],
    appointments: [
      { id: 'apt-mock-3', date: getOffsetDateString(5, true), time: '02:30 PM', notes: 'Endocrine checkup and glucose log review' }
    ]
  }
];

// Medicine safety catalog (Compliant general details lookup)
export const MEDICINE_KB = [
  {
    name: 'Paracetamol',
    brandName: 'Tylenol, Crocin, Calpol, Dolo',
    genericName: 'Acetaminophen',
    category: 'Analgesic & Antipyretic (Pain & Fever Relief)',
    purpose: 'Reduces fever and temporarily relieves mild-to-moderate pain.',
    commonUses: 'Headaches, muscle aches, backaches, toothaches, common cold, and fever reduction.',
    precautions: 'Do not exceed the recommended daily limit (typically 4000mg or 4g for adults). Avoid alcohol when taking this medicine. Check labels of other cold or pain medications to ensure they do not also contain paracetamol/acetaminophen.',
    sideEffects: 'Nausea, allergic skin reactions (rare), dark urine, clay-colored stools, or jaundice (yellowing of skin/eyes).',
    warnings: '🚨 Severe warning: Overdose can cause irreversible liver damage or fatal liver failure. Consult a physician if fever lasts >3 days or pain lasts >5 days.',
    guidance: 'Take 1-2 tablets (500mg-1000mg) every 4-6 hours as needed. Follow specific physician instructions. Do not take more than 8 tablets in 24 hours.',
    doctorAdvice: 'Contact a healthcare professional immediately if you experience persistent nausea, severe abdominal pain, difficulty breathing, yellowing of skin/eyes, or if symptoms worsen.',
    synonyms: ['acetaminophen', 'crocin', 'dolo', 'calpol', 'tylenol', 'paracetamol', 'fever medicine', 'pain killer']
  },
  {
    name: 'Metformin',
    brandName: 'Glucophage, Glycomet, Riomet',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic (Biguanide)',
    purpose: 'Lowers blood glucose levels and improves insulin sensitivity in patients with Type 2 Diabetes.',
    commonUses: 'Type 2 Diabetes mellitus management, gestational diabetes (off-label), PCOS treatment (off-label).',
    precautions: 'Take with meals to reduce stomach upset. Stay well-hydrated. Monitor kidney function regularly as advised by your physician.',
    sideEffects: 'Nausea, diarrhea, abdominal discomfort, metallic taste in the mouth, or mild fatigue.',
    warnings: '🚨 Severe warning: Rarely causes lactic acidosis (a serious metabolic complication). Stop use and consult a doctor immediately if you experience breathing difficulties, severe muscle aches, or extreme fatigue.',
    guidance: 'Take exactly as prescribed by your doctor. Typically started at a low dose and taken with the morning and/or evening meal.',
    doctorAdvice: 'Contact a doctor if you experience persistent diarrhea, vomiting, severe muscle fatigue, cold skin, or breathing difficulties.',
    synonyms: ['glycomet', 'glucophage', 'metformin', 'metformin hydrochloride', 'diabetes medicine']
  },
  {
    name: 'Amoxicillin',
    brandName: 'Amoxil, Mox, Moxilin, Augmentin (with clavulanic acid)',
    genericName: 'Amoxicillin',
    category: 'Penicillin Antibiotic',
    purpose: 'Treats infections caused by bacteria by stopping bacterial growth.',
    commonUses: 'Strep throat, ear infections, sinus infections, pneumonia, urinary tract infections.',
    precautions: 'Must complete the entire prescribed course even if symptoms disappear. Does not treat viral infections (flu, cold).',
    sideEffects: 'Diarrhea, nausea, vomiting, mild skin rash, or oral thrush (yeast infection).',
    warnings: '🚨 Severe warning: Can trigger severe, life-threatening allergic reactions (anaphylaxis) in penicillin-sensitive patients. Discontinue immediately and seek emergency help if hives, facial swelling, or breathing issues occur.',
    guidance: 'Take with or without food as directed by your physician. Complete the full course of treatment to prevent antibiotic resistance.',
    doctorAdvice: 'Seek immediate care for severe skin rash, watery or bloody diarrhea (even months after treatment), or swelling of the face, tongue, or throat.',
    allergyClass: 'Penicillin',
    synonyms: ['mox', 'amoxil', 'augmentin', 'amoxicillin', 'antibiotic']
  },
  {
    name: 'Atorvastatin',
    brandName: 'Lipitor, Atorva, Lipvas',
    genericName: 'Atorvastatin Calcium',
    category: 'HMG-CoA Reductase Inhibitor (Statin)',
    purpose: 'Lowers "bad" LDL cholesterol and triglycerides while raising "good" HDL cholesterol.',
    commonUses: 'Hypercholesterolemia (high cholesterol), cardiovascular disease risk reduction.',
    precautions: 'Best taken at night. Limit intake of grapefruit juice. Avoid excessive alcohol consumption. Do not use during pregnancy.',
    sideEffects: 'Joint pain, mild muscle aches, diarrhea, headache, or nosebleeds.',
    warnings: '🚨 Severe warning: May cause skeletal muscle breakdown (rhabdomyolysis) leading to kidney damage. Alert your physician immediately if you experience unexplained muscle pain, tenderness, or weakness, especially with fever or dark urine.',
    guidance: 'Take once daily, preferably in the evening, with or without food. Follow a cholesterol-lowering diet while taking this drug.',
    doctorAdvice: 'Consult your doctor immediately for persistent muscle pain or weakness, unusual fatigue, dark-colored urine, or signs of liver issues (yellowing of skin/eyes).',
    synonyms: ['lipitor', 'atorva', 'lipvas', 'atorvastatin', 'cholesterol pill']
  },
  {
    name: 'Albuterol',
    brandName: 'Ventolin, Asthalin, ProAir, Proventil',
    genericName: 'Albuterol / Salbutamol',
    category: 'Short-acting Beta-2 Agonist (Bronchodilator)',
    purpose: 'Relaxes muscles in the airways to quickly open up lungs and ease breathing.',
    commonUses: 'Relief and prevention of bronchospasm in asthma, COPD, and exercise-induced bronchospasm.',
    precautions: 'Keep your inhaler with you at all times. Do not exceed the recommended frequency of inhalations. Rinse mouth with water after use to avoid dry mouth or thrush.',
    sideEffects: 'Tremors (especially in hands), rapid heart rate (tachycardia), palpitations, nervousness, or headache.',
    warnings: '🚨 Severe warning: Overuse may indicate worsening asthma control. Seek emergency medical attention if your breathing worsens rapidly or if the inhaler does not provide relief.',
    guidance: 'Use 1-2 puffs every 4-6 hours as needed for breathing difficulties. Inhale deeply and hold your breath for 10 seconds after each puff.',
    doctorAdvice: 'Contact your physician if you need to use this inhaler more than twice a week (excluding exercise prevention) as your asthma controller medication may need adjustment.',
    synonyms: ['salbutamol', 'ventolin', 'asthalin', 'proair', 'albuterol', 'asthma inhaler']
  },
  {
    name: 'Ibuprofen',
    brandName: 'Advil, Motrin, Nurofen, Combiflam (combination)',
    genericName: 'Ibuprofen',
    category: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    purpose: 'Reduces hormones that cause pain and inflammation in the body.',
    commonUses: 'Relief of headache, dental pain, menstrual cramps, muscle aches, arthritis, and fever reduction.',
    precautions: 'Take with food, milk, or antacids to prevent stomach upset. Avoid taking with other NSAIDs (aspirin, naproxen). Monitor blood pressure.',
    sideEffects: 'Stomach ache, heartburn, bloating, nausea, vomiting, dizziness, or mild rash.',
    warnings: '🚨 Severe warning: May increase the risk of serious cardiovascular events (stroke, heart attack) and gastrointestinal bleeding or ulcers. Seek urgent care for severe abdominal pain or black tarry stools.',
    guidance: 'Take 200mg-400mg every 4-6 hours as needed. Do not exceed 1200mg per day unless directed by a doctor.',
    doctorAdvice: 'Seek medical attention for severe chest pain, shortness of breath, slurred speech, sudden weakness on one side of the body, or vomiting of blood.',
    synonyms: ['advil', 'motrin', 'combiflam', 'ibuprofen', 'nsaid', 'pain relief']
  },
  {
    name: 'Cetirizine',
    brandName: 'Zyrtec, Okacet, Reactine, Cetriz',
    genericName: 'Cetirizine Hydrochloride',
    category: 'Second-Generation Antihistamine',
    purpose: 'Blocks histamine, a substance in the body that causes allergic symptoms.',
    commonUses: 'Seasonal allergies, hay fever, hives, itching, watery eyes, sneezing, and runny nose.',
    precautions: 'May cause drowsiness, though less than older antihistamines. Avoid alcohol and driving if you feel sleepy. Use with caution if you have kidney or liver issues.',
    sideEffects: 'Drowsiness, fatigue, dry mouth, headache, or sore throat.',
    warnings: '🚨 Severe warning: Severe allergic reactions (anaphylaxis) are rare but possible. Discontinue immediately and seek emergency care for difficulty breathing, swelling of face/lips, or severe hives.',
    guidance: 'Take 1 tablet (10mg) daily, preferably in the evening to minimize daytime sleepiness.',
    doctorAdvice: 'Consult your doctor if symptoms do not improve within 7 days, or if you have difficulty urinating or severe dizziness.',
    synonyms: ['zyrtec', 'okacet', 'reactine', 'cetirizine', 'cetirizine hydrochloride', 'allergy medicine', 'allergy pill']
  },
  {
    name: 'Vitamin D3',
    brandName: 'Calcirol, D-Rise, Ultra-D3',
    genericName: 'Cholecalciferol (Vitamin D3)',
    category: 'Vitamin & Nutritional Supplement',
    purpose: 'Helps the body absorb calcium and phosphorus to support bone health and immune function.',
    commonUses: 'Treating or preventing Vitamin D deficiency, supporting bone density, maintaining immunity.',
    precautions: 'Take with meals containing dietary fat for better absorption. Do not take with other high-dose calcium or vitamin D supplements without advice.',
    sideEffects: 'No side effects are expected when taken in recommended doses. Excess dosage can lead to weakness or metallic taste.',
    warnings: '🚨 Severe warning: Vitamin D toxicity (hypercalcemia) can cause calcium buildup in the blood, leading to kidney damage, nausea, fatigue, or heart arrhythmias.',
    guidance: 'Standard maintenance is 400-2000 IU daily. High-dose weekly therapy (e.g. 60,000 IU) should only be taken as directed by a doctor.',
    doctorAdvice: 'Ask your doctor to check your blood levels (25-hydroxyvitamin D) to determine your ideal supplement regimen.',
    synonyms: ['cholecalciferol', 'vitamin d', 'd3', 'calcirol', 'd-rise', 'vitamins']
  },
  {
    name: 'Multivitamin',
    brandName: 'Centrum, One A Day, Becadexamin',
    genericName: 'Multivitamins & Minerals',
    category: 'Nutritional Supplement',
    purpose: 'Provides essential vitamins and minerals that may not be consumed through diet alone.',
    commonUses: 'Preventing vitamin deficiencies, supporting overall vitality, immune defense, and metabolism.',
    precautions: 'Do not take more than the recommended daily allowance. Do not take with other multivitamin supplements to avoid hypervitaminosis.',
    sideEffects: 'Constipation, dark stools, upset stomach, or temporary nausea.',
    warnings: '🚨 Severe warning: Accidental overdose of iron-containing supplements is a leading cause of fatal poisoning in children. Keep out of reach of children.',
    guidance: 'Take 1 tablet daily with a meal to maximize absorption and reduce potential stomach irritation.',
    doctorAdvice: 'Talk to your pharmacist or doctor if you take thyroid medications or blood thinners (like warfarin), as some vitamins can interact with them.',
    synonyms: ['centrum', 'becadexamin', 'multivitamin', 'multivitamins', 'vitamins']
  },
  {
    name: 'Lisinopril',
    brandName: 'Zestril, Prinivil',
    genericName: 'Lisinopril',
    category: 'ACE Inhibitor (Antihypertensive)',
    purpose: 'Relaxes blood vessels to lower blood pressure and improve blood flow, reducing strain on the heart.',
    commonUses: 'Treating high blood pressure (hypertension), heart failure management, improving survival after a heart attack.',
    precautions: 'Avoid potassium supplements or salt substitutes containing potassium without consulting your doctor. Stand up slowly from sitting or lying to prevent dizziness.',
    sideEffects: 'Dry cough, dizziness, headache, or increased potassium levels.',
    warnings: '🚨 Severe warning: Can cause angioedema (swelling of the face, lips, tongue, or throat), which can block breathing. Stop use and seek immediate emergency care if this occurs. Do not use during pregnancy.',
    guidance: 'Take once daily, at the same time each day, with or without food. Monitor blood pressure at home.',
    doctorAdvice: 'Contact your physician if you develop a persistent dry cough that interferes with sleep, or if you feel unusually lightheaded.',
    synonyms: ['lisinopril', 'zestril', 'prinivil', 'bp medicine', 'hypertension medicine']
  }
];

// First-Aid Guides lookup directory
export const FIRST_AID_GUIDES = [
  {
    id: 'fa-1',
    title: 'Asthma Attack emergency steps',
    steps: [
      'Sit the person upright comfortably. Do not let them lie down.',
      'Help them use their reliever inhaler (usually blue). Give 1 puff every 30-60 seconds, up to 4 puffs.',
      'Wait 4 minutes. If there is no improvement, give another 4 puffs.',
      'If the breathing difficulty is severe or worsening, call emergency services immediately.'
    ]
  },
  {
    id: 'fa-2',
    title: 'Choking First-Aid (Heimlich Maneuver)',
    steps: [
      'Stand behind the person, wrap your arms around their waist, and lean them slightly forward.',
      'Give 5 sharp back blows between the shoulder blades with the heel of your hand.',
      'If the blockage remains, perform 5 abdominal thrusts (Heimlich maneuver) by pulling inward and upward.',
      'Alternate between 5 back blows and 5 abdominal thrusts until the object is expelled or help arrives.',
      'If they lose consciousness, lower them gently to the floor and call emergency services.'
    ]
  },
  {
    id: 'fa-3',
    title: 'Minor Burns treatment',
    steps: [
      'Cool the burn immediately under cool running water for at least 10-20 minutes. Do not use ice.',
      'Remove any jewelry or clothing from the burned area before it starts to swell, unless stuck to the burn.',
      'Apply a loose, clean, sterile non-stick bandage or plastic wrap over the burn.',
      'Do not pop any blisters. Take paracetamol or ibuprofen for pain if suitable.'
    ]
  },
  {
    id: 'fa-4',
    title: 'Severe Bleeding management',
    steps: [
      'Apply direct pressure to the wound with a clean cloth, sterile dressing, or gloved hand.',
      'Keep firm, continuous pressure until the bleeding stops.',
      'If blood leaks through, apply another cloth on top without removing the original one.',
      'If possible, elevate the injured limb above the level of the heart.',
      'Call emergency services if the bleeding is severe, spurting, or does not stop after 10 minutes.'
    ]
  }
];

// Educational articles directory
export const EDUCATION_ARTICLES = [
  {
    id: 'art-1',
    title: '5 Daily Habits for a Healthier Heart',
    category: 'Cardiology & Lifestyle',
    author: 'Dr. Sarah Jenkins (Cardiologist)',
    readTime: '4 min read',
    content: 'Cardiovascular health relies heavily on consistent daily routines. Here are 5 habits to adopt today: \n\n1. **A Brisk 30-Minute Walk**: Physical activity helps lower resting heart rate and blood pressure.\n2. **Reduce Sodium Intake**: Keep sodium under 1,500mg daily to prevent arterial stiffening.\n3. **Prioritize 7+ Hours of Sleep**: Poor sleep increases cortisol, which elevates heart rate.\n4. **Increase Soluble Fiber**: Oats, beans, and berries help sweep bad cholesterol (LDL) out of circulation.\n5. **Practice Deep Breathing**: Just 5 minutes of mindful breathing relieves arterial pressure.',
    summary: 'A brief guide to lifestyle adjustments for cardiorespiratory health.'
  },
  {
    id: 'art-2',
    title: 'Understanding Your Blood Panel Parameters',
    category: 'Diagnostics & Labs',
    author: 'Dr. Marcus Vance (GP)',
    readTime: '6 min read',
    content: 'Receiving blood test results can feel overwhelming due to complex acronyms. Here is what they stand for:\n\n* **Hemoglobin (Hb)**: The protein in red cells carrying oxygen. Low levels indicate anemia.\n* **TSH (Thyroid Stimulating Hormone)**: Released by your brain to check thyroid activity. High values point to an underactive thyroid.\n* **eGFR (Estimated Glomerular Filtration Rate)**: Measures kidney filtering capacity. Scores above 90 are considered healthy.\n* **LDL/HDL Cholesterol**: LDL leads to fatty build-up in arteries, while HDL works as a sweeper to clean blood vessels.',
    summary: 'An educational breakdown of typical blood panel and kidney markers.'
  },
  {
    id: 'art-3',
    title: 'Managing Asthma Triggers in Spring',
    category: 'Respiratory Health',
    author: 'HealthAI Editorial Team',
    readTime: '3 min read',
    content: 'Springtime brings pollen and weather shifts, which are common triggers for bronchial asthma. Stay prepared with these rules:\n\n* **Monitor Pollen Counts**: Stay indoors on high-count days, especially during morning hours.\n* **Use Reliever Inhalers Promptly**: Keep your blue albuterol inhaler with you. Rinse your throat with water after using control inhalers.\n* **Wash Bedding Weekly**: Hot-water washes help clear dust mites and outdoor pollen pollen dust.\n* **Keep Windows Closed**: Rely on HEPA air filters in your living areas rather than ventilation from outside.',
    summary: 'How asthmatic patients can safeguard airways during seasonal changes.'
  }
];

// SOS Nearby hospital mock locator database
export const MOCK_HOSPITALS = [
  { name: 'Metropolitan Medical Center', distance: '1.2 miles', address: '742 Evergreen Terrace', phone: '+1 (555) 019-2831', emergencySpecialties: '24/7 Trauma, Cardiology, Pediatrics' },
  { name: 'Valley General Hospital', distance: '2.8 miles', address: '101 Pine Boulevard', phone: '+1 (555) 014-9988', emergencySpecialties: '24/7 ER, Stroke Center, Orthopedics' },
  { name: 'St. Jude Community Clinic', distance: '4.5 miles', address: '900 Oak Lane', phone: '+1 (555) 012-4411', emergencySpecialties: 'Urgent Care (8 AM - 10 PM), Family Medicine' }
];

// Initializer helper
function initLocalStorage() {
  if (!localStorage.getItem(KEYS.PROFILE)) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
  } else {
    // Migration: merge new fields like bloodGroup, currentMedications, subscriptionPlan
    const profile = JSON.parse(localStorage.getItem(KEYS.PROFILE));
    let mutated = false;
    for (const key in INITIAL_PROFILE) {
      if (profile[key] === undefined) {
        profile[key] = INITIAL_PROFILE[key];
        mutated = true;
      }
    }
    if (mutated) {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    }
  }
  if (!localStorage.getItem(KEYS.CHATS)) {
    localStorage.setItem(KEYS.CHATS, JSON.stringify(INITIAL_CHATS));
  }
  if (!localStorage.getItem(KEYS.TRACKER_LOGS)) {
    localStorage.setItem(KEYS.TRACKER_LOGS, JSON.stringify(INITIAL_TRACKER_LOGS));
  }
  if (!localStorage.getItem(KEYS.APPOINTMENTS)) {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
  }
  if (!localStorage.getItem(KEYS.REPORTS)) {
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  }
  if (!localStorage.getItem(KEYS.PRIVACY)) {
    localStorage.setItem(KEYS.PRIVACY, JSON.stringify(INITIAL_PRIVACY));
  }
}

// Run immediately upon import
initLocalStorage();

// --- DB INTERFACE METHODS ---
export const db = {
  // --- Profile ---
  getProfile() {
    return JSON.parse(localStorage.getItem(KEYS.PROFILE)) || INITIAL_PROFILE;
  },
  
  saveProfile(profileData) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profileData));
    return profileData;
  },

  // --- Chats ---
  getChats() {
    return JSON.parse(localStorage.getItem(KEYS.CHATS)) || [];
  },

  saveChats(chats) {
    localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
    return chats;
  },

  addChatSession(title = 'New Conversation') {
    const chats = this.getChats();
    const newChat = {
      id: `c-${Date.now()}`,
      title,
      messages: []
    };
    chats.unshift(newChat); // Put new chats at the top
    this.saveChats(chats);
    return newChat;
  },

  addMessageToChat(chatId, sender, text, voiceText = null, metadata = null) {
    const chats = this.getChats();
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return null;

    const message = {
      sender,
      text,
      voiceText,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    chats[chatIndex].messages.push(message);
    
    // Auto rename conversation title if it was default and has messages
    if (chats[chatIndex].title === 'New Conversation' && sender === 'user') {
      chats[chatIndex].title = text.length > 25 ? text.substring(0, 25) + '...' : text;
    }

    this.saveChats(chats);
    return message;
  },

  deleteChat(chatId) {
    let chats = this.getChats();
    chats = chats.filter(c => c.id !== chatId);
    this.saveChats(chats);
    return chats;
  },

  clearAllChats() {
    this.saveChats([]);
    return [];
  },

  // --- Trackers ---
  getTrackerLogs() {
    return JSON.parse(localStorage.getItem(KEYS.TRACKER_LOGS)) || {};
  },

  saveTrackerLogs(logs) {
    localStorage.setItem(KEYS.TRACKER_LOGS, JSON.stringify(logs));
    return logs;
  },

  getTodayLogs() {
    const todayKey = new Date().toISOString().split('T')[0];
    const logs = this.getTrackerLogs();
    if (!logs[todayKey]) {
      // Return default tracking values
      return { water: 0, sleep: 0, exercise: 0, steps: 0, calories: 0, mood: 3, habits: [] };
    }
    // Migration for existing logs that might be missing steps, calories, habits
    const tLog = logs[todayKey];
    if (tLog.steps === undefined) tLog.steps = 0;
    if (tLog.calories === undefined) tLog.calories = 0;
    if (tLog.habits === undefined) tLog.habits = [];
    return tLog;
  },

  updateTodayLog(field, value) {
    const todayKey = new Date().toISOString().split('T')[0];
    const logs = this.getTrackerLogs();
    
    if (!logs[todayKey]) {
      logs[todayKey] = { water: 0, sleep: 0, exercise: 0, steps: 0, calories: 0, mood: 3, habits: [] };
    }
    
    logs[todayKey][field] = value;
    this.saveTrackerLogs(logs);
    return logs[todayKey];
  },

  calculateWellnessScore(todayLogs = null) {
    const logs = todayLogs || this.getTodayLogs();
    
    const water = logs.water || 0;
    const sleep = logs.sleep || 0;
    const exercise = logs.exercise || 0;
    const steps = logs.steps || 0;
    const calories = logs.calories || 0;
    const mood = logs.mood || 3;
    const habitsCount = logs.habits ? logs.habits.length : 0;
    
    const waterScore = Math.min(20, (water / 2000) * 20);
    const sleepScore = Math.min(20, (sleep / 8) * 20);
    const exerciseScore = Math.min(20, (exercise / 30) * 20);
    const stepsScore = Math.min(20, (steps / 10000) * 20);
    
    // Calories score (bonus for tracking: healthy balance around 1800-2400)
    let caloriesScore = 0;
    if (calories > 0) {
      if (calories >= 1500 && calories <= 2500) caloriesScore = 10;
      else caloriesScore = 5;
    }
    
    const habitsScore = Math.min(5, habitsCount * 2.5); // Max 5 pts for habits
    const moodScore = (mood / 5) * 5; // Max 5 pts for mood
    
    const totalScore = Math.round(waterScore + sleepScore + exerciseScore + stepsScore + caloriesScore + habitsScore + moodScore);
    return Math.min(100, Math.max(0, totalScore));
  },

  // --- Appointments ---
  getAppointments() {
    return JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS)) || [];
  },

  saveAppointments(appointments) {
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
    return appointments;
  },

  bookAppointment(doctorId, doctorName, specialty, date, time, notes) {
    const appointments = this.getAppointments();
    const newApt = {
      id: `apt-${Date.now()}`,
      doctorId,
      doctorName,
      doctorSpecialty: specialty,
      date,
      time,
      notes: notes || 'General checkup',
      status: 'Confirmed'
    };
    appointments.push(newApt);
    this.saveAppointments(appointments);
    return newApt;
  },

  cancelAppointment(aptId) {
    let appointments = this.getAppointments();
    appointments = appointments.filter(a => a.id !== aptId);
    this.saveAppointments(appointments);
    return appointments;
  },

  // --- Reports ---
  getReports() {
    return JSON.parse(localStorage.getItem(KEYS.REPORTS)) || [];
  },

  saveReports(reports) {
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(reports));
    return reports;
  },

  addReport(fileName, summary, explanations, doctorQuestions) {
    const reports = this.getReports();
    const newReport = {
      id: `rep-${Date.now()}`,
      fileName,
      uploadedAt: new Date().toISOString(),
      summary,
      explanations,
      doctorQuestions
    };
    reports.unshift(newReport);
    this.saveReports(reports);
    return newReport;
  },

  deleteReport(repId) {
    let reports = this.getReports();
    reports = reports.filter(r => r.id !== repId);
    this.saveReports(reports);
    return reports;
  },

  // --- Privacy & Settings ---
  getPrivacy() {
    return JSON.parse(localStorage.getItem(KEYS.PRIVACY)) || INITIAL_PRIVACY;
  },

  savePrivacy(privacyData) {
    localStorage.setItem(KEYS.PRIVACY, JSON.stringify(privacyData));
    return privacyData;
  },

  // --- Utility Data Operations ---
  exportHealthSummary() {
    const profile = this.getProfile();
    const todayLogs = this.getTodayLogs();
    const score = this.calculateWellnessScore(todayLogs);
    const appointments = this.getAppointments();
    const reports = this.getReports();
    const trackerLogs = this.getTrackerLogs();

    let exportText = `=========================================
HEALTHAI COMPANION - EXPORTED MEDICAL SUMMARY
Exported on: ${new Date().toLocaleString()}
=========================================

1. PATIENT PROFILE
-----------------
Name: ${profile.name}
Age: ${profile.age}
Gender: ${profile.gender}
Blood Group: ${profile.bloodGroup || 'O-Positive'}
Medical History: ${profile.medicalHistory || 'None reported'}
Allergies: ${profile.allergies || 'None reported'}
Current Medications: ${profile.currentMedications || 'None reported'}
Emergency Contact: ${profile.emergencyContact || 'None reported'}
Subscription: ${profile.subscriptionPlan || 'premium'}

2. TODAY'S WELLNESS METRICS
--------------------------
Overall Wellness Score: ${score}/100
Water Intake: ${todayLogs.water} ml (Goal: 2000 ml)
Sleep Duration: ${todayLogs.sleep} hours (Goal: 8 hours)
Exercise Duration: ${todayLogs.exercise} minutes (Goal: 30 minutes)
Steps Logged: ${todayLogs.steps} steps (Goal: 10,000 steps)
Calories Consumed: ${todayLogs.calories} kcal
Current Mood Score: ${todayLogs.mood}/5
Wellness Habits: ${(todayLogs.habits && todayLogs.habits.length > 0) ? todayLogs.habits.join(', ') : 'None logged'}

3. TRACKER HISTORY (LAST 5 RECORDS)
----------------------------------
`;

    // Extract sorted dates
    const dates = Object.keys(trackerLogs).sort((a, b) => new Date(b) - new Date(a)).slice(0, 5);
    if (dates.length === 0) {
      exportText += "No historical logs found.\n";
    } else {
      dates.forEach(date => {
        const dLog = trackerLogs[date];
        exportText += `- Date: ${date} | Water: ${dLog.water}ml | Sleep: ${dLog.sleep}hrs | Exercise: ${dLog.exercise}mins | Steps: ${dLog.steps || 0} | Calories: ${dLog.calories || 0} | Mood: ${dLog.mood}/5\n`;
      });
    }

    exportText += `
4. UPCOMING APPOINTMENTS
------------------------
`;

    if (appointments.length === 0) {
      exportText += "No upcoming appointments scheduled.\n";
    } else {
      appointments.forEach((apt, index) => {
        exportText += `${index + 1}. Dr. Name: ${apt.doctorName} (${apt.doctorSpecialty})
   Date: ${apt.date} at ${apt.time}
   Notes: ${apt.notes}
   Status: ${apt.status}\n\n`;
      });
    }

    exportText += `
5. ANALYZED MEDICAL REPORTS SUMMARY
----------------------------------
`;

    if (reports.length === 0) {
      exportText += "No medical reports analyzed.\n";
    } else {
      reports.forEach((rep, index) => {
        exportText += `${index + 1}. Report Name: ${rep.fileName}
   Analyzed on: ${new Date(rep.uploadedAt).toLocaleDateString()}
   Summary of Findings: ${rep.summary}
   Explanations: ${rep.explanations.map(e => `\n    * ${e.term}: ${e.definition}`).join('')}
   Suggested Doctor Questions: ${rep.doctorQuestions.map(q => `\n    * ${q}`).join('')}\n\n`;
      });
    }

    exportText += `
=========================================
DISCLAIMER: This health summary is compiled from user inputs and AI analysis.
It is intended for general health education purposes only.
It is NOT a medical record or diagnostic document.
Always consult a doctor or healthcare professional for diagnostic advice.
=========================================`;

    return exportText;
  },

  deleteAccountData() {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.CHATS);
    localStorage.removeItem(KEYS.TRACKER_LOGS);
    localStorage.removeItem(KEYS.APPOINTMENTS);
    localStorage.removeItem(KEYS.REPORTS);
    localStorage.removeItem(KEYS.PRIVACY);
    
    // Re-initialize with blank values
    const blankProfile = { name: '', age: '', gender: '', bloodGroup: '', allergies: '', medicalHistory: '', currentMedications: '', emergencyContact: '', subscriptionPlan: 'free' };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(blankProfile));
    localStorage.setItem(KEYS.CHATS, JSON.stringify([]));
    localStorage.setItem(KEYS.TRACKER_LOGS, JSON.stringify({}));
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify([]));
    localStorage.setItem(KEYS.REPORTS, JSON.stringify([]));
    localStorage.setItem(KEYS.PRIVACY, JSON.stringify(INITIAL_PRIVACY));

    return true;
  }
};
