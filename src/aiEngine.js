// AI Engine Simulation Module for HealthAI Companion
// Enforces strict safety rules, emergency detection, multilingual support, voice optimizations, and Medical Knowledge Base (RAG) retrieval
import { MEDICINE_KB } from './mockDb';
import { vectorDb } from './ragEngine';

// Medical RAG Knowledge Base (Reference Documents)
const MEDICAL_RAG_KB = [
  {
    id: 'doc-rag-1',
    title: 'NIH Asthma Care Guidelines (Section 3)',
    keywords: ['asthma', 'breathing', 'lung', 'shortness of breath', 'wheezing', 'breath'],
    content: 'Diaphragmatic breathing helps optimize alveolar volume. Asthmatic patients should use non-blocking routines under guidance and avoid sudden cold air triggers.'
  },
  {
    id: 'doc-rag-2',
    title: 'AHA Hypertension Clinical Guideline (2025)',
    keywords: ['hypertension', 'blood pressure', 'systolic', 'diastolic', 'heart', 'cholesterol', 'bp'],
    content: 'Hypertension is defined by blood pressure consistently exceeding 130/80 mmHg. Lifestyle modifications including low sodium intake, aerobic activity, and cardiovascular tracking are recommended.'
  },
  {
    id: 'doc-rag-3',
    title: 'CDC Flu and Respiratory Viral Guide (2026)',
    keywords: ['cough', 'fever', 'flu', 'sore throat', 'cold', 'virus', 'coughing', 'temperat'],
    content: 'Viral coughs and fevers generally resolve with supportive care: hydration, steam inhalation, rest, and antipyretics if advised by a clinician. Antibiotics do not treat viral infections.'
  },
  {
    id: 'doc-rag-4',
    title: 'WHO Allergy Management Guidelines',
    keywords: ['allergy', 'allergies', 'allergic', 'peanut', 'rash', 'hives', 'itch'],
    content: 'Standard allergy management relies on strict avoidance of triggers. Anaphylaxis is a severe systemic response (throat tightening, breathlessness) requiring emergency intramuscular epinephrine.'
  },
  {
    id: 'doc-rag-5',
    title: 'Harvard Health Sleep and Energy Guidelines',
    keywords: ['fatigue', 'tired', 'sleep', 'energy', 'insomnia', 'exhaustion', 'tiredness'],
    content: 'Chronic fatigue is linked with sleep fragmentation, poor diet, or stress. Maintaining a dark sleep environment, checking for thyroid markers (TSH), and mild exercise support standard energy cycles.'
  }
];

// List of high-priority emergency phrases that trigger immediate alert warnings (multilingual)
const EMERGENCY_KEYWORDS = [
  'chest pain', 'chest tightness', 'chest pressure', 'crushing chest', 
  'difficulty breathing', 'shortness of breath', 'can\'t breathe', 'breathless',
  'sudden numbness', 'sudden weakness', 'face drooping', 'slurred speech', 'arm weakness',
  'anaphylaxis', 'allergic shock', 'throat closing', 'swelling face throat',
  'coughing blood', 'severe head injury', 'loss of consciousness', 'fainted and fell',
  'sudden severe headache', 'worst headache of life', 'sudden vision loss', 'blurry vision sudden',
  'heavy bleeding', 'unconscious', 'behosh', 'chhati me dard', 'saas nahi aa rahi', 'khoon behna',
  'chhati me dabav', 'chhati me jakdan', 'saas lene me takleef'
];

