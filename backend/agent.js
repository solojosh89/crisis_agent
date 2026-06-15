const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const AMBULANCE = {
  lagos:  { number: '767', name: 'LASAMBUS (Lagos Ambulance Service)' },
  abuja:  { number: '112', name: 'FCT Emergency (Abuja)' },
  ibadan: { number: '080-3010-0000', name: 'Oyo State Emergency' },
  osun:   { number: '080-3010-1111', name: 'Osun State Emergency' },
  national: { number: '199', name: 'Nigeria National Emergency' },
};

const HOSPITALS = {
  lagos: [
    { name: "Lagos University Teaching Hospital (LUTH)", phone: "01-7748313", area: "Idi-Araba", specialty: ["emergency", "sickle cell", "surgery", "blood bank"], nhis: true, deposit: "₦50,000–₦100,000" },
    { name: "Lagos Island General Hospital", phone: "01-2660100", area: "Lagos Island", specialty: ["emergency", "general"], nhis: true, deposit: "₦20,000–₦50,000" },
    { name: "Ikeja General Hospital", phone: "01-4970816", area: "Ikeja", specialty: ["emergency", "general"], nhis: true, deposit: "₦20,000–₦50,000" },
    { name: "National Orthopaedic Hospital", phone: "01-4521026", area: "Igbobi", specialty: ["emergency", "orthopaedic"], nhis: false, deposit: "₦30,000–₦60,000" },
  ],
  abuja: [
    { name: "National Hospital Abuja", phone: "09-5238108", area: "Central Business District", specialty: ["emergency", "sickle cell", "surgery", "blood bank"], nhis: true, deposit: "₦50,000–₦100,000" },
    { name: "University of Abuja Teaching Hospital", phone: "09-8736007", area: "Gwagwalada", specialty: ["emergency", "general"], nhis: true, deposit: "₦30,000–₦70,000" },
    { name: "Asokoro District Hospital", phone: "09-3148888", area: "Asokoro", specialty: ["emergency", "general"], nhis: true, deposit: "₦20,000–₦40,000" },
    { name: "Maitama District Hospital", phone: "09-8705000", area: "Maitama", specialty: ["emergency", "general"], nhis: true, deposit: "₦20,000–₦40,000" },
  ],
  ibadan: [
    { name: "University College Hospital (UCH)", phone: "02-2411620", area: "Ibadan", specialty: ["emergency", "sickle cell", "surgery", "blood bank"], nhis: true, deposit: "₦40,000–₦80,000" },
    { name: "Adeoyo State Hospital", phone: "02-2315441", area: "Ring Road", specialty: ["emergency", "general"], nhis: true, deposit: "₦15,000–₦30,000" },
    { name: "Jericho Specialist Hospital", phone: "02-2412642", area: "Jericho", specialty: ["emergency", "specialist"], nhis: true, deposit: "₦20,000–₦50,000" },
  ],
  osun: [
    { name: "LAUTECH Teaching Hospital", phone: "035-240012", area: "Osogbo", specialty: ["emergency", "sickle cell", "surgery", "blood bank"], nhis: true, ohis: true, deposit: "₦30,000–₦70,000" },
    { name: "Osun State Hospital", phone: "035-241500", area: "Osogbo", specialty: ["emergency", "general"], nhis: true, ohis: true, deposit: "₦10,000–₦30,000" },
    { name: "Ife Federal Medical Centre", phone: "036-230285", area: "Ile-Ife", specialty: ["emergency", "sickle cell", "surgery"], nhis: true, ohis: true, deposit: "₦30,000–₦60,000" },
  ],
};

const BLOOD_BANKS = {
  lagos: [
    { name: "Lagos State Blood Transfusion Service", phone: "01-4530820", area: "Idi-Araba" },
    { name: "LUTH Blood Bank", phone: "01-7748313", area: "Idi-Araba" },
  ],
  abuja: [
    { name: "National Blood Transfusion Service", phone: "09-5238200", area: "Maitama" },
    { name: "National Hospital Blood Bank", phone: "09-5238108", area: "CBD" },
  ],
  ibadan: [
    { name: "UCH Blood Bank", phone: "02-2411620", area: "Ibadan" },
    { name: "Oyo State Blood Bank", phone: "02-2315441", area: "Ring Road" },
  ],
  osun: [
    { name: "LAUTECH Blood Bank", phone: "035-240012", area: "Osogbo" },
    { name: "Osun State Blood Transfusion Service", phone: "035-241500", area: "Osogbo" },
  ],
};

