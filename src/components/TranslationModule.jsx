import { useState } from 'react'

function TranslationModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('text')
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [savedTranslations, setSavedTranslations] = useState([])

  // Mock translation engine
  const translateText = (text) => {
    // In production, use Google Translate API or similar
    const translations = {
      'hola': 'hello',
      'gracias': 'thank you',
      'ayuda': 'help',
      'agua': 'water',
      'comida': 'food',
      'baño': 'bathroom',
      'hospital': 'hospital',
      'emergencia': 'emergency',
    };

    let result = text.toLowerCase();
    Object.entries(translations).forEach(([es, en]) => {
      result = result.replace(new RegExp(es, 'gi'), `[${en}]`);
    });

    return result || 'Translation not available - Use a professional translator for critical communications';
  };

  const handleTranslateText = () => {
    if (!inputText.trim()) {
      alert('Please enter text to translate');
      return;
    }

    const translated = translateText(inputText);
    setTranslatedText(translated);

    const newTranslation = {
      id: Date.now(),
      original: inputText,
      translated: translated,
      timestamp: new Date().toLocaleString(),
      type: 'text',
    };

    setSavedTranslations([newTranslation, ...savedTranslations]);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
        // Mock OCR - in production use Google Vision API or similar
        const mockExtracted = 'Hola, ¿cómo estás?'; // Pretend we extracted this from image
        const translated = translateText(mockExtracted);
        
        setTranslatedText(translated);
        const newTranslation = {
          id: Date.now(),
          original: mockExtracted,
          translated: translated,
          timestamp: new Date().toLocaleString(),
          type: 'photo',
          image: event.target.result,
        };

        setSavedTranslations([newTranslation, ...savedTranslations]);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile?.isOverseas) {
    return null; // Only show for OCONUS assignments
  }

  return (
    <div className="tab-content">
      <h2 style={{ color: theme.primary }}>🌐 Translation Service (OCONUS)</h2>

      <div style={{ background: `${theme.primary}15`, border: `1px solid ${theme.primary}`, borderRadius: 12, padding: '12px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.primary }}>
          📍 Overseas Assignment Detected
        </div>
        <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>
          Use this translation tool to communicate in the local language. Save translations for reference.
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'text', label: 'Text', icon: '📝' },
          { id: 'photo', label: 'Photo', icon: '📷' },
          { id: 'saved', label: 'Saved', icon: '💾' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`,
              background: activeTab === t.id ? theme.primary : '#FFFFFF',
              color: activeTab === t.id ? '#FFFFFF' : '#56697C',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: activeTab === t.id ? 800 : 500,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TEXT TRANSLATION */}
      {activeTab === 'text' && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 6 }}>
            ENTER TEXT TO TRANSLATE
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text in local language..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #E0E6EE',
              marginBottom: 12,
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleTranslateText}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: theme.primary,
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            Translate
          </button>

          {translatedText && (
            <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C', marginBottom: 8 }}>TRANSLATION</div>
              <div style={{
                background: '#F5F5F5',
                padding: '12px',
                borderRadius: 8,
                fontSize: 12,
                color: '#34495E',
                lineHeight: 1.6,
              }}>
                {translatedText}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(translatedText)}
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: '8px',
                  borderRadius: 6,
                  background: '#4CAF50',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHOTO TRANSLATION */}
      {activeTab === 'photo' && (
        <div>
          <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 12 }}>
              TAKE OR UPLOAD PHOTO
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                marginBottom: 12,
                cursor: 'pointer',
              }}
            />

            {photoPreview && (
              <>
                <div style={{
                  background: '#F5F5F5',
                  borderRadius: 8,
                  padding: '8px',
                  marginBottom: 12,
                  textAlign: 'center',
                }}>
                  <img
                    src={photoPreview}
                    alt="Uploaded"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 6 }}
                  />
                </div>
                {translatedText && (
                  <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 8, padding: '12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1B5E20', marginBottom: 8 }}>EXTRACTED & TRANSLATED</div>
                    <div style={{ fontSize: 12, color: '#2E7D32', lineHeight: 1.6 }}>{translatedText}</div>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', borderRadius: 8, padding: '12px', fontSize: 10, color: '#E65100' }}>
            💡 Tip: For accuracy with critical information, use a professional translator
          </div>
        </div>
      )}

      {/* SAVED TRANSLATIONS */}
      {activeTab === 'saved' && (
        <div>
          {savedTranslations.length > 0 ? (
            savedTranslations.map((trans) => (
              <div
                key={trans.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid #E0E6EE`,
                  borderLeft: `3px solid ${theme.accent}`,
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 10, color: '#56697C', marginBottom: 6 }}>{trans.timestamp}</div>
                <div style={{ fontSize: 11, color: '#34495E', marginBottom: 6 }}>
                  <strong>Original:</strong> {trans.original}
                </div>
                <div style={{ fontSize: 11, color: '#2E7D32', marginBottom: 8 }}>
                  <strong>Translation:</strong> {trans.translated}
                </div>
                {trans.image && (
                  <img src={trans.image} alt="Saved" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: 4, marginBottom: 8 }} />
                )}
              </div>
            ))
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No Saved Translations</div>
              <div style={{ fontSize: 11 }}>Translate text or photos to save them</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TranslationModule;