// Multilingual Health Education responses for common symptoms/questions (English, Hindi, Hinglish)
const EDUCATIONAL_KB = {
  en: {
    headache: {
      summary: 'Headaches can have various common triggers, including stress, dehydration, lack of sleep, or muscle tension. Generally, primary headaches are not dangerous but can cause discomfort.',
      advice: 'Stay hydrated, rest in a quiet and dark room, apply a warm or cool compress to your head or neck, and maintain a consistent sleep schedule.',
      causes: ['Tension headache', 'Dehydration', 'Migraine', 'Eye strain', 'Lack of sleep'],
      questions: 'How long has this headache been occurring? Is it localized to one side of your head? Have you experienced any nausea?',
      voiceSummary: 'Headaches are often triggered by stress, dehydration, or tension. I recommend resting in a quiet, dark room, drinking plenty of water, and keeping a consistent sleep schedule. How long have you had this headache?'
    },
    fever: {
      summary: 'A fever is usually a sign that your body is fighting off an infection. It is defined as a body temperature of 100.4°F (38°C) or higher.',
      advice: 'Get plenty of rest, drink fluids (water, clear broths, herbal tea) to prevent dehydration, and dress in light clothing.',
      causes: ['Viral infection (like cold or flu)', 'Bacterial infection', 'Inflammation', 'Immunization reaction'],
      questions: 'What is your current body temperature? Do you have a sore throat, cough, body aches, or a rash?',
      voiceSummary: 'A fever means your body is fighting off an infection. Get plenty of rest, drink fluids like water or clear broths, and dress lightly. What is your temperature, and do you have any other symptoms?'
    },
    cough: {
      summary: 'Coughing is a natural reflex that helps clear your airways of irritants and mucus. It can be acute (short-term) or chronic.',
      advice: 'Stay hydrated with warm liquids, use a humidifier or inhale steam from a shower, and consider honey (for adults and children over 1 year) to soothe throat irritation.',
      causes: ['Common cold', 'Mild bronchitis', 'Post-nasal drip', 'Environmental irritants (smoke, dust)', 'Allergies'],
      questions: 'Are you coughing up any phlegm, and if so, what color is it? Do you have asthma, and how long has the cough lasted?',
      voiceSummary: 'Coughing helps clear your airways. Sip warm liquids, use a humidifier, and try some honey if you are over one year old. Are you coughing up any phlegm, and does it have a color?'
    },
    'sore throat': {
      summary: 'A sore throat is characterized by pain, scratchiness, or irritation of the throat that often worsens when you swallow. Most sore throats are caused by viral infections.',
      advice: 'Gargle with warm salt water (1/2 tsp salt in 1 cup warm water), sip warm liquids like honey-lemon water, and rest your voice.',
      causes: ['Viral sore throat (pharyngitis)', 'Streptococcal infection (Strep throat)', 'Allergies / dry air', 'Acid reflux'],
      questions: 'Have you noticed any white patches on your tonsils? Do you have a fever, or are your glands in the neck swollen?',
      voiceSummary: 'Sore throats are usually viral. Try gargling with warm salt water, sipping honey-lemon tea, and resting your voice. Have you noticed any white patches on your tonsils?'
    },
    fatigue: {
      summary: 'General fatigue is a state of constant tiredness, lack of energy, or exhaustion. It is a common symptom with many possible physical and lifestyle causes.',
      advice: 'Focus on sleep hygiene, eat a balanced diet rich in whole foods, engage in light physical activity like walking, and reduce stress levels.',
      causes: ['Inadequate sleep', 'High stress or burnout', 'Poor nutrition / low iron', 'Sedentary lifestyle', 'Mild thyroid issues'],
      questions: 'How many hours of sleep do you get nightly? Have you experienced any changes in appetite or mood recently?',
      voiceSummary: 'General fatigue can stem from poor sleep, stress, or nutrition. Focus on sleep hygiene, eat a balanced diet, and walk daily. How many hours of sleep are you getting?'
    }
  },
  hi: {
    headache: {
      summary: 'सिरदर्द के कई सामान्य कारण हो सकते हैं, जैसे तनाव, निर्जलीकरण (पानी की कमी), नींद की कमी या मांसपेशियों में खिंचाव। आमतौर पर प्राथमिक सिरदर्द खतरनाक नहीं होते हैं लेकिन असुविधा पैदा कर सकते हैं।',
      advice: 'भरपूर पानी पिएं, शांत और अंधेरे कमरे में आराम करें, अपने सिर या गर्दन पर गर्म या ठंडी पट्टी लगाएं, और सोने का एक नियमित समय बनाए रखें।',
      causes: ['तनाव जनित सिरदर्द', 'पानी की कमी', 'माइग्रेन', 'आंकड़ों पर जोर', 'नींद की कमी'],
      questions: 'यह सिरदर्द कितने समय से हो रहा है? क्या यह सिर के एक ही तरफ है? क्या आपको उल्टी महसूस हो रही है?',
      voiceSummary: 'सिरदर्द तनाव, पानी की कमी या थकावट से हो सकता है। शांत कमरे में आराम करें, पर्याप्त पानी पिएं, और नियमित समय पर सोएं। आपको यह सिरदर्द कब से है?'
    },
    fever: {
      summary: 'बुखार आमतौर पर इस बात का संकेत है कि आपका शरीर किसी संक्रमण से लड़ रहा है। इसे 100.4°F (38°C) या उससे अधिक के शरीर के तापमान के रूप में परिभाषित किया जाता है।',
      advice: 'भरपूर आराम करें, निर्जलीकरण को रोकने के लिए तरल पदार्थ (पानी, सूप, हर्बल चाय) पिएं, और हल्के कपड़े पहनें।',
      causes: ['वायरल संक्रमण (जैसे सर्दी या फ्लू)', 'बैक्टीरियल संक्रमण', 'सूजन', 'टीकाकरण के बाद की प्रतिक्रिया'],
      questions: 'आपका वर्तमान तापमान कितना है? क्या आपको गले में खराश, खांसी, शरीर में दर्द या चकत्ते हैं?',
      voiceSummary: 'बुखार का मतलब है शरीर संक्रमण से लड़ रहा है। भरपूर आराम करें, पानी और हर्बल चाय पिएं, और हल्के कपड़े पहनें। आपका तापमान कितना है और क्या कोई और तकलीफ है?'
    },
    cough: {
      summary: 'खांसी एक प्राकृतिक प्रतिक्रिया है जो आपके श्वसन मार्ग को बलगम और अन्य चीजों से साफ रखने में मदद करती है। यह तीव्र (अल्पकालिक) या पुरानी हो सकती है।',
      advice: 'गर्म तरल पदार्थों के साथ खुद को हाइड्रेटेड रखें, ह्यूमिडिफायर का उपयोग करें या गर्म पानी की भाप लें, और गले की जलन को शांत करने के लिए शहद का उपयोग करें (1 वर्ष से अधिक उम्र के लोगों के लिए)।',
      causes: ['सामान्य सर्दी', 'हल्का ब्रोंकाइटिस', 'पोस्ट-नेजल ड्रिप', 'धुआं या धूल', 'एलर्जी'],
      questions: 'क्या आपको बलगम वाली खांसी है, और यदि हां, तो उसका रंग क्या है? क्या आपको अस्थमा है, और खांसी कितने समय से है?',
      voiceSummary: 'खांसी श्वसन मार्ग को साफ करने के लिए है। गुनगुना पानी पिएं, भाप लें और शहद का सेवन करें। क्या आपको खांसी में बलगम आ रहा है?'
    },
    'sore throat': {
      summary: 'गले में खराश की विशेषता गले में दर्द, खुजली या जलन है जो अक्सर निगलने पर बदतर हो जाती है। अधिकांश खराश वायरल संक्रमण के कारण होती है।',
      advice: 'गर्म नमक वाले पानी से गरारे करें (1 कप गुनगुने पानी में आधा चम्मच नमक), नींबू-शहद वाला गुनगुना पानी पिएं और अपनी आवाज को आराम दें।',
      causes: ['वायरल ग्रसनीशोथ', 'स्ट्रेप्टोकोकल संक्रमण (बैक्टीरियल)', 'एलर्जी / शुष्क हवा', 'एसिड रिफ्लक्स'],
      questions: 'क्या आपने अपने टॉन्सिल पर कोई सफेद धब्बे देखे हैं? क्या आपको बुखार है, या गर्दन की ग्रंथियों में सूजन है?',
      voiceSummary: 'गले की खराश अक्सर वायरल होती है। गुनगुने नमक के पानी से गरारे करें, शहद-नींबू पानी पिएं और गले को आराम दें। क्या टॉन्सिल पर सफेद धब्बे हैं?'
    },
    fatigue: {
      summary: 'सामान्य थकान निरंतर थकावट, ऊर्जा की कमी या कमजोरी की स्थिति है। यह कई शारीरिक और जीवन शैली के कारणों से जुड़ा एक सामान्य लक्षण है।',
      advice: 'नींद की आदतों में सुधार करें, पोषक तत्वों से भरपूर संतुलित आहार लें, हल्की शारीरिक गतिविधि जैसे टहलना शुरू करें, और तनाव को कम करें।',
      causes: ['अपर्याप्त नींद', 'उच्च तनाव या काम का बोझ', 'खराब पोषण / आयरन की कमी', 'गतिहीन जीवन शैली', 'हल्की थायराइड समस्याएं'],
      questions: 'आप रोजाना कितने घंटे सोते हैं? क्या हाल ही में आपकी भूख या मूड में कोई बदलाव आया है?',
      voiceSummary: 'सामान्य थकान नींद की कमी, तनाव या खराब आहार से हो सकती है। सोने की आदत सुधारें, पोषक भोजन खाएं और सैर करें। आप रात में कितने घंटे सोते हैं?'
    }
  },
  hinglish: {
    headache: {
      summary: 'Headache ke piche kai aam triggers ho sakte hain jaise stress, dehydration (paani ki kami), neend ki kami, ya muscle tension. Aam taur par primary headache dangerous nahi hote par pareshani badhate hain.',
      advice: 'Hydrated rahein, shaant aur andhere kamre me rest karein, sir ya gardan par halki thandi compress lagayein, aur sleep schedule maintain karein.',
      causes: ['Tension headache', 'Dehydration', 'Migraine trigger', 'Eye strain', 'Lack of sleep'],
      questions: 'Ye headache kab se ho raha hai? Kya ye sir ke ek side me ho raha hai? Kya aapko vomiting ya nausea feel ho raha hai?',
      voiceSummary: 'Headache stress, paani ki kami ya neend na aane se ho sakta hai. Andhere kamre me rest karein, paani peeyein, aur sleep time fix rakhein. Ye dard kab se ho raha hai?'
    },
    fever: {
      summary: 'Fever is baat ka sign hai ki aapki body infection se lad rahi hai. Jab temperature 100.4°F (38°C) ya usse zyada ho to use fever kaha jata hai.',
      advice: 'Pura rest karein, dehydration se bachne ke liye fluids (paani, soup, herbal tea) peeyein, aur halke kapde pehnein.',
      causes: ['Viral infection (cold or flu)', 'Bacterial infection', 'Inflammation', 'Vaccination reaction'],
      questions: 'Aapka current temperature kitna hai? Sore throat, cough, body pain, ya rash hai?',
      voiceSummary: 'Fever ka matlab hai body infection se lad rahi hai. Rest karein, paani, soup ya herbal tea peeyein, aur light kapde pehnein. Aapka temperature kitna hai?'
    },
    cough: {
      summary: 'Cough ek natural reflex hai jo respiratory track ko saaf rakhne me help karta hai. Ye short-term (acute) ya long-term (chronic) ho sakta hai.',
      advice: 'Garam paani ya liquid peeyein, humidifier use karein ya steam lein, aur throat irritation ke liye honey (shahat) ka use karein.',
      causes: ['Common cold', 'Mild bronchitis', 'Post-nasal drip', 'Smoke or dust irritation', 'Allergies'],
      questions: 'Kya cough ke sath balgam (phlegm) aa raha hai, aur uska color kya hai? Asthma hai kya, aur cough kab se hai?',
      voiceSummary: 'Cough lungs ko saaf rakhne ke liye hai. Garam liquids peeyein, bhaap lein, aur shehad use karein. Kya balgam aa raha hai?'
    },
    'sore throat': {
      summary: 'Sore throat me gale me dard, kharash, ya irritation hoti hai jo kuch swallo karne par aur badh jati hai. Mostly ye viral infection se hota hai.',
      advice: 'Gungune namak ke paani se gargle karein (kulla karein), honey-lemon tea jaise garam liquids peeyein aur throat ko rest dein.',
      causes: ['Viral sore throat', 'Strep throat (bacterial)', 'Dry air / allergies', 'Acid reflux'],
      questions: 'Kya tonsils par white patches hain? Fever ya neck glands me swelling hai?',
      voiceSummary: 'Gale me kharash mostly viral hoti hai. Gungune namak ke paani se gargle karein, honey-lemon tea peeyein aur voice ko rest dein. Kya tonsils par white spots hain?'
    },
    fatigue: {
      summary: 'General fatigue ka matlab hai constant thakawat, energy ki kami, ya exhaustion feel hona. Ye low physical activity ya lifestyle issues se ho sakta hai.',
      advice: 'Sleep hygiene improve karein, green vegetables aur balanced food lein, walk karein aur stress kam karein.',
      causes: ['Neend ki kami', 'High stress or burnout', 'Poor nutrition / low iron', 'No exercise', 'Mild thyroid issues'],
      questions: 'Aap daily kitne ghante sote hain? Appetite (bhook) ya mood me koi change hua hai kya?',
      voiceSummary: 'Fatigue sleep ki kami, stress ya galat khane se ho sakta hai. Achhi neend lein, balanced food khayein, aur walking karein. Aap kitne ghante sote hain?'
    }
  }
};

