import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EMPTY_PROFILE = {
  fullName: '', age: '', gender: '', bloodType: '', weight: '', language: 'English',
  conditions: '', allergies: '', medications: '', genotype: '',
  insuranceType: '', insuranceNumber: '', hmoProvider: '', hmoPhone: '', policyExpiry: '',
  contact1Name: '', contact1Phone: '', contact1Rel: '',
  contact2Name: '', contact2Phone: '', contact2Rel: '',
  contact3Name: '', contact3Phone: '', contact3Rel: '',
};

const INSURANCE_SCHEMES = [
  'NHIS (National Health Insurance Scheme)',
  'LASHMA (Lagos State)',
  'ABSHIA (FCT / Abuja)',
  'EKSHIA (Ekiti State)',
  'RSHIA (Rivers State)',
  'OSSHIA (Osun State)',
  'KSHIA (Kano State)',
  'Hygeia HMO',
  'AXA Mansard Health',
  'Total Health Trust',
  'Redcare HMO',
  'Leadway Health',
  'Clearline HMO',
  'None / Self-pay',
];

const DISEASES = [
  { id: 'Sickle Cell Crisis',       icon: '🩸', desc: 'Pain crisis, fever, chest syndrome' },
  { id: 'Diabetes / Blood Sugar',   icon: '🍬', desc: 'Low or high blood sugar episode' },
  { id: 'Hypertension / High BP',   icon: '💓', desc: 'Elevated BP, headache, dizziness' },
  { id: 'Malaria',                  icon: '🦟', desc: 'Fever, chills, weakness, vomiting' },
  { id: 'Asthma Attack',            icon: '💨', desc: 'Shortness of breath, wheezing' },
  { id: 'Typhoid Fever',            icon: '🤒', desc: 'Prolonged fever, stomach pain' },
  { id: 'Chest Pain',               icon: '🫀', desc: 'Tightness, pressure, crushing pain' },
  { id: 'Stroke Warning Signs',     icon: '🧠', desc: 'Face drooping, arm weakness, speech' },
  { id: 'Seizure / Epilepsy',       icon: '⚡', desc: 'Convulsions, loss of consciousness' },
  { id: 'Peptic Ulcer / Gastric',   icon: '🫃', desc: 'Stomach burning, vomiting, pain' },
];

const SEVERITY_CONFIG = {
  MILD:     { color: '#22c55e', bg: '#071a07', border: '#0e3a0e', label: 'MILD',     emoji: '🟢' },
  MODERATE: { color: '#eab308', bg: '#1a1500', border: '#3a2f00', label: 'MODERATE', emoji: '🟡' },
  SEVERE:   { color: '#f97316', bg: '#1a0800', border: '#3a1500', label: 'SEVERE',   emoji: '🟠' },
  CRITICAL: { color: '#ef4444', bg: '#1a0000', border: '#3a0000', label: 'CRITICAL', emoji: '🔴' },
};

