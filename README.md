# HealthAI Companion — AI Healthcare Platform MVP

HealthAI Companion is a production-ready, client-side sandboxed AI Healthcare assistant and wellness tracking MVP designed for showcase in developer portfolios and deployment on hosting services like Vercel. 

The application implements a rich set of healthcare tools including an AI health assistant, browser-native voice recognition and text-to-speech feedback, medical report translations, daily trackers, specialty doctor calendars, and an emergency SOS assistant HUD.

---

## 🚀 Key Features

* **💬 24/7 AI Health Assistant (RAG Simulation)**: Secure, calm, and safety-compliant conversation. Retrieves references from pre-loaded medical guides (NIH Asthma, AHA Hypertension, CDC Viruses, WHO Allergies, Harvard Sleep Cycles) and appends citations dynamically.
* **🎤 Multilingual Voice Assistant**: Convert speech-to-text natively using the Web Speech API. Speaks back responses using localized pitch and rate Utterance settings. Supports English, Hindi, and Hinglish.
* **📄 Medical Report Analyzer**: Translates complex clinical panels (Vitamin D panel, Lipids and Cholesterol, Basic Metabolic indicators) into layman terms, explaining medical jargon and generating questions to discuss with primary physicians.
* **📊 Daily Wellness Trackers**: Interconnected tracker widgets for sleep, hydration, exercise, steps, calories, and mood rating that calculate a daily Wellness Index Score.
* **📅 Appointment Calendar Planner**: Select specialty doctors (Cardiology, Dermatology, Neurology, General Practitioners) to book consultation slots, complete with calendar alarms and clinician dossier exports.
* **🩺 Doctor Portal Dashboard**: Toggles an assigned clinician workspace showing summary dossiers, past lab records, and schedules. (Unlocked via the Clinic Plan).
* **🚨 Emergency SOS Center**: A high-visibility warning overlay that intercepts crisis statements, showing immediate first-aid guides, nearby trauma departments, emergency contact numbers, and a GPS map simulation.

---

## 🛡️ Privacy & Medical Compliance Frameworks

1. **Compliance Boundaries**: The AI Companion strictly follows healthcare safety regulations. It does not diagnose diseases, recommend drug dosages, or issue medical prescriptions. It emphasizes consulting qualified medical professionals.
2. **On-Device Confidentiality**: In compliance with client data security, all conversations, daily logs, appointments, and report details are stored inside the browser's client-side sandbox (`localStorage`).
3. **No Audio Cloud Storage**: Speech transcribing and voice readouts are executed on the user's browser, preventing external audio storage or leaks.
4. **Data Purging**: Users can wipe their conversation history or delete their entire account and clear the local sandbox under profile settings.

---

## 🛠️ Technology Stack

* **Core UI**: React 18, Vite Bundler.
* **Styling**: Vanilla CSS (Harmony Teal/Blue medical color systems, responsive flex layouts, mic glows, and dark glassmorphic pricing panels).
* **Icons**: `lucide-react`
* **Speech Engine**: Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`).
* **Deployment**: Optimized for one-click static deployments on Vercel.

---

## 💻 Local Setup & Development

### 1. Prerequisite Dependencies
Ensure you have Node.js (v18+) installed on your machine.

### 2. Install Packages
Clone the repository, navigate to the folder, and run:
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to preview.

### 4. Build for Production
```bash
npm run build
```
Vite compiles a highly-optimized static client bundle into the `dist` directory.

---

## 🌐 Deploying to Vercel

The platform is fully optimized for Vercel deployment:
1. Install Vercel CLI or import the repository in your Vercel Dashboard.
2. The project's configuration is managed via `vercel.json` to handle single-page application URL rewrites fallback seamlessly.
3. Env blueprints are detailed in `.env.example`. Make sure to set these key identifiers when scaling to an external cloud database or custom LLM server.

---

## 🔮 Future Startup Roadmap

* **Mobile Application**: Port layouts into a React Native / Expo wrapper to enable native Android/iOS microphone and push notification hooks.
* **Clinician Integration**: Incorporate EHR/EMR sync protocols using HL7 and FHIR APIs to connect patient trackers directly to real hospital networks.
* **Payment Gates**: Implement Stripe checkout flows to handle Premium and Clinic subscriptions.
* **Expanded RAG**: Sync the local dictionary with live vector database searches (e.g. Pinecone) querying dynamic medical publications.