const MEDICAL_GLOSSARY = {
  'hemoglobin': 'A protein in red blood cells that carries oxygen from your lungs to the rest of your body.',
  'wbc': 'White Blood Cells, which are the immune system cells that fight infections and foreign invaders.',
  'rbc': 'Red Blood Cells, which carry oxygen throughout your body.',
  'platelets': 'Tiny blood cell fragments that help your blood clot to stop bleeding.',
  'creatinine': 'A waste product filtered by the kidneys. High levels can suggest your kidneys are not filtering efficiently.',
  'cholesterol': 'A waxy fat-like substance found in your blood. High LDL is often called "bad" cholesterol.',
  'bilirubin': 'A yellowish pigment made during the normal breakdown of red blood cells. High levels can point to liver issues.',
  'tsh': 'Thyroid Stimulating Hormone. It regulates your metabolism, and high/low levels indicate thyroid activity differences.',
  'glucose': 'Blood sugar, which is the primary source of energy for your body\'s cells. Elevated levels can indicate diabetes risk.',
  'hypertension': 'High blood pressure, meaning the force of blood pushing against your artery walls is consistently too high.',
  'tachycardia': 'A heart rate that is faster than normal (typically over 100 beats per minute at rest).',
  'benign': 'Non-cancerous; a growth or finding that does not spread or invade surrounding tissues.'
};

// Check if query contains emergency symptoms
export function detectEmergency(query) {
  const normalized = query.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => normalized.includes(keyword));
}

// Search RAG Knowledge Base using BGE-M3 Vector Database Similarity
export function searchKnowledgeBase(query) {
  // Retrieve the top matched document using cosine similarity
  const searchResult = vectorDb.search(query, 1, 0.35);
  if (searchResult.topMatches.length > 0) {
    const match = searchResult.topMatches[0];
    return {
      id: match.id,
      title: match.title,
      content: match.content,
      similarity: match.similarity
    };
  }
  return null;
}

// Search Medicine safety database
export function searchMedicines(query) {
  if (!query) return null;
  const normalized = query.toLowerCase().trim();
  
  // Try exact name or synonym match
  const matched = MEDICINE_KB.find(med => 
    med.name.toLowerCase() === normalized || 
    med.synonyms.some(s => s.toLowerCase() === normalized)
  );

  if (matched) return matched;

  // Try partial match
  return MEDICINE_KB.find(med => 
    med.name.toLowerCase().includes(normalized) || 
    med.synonyms.some(s => s.toLowerCase().includes(normalized))
  ) || null;
}

// Calculate health risk score and wellness feedback (No diagnosis)
export function calculateHealthRisk(answers) {
  const { sleep, diet, activity, smoking, stress } = answers;
  
  const sleepVal = parseFloat(sleep) || 7;
  const activityVal = parseFloat(activity) || 0;
  const stressVal = parseInt(stress) || 3;
  const smokingVal = smoking === 'yes' || smoking === true;

  let score = 100;
  const riskFactors = [];
  const recommendations = [];

  // Evaluate Sleep
  if (sleepVal < 6) {
    score -= 15;
    riskFactors.push("Sleep Fragmentation / Short Sleep Duration (<6 hrs)");
    recommendations.push("Increase sleep duration to 7-8 hours to support endocrine stability and emotional recovery.");
  } else if (sleepVal > 9) {
    score -= 5;
    riskFactors.push("Potential Hypersomnia (>9 hrs)");
    recommendations.push("Align sleep cycle with consistent bedtime routines.");
  }

  // Evaluate Exercise Activity
  if (activityVal < 1.5) {
    score -= 20;
    riskFactors.push("Sedentary Lifestyle (<1.5 active hours weekly)");
    recommendations.push("Initiate low-impact aerobic exercise (brisk walking, cycling) aiming for at least 150 minutes weekly.");
  } else if (activityVal >= 5) {
    recommendations.push("Excellent cardiovascular training habit maintained.");
  }

  // Evaluate Stress
  if (stressVal >= 4) {
    score -= 15;
    riskFactors.push("Elevated Chronic Stress Indicators");
    recommendations.push("Incorporate structured cognitive decompression sessions (mindful breathing, progressive muscle relaxation).");
  }

  // Evaluate Smoking
  if (smokingVal) {
    score -= 30;
    riskFactors.push("Active Nicotine/Tobacco Exposure");
    recommendations.push("Tobacco cessation is the single most critical intervention to minimize cardiovascular and pulmonary risks.");
  }

  // Evaluate Diet
  if (diet === 'poor' || diet === '1') {
    score -= 15;
    riskFactors.push("Nutrient-Deficient Dietary Intake");
    recommendations.push("Shift dietary patterns toward whole foods, prioritizing green vegetables, soluble fibers, and reducing refined sugars.");
  }

  // Cap score limits
  score = Math.min(100, Math.max(10, score));

  // Determine category
  let category = "Low Risk Profile";
  if (score < 55) {
    category = "High Risk Profile";
  } else if (score < 80) {
    category = "Moderate Risk Profile";
  }

  return {
    wellnessScore: score,
    category,
    riskFactors,
    recommendations,
    disclaimer: "Disclaimer: This risk assessment evaluates general lifestyle parameters for educational purposes. It is not a clinical diagnostic assessment or cardiovascular event calculator. Consult your doctor."
  };
}

// Generate concise AI synthesis dossier for physicians
export function getAiPatientSummary(patient) {
  if (!patient) return '';
  const { name, age, gender, medicalHistory, allergies, currentMedications, trackers, reports } = patient;
  
  const historyText = medicalHistory ? `chronic history of ${medicalHistory}` : 'no chronic history';
  const allergyText = allergies ? `allergies: ${allergies}` : 'no known allergies';
  const medsText = currentMedications ? `under medication regimen: ${currentMedications}` : 'no active medications';
  
  const recentSteps = trackers?.steps ? `${trackers.steps} steps` : 'steps unlogged';
  const recentSleep = trackers?.sleep ? `${trackers.sleep} hours sleep` : 'sleep unlogged';
  const recentScore = trackers ? `wellness index of ${trackers.water}ml water and mood ${trackers.mood}/5` : '';
  
  const reportsCount = reports?.length || 0;
  const recentReportText = reportsCount > 0 ? `latest findings include: ${reports[0].summary}` : 'no recently analyzed lab files';

  return `Patient ${name} (${age}yo ${gender}) presents with a ${historyText}. Confirmed ${allergyText} and ${medsText}. Recent activity parameters track at ${recentSteps}, ${recentSleep}, and today's ${recentScore}. The ${recentReportText}. Clinical oversight is advised to optimize primary therapeutic adherence.`;
}

