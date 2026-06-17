import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, Activity, Droplet, Moon, Dumbbell, Smile, User, 
  Calendar, FileText, MessageSquare, Settings, ShieldAlert, 
  Search, Trash2, Download, LogOut, Menu, Bell, ChevronRight, 
  Plus, Minus, Info, AlertTriangle, Check, RefreshCcw, LogIn,
  ClipboardList, Stethoscope, ArrowRight, UserCheck, Shield, HelpCircle,
  Volume2, VolumeX, Mic, MicOff, QrCode, MapPin, AlertOctagon, Heart, Lock, BookOpen, Sparkles, Flame, Pill
} from 'lucide-react';
import { db, DOCTORS, DOCTOR_PATIENTS, MEDICINE_KB, FIRST_AID_GUIDES, EDUCATION_ARTICLES, MOCK_HOSPITALS } from './mockDb';
import { getChatResponse, checkSymptoms, analyzeMedicalReport, searchMedicines, calculateHealthRisk, getAiPatientSummary } from './aiEngine';
import { vectorDb, generateBgem3Embedding } from './ragEngine';

export default function App() {
  // --- STATE ---
  const [view, setView] = useState('landing'); // 'landing' | 'auth' | 'dashboard' | 'chat' | 'symptoms' | 'reports' | 'appointments' | 'profile'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n-1', text: 'Dr. Marcus Vance appointment confirmed for next week.', read: false },
    { id: 'n-2', text: 'Export your weekly wellness score summary from Profile Settings.', read: true }
  ]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Profile Form State
  const [profile, setProfile] = useState(db.getProfile());
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Authentication Fields
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  // Daily Trackers State (Synchronized with localStorage todayLogs)
  const [todayLogs, setTodayLogs] = useState(db.getTodayLogs());
  const [wellnessScore, setWellnessScore] = useState(db.calculateWellnessScore());

  // Chat Interface State
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Symptom Checker State
  const [symptomForm, setSymptomForm] = useState({
    age: '30',
    gender: 'Female',
    symptoms: '',
    duration: '2 days',
    severity: '3', // 1-5 scale
    existingConditions: ''
  });
  const [symptomResult, setSymptomResult] = useState(null);
  const [isSymptomChecking, setIsSymptomChecking] = useState(false);

  // Report Analyzer State
  const [reportText, setReportText] = useState('');
  const [analyzedReport, setAnalyzedReport] = useState(null);
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const [reportsList, setReportsList] = useState([]);
  const [reportFileName, setReportFileName] = useState('');

  // Appointment Planner State
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    date: '',
    time: '09:00 AM',
    notes: ''
  });
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState(false);

  // Privacy Options State
  const [privacySettings, setPrivacySettings] = useState(db.getPrivacy());

  // Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const recognitionRef = useRef(null);
  const [ragStatus, setRagStatus] = useState(null);
  const [ragDocTitle, setRagDocTitle] = useState('');

  // Extra HealthAI Companion states
  const [medicineSearch, setMedicineSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [riskForm, setRiskForm] = useState({
    sleep: '7',
    diet: 'average',
    activity: '2.5',
    smoking: 'no',
    stress: '3'
  });
  const [riskResult, setRiskResult] = useState(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('p-1');
  const [educationSearch, setEducationSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [firstAidSearch, setFirstAidSearch] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showMedSearchPanel, setShowMedSearchPanel] = useState(false);
  const [medSearchInput, setMedSearchInput] = useState('');
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);

  // BGE-M3 RAG & Whisper STT States
  const [showRagExplorer, setShowRagExplorer] = useState(false);
  const [ragSearchQuery, setRagSearchQuery] = useState('');
  const [ragTestResults, setRagTestResults] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Medicine Information');
  const [newDocContent, setNewDocContent] = useState('');
  const [ragIngestionFlash, setRagIngestionFlash] = useState(false);
  const [ragDocumentList, setRagDocumentList] = useState(() => vectorDb.getAllDocuments());

  // New SaaS states
  const [savedMedicines, setSavedMedicines] = useState(() => {
    return JSON.parse(localStorage.getItem('health_ai_saved_meds')) || [];
  });
  const [recentSearches, setRecentSearches] = useState(() => {
    return JSON.parse(localStorage.getItem('health_ai_recent_searches')) || [];
  });
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('health_ai_selected_model') || 'llama3.1');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showVoiceHud, setShowVoiceHud] = useState(false);
  const [isDraggingReport, setIsDraggingReport] = useState(false);

  // SaaS state helpers
  const toggleSaveMedicine = (medName) => {
    if (!medName) return;
    let updated;
    if (savedMedicines.includes(medName)) {
      updated = savedMedicines.filter(m => m !== medName);
    } else {
      updated = [...savedMedicines, medName];
    }
    setSavedMedicines(updated);
    localStorage.setItem('health_ai_saved_meds', JSON.stringify(updated));
  };

  const addRecentSearch = (medName) => {
    if (!medName) return;
    const cleanName = medName.trim();
    let updated = [cleanName, ...recentSearches.filter(m => m.toLowerCase() !== cleanName.toLowerCase())];
    updated = updated.slice(0, 5); // Max 5 recent searches
    setRecentSearches(updated);
    localStorage.setItem('health_ai_recent_searches', JSON.stringify(updated));
  };

  const navigateToView = (targetView) => {
    setPageLoading(true);
    setMobileMenuOpen(false);
    setTimeout(() => {
      setView(targetView);
      setPageLoading(false);
    }, 350); // Simulated 350ms backend query
  };

  const getAutocompleteMatches = () => {
    if (!medicineSearch.trim()) return [];
    return MEDICINE_KB.filter(m => 
      m.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
      m.synonyms.some(s => s.toLowerCase().includes(medicineSearch.toLowerCase()))
    );
  };

  const generateDashboardInsights = () => {
    const insights = [];
    const water = todayLogs.water || 0;
    const sleep = todayLogs.sleep || 0;
    const exercise = todayLogs.exercise || 0;
    const steps = todayLogs.steps || 0;

    if (water < 1000) {
      insights.push({
        type: 'warning',
        text: 'Dehydration Warning: Your water intake is low today. Try to drink at least 1,000 ml more to keep metabolic filtration healthy.',
        icon: 'droplet'
      });
    } else if (water < 2000) {
      insights.push({
        type: 'info',
        text: 'Optimal Hydration: You are on your way. Keep sipping water hourly to sustain physical endurance and mental clarity.',
        icon: 'droplet'
      });
    } else {
      insights.push({
        type: 'success',
        text: 'Hydration Target Met! Excellent fluid balance. Your cells are fully hydrated for detox and energy conversion.',
        icon: 'droplet'
      });
    }

    if (sleep < 6) {
      insights.push({
        type: 'warning',
        text: 'Sleep Debt Alert: Under 6 hours of sleep can lead to fatigue, higher blood pressure, and low cognitive alertness. Aim for a recovery rest tonight.',
        icon: 'moon'
      });
    } else if (sleep < 8) {
      insights.push({
        type: 'info',
        text: 'Rest Guidelines: 6 to 8 hours is decent. Try getting 30 mins more of deep REM cycle sleep tonight for active muscle recovery.',
        icon: 'moon'
      });
    } else {
      insights.push({
        type: 'success',
        text: 'Great Rest! Your sleep duration is in the optimal zone for cellular repair and mental focus.',
        icon: 'moon'
      });
    }

    if (steps < 4000) {
      insights.push({
        type: 'info',
        text: 'Activity Progression: Sedentary pattern detected today. Take a quick 10-minute walk to stimulate blood circulation and cardiovascular health.',
        icon: 'activity'
      });
    } else if (steps < 10000) {
      insights.push({
        type: 'success',
        text: 'Active Physical State: Good job on the steps! You are actively supporting your heart and metabolic rate.',
        icon: 'activity'
      });
    } else {
      insights.push({
        type: 'success',
        text: 'Superb Steps Count! You surpassed 10k steps. Your metabolic rate and muscular stamina are highly stimulated.',
        icon: 'activity'
      });
    }

    return insights;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingReport(true);
  };

  const handleDragLeave = () => {
    setIsDraggingReport(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingReport(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setReportFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        setReportText(evt.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Speech Recognition hook
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          handleSendChatMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [activeChatId, privacySettings]);

  // Speech Synthesis helper
  const speakText = (text, messageId = null) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop ongoing

    if (!privacySettings.voiceEnabled || !text) {
      setIsPlayingVoice(false);
      setSpeakingMessageId(null);
      return;
    }

    // Strip markdown symbols
    const cleanText = text.replace(/[#*_\-`🚨]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    let langCode = 'en-US';
    if (privacySettings.voiceLanguage === 'hi') langCode = 'hi-IN';
    else if (privacySettings.voiceLanguage === 'hinglish') langCode = 'en-IN'; // Indian-accent English works great for Hinglish in TTS

    utterance.lang = langCode;
    utterance.rate = privacySettings.speakingSpeed || 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter(v => 
      v.lang.toLowerCase().includes(langCode.toLowerCase()) || 
      (langCode === 'en-IN' && v.lang.toLowerCase().includes('en-in'))
    );

    let selectedVoice = null;
    if (matchingVoices.length > 0) {
      const targetGender = privacySettings.voiceGender || 'female';
      selectedVoice = matchingVoices.find(v => v.name.toLowerCase().includes(targetGender));
      if (!selectedVoice) selectedVoice = matchingVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsPlayingVoice(true);
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setIsPlayingVoice(false);
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setIsPlayingVoice(false);
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
    setSpeakingMessageId(null);
  };

  const toggleListening = () => {
    // Premium gate check
    if (profile.subscriptionPlan === 'free') {
      alert("🔒 Voice AI Assistant is a Premium Feature. Please upgrade your subscription plan in Profile Settings to use Voice Conversations.");
      return;
    }

    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopSpeaking();
      
      if (privacySettings.voiceLanguage === 'hi' || privacySettings.voiceLanguage === 'hinglish') {
        recognitionRef.current.lang = 'hi-IN';
      } else {
        recognitionRef.current.lang = 'en-US';
      }

      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  // Mute audio automatically when leaving chat view
  useEffect(() => {
    if (view !== 'chat') {
      stopSpeaking();
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [view]);

  // Quick Chat suggestions
  const CHAT_SUGGESTIONS = [
    "What are common symptoms of seasonal allergies?",
    "How much water should a 30-year-old drink daily?",
    "Explain what blood pressure readings represent.",
    "What lifestyle changes support cardiac health?"
  ];

  // Sample Reports for Medical Report Analyzer
  const SAMPLE_REPORTS = [
    {
      title: "Vitamin D Blood Panel",
      fileName: "vit_d_bloodtest.txt",
      content: "TEST: 25-Hydroxy Vitamin D.\nRESULT: 24.2 ng/mL.\nREFERENCE RANGE: Mild deficiency: 20-29 ng/mL. Optimal levels: 30-100 ng/mL. Notes: Patient complains of generalized fatigue. WBC count normal. Hemoglobin is normal at 13.5 g/dL."
    },
    {
      title: "Lipid & Cholesterol Panel",
      fileName: "cholesterol_lipid_profile.txt",
      content: "LIPID PROFILE REPORT.\nTotal Cholesterol: 245 mg/dL (High).\nLDL Cholesterol: 165 mg/dL (Elevated).\nHDL Cholesterol: 42 mg/dL (Low/Optimal boundary).\nGlucose levels: 98 mg/dL (Normal fasting glucose range)."
    },
    {
      title: "Basic Metabolic Panel",
      fileName: "basic_metabolic.txt",
      content: "BASIC METABOLIC TEST.\nTSH Level: 5.8 mIU/L (High, standard range is 0.4 - 4.5).\nCreatinine Level: 0.9 mg/dL (Normal renal filtration range).\nBilirubin Level: 0.8 mg/dL (Normal hepatic filtration range)."
    }
  ];

  // --- USE EFFECTS ---
  // Load data on start
  useEffect(() => {
    setProfile(db.getProfile());
    const savedChats = db.getChats();
    setChats(savedChats);
    if (savedChats.length > 0) {
      setActiveChatId(savedChats[0].id);
    }
    setTodayLogs(db.getTodayLogs());
    setWellnessScore(db.calculateWellnessScore());
    setBookedAppointments(db.getAppointments());
    setReportsList(db.getReports());
    setPrivacySettings(db.getPrivacy());

    // Check backend health on startup and periodically
    const checkConnection = () => {
      fetch('http://localhost:8000/api/health')
        .then(res => {
          if (!res.ok) throw new Error('Unhealthy');
          return res.json();
        })
        .then(data => {
          if (data.status === 'healthy') {
            setIsOfflineMode(false);
          } else {
            setIsOfflineMode(true);
          }
        })
        .catch(() => {
          setIsOfflineMode(true);
        });
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update wellness score whenever todayLogs change
  useEffect(() => {
    setWellnessScore(db.calculateWellnessScore(todayLogs));
  }, [todayLogs]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, isAiTyping, activeChatId]);

  // --- EVENT HANDLERS ---

  // Auth Submit
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authMode === 'signup' && authName.trim()) {
      const updatedProfile = { ...profile, name: authName };
      db.saveProfile(updatedProfile);
      setProfile(updatedProfile);
    }
    setIsAuthenticated(true);
    setView('dashboard');
  };

  // Safe Demo Mode Session Handler
  const handleTryDemo = () => {
    const demoProfile = {
      name: 'Jane Doe (Demo)',
      age: 32,
      gender: 'Female',
      bloodGroup: 'O-Positive',
      allergies: 'Peanuts, Penicillin',
      medicalHistory: 'Mild asthma, seasonal allergies',
      currentMedications: 'Albuterol Inhaler (as needed), Multivitamin (daily)',
      emergencyContact: 'John Doe (Husband) - +1 (555) 123-4567',
      subscriptionPlan: 'premium'
    };
    db.saveProfile(demoProfile);
    setProfile(demoProfile);
    setIsAuthenticated(true);
    setIsDemoMode(true);
    setView('dashboard');
  };

  // Profile Form Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    db.saveProfile(profile);
    setProfileSuccessMsg(true);
    setTimeout(() => setProfileSuccessMsg(false), 3000);
  };

  // Increment Tracker values
  const adjustTracker = (field, delta, limitMin = 0, limitMax = 10000) => {
    let currentVal = todayLogs[field] || 0;
    let newVal = currentVal + delta;
    if (newVal < limitMin) newVal = limitMin;
    if (newVal > limitMax) newVal = limitMax;
    
    // Round to one decimal place for sleep
    if (field === 'sleep') {
      newVal = Math.round(newVal * 10) / 10;
    }

    const updated = db.updateTodayLog(field, newVal);
    setTodayLogs(updated);
  };

  // Set Mood directly
  const handleMoodSelect = (moodVal) => {
    const updated = db.updateTodayLog('mood', moodVal);
    setTodayLogs(updated);
  };

  const handleToggleHabit = (habit) => {
    const currentHabits = todayLogs.habits || [];
    let updatedHabits;
    if (currentHabits.includes(habit)) {
      updatedHabits = currentHabits.filter(h => h !== habit);
    } else {
      updatedHabits = [...currentHabits, habit];
    }
    const updated = db.updateTodayLog('habits', updatedHabits);
    setTodayLogs(updated);
  };

  // Chat: Create New Session
  const handleStartNewChat = () => {
    const newSession = db.addChatSession();
    setChats(db.getChats());
    setActiveChatId(newSession.id);
  };

  // Chat: Send Message
  const handleSendChatMessage = async (textToSend, attachmentType = null, attachmentName = null) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim() && !attachmentType && !activeChatId) return;

    let displayUserText = messageText;
    if (attachmentType === 'image') {
      displayUserText = `📸 Uploaded packaging image: ${attachmentName}`;
    } else if (attachmentType === 'prescription') {
      displayUserText = `📄 Uploaded prescription: ${attachmentName}`;
    }

    if (!activeChatId) return;

    // Add user message to DB & State
    db.addMessageToChat(
      activeChatId, 
      'user', 
      displayUserText, 
      null, 
      attachmentType ? { attachmentType, attachmentName } : null
    );
    setChats(db.getChats());
    setChatInput('');
    setIsAiTyping(true);
    setRagStatus('searching');
    setRagDocTitle('');

    // Stop speaking user-generated speech output triggers
    stopSpeaking();

      const activeChat = chats.find(c => c.id === activeChatId);
      const activeChatMessages = activeChat ? activeChat.messages : [];

      try {
        // Get AI response optimized for multilingual speech and safety alerts
      const aiResponse = await getChatResponse(
        messageText, 
        chats, 
        profile, 
        privacySettings.voiceEnabled, 
        privacySettings.voiceLanguage,
        attachmentType,
        attachmentName,
        reportsList,
        selectedModel,
        isOfflineMode,
        activeChatMessages
      );

      // Simulate step-by-step RAG guidelines search loop
      await new Promise(r => setTimeout(r, 600));
      if (aiResponse.ragDoc) {
        setRagStatus('retrieved');
        setRagDocTitle(aiResponse.ragDoc.title);
        await new Promise(r => setTimeout(r, 900));
      }
      setRagStatus('synthesizing');
      await new Promise(r => setTimeout(r, 500));
      
      const msgMetadata = {
        type: aiResponse.type,
        medicineCard: aiResponse.medicineCard,
        prescriptionSummary: aiResponse.prescriptionSummary,
        allergyAlert: aiResponse.allergyAlert,
        reportRecall: aiResponse.reportRecall
      };

      db.addMessageToChat(activeChatId, 'ai', aiResponse.text, aiResponse.voiceText, msgMetadata);
      if (aiResponse.medicineCard) {
        addRecentSearch(aiResponse.medicineCard.name);
      }
      const updatedChats = db.getChats();
      setChats(updatedChats);

      // Speak response automatically if voice mode is enabled
      if (privacySettings.voiceEnabled && aiResponse.voiceText) {
        const activeChatRef = updatedChats.find(c => c.id === activeChatId);
        const lastMsgIndex = activeChatRef ? activeChatRef.messages.length - 1 : null;
        speakText(aiResponse.voiceText, lastMsgIndex);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiTyping(false);
      setRagStatus(null);
      setRagDocTitle('');
    }
  };

  // Chat: Delete Session
  const handleDeleteChatSession = (id, e) => {
    e.stopPropagation();
    const updated = db.deleteChat(id);
    setChats(updated);
    if (activeChatId === id) {
      setActiveChatId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // RAG Event Handlers
  const handleRagTestSearch = () => {
    if (!ragSearchQuery.trim()) return;
    const result = vectorDb.search(ragSearchQuery, 10, 0.0);
    setRagTestResults(result);
  };

  const handleAddRagDoc = () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      alert("Please enter both Title and Content.");
      return;
    }
    setRagIngestionFlash(true);
    setTimeout(() => {
      vectorDb.addDocument(newDocTitle, newDocCategory, newDocContent);
      setRagDocumentList(vectorDb.getAllDocuments());
      setNewDocTitle('');
      setNewDocContent('');
      setRagIngestionFlash(false);
      setRagTestResults(null);
      setRagSearchQuery('');
    }, 600);
  };

  const handleDeleteRagDoc = (id) => {
    vectorDb.deleteDocument(id);
    setRagDocumentList(vectorDb.getAllDocuments());
    setRagTestResults(null);
    setRagSearchQuery('');
  };

  const handleResetRagDatabase = () => {
    if (confirm("Reset vector database to default medical documents?")) {
      vectorDb.resetDatabase();
      setRagDocumentList(vectorDb.getAllDocuments());
      setRagTestResults(null);
      setRagSearchQuery('');
    }
  };

  // Symptom Form Submission
  const handleCheckSymptoms = async (e) => {
    e.preventDefault();
    if (!symptomForm.symptoms.trim()) return;

    setIsSymptomChecking(true);
    setSymptomResult(null);

    try {
      const result = await checkSymptoms(symptomForm);
      setSymptomResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSymptomChecking(false);
    }
  };

  // Load a Pre-defined Sample Medical Report
  const handleLoadSampleReport = (sample) => {
    setReportFileName(sample.fileName);
    setReportText(sample.content);
  };

  // File Upload Simulator
  const handleFileUploadSimulator = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setReportFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      setReportText(evt.target.result);
    };
    reader.readAsText(file);
  };

  // Medical Report Analysis Submission
  const handleAnalyzeReport = async (e) => {
    e.preventDefault();
    if (profile.subscriptionPlan === 'free') {
      alert("🔒 AI Medical Report Analyzer is a Premium Feature. Please upgrade your subscription plan in Profile Settings to scan lab panels.");
      return;
    }
    if (!reportText.trim()) return;

    setIsAnalyzingReport(true);
    setAnalyzedReport(null);

    const filename = reportFileName || 'uploaded_lab_record.txt';

    try {
      const result = await analyzeMedicalReport(filename, reportText);
      
      // Save to Reports list database
      db.addReport(filename, result.summary, result.explanations, result.doctorQuestions);
      setReportsList(db.getReports());
      setAnalyzedReport(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzingReport(false);
    }
  };

  // Book Appointment Submission
  const handleBookAppointment = (e) => {
    e.preventDefault();
    const { doctorId, date, time, notes } = bookingForm;
    if (!doctorId || !date || !time) return;

    const doctor = DOCTORS.find(d => d.id === doctorId);
    if (!doctor) return;

    db.bookAppointment(doctorId, doctor.name, doctor.specialty, date, time, notes);
    setBookedAppointments(db.getAppointments());
    setBookingForm({ doctorId: '', date: '', time: '09:00 AM', notes: '' });
    
    // Add Notification
    const newNotif = { id: `n-${Date.now()}`, text: `Appointment booked with ${doctor.name} on ${date}.`, read: false };
    setNotifications(prev => [newNotif, ...prev]);

    setBookingSuccessMsg(true);
    setTimeout(() => setBookingSuccessMsg(false), 3000);
  };

  // Cancel Appointment
  const handleCancelAppointment = (id) => {
    const updated = db.cancelAppointment(id);
    setBookedAppointments(updated);
  };

  // Save Privacy Toggles
  const handlePrivacyToggle = (field, val) => {
    const updated = { ...privacySettings, [field]: val };
    db.savePrivacy(updated);
    setPrivacySettings(updated);
  };

  // Clear Chats Setting
  const handleClearChatsSetting = () => {
    if (confirm("Are you sure you want to delete all conversation history? This cannot be undone.")) {
      db.clearAllChats();
      setChats([]);
      setActiveChatId(null);
    }
  };

  // Export summary document download
  const handleExportSummaryDownload = () => {
    const text = db.exportHealthSummary();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HealthAI_Summary_${profile.name.replace(/\s+/g, '_') || 'Patient'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset entire application data
  const handleResetApplication = () => {
    if (confirm("WARNING: This will wipe out all health logs, chats, appointments, and profiles. Reset now?")) {
      db.deleteAccountData();
      // Reload states
      setProfile(db.getProfile());
      setChats(db.getChats());
      setActiveChatId(null);
      setTodayLogs(db.getTodayLogs());
      setWellnessScore(db.calculateWellnessScore());
      setBookedAppointments(db.getAppointments());
      setReportsList(db.getReports());
      setPrivacySettings(db.getPrivacy());
      setView('landing');
      setIsAuthenticated(false);
      setIsDemoMode(false);
    }
  };

  // Filter Doctors Directory
  const filteredDoctors = DOCTORS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(doctorSearch.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  // Calculate read count
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Active chat session
  const activeChat = chats.find(c => c.id === activeChatId);

  // --- RENDERS ---

  return (
    <div 
      className={privacySettings.largeFontMode ? 'large-text-mode' : ''}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}
    >
      
      {/* 1. TOP STICKY HEADER */}
      <header className="glass-panel" style={{
        height: '70px',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated && (
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
              title="Toggle Sidebar"
            >
              <Menu size={20} color="var(--text-secondary)" />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setView('landing')}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '10px', 
              background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)'
            }}>
              <HeartPulse size={22} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                HealthAI <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '20px', backgroundColor: 'var(--accent-blue-glow)' }}>Companion</span>
              </h1>
            </div>
          </div>
          {isAuthenticated && (
            <span style={{
              fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '20px',
              backgroundColor: profile.subscriptionPlan === 'clinic' ? 'var(--accent-teal-glow)' : profile.subscriptionPlan === 'premium' ? 'rgba(234, 88, 12, 0.15)' : 'var(--bg-tertiary)',
              color: profile.subscriptionPlan === 'clinic' ? 'var(--accent-teal)' : profile.subscriptionPlan === 'premium' ? 'var(--accent-warning)' : 'var(--text-muted)',
              border: '1px solid currentColor', textTransform: 'uppercase'
            }}>
              {profile.subscriptionPlan || 'Free'} Plan
            </span>
          )}
        </div>

        {/* User state and Quick Alerts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
          {/* Online/Offline Status Toggle Badge */}
          <button 
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: '600',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              backgroundColor: isOfflineMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              color: isOfflineMode ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOfflineMode ? 'var(--accent-rose)' : 'var(--accent-emerald)'
            }} />
            <span>{isOfflineMode ? 'Offline Mode' : 'Online'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: '600', backgroundColor: 'rgba(225, 29, 72, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '20px' }}>
            <ShieldAlert size={14} />
            <span>Not a replacement for clinical advice</span>
          </div>

          {isAuthenticated ? (
            <>
              {/* Notification icon */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => {
                    setShowNotificationPanel(!showNotificationPanel);
                    if (!showNotificationPanel) handleMarkNotificationsRead();
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}
                >
                  <Bell size={20} color="var(--text-secondary)" />
                  {unreadNotifCount > 0 && (
                    <span style={{ 
                      position: 'absolute', top: '-4px', right: '-4px', 
                      width: '18px', height: '18px', borderRadius: '50%', 
                      backgroundColor: 'var(--accent-rose)', color: '#ffffff', 
                      fontSize: '10px', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', fontWeight: 'bold'
                    }}>{unreadNotifCount}</span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotificationPanel && (
                  <div className="glass-panel" style={{
                    position: 'absolute', right: 0, top: '45px', width: '320px',
                    borderRadius: '12px', padding: '1rem', backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', zIndex: 100
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem' }}>System Alerts</h4>
                      <button onClick={() => setNotifications([])} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Clear all</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: n.read ? 'transparent' : 'var(--accent-teal)', marginTop: '6px' }} />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.2' }}>{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar tag with dropdown */}
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="var(--accent-teal)" />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>{profile.name || 'User Profile'}</span>
                </div>

                {showProfileMenu && (
                  <div className="glass-panel animate-fade-in" style={{
                    position: 'absolute',
                    right: 0,
                    top: '45px',
                    width: '180px',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100
                  }}>
                    <button 
                      onClick={() => { setShowProfileMenu(false); navigateToView('dashboard'); }}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                      className="profile-menu-item"
                    >
                      <Activity size={14} />
                      Dashboard
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); navigateToView('profile'); }}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                      className="profile-menu-item"
                    >
                      <User size={14} />
                      Profile Card
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); navigateToView('settings'); }}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                      className="profile-menu-item"
                    >
                      <Settings size={14} />
                      Settings
                    </button>
                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />
                    <button 
                      onClick={() => { setShowProfileMenu(false); setIsAuthenticated(false); setIsDemoMode(false); navigateToView('landing'); }}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '6px',
                        textAlign: 'left',
                        fontSize: '0.85rem',
                        color: 'var(--accent-rose)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                      className="profile-menu-item"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setView('auth'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600' }}
            >
              <LogIn size={16} />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. BODY LAYOUT WRAPPER */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* SIDEBAR NAVIGATION (Only when authenticated) */}
        {isAuthenticated && (
          <aside className="glass-panel" style={{
            width: sidebarCollapsed ? '75px' : '260px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem 0.75rem',
            transition: 'width var(--transition-normal) ease',
            zIndex: 40
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1, paddingRight: '0.2rem' }}>
              <button 
                onClick={() => navigateToView('dashboard')}
                className={`sidebar-link ${view === 'dashboard' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <Activity size={20} />
                {!sidebarCollapsed && <span>Dashboard</span>}
              </button>
              
              <button 
                onClick={() => navigateToView('chat')}
                className={`sidebar-link ${view === 'chat' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <MessageSquare size={20} />
                {!sidebarCollapsed && <span>AI Chat Assistant</span>}
              </button>

              <button 
                onClick={() => navigateToView('tracker')}
                className={`sidebar-link ${view === 'tracker' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <HeartPulse size={20} />
                {!sidebarCollapsed && <span>Health Tracker</span>}
              </button>

              <button 
                onClick={() => navigateToView('appointments')}
                className={`sidebar-link ${view === 'appointments' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <Calendar size={20} />
                {!sidebarCollapsed && <span>Appointments</span>}
              </button>

              {profile.subscriptionPlan === 'clinic' && (
                <button 
                  onClick={() => navigateToView('doctor-portal')}
                  className={`sidebar-link ${view === 'doctor-portal' ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', border: '1.5px solid var(--accent-teal)', backgroundColor: 'var(--accent-teal-glow)', marginTop: '0.5rem' }}
                >
                  <UserCheck size={20} color="var(--accent-teal)" />
                  {!sidebarCollapsed && <span style={{ color: 'var(--accent-teal)', fontWeight: '700' }}>Doctor Portal</span>}
                </button>
              )}

              <button 
                onClick={() => navigateToView('profile')}
                className={`sidebar-link ${view === 'profile' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <User size={20} />
                {!sidebarCollapsed && <span>Profile</span>}
              </button>

              <button 
                onClick={() => navigateToView('settings')}
                className={`sidebar-link ${view === 'settings' ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <Settings size={20} />
                {!sidebarCollapsed && <span>Settings</span>}
              </button>
            </div>

            {/* Logout bottom */}
            <div>
              <div style={{ borderBottom: '1px solid var(--border-color)', margin: '1rem 0' }} />
              <button 
                onClick={() => { setIsAuthenticated(false); setIsDemoMode(false); navigateToView('landing'); }}
                className="sidebar-link"
                style={{ width: '100%', color: 'var(--accent-rose)', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              >
                <LogOut size={20} />
                {!sidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          </aside>
        )}

        {/* MAIN DISPLAY CONTAINER */}
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Transition Loader Overlay */}
          {pageLoading && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              zIndex: 999
            }} className="animate-fade-in">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--accent-teal)',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                Querying HealthAI databases...
              </span>
            </div>
          )}

          {/* Floating Demo Mode Banner */}
          {isAuthenticated && isDemoMode && !isOfflineMode && (
            <div className="demo-mode-banner animate-fade-in" style={{ margin: '1.5rem 2rem 0 2rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', marginRight: '0.25rem' }}></span>
              <span><strong>Demo Mode Sandbox</strong> — Pre-populated data loaded. Real-time diagnostic simulations active. No sensitive data stored.</span>
              <span className="demo-badge-inline" style={{ marginLeft: 'auto' }}>Active Demo</span>
            </div>
          )}

          {isOfflineMode ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-primary)'
            }} className="animate-fade-in">
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-rose-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: 'var(--accent-rose)'
              }}>
                <ShieldAlert size={40} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
                Offline Mode Active
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
                You have simulated a network disconnection. HealthAI Companion's secure local offline-resilient buffer database is active, but remote cloud API calls are paused.
              </p>
              <button
                onClick={() => setIsOfflineMode(false)}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-teal)',
                  color: '#ffffff',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px var(--accent-teal-glow)'
                }}
              >
                <RefreshCcw size={16} />
                Reconnect Online Services
              </button>
            </div>
          ) : (
            <>
              {/* --- LANDING VIEW --- */}
              {view === 'landing' && (
            <div className="animate-fade-in" style={{ padding: '0 2rem 3rem 2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '5rem' }}>
              
              {/* Sticky Landing Header / Navbar */}
              <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HeartPulse size={24} color="var(--accent-teal)" />
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>HealthAI <span style={{ color: 'var(--accent-blue)' }}>Companion</span></span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <button onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ border: 'none', background: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500' }}>Features</button>
                  <button onClick={() => document.getElementById('architecture-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ border: 'none', background: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500' }}>Architecture</button>
                  <button onClick={() => document.getElementById('developer-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ border: 'none', background: 'none', fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500' }}>Developer Showcase</button>
                  {isAuthenticated ? (
                    <button 
                      onClick={() => setView('dashboard')}
                      style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      Enter Dashboard
                    </button>
                  ) : (
                    <button 
                      onClick={handleTryDemo}
                      style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal-glow)', color: 'var(--accent-teal)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--accent-teal)' }}
                    >
                      Launch Sandbox
                    </button>
                  )}
                </div>
              </nav>

              {/* Hero Banner Grid */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap-reverse', marginTop: '1rem' }}>
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <span style={{ color: 'var(--accent-teal)', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} /> Showcase Portfolio Project
                  </span>
                  <h2 style={{ fontSize: '3.2rem', fontFamily: 'var(--font-display)', lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }}>
                    Your AI-powered healthcare companion for <span className="text-gradient-teal">smarter wellness</span>
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    Track daily wellness parameters, evaluate lifestyle health risks, translate complex biochemical panels, and perform real-time multilingual voice dialogues inside a secure client-side sandbox.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button 
                      onClick={handleTryDemo}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.8rem', borderRadius: '10px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600', boxShadow: '0 4px 14px var(--accent-teal-glow)' }}
                    >
                      Try Sandbox Demo
                      <ArrowRight size={18} />
                    </button>
                    <button 
                      onClick={() => document.getElementById('architecture-section')?.scrollIntoView({ behavior: 'smooth' })}
                      style={{ padding: '0.9rem 1.8rem', borderRadius: '10px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: '600', backgroundColor: '#ffffff' }}
                    >
                      Explore Features
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.5rem', color: 'var(--accent-teal)', fontWeight: '800' }}>RAG</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NIH & CDC Verified Guides</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.5rem', color: 'var(--accent-blue)', fontWeight: '800' }}>VOICE</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Multilingual TTS & STT</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.5rem', color: 'var(--accent-emerald)', fontWeight: '800' }}>SECURE</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Offline Sandbox Storage</p>
                    </div>
                  </div>
                </div>

                <div style={{ flex: '1 1 450px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    {/* Visual mockup of the app dashboard */}
                    <div className="health-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', position: 'relative', zIndex: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Activity color="var(--accent-teal)" size={18} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>HEALTH SANDBOX</span>
                        </div>
                        <span className="demo-badge-inline">Demo Active</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>84</span>
                        <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/ 100 score</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Droplet size={14} color="var(--accent-blue)" /> Water</span>
                          <span style={{ fontWeight: '600' }}>1,800 / 2,000 ml</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                          <div style={{ width: '90%', height: '100%', backgroundColor: 'var(--accent-blue)', borderRadius: '4px' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Moon size={14} color="var(--accent-teal)" /> Sleep</span>
                          <span style={{ fontWeight: '600' }}>7.5 / 8 hours</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                          <div style={{ width: '93%', height: '100%', backgroundColor: 'var(--accent-teal)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    </div>

                    <div style={{
                      position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px',
                      borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-teal-glow) 0%, transparent 70%)', zIndex: 1
                    }} />
                    <div style={{
                      position: 'absolute', bottom: '-30px', left: '-30px', width: '200px', height: '200px',
                      borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-blue-glow) 0%, transparent 70%)', zIndex: 1
                    }} />
                  </div>
                </div>
              </div>

              {/* Feature Showcase Section */}
              <div id="features-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>Startup Feature Blueprint</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>A fully integrated workflow answering consumer wellness tracking and educational requirements.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare color="var(--accent-teal)" size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem' }}>AI Health Chatbot</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Consult with our calm AI on wellness metrics, asthma triggers, and nutritional targets, featuring step-by-step follow-up questioning.
                    </p>
                  </div>

                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Volume2 color="var(--accent-blue)" size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem' }}>Voice AI Assistant</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Hands-free transcribing using browser-native SpeechRecognition and Text-to-Speech playback optimized for English, Hindi, and Hinglish dialects.
                    </p>
                  </div>

                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText color="var(--accent-emerald)" size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem' }}>Medical Report Analyzer</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Translate biochemistry panel metrics (Vitamin D, Lipids, Metabolic rates) into simple terminology and generate questions for your GP.
                    </p>
                  </div>

                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity color="var(--accent-warning)" size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem' }}>Health Dashboard</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Monitor hydration levels, sleep hours, exercise time, steps, and active calories with interactive gauges and wellness checklists.
                    </p>
                  </div>

                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar color="var(--accent-teal)" size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem' }}>Appointment Planner</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Search mock clinic specialists, schedule slots with booking forms, and trigger custom calendar alarms and clinician portal summaries.
                    </p>
                  </div>

                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: 'var(--accent-rose-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldAlert color="var(--accent-rose)" size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem' }}>Emergency SOS Assistant</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Crisis keyword interceptor that renders safety panels, first-aid indexes, nearby ER departments, and simulated GPS map pointers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Portfolio Deep Dive Section */}
              <div id="architecture-section" className="portfolio-showcase-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>System Architecture Showcase</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Overview of the offline-first secure RAG pipelines and speech models implemented in the workspace.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>1. Client-Side RAG & Voice Pipeline</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      To protect patient parameters, this project operates entirely client-side. Custom RAG guidelines lookup is simulated against verified medical guides (NIH Asthma, AHA Hypertension, CDC Flu Guides, WHO Allergies) prior to synthesizing safety-compliant clinical responses.
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      Voice interactions utilize browser Web Speech APIs, resolving audio inputs client-side, eliminating external cloud data transmissions.
                    </p>

                    <div style={{ borderLeft: '4px solid var(--accent-blue)', paddingLeft: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Portfolio Highlight:</strong> Includes a Crisis Interceptor watching for severe chest pain, breathing difficulties, or heavy bleeding, automatically blocking standard AI chats and throwing emergency SOS alerts.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Pipeline Flow Chart</h4>
                    
                    <div className="architecture-flow-diagram">
                      <div className="diagram-step-row">
                        <div className="diagram-node">
                          <div className="diagram-node-title">1. Input Intake</div>
                          <p className="diagram-node-text">Patient enters query via text or browser microphone.</p>
                        </div>
                        <div className="diagram-connector-arrow">&rarr;</div>
                        <div className="diagram-node">
                          <div className="diagram-node-title">2. Safety Check</div>
                          <p className="diagram-node-text">Keyword filters check for emergency warning symptoms.</p>
                        </div>
                      </div>

                      <div className="diagram-step-row" style={{ marginTop: '0.5rem' }}>
                        <div className="diagram-node">
                          <div className="diagram-node-title">3. RAG Guide Fetch</div>
                          <p className="diagram-node-text">Matches keywords to NIH/CDC/WHO guidelines databases.</p>
                        </div>
                        <div className="diagram-connector-arrow">&rarr;</div>
                        <div className="diagram-node">
                          <div className="diagram-node-title">4. AI Brain Synthesis</div>
                          <p className="diagram-node-text">Compiles responses in simple, professional, non-clinical tone.</p>
                        </div>
                      </div>

                      <div className="diagram-step-row" style={{ marginTop: '0.5rem' }}>
                        <div className="diagram-node" style={{ flex: 1 }}>
                          <div className="diagram-node-title">5. Audio Readout</div>
                          <p className="diagram-node-text">Translates output back to spoken speech using customizable Pitch/Speed TTS utterance models.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Developer Showcase Section */}
              <div id="developer-section" className="portfolio-showcase-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '2rem', fontWeight: '800' }}>Developer Showcase</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>About the engineer behind the HealthAI Companion platform.</p>
                </div>

                <div className="dev-profile-card">
                  <div className="dev-avatar">AM</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.4rem', color: 'var(--text-primary)' }}>Alex Mercer</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: '600' }}>Healthcare AI Systems & UI Architect</p>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      I am a full-stack engineer passionate about safe, client-side artificial intelligence systems, accessible UI/UX components, and HIPAA-compliant data architectures. HealthAI Companion serves as a demonstration of responsive front-end engineering combined with browser-native speech processing.
                    </p>
                    
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Core Capabilities</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="skill-tag">React / Next.js</span>
                        <span className="skill-tag">Vite Tools</span>
                        <span className="skill-tag">Conversational AI</span>
                        <span className="skill-tag">Web Speech STT/TTS</span>
                        <span className="skill-tag">RAG Architecture</span>
                        <span className="skill-tag">Vanilla CSS Grid</span>
                        <span className="skill-tag">Vercel Optimize</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="portfolio-link-btn" style={{ textDecoration: 'none' }}>
                        <span>GitHub Profile</span>
                      </a>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="portfolio-link-btn" style={{ textDecoration: 'none' }}>
                        <span>LinkedIn Connection</span>
                      </a>
                      <a href="https://portfolio.dev" target="_blank" rel="noopener noreferrer" className="portfolio-link-btn" style={{ textDecoration: 'none' }}>
                        <span>Developer Portfolio</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER DISCLAIMER */}
              <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifySelf: 'center', justifyContent: 'center', color: 'var(--accent-rose)', fontWeight: '600', fontSize: '0.8rem' }}>
                  <ShieldAlert size={14} />
                  <span>Privacy Notice: Your health information is private and should not be used as a replacement for professional medical care.</span>
                </div>
                <p>HealthAI Companion is an AI-powered health educational platform. It does not provide clinical diagnoses, medical treatments, or pharmaceutical prescriptions.</p>
                <p>&copy; {new Date().getFullYear()} HealthAI Companion. All patient records are stored locally on your device for absolute data privacy.</p>
              </footer>
            </div>
          )}


          {/* --- AUTHENTICATION VIEW --- */}
          {view === 'auth' && (
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '2rem' }}>
              <div className="health-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={24} color="#ffffff" />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
                    {authMode === 'login' ? 'Welcome Back' : 'Create Wellness Account'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Your logs and profile remain confidential on this browser.
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {authMode === 'signup' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Jane Doe" 
                        value={authName} 
                        onChange={(e) => setAuthName(e.target.value)}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="jane.doe@example.com" 
                      value={authEmail} 
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••" 
                      value={authPassword} 
                      onChange={(e) => setAuthPassword(e.target.value)}
                    />
                  </div>

                  {authMode === 'signup' && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.25rem' }}>
                      <input type="checkbox" required id="privacyAgree" style={{ marginTop: '3px', width: 'auto' }} />
                      <label htmlFor="privacyAgree" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                        I agree to keep health data stored locally and understand this app is for educational purposes only.
                      </label>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    style={{
                      width: '100%', padding: '0.85rem', borderRadius: '8px', 
                      backgroundColor: 'var(--accent-teal)', color: '#ffffff', 
                      fontWeight: '600', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem',
                      boxShadow: '0 4px 10px var(--accent-teal-glow)'
                    }}
                  >
                    <span>{authMode === 'login' ? 'Sign In' : 'Sign Up'}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>

                <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  {authMode === 'login' ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Don't have an account?{' '}
                      <button onClick={() => setAuthMode('signup')} style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>Register here</button>
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Already registered?{' '}
                      <button onClick={() => setAuthMode('login')} style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>Sign In here</button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* --- HEALTH DASHBOARD VIEW --- */}
          {view === 'dashboard' && (
            <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* TOP SECTION: Welcome & Profile Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
                
                {/* Welcome Message Card */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem', minHeight: '160px', background: 'linear-gradient(135deg, #ffffff 0%, var(--bg-primary) 100%)' }}>
                  <div>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                      Hello, {profile.name.split(' ')[0] || 'User'}!
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
                      Welcome back to your personalized healthcare dashboard. All health indexes are monitored and calculated locally.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    📅 {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {/* Patient Profile Summary Card */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Parameters</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profile.gender}, {profile.age} yrs</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Blood Group:</strong> {profile.bloodGroup || 'O-Positive'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Allergies:</strong> <span style={{ color: 'var(--accent-rose)', fontWeight: '500' }}>{profile.allergies || 'None reported'}</span>
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <strong>Medical History:</strong> {profile.medicalHistory || 'No chronic issues'}
                    </p>
                  </div>
                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Emergency Contact: {profile.emergencyContact ? profile.emergencyContact.split(' - ')[0] : 'None'}</span>
                    <button onClick={() => navigateToView('profile')} style={{ color: 'var(--accent-teal)', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer' }}>Edit</button>
                  </div>
                </div>

                {/* Digital Health summary Card */}
                <div className="health-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.5rem', cursor: 'pointer' }} onClick={() => navigateToView('profile')}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <QrCode size={24} color="#ffffff" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Health Summary Passport</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                      Expand Digital Health Passport card, verify scan configurations, or print credentials paper records.
                    </p>
                  </div>
                </div>

              </div>

              {/* MIDDLE SECTION: Health Widgets & AI Tools */}
              
              {/* 1. Health Widgets */}
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Daily Wellness Widgets</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Wellness Score Widget */}
                  <div className="health-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="80" height="80" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent-teal)" strokeDasharray={`${wellnessScore}, 100`} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.4s' }} />
                      </svg>
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{wellnessScore}</span>
                        <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Index</span>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem' }}>Wellness Score</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Calculated daily target index status.</p>
                    </div>
                  </div>

                  {/* Sleep Tracker Card */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Moon size={16} color="var(--accent-teal)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Sleep duration</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Goal: 8h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800' }}>{todayLogs.sleep} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>hrs</span></span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => adjustTracker('sleep', -0.5, 0, 24)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer' }}>-</button>
                        <button onClick={() => adjustTracker('sleep', 0.5, 0, 24)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Water Tracker Card */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Droplet size={16} color="var(--accent-blue)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Water intake</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Goal: 2L</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800' }}>{todayLogs.water} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>ml</span></span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => adjustTracker('water', -250, 0)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer' }}>-</button>
                        <button onClick={() => adjustTracker('water', 250, 0)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--accent-blue)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Tracker Card */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Dumbbell size={16} color="var(--accent-emerald)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Exercise Time</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Goal: 30m</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: '800' }}>{todayLogs.exercise} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>mins</span></span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => adjustTracker('exercise', -5, 0)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer' }}>-</button>
                        <button onClick={() => adjustTracker('exercise', 5, 0)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--accent-emerald)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* 2. AI Health Tools Cards */}
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>AI Health Tools</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Medicine Assistant Card */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyItems: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pill size={20} color="var(--accent-teal)" />
                      </div>
                      <h4 style={{ fontSize: '1.1rem' }}>Medicine Assistant</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                      Search medicines, understand uses, and explain prescriptions
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <button 
                        onClick={() => { navigateToView('chat'); setShowMedSearchPanel(true); }}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Search Medicine
                      </button>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button 
                          onClick={() => { navigateToView('chat'); setShowMedSearchPanel(true); setShowAttachmentDropdown(true); }}
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', textAlign: 'center' }}
                        >
                          Upload Medicine Image
                        </button>
                        <button 
                          onClick={() => { navigateToView('chat'); handleSendChatMessage("Explain my prescription"); }}
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', textAlign: 'center' }}
                        >
                          Explain Prescription
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Medical Report Analyzer Card */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyItems: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--accent-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={20} color="var(--accent-blue)" />
                      </div>
                      <h4 style={{ fontSize: '1.1rem' }}>Medical Report Analyzer</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                      Upload medical reports and get AI-powered explanations
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <button 
                        onClick={() => navigateToView('reports')}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--accent-blue)', color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Upload Report
                      </button>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button 
                          onClick={() => navigateToView('reports')}
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', textAlign: 'center' }}
                        >
                          Analyze Report
                        </button>
                        <button 
                          onClick={() => {
                            navigateToView('reports');
                            setTimeout(() => {
                              document.getElementById('reports-history')?.scrollIntoView({ behavior: 'smooth' });
                            }, 500);
                          }}
                          style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', textAlign: 'center' }}
                        >
                          View Report History
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Voice Assistant Card */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyItems: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mic size={20} color="var(--accent-teal)" />
                      </div>
                      <h4 style={{ fontSize: '1.1rem' }}>Voice Assistant</h4>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                      Speak to your HealthAI companion in English, Hindi, or Hinglish. Customize speed rates and voice genders.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <button 
                        onClick={() => { navigateToView('chat'); setTimeout(() => { toggleListening(); }, 500); }}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Speak Now
                      </button>
                      <button 
                        onClick={() => navigateToView('settings')}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '500', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Voice Settings
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* 3. More Resources & Safety Tools Section */}
              <div className="health-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-tertiary)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem' }}>More Clinical Resources & Emergency Tools</h4>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => navigateToView('symptoms')} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Stethoscope size={14} color="var(--accent-blue)" /> Symptom Checker
                  </button>
                  <button onClick={() => navigateToView('risk')} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ClipboardList size={14} color="var(--accent-teal)" /> Health Assessment
                  </button>
                  <button onClick={() => navigateToView('education')} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <BookOpen size={14} color="var(--accent-blue)" /> Health Library
                  </button>
                  <button onClick={() => navigateToView('emergency')} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(225, 29, 72, 0.2)', backgroundColor: 'var(--accent-rose-glow)', fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldAlert size={14} color="var(--accent-rose)" /> Emergency SOS (First Aid)
                  </button>
                </div>
              </div>

              {/* BOTTOM SECTION: Recent Conversations & Upcoming Appointments */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                
                {/* Recent AI Conversations */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Recent AI Consultations</h3>
                    <button onClick={() => navigateToView('chat')} style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer' }}>New Chat</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    {chats.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '1.5px dashed var(--border-color)', borderRadius: '12px', gap: '0.5rem' }}>
                        <MessageSquare size={20} color="var(--text-muted)" />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No recent consultations. Connect with your assistant to begin.</p>
                      </div>
                    ) : (
                      chats.slice(0, 3).map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => { setActiveChatId(c.id); navigateToView('chat'); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer', transition: 'background-color 0.15s' }}
                          className="recent-chat-item"
                        >
                          <MessageSquare size={16} color="var(--accent-teal)" />
                          <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                            {c.title || "Active Consultation Session"}
                          </span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].timestamp ? new Date(c.messages[c.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now' : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Upcoming Appointments</h3>
                    <button onClick={() => navigateToView('appointments')} style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer' }}>Manage</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                    {bookedAppointments.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '1.5px dashed var(--border-color)', borderRadius: '12px', gap: '0.5rem' }}>
                        <Calendar size={20} color="var(--text-muted)" />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No upcoming appointments scheduled.</p>
                        <button onClick={() => navigateToView('appointments')} style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: '600', border: 'none', background: 'transparent', cursor: 'pointer' }}>Schedule Consultation</button>
                      </div>
                    ) : (
                      bookedAppointments.slice(0, 3).map(apt => (
                        <div key={apt.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)', alignItems: 'center' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--accent-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Stethoscope color="var(--accent-blue)" size={18} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{apt.doctorName}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{apt.doctorSpecialty}</p>
                            <p style={{ fontSize: '0.7rem', fontWeight: '500', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {apt.date} at {apt.time}
                            </p>
                          </div>
                          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', height: 'fit-content', padding: '0.15rem 0.4rem', borderRadius: '8px', backgroundColor: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', fontWeight: '600' }}>Confirmed</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* --- DEDICATED HEALTH TRACKER VIEW --- */}
          {view === 'tracker' && (
            <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Interactive Health Tracker</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log daily physical parameters, update wellness checklist, and review history charts.</p>
              </div>

              {/* INTERACTIVE TRACKERS BLOCK */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                
                {/* 1. Water Intake */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Droplet size={18} color="var(--accent-blue)" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Water Intake</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Goal: 2000 ml</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: 'center', margin: '0.5rem 0' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{todayLogs.water}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ml</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      onClick={() => adjustTracker('water', -250, 0)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      onClick={() => adjustTracker('water', 250, 0)}
                      style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-blue)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={16} />
                      250 ml
                    </button>
                  </div>
                </div>

                {/* 2. Sleep Tracker */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Moon size={18} color="var(--accent-teal)" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Sleep Duration</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Goal: 8 hrs</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: 'center', margin: '0.5rem 0' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{todayLogs.sleep}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>hours</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      onClick={() => adjustTracker('sleep', -0.5, 0, 24)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      onClick={() => adjustTracker('sleep', 0.5, 0, 24)}
                      style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={16} />
                      0.5 hrs
                    </button>
                  </div>
                </div>

                {/* 3. Exercise Tracker */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Dumbbell size={18} color="var(--accent-emerald)" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Exercise Time</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Goal: 30 mins</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: 'center', margin: '0.5rem 0' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{todayLogs.exercise}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>mins</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      onClick={() => adjustTracker('exercise', -5, 0)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      onClick={() => adjustTracker('exercise', 5, 0)}
                      style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-emerald)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={16} />
                      5 mins
                    </button>
                  </div>
                </div>

                {/* 4. Mood Tracker */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Smile size={18} color="var(--accent-warning)" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Current Mood</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rating: {todayLogs.mood}/5</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-around', margin: '1rem 0' }}>
                    {[1, 2, 3, 4, 5].map((level) => {
                      const isActive = todayLogs.mood === level;
                      const emoji = level === 1 ? '😢' : level === 2 ? '😕' : level === 3 ? '😐' : level === 4 ? '🙂' : '😄';
                      return (
                        <button
                          key={level}
                          onClick={() => handleMoodSelect(level)}
                          style={{
                            fontSize: '1.8rem',
                            transform: isActive ? 'scale(1.25)' : 'scale(1)',
                            opacity: isActive ? '1' : '0.4',
                            filter: isActive ? 'grayscale(0)' : 'grayscale(30%)',
                            transition: 'all 0.15s ease',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                          title={`Mood level ${level}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {todayLogs.mood === 5 ? 'Feeling wonderful!' : todayLogs.mood === 4 ? 'Happy & healthy' : todayLogs.mood === 3 ? 'Neutral energy' : 'Take it easy today'}
                  </div>
                </div>

                {/* 5. Steps Tracker */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={18} color="var(--accent-teal)" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Daily Steps</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Goal: 10,000</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: 'center', margin: '0.5rem 0' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{todayLogs.steps || 0}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>steps</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      onClick={() => adjustTracker('steps', -1000, 0, 50000)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer' }}
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      onClick={() => adjustTracker('steps', 1000, 0, 50000)}
                      style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={16} />
                      1,000 steps
                    </button>
                  </div>
                </div>

                {/* 6. Calorie Tracker */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Flame size={18} color="var(--accent-warning)" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Calorie Intake</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: 2,000 kcal</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', justifyContent: 'center', margin: '0.5rem 0' }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{todayLogs.calories || 0}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>kcal</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      onClick={() => adjustTracker('calories', -100, 0, 10000)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', cursor: 'pointer' }}
                    >
                      <Minus size={16} />
                    </button>
                    <button 
                      onClick={() => adjustTracker('calories', 100, 0, 10000)}
                      style={{ padding: '0.5rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-warning)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer' }}
                    >
                      <Plus size={16} />
                      100 kcal
                    </button>
                  </div>
                </div>

                {/* 7. Wellness Habits Checklist */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--accent-emerald-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={18} color="var(--accent-emerald)" />
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Wellness Habits</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score Bonus</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    {['Stretched in the morning', 'Mindful breathing', 'Drank water before coffee'].map(habit => {
                      const isChecked = todayLogs.habits?.includes(habit);
                      return (
                        <label key={habit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem 0' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked || false}
                            onChange={() => handleToggleHabit(habit)}
                            style={{ cursor: 'pointer', width: 'auto' }}
                          />
                          <span style={{ textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                            {habit}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* HISTORICAL TRENDS & APPOINTMENT OVERVIEWS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>
                
                {/* Historical Log list */}
                <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Recent Wellness Logs</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.keys(db.getTrackerLogs()).sort((a,b) => new Date(b) - new Date(a)).slice(0, 4).map((date) => {
                      const dLog = db.getTrackerLogs()[date];
                      const dayScore = db.calculateWellnessScore(dLog);
                      return (
                        <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)' }}>
                          <div>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{date === new Date().toISOString().split('T')[0] ? 'Today' : date}</span>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>💧 {dLog.water}ml</span>
                              <span>😴 {dLog.sleep}hrs</span>
                              <span>🏃 {dLog.exercise}mins</span>
                              <span>Mood: {dLog.mood}/5</span>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-teal)' }}>{dayScore} Score</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* --- AI COPILOT CHAT VIEW --- */}
          {view === 'chat' && (
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              
              {/* Chats List Sidebar (Collapsible/Toggleable) */}
              <div className="glass-panel" style={{ width: '280px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    onClick={handleStartNewChat}
                    style={{
                      width: '100%', padding: '0.75rem', borderRadius: '8px', 
                      backgroundColor: 'var(--accent-teal)', color: '#ffffff', 
                      fontWeight: '600', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '0.5rem', boxShadow: '0 2px 6px var(--accent-teal-glow)'
                    }}
                  >
                    <Plus size={16} />
                    New Consultation
                  </button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', paddingLeft: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Active History</span>
                  {chats.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No conversations yet</p>
                  ) : (
                    chats.map(c => {
                      const isActive = c.id === activeChatId;
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => setActiveChatId(c.id)}
                          style={{
                            padding: '0.75rem', borderRadius: '8px',
                            backgroundColor: isActive ? 'var(--accent-teal-glow)' : 'transparent',
                            color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                            fontWeight: isActive ? '600' : '400',
                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <MessageSquare size={16} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.85rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{c.title}</span>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteChatSession(c.id, e)}
                            style={{ opacity: isActive ? 1 : 0, color: 'var(--accent-rose)' }}
                            title="Delete Chat"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={handleClearChatsSetting}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #fee2e2', color: 'var(--accent-rose)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', backgroundColor: '#fff5f5' }}
                  >
                    <Trash2 size={14} />
                    Wipe Chat History
                  </button>
                </div>
              </div>

              {/* Chat Messages Pane */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)' }}>
                {activeChat ? (
                  <>
                    {/* Active Chat Header */}
                    <div style={{ padding: '1rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{activeChat.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Virtual Clinical Knowledge AI</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                          onClick={() => setShowRagExplorer(!showRagExplorer)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            border: showRagExplorer ? '1.5px solid var(--accent-teal)' : '1px solid var(--border-color)',
                            backgroundColor: showRagExplorer ? 'var(--accent-teal-glow)' : 'transparent',
                            color: showRagExplorer ? 'var(--accent-teal)' : 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Sparkles size={14} />
                          <span>RAG Explorer</span>
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Shield size={14} color="var(--accent-teal)" /> Secure Locally Encrypted
                        </span>
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {activeChat.messages.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', itemsAlign: 'center', justifyContent: 'center', flex: 1, gap: '1.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
                          <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <Stethoscope size={32} color="var(--accent-teal)" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.4rem' }}>Ask your Healthcare Question</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                              Type your symptoms or questions. Remember, I provide general educational resources only. Do not ask for drug prescriptions or critical emergencies.
                            </p>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                            {CHAT_SUGGESTIONS.map((sug, idx) => (
                              <button 
                                key={idx}
                                onClick={() => handleSendChatMessage(sug)}
                                style={{
                                  padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                  backgroundColor: '#ffffff', color: 'var(--text-secondary)', fontSize: '0.8rem',
                                  textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                  gap: '0.5rem', transition: 'all 0.15s'
                                }}
                              >
                                <ChevronRight size={14} color="var(--accent-teal)" />
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        activeChat.messages.map((m, idx) => {
                          const isAi = m.sender === 'ai';
                          return (
                            <div 
                              key={idx} 
                              className="animate-chat-msg"
                              style={{ 
                                display: 'flex', 
                                justifyContent: isAi ? 'flex-start' : 'flex-end', 
                                gap: '1rem',
                                maxWidth: '800px',
                                alignSelf: isAi ? 'flex-start' : 'flex-end'
                              }}
                            >
                              {isAi && (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <HeartPulse size={16} color="#ffffff" />
                                </div>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                 {isAi && m.metadata && m.metadata.type === 'medicine' && m.metadata.medicineCard ? (
                                  <div className="medicine-info-card" style={{
                                    backgroundColor: '#ffffff', borderRadius: '12px', border: '1.5px solid var(--accent-teal)',
                                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                                    boxShadow: 'var(--shadow-md)', maxWidth: '100%', width: '480px', animation: 'scale-up 0.2s ease'
                                  }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <HeartPulse size={20} color="var(--accent-teal)" />
                                      </div>
                                      <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                          {m.metadata.medicineCard.name}
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                          Brand: {m.metadata.medicineCard.brandName} | Generic: {m.metadata.medicineCard.genericName}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Allergy Danger Warning */}
                                    {m.metadata.allergyAlert && (
                                      <div style={{
                                        backgroundColor: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '8px',
                                        padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                                        color: '#b91c1c', fontSize: '0.8rem', fontWeight: '500', lineHeight: '1.4'
                                      }}>
                                        <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <div>{m.metadata.allergyAlert}</div>
                                      </div>
                                    )}

                                    {/* Report Sync Notice */}
                                    {m.metadata.reportRecall && (
                                      <div style={{
                                        backgroundColor: '#eff6ff', border: '1.5px solid #3b82f6', borderRadius: '8px',
                                        padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                                        color: '#1d4ed8', fontSize: '0.8rem', fontWeight: '500', lineHeight: '1.4'
                                      }}>
                                        <Info size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <div>{m.metadata.reportRecall}</div>
                                      </div>
                                    )}

                                    {/* Details Grid */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                                      <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>Category:</strong>{' '}
                                        <span style={{ color: 'var(--text-secondary)' }}>{m.metadata.medicineCard.category}</span>
                                      </div>
                                      <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>General Purpose:</strong>{' '}
                                        <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>{m.metadata.medicineCard.purpose}</p>
                                      </div>
                                      <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>Common Uses:</strong>{' '}
                                        <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>{m.metadata.medicineCard.commonUses}</p>
                                      </div>
                                      <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>Precautions:</strong>{' '}
                                        <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>{m.metadata.medicineCard.precautions}</p>
                                      </div>
                                      <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>Common Side Effects:</strong>{' '}
                                        <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-secondary)' }}>{m.metadata.medicineCard.sideEffects}</p>
                                      </div>
                                    </div>

                                    {/* Red Warning Alert */}
                                    <div style={{
                                      backgroundColor: '#fffbeb', border: '1.5px solid #f59e0b', borderRadius: '8px',
                                      padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                                      color: '#b45309', fontSize: '0.8rem', lineHeight: '1.4'
                                    }}>
                                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                                      <div>
                                        <strong>Severe Warning:</strong>{' '}
                                        {m.metadata.medicineCard.warnings.replace('🚨 Severe warning: ', '').replace('🚨 Severe Warning: ', '')}
                                      </div>
                                    </div>

                                    {/* Usage Guidance & Doc advice */}
                                    <div style={{
                                      backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px',
                                      border: '1px solid var(--border-color)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
                                    }}>
                                      <div>
                                        <strong style={{ color: 'var(--text-primary)' }}>Usage Guidance:</strong>{' '}
                                        <span style={{ color: 'var(--text-secondary)' }}>{m.metadata.medicineCard.guidance}</span>
                                      </div>
                                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>Doctor Advice:</strong>{' '}
                                        <span style={{ color: 'var(--text-secondary)' }}>{m.metadata.medicineCard.doctorAdvice}</span>
                                      </div>
                                    </div>

                                    {/* Disclaimer */}
                                    <div style={{
                                      fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)',
                                      paddingTop: '0.5rem', textAlign: 'center', fontStyle: 'italic', lineHeight: '1.3'
                                    }}>
                                      This information is for education only and does not replace advice from a qualified healthcare professional.
                                    </div>
                                  </div>
                                ) : isAi && m.metadata && m.metadata.type === 'prescription' && m.metadata.prescriptionSummary ? (
                                  <div className="prescription-explainer-card" style={{
                                    backgroundColor: '#ffffff', borderRadius: '12px', border: '1.5px solid var(--accent-blue)',
                                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                                    boxShadow: 'var(--shadow-md)', maxWidth: '100%', width: '500px', animation: 'scale-up 0.2s ease'
                                  }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--accent-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FileText size={20} color="var(--accent-blue)" />
                                      </div>
                                      <div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                          Prescription Explained
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                          File: {m.metadata.prescriptionSummary.fileName}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Allergy Danger Warning */}
                                    {m.metadata.prescriptionSummary.allergyAlert && (
                                      <div style={{
                                        backgroundColor: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: '8px',
                                        padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                                        color: '#b91c1c', fontSize: '0.8rem', fontWeight: '500', lineHeight: '1.4'
                                      }}>
                                        <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <div>{m.metadata.prescriptionSummary.allergyAlert}</div>
                                      </div>
                                    )}

                                    {/* Report Sync Notice */}
                                    {m.metadata.prescriptionSummary.reportRecall && (
                                      <div style={{
                                        backgroundColor: '#eff6ff', border: '1.5px solid #3b82f6', borderRadius: '8px',
                                        padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
                                        color: '#1d4ed8', fontSize: '0.8rem', fontWeight: '500', lineHeight: '1.4'
                                      }}>
                                        <Info size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <div>{m.metadata.prescriptionSummary.reportRecall}</div>
                                      </div>
                                    )}

                                    {/* Summary */}
                                    <div>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <strong>Overview:</strong> {m.metadata.prescriptionSummary.summary}
                                      </span>
                                    </div>

                                    {/* Extracted medicines list */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.25rem' }}>
                                        Extracted Medications:
                                      </span>
                                      {m.metadata.prescriptionSummary.extractedMedicines.map((med, idx) => (
                                        <div key={idx} style={{
                                          padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)',
                                          border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem'
                                        }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '700', color: 'var(--accent-teal)' }}>{med.name}</span>
                                            <span style={{ fontSize: '0.72rem', backgroundColor: '#e2e8f0', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                              {med.dosage}
                                            </span>
                                          </div>
                                          <div>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                              Brand: {med.brandName} | Category: {med.category}
                                            </span>
                                          </div>
                                          <div style={{ marginTop: '0.25rem' }}>
                                            <strong>Directions ({med.frequency}):</strong>{' '}
                                            <span style={{ color: 'var(--text-primary)' }}>{med.frequencyTranslation}</span>
                                            {med.instructions && <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}> - {med.instructions}</span>}
                                          </div>
                                          {med.allergyAlert && (
                                            <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                              {med.allergyAlert}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Disclaimer */}
                                    <div style={{
                                      fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)',
                                      paddingTop: '0.5rem', textAlign: 'center', fontStyle: 'italic', lineHeight: '1.3'
                                    }}>
                                      {m.metadata.prescriptionSummary.safetyDisclaimer}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {/* Bounding box image preview */}
                                    {m.metadata && m.metadata.attachmentType === 'image' && (
                                      <div style={{
                                        margin: '0.5rem 0',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'var(--bg-tertiary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        width: '240px',
                                        boxShadow: 'var(--shadow-sm)',
                                        alignSelf: isAi ? 'flex-start' : 'flex-end'
                                      }}>
                                        <div style={{
                                          width: '100%',
                                          height: '140px',
                                          borderRadius: '8px',
                                          backgroundColor: '#1e293b',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          position: 'relative',
                                          overflow: 'hidden',
                                          color: '#ffffff'
                                        }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                            <QrCode size={32} color="var(--accent-teal)" />
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{m.metadata.attachmentName}</span>
                                          </div>
                                          <div style={{
                                            position: 'absolute',
                                            top: '20px',
                                            left: '20px',
                                            right: '20px',
                                            bottom: '20px',
                                            border: '2px dashed #22c55e',
                                            borderRadius: '4px',
                                            pointerEvents: 'none',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'flex-end',
                                            padding: '4px'
                                          }}>
                                            <span style={{
                                              fontSize: '8px',
                                              backgroundColor: '#22c55e',
                                              color: '#ffffff',
                                              fontWeight: 'bold',
                                              padding: '2px 4px',
                                              borderRadius: '2px',
                                              textTransform: 'uppercase'
                                            }}>
                                              Confidence: 94%
                                            </span>
                                          </div>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                          [OCR Text: "PARACETAMOL 500mg"]
                                        </span>
                                      </div>
                                    )}

                                    <div style={{
                                      padding: '1rem 1.25rem',
                                      paddingBottom: '1.75rem',
                                      borderRadius: isAi ? '0 16px 16px 16px' : '16px 0 16px 16px',
                                      backgroundColor: isAi ? '#ffffff' : 'var(--accent-teal)',
                                      color: isAi ? 'var(--text-primary)' : '#ffffff',
                                      border: isAi ? '1px solid var(--border-color)' : 'none',
                                      boxShadow: isAi ? 'var(--shadow-sm)' : 'none',
                                      fontSize: '0.9rem',
                                      lineHeight: '1.5',
                                      whiteSpace: 'pre-line',
                                      position: 'relative'
                                    }}>
                                      {m.text}
                                      <span style={{
                                        position: 'absolute',
                                        bottom: '0.4rem',
                                        right: '0.75rem',
                                        fontSize: '0.68rem',
                                        color: isAi ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
                                        fontWeight: '400'
                                      }}>
                                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Voice Readout Button for AI */}
                                {isAi && m.voiceText && (
                                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <button
                                      onClick={() => {
                                        if (profile.subscriptionPlan === 'free') {
                                          alert("🔒 Voice AI is a Premium Feature. Please upgrade your subscription plan in Profile Settings to unlock voice responses.");
                                          return;
                                        }
                                        if (speakingMessageId === idx) {
                                          stopSpeaking();
                                        } else {
                                          speakText(m.voiceText, idx);
                                        }
                                      }}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                                        fontSize: '0.75rem', color: speakingMessageId === idx ? 'var(--accent-rose)' : 'var(--accent-teal)',
                                        fontWeight: '600', padding: '0.25rem 0.5rem', borderRadius: '6px',
                                        backgroundColor: '#ffffff', border: '1px solid var(--border-color)',
                                        boxShadow: 'var(--shadow-sm)'
                                      }}
                                      title={speakingMessageId === idx ? "Mute speech" : "Read aloud response"}
                                      aria-label={speakingMessageId === idx ? "Mute synthesized speech" : "Read aloud synthesized response"}
                                    >
                                      {speakingMessageId === idx ? (
                                        <>
                                          <VolumeX size={13} />
                                          <span>Stop Voice</span>
                                        </>
                                      ) : (
                                        <>
                                          <Volume2 size={13} />
                                          <span>Replay Voice</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      
                      {isAiTyping && (
                        <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <HeartPulse size={16} color="#ffffff" />
                            </div>
                            <div style={{ padding: '0.75rem 1.25rem', borderRadius: '0 16px 16px 16px', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                              <div className="typing-dots">
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                                <div className="typing-dot" />
                              </div>
                            </div>
                          </div>

                          {/* Real-time RAG Search pipeline log feedback */}
                          {ragStatus && (
                            <div className="animate-fade-in" style={{
                              marginLeft: '3rem', padding: '0.5rem 0.75rem', borderRadius: '8px',
                              backgroundColor: 'var(--bg-secondary)', border: '1.5px dashed var(--accent-blue-glow)',
                              fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex',
                              alignItems: 'center', gap: '0.5rem', width: 'fit-content'
                            }}>
                              <RefreshCcw size={12} style={{ animation: 'spin-slow 2s linear infinite' }} />
                              <span style={{ fontWeight: '500' }}>
                                {ragStatus === 'searching' && "🔍 Searching Medical Knowledge Base (RAG)..."}
                                {ragStatus === 'retrieved' && `📄 Retrieved: ${ragDocTitle}`}
                                {ragStatus === 'synthesizing' && "🧠 Healthcare Brain: Synthesizing natural voice reply..."}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '1.5rem 2rem', backgroundColor: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
                      
                      {/* Listening Pulse Overlay */}
                      {isListening && (
                        <div className="glass-panel" style={{
                          padding: '1rem', margin: '0 0 1rem 0', borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          backgroundColor: '#fff5f5', border: '1px solid var(--accent-rose-glow)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: '700' }}>
                              🎤 LISTENING VOICE...
                            </span>
                            <div className="voice-wave-container">
                              <div className="voice-wave-bar" />
                              <div className="voice-wave-bar" />
                              <div className="voice-wave-bar" />
                              <div className="voice-wave-bar" />
                              <div className="voice-wave-bar" />
                            </div>
                          </div>
                          <button 
                            onClick={toggleListening} 
                            style={{
                              padding: '0.45rem 1rem', borderRadius: '6px', 
                              backgroundColor: 'var(--accent-rose)', color: '#ffffff',
                              fontSize: '0.8rem', fontWeight: '600'
                            }}
                          >
                            Cancel Mic
                          </button>
                        </div>
                      )}

                      {/* Playing Speech Utterance Overlay */}
                      {isPlayingVoice && (
                        <div className="glass-panel" style={{
                          padding: '1rem', margin: '0 0 1rem 0', borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          backgroundColor: 'var(--accent-teal-glow)', border: '1px solid var(--accent-teal)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Volume2 size={18} color="var(--accent-teal)" style={{ animation: 'bounce-bar 1.5s infinite alternate' }} />
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: '700' }}>
                              Speaking Voice Response...
                            </span>
                          </div>
                          <button 
                            onClick={stopSpeaking} 
                            style={{
                              padding: '0.45rem 1rem', borderRadius: '6px', 
                              backgroundColor: 'var(--accent-teal)', color: '#ffffff',
                              fontSize: '0.8rem', fontWeight: '600'
                            }}
                          >
                            Mute Speech
                          </button>
                        </div>
                      )}

                      {/* Medicine Lookup Quick Actions & Search Box */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {/* Quick Action Pills Row */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setShowAttachmentDropdown(!showAttachmentDropdown)}
                            style={{
                              padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1.5px solid var(--accent-teal)',
                              backgroundColor: showAttachmentDropdown ? 'var(--accent-teal-glow)' : 'transparent',
                              color: 'var(--accent-teal)', fontSize: '0.78rem', fontWeight: '600',
                              display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>📎 Simulate Upload</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowMedSearchPanel(!showMedSearchPanel);
                            }}
                            style={{
                              padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1.5px solid var(--accent-teal)',
                              backgroundColor: showMedSearchPanel ? 'var(--accent-teal-glow)' : 'transparent',
                              color: 'var(--accent-teal)', fontSize: '0.78rem', fontWeight: '600',
                              display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>🔍 Search Medicine</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendChatMessage("Explain my prescription")}
                            style={{
                              padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1.5px solid var(--border-color)',
                              backgroundColor: '#ffffff', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: '500',
                              display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>📄 Explain Prescription</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendChatMessage("Check Safety Information for current medications")}
                            style={{
                              padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1.5px solid var(--border-color)',
                              backgroundColor: '#ffffff', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: '500',
                              display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>⚠️ Check Safety</span>
                          </button>
                        </div>

                        {/* Simulated Attachment Dropdown Options */}
                        {showAttachmentDropdown && (
                          <div className="glass-panel" style={{
                            padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                            animation: 'slide-down 0.2s ease'
                          }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>Select simulated upload file:</p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("Identify paracetamol pack packaging", "image", "paracetamol_pack.jpg");
                                  setShowAttachmentDropdown(false);
                                }}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                📸 paracetamol_pack.jpg (Identified)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("Scan packaging text", "image", "blurry_label.png");
                                  setShowAttachmentDropdown(false);
                                }}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                📸 blurry_label.png (Low Confidence)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("Analyze Rx document", "prescription", "allergy_conflict_prescription.pdf");
                                  setShowAttachmentDropdown(false);
                                }}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                📄 allergy_conflict_prescription.pdf (Penicillin Warning)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("Analyze Rx document", "prescription", "asthma_regimen_rx.pdf");
                                  setShowAttachmentDropdown(false);
                                }}
                                style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                📄 asthma_regimen_rx.pdf (PRN and QD Abbreviations)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Search Medicine Panel */}
                        {showMedSearchPanel && (
                          <div className="glass-panel" style={{
                            padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            animation: 'slide-down 0.2s ease'
                          }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                placeholder="Search medicine..."
                                value={medSearchInput}
                                onChange={(e) => setMedSearchInput(e.target.value)}
                                style={{ flex: 1, height: '36px', padding: '0 0.75rem', fontSize: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (medSearchInput.trim()) {
                                      handleSendChatMessage(medSearchInput);
                                      setMedSearchInput('');
                                      setShowMedSearchPanel(false);
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (medSearchInput.trim()) {
                                    handleSendChatMessage(medSearchInput);
                                    setMedSearchInput('');
                                    setShowMedSearchPanel(false);
                                  }
                                }}
                                style={{
                                  padding: '0 1rem', height: '36px', borderRadius: '6px',
                                  backgroundColor: 'var(--accent-teal)', color: '#ffffff',
                                  fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
                                }}
                              >
                                Search
                              </button>
                            </div>

                            {/* Suggestion Chips */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Suggestions:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("What is Paracetamol?");
                                  setShowMedSearchPanel(false);
                                }}
                                style={{ padding: '0.25rem 0.6rem', borderRadius: '15px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              >
                                Fever medicine
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("What is Ibuprofen?");
                                  setShowMedSearchPanel(false);
                                }}
                                style={{ padding: '0.25rem 0.6rem', borderRadius: '15px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              >
                                Pain relief
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("What is Vitamin D3?");
                                  setShowMedSearchPanel(false);
                                }}
                                style={{ padding: '0.25rem 0.6rem', borderRadius: '15px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              >
                                Vitamins
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendChatMessage("What is Cetirizine?");
                                  setShowMedSearchPanel(false);
                                }}
                                style={{ padding: '0.25rem 0.6rem', borderRadius: '15px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                              >
                                Allergy medicine
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Smart Suggestion Chips */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => navigateToView('symptoms')}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '15px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#ffffff',
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          🔍 Check symptoms
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateToView('medicines')}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '15px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#ffffff',
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          💊 Explain medicine
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateToView('reports')}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '15px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#ffffff',
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          📄 Analyze report
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendChatMessage("Give health tips")}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '15px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: '#ffffff',
                            color: 'var(--text-secondary)',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          💡 Give health tips
                        </button>
                      </div>

                      {/* Voice Settings HUD Panel */}
                      {showVoiceHud && (
                        <div className="glass-panel" style={{
                          padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem',
                          animation: 'slide-down 0.25s ease', marginBottom: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                              Real-Time Voice Settings
                            </h4>
                            <button 
                              type="button"
                              onClick={() => setShowVoiceHud(false)}
                              style={{ fontSize: '1rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                              &times;
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                Voice Language
                              </label>
                              <select
                                value={privacySettings.voiceLanguage}
                                onChange={(e) => handlePrivacyToggle('voiceLanguage', e.target.value)}
                                style={{ height: '36px', padding: '0 0.5rem', fontSize: '0.8rem' }}
                              >
                                <option value="en">English (US)</option>
                                <option value="hi">Hindi (हिंदी)</option>
                                <option value="hinglish">Hinglish</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Speaking Speed</span>
                                <span>{privacySettings.speakingSpeed}x</span>
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                  type="range"
                                  min="0.8"
                                  max="2.0"
                                  step="0.1"
                                  value={privacySettings.speakingSpeed}
                                  onChange={(e) => handlePrivacyToggle('speakingSpeed', parseFloat(e.target.value))}
                                  style={{ flex: 1, height: '6px', cursor: 'pointer' }}
                                />
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type="checkbox"
                              id="hudVoiceEnabled"
                              checked={privacySettings.voiceEnabled}
                              onChange={(e) => handlePrivacyToggle('voiceEnabled', e.target.checked)}
                            />
                            <label htmlFor="hudVoiceEnabled" style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                              Enable voice responses (TTS Readout)
                            </label>
                          </div>
                        </div>
                      )}

                      <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                        style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}
                      >
                        {/* Microphone Voice Button */}
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={isListening ? 'mic-glow-pulse' : ''}
                          style={{
                            width: '46px', height: '46px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                            border: '1px solid var(--border-color)',
                            backgroundColor: isListening ? '#ffe4e6' : 'var(--bg-tertiary)',
                            color: isListening ? 'var(--accent-rose)' : 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                          }}
                          title={isListening ? 'Stop recording voice query' : 'Record voice query'}
                          aria-label={isListening ? 'Stop recording voice' : 'Record voice query'}
                        >
                          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowVoiceHud(!showVoiceHud)}
                          style={{
                            width: '46px', height: '46px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid var(--border-color)',
                            backgroundColor: showVoiceHud ? 'var(--accent-teal-glow)' : 'var(--bg-tertiary)',
                            color: 'var(--accent-teal)',
                            transition: 'all 0.2s ease',
                          }}
                          title="Toggle Voice Settings HUD"
                        >
                          <Settings size={20} />
                        </button>

                        <input 
                          type="text" 
                          placeholder="Type symptom question or click microphone to speak..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          style={{ flex: 1, paddingRight: '4.5rem' }}
                          disabled={isAiTyping}
                        />
                        <button 
                          type="submit" 
                          style={{
                            padding: '0 1.5rem', borderRadius: '8px', 
                            backgroundColor: 'var(--accent-teal)', color: '#ffffff', 
                            fontWeight: '600', cursor: 'pointer'
                          }}
                          disabled={isAiTyping}
                        >
                          Send
                        </button>
                      </form>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                        Disclaimer: HealthAI does not make clinical decisions. Emergency cases must call 911 immediately.
                      </p>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                    <MessageSquare size={48} color="var(--text-muted)" />
                    <p style={{ color: 'var(--text-muted)' }}>Select or start a new conversation to begin.</p>
                    <button onClick={handleStartNewChat} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600' }}>
                      Start Chat Session
                    </button>
                  </div>
                )}
              </div>

              {/* RAG & Whisper Explorer Side Panel */}
              {showRagExplorer && (
                <div className="glass-panel animate-fade-in" style={{
                  width: '380px',
                  borderLeft: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  height: '100%',
                  overflowY: 'auto'
                }}>
                  {/* Header */}
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={18} color="var(--accent-teal)" />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>RAG & Whisper Explorer</span>
                    </div>
                    <button 
                      onClick={() => setShowRagExplorer(false)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={18} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>

                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    {/* Model Status HUD */}
                    <div className="health-card" style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--accent-teal-glow)', border: '1px solid rgba(13, 148, 136, 0.2)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-teal)', margin: 0 }}>Embedding Model Status</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div><strong>Model:</strong> BGE-M3 (Dense Semantic)</div>
                        <div><strong>Dimension:</strong> 1024 Float32 coordinates</div>
                        <div><strong>Normalization:</strong> L2 ($L_2$ norm = 1.0)</div>
                        <div><strong>Vector Store:</strong> {ragDocumentList.length} docs indexed</div>
                      </div>
                    </div>

                    {/* Whisper STT Status HUD */}
                    <div className="health-card" style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'var(--accent-blue-glow)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-blue)', margin: 0 }}>Whisper STT Pipeline</h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div><strong>Engine:</strong> Whisper AI STT Pipeline</div>
                        <div><strong>Transcription:</strong> Audio Waveform Input</div>
                        <div><strong>Status:</strong> {isListening ? '🎙️ Active Listening...' : '💤 Standby (Awaiting mic)'}</div>
                        {isListening && (
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '15px', marginTop: '0.25rem' }}>
                            <div className="wave-bar" style={{ width: '3px', height: '12px', backgroundColor: 'var(--accent-blue)', borderRadius: '2px', animation: 'pulse 0.6s infinite alternate' }} />
                            <div className="wave-bar" style={{ width: '3px', height: '6px', backgroundColor: 'var(--accent-blue)', borderRadius: '2px', animation: 'pulse 0.4s infinite alternate' }} />
                            <div className="wave-bar" style={{ width: '3px', height: '15px', backgroundColor: 'var(--accent-blue)', borderRadius: '2px', animation: 'pulse 0.8s infinite alternate' }} />
                            <div className="wave-bar" style={{ width: '3px', height: '8px', backgroundColor: 'var(--accent-blue)', borderRadius: '2px', animation: 'pulse 0.5s infinite alternate' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vector Search Similarity Tester */}
                    <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '12px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Semantic Vector Query</h4>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <input 
                          type="text" 
                          placeholder="Type query to test similarity..." 
                          value={ragSearchQuery}
                          onChange={(e) => setRagSearchQuery(e.target.value)}
                          style={{ flex: 1, height: '32px', padding: '0 0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRagTestSearch();
                            }
                          }}
                        />
                        <button 
                          onClick={handleRagTestSearch}
                          style={{ padding: '0 0.75rem', height: '32px', borderRadius: '6px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontSize: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                        >
                          Search
                        </button>
                      </div>

                      {/* Search Matches List */}
                      {ragTestResults && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Similarity Search Results (BGE-M3 Cosine):</span>
                          
                          {/* Query Vector Visualizer */}
                          <div style={{ padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              <span>Query Vector Embedding (1024-d)</span>
                              <span>First 64 dims</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '1px' }}>
                              {Array.from(ragTestResults.queryVector).slice(0, 64).map((val, idx) => {
                                const intensity = Math.min(Math.abs(val) * 15, 1.0);
                                const color = val >= 0 
                                  ? `rgba(13, 148, 136, ${0.1 + intensity * 0.9})` 
                                  : `rgba(225, 29, 72, ${0.1 + intensity * 0.9})`;
                                return (
                                  <div 
                                    key={idx} 
                                    style={{ height: '8px', backgroundColor: color, borderRadius: '1px' }} 
                                    title={`Dim ${idx}: ${val.toFixed(4)}`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* Top Results */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
                            {ragTestResults.allResults.slice(0, 3).map((res) => (
                              <div key={res.id} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{res.title}</span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: '600', color: res.similarity >= 0.35 ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
                                    {(res.similarity * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{res.category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Vector Database Document Index */}
                    <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Vector Document Index</h4>
                        <button 
                          onClick={handleResetRagDatabase}
                          style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Reset Index
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '0.15rem' }}>
                        {ragDocumentList.map(doc => (
                          <div key={doc.id} style={{ padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h5 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{doc.title}</h5>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{doc.category}</span>
                              </div>
                              {doc.id.startsWith('rag-custom') && (
                                <button 
                                  onClick={() => handleDeleteRagDoc(doc.id)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                              {doc.content}
                            </p>

                            {/* Dense Embedding Visualizer Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                <span>BGE-M3 Dense Embedding Heatmap</span>
                                <span>64 dims</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: '1px' }}>
                                {doc.embedding.slice(0, 64).map((val, idx) => {
                                  const intensity = Math.min(Math.abs(val) * 15, 1.0);
                                  const color = val >= 0 
                                    ? `rgba(13, 148, 136, ${0.1 + intensity * 0.9})` 
                                    : `rgba(225, 29, 72, ${0.1 + intensity * 0.9})`;
                                  return (
                                    <div 
                                      key={idx} 
                                      style={{ height: '6px', backgroundColor: color, borderRadius: '1px' }} 
                                      title={`Dim ${idx}: ${val.toFixed(4)}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Custom Document Form */}
                    <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                      {ragIngestionFlash && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: 'rgba(13, 148, 136, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          zIndex: 10, animation: 'pulse 0.4s ease-out'
                        }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-teal)', padding: '0.5rem 1rem', borderRadius: '20px', backgroundColor: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
                            ⚡ Ingesting Vector Embedding...
                          </span>
                        </div>
                      )}

                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: 0 }}>Ingest Medical Document</h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="Document Title (e.g. Lisinopril Drug Card)..." 
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          style={{ height: '32px', padding: '0 0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                        />
                        <select 
                          value={newDocCategory}
                          onChange={(e) => setNewDocCategory(e.target.value)}
                          style={{ height: '32px', padding: '0 0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: '#ffffff' }}
                        >
                          <option value="Medicine Information">Medicine Information</option>
                          <option value="Medical Reports">Medical Reports</option>
                          <option value="Health Education">Health Education</option>
                          <option value="FAQ Answers">FAQ Answers</option>
                        </select>
                        <textarea 
                          placeholder="Document Clinical Content (will be processed by BGE-M3)..." 
                          value={newDocContent}
                          onChange={(e) => setNewDocContent(e.target.value)}
                          style={{ minHeight: '60px', padding: '0.4rem 0.5rem', fontSize: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px', resize: 'vertical' }}
                        />
                        <button 
                          onClick={handleAddRagDoc}
                          style={{
                            padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--accent-teal)', color: '#ffffff',
                            fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                          }}
                        >
                          Vectorize & Ingest
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- SYMPTOM CHECKER VIEW --- */}
          {view === 'symptoms' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Guided Symptom Checker</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Identify potential causes (not diagnosing) and receive general care recommendations.</p>
              </div>

              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <form onSubmit={handleCheckSymptoms} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Patient Age</label>
                      <input 
                        type="number" 
                        required 
                        value={symptomForm.age} 
                        onChange={(e) => setSymptomForm({ ...symptomForm, age: e.target.value })} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Gender</label>
                      <select 
                        value={symptomForm.gender} 
                        onChange={(e) => setSymptomForm({ ...symptomForm, gender: e.target.value })}
                        style={{ height: '42px', padding: '0 1rem' }}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>What symptoms are you experiencing?</label>
                    <textarea 
                      required 
                      rows="3" 
                      placeholder="e.g. Mild headache, sore throat, or abdominal bloating..." 
                      value={symptomForm.symptoms}
                      onChange={(e) => setSymptomForm({ ...symptomForm, symptoms: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Duration</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. 3 days, 1 week" 
                        value={symptomForm.duration} 
                        onChange={(e) => setSymptomForm({ ...symptomForm, duration: e.target.value })} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Severity Level (1-5)</label>
                      <select 
                        value={symptomForm.severity} 
                        onChange={(e) => setSymptomForm({ ...symptomForm, severity: e.target.value })}
                        style={{ height: '42px', padding: '0 1rem' }}
                      >
                        <option value="1">1 - Very Mild</option>
                        <option value="2">2 - Minor Discomfort</option>
                        <option value="3">3 - Moderate</option>
                        <option value="4">4 - Severe</option>
                        <option value="5">5 - Extreme</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Existing Health Conditions / Chronic history</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Diabetes, Asthma, None" 
                      value={symptomForm.existingConditions} 
                      onChange={(e) => setSymptomForm({ ...symptomForm, existingConditions: e.target.value })} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    style={{
                      padding: '0.9rem', borderRadius: '8px', 
                      backgroundColor: 'var(--accent-teal)', color: '#ffffff', 
                      fontWeight: '600', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem'
                    }}
                    disabled={isSymptomChecking}
                  >
                    {isSymptomChecking ? (
                      <>
                        <RefreshCcw size={16} style={{ animation: 'spin-slow 2s linear infinite' }} />
                        Analyzing Symptoms...
                      </>
                    ) : (
                      <>
                        <Stethoscope size={18} />
                        Run Symptom Check
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Check Result Container */}
              {symptomResult && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {symptomResult.isEmergency ? (
                    <div className="glow-pulse-red" style={{ padding: '1.5rem', borderRadius: '16px', backgroundColor: '#fff5f5', border: '1.5px solid var(--accent-rose)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <AlertTriangle color="var(--accent-rose)" size={24} style={{ flexShrink: 0 }} />
                      <div>
                        <h4 style={{ color: 'var(--accent-rose)', fontWeight: '800', fontSize: '1.1rem' }}>{symptomResult.summary}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '0.5rem', lineHeight: '1.5' }}>
                          <strong>Advice:</strong> {symptomResult.advice}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#7f1d1d', marginTop: '0.25rem', fontWeight: '700' }}>
                          <strong>Next Steps:</strong> {symptomResult.nextSteps}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="health-card" style={{ borderLeft: '5px solid var(--accent-teal)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-teal)' }}>Symptom Analysis Report</h4>
                      
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Possible Educational Causes</span>
                        <ul style={{ margin: '0.5rem 0 0.5rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {symptomResult.causes.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>*Note: This is not a diagnosis. Only a clinician can confirm underlying causes.</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Recommended General Care</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>{symptomResult.advice}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Actionable Next Steps</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>{symptomResult.nextSteps}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* --- MEDICAL REPORT ANALYZER VIEW --- */}
          {view === 'reports' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Medical Report Analyzer</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paste or upload patient medical reports to break down complex medical jargon into simple guidelines.</p>
              </div>

              {profile.subscriptionPlan === 'free' && (
                <div className="premium-lock-overlay">
                  <Lock size={36} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Medical Report Analyzer</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>
                    Upload complete blood test metrics and biochemistry panels. HealthAI Companion will parse medical jargon into plain language.
                  </p>
                  <button 
                    onClick={() => setView('profile')}
                    style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600' }}
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Sample selectors */}
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Select a sample report to try:</span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {SAMPLE_REPORTS.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleLoadSampleReport(s)}
                            style={{
                              padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '20px',
                              backgroundColor: reportFileName === s.fileName ? 'var(--accent-teal-glow)' : 'var(--bg-tertiary)',
                              color: reportFileName === s.fileName ? 'var(--accent-teal)' : 'var(--text-secondary)',
                              border: '1px solid var(--border-color)', fontWeight: '500'
                            }}
                          >
                            {s.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

                    {/* Text Paste and Upload options */}
                    <form onSubmit={handleAnalyzeReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Drag & Drop or Upload Lab Report</label>
                        
                        {/* Drag & Drop Upload Zone */}
                        <div 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          style={{
                            border: isDraggingReport ? '2px dashed var(--accent-teal)' : '2px dashed var(--border-color)',
                            borderRadius: '12px',
                            padding: '2rem 1.5rem',
                            textAlign: 'center',
                            backgroundColor: isDraggingReport ? 'var(--accent-teal-glow)' : 'var(--bg-tertiary)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                          onClick={() => document.getElementById('reportFileUpload')?.click()}
                        >
                          <input 
                            type="file" 
                            accept=".txt,.csv" 
                            id="reportFileUpload" 
                            onChange={handleFileUploadSimulator} 
                            style={{ display: 'none' }} 
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={36} color={isDraggingReport ? 'var(--accent-teal)' : 'var(--text-muted)'} style={{ transition: 'color 0.2s' }} />
                            <strong style={{ fontSize: '0.85rem' }}>Drag & Drop report file here</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Or click to browse from files (supports .txt, .csv)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Paste Report Contents</label>
                      </div>

                      <textarea
                        required
                        rows="6"
                        placeholder="Paste blood panel parameters, biochemistry screens, or diagnostic summaries here..."
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                      />

                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          placeholder="Filename (optional)" 
                          value={reportFileName} 
                          onChange={(e) => setReportFileName(e.target.value)} 
                          style={{ flex: 1 }}
                        />
                        <button 
                          type="submit"
                          style={{ padding: '0.85rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          disabled={isAnalyzingReport}
                        >
                          {isAnalyzingReport ? (
                            <>
                              <RefreshCcw size={16} style={{ animation: 'spin-slow 2s linear infinite' }} />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <FileText size={16} />
                              Analyze Report
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Results box */}
                  {analyzedReport && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="health-card" style={{ borderLeft: '5px solid var(--accent-blue)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Check size={18} />
                          Report Breakdown Completed
                        </h4>

                        {/* Summary */}
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Simple Explanation Summary</span>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.5' }}>{analyzedReport.summary}</p>
                        </div>

                        {/* Glossary */}
                        {analyzedReport.explanations.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Key Medical Terms Clarified</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                              {analyzedReport.explanations.map((exp, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-teal)' }}>{exp.term}</strong>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{exp.definition}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested doctor questions */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Suggested Questions for your Doctor Visit</span>
                          <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {analyzedReport.doctorQuestions.map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Historical Analyzer logs on the right */}
                <div className="glass-panel" style={{ borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#ffffff' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Analysis History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                    {reportsList.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No prior reports analyzed.</p>
                    ) : (
                      reportsList.map(rep => (
                        <div key={rep.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.6rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card-hover)' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{rep.fileName}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(rep.uploadedAt).toLocaleDateString()}</span>
                          <button 
                            onClick={() => {
                              setReportFileName(rep.fileName);
                              setReportText(rep.fileName.includes('vit') ? SAMPLE_REPORTS[0].content : rep.fileName.includes('lipid') ? SAMPLE_REPORTS[1].content : SAMPLE_REPORTS[2].content);
                              setAnalyzedReport(rep);
                            }}
                            style={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '600', marginTop: '0.25rem' }}
                          >
                            Load analysis
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- DOCTOR APPOINTMENTS VIEW --- */}
          {view === 'appointments' && (
            <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                {/* Search & Book Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Doctor Search & Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Schedule medical Consultations</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Find qualified specialists, book slots, and schedule visits.</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                        <input 
                          type="text" 
                          placeholder="Search doctors by name or specialty..."
                          value={doctorSearch}
                          onChange={(e) => setDoctorSearch(e.target.value)}
                          style={{ width: '100%', paddingLeft: '2.5rem' }}
                        />
                      </div>
                      <select 
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        style={{ width: '180px' }}
                      >
                        <option value="All">All Specialties</option>
                        <option value="General Practitioner">General Practice</option>
                        <option value="Cardiologist">Cardiology</option>
                        <option value="Pediatrician">Pediatrics</option>
                        <option value="Neurologist">Neurology</option>
                        <option value="Dermatologist">Dermatology</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {filteredDoctors.map(doc => (
                        <div key={doc.id} className="health-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between', gap: '0.75rem' }}>
                          <div>
                            <h4 style={{ fontSize: '0.95rem' }}>{doc.name}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '600', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--accent-teal-glow)' }}>
                              {doc.specialty}
                            </span>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span>⭐ {doc.rating} Rating • {doc.experience} exp</span>
                              <span>📅 Availability: {doc.availability}</span>
                              <span>📍 Location: {doc.location}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setBookingForm({ ...bookingForm, doctorId: doc.id })}
                            style={{
                              width: '100%', padding: '0.5rem', borderRadius: '6px', 
                              backgroundColor: 'var(--accent-teal-glow)', color: 'var(--accent-teal)', 
                              fontSize: '0.8rem', fontWeight: '600', marginTop: '0.5rem'
                            }}
                          >
                            Select for Booking
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Booking Calendar Widget Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Book Form card */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Booking Request</h3>
                    
                    {bookingSuccessMsg && (
                      <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Check size={16} />
                        Appointment booked successfully!
                      </div>
                    )}

                    <form onSubmit={handleBookAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Selected Doctor</label>
                        <select
                          required
                          value={bookingForm.doctorId}
                          onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                          style={{ height: '42px', padding: '0 1rem' }}
                        >
                          <option value="">-- Choose Doctor --</option>
                          {DOCTORS.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Date</label>
                          <input 
                            type="date" 
                            required 
                            value={bookingForm.date}
                            onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Time Slot</label>
                          <select
                            required
                            value={bookingForm.time}
                            onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                            style={{ height: '42px', padding: '0 1rem' }}
                          >
                            <option value="09:00 AM">09:00 AM</option>
                            <option value="10:30 AM">10:30 AM</option>
                            <option value="01:00 PM">01:00 PM</option>
                            <option value="02:30 PM">02:30 PM</option>
                            <option value="04:00 PM">04:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Reason for Visit</label>
                        <textarea 
                          rows="2" 
                          placeholder="Describe symptoms briefly..."
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                        />
                      </div>

                      <button 
                        type="submit" 
                        style={{
                          width: '100%', padding: '0.75rem', borderRadius: '8px', 
                          backgroundColor: 'var(--accent-teal)', color: '#ffffff', 
                          fontWeight: '600', display: 'flex', alignItems: 'center', 
                          justifyContent: 'center', gap: '0.5rem'
                        }}
                      >
                        Confirm Appointment
                      </button>
                    </form>
                  </div>

                  {/* Scheduled Appointments view */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Booked Slots Overview</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {bookedAppointments.length === 0 ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '1.5rem',
                          textAlign: 'center',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: '12px',
                          border: '1px dashed var(--border-color)'
                        }}>
                          <Stethoscope size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.25rem' }}>No Consultations Booked</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '240px' }}>
                            Schedule a medical consultation with a mock clinic specialist.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const firstDoc = DOCTORS[0];
                              if (firstDoc) {
                                setBookingForm(prev => ({ ...prev, doctorId: firstDoc.id }));
                              }
                            }}
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: 'var(--accent-teal)',
                              color: '#ffffff',
                              borderRadius: '6px'
                            }}
                          >
                            Select a Specialist
                          </button>
                        </div>
                      ) : (
                        bookedAppointments.map(apt => (
                          <div key={apt.id} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <strong style={{ fontSize: '0.85rem' }}>{apt.doctorName}</strong>
                              <button 
                                onClick={() => handleCancelAppointment(apt.id)}
                                style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: '600' }}
                              >
                                Cancel
                              </button>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.doctorSpecialty}</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                              <span>📅 {apt.date}</span>
                              <span>⏰ {apt.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'profile' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Patient Profile</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Review patient credentials, dietary/lifestyle preferences, and view your digital health passport.</p>
              </div>

              {/* Success notifications */}
              {profileSuccessMsg && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Check size={16} />
                  Profile details updated successfully!
                </div>
              )}

              {/* Profile Details Edit Card */}
              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Patient Credentials</h3>
                
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Name</label>
                      <input 
                        type="text" 
                        required 
                        value={profile.name} 
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Age</label>
                      <input 
                        type="number" 
                        required 
                        value={profile.age} 
                        onChange={(e) => setProfile({ ...profile, age: e.target.value })} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Gender</label>
                      <input 
                        type="text" 
                        required 
                        value={profile.gender} 
                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Medical History Summaries</label>
                    <textarea 
                      rows="2" 
                      placeholder="List any diagnosed chronic conditions..."
                      value={profile.medicalHistory}
                      onChange={(e) => setProfile({ ...profile, medicalHistory: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Known Allergies</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Peanuts, Ibuprofen, Penicillin"
                      value={profile.allergies}
                      onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Emergency Contact (Name & Phone)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe - +1 (555) 123-4567"
                      value={profile.emergencyContact}
                      onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Health Preferences</label>
                    <textarea 
                      rows="2"
                      placeholder="e.g. Low-sodium diet, regular cardiovascular checks, preferred morning visit slots..."
                      value={profile.healthPreferences || ''}
                      onChange={(e) => setProfile({ ...profile, healthPreferences: e.target.value })} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                </form>
              </div>

              {/* DIGITAL HEALTH PASSPORT */}
              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Digital Health Passport</h3>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap-reverse', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Digital Pass Card */}
                  <div className="passport-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>HEALTH PASS</h4>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent-teal)', fontWeight: '700', textTransform: 'uppercase' }}>HealthAI Companion</span>
                      </div>
                      <HeartPulse size={24} color="var(--accent-teal)" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Full Name</span>
                        <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>{profile.name || 'Jane Doe'}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Age / Gender</span>
                          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ffffff' }}>{profile.age} yrs / {profile.gender}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Blood Group</span>
                          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ffffff' }}>{profile.bloodGroup || 'O-Positive'}</p>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Allergies</span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: '600' }}>{profile.allergies || 'None reported'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Current Medications</span>
                        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '500' }}>{profile.currentMedications || 'None'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Health Preferences</span>
                        <p style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '500' }}>{profile.healthPreferences || 'None set'}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>
                        <span>EMERGENCY CONTACT</span>
                        <p style={{ fontSize: '0.7rem', color: '#f1f5f9', fontWeight: '500', marginTop: '0.15rem' }}>
                          {profile.emergencyContact || 'Not Set'}
                        </p>
                      </div>
                      
                      {/* Interactive CSS QR code widget */}
                      <div 
                        onClick={() => setShowQrModal(true)}
                        style={{ cursor: 'pointer', border: '4px solid #ffffff', borderRadius: '4px', overflow: 'hidden' }}
                        title="Click to view QR health profile scanner details"
                      >
                        <div className="qr-code-grid">
                          {Array.from({ length: 144 }).map((_, i) => {
                            const isBlack = (i % 3 === 0) || (i % 7 === 0) || (i < 36 && i % 4 === 0) || (i > 100 && i % 2 === 0);
                            return (
                              <div 
                                key={i} 
                                className="qr-dot" 
                                style={{ backgroundColor: isBlack ? '#000000' : '#ffffff' }} 
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side Passport Guide */}
                  <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '1rem' }}>Your Secure Digital Health Passport</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      This pass displays clinical indicators including blood group parameters, allergies, active drugs, and emergency dial points.
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      Click the QR code to expand the card for scanning at clinical registrations. All details remain inside your browser sandbox.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setShowQrModal(true)}
                        style={{
                          padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: '600',
                          display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', cursor: 'pointer'
                        }}
                      >
                        <QrCode size={16} />
                        Verify Health Pass
                      </button>
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Digital Health Summary Passport</title>
                                <style>
                                  body { font-family: sans-serif; padding: 2rem; background-color: #f8fafc; color: #0f172a; }
                                  .card { max-width: 450px; margin: 0 auto; background: #0f172a; color: #ffffff; padding: 2.5rem; border-radius: 20px; box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
                                  h2 { margin: 0 0 1.5rem 0; color: #0d9488; }
                                  .field { margin-bottom: 1rem; }
                                  .label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
                                  .value { font-size: 1rem; font-weight: bold; margin-top: 0.25rem; }
                                  .danger { color: #f43f5e; }
                                  @media print {
                                    body { background: none; }
                                    .card { box-shadow: none; border: 1px solid #e2e8f0; }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="card">
                                  <h2>DIGITAL HEALTH PASS</h2>
                                  <div class="field"><div class="label">Patient Name</div><div class="value">${profile.name}</div></div>
                                  <div class="field"><div class="label">Age / Gender</div><div class="value">${profile.age} yrs / ${profile.gender}</div></div>
                                  <div class="field"><div class="label">Blood Group</div><div class="value">${profile.bloodGroup || 'O-Positive'}</div></div>
                                  <div class="field"><div class="label">Allergies</div><div class="value danger">${profile.allergies || 'None reported'}</div></div>
                                  <div class="field"><div class="label">Active Medications</div><div class="value">${profile.currentMedications || 'None'}</div></div>
                                  <div class="field"><div class="label">Health Preferences</div><div class="value">${profile.healthPreferences || 'None set'}</div></div>
                                  <div class="field"><div class="label">Emergency Contact</div><div class="value">${profile.emergencyContact || 'Not set'}</div></div>
                                </div>
                                <script>window.print();<\/script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }}
                        style={{
                          padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                          backgroundColor: 'var(--accent-teal-glow)', color: 'var(--accent-teal)', fontWeight: '600',
                          display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', cursor: 'pointer'
                        }}
                      >
                        <Download size={16} />
                        Print Passport Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUBSCRIPTION PLAN BOARD */}
              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Subscription & Licensing Tier</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Select the platform plan tailored for your health journey or physician clinic operations.</p>
                </div>
                
                <div className="pricing-grid">
                  {/* Free Plan */}
                  <div className={`pricing-card ${profile.subscriptionPlan === 'free' ? 'featured' : ''}`}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem' }}>Free Plan</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Basic AI access</p>
                      <div style={{ margin: '1.5rem 0 1rem 0' }}>
                        <span style={{ fontSize: '2rem', fontWeight: '800' }}>$0</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / month</span>
                      </div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
                        <li>Basic AI Chatbot</li>
                        <li>General Health Articles</li>
                        <li>Local Storage History</li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...profile, subscriptionPlan: 'free' };
                        db.saveProfile(updated);
                        setProfile(updated);
                      }}
                      style={{
                        width: '100%', padding: '0.6rem', borderRadius: '6px',
                        backgroundColor: profile.subscriptionPlan === 'free' ? 'var(--accent-teal)' : 'var(--bg-tertiary)',
                        color: profile.subscriptionPlan === 'free' ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: '600', marginTop: '1.5rem', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {profile.subscriptionPlan === 'free' ? 'Active Plan' : 'Choose Free'}
                    </button>
                  </div>

                  {/* Premium Plan */}
                  <div className={`pricing-card ${profile.subscriptionPlan === 'premium' ? 'featured' : ''}`}>
                    {profile.subscriptionPlan === 'premium' && <span className="pricing-badge">Recommended</span>}
                    <div>
                      <h4 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        Premium Plan <Sparkles size={16} color="var(--accent-warning)" />
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Advanced AI copilot</p>
                      <div style={{ margin: '1.5rem 0 1rem 0' }}>
                        <span style={{ fontSize: '2rem', fontWeight: '800' }}>$19</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / month</span>
                      </div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
                        <li><strong>Multilingual Voice Assistant</strong></li>
                        <li><strong>Medical Report Analyzer</strong></li>
                        <li><strong>AI Health Risk Survey</strong></li>
                        <li>Steps & Calorie Trackers</li>
                        <li>Export Medical Summaries</li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...profile, subscriptionPlan: 'premium' };
                        db.saveProfile(updated);
                        setProfile(updated);
                      }}
                      style={{
                        width: '100%', padding: '0.6rem', borderRadius: '6px',
                        backgroundColor: profile.subscriptionPlan === 'premium' ? 'var(--accent-teal)' : 'var(--bg-tertiary)',
                        color: profile.subscriptionPlan === 'premium' ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: '600', marginTop: '1.5rem', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {profile.subscriptionPlan === 'premium' ? 'Active Plan' : 'Upgrade to Premium'}
                    </button>
                  </div>

                  {/* Clinic Plan */}
                  <div className={`pricing-card ${profile.subscriptionPlan === 'clinic' ? 'featured' : ''}`}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem' }}>Clinic Plan</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>For medical offices</p>
                      <div style={{ margin: '1.5rem 0 1rem 0' }}>
                        <span style={{ fontSize: '2rem', fontWeight: '800' }}>$99</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> / month</span>
                      </div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}>
                        <li><strong>All Premium Features</strong></li>
                        <li><strong>Physician Portal Toggle</strong></li>
                        <li>Manage Clinic Patient Lists</li>
                        <li>Review AI Summaries & Reports</li>
                        <li>Reminders & Online Consults</li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = { ...profile, subscriptionPlan: 'clinic' };
                        db.saveProfile(updated);
                        setProfile(updated);
                      }}
                      style={{
                        width: '100%', padding: '0.6rem', borderRadius: '6px',
                        backgroundColor: profile.subscriptionPlan === 'clinic' ? 'var(--accent-teal)' : 'var(--bg-tertiary)',
                        color: profile.subscriptionPlan === 'clinic' ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: '600', marginTop: '1.5rem', border: 'none', cursor: 'pointer'
                      }}
                    >
                      {profile.subscriptionPlan === 'clinic' ? 'Active Plan' : 'Select Clinic Plan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Settings & Privacy</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Configure Voice AI speech properties, configure confidentiality parameters, or clear database items.</p>
              </div>

              {/* Voice AI Assistant Settings Card */}
              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Voice AI Assistant & Accessibility</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Enable Voice Mode */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Enable voice auto-readout</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatically read aloud AI responses during chat.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={privacySettings.voiceEnabled} 
                      onChange={(e) => handlePrivacyToggle('voiceEnabled', e.target.checked)}
                      style={{ width: 'auto', transform: 'scale(1.2)' }}
                    />
                  </div>

                  {/* Voice Language selection */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Assistant Speech Language</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adjust transcribing and speaking phonetics.</p>
                    </div>
                    <select 
                      value={privacySettings.voiceLanguage} 
                      onChange={(e) => handlePrivacyToggle('voiceLanguage', e.target.value)}
                      style={{ width: '160px' }}
                    >
                      <option value="en">English (US)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                      <option value="hinglish">Hinglish (Hindi/English)</option>
                    </select>
                  </div>

                  {/* Speaking Speed */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Speaking Speed (Rate)</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adjust speed of voice feedback.</p>
                    </div>
                    <select 
                      value={privacySettings.speakingSpeed} 
                      onChange={(e) => handlePrivacyToggle('speakingSpeed', parseFloat(e.target.value))}
                      style={{ width: '160px' }}
                    >
                      <option value="0.8">0.8x (Slow)</option>
                      <option value="1.0">1.0x (Normal)</option>
                      <option value="1.25">1.25x (Fast)</option>
                      <option value="1.5">1.5x (Very Fast)</option>
                      <option value="2.0">2.0x (Double Speed)</option>
                    </select>
                  </div>

                  {/* Voice Gender */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Assistant Voice Tone</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select female or male spoken voice profiles.</p>
                    </div>
                    <select 
                      value={privacySettings.voiceGender} 
                      onChange={(e) => handlePrivacyToggle('voiceGender', e.target.value)}
                      style={{ width: '160px' }}
                    >
                      <option value="female">Female Voice</option>
                      <option value="male">Male Voice</option>
                    </select>
                  </div>

                  {/* Large Font accessibility */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Large Text Mode (Accessibility)</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scale application text layout for easier readability.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={privacySettings.largeFontMode} 
                      onChange={(e) => handlePrivacyToggle('largeFontMode', e.target.checked)}
                      style={{ width: 'auto', transform: 'scale(1.2)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Data & Privacy Settings Card */}
              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Confidentiality & Data Privacy</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Auto delete setting */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Automatic Chat Deletion</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose when consultation records are deleted.</p>
                    </div>
                    <select 
                      value={privacySettings.autoDelete} 
                      onChange={(e) => handlePrivacyToggle('autoDelete', e.target.value)}
                      style={{ width: '160px' }}
                    >
                      <option value="never">Never (Keep history)</option>
                      <option value="logout">Wipe on logout</option>
                      <option value="24h">Wipe after 24 hours</option>
                    </select>
                  </div>

                  {/* Local encryption */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Sandbox Storage Encryption</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Encrypt patient parameters inside browser database cache.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={privacySettings.mockEncryption} 
                      onChange={(e) => handlePrivacyToggle('mockEncryption', e.target.checked)}
                      style={{ width: 'auto', transform: 'scale(1.2)' }}
                    />
                  </div>

                  {/* Data sharing toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Anonymized Education Logs sharing</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allow sharing of wellness tracking logs for clinical studies.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={privacySettings.dataSharing} 
                      onChange={(e) => handlePrivacyToggle('dataSharing', e.target.checked)}
                      style={{ width: 'auto', transform: 'scale(1.2)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Data Utilities Buttons Card */}
              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Security & Data Sandbox Utilities</h3>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={handleExportSummaryDownload}
                    style={{
                      flex: '1 1 200px', padding: '0.85rem 1.25rem', borderRadius: '8px', 
                      backgroundColor: 'var(--accent-teal-glow)', color: 'var(--accent-teal)', 
                      fontWeight: '600', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer'
                    }}
                  >
                    <Download size={18} />
                    Export Health Summary (.txt)
                  </button>

                  <button 
                    onClick={handleClearChatsSetting}
                    style={{
                      flex: '1 1 200px', padding: '0.85rem 1.25rem', borderRadius: '8px', 
                      border: '1px solid var(--border-color)', backgroundColor: '#ffffff',
                      color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', gap: '0.5rem', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={18} />
                    Wipe Chat History
                  </button>

                  <button 
                    onClick={handleResetApplication}
                    style={{
                      flex: '1 1 200px', padding: '0.85rem 1.25rem', borderRadius: '8px', 
                      backgroundColor: '#fff5f5', border: '1px solid #fee2e2', 
                      color: 'var(--accent-rose)', fontWeight: '600', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      gap: '0.5rem', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={18} />
                    Delete Account & Clear Sandbox
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- MEDICINE INFORMATION VIEW --- */}
          {view === 'medicines' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Medicine Information Search</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Look up general use, safety warnings, and precautions for standard medications.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Left Column: Search & Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                          type="text" 
                          placeholder="Search by medicine name (e.g. Paracetamol, Ibuprofen, Albuterol)..."
                          value={medicineSearch}
                          onChange={(e) => setMedicineSearch(e.target.value)}
                          style={{ width: '100%' }}
                        />
                        
                        {/* Autocomplete Dropdown */}
                        {medicineSearch.trim() && getAutocompleteMatches().length > 0 && (
                          <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 100,
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            animation: 'slide-down 0.15s ease'
                          }}>
                            {getAutocompleteMatches().map(med => (
                              <div 
                                key={med.name}
                                onClick={() => {
                                  setMedicineSearch(med.name);
                                  setSelectedMed(med);
                                  addRecentSearch(med.name);
                                }}
                                style={{
                                  padding: '0.6rem 1rem',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  borderBottom: '1px solid #f1f5f9',
                                  display: 'flex',
                                  justifyContent: 'space-between'
                                }}
                                className="profile-menu-item"
                              >
                                <span style={{ fontWeight: '600' }}>{med.name}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{med.category}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          const matched = searchMedicines(medicineSearch);
                          setSelectedMed(matched);
                          if (matched) {
                            addRecentSearch(matched.name);
                          }
                        }}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600' }}
                      >
                        Search
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="medImageUpload" 
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setMedicineSearch("Scanning image...");
                            setTimeout(() => {
                              const match = MEDICINE_KB[0]; // Paracetamol
                              setMedicineSearch(match.name);
                              setSelectedMed(match);
                              addRecentSearch(match.name);
                            }, 1200);
                          }
                        }}
                      />
                      <label 
                        htmlFor="medImageUpload" 
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--accent-teal)',
                          cursor: 'pointer',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>📷 Scan Medicine Packaging Image</span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Common lookups:</span>
                      {MEDICINE_KB.map(med => (
                        <button
                          key={med.name}
                          onClick={() => {
                            setMedicineSearch(med.name);
                            setSelectedMed(med);
                            addRecentSearch(med.name);
                          }}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '15px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        >
                          {med.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedMed ? (
                    <div className="health-card animate-fade-in" style={{ borderLeft: '5px solid var(--accent-blue)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={20} color="var(--accent-teal)" />
                            {selectedMed.name} 
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>
                              (Synonyms: {selectedMed.synonyms.join(', ')})
                            </span>
                          </h3>
                        </div>
                        <button 
                          onClick={() => toggleSaveMedicine(selectedMed.name)}
                          style={{
                            color: savedMedicines.includes(selectedMed.name) ? 'var(--accent-rose)' : 'var(--text-muted)',
                            padding: '0.35rem',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title={savedMedicines.includes(selectedMed.name) ? "Remove from bookmarks" : "Save to bookmarks"}
                        >
                          <Heart size={18} fill={savedMedicines.includes(selectedMed.name) ? 'var(--accent-rose)' : 'none'} />
                        </button>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>General Indicated Uses</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{selectedMed.uses}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>General Precautions</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{selectedMed.precautions}</p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', backgroundColor: '#fff5f5', border: '1px solid var(--accent-rose-glow)', padding: '1rem', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-rose)', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <AlertOctagon size={16} />
                          CRITICAL SAFETY WARNING
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#7f1d1d', fontWeight: '500', lineHeight: '1.5' }}>{selectedMed.warnings}</p>
                      </div>

                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                        *Notice: This details general drug properties for patient education. HealthAI Companion does not prescribe treatments. Always consult your healthcare provider before taking any medication.
                      </p>
                    </div>
                  ) : (
                    medicineSearch && (
                      <div className="health-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No exact drug match found for "{medicineSearch}". Try searching from the common lookups above.
                      </div>
                    )
                  )}
                </div>

                {/* Right Column: Bookmarks & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Saved Medicines List */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Heart size={16} color="var(--accent-rose)" />
                      Saved Medicines
                    </h3>
                    
                    {savedMedicines.length === 0 ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '1.5rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: '12px',
                        border: '1px dashed var(--border-color)'
                      }}>
                        <Heart size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>No Saved Drugs</span>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: '1.3' }}>
                          Bookmark medications to access precautions and side effects quickly.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {savedMedicines.map(medName => {
                          const medObj = MEDICINE_KB.find(m => m.name.toLowerCase() === medName.toLowerCase());
                          return (
                            <div 
                              key={medName}
                              onClick={() => {
                                if (medObj) {
                                  setMedicineSearch(medObj.name);
                                  setSelectedMed(medObj);
                                }
                              }}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-tertiary)',
                                cursor: 'pointer'
                              }}
                              className="profile-menu-item"
                            >
                              <div style={{ textAlign: 'left' }}>
                                <strong style={{ fontSize: '0.82rem' }}>{medName}</strong>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                                  {medObj ? medObj.category.split(' (')[0] : 'Medication'}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveMedicine(medName);
                                }}
                                style={{ color: 'var(--accent-rose)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent Searches */}
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCcw size={16} color="var(--accent-teal)" />
                      Recent Searches
                    </h3>
                    {recentSearches.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No recent searches.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {recentSearches.map(term => (
                          <button
                            key={term}
                            onClick={() => {
                              const matched = searchMedicines(term);
                              setMedicineSearch(term);
                              setSelectedMed(matched);
                            }}
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '20px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: '#ffffff',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              fontWeight: '500'
                            }}
                            className="profile-menu-item"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- AI HEALTH RISK ASSESSMENT VIEW --- */}
          {view === 'risk' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>AI Health Risk Assessment</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analyze lifestyle markers to identify potential wellness risks (no clinical diagnosis).</p>
              </div>

              {profile.subscriptionPlan === 'free' && (
                <div className="premium-lock-overlay">
                  <Lock size={36} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Health Risk Assessments</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>
                    Unlock detailed lifestyle analyses, sleep score evaluation, cardiovascular risk screening, and actionable recommendations.
                  </p>
                  <button 
                    onClick={() => setView('profile')}
                    style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600' }}
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}

              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Wellness Questionnaire</h3>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const res = calculateHealthRisk(riskForm);
                    setRiskResult(res);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Daily Sleep (Hours)</label>
                      <input 
                        type="number" 
                        required 
                        min="2" 
                        max="24"
                        value={riskForm.sleep} 
                        onChange={(e) => setRiskForm({ ...riskForm, sleep: e.target.value })} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Weekly Active Exercise (Hours)</label>
                      <input 
                        type="number" 
                        required 
                        min="0" 
                        max="100" 
                        step="0.5"
                        value={riskForm.activity} 
                        onChange={(e) => setRiskForm({ ...riskForm, activity: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Diet Quality</label>
                      <select 
                        value={riskForm.diet} 
                        onChange={(e) => setRiskForm({ ...riskForm, diet: e.target.value })}
                        style={{ height: '42px', padding: '0 1rem' }}
                      >
                        <option value="healthy">Healthy (Balanced, vegetables, fiber)</option>
                        <option value="average">Average (Some processed, moderate veg)</option>
                        <option value="poor">Poor (High sugar, fast food, low fiber)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Nicotine / Smoking Habit</label>
                      <select 
                        value={riskForm.smoking} 
                        onChange={(e) => setRiskForm({ ...riskForm, smoking: e.target.value })}
                        style={{ height: '42px', padding: '0 1rem' }}
                      >
                        <option value="no">No (Non-smoker)</option>
                        <option value="yes">Yes (Active smoker)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Perceived Stress Level (1-5)</label>
                    <select 
                      value={riskForm.stress} 
                      onChange={(e) => setRiskForm({ ...riskForm, stress: e.target.value })}
                      style={{ height: '42px', padding: '0 1rem' }}
                    >
                      <option value="1">1 - Minimal Stress</option>
                      <option value="2">2 - Low / Manageable</option>
                      <option value="3">3 - Moderate</option>
                      <option value="4">4 - High Stress</option>
                      <option value="5">5 - Extreme Stress / Burnout</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600' }}
                  >
                    Evaluate Wellness Profile
                  </button>
                </form>
              </div>

              {riskResult && (
                <div className="health-card animate-fade-in" style={{ borderLeft: '5px solid var(--accent-teal)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1.15rem' }}>Risk Profile Analysis Output</h4>
                    <span style={{
                      fontSize: '0.8rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '15px',
                      backgroundColor: riskResult.category.includes('High') ? 'var(--accent-rose-glow)' : riskResult.category.includes('Moderate') ? 'rgba(234, 88, 12, 0.15)' : 'var(--accent-emerald-glow)',
                      color: riskResult.category.includes('High') ? 'var(--accent-rose)' : riskResult.category.includes('Moderate') ? 'var(--accent-warning)' : 'var(--accent-emerald)'
                    }}>
                      {riskResult.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="80" height="80" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent-teal)" strokeDasharray={`${riskResult.wellnessScore}, 100`} strokeWidth="4" strokeLinecap="round" />
                      </svg>
                      <span style={{ position: 'absolute', fontSize: '1.25rem', fontWeight: '800' }}>{riskResult.wellnessScore}</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>Wellness Index Score</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        This score estimates lifestyle compliance. High scores suggest lower long-term risk of lifestyle-induced conditions.
                      </p>
                    </div>
                  </div>

                  {riskResult.riskFactors.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Detected Risk Factors</span>
                      <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--accent-rose)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {riskResult.riskFactors.map((rf, i) => <li key={i}>{rf}</li>)}
                      </ul>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Actionable Recommendations</span>
                    <ul style={{ margin: '0.5rem 0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {riskResult.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    {riskResult.disclaimer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* --- SOS EMERGENCY VIEW --- */}
          {view === 'emergency' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--accent-rose)' }}>SOS Emergency Assistant</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Get instant first-aid guides, locate nearby trauma departments, or trigger immediate warning calls.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Critical Emergency?</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                      If you are experiencing severe chest pain, shortness of breath, sudden numbness, or heavy bleeding, click the SOS button to alert emergency dispatch simulation.
                    </p>
                    
                    <div className="sos-button-container">
                      <button 
                        type="button"
                        onClick={() => setSosTriggered(true)}
                        className="sos-trigger-btn"
                      >
                        <ShieldAlert size={36} />
                        <span>TRIGGER SOS</span>
                      </button>
                    </div>

                    {sosTriggered && (
                      <div className="glow-pulse-red animate-fade-in" style={{ padding: '1rem 1.5rem', borderRadius: '12px', backgroundColor: '#fff5f5', border: '1.5px solid var(--accent-rose)', width: '100%' }}>
                        <strong style={{ color: 'var(--accent-rose)', fontSize: '0.95rem' }}>🚨 SOS DISPATCH SIMULATION ACTIVE</strong>
                        <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '0.25rem' }}>
                          Local medical dispatchers have been notified of your simulated GPS location.
                        </p>
                        <p style={{ fontSize: '0.85rem', color: '#7f1d1d', fontWeight: '700', marginTop: '0.5rem' }}>
                          PLEASE DIAL 911 OR EMERGENCY SERVICES ON YOUR PHONE NOW.
                        </p>
                        <button 
                          type="button"
                          onClick={() => setSosTriggered(false)}
                          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline', marginTop: '0.5rem', cursor: 'pointer' }}
                        >
                          Cancel SOS Simulation
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>First-Aid Reference Manual</h3>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                      <input 
                        type="text" 
                        placeholder="Search emergency symptoms (e.g. burn, choking, bleeding)..." 
                        value={firstAidSearch}
                        onChange={(e) => setFirstAidSearch(e.target.value)}
                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                      {FIRST_AID_GUIDES.filter(g => g.title.toLowerCase().includes(firstAidSearch.toLowerCase())).map(g => (
                        <div key={g.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Info size={16} color="var(--accent-teal)" />
                            {g.title}
                          </h4>
                          <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingLeft: '1.25rem' }}>
                            {g.steps.map((s, idx) => <li key={idx}>{s}</li>)}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Nearby ER Departments</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {MOCK_HOSPITALS.map(h => (
                        <div key={h.name} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card-hover)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{h.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📍 {h.distance} • {h.address}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>📞 {h.phone}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', fontWeight: '600', marginTop: '0.25rem' }}>{h.emergencySpecialties}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>GPS Trauma Map Simulator</span>
                    <div className="emergency-map-placeholder">
                      <div className="map-grid-pattern" />
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'var(--accent-blue)', position: 'absolute', border: '2.5px solid #ffffff', boxShadow: '0 0 10px rgba(2,132,199,0.5)', top: '50%', left: '50%' }} title="Your GPS Location" />
                      
                      <div className="hospital-marker-pin" style={{ top: '30%', left: '70%' }} title="MMC Hospital (1.2 miles)" />
                      <div className="hospital-marker-pin" style={{ top: '80%', left: '20%' }} title="VGH ER (2.8 miles)" />
                      <div className="hospital-marker-pin" style={{ top: '15%', left: '40%' }} title="St. Jude Clinic (4.5 miles)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- HEALTH LIBRARY VIEW --- */}
          {view === 'education' && (
            <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>Health Library & Education</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Access verified wellness guidelines, physiological breakdowns, and expert columns.</p>
              </div>

              <div className="health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                  <input 
                    type="text" 
                    placeholder="Search articles by title, specialty, or author..." 
                    value={educationSearch}
                    onChange={(e) => setEducationSearch(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {selectedArticle ? (
                <div className="health-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <button 
                    onClick={() => setSelectedArticle(null)}
                    style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: '600', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    &larr; Back to articles library
                  </button>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
                      {selectedArticle.category}
                    </span>
                    <h3 style={{ fontSize: '1.8rem', marginTop: '0.5rem', fontWeight: '800' }}>{selectedArticle.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Written by <strong>{selectedArticle.author}</strong> • {selectedArticle.readTime}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                    {selectedArticle.content}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {EDUCATION_ARTICLES.filter(art => 
                    art.title.toLowerCase().includes(educationSearch.toLowerCase()) ||
                    art.category.toLowerCase().includes(educationSearch.toLowerCase()) ||
                    art.author.toLowerCase().includes(educationSearch.toLowerCase())
                  ).map(art => (
                    <div key={art.id} className="health-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '600' }}>{art.category}</span>
                        <h3 style={{ fontSize: '1.15rem', marginTop: '0.25rem' }}>{art.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>{art.summary}</p>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{art.author}</span>
                        <button 
                          onClick={() => setSelectedArticle(art)}
                          style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: '600' }}
                        >
                          Read Article &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- DOCTOR PORTAL VIEW --- */}
          {view === 'doctor-portal' && (
            <div className="animate-fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--accent-teal)' }}>Physician Portal Dashboard</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Review assigned patient panel details, verify laboratory reports, and inspect AI-generated summary dossiers.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                <div className="glass-panel" style={{ borderRadius: '16px', padding: '1rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Assigned Patients</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {DOCTOR_PATIENTS.map(pat => {
                      const isSelected = pat.id === selectedPatientId;
                      return (
                        <div 
                          key={pat.id}
                          onClick={() => setSelectedPatientId(pat.id)}
                          style={{
                            padding: '0.85rem', borderRadius: '10px',
                            backgroundColor: isSelected ? 'var(--accent-teal-glow)' : 'var(--bg-tertiary)',
                            border: isSelected ? '1.5px solid var(--accent-teal)' : '1px solid var(--border-color)',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <strong style={{ fontSize: '0.9rem', color: isSelected ? 'var(--accent-teal)' : 'var(--text-primary)' }}>{pat.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {pat.gender}, {pat.age} yrs • Blood Group: {pat.bloodGroup}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const patObj = DOCTOR_PATIENTS.find(p => p.id === selectedPatientId);
                  if (!patObj) return <div style={{ color: 'var(--text-muted)' }}>No patient selected.</div>;
                  
                  const aiSummary = getAiPatientSummary(patObj);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      <div className="health-card animate-fade-in" style={{ borderLeft: '5px solid var(--accent-teal)', backgroundColor: 'var(--accent-teal-glow)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          ✨ HealthAI Companion: Clinician dossier summary
                        </span>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '0.5rem', lineHeight: '1.6' }}>
                          "{aiSummary}"
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div className="health-card">
                          <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Clinical Parameters</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <p><strong>Known Allergies:</strong> <span style={{ color: 'var(--accent-rose)' }}>{patObj.allergies}</span></p>
                            <p><strong>Medical History:</strong> {patObj.medicalHistory}</p>
                            <p><strong>Active Medications:</strong> {patObj.currentMedications}</p>
                            <p><strong>Emergency Contact:</strong> {patObj.emergencyContact}</p>
                          </div>
                        </div>

                        <div className="health-card">
                          <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Today's Tracker Metrics</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                            <div>💧 Water: <strong>{patObj.trackers.water} ml</strong></div>
                            <div>😴 Sleep: <strong>{patObj.trackers.sleep} hours</strong></div>
                            <div>🏃 Exercise: <strong>{patObj.trackers.exercise} mins</strong></div>
                            <div>🚶 Steps: <strong>{patObj.trackers.steps} steps</strong></div>
                            <div>🔥 Calories: <strong>{patObj.trackers.calories} kcal</strong></div>
                            <div>😊 Mood: <strong>{patObj.trackers.mood}/5</strong></div>
                          </div>
                        </div>
                      </div>

                      <div className="health-card animate-fade-in">
                        <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Uploaded Lab Reports</h4>
                        {patObj.reports.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No lab records uploaded.</p>
                        ) : (
                          patObj.reports.map(rep => (
                            <div key={rep.id} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.85rem' }}>{rep.fileName}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>
                                Analyzed on: {new Date(rep.uploadedAt).toLocaleDateString()}
                              </span>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                                <strong>AI Summary Findings:</strong> {rep.summary}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="health-card animate-fade-in">
                        <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Clinic Appointments Calendar</h4>
                        {patObj.appointments.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No appointments scheduled.</p>
                        ) : (
                          patObj.appointments.map(apt => (
                            <div key={apt.id} style={{ padding: '0.85rem', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <div>
                                <strong style={{ fontSize: '0.85rem' }}>Consultation Booking</strong>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notes: {apt.notes}</p>
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-teal)' }}>
                                {apt.date} at {apt.time}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}

          {/* QR Code Scan result modal */}
          {showQrModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }} onClick={() => setShowQrModal(false)}>
              <div className="health-card animate-fade-in" style={{
                width: '100%', maxWidth: '400px', backgroundColor: '#ffffff',
                padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.1rem' }}>Patient QR Health Passport</h4>
                  <button onClick={() => setShowQrModal(false)} style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>&times;</button>
                </div>
                
                <div style={{ border: '8px solid #000000', borderRadius: '12px', padding: '1rem', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '1.5px', width: '180px', height: '180px' }}>
                    {Array.from({ length: 576 }).map((_, i) => {
                      const isBlack = (i % 2 === 0 && i % 5 === 0) || (i % 3 === 0 && i % 7 === 0) || (i < 144 && i % 4 === 0) || (i > 400 && i % 3 === 0);
                      return (
                        <div 
                          key={i} 
                          style={{ width: '100%', height: '100%', backgroundColor: isBlack ? '#000000' : '#ffffff' }} 
                        />
                      );
                    })}
                  </div>
                </div>

                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    ✓ Secure Health Pass Validated
                  </span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Patient ID: <strong>{profile.name ? profile.name.toUpperCase().substring(0,3) + "-" + profile.age : 'P-1'}</strong>
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '300px', marginTop: '0.5rem' }}>
                    "Scanned record retrieves blood profile, asthma triggers, and emergency contacts instantly."
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowQrModal(false)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--accent-teal)', color: '#ffffff', fontWeight: '600' }}
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