export default function App() {
  const [step, setStep]             = useState('home');
  const [profileTab, setProfileTab] = useState('personal');
  const [profile, setProfile]       = useState(EMPTY_PROFILE);
  const [response, setResponse]     = useState(null);
  const [history, setHistory]       = useState([]);

  // Emergency form state
  const [form, setForm] = useState({
    patientName: '', age: '', condition: '', city: 'Lagos', symptoms: '', contactPhone: '',
  });

  // Hale AI state
  const [haleDisease,  setHaleDisease]  = useState('');
  const [haleSymptoms, setHaleSymptoms] = useState('');
  const [haleDuration, setHaleDuration] = useState('');
  const [haleScore,    setHaleScore]    = useState(5);
  const [haleResult,   setHaleResult]   = useState(null);
  const [checklistIdx, setChecklistIdx] = useState(0);

  // Toast notification
  const [toast, setToast] = useState(null); // { type: 'warn'|'error'|'ok', msg }
  const showToast = (msg, type = 'warn') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const p = localStorage.getItem('crisisagent_profile');
    if (p) setProfile(JSON.parse(p));
    const h = localStorage.getItem('crisisagent_history');
    if (h) setHistory(JSON.parse(h));
  }, []);

  const saveProfile = () => {
    localStorage.setItem('crisisagent_profile', JSON.stringify(profile));
    setStep('home');
  };

  const onProfile = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const onChange  = (e) => setForm({ ...form,   [e.target.name]: e.target.value });

  const goToForm = (prefillCondition = '') => {
    setForm({
      patientName:  profile.fullName   || '',
      age:          profile.age        || '',
      condition:    prefillCondition || profile.conditions || '',
      city:         'Lagos',
      symptoms:     '',
      contactPhone: profile.contact1Phone || '',
    });
    setStep('form');
  };

  const submitEmergency = async () => {
    if (!form.symptoms.trim()) { showToast('Please describe the symptoms before continuing.'); return; }
    setStep('loading');
    try {
      const { data } = await axios.post(`${API}/emergency`, { ...form, profile });
      const result = data.data;
      setResponse(result);
      const entry = {
        id: Date.now(), type: 'emergency', timestamp: result.timestamp,
        city: form.city, symptoms: form.symptoms.slice(0, 80),
        condition: form.condition, patient: form.patientName,
      };
      const newH = [entry, ...history].slice(0, 20);
      setHistory(newH);
      localStorage.setItem('crisisagent_history', JSON.stringify(newH));
      setStep('response');
    } catch {
      showToast('Connection error. Make sure the backend is running on port 3001.', 'error');
      setStep('form');
    }
  };

  const submitHale = async () => {
    if (!haleSymptoms.trim()) { showToast('Please describe your symptoms so Hale AI can assess you.'); return; }
    setStep('hale-loading');
    try {
      const { data } = await axios.post(`${API}/hale`, {
        disease: haleDisease,
        symptoms: haleSymptoms,
        duration: haleDuration,
        severityScore: haleScore,
        profile,
      });
      const result = data.data;
      setHaleResult(result);

      const entry = {
        id: Date.now(),
        type: 'hale',
        timestamp: new Date().toISOString(),
        disease: haleDisease,
        severity: result.severity,
        symptoms: haleSymptoms.slice(0, 80),
        patient: profile.fullName || '',
      };
      const newH = [entry, ...history].slice(0, 20);
      setHistory(newH);
      localStorage.setItem('crisisagent_history', JSON.stringify(newH));

      setStep('hale-result');
    } catch {
      showToast('Connection error. Make sure the backend is running on port 3001.', 'error');
      setStep('hale-form');
    }
  };

  const contacts = [
    { name: profile.contact1Name, phone: profile.contact1Phone, rel: profile.contact1Rel },
    { name: profile.contact2Name, phone: profile.contact2Phone, rel: profile.contact2Rel },
    { name: profile.contact3Name, phone: profile.contact3Phone, rel: profile.contact3Rel },
  ].filter(c => c.name && c.phone);

  const toastEl = toast && (
    <div className={`toast toast-${toast.type}`} role="alert" onClick={() => setToast(null)}>
      <span className="toast-icon">
        {toast.type === 'error' ? '⚠️' : toast.type === 'ok' ? '✅' : '💬'}
      </span>
      <span className="toast-msg">{toast.msg}</span>
      <span className="toast-close">✕</span>
    </div>
  );

  /* ══════════════════ HOME ══════════════════ */
  if (step === 'home') return (
    <div className="page">
      <div className="home">
        <div className="glow-wrap">
          <div className="pulse-ring"><div className="logo-box">🚨</div></div>
        </div>

        <div className="brand">
          <h1>Crisis<span>Agent</span></h1>
          <p>AI Emergency Medical Coordinator · Nigeria</p>
        </div>

        <div className="stats">
          <div className="stat"><span className="stat-val">4</span><span className="stat-lbl">Cities</span></div>
          <div className="stat"><span className="stat-val">24/7</span><span className="stat-lbl">Available</span></div>
          <div className="stat"><span className="stat-val">AI</span><span className="stat-lbl">Powered</span></div>
        </div>

        <button className="cta-btn" onClick={() => goToForm()}>🚨 &nbsp; Trigger Emergency</button>

        {/* Hale AI CTA */}
        <button className="hale-btn" onClick={() => setStep('hale-select')}>
          <span className="hale-btn-icon">💚</span>
          <div className="hale-btn-text">
            <span className="hale-btn-title">Hale AI — Health Guide</span>
            <span className="hale-btn-sub">Step-by-step guidance for your condition</span>
          </div>
          <span className="hale-btn-arrow">→</span>
        </button>

        <button className="secondary-btn" onClick={() => setStep('profile')}>
          👤 &nbsp; {profile.fullName ? `Edit Profile — ${profile.fullName}` : 'Set Up My Profile & Insurance'}
        </button>

        <button className="secondary-btn" onClick={() => setStep('history')}>
          📋 &nbsp; Crisis History {history.length > 0 && `(${history.length})`}
        </button>

        <div className="city-pills">
          {['Lagos', 'Abuja', 'Ibadan', 'Osun'].map(c => (
            <span key={c} className="pill">{c}</span>
          ))}
        </div>

        <p className="disclaimer">
          ⚕️ CrisisAgent & Hale AI provide guidance only and are <strong>not a substitute for professional medical advice</strong>. In a life-threatening emergency, call your local ambulance or go to the nearest hospital immediately.
        </p>
      </div>
    </div>
  );

  /* ══════════════════ HALE — SELECT DISEASE ══════════════════ */
  if (step === 'hale-select') return (
    <div className="page">
      <div className="screen">
        <div className="nav">
          <button className="back-btn" onClick={() => setStep('home')}>←</button>
          <div className="nav-text">
            <h2 className="hale-green">Hale AI</h2>
            <p>Select your condition to begin</p>
          </div>
        </div>

        <div className="disease-grid">
          {DISEASES.map(d => (
            <button key={d.id} className="disease-card" onClick={() => {
              setHaleDisease(d.id);
              setHaleSymptoms('');
              setHaleDuration('');
              setHaleScore(5);
              setStep('hale-form');
            }}>
              <span className="disease-icon">{d.icon}</span>
              <span className="disease-name">{d.id}</span>
              <span className="disease-desc">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ══════════════════ HALE — SYMPTOM FORM ══════════════════ */
  if (step === 'hale-form') {
    const dis = DISEASES.find(d => d.id === haleDisease) || {};
    return (
      <div className="page">
        <div className="screen">
          <div className="nav">
            <button className="back-btn" onClick={() => setStep('hale-select')}>←</button>
            <div className="nav-text">
              <h2 className="hale-green">{dis.icon} {haleDisease}</h2>
              <p>Describe what is happening right now</p>
            </div>
          </div>

          <div className="fields">
            <div className="field">
              <label>Current Symptoms *</label>
              <textarea
                placeholder={`Describe everything you're feeling right now in detail...`}
                value={haleSymptoms}
                onChange={e => setHaleSymptoms(e.target.value)}
                rows={4}
              />
            </div>

            <div className="field">
              <label>How long has this been going on?</label>
              <select value={haleDuration} onChange={e => setHaleDuration(e.target.value)}>
                <option value="">Select duration</option>
                <option>Less than 1 hour</option>
                <option>1–6 hours</option>
                <option>6–24 hours</option>
                <option>1–3 days</option>
                <option>3–7 days</option>
                <option>More than 1 week</option>
              </select>
            </div>

            <div className="field">
              <label>How severe does it feel? (1 = barely noticeable, 10 = worst ever)</label>
              <div className="severity-slider-wrap">
                <input
                  type="range" min={1} max={10} value={haleScore}
                  onChange={e => setHaleScore(Number(e.target.value))}
                  className="severity-slider"
                />
                <div className="severity-slider-labels">
                  <span>1 Mild</span>
                  <span className="severity-score-val" style={{
                    color: haleScore <= 3 ? '#22c55e' : haleScore <= 6 ? '#eab308' : haleScore <= 8 ? '#f97316' : '#ef4444'
                  }}>{haleScore}/10</span>
                  <span>10 Critical</span>
                </div>
              </div>
            </div>

            {profile.fullName && (
              <div className="profile-bar">
                ✓ Profile loaded: <strong>{profile.fullName}</strong>
                {profile.bloodType && <> · Blood: <span className="red"><strong>{profile.bloodType}</strong></span></>}
                {profile.genotype  && <> · Genotype: <strong>{profile.genotype}</strong></>}
                {profile.allergies && <> · Allergies: <strong>{profile.allergies.slice(0, 30)}</strong></>}
              </div>
            )}
          </div>

          <button className="hale-submit-btn" onClick={submitHale}>
            💚 &nbsp; Analyse with Hale AI
          </button>
        </div>
        {toastEl}
      </div>
    );
  }

  /* ══════════════════ HALE — LOADING ══════════════════ */
  if (step === 'hale-loading') return (
    <div className="loading-screen">
      <div className="loading-icon hale-pulse">💚</div>
      <h2>Hale AI is Analysing</h2>
      <p className="hint">Matching your symptoms to evidence-based protocols</p>
      <div className="steps">
        <div className="step"><span className="step-dot green-dot" /><span>Identifying severity grade</span></div>
        <div className="step"><span className="step-dot green-dot" /><span>Applying {haleDisease} protocol</span></div>
        <div className="step"><span className="step-dot green-dot" /><span>Personalising to your medical profile</span></div>
      </div>
    </div>
  );

  /* ══════════════════ HALE — RESULT ══════════════════ */
  if (step === 'hale-result' && haleResult) {
    const sev = SEVERITY_CONFIG[haleResult.severity] || SEVERITY_CONFIG.MILD;
    const dis = DISEASES.find(d => d.id === haleDisease) || {};
    return (
      <div className="hale-result-page">

        {/* Header */}
        <div className="hale-result-header">
          <button className="back-btn" onClick={() => setStep('hale-select')}>←</button>
          <div className="hale-result-title">
            <span>{dis.icon} {haleDisease}</span>
            <span className="hale-powered">powered by Hale AI</span>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="severity-badge" style={{
          background: sev.bg,
          border: `2px solid ${sev.border}`,
          color: sev.color,
        }}>
          <span className="sev-emoji">{sev.emoji}</span>
          <div className="sev-info">
            <div className="sev-label" style={{ color: sev.color }}>{sev.label}</div>
            <div className="sev-reason">{haleResult.gradeReason}</div>
          </div>
          {haleResult.severity === 'CRITICAL' && <span className="sev-pulse-ring" style={{ borderColor: sev.color }} />}
        </div>

        {/* Next Step Banner */}
        <div className="next-step-banner" style={{ borderColor: sev.border, background: sev.bg }}>
          <span className="next-step-icon">→</span>
          <span className="next-step-text" style={{ color: sev.color }}>{haleResult.nextStep}</span>
        </div>

        <div className="hale-body">
          {/* LEFT — Steps + Medications */}
          <div className="hale-left">
            <div className="card">
              <div className="card-label">📋 Step-by-Step Protocol</div>
              <ol className="protocol-steps">
                {(haleResult.steps || []).map((s, i) => (
                  <li key={i} className="protocol-step">
                    <span className="step-num" style={{ background: sev.color }}>{i + 1}</span>
                    <span className="step-text">{s}</span>
                  </li>
                ))}
              </ol>
              {(haleResult.steps || []).length > 0 && (
                <button
                  className="checklist-start-btn"
                  style={{ background: sev.color }}
                  onClick={() => { setChecklistIdx(0); setStep('hale-checklist'); }}
                >
                  ✓ &nbsp; Proceed Step-by-Step
                </button>
              )}
            </div>

            {haleResult.medicationsNote && (
              <div className="card">
                <div className="card-label">💊 Medications Note</div>
                <p className="med-note">{haleResult.medicationsNote}</p>
              </div>
            )}
          </div>

          {/* RIGHT — Watch For + Escalate */}
          <div className="hale-right">
            <div className="card">
              <div className="card-label">⚠️ Warning Signs — Escalate If You See</div>
              <ul className="watch-list">
                {(haleResult.watchFor || []).map((w, i) => (
                  <li key={i} className="watch-item">
                    <span className="watch-dot">!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CrisisAgent Escalation */}
            {haleResult.escalate && (
              <div className="escalate-card">
                <div className="escalate-title">🚨 This needs emergency care</div>
                <div className="escalate-sub">Hale AI has flagged this as {haleResult.severity}. CrisisAgent will coordinate hospitals, ambulance and contacts.</div>
                <button className="cta-btn escalate-btn" onClick={() => goToForm(haleDisease)}>
                  🚨 &nbsp; Get Emergency Help Now
                </button>
              </div>
            )}

            {!haleResult.escalate && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💚</div>
                <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>Hale AI says: manageable at home</div>
                <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6 }}>Follow the steps above. If symptoms worsen or new warning signs appear, escalate immediately.</div>
                <button className="reset-btn" style={{ marginTop: 16 }} onClick={() => setStep('hale-select')}>
                  Check Another Condition
                </button>
              </div>
            )}

            <button className="secondary-btn" onClick={() => setStep('home')}>← Back to Home</button>
          </div>
        </div>

        <p className="disclaimer">
          ⚕️ Hale AI provides guidance based on standard care protocols and is <strong>not a substitute for professional medical advice</strong>. If you are unsure or symptoms worsen, seek care immediately.
        </p>
      </div>
    );
  }

  /* ══════════════════ HALE — CHECKLIST (one step at a time) ══════════════════ */
  if (step === 'hale-checklist' && haleResult) {
    const sev   = SEVERITY_CONFIG[haleResult.severity] || SEVERITY_CONFIG.MILD;
    const steps = haleResult.steps || [];
    const total = steps.length;
    const done  = checklistIdx >= total;
    const pct   = Math.round((Math.min(checklistIdx, total) / total) * 100);

    return (
      <div className="page">
        <div className="checklist-screen">

          {/* Progress header */}
          <div className="checklist-head">
            <button className="back-btn" onClick={() => setStep('hale-result')}>←</button>
            <div className="checklist-progress-wrap">
              <div className="checklist-progress-text">
                {done ? 'Complete' : `Step ${checklistIdx + 1} of ${total}`}
              </div>
              <div className="checklist-bar">
                <div className="checklist-bar-fill" style={{ width: `${pct}%`, background: sev.color }} />
              </div>
            </div>
          </div>

          {!done ? (
            <>
              <div className="checklist-body">
                <div className="checklist-num" style={{ borderColor: sev.color, color: sev.color }}>
                  {checklistIdx + 1}
                </div>
                <div className="checklist-step-text">{steps[checklistIdx]}</div>
              </div>

              <div className="checklist-actions">
                <button
                  className="checklist-next-btn"
                  style={{ background: sev.color }}
                  onClick={() => setChecklistIdx(checklistIdx + 1)}
                >
                  {checklistIdx + 1 === total ? '✓ Done — Finish' : '✓ Done — Next Step'}
                </button>
                {checklistIdx > 0 && (
                  <button className="checklist-prev-btn" onClick={() => setChecklistIdx(checklistIdx - 1)}>
                    ← Previous step
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="checklist-done">
              <div className="checklist-done-icon">✅</div>
              <h2>All steps complete</h2>
              <p className="checklist-done-sub">You've worked through every step for {haleDisease}.</p>

              {haleResult.watchFor && haleResult.watchFor.length > 0 && (
                <div className="card" style={{ textAlign: 'left', marginTop: 20 }}>
                  <div className="card-label">⚠️ Keep watching for</div>
                  <ul className="watch-list">
                    {haleResult.watchFor.map((w, i) => (
                      <li key={i} className="watch-item">
                        <span className="watch-dot">!</span><span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {haleResult.escalate ? (
                <button className="cta-btn" style={{ marginTop: 16 }} onClick={() => goToForm(haleDisease)}>
                  🚨 &nbsp; This still needs a hospital — Get Help
                </button>
              ) : (
                <button className="checklist-next-btn" style={{ background: sev.color, marginTop: 16 }} onClick={() => setStep('hale-select')}>
                  💚 &nbsp; Check Another Condition
                </button>
              )}
              <button className="secondary-btn" style={{ marginTop: 12 }} onClick={() => setStep('home')}>← Back to Home</button>
            </div>
          )}

          <p className="disclaimer">
            ⚕️ If symptoms worsen at any point, stop and seek medical help immediately.
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════════ PROFILE ══════════════════ */
  if (step === 'profile') return (
    <div className="page">
      <div className="screen">
        <div className="nav">
          <button className="back-btn" onClick={() => setStep('home')}>←</button>
          <div className="nav-text"><h2>My Profile</h2><p>Saved locally on your device</p></div>
        </div>
        <div className="tabs">
          {[['personal','👤 Personal'],['medical','💊 Medical'],['insurance','🏥 Insurance'],['contacts','📞 Contacts']].map(([id, label]) => (
            <button key={id} className={`tab ${profileTab === id ? 'active' : ''}`} onClick={() => setProfileTab(id)}>{label}</button>
          ))}
        </div>

        {profileTab === 'personal' && (
          <div className="fields">
            <div className="row">
              <div className="field"><label>Full Name</label><input name="fullName" placeholder="Taiwo Ifeoluwa" value={profile.fullName} onChange={onProfile} /></div>
              <div className="field"><label>Age</label><input name="age" placeholder="30" value={profile.age} onChange={onProfile} /></div>
            </div>
            <div className="row">
              <div className="field"><label>Gender</label>
                <select name="gender" value={profile.gender} onChange={onProfile}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="field"><label>Language</label>
                <select name="language" value={profile.language} onChange={onProfile}>
                  <option>English</option><option>Yoruba</option><option>Igbo</option><option>Hausa</option>
                </select>
              </div>
            </div>
            <div className="row">
              <div className="field"><label>Blood Type</label>
                <select name="bloodType" value={profile.bloodType} onChange={onProfile}>
                  <option value="">Unknown</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field"><label>Genotype</label>
                <select name="genotype" value={profile.genotype} onChange={onProfile}>
                  <option value="">Unknown</option>
                  {['AA','AS','SS','AC','SC'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Weight (kg)</label><input name="weight" placeholder="e.g. 65" value={profile.weight} onChange={onProfile} /></div>
          </div>
        )}

        {profileTab === 'medical' && (
          <div className="fields">
            <div className="field"><label>Chronic Conditions</label><textarea name="conditions" placeholder="e.g. Sickle Cell Disease, Diabetes..." value={profile.conditions} onChange={onProfile} rows={3} /></div>
            <div className="field"><label>Known Allergies</label><textarea name="allergies" placeholder="e.g. Penicillin, Aspirin, None..." value={profile.allergies} onChange={onProfile} rows={3} /></div>
            <div className="field"><label>Current Medications</label><textarea name="medications" placeholder="e.g. Hydroxyurea 500mg, Folic Acid 5mg..." value={profile.medications} onChange={onProfile} rows={3} /></div>
            <div className="info-note"><strong>Tip:</strong> Accurate medications help Hale AI flag drug interactions and give safer advice.</div>
          </div>
        )}

        {profileTab === 'insurance' && (
          <div className="fields">
            <div className="section-heading">Health Insurance / HMO</div>
            <div className="field"><label>Insurance Scheme</label>
              <select name="insuranceType" value={profile.insuranceType} onChange={onProfile}>
                <option value="">Select scheme...</option>
                {INSURANCE_SCHEMES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="row">
              <div className="field"><label>Insurance / NHIS Number</label><input name="insuranceNumber" placeholder="e.g. NHIS/0012345" value={profile.insuranceNumber} onChange={onProfile} /></div>
              <div className="field"><label>Policy Expiry</label><input name="policyExpiry" type="date" value={profile.policyExpiry} onChange={onProfile} /></div>
            </div>
            <div className="row">
              <div className="field"><label>HMO Provider</label><input name="hmoProvider" placeholder="e.g. Hygeia HMO" value={profile.hmoProvider} onChange={onProfile} /></div>
              <div className="field"><label>HMO Phone</label><input name="hmoPhone" placeholder="0800-HYGEIA" value={profile.hmoPhone} onChange={onProfile} /></div>
            </div>
            <div className="info-note"><strong>Nigerian schemes:</strong> NHIS · LASHMA · ABSHIA · OSSHIA · EKSHIA · RSHIA · KSHIA · Private HMOs</div>
          </div>
        )}

        {profileTab === 'contacts' && (
          <div className="fields">
            {[1,2,3].map(n => (
              <div key={n} className="contact-card">
                <div className="contact-number">Emergency Contact {n}</div>
                <div className="row">
                  <div className="field"><label>Full Name</label><input name={`contact${n}Name`} placeholder="Name" value={profile[`contact${n}Name`]} onChange={onProfile} /></div>
                  <div className="field"><label>Relationship</label><input name={`contact${n}Rel`} placeholder="e.g. Mother" value={profile[`contact${n}Rel`]} onChange={onProfile} /></div>
                </div>
                <div className="field"><label>Phone Number</label><input name={`contact${n}Phone`} placeholder="080xxxxxxxx" value={profile[`contact${n}Phone`]} onChange={onProfile} /></div>
              </div>
            ))}
          </div>
        )}
        <button className="save-btn" onClick={saveProfile}>💾 &nbsp; Save Profile</button>
      </div>
    </div>
  );

  /* ══════════════════ HISTORY ══════════════════ */
  if (step === 'history') return (
    <div className="page">
      <div className="screen">
        <div className="nav">
          <button className="back-btn" onClick={() => setStep('home')}>←</button>
          <div className="nav-text"><h2>Health History</h2><p>Past emergencies & Hale AI checks</p></div>
        </div>
        {history.length === 0 ? (
          <div className="history-empty">No records yet.</div>
        ) : (
          <div className="history-list">
            {history.map(h => {
              const isHale = h.type === 'hale';
              const sev = isHale ? (SEVERITY_CONFIG[h.severity] || SEVERITY_CONFIG.MILD) : null;
              return (
                <div key={h.id} className={`history-item ${isHale ? 'is-hale' : 'is-emergency'}`}>
                  <div className="history-top">
                    <span className={`history-tag ${isHale ? 'tag-hale' : 'tag-emergency'}`}>
                      {isHale ? '💚 Hale AI' : '🚨 Emergency'}
                    </span>
                    {isHale && (
                      <span className="history-sev" style={{ color: sev.color }}>
                        {sev.emoji} {h.severity}
                      </span>
                    )}
                    <span className="history-date">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="history-symptoms">{h.symptoms}{h.symptoms.length >= 80 ? '…' : ''}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4, flexWrap:'wrap' }}>
                    {h.patient && <span style={{ fontSize:11, color:'#555' }}>{h.patient}</span>}
                    {isHale ? (
                      <span className="history-city" style={{ color: sev.color }}>{h.disease}</span>
                    ) : (
                      <>
                        <span className="history-city">{h.city}</span>
                        {h.condition && <span style={{ fontSize:11, color:'#444' }}>{h.condition}</span>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {history.length > 0 && (
          <button className="reset-btn" style={{ marginTop:24 }} onClick={() => {
            if (window.confirm('Clear all history?')) {
              setHistory([]); localStorage.removeItem('crisisagent_history');
            }
          }}>Clear History</button>
        )}
      </div>
    </div>
  );

  /* ══════════════════ EMERGENCY FORM ══════════════════ */
  if (step === 'form') return (
    <div className="page">
      <div className="screen">
        <div className="nav">
          <button className="back-btn" onClick={() => setStep('home')}>←</button>
          <div className="nav-text"><h2>Emergency Details</h2><p>Fill fast — AI coordinates the rest</p></div>
        </div>
        <div className="fields">
          <div className="row">
            <div className="field"><label>Patient Name</label><input name="patientName" placeholder="Full name" value={form.patientName} onChange={onChange} /></div>
            <div className="field"><label>Age</label><input name="age" placeholder="Years" value={form.age} onChange={onChange} /></div>
          </div>
          <div className="row">
            <div className="field"><label>City</label>
              <select name="city" value={form.city} onChange={onChange}>
                <option>Lagos</option><option>Abuja</option><option>Ibadan</option><option>Osun</option>
              </select>
            </div>
            <div className="field"><label>Phone</label><input name="contactPhone" placeholder="080xxxxxxxx" value={form.contactPhone} onChange={onChange} /></div>
          </div>
          <div className="field"><label>Known Condition</label><input name="condition" placeholder="e.g. Sickle Cell, Diabetes, None" value={form.condition} onChange={onChange} /></div>
          <div className="field"><label>Current Symptoms *</label><textarea name="symptoms" placeholder="Describe exactly what is happening right now..." value={form.symptoms} onChange={onChange} rows={4} /></div>
          {profile.fullName && (
            <div className="profile-bar">
              ✓ Profile: <strong>{profile.fullName}</strong>
              {profile.bloodType && <> · Blood: <span className="red"><strong>{profile.bloodType}</strong></span></>}
              {profile.genotype  && <> · Genotype: <strong>{profile.genotype}</strong></>}
              {profile.insuranceType && profile.insuranceType !== 'None / Self-pay' && <> · <strong>{profile.insuranceType.split(' ')[0]}</strong></>}
            </div>
          )}
        </div>
        <button className="submit-btn" onClick={submitEmergency}>🚨 &nbsp; Get Help Now</button>
      </div>
      {toastEl}
    </div>
  );

  /* ══════════════════ LOADING ══════════════════ */
  if (step === 'loading') return (
    <div className="loading-screen">
      <div className="loading-icon">🚨</div>
      <h2>Coordinating Emergency</h2>
      <p className="hint">AI is finding the best care path for you</p>
      <div className="steps">
        <div className="step"><span className="step-dot" /><span>Finding nearest hospitals & specialists</span></div>
        <div className="step"><span className="step-dot" /><span>Preparing step-by-step care instructions</span></div>
        <div className="step"><span className="step-dot" /><span>Locating blood banks & emergency services</span></div>
      </div>
    </div>
  );

  /* ══════════════════ RESPONSE ══════════════════ */
  if (step === 'response' && response) return (
    <div className="response-page">
      <div className="res-banner">
        <div className="res-banner-left">
          <div className="res-icon">🚨</div>
          <div>
            <div className="res-title">Emergency Response Ready</div>
            <div className="res-time">{new Date(response.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
        <span className="live-badge">✓ LIVE</span>
      </div>

      {response.ambulance && (
        <div className="ambulance-strip">
          <div className="ambulance-info">
            <span className="ambulance-icon">🚑</span>
            <div>
              <div className="ambulance-label">Ambulance Service</div>
              <div className="ambulance-name">{response.ambulance.name}</div>
            </div>
          </div>
          <a href={`tel:${response.ambulance.number}`} className="ambulance-call">📞 {response.ambulance.number}</a>
        </div>
      )}

      <div className="res-body">
        <div className="res-left">
          <div className="card">
            <div className="card-label">📋 Instructions</div>
            <div className="instructions">
              {response.response.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        </div>
        <div className="res-right">
          <div className="card">
            <div className="card-label">🏥 Hospitals</div>
            <div className="hosp-list">
              {response.hospitals.map((h, i) => (
                <div key={i} className="hosp-card">
                  <div className="hosp-name">{h.name}</div>
                  <div className="hosp-area">{h.area}</div>
                  <div className="hosp-tags">
                    {h.nhis && <span className="hosp-tag nhis">NHIS</span>}
                    {h.ohis && <span className="hosp-tag ohis">OHIS</span>}
                    {h.specialty && h.specialty.includes('blood bank') && <span className="hosp-tag blood">Blood Bank</span>}
                  </div>
                  {h.deposit && <div className="hosp-deposit">Deposit est. {h.deposit}</div>}
                  <a href={`tel:${h.phone}`} className="call-btn">📞 {h.phone}</a>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-label">🩸 Blood Banks</div>
            {response.bloodBanks.map((b, i) => (
              <div key={i} className="blood-row">
                <div><div className="blood-name">{b.name}</div><div className="blood-area">{b.area}</div></div>
                <a href={`tel:${b.phone}`} className="call-btn">📞 {b.phone}</a>
              </div>
            ))}
          </div>

          {contacts.length > 0 && (
            <div className="card">
              <div className="card-label">🆘 Emergency Contacts</div>
              {response.alertStatus === 'sent' && (
                <div className="alert-status ok">✅ Alert SMS sent to your {contacts.length} contact{contacts.length > 1 ? 's' : ''}</div>
              )}
              {(response.alertStatus === 'queued' || response.alertStatus === 'failed') && (
                <div className="alert-status pending">📲 Auto-SMS pending setup — call your contacts directly below</div>
              )}
              <div className="sos-contacts">
                {contacts.map((c, i) => (
                  <div key={i} className="sos-contact">
                    <div><div className="sos-contact-name">{c.name}</div><div className="sos-contact-rel">{c.rel}</div></div>
                    <a href={`tel:${c.phone}`} className="sos-call">📞 Call</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.insuranceType && profile.insuranceType !== 'None / Self-pay' && (
            <div className="card">
              <div className="card-label">💳 Insurance</div>
              <div className="insurance-info">
                <div className="ins-row"><span className="ins-label">Scheme</span><span className="ins-value">{profile.insuranceType.split(' ')[0]}</span></div>
                {profile.insuranceNumber && <div className="ins-row"><span className="ins-label">ID</span><span className="ins-value">{profile.insuranceNumber}</span></div>}
                {profile.hmoProvider    && <div className="ins-row"><span className="ins-label">HMO</span><span className="ins-value">{profile.hmoProvider}</span></div>}
                {profile.policyExpiry   && <div className="ins-row"><span className="ins-label">Expires</span><span className="ins-value">{profile.policyExpiry}</span></div>}
                {profile.hmoPhone       && <a href={`tel:${profile.hmoPhone}`} className="call-btn" style={{ marginTop:8 }}>📞 Call HMO</a>}
              </div>
            </div>
          )}

          <button className="reset-btn" onClick={() => setStep('home')}>+ New Emergency</button>
        </div>
      </div>
    </div>
  );

  return null;
}