// Generate Chat Response (Simulating LLM with safety hooks, RAG retrieval, and medicine lookup checks)
export function getChatResponse(query, chatHistory = [], profile = {}, isVoiceMode = false, voiceLang = 'en', attachmentType = null, attachmentName = null, reports = []) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Normalizing language code mapping
      let lang = 'en';
      if (voiceLang === 'hi-IN' || voiceLang === 'hi') lang = 'hi';
      else if (voiceLang === 'hinglish') lang = 'hinglish';

      const normalizedQuery = query.toLowerCase();

      // 1. Emergency Check (Multilingual)
      if (detectEmergency(query)) {
        let text = '';
        let voiceText = '';

        if (lang === 'hi') {
          text = `🚨 **आपातकालीन कार्रवाई की आवश्यकता है** 🚨

आपके द्वारा बताए गए लक्षणों के आधार पर, यह एक **गंभीर चिकित्सा आपातकाल** (जैसे दिल का दौरा, सांस लेने में अत्यधिक कठिनाई या स्ट्रोक) हो सकता है।

**आपको तुरंत क्या करना चाहिए:**
1. **बिना किसी देरी के आपातकालीन सेवाओं (जैसे 102, 108 या अपने नजदीकी अस्पताल) को फोन करें।**
2. खुद गाड़ी चलाकर अस्पताल न जाएं; आपातकालीन चिकित्सा वाहन का इंतजार करें।
3. अपने किसी आपातकालीन संपर्क को सूचित करें।

*अस्वीकरण: मैं एक एआई सहायक हूँ। यह चिकित्सकीय सलाह नहीं है। तुरंत डॉक्टर से संपर्क करें।*`;
          
          voiceText = 'चेतावनी। यह आपातकालीन लक्षण हो सकते हैं। कृपया तुरंत आपातकालीन चिकित्सा सहायता प्राप्त करें या एम्बुलेंस को कॉल करें। खुद ड्राइव न करें।';
        } else if (lang === 'hinglish') {
          text = `🚨 **IMMEDIATE EMERGENCY ACTION REQUIRED** 🚨

Aapke bataye symptoms ke basis par, ye ek **critical medical emergency** (jaise heart attack, breathing problem, ya stroke) ho sakti hai.

**Aapko turant kya karna chahiye:**
1. **Turant emergency medical services (102, 108 ya 911) ko call karein.**
2. Hospital khud drive karke na jayein; ambulance ka wait karein.
3. Apne emergency contact ko notify karein.

*Disclaimer: Main ek AI health assistant hoon. Ye medical advice nahi hai. Turant doctor se consult karein.*`;

          voiceText = 'Warning. Ye symptoms emergency ho sakte hain. Kripya turant emergency medical services ko contact karein ya hospital jayein. Apne emergency contact ko call karein.';
        } else {
          text = `🚨 **IMMEDIATE MEDICAL ACTION REQUIRED** 🚨

Based on your message, you have reported symptoms that may indicate a **critical medical emergency** (such as a heart attack, respiratory failure, or stroke).

**What you should do immediately:**
1. **Call emergency services (911, 112, or local numbers) right now.**
2. Do **NOT** attempt to drive yourself; wait for paramedics.
3. Notify your emergency contact person immediately.

*Disclaimer: I am an AI educational assistant. This is not medical advice. Seek professional emergency care immediately.*`;

          voiceText = 'Warning. Severe emergency detected. Please call emergency medical services immediately and notify your emergency contact. Do not attempt to drive yourself.';
        }

        resolve({
          isEmergency: true,
          text,
          voiceText,
          followUpQuestions: null,
          ragDoc: null,
          type: 'general'
        });
        return;
      }

      // Check if this is a simulated photo scanner upload
      if (attachmentType === 'image') {
        let matchedMed = null;
        if (attachmentName) {
          const nameLower = attachmentName.toLowerCase();
          matchedMed = MEDICINE_KB.find(med => 
            nameLower.includes(med.name.toLowerCase()) || 
            med.synonyms.some(s => nameLower.includes(s.toLowerCase()))
          );
        }

        if (matchedMed) {
          // Allergy Conflict Check
          let allergyAlert = null;
          if (profile.allergies) {
            const userAllergies = profile.allergies.toLowerCase();
            if (matchedMed.allergyClass && userAllergies.includes(matchedMed.allergyClass.toLowerCase())) {
              allergyAlert = `🚨 Profile Allergy Conflict: Our records indicate you are allergic to ${matchedMed.allergyClass}. ${matchedMed.name} is a ${matchedMed.category} and could trigger a severe reaction!`;
            } else if (userAllergies.includes(matchedMed.name.toLowerCase()) || 
                       matchedMed.synonyms.some(s => userAllergies.includes(s.toLowerCase()))) {
              allergyAlert = `🚨 Profile Allergy Conflict: Our records indicate you have an allergy related to ${matchedMed.name}. Taking this could trigger an adverse reaction!`;
            }
          }

          // Medical Report Context Check
          let reportRecall = null;
          if (reports && reports.length > 0) {
            const medKey = matchedMed.name.toLowerCase();
            const matchingReport = reports.find(rep => {
              const textToCheck = (rep.summary + ' ' + rep.fileName).toLowerCase();
              if (medKey === 'atorvastatin' && (textToCheck.includes('cholesterol') || textToCheck.includes('lipid') || textToCheck.includes('ldl'))) return true;
              if (medKey === 'metformin' && (textToCheck.includes('glucose') || textToCheck.includes('sugar') || textToCheck.includes('hba1c') || textToCheck.includes('diabet'))) return true;
              if (medKey === 'lisinopril' && (textToCheck.includes('pressure') || textToCheck.includes('hypertension') || textToCheck.includes('bp'))) return true;
              if (medKey === 'albuterol' && (textToCheck.includes('asthma') || textToCheck.includes('bronchial') || textToCheck.includes('lung'))) return true;
              return false;
            });
            if (matchingReport) {
              reportRecall = `📊 Health Profile Sync: Your latest analyzed medical report (${matchingReport.fileName}) notes related metabolic / clinical parameters. ${matchedMed.name} addresses this indicator.`;
            }
          }

          const text = `📸 **[Simulated Image Scanner]** identified medicine packaging: **${matchedMed.name}**\n\n### 💊 Medicine Details:\n- **Brand Name:** ${matchedMed.brandName}\n- **Generic Name:** ${matchedMed.genericName}\n- **Category:** ${matchedMed.category}\n- **Purpose:** ${matchedMed.purpose}\n\n*This information is for education only and does not replace advice from a qualified healthcare professional.*`;
          const voiceText = `Simulated scanner identified ${matchedMed.name}, which is used for ${matchedMed.purpose}. Please follow your doctor's instructions.`;

          resolve({
            isEmergency: false,
            text,
            voiceText,
            followUpQuestions: `Would you like me to show safety warnings, side effects, or precautions for ${matchedMed.name}?`,
            ragDoc: { title: "HealthAI Verified Drug Catalog", content: "Clinical database references updated for scanned medicine packaging details." },
            type: 'medicine',
            medicineCard: matchedMed,
            allergyAlert,
            reportRecall
          });
        } else {
          // Fallback: confidence is low
          const text = `📸 **[Simulated Image Scanner]**\nI analyzed the uploaded photo (\`${attachmentName || 'photo.jpg'}\`) and read the packaging text, but the confidence is low.\n\nCould you please type the exact medicine name?`;
          const voiceText = "I read text on the packaging, but the confidence is low. Could you please type the exact medicine name?";
          resolve({
            isEmergency: false,
            text,
            voiceText,
            followUpQuestions: null,
            ragDoc: null,
            type: 'low_confidence_scanner'
          });
        }
        return;
      }

      // Check if this is a prescription document upload
      if (attachmentType === 'prescription') {
        let medicinesInPrescription = [];
        let summaryText = "";

        if (attachmentName && attachmentName.toLowerCase().includes('asthma')) {
          medicinesInPrescription = [
            { med: 'Albuterol', dose: '2 puffs', freq: 'PRN', instructions: 'for acute wheezing/shortness of breath' },
            { med: 'Multivitamin', dose: '1 tablet', freq: 'QD', instructions: 'daily in the morning' }
          ];
          summaryText = "Simulated Asthma management support regimen and daily multivitamin.";
        } else if (attachmentName && (attachmentName.toLowerCase().includes('allergy') || attachmentName.toLowerCase().includes('clinic') || attachmentName.toLowerCase().includes('conflict'))) {
          // Penicillin trigger class prescription
          medicinesInPrescription = [
            { med: 'Amoxicillin', dose: '500mg', freq: 'BID', instructions: 'complete the 7-day course' },
            { med: 'Cetirizine', dose: '10mg', freq: 'QD', instructions: 'at bedtime for allergy relief' }
          ];
          summaryText = "Simulated antibacterial course and allergy antihistamine therapy.";
        } else {
          // Standard mock prescription
          medicinesInPrescription = [
            { med: 'Amoxicillin', dose: '500mg', freq: 'TDS', instructions: 'take every 8 hours, complete course' },
            { med: 'Metformin', dose: '1000mg', freq: 'BID', instructions: 'with breakfast and dinner' },
            { med: 'Lisinopril', dose: '10mg', freq: 'QD', instructions: 'take in the morning' }
          ];
          summaryText = "Simulated general primary health prescription containing antibiotic, antidiabetic, and antihypertensive agents.";
        }

        const explainedMeds = [];
        let containsAllergyConflict = false;
        let allergyAlert = null;

        medicinesInPrescription.forEach(item => {
          const medDetails = MEDICINE_KB.find(m => m.name.toLowerCase() === item.med.toLowerCase());
          
          let freqTranslation = item.freq;
          if (item.freq === 'QD') freqTranslation = 'Once daily';
          else if (item.freq === 'BID') freqTranslation = 'Twice a day (every 12 hours)';
          else if (item.freq === 'TDS' || item.freq === 'TID') freqTranslation = 'Three times a day (every 8 hours)';
          else if (item.freq === 'PRN') freqTranslation = 'As needed (for symptom flare-ups)';
          else if (item.freq === 'HS') freqTranslation = 'At bedtime';
          else if (item.freq === 'QID') freqTranslation = 'Four times a day (every 6 hours)';

          let itemAllergy = null;
          if (medDetails && profile.allergies) {
            const allergiesLower = profile.allergies.toLowerCase();
            if (medDetails.allergyClass && allergiesLower.includes(medDetails.allergyClass.toLowerCase())) {
              itemAllergy = `⚠️ Allergy Warning: Contains Penicillin class!`;
              containsAllergyConflict = true;
              allergyAlert = `🚨 Profile Allergy Conflict: Your profile lists a Penicillin allergy! The prescription contains Amoxicillin, which is a penicillin antibiotic. Contact your doctor before taking this.`;
            }
          }

          explainedMeds.push({
            name: item.med,
            brandName: medDetails ? medDetails.brandName : 'N/A',
            genericName: medDetails ? medDetails.genericName : item.med,
            category: medDetails ? medDetails.category : 'Medication',
            dosage: item.dose,
            frequency: item.freq,
            frequencyTranslation: freqTranslation,
            instructions: item.instructions,
            purpose: medDetails ? medDetails.purpose : '',
            sideEffects: medDetails ? medDetails.sideEffects : '',
            warnings: medDetails ? medDetails.warnings : '',
            allergyAlert: itemAllergy
          });
        });

        // Report cross-reference checking
        let reportRecall = null;
        if (reports && reports.length > 0) {
          const content = reports.map(r => r.summary).join(' ').toLowerCase();
          const hasGlucoseIssue = content.includes('glucose') || content.includes('sugar') || content.includes('hba1c');
          const hasDiabetesMed = explainedMeds.some(m => m.name.toLowerCase() === 'metformin');
          if (hasGlucoseIssue && hasDiabetesMed) {
            reportRecall = `📊 Health Profile Sync: Your analyzed blood panel notes elevated glucose/HbA1c levels. The prescribed Metformin addresses this specific indicator.`;
          }
        }

        const text = `📄 **[Prescription Explainer]** parsed document: \`${attachmentName || 'prescription.pdf'}\`\n\n` + 
                     `### 📋 Prescription Summary:\n` +
                     `- **Summary:** ${summaryText}\n` +
                     `- **Extracted Medicines:** ${explainedMeds.map(m => m.name).join(', ')}\n\n` +
                     `*This information is for education only and does not replace advice from a qualified healthcare professional. Do not alter dosages or stop medicines without physician consent.*`;
        
        const voiceText = `Prescription explained. Extracted ${explainedMeds.length} medicines. Please follow doctor instructions. ${containsAllergyConflict ? "Warning: Allergy conflict detected!" : ""}`;

        resolve({
          isEmergency: false,
          text,
          voiceText,
          followUpQuestions: "Would you like me to detail the side effects or precautions for any of these medicines?",
          ragDoc: { title: "Prescription Parsing Engine", content: "Simulated text extraction mapped to verified clinical abbreviation index." },
          type: 'prescription',
          prescriptionSummary: {
            fileName: attachmentName || "prescription.pdf",
            extractedMedicines: explainedMeds,
            summary: summaryText,
            allergyAlert,
            reportRecall,
            safetyDisclaimer: "This information is for education only and does not replace advice from a qualified healthcare professional."
          },
          allergyAlert,
          reportRecall
        });
        return;
      }

      // 2. Check if user is asking about a specific medicine in the database
      let matchedMed = null;
      for (const med of MEDICINE_KB) {
        if (normalizedQuery.includes(med.name.toLowerCase()) || 
            med.synonyms.some(s => normalizedQuery.includes(s.toLowerCase()))) {
          matchedMed = med;
          break;
        }
      }

      // General medicine query trigger phrases
      const triggerPhrases = ["tell me about this medicine", "what is this tablet used for", "explain my medicine", "explain medication"];
      const isGeneralMedSeeking = triggerPhrases.some(phrase => normalizedQuery.includes(phrase));

      if (matchedMed) {
        // Allergy Conflict Check
        let allergyAlert = null;
        if (profile.allergies) {
          const userAllergies = profile.allergies.toLowerCase();
          if (matchedMed.allergyClass && userAllergies.includes(matchedMed.allergyClass.toLowerCase())) {
            allergyAlert = `🚨 Profile Allergy Conflict: Our records indicate you are allergic to ${matchedMed.allergyClass}. ${matchedMed.name} is a ${matchedMed.category} and could trigger a severe reaction!`;
          } else if (userAllergies.includes(matchedMed.name.toLowerCase()) || 
                     matchedMed.synonyms.some(s => userAllergies.includes(s.toLowerCase()))) {
            allergyAlert = `🚨 Profile Allergy Conflict: Our records indicate you have an allergy related to ${matchedMed.name}. Taking this could trigger an adverse reaction!`;
          }
        }

        // Medical Report Context Check
        let reportRecall = null;
        if (reports && reports.length > 0) {
          const medKey = matchedMed.name.toLowerCase();
          const matchingReport = reports.find(rep => {
            const textToCheck = (rep.summary + ' ' + rep.fileName).toLowerCase();
            if (medKey === 'atorvastatin' && (textToCheck.includes('cholesterol') || textToCheck.includes('lipid') || textToCheck.includes('ldl'))) return true;
            if (medKey === 'metformin' && (textToCheck.includes('glucose') || textToCheck.includes('sugar') || textToCheck.includes('hba1c') || textToCheck.includes('diabet'))) return true;
            if (medKey === 'lisinopril' && (textToCheck.includes('pressure') || textToCheck.includes('hypertension') || textToCheck.includes('bp'))) return true;
            if (medKey === 'albuterol' && (textToCheck.includes('asthma') || textToCheck.includes('bronchial') || textToCheck.includes('lung'))) return true;
            return false;
          });
          if (matchingReport) {
            reportRecall = `📊 Health Profile Sync: Your latest analyzed medical report (${matchingReport.fileName}) notes related metabolic / clinical parameters. ${matchedMed.name} addresses this indicator.`;
          }
        }

        let text = '';
        let voiceText = '';

        if (lang === 'hi') {
          text = `### 💊 दवा जानकारी: ${matchedMed.name} (Generic: ${matchedMed.genericName})
**ब्रांड का नाम:** ${matchedMed.brandName}
**श्रेणी:** ${matchedMed.category}

**उपयोग (Common Uses):**
${matchedMed.commonUses}

**सावधानियां (Precautions):**
${matchedMed.precautions}

**दुष्प्रभाव (Side Effects):**
${matchedMed.sideEffects}

${matchedMed.warnings}

*सुरक्षा सूचना: मैं एक एआई हूँ। मैं दवाएं नहीं लिख सकता और न ही खुराक का सुझाव दे सकता हूँ। कृपया दवा शुरू करने या बदलने से पहले अपने डॉक्टर से परामर्श लें।*`;
          
          voiceText = `${matchedMed.name} के सामान्य उपयोग ${matchedMed.purpose} हैं। कृपया डॉक्टर के परामर्श के बिना कोई खुराक न लें।`;
        } else if (lang === 'hinglish') {
          text = `### 💊 Medicine Info: ${matchedMed.name} (Generic: ${matchedMed.genericName})
**Brand Name:** ${matchedMed.brandName}
**Category:** ${matchedMed.category}

**Common Uses:**
${matchedMed.commonUses}

**General Precautions:**
${matchedMed.precautions}

**Side Effects:**
${matchedMed.sideEffects}

${matchedMed.warnings}

*Safety Notice: Main ek AI assistant hoon. Prescribe ya dose alterations nahi kar sakta. Kripya medical professional se consult karein.*`;
          
          voiceText = `${matchedMed.name} ko ${matchedMed.purpose} ke liye use kiya jata hai. Kripya doctor ke guidelines follow karein.`;
        } else {
          text = `### 💊 Medicine Information: ${matchedMed.name} (Generic: ${matchedMed.genericName})
**Brand Name:** ${matchedMed.brandName}
**Category:** ${matchedMed.category}

**Common Uses:**
${matchedMed.commonUses}

**General Precautions:**
${matchedMed.precautions}

**Side Effects:**
${matchedMed.sideEffects}

${matchedMed.warnings}

*Safety Notice: I am an AI assistant. I cannot prescribe medications, recommend dosages, or coordinate pharmaceutical programs. Please consult a qualified primary physician before starting or altering any drug treatments.*`;
          
          voiceText = `${matchedMed.name} is commonly used for ${matchedMed.purpose}. Please follow doctor guidance.`;
        }

        resolve({
          isEmergency: false,
          text,
          voiceText,
          followUpQuestions: "Would you like me to look up any general precautions or details for other medicines?",
          ragDoc: { title: "HealthAI Companion Verified Drug Index", content: "Active pharmaceutical definitions are verified for safety screening and general education bounds." },
          type: 'medicine',
          medicineCard: matchedMed,
          allergyAlert,
          reportRecall
        });
        return;
      } else if (isGeneralMedSeeking) {
        // User asked about medicine but didn't specify name
        resolve({
          isEmergency: false,
          text: `🔍 **Medicine Lookup Assistant**\n\nI can retrieve detailed clinical characteristics and safety profiles for medicines.\n\nWhich medicine would you like to lookup? You can click a suggestion chip below or type the name (e.g., *Paracetamol*, *Amoxicillin*, *Atorvastatin*).`,
          voiceText: "I can help search for medicines. Which medicine name would you like to look up?",
          followUpQuestions: null,
          ragDoc: null,
          type: 'prompt_input'
        });
        return;
      }

      let responseText = '';
      let followUp = '';
      let voiceResponse = '';

      // Perform RAG Knowledge Base search
      const ragDoc = searchKnowledgeBase(query);

      // 3. Identify educational KB matches for language
      let matchedKey = null;
      const currentKB = EDUCATIONAL_KB[lang];
      for (const key in currentKB) {
        if (normalizedQuery.includes(key) || 
            (lang === 'hi' && key === 'headache' && (normalizedQuery.includes('सिर') || normalizedQuery.includes('दर्द'))) ||
            (lang === 'hi' && key === 'fever' && (normalizedQuery.includes('बुखार') || normalizedQuery.includes('तापमान'))) ||
            (lang === 'hi' && key === 'cough' && (normalizedQuery.includes('खांसी') || normalizedQuery.includes('कफ'))) ||
            (lang === 'hi' && key === 'sore throat' && (normalizedQuery.includes('गला') || normalizedQuery.includes('खराश'))) ||
            (lang === 'hi' && key === 'fatigue' && (normalizedQuery.includes('थकान') || normalizedQuery.includes('कमजोरी')))
        ) {
          matchedKey = key;
          break;
        }
      }

      if (matchedKey) {
        const info = currentKB[matchedKey];
        if (lang === 'hi') {
          responseText = `### सामान्य स्वास्थ्य शिक्षा: ${matchedKey.toUpperCase()}

${info.summary}

**सामान्य दिशा-निर्देश:**
- ${info.advice}

**संभावित कारण (यह निदान नहीं है):**
- ${info.causes.join(', ')}

*सुरक्षा सूचना: यह केवल शैक्षिक उद्देश्यों के लिए है। यदि लक्षण बने रहते हैं, तो डॉक्टर से संपर्क करें।*`;
        } else if (lang === 'hinglish') {
          responseText = `### General Health Education: ${matchedKey.toUpperCase()}

${info.summary}

**Common general guidelines:**
- ${info.advice}

**Common possible causes (Not a diagnosis):**
- ${info.causes.join(', ')}

*Safety Notice: Ye information sirf educational purposes ke liye hai. Agar symptoms badhein, to doctor se consult karein.*`;
        } else {
          responseText = `### General Health Education: ${matchedKey.toUpperCase()}

${info.summary}

**Common general education guidelines:**
- ${info.advice}

**Common possible causes (Not a diagnosis):**
- ${info.causes.join(', ')}

*Safety Notice: These details are for educational purposes only. If your symptoms worsen or persist, please contact a primary care provider.*`;
        }
        followUp = info.questions;
        voiceResponse = info.voiceSummary;
      } else if (normalizedQuery.includes('allergy') || normalizedQuery.includes('peanut') || normalizedQuery.includes('penicillin') || normalizedQuery.includes('khujli') || normalizedQuery.includes('allerz')) {
        if (lang === 'hi') {
          responseText = `### एलर्जी शिक्षा

एलर्जी तब होती है जब आपका शरीर किसी बाहरी पदार्थ के प्रति अति-संवेदनशील प्रतिक्रिया करता है।
आपके प्रोफाइल के अनुसार, आपकी ज्ञात एलर्जी **${profile.allergies || 'उपलब्ध नहीं'}** हैं।

**सामान्य बचाव:**
- ज्ञात ट्रिगर्स (जैसे मूंगफली या पेनिसिलिन) से पूरी तरह बचें।
- गंभीर लक्षणों (जैसे गले का बंद होना, सांस फूलना) में तुरंत डॉक्टर से संपर्क करें।`;
          followUp = 'क्या आप अभी किसी सक्रिय एलर्जी का अनुभव कर रहे हैं?';
          voiceResponse = `एलर्जी से बचाव का सबसे अच्छा तरीका ट्रिगर्स से दूरी बनाए रखना है। क्या आप अभी किसी एलर्जी के लक्षण महसूस कर रहे हैं?`;
        } else if (lang === 'hinglish') {
          responseText = `### Allergy Education

Allergic reactions tab hoti hain jab immune system kisi foreign substance par overreact karta hai.
Aapke profile ke hisab se, aapki allergies **${profile.allergies || 'peanuts / penicillin'}** hain.

**General Guidelines:**
- Specialties se bachne ka best tareeqa hai triggers ko strict avoid karna.
- Agar gale me jakdan, saas lene me problem ho, to ye emergency hai aur adrenaline aur ER care ki zaroorat hoti hai.`;
          followUp = 'Kya aap abhi koi active allergy symptoms face kar rahe hain?';
          voiceResponse = `Allergy se bachne ka best option triggers ko avoid karna hai. Kya aap abhi kisi active allergy symptoms se pareshan hain?`;
        } else {
          responseText = `### Allergy Education

Allergic reactions occur when the immune system overreacts to a foreign substance.
Based on your profile, you have listed **${profile.allergies || 'allergies'}**.

**General Guidelines:**
- The primary management for allergies is strict avoidance of known triggers.
- For severe signs (throat tightness, wheezing, swelling of face/lips), this is anaphylaxis and requires emergency care.`;
          followUp = 'Are you currently experiencing any active allergic symptoms, or are you asking for future planning?';
          voiceResponse = 'The best way to prevent allergies is avoiding your known triggers. Are you currently experiencing any active symptoms?';
        }
      } else if (normalizedQuery.includes('diet') || normalizedQuery.includes('food') || normalizedQuery.includes('weight') || normalizedQuery.includes('motapa') || normalizedQuery.includes('khaana')) {
        if (lang === 'hi') {
          responseText = `### पोषण एवं कल्याण शिक्षा

एक स्वस्थ जीवन शैली संतुलित आहार, उचित जलयोजन (हाइड्रेशन) और दैनिक व्यायाम पर निर्भर करती है।

**दैनिक सुझाव:**
- अपने आहार में सब्जियां, फल, और साबुत अनाज शामिल करें।
- प्रसंस्कृत चीनी (प्रोसेस्ड शुगर) और अस्वास्थ्यकर वसा को कम करें।
- प्रतिदिन 2 से 3 लीटर पानी पिएं।`;
          followUp = 'क्या आपका कोई विशिष्ट लक्ष्य है जैसे वजन कम करना या ऊर्जा बढ़ाना?';
          voiceResponse = 'स्वस्थ रहने के लिए ताजे फल, सब्जियां खाएं और दिन में दो से तीन लीटर पानी जरूर पिएं। क्या आपका कोई खास स्वास्थ्य लक्ष्य है?';
        } else if (lang === 'hinglish') {
          responseText = `### Nutrition & Wellness Education

Ek healthy wellness foundation balanced meals, proper hydration aur regular physical activity par depend karti hai.

**General Suggestions:**
- Vegetables, fruits aur whole grains ko meal me add karein.
- Fast food, sugar aur fatty items ko avoid karein.
- Daily kam se kam 2 se 3 liters paani peeyein.`;
          followUp = 'Kya aapka koi specific goal hai jaise weight loss ya stamina badhana?';
          voiceResponse = 'Nutrition ke liye fresh fruits aur vegetables khayein aur daily do se teen liter paani peeyein. Kya aapka koi specific goal hai?';
        } else {
          responseText = `### Nutrition & Wellness Education

A healthy wellness foundation relies heavily on nutrient-dense meals, stable hydration, and calorie balance.

**General Educational Suggestions:**
- Focus on whole foods: vegetables, fruits, proteins, and whole grains.
- Drink adequate water (approximately 2 to 3 liters daily).`;
          followUp = 'Could you tell me more about your specific goals? Are you looking to manage a condition or improve energy levels?';
          voiceResponse = 'Focus on whole foods like fruits and vegetables, and drink two to three liters of water daily. What are your specific goals?';
        }
      } else if (normalizedQuery.includes('medication') || normalizedQuery.includes('prescribe') || normalizedQuery.includes('pill') || normalizedQuery.includes('drug') || normalizedQuery.includes('dawai') || normalizedQuery.includes('goli')) {
        // Strict safety blocker for prescriptions
        if (lang === 'hi') {
          responseText = `### दवा निर्देश नीति सुरक्षा नियम

मैं आपकी सुरक्षा को प्राथमिकता देता हूं। **मैं किसी भी प्रकार की दवा लिख ​​नहीं सकता, सुझाव नहीं दे सकता, या खुराक की सिफारिश नहीं कर सकता।**

केवल एक प्रमाणित चिकित्सक ही दवाएं लिख सकता है। वे आपकी स्वास्थ्य स्थिति का आकलन करके ही उचित दवा की सलाह देंगे।`;
          followUp = 'क्या आप किसी विशिष्ट दवा या लक्षण के बारे में पूछ रहे हैं?';
          voiceResponse = 'दवा नीति सुरक्षा नियमों के अनुसार, मैं कोई दवा प्रिस्क्राइब नहीं कर सकता। कृपया किसी योग्य डॉक्टर या फिजिशियन से परामर्श लें।';
        } else if (lang === 'hinglish') {
          responseText = `### Medication Education Policy

Main aapki safety ko priority deta hoon. **Main koi dawai ya medicine prescribe nahi kar sakta, na hi dosage recommend kar sakta hoon.**

Sirf ek registered doctor hi dawai likh sakta hai kyunki wo aapki physical history aur health tests ko evaluate karte hain.`;
          followUp = 'Kya aap kisi specific medicine ke baare me pooch rahe hain?';
          voiceResponse = 'Safety guidelines ke mutabik main dawai recommend ya prescribe nahi kar sakta. Kripya qualified doctor se checkup karwayein.';
        } else {
          responseText = `### Medication Education Policy

I am programmed to prioritize your safety. **I cannot prescribe medications, suggest dosages, or recommend specific pharmaceutical treatments.**

Only a licensed healthcare professional can prescribe medicines after reviewing your medical history.`;
          followUp = 'What medication or symptom are you asking about?';
          voiceResponse = 'For your safety, I cannot recommend or prescribe medications. Please consult a qualified healthcare provider.';
        }
      } else {
        // General conversational response
        if (lang === 'hi') {
          responseText = `### स्वास्थ्य जानकारी

मुझसे जुड़ने के लिए धन्यवाद। एक एआई सहायक के रूप में, मैं स्वास्थ्य संबंधी विषयों पर शैक्षिक जानकारी साझा कर सकता हूं।

**कल्याण के सामान्य सुझाव:**
- रोजाना 7 से 8 घंटे की अच्छी नींद लें।
- पर्याप्त मात्रा में पानी पिएं।
- सप्ताह में कम से कम 150 मिनट मध्यम शारीरिक गतिविधि करें।`;
          followUp = 'आप किस स्वास्थ्य विषय या लक्षण के बारे में जानना चाहते हैं?';
          voiceResponse = 'नमस्ते। मैं आपका स्वास्थ्य सहायक हूँ। स्वास्थ्य सुधारने के लिए रोजाना अच्छी नींद लें, पानी पिएं और व्यायाम करें। आप किस विषय में जानना चाहते हैं?';
        } else if (lang === 'hinglish') {
          responseText = `### Healthcare Information

Hamare sath judne ke liye thanks. AI health assistant ke roop me, main aapse general health tips share kar sakta hoon.

**General wellness tips:**
- Daily 7-8 ghante ki achhi neend lein.
- Adequate hydration (paani) maintain rakhein.
- Hfte me kam se kam 150 minutes physical exercise karein.`;
          followUp = 'Aap kis health topic ya symptoms ke baare me janna chahte hain?';
          voiceResponse = 'Hello, main aapka AI health copilot hoon. Daily 7 se 8 hours soyein, hydrated rahein, aur routine walk karein. Aap kya janna chahte hain?';
        } else {
          responseText = `### Healthcare Information

Thank you for your question. As an AI health assistant, I can share educational information on health topics to help you prepare for conversations with your physician.

**General wellness tips:**
- Ensure you get 7-8 hours of sleep.
- Drink adequate water.
- Move for at least 150 minutes a week.`;
          followUp = 'Could you describe the symptom or topic you are interested in?';
          voiceResponse = 'Hello, I am your HealthAI Companion. Try to sleep 7 to 8 hours daily, stay hydrated, and stay physically active. What topic are you interested in?';
        }
      }

      // If RAG document matches, enhance output response with RAG citation
      if (ragDoc) {
        const simPct = (ragDoc.similarity * 100).toFixed(1);
        if (lang === 'hi') {
          responseText = `🔍 *[चिकित्सा ज्ञान आधार (RAG) से पुनर्प्राप्त: ${ragDoc.title} (समानता: ${simPct}%)]*\n> "${ragDoc.content}"\n\n` + responseText;
          voiceResponse = `चिकित्सा ज्ञान आधार के अनुसार, ${voiceResponse}`;
        } else if (lang === 'hinglish') {
          responseText = `🔍 *[Retrieved from Medical Knowledge Base (RAG): ${ragDoc.title} (Similarity: ${simPct}%)]*\n> "${ragDoc.content}"\n\n` + responseText;
          voiceResponse = `Medical Knowledge Base ke hisab se, ${voiceResponse}`;
        } else {
          responseText = `🔍 *[Retrieved from Medical Knowledge Base (RAG): ${ragDoc.title} (Similarity: ${simPct}%)]*\n> "${ragDoc.content}"\n\n` + responseText;
          voiceResponse = `According to the Medical Knowledge Base guidelines, ${voiceResponse}`;
        }
      }

      // Append general medical disclaimer
      if (lang === 'hi') {
        responseText += `\n\n***\n*अस्वीकरण: मैं आपका एआई स्वास्थ्य सहायक (HealthAI Companion) हूं। मैं केवल शैक्षिक सामग्री प्रदान करता हूं और नैदानिक निर्णय या दवाएं नहीं लिख सकता। निदान के लिए कृपया डॉक्टर या फिजिशियन से परामर्श लें। अगर आपातकाल है तो तुरंत आपातकालीन कॉल करें।*`;
      } else if (lang === 'hinglish') {
        responseText += `\n\n***\n*Disclaimer: Main aapka AI Health Assistant (HealthAI Companion) hoon. Main sirf educational resources share karta hoon aur medicines prescribe nahi kar sakta. Confirm diagnosis ke liye kripya doctor se consult karein. Emergency ke liye 102/108 call karein.*`;
      } else {
        responseText += `\n\n***\n*Disclaimer: I am your AI Health Assistant (HealthAI Companion). I provide educational material only and cannot diagnose diseases or prescribe medications. Please consult a qualified physician for diagnostic decisions. In case of emergency, seek immediate professional medical attention.*`;
      }

      // If voice text is not set, use responseText stripped of markdown symbols
      if (!voiceResponse) {
        voiceResponse = responseText.replace(/[#*_\-`🚨]/g, '').substring(0, 150) + '...';
      }

      resolve({
        isEmergency: false,
        text: responseText,
        voiceText: voiceResponse,
        followUpQuestions: followUp,
        ragDoc: ragDoc ? { title: ragDoc.title, content: ragDoc.content, similarity: ragDoc.similarity } : null
      });
    }, 1000); // Simulate network latency
  });
}