async function runCrisisAgent(emergencyData) {
  const { patientName, age, condition, city, symptoms, contactPhone, profile = {} } = emergencyData;

  const cityLower = (city || 'lagos').toLowerCase();
  const hospitals  = HOSPITALS[cityLower]  || HOSPITALS.lagos;
  const bloodBanks = BLOOD_BANKS[cityLower] || BLOOD_BANKS.lagos;
  const ambulance  = AMBULANCE[cityLower]   || AMBULANCE.national;

  // Build rich patient context from saved profile
  const patientContext = [
    profile.bloodType  && `Blood Type: ${profile.bloodType}`,
    profile.genotype   && `Genotype: ${profile.genotype}`,
    profile.allergies  && `Allergies: ${profile.allergies}`,
    profile.medications && `Current Medications: ${profile.medications}`,
    profile.conditions && `Known Conditions: ${profile.conditions}`,
    profile.insuranceType && `Insurance: ${profile.insuranceType}`,
    profile.insuranceNumber && `Insurance ID: ${profile.insuranceNumber}`,
    profile.hmoProvider && `HMO: ${profile.hmoProvider}`,
    profile.weight && `Weight: ${profile.weight}kg`,
  ].filter(Boolean).join('\n');

  const systemPrompt = `You are CrisisAgent, an AI emergency medical coordinator built specifically for Nigeria.
You help patients and families navigate medical emergencies quickly, clearly, and calmly.

Your response must follow this exact structure:
1. IMMEDIATE ACTIONS (3-5 numbered steps, ultra clear, no medical jargon)
2. HOSPITAL RECOMMENDATION (which one to go to and exactly why based on the patient's condition)
3. WHAT TO TELL THE HOSPITAL (exact words they should say at the door)
4. WHAT TO BRING & PREPARE (documents, deposit estimate, insurance card if applicable)
5. MEDICATION WARNING (flag any dangerous drug interactions or allergies if relevant)
6. REASSURANCE (one calm, human closing sentence)

Rules:
- Use the patient's actual blood type, genotype, allergies and medications in your response
- If genotype is SS (Sickle Cell), give sickle cell specific advice
- If patient has insurance, tell them to present their insurance card
- Mention the ambulance number for their city
- Be specific, not generic. Lives depend on speed and clarity.
- Write as if you are talking directly to a scared family member
- Keep total response under 400 words`;

  const userMessage = `EMERGENCY ALERT — NIGERIA
━━━━━━━━━━━━━━━━━━━━━━━━
Patient: ${patientName}, Age: ${age}
Location: ${city}, Nigeria
Current Symptoms: ${symptoms}
Known Condition: ${condition}
Contact Phone: ${contactPhone}

PATIENT MEDICAL PROFILE:
${patientContext || 'No profile data saved'}

AMBULANCE SERVICE:
${ambulance.name}: ${ambulance.number}

AVAILABLE HOSPITALS IN ${city.toUpperCase()}:
${hospitals.map(h => `- ${h.name} | ${h.area} | ${h.phone} | ${h.specialty.join(', ')} | NHIS: ${h.nhis ? 'Yes' : 'No'}${h.ohis ? ' | OHIS: Yes' : ''} | Deposit: ${h.deposit}`).join('\n')}

BLOOD BANKS:
${bloodBanks.map(b => `- ${b.name} | ${b.area} | ${b.phone}`).join('\n')}

Coordinate the emergency response now. Be specific, fast, and clear.`;

  const aiResponse = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage },
    ],
    max_tokens: 1200,
    temperature: 0.3,
  });

  return {
    response:   aiResponse.choices[0].message.content,
    hospitals:  hospitals.slice(0, 3),
    bloodBanks: bloodBanks.slice(0, 2),
    ambulance,
    timestamp:  new Date().toISOString(),
  };
}

module.exports = { runCrisisAgent };
