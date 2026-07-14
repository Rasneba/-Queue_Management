export type Language = 'en' | 'am' | 'om';

export interface TranslationDict {
  [key: string]: {
    en: string;
    am: string;
    om: string;
  };
}

export const TRANSLATIONS: TranslationDict = {
  hospitalName: {
    en: "Lancet General Hospital",
    am: "ላንሴት አጠቃላይ ሆስፒታል",
    om: "Hospitaala Walii-galaa Lancet"
  },
  aiTriageHub: {
    en: "Triage Hub - Queue Management",
    am: "የቲሪያዥ ማዕከል - ወረፋ አስተዳደር",
    om: "Giddugala Triage - Bulchiinsa Tarree"
  },
  tabSelfCheckIn: {
    en: "Self-Check-In",
    am: "እራስ መመዝገቢያ",
    om: "Of-Galmeessuu"
  },
  tabTriageKiosk: {
    en: "Triage Kiosk",
    am: "የቲሪያዥ መግቢያ",
    om: "Kiosk Triage"
  },
  tabWaitingBoard: {
    en: "Waiting Board",
    am: "የመጠባበቂያ ሰሌዳ",
    om: "Gabatee Eeggachuu"
  },
  tabStaffConsole: {
    en: "Staff Console",
    am: "የሰራተኞች መቆጣጠሪያ",
    om: "Deeggarsa Hojjettootaa"
  },
  tabReceptionDesk: {
    en: "Reception Desk",
    am: "የመቀበያ ዴስክ",
    om: "Deskii Simannaa"
  },
  tabAnalytics: {
    en: "Analytics",
    am: "ዳታ ትንተና",
    om: "Xiinxala"
  },
  selfCheckInKioskHeader: {
    en: "Clinic Self-Check-In Kiosk",
    am: "የክሊኒክ እራስ መመዝገቢያ ማሽን",
    om: "Kiosk Of-Galmeessuu Kilinikaa"
  },
  fastTrackText: {
    en: "Fast-Track Scheduled Appointments & Diagnostics",
    am: "የቀጠሮ እና የምርመራ አገልግሎቶችን በፍጥነት ያግኙ",
    om: "Kallattii Saffisaa Qophii Durgoo & Qorannoo Fayyaa"
  },
  identifyYourself: {
    en: "Identify Yourself",
    am: "ማንነትዎን ያረጋግጡ",
    om: "Eenyummaa keessan adda baasaa"
  },
  fullName: {
    en: "Full Name",
    am: "ሙሉ ስም",
    om: "Maqaa Guutuu"
  },
  age: {
    en: "Age",
    am: "ዕድሜ",
    om: "Umrii"
  },
  gender: {
    en: "Gender",
    am: "ጾታ",
    om: "Saala"
  },
  select: {
    en: "Select",
    am: "ይምረጡ",
    om: "Filadhaa"
  },
  male: {
    en: "Male",
    am: "ወንድ",
    om: "Dhiira"
  },
  female: {
    en: "Female",
    am: "ሴት",
    om: "Dubartii"
  },
  other: {
    en: "Other",
    am: "ሌላ",
    om: "Biroo"
  },
  reasonForVisit: {
    en: "Reason for Visit",
    am: "የመጡበት ምክንያት",
    om: "Sababa Imala Keessanii"
  },
  chooseReason: {
    en: "Choose Reason for Visit",
    am: "የመጡበትን ምክንያት ይምረጡ",
    om: "Sababa Imala keessanii Filadhaa"
  },
  back: {
    en: "Back",
    am: "ወደኋላ",
    om: "Gara duubaa"
  },
  checkInNow: {
    en: "Check-In Now",
    am: "አሁን ይመዝገቡ",
    om: "Amma Of-Galmeessi"
  },
  registrationSuccessful: {
    en: "Registration Successful!",
    am: "ምዝገባው ተሳክቷል!",
    om: "Galmeessi Milkaa'eera!"
  },
  checkInAnotherPatient: {
    en: "Check-In Another Patient",
    am: "ሌላ ታካሚ ይመዝግቡ",
    om: "Nama Biroo Galmeessi"
  },
  smartCheckInSub: {
    en: "Smart Check-In, Symptoms Assessment & Live Priority Queuing",
    am: "ብልህ ምዝገባ፣ የህመም ምልክቶች ግምገማ እና የቀጥታ ወረፋ ቅደም ተከተል",
    om: "Of-Galmeessuu Saffisaa, Madaallii Mallattoolee & Bulchiinsa Tarree"
  },
  whatBringsYouIn: {
    en: "What brings you in today?",
    am: "ዛሬ ምን ሊረዱዎት ይችላሉ?",
    om: "Har'a maaltu si qunname?"
  },
  newPatientTriage: {
    en: "New Patient & Triage",
    am: "አዲስ ታካሚ እና ቲሪያዥ",
    om: "Galmee Haaraa & Triage"
  },
  newPatientTriageDesc: {
    en: "Register yourself, state your symptoms, and get triaged by our clinical system.",
    am: "እራስዎን ይመዝግቡ፣ ምልክቶችዎን ይናገሩ እና በክሊኒካችን ሐኪም ደረጃዎን ያግኙ።",
    om: "Of-galmeessii, mallattoo kee ibsi, dabalataan klinikaan madaalami."
  },
  alreadyCheckedIn: {
    en: "Already Checked-In?",
    am: "ከዚህ በፊት ተመዝግበዋል?",
    om: "Kanaan dura Of-Galmeessiteettaa?"
  },
  alreadyCheckedInDesc: {
    en: "If you checked-in at home or via phone, find your ticket to update clinical symptoms.",
    am: "ከቤት ሆነው ወይም በስልክ ከተመዘገቡ፣ ምልክቶችዎን ለማደስ ትኬትዎን እዚህ ይፈልጉ።",
    om: "Yoo manatti ykn bilbilaan of-galmeessite, tikkee kee kanaan dabalii ibsi."
  },
  searchYourName: {
    en: "Search your name or ticket ID...",
    am: "ስምዎን ወይም የትኬት ቁጥርዎን ይፈልጉ...",
    om: "Maqaa ykn Lakk tikkee kee barbaadi..."
  },
  describeSymptoms: {
    en: "Describe Your Symptoms & Feeling",
    am: "የሚሰማዎትን የህመም ምልክቶች ይግለጹ",
    om: "Mallattoolee & Miira keessan ibsaa"
  },
  describeSymptomsPlaceholder: {
    en: "e.g., I have a burning chest pain that radiates to my left arm, along with mild nausea...",
    am: "\u1275\u1348\u1295\u1235\u1295\u1276\u1275\u1295\u1235 \u134D\u1276\u1233\u1275\u1295\u1235 \u1270\u12AB\u1295\u1235 \u1276\u1275\u1295\u1235 \u127A\u1276\u1275\u1295\u1235 \u1265\u1275\u121D\u1201\u1295\u1235 \u1278\u1213\u1295\u1235 \u127D\u1223\u1295\u1235...",
    om: "Fk. Laphee gubaa harka bitaatti daddarbu fi lola'uun na qunnamera..."
  },
  quickPresets: {
    en: "Quick Symptom Presets",
    am: "አጭር የህመም ምልክቶች አማራጮች",
    om: "Mallattoolee Murteeffaman Saffisaa"
  },
  clearSearch: {
    en: "Clear",
    am: "አጽዳ",
    om: "Haquu"
  },
  clinicalAiTriageKioskHeader: {
    en: "Clinical Triage Kiosk",
    am: "የክሊኒክ ቲሪያዥ ማሽን",
    om: "Kiosk Triage Klinikaa"
  },
  nowServing: {
    en: "Now Serving",
    am: "አሁን በመገልገያ ላይ ያሉ",
    om: "Amma tajaajilamaa kan jiran"
  },
  upNextInQueue: {
    en: "Up Next in Queue",
    am: "በመቀጠል የሚጠሩ ታካሚዎች",
    om: "Kan Itti Aanu Tarree Keessaa"
  },
  mins: {
    en: "mins",
    am: "ደቂቃዎች",
    om: "daq"
  },
  estimatedWait: {
    en: "Est. Wait",
    am: "የጥበቃ ጊዜ",
    om: "Yeroo tilmaamame"
  },
  priority: {
    en: "Priority",
    am: "ቅድሚያ",
    om: "Dursi"
  },
  noPatientsActive: {
    en: "No active patients in service right now.",
    am: "በአሁኑ ሰዓት በመገልገያ ላይ ያሉ ታካሚዎች የሉም።",
    om: "Tajaajila irratti dhukkubsataan amma hin jiru."
  },
  noPatientsWaiting: {
    en: "Lobby is currently clear. No patients waiting.",
    am: "የመጠባበቂያ ክፍሉ ክፍት ነው። የሚጠብቅ ታካሚ የለም።",
    om: "Lobby'n qulqulluudha. Dhukkubsataan eegu hin jiru."
  },
  reason_appointment_title: {
    en: "Scheduled Appointment",
    am: "ቀጠሮ ነበረኝ",
    om: "Qophii Durgoo"
  },
  reason_appointment_desc: {
    en: "Pre-booked consultation with a clinical specialist",
    am: "ቀደም ብሎ የተያዘ የልዩ ባለሙያ ቀጠሮ",
    om: "Gorsa dhuunfaa ogeessa klinikaa waliin qophaa'e"
  },
  reason_routine_title: {
    en: "Routine Wellness Check",
    am: "መደበኛ የጤና ምርመራ",
    om: "Sakatta'iinsa Fayyaa Idilee"
  },
  reason_routine_desc: {
    en: "Annual physicals, routine check-ups, or blood pressure screening",
    am: "አመታዊ ምርመራ፣ መደበኛ ፍተሻ ወይም የደም ግፊት መለካት",
    om: "Sakatta'iinsa fayyaa waggaa, to'annoo idilee, ykn dhiibbaa dhiigaa"
  },
  reason_vaccine_title: {
    en: "Vaccination / Shot",
    am: "ክትባት / መርፌ",
    om: "Toora Talaallii"
  },
  reason_vaccine_desc: {
    en: "Flu shots, travel boosters, or prescribed injections",
    am: "የጉንፋን ክትባት፣ የጉዞ ክትባቶች ወይም የታዘዙ መርፌዎች",
    om: "Talaallii utalloo, talaallii imalaa, ykn waraannoo qorichaa"
  },
  reason_lab_title: {
    en: "Lab Work & Blood Test",
    am: "የላብራቶሪ እና የደም ምርመራ",
    om: "Hojii Laaboratoorii & Qorannoo Dhiigaa"
  },
  reason_lab_desc: {
    en: "Diagnostic blood draws, urinalysis, or specimen hand-offs",
    am: "የደም ምርመራ፣ የሽንት ምርመራ ወይም ሌሎች የላብ ናሙናዎች",
    om: "Dhiiga laaboratoorii, fincaan, ykn qorannoo firiilee biroo"
  },
  reason_prescription_title: {
    en: "Prescription Refill",
    am: "የመድኃኒት ማደሻ",
    om: "Fichee Qorichaa Haaromsuu"
  },
  reason_prescription_desc: {
    en: "Pick-up or renewal request for clinical prescriptions",
    am: "የታዘዘ መድኃኒት መውሰጃ ወይም ማደሻ ጥያቄ",
    om: "Fichee qorichaa fudhachuu ykn haaromsuu gaafachuu"
  },
  preset_symptom_chest: {
    en: "Chest tightness / Cardiac pain",
    am: "የደረት መጥበቅ / የልብ ህመም",
    om: "Lafhee gubaa / Dhukkubbii Onnee"
  },
  preset_symptom_chest_desc: {
    en: "Shortness of breath, pressure, palpitations",
    am: "የትንፋሽ መቆራረጥ፣ ከፍተኛ ግፊት፣ የልብ ምት መጨመር",
    om: "Hafura ciccituu, dhiibbaa, dhahannaa onnee dabaluu"
  },
  preset_symptom_pediatric: {
    en: "Pediatric high fever",
    am: "የህጻናት ከፍተኛ ትኩሳት",
    om: "Oo'a guddaa daa'immanii"
  },
  preset_symptom_pediatric_desc: {
    en: "Child under 14 with high temperature, cough",
    am: "ዕድሜው ከ14 ዓመት በታች የሆነ ልጅ በትኩሳት እና በሳል",
    om: "Daa'ima waggaa 14 gadi oo'a guddaa fi qufaa qabu"
  },
  preset_symptom_ortho: {
    en: "Severe sprain / Bone fracture",
    am: "ከፍተኛ የመወለም ወይም የአጥንት ስብራት",
    om: "Mila riga'uu / Lafhee cabuu cimaa"
  },
  preset_symptom_ortho_desc: {
    en: "Twisted limb, joint swelling, unable to bear weight",
    am: "የእጅ ወይም እግር መዞር፣ የመገጣጠሚያ ማበጥ፣ መቆም አለመቻል",
    om: "Mila jal'achuu, dhibbaa dacha'uu, miila lafa kaawachuu dadhabuu"
  },
  preset_symptom_breathing: {
    en: "Acute breathing difficulty",
    am: "ከፍተኛ የትንፋሽ መቆራረጥ / መታፈን",
    om: "Dhiphina sirna hafuraa tasaa"
  },
  preset_symptom_breathing_desc: {
    en: "Sudden respiratory distress, severe allergies",
    am: "ድንገተኛ የትንፋሽ ማጣት፣ ከፍተኛ የአለርጂ ስሜት",
    om: "Rakkina hafuraa tasaa, xadhigummaa sanyii cimaa"
  },
  preset_symptom_cold: {
    en: "Sore throat / Standard cold",
    am: "የጉሮሮ መቁሰል / ተራ ጉንፋን",
    om: "Dhukkubbii qoonqoo / Qufaa idilee"
  },
  preset_symptom_cold_desc: {
    en: "Mild fever, runny nose, congestion",
    am: "ቀላል ትኩሳት፣ የአፍንጫ ፈሳሽ፣ መታፈን",
    om: "Oo'a salphaa, funyaan dhangala'u, dhiphina sirna hafuraa"
  },
  patient: {
    en: "Patient",
    am: "ታካሚ",
    om: "Dhukkubsataa"
  },
  department: {
    en: "Department",
    am: "ክፍል",
    om: "Kutaa"
  },
  cancel: {
    en: "Cancel",
    am: "ሰርዝ",
    om: "Haquu"
  },
  ticketNumber: {
    en: "Ticket Number",
    am: "የትኬት ቁጥር",
    om: "Lakkii Tikkee"
  },
  trackYourQueue: {
    en: "Track Your Queue Position",
    am: "የወረፋ ቦታዎን ይከታተሉ",
    om: "Ba'ina Keessanii Hordofaa"
  },
  positionInQueue: {
    en: "Position in Queue",
    am: "በወረፋ ውስጥ ቦታ",
    om: "Ba'ina Tarree Keessaa"
  },
  peopleAhead: {
    en: "people ahead of you",
    am: "ሰዎች ከእርስዎ በፊት",
    om: "namoota keessanii dura jiran"
  },
  refreshStatus: {
    en: "Refresh Status",
    am: "ሁኔታውን አደስስ",
    om: "Haala Haaromsii"
  },
  waitingInLobby: {
    en: "Waiting in Lobby",
    am: "በመጠባበቂያ ክፍል ውስጥ",
    om: "Lobby keessatti eeggachaa"
  },
  calledToRoom: {
    en: "Called to Room",
    am: "ወደ ክፍል ተጥራ",
    om: "Kutaa keessatti waamame"
  },
  nowBeingServed: {
    en: "Now Being Served",
    am: "አሁን በመገልገያ ላይ",
    om: "Amma Tajaajilamaa"
  },
  visitCompleted: {
    en: "Visit Completed",
    am: "ጉብኝት ተጠናቅቋል",
    om: "Imala milkaa'eera"
  },
  estimatedWaitTime: {
    en: "Estimated Wait Time",
    am: "የጥበቃ ጊዜ",
    om: "Yeroo Tilmaamame"
  },
  ticket: {
    en: "Ticket",
    am: "ትኬት",
    om: "Tikkee"
  },
  status: {
    en: "Status",
    am: "ሁኔታ",
    om: "Haala"
  },
  room: {
    en: "Room",
    am: "ክፍል",
    om: "Kutaa"
  }
};

export function t(key: string, lang: Language): string {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[lang] || entry['en'] || key;
}