// Symptom Checker Flow Engine
export function checkSymptoms(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const { age, gender, symptoms, duration, severity, existingConditions } = data;
      
      // Check for emergency symptoms in user input
      const combinedInput = `${symptoms} ${existingConditions}`;
      const isEmergency = detectEmergency(combinedInput);

      if (isEmergency) {
        resolve({
          isEmergency: true,
          summary: '🚨 CRITICAL EMERGENCY DETECTED',
          causes: ['Requires immediate professional evaluation'],
          advice: 'Go to the nearest emergency department or call emergency services (911) immediately. Do not wait to see if symptoms improve.',
          nextSteps: 'Call emergency services right now. Do not drive yourself.'
        });
        return;
      }

      const lowerSymptoms = symptoms.toLowerCase();
      let causes = [];
      let advice = '';
      let nextSteps = '';

      // Basic rule-based analysis (General educational outputs)
      if (lowerSymptoms.includes('head') || lowerSymptoms.includes('migraine')) {
        causes = ['Tension-type headache (very common)', 'Dehydration / electrolyte imbalance', 'Migraine trigger', 'Sinus pressure'];
        advice = 'Drink 2 glasses of water immediately. Rest in a dark, cool room. Avoid screens and bright lights.';
        nextSteps = 'If severity is high, or accompanied by stiff neck and high fever, seek immediate care. Otherwise, monitor and consult your GP if it persists past 48 hours.';
      } else if (lowerSymptoms.includes('throat') || lowerSymptoms.includes('swallow')) {
        causes = ['Viral pharyngitis (common cold)', 'Streptococcus infection (bacterial)', 'Acid reflux irritation', 'Environmental dry air'];
        advice = 'Gargle warm salt water every 3-4 hours. Maintain soft diet and hot liquids (like tea with honey).';
        nextSteps = 'Visit a clinic if you develop a fever over 101°F, struggle to swallow liquids, or see white spots on your throat.';
      } else if (lowerSymptoms.includes('stomach') || lowerSymptoms.includes('belly') || lowerSymptoms.includes('nausea')) {
        causes = ['Gastroenteritis (stomach bug)', 'Mild food intolerance / ingestion issue', 'Indigestion / acid reflux', 'Stress-induced gut distress'];
        advice = 'Stick to the BRAT diet (Bananas, Rice, Applesauce, Toast). Sip water slowly to stay hydrated. Avoid dairy, caffeine, and fatty foods.';
        nextSteps = 'If pain becomes sharp, localizes to the lower right side, or you cannot keep fluids down, seek urgent care. Otherwise, rest for 24-48 hours.';
      } else {
        // Default general response
        causes = ['Mild viral syndrome', 'Physical fatigue or stress', 'Localized inflammatory response'];
        advice = 'Ensure optimal hydration, increase resting hours, and keep logs of when symptoms peak.';
        nextSteps = 'Keep a symptom diary. Schedule an appointment with a primary care provider to review these findings.';
      }

      // Age and severity factors
      if (parseInt(severity) >= 4) {
        advice += ' Since severity is high, avoid self-treatment and consult a healthcare provider promptly.';
        nextSteps = 'Contact a local clinic or urgent care facility today for evaluation.';
      }
      if (existingConditions && existingConditions.trim() !== '') {
        advice += ` Extra caution is advised due to your history of: ${existingConditions}.`;
      }

      resolve({
        isEmergency: false,
        causes,
        advice,
        nextSteps
      });
    }, 1200);
  });
}

