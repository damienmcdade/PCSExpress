import { useState, useCallback, useEffect } from 'react'
import { secureLocalStore, readLegacyJson } from '../security/SecurityExtensions'

const store = {
  get: (k) => readLegacyJson(k, null),
  set: (k, v) => { secureLocalStore.set(k, v); },
};

const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇺🇸' },
  { code: 'de', name: 'German',     flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese',   flag: '🇯🇵' },
  { code: 'ko', name: 'Korean',     flag: '🇰🇷' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹' },
  { code: 'es', name: 'Spanish',    flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'fr', name: 'French',     flag: '🇫🇷' },
  { code: 'pl', name: 'Polish',     flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish',    flag: '🇹🇷' },
  { code: 'ar', name: 'Arabic',     flag: '🇸🇦' },
  { code: 'th', name: 'Thai',       flag: '🇹🇭' },
  { code: 'el', name: 'Greek',      flag: '🇬🇷' },
  { code: 'nl', name: 'Dutch',      flag: '🇳🇱' },
  { code: 'ro', name: 'Romanian',   flag: '🇷🇴' },
  { code: 'uk', name: 'Ukrainian',  flag: '🇺🇦' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'zh', name: 'Chinese',    flag: '🇨🇳' },
  { code: 'tl', name: 'Tagalog',    flag: '🇵🇭' },
  { code: 'fi', name: 'Finnish',    flag: '🇫🇮' },
  { code: 'no', name: 'Norwegian',  flag: '🇳🇴' },
  { code: 'da', name: 'Danish',     flag: '🇩🇰' },
  { code: 'hu', name: 'Hungarian',  flag: '🇭🇺' },
];

const PHRASE_CATEGORIES = [
  {
    id: 'emergency',
    label: 'Emergency & Safety',
    icon: '🚨',
    phrases: [
      { en: 'Call 911 / Emergency',          de: 'Notruf wählen', ja: '緊急連絡先に電話', ko: '응급 전화', it: 'Chiama il 112', es: 'Llamar al 112' },
      { en: 'I need a doctor',               de: 'Ich brauche einen Arzt', ja: '医者が必要です', ko: '의사가 필요합니다', it: 'Ho bisogno di un medico', es: 'Necesito un médico' },
      { en: 'Please help me',                de: 'Bitte helfen Sie mir', ja: '助けてください', ko: '도와주세요', it: 'Per favore aiutami', es: 'Por favor ayúdame' },
      { en: 'I am a US military member',     de: 'Ich bin US-Militärangehöriger', ja: '私は米軍の軍人です', ko: '저는 미군입니다', it: 'Sono un militare statunitense', es: 'Soy miembro del ejército de EE.UU.' },
      { en: 'Where is the hospital?',        de: 'Wo ist das Krankenhaus?', ja: '病院はどこですか?', ko: '병원이 어디에 있나요?', it: "Dov'è l'ospedale?", es: '¿Dónde está el hospital?' },
      { en: 'I am allergic to...',           de: 'Ich bin allergisch gegen...', ja: '私は...にアレルギーがあります', ko: '저는 ...에 알레르기가 있습니다', it: 'Sono allergico a...', es: 'Soy alérgico a...' },
    ],
  },
  {
    id: 'housing',
    label: 'Housing & Landlord',
    icon: '🏠',
    phrases: [
      { en: 'I need to rent an apartment',   de: 'Ich muss eine Wohnung mieten', ja: 'アパートを借りたいです', ko: '아파트를 빌리고 싶습니다', it: 'Ho bisogno di affittare un appartamento', es: 'Necesito alquilar un apartamento' },
      { en: 'How much is the rent?',         de: 'Wie hoch ist die Miete?', ja: '家賃はいくらですか?', ko: '임대료는 얼마입니까?', it: "Quanto è l'affitto?", es: '¿Cuánto es el alquiler?' },
      { en: 'I have military orders',        de: 'Ich habe militärische Befehle', ja: '私は軍の命令があります', ko: '군 명령서가 있습니다', it: 'Ho ordini militari', es: 'Tengo órdenes militares' },
      { en: 'When can I move in?',           de: 'Wann kann ich einziehen?', ja: 'いつ入居できますか?', ko: '언제 이사할 수 있나요?', it: 'Quando posso trasferirmi?', es: '¿Cuándo puedo mudarme?' },
      { en: 'The heating is broken',         de: 'Die Heizung ist kaputt', ja: '暖房が壊れています', ko: '난방이 고장났습니다', it: 'Il riscaldamento è rotto', es: 'La calefacción está rota' },
      { en: 'Please repair this',            de: 'Bitte reparieren Sie das', ja: 'これを修理してください', ko: '이것을 수리해 주세요', it: 'Per favore riparalo', es: 'Por favor repare esto' },
    ],
  },
  {
    id: 'shopping',
    label: 'Shopping & Daily Life',
    icon: '🛒',
    phrases: [
      { en: 'How much does this cost?',      de: 'Wie viel kostet das?', ja: 'これはいくらですか?', ko: '이것은 얼마입니까?', it: 'Quanto costa questo?', es: '¿Cuánto cuesta esto?' },
      { en: 'Do you accept credit cards?',   de: 'Akzeptieren Sie Kreditkarten?', ja: 'クレジットカードは使えますか?', ko: '신용카드를 받습니까?', it: 'Accettate carte di credito?', es: '¿Aceptan tarjetas de crédito?' },
      { en: 'Where is the grocery store?',   de: 'Wo ist der Lebensmittelladen?', ja: 'スーパーマーケットはどこですか?', ko: '식료품점이 어디에 있나요?', it: 'Dov\'è il negozio di alimentari?', es: '¿Dónde está la tienda de comestibles?' },
      { en: 'Do you have this in a different size?', de: 'Haben Sie das in einer anderen Größe?', ja: '別のサイズはありますか?', ko: '다른 사이즈 있나요?', it: 'Ce l\'avete in una taglia diversa?', es: '¿Tiene esto en una talla diferente?' },
      { en: 'Where is the post office?',     de: 'Wo ist die Post?', ja: '郵便局はどこですか?', ko: '우체국이 어디에 있나요?', it: "Dov'è l'ufficio postale?", es: '¿Dónde está la oficina de correos?' },
    ],
  },
  {
    id: 'medical',
    label: 'Medical & Pharmacy',
    icon: '🏥',
    phrases: [
      { en: 'I need my prescription filled',     de: 'Ich brauche mein Rezept', ja: '処方箋を出してください', ko: '처방전을 받아야 합니다', it: 'Ho bisogno della mia prescrizione', es: 'Necesito mi receta' },
      { en: 'I have a fever',                    de: 'Ich habe Fieber', ja: '熱があります', ko: '열이 있습니다', it: 'Ho la febbre', es: 'Tengo fiebre' },
      { en: 'My child is sick',                  de: 'Mein Kind ist krank', ja: '子供が病気です', ko: '아이가 아픕니다', it: 'Mio figlio è malato', es: 'Mi hijo está enfermo' },
      { en: 'I am on military TRICARE insurance', de: 'Ich habe TRICARE-Militärversicherung', ja: '私は軍のTRICARE保険に加入しています', ko: '군 TRICARE 보험이 있습니다', it: 'Ho l\'assicurazione militare TRICARE', es: 'Tengo seguro militar TRICARE' },
      { en: 'Where is the pharmacy?',            de: 'Wo ist die Apotheke?', ja: '薬局はどこですか?', ko: '약국이 어디에 있나요?', it: "Dov'è la farmacia?", es: '¿Dónde está la farmacia?' },
      { en: 'I need an interpreter',             de: 'Ich brauche einen Dolmetscher', ja: '通訳が必要です', ko: '통역이 필요합니다', it: 'Ho bisogno di un interprete', es: 'Necesito un intérprete' },
    ],
  },
  {
    id: 'school',
    label: 'School & Childcare',
    icon: '🎓',
    phrases: [
      { en: 'I need to enroll my child',     de: 'Ich muss mein Kind anmelden', ja: '子供を入学させたいです', ko: '아이를 등록해야 합니다', it: 'Devo iscrivere mio figlio', es: 'Necesito inscribir a mi hijo' },
      { en: 'Do you have English instruction?', de: 'Gibt es Englischunterricht?', ja: '英語の授業はありますか?', ko: '영어 수업이 있나요?', it: "C'è l'insegnamento in inglese?", es: '¿Tienen instrucción en inglés?' },
      { en: 'My child has an IEP',           de: 'Mein Kind hat einen Förderplan', ja: '子供には個別教育計画があります', ko: '아이에게 IEP가 있습니다', it: 'Mio figlio ha un PEI', es: 'Mi hijo tiene un IEP' },
      { en: 'What time does school start?',  de: 'Wann beginnt die Schule?', ja: '学校は何時に始まりますか?', ko: '학교는 몇 시에 시작하나요?', it: 'A che ora inizia la scuola?', es: '¿A qué hora empieza la escuela?' },
      { en: 'Where can I find childcare?',   de: 'Wo finde ich Kinderbetreuung?', ja: '保育所はどこにありますか?', ko: '탁아소는 어디에 있나요?', it: "Dove posso trovare l'asilo nido?", es: '¿Dónde puedo encontrar guardería?' },
    ],
  },
  {
    id: 'transport',
    label: 'Transportation',
    icon: '🚗',
    phrases: [
      { en: 'How do I get to the base?',     de: 'Wie komme ich zur Basis?', ja: '基地へはどうやって行けますか?', ko: '기지에 어떻게 가나요?', it: 'Come arrivo alla base?', es: '¿Cómo llego a la base?' },
      { en: 'I need a taxi',                 de: 'Ich brauche ein Taxi', ja: 'タクシーが必要です', ko: '택시가 필요합니다', it: 'Ho bisogno di un taxi', es: 'Necesito un taxi' },
      { en: 'Where is the bus stop?',        de: 'Wo ist die Bushaltestelle?', ja: 'バス停はどこですか?', ko: '버스 정류장이 어디에 있나요?', it: "Dov'è la fermata dell'autobus?", es: '¿Dónde está la parada del autobús?' },
      { en: 'Is this the right train?',      de: 'Ist das der richtige Zug?', ja: 'これは正しい電車ですか?', ko: '이게 맞는 기차입니까?', it: 'È il treno giusto?', es: '¿Es este el tren correcto?' },
      { en: 'How long is the drive?',        de: 'Wie lange ist die Fahrt?', ja: '運転時間はどのくらいですか?', ko: '운전 시간이 얼마나 걸리나요?', it: 'Quanto dura il viaggio in auto?', es: '¿Cuánto dura el viaje en coche?' },
    ],
  },
];

async function callAI(system, user) {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.text || '';
  } catch {
    return null;
  }
}

export default function TranslationModule({ theme, profile }) {
  const [subTab, setSubTab] = useState('phrases');
  const [inputText, setInputText] = useState('');
  const selectedProfileLanguage = LANGUAGES.some(l => l.code === profile?.language) && profile?.language !== 'en' ? profile.language : 'es';
  const [targetLang, setTargetLang] = useState(selectedProfileLanguage);
  useEffect(() => {
    if (profile?.language && profile.language !== 'en' && LANGUAGES.some(l => l.code === profile.language)) {
      setTargetLang(profile.language);
    }
  }, [profile?.language]);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [phraseCategory, setPhraseCategory] = useState('emergency');
  const [saved, setSaved] = useState(() => store.get('translations_saved') || []);

  useEffect(() => {
    secureLocalStore.get('translations_saved', null).then(savedItems => {
      if (Array.isArray(savedItems)) setSaved(savedItems);
    });
  }, []);

  const selectedLang = LANGUAGES.find(l => l.code === targetLang) || LANGUAGES[0];
  const isOconus = profile?.isOverseas;

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult('');
    const aiResult = await callAI(
      `You are a military translation assistant. Translate the following text from English to ${selectedLang.name}. Respond with ONLY the translated text — no explanations, no labels, no quotation marks.`,
      inputText.trim()
    );
    if (aiResult) {
      setResult(aiResult);
      const entry = { id: Date.now(), original: inputText.trim(), translated: aiResult, lang: selectedLang.name, flag: selectedLang.flag, ts: new Date().toLocaleString() };
      const next = [entry, ...saved].slice(0, 50);
      setSaved(next);
      store.set('translations_saved', next);
    } else {
      setResult('Translation service unavailable. Check your connection and try again.');
    }
    setLoading(false);
  }, [inputText, selectedLang, saved]);

  const SUB_TABS = [
    { id: 'phrases',   label: 'Common Phrases', icon: '💬' },
    { id: 'saved',     label: `Saved (${saved.length})`, icon: '💾' },
    { id: 'translate', label: 'Translate', icon: '🌐' },
  ];

  const currentPhrases = PHRASE_CATEGORIES.find(c => c.id === phraseCategory);

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>Military Translation Assistant</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
          {isOconus ? '📍 OCONUS Assignment — AI-powered translation + common military phrases in 20 languages.' : 'AI-powered translation and essential military phrases for every assignment.'}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{ flex: 1, padding: '8px 4px', borderRadius: 20, border: `1.5px solid ${subTab === t.id ? theme.primary : '#E0E6EE'}`, background: subTab === t.id ? theme.primary : '#FFF', color: subTab === t.id ? '#FFF' : '#56697C', fontSize: 10, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Translate Tab ── */}
      {subTab === 'translate' && (
        <div>
          {/* Language selector */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C', marginBottom: 6 }}>TRANSLATE TO</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => setTargetLang(l.code)} style={{ padding: '5px 10px', borderRadius: 16, border: `1.5px solid ${targetLang === l.code ? theme.primary : '#E0E6EE'}`, background: targetLang === l.code ? theme.primary : '#FFF', color: targetLang === l.code ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: targetLang === l.code ? 700 : 500, whiteSpace: 'nowrap' }}>
                  {l.flag} {l.name}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C', marginBottom: 6 }}>ENGLISH TEXT</div>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Enter English text to translate to ${selectedLang.name}...`}
              style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 10, border: '1.5px solid #E0E6EE', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button onClick={handleTranslate} disabled={loading || !inputText.trim()} style={{ width: '100%', padding: '13px', borderRadius: 12, background: loading || !inputText.trim() ? '#B0BEC5' : theme.primary, color: '#FFF', border: 'none', fontWeight: 800, fontSize: 14, cursor: loading || !inputText.trim() ? 'not-allowed' : 'pointer', marginBottom: 16 }}>
            {loading ? 'Translating…' : `Translate to ${selectedLang.flag} ${selectedLang.name}`}
          </button>

          {result && (
            <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C' }}>TRANSLATION — {selectedLang.flag} {selectedLang.name.toUpperCase()}</div>
                <button onClick={() => { try { navigator.clipboard.writeText(result); } catch {} }} style={{ padding: '4px 10px', borderRadius: 8, background: `${theme.primary}15`, border: `1px solid ${theme.primary}30`, color: theme.primary, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>Copy</button>
              </div>
              <div style={{ fontSize: 15, color: '#0D1821', lineHeight: 1.6, fontWeight: 500 }}>{result}</div>
            </div>
          )}

          <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 10, color: '#E65100', lineHeight: 1.5 }}>For critical legal, medical, or official communications, always use a qualified human interpreter. Contact your installation legal assistance office or Military OneSource (1-800-342-9647) for interpreter referrals.</div>
          </div>
        </div>
      )}

      {/* ── Common Phrases Tab ── */}
      {subTab === 'phrases' && (
        <div>
          {/* Category selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {PHRASE_CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setPhraseCategory(c.id)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${phraseCategory === c.id ? theme.primary : '#E0E6EE'}`, background: phraseCategory === c.id ? theme.primary : '#FFF', color: phraseCategory === c.id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {/* Language columns header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {LANGUAGES.slice(0, 5).map(l => (
              <span key={l.code} style={{ fontSize: 9, fontWeight: 700, color: '#56697C', background: '#F0F4F8', padding: '2px 6px', borderRadius: 6 }}>{l.flag} {l.name}</span>
            ))}
          </div>

          {currentPhrases && currentPhrases.phrases.map((p, i) => (
            <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>🇺🇸 {p.en}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {LANGUAGES.filter(l => p[l.code]).map(l => (
                  <div key={l.code} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{l.flag}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#56697C', marginRight: 6 }}>{l.name}:</span>
                      <span style={{ fontSize: 12, color: '#0D1821', fontWeight: 500 }}>{p[l.code]}</span>
                    </div>
                    <button onClick={() => { try { navigator.clipboard.writeText(p[l.code]); } catch {} }} style={{ padding: '2px 8px', borderRadius: 6, background: `${theme.primary}12`, border: 'none', color: theme.primary, fontSize: 9, cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>Copy</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Saved Tab ── */}
      {subTab === 'saved' && (
        <div>
          {saved.length === 0 ? (
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💾</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>No Saved Translations</div>
              <div style={{ fontSize: 11, color: '#56697C' }}>Translations you make in the Translate tab are saved here automatically.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821' }}>{saved.length} saved translation{saved.length !== 1 ? 's' : ''}</div>
                <button onClick={() => { setSaved([]); store.set('translations_saved', []); }} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.2)', color: '#C62828', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>Clear All</button>
              </div>
              {saved.map(t => (
                <div key={t.id} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#56697C' }}>{t.ts}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: theme.primary }}>{t.flag} {t.lang}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#56697C', marginBottom: 4 }}>🇺🇸 {t.original}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1821' }}>{t.translated}</div>
                  <button onClick={() => { try { navigator.clipboard.writeText(t.translated); } catch {} }} style={{ marginTop: 8, padding: '4px 12px', borderRadius: 8, background: `${theme.primary}12`, border: 'none', color: theme.primary, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>Copy Translation</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