// Medical Report Analysis Engine
export function analyzeMedicalReport(fileName, textContent) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const normalized = textContent.toLowerCase();
      const explanations = [];
      const findings = [];
      const questions = [];

      // Detect terms for glossary translation
      for (const term in MEDICAL_GLOSSARY) {
        if (normalized.includes(term) || (term === 'wbc' && normalized.includes('white blood')) || (term === 'rbc' && normalized.includes('red blood'))) {
          explanations.push({
            term: term.toUpperCase(),
            definition: MEDICAL_GLOSSARY[term]
          });
        }
      }

      // Generate context-based findings
      if (normalized.includes('cholesterol') || normalized.includes('ldl') || normalized.includes('hdl')) {
        findings.push('The report lists lipid or cholesterol numbers. High LDL (often called bad cholesterol) can build up in artery walls.');
        findings.push('HDL (good cholesterol) is noted; higher levels help clear cholesterol from blood vessels.');
        questions.push('What are my target cholesterol levels based on my age and cardiovascular risk factors?');
        questions.push('Do you recommend lifestyle modifications, or is it time to discuss cholesterol-lowering options?');
      }

      if (normalized.includes('glucose') || normalized.includes('sugar') || normalized.includes('hba1c')) {
        findings.push('Blood glucose or HbA1c levels are mentioned. These are key metrics used to monitor blood sugar levels and screen for prediabetes or diabetes.');
        questions.push('Does my HbA1c or fasting glucose value indicate prediabetes or insulin resistance?');
        questions.push('How often should I monitor my blood sugar levels at home?');
      }

      if (normalized.includes('tsh') || normalized.includes('thyroid') || normalized.includes('t3') || normalized.includes('t4')) {
        findings.push('Thyroid hormones (TSH, T3, or T4) are present. TSH is released by the brain to tell the thyroid gland to work. High TSH often suggests an underactive thyroid, while low TSH suggests an overactive thyroid.');
        questions.push('Does this report suggest my thyroid is underactive or overactive?');
        questions.push('Would thyroid medication benefit my energy levels and metabolism?');
      }

      if (normalized.includes('creatinine') || normalized.includes('egfr') || normalized.includes('kidney')) {
        findings.push('Kidney function markers (Creatinine and/or eGFR) are listed. Creatinine is a waste product of muscle breakdown, and eGFR indicates how well kidneys filter wastes.');
        questions.push('Is my eGFR value in a healthy range for my age group?');
        questions.push('Are there medications I am taking that could impact my kidney function?');
      }

      // Default findings if none are specific
      if (findings.length === 0) {
        findings.push('General lab report details. The values indicate a standard screening panel checking organ function, blood counts, or chemical indicators.');
        questions.push('Are there any values in this report that are outside of the normal reference range?');
        questions.push('Do these results explain my recent symptoms, or do we need additional tests?');
      }

      // Add general doctor question
      questions.push('When should we repeat this test to check if my numbers have improved?');

      // Summary string
      const summary = `AI-generated explanation of ${fileName}. Found ${explanations.length} medical terms. The findings indicate: ${findings.join(' ')}`;

      resolve({
        summary,
        explanations,
        doctorQuestions: questions
      });
    }, 1500);
  });
}
