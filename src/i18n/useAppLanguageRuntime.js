/*
 * Purpose: App-wide preferred-language runtime for visible PCS Express navigation and control text.
 * Third-party dependencies: React only.
 */

import { useEffect } from 'react';

const RTL_LANGS = new Set(['ar']);
const SUPPORTED = new Set(['en', 'es', 'de', 'fr', 'ko', 'ja', 'tl', 'ar', 'zh', 'it', 'pt', 'vi']);

const PHRASES = {
  'PCS Express': { es: 'PCS Express', de: 'PCS Express', fr: 'PCS Express', ko: 'PCS Express', ja: 'PCS Express', tl: 'PCS Express', ar: 'PCS Express', zh: 'PCS Express', it: 'PCS Express', pt: 'PCS Express', vi: 'PCS Express' },
  'Home': { es: 'Inicio', de: 'Start', fr: 'Accueil', ko: '홈', ja: 'ホーム', tl: 'Home', ar: 'الرئيسية', zh: '首页', it: 'Home', pt: 'Início', vi: 'Trang chủ' },
  'More': { es: 'Más', de: 'Mehr', fr: 'Plus', ko: '더 보기', ja: 'その他', tl: 'Higit pa', ar: 'المزيد', zh: '更多', it: 'Altro', pt: 'Mais', vi: 'Thêm' },
  'Checklist': { es: 'Lista', de: 'Checkliste', fr: 'Liste', ko: '체크리스트', ja: 'チェックリスト', tl: 'Checklist', ar: 'قائمة التحقق', zh: '清单', it: 'Checklist', pt: 'Checklist', vi: 'Danh sách' },
  'Documents': { es: 'Documentos', de: 'Dokumente', fr: 'Documents', ko: '문서', ja: '書類', tl: 'Dokumento', ar: 'المستندات', zh: '文件', it: 'Documenti', pt: 'Documentos', vi: 'Tài liệu' },
  'Education': { es: 'Educación', de: 'Bildung', fr: 'Éducation', ko: '교육', ja: '教育', tl: 'Edukasyon', ar: 'التعليم', zh: '教育', it: 'Istruzione', pt: 'Educação', vi: 'Giáo dục' },
  'Family Readiness': { es: 'Preparación familiar', de: 'Familienbereitschaft', fr: 'Préparation familiale', ko: '가족 준비', ja: '家族準備', tl: 'Kahandaan ng Pamilya', ar: 'جاهزية العائلة', zh: '家庭准备', it: 'Prontezza familiare', pt: 'Prontidão familiar', vi: 'Sẵn sàng gia đình' },
  'Home Relocation': { es: 'Reubicación del hogar', de: 'Wohnungssuche', fr: 'Relogement', ko: '주거 이전', ja: '住居移転', tl: 'Paglipat ng Tahanan', ar: 'السكن والانتقال', zh: '住房搬迁', it: 'Trasferimento casa', pt: 'Mudança residencial', vi: 'Nhà ở & chuyển nhà' },
  'Mental Readiness': { es: 'Preparación mental', de: 'Mentale Bereitschaft', fr: 'Préparation mentale', ko: '정신 준비', ja: 'メンタル準備', tl: 'Kahandaang Pangkaisipan', ar: 'الجاهزية النفسية', zh: '心理准备', it: 'Prontezza mentale', pt: 'Prontidão mental', vi: 'Sẵn sàng tinh thần' },
  'Navigation': { es: 'Navegación', de: 'Navigation', fr: 'Navigation', ko: '내비게이션', ja: 'ナビゲーション', tl: 'Pag-navigate', ar: 'الملاحة', zh: '导航', it: 'Navigazione', pt: 'Navegação', vi: 'Điều hướng' },
  'Resources': { es: 'Recursos', de: 'Ressourcen', fr: 'Ressources', ko: '자료', ja: 'リソース', tl: 'Mga Resource', ar: 'الموارد', zh: '资源', it: 'Risorse', pt: 'Recursos', vi: 'Tài nguyên' },
  'Spiritual Readiness': { es: 'Preparación espiritual', de: 'Spirituelle Bereitschaft', fr: 'Préparation spirituelle', ko: '영적 준비', ja: 'スピリチュアル準備', tl: 'Kahandaang Espirituwal', ar: 'الجاهزية الروحية', zh: '精神准备', it: 'Prontezza spirituale', pt: 'Prontidão espiritual', vi: 'Sẵn sàng tâm linh' },
  'Translation': { es: 'Traducción', de: 'Übersetzung', fr: 'Traduction', ko: '번역', ja: '翻訳', tl: 'Pagsasalin', ar: 'الترجمة', zh: '翻译', it: 'Traduzione', pt: 'Tradução', vi: 'Dịch thuật' },
  'Veterans': { es: 'Veteranos', de: 'Veteranen', fr: 'Vétérans', ko: '재향군인', ja: '退役軍人', tl: 'Mga Beterano', ar: 'المحاربون القدامى', zh: '退伍军人', it: 'Veterani', pt: 'Veteranos', vi: 'Cựu chiến binh' },
  'Branch': { es: 'Rama', de: 'Teilstreitkraft', fr: 'Branche', ko: '군별', ja: '軍種', tl: 'Sangay', ar: 'الفرع', zh: '军种', it: 'Forza armata', pt: 'Ramo', vi: 'Quân chủng' },
  'Profile': { es: 'Perfil', de: 'Profil', fr: 'Profil', ko: '프로필', ja: 'プロフィール', tl: 'Profile', ar: 'الملف الشخصي', zh: '档案', it: 'Profilo', pt: 'Perfil', vi: 'Hồ sơ' },
  'Preferred Language': { es: 'Idioma preferido', de: 'Bevorzugte Sprache', fr: 'Langue préférée', ko: '선호 언어', ja: '希望言語', tl: 'Gustong Wika', ar: 'اللغة المفضلة', zh: '首选语言', it: 'Lingua preferita', pt: 'Idioma preferido', vi: 'Ngôn ngữ ưu tiên' },
  'Gaining Installation': { es: 'Instalación de destino', de: 'Zielstandort', fr: 'Installation d’arrivée', ko: '도착 기지', ja: '赴任先基地', tl: 'Destinasyong Base', ar: 'المنشأة الجديدة', zh: '新基地', it: 'Base di destinazione', pt: 'Instalação de destino', vi: 'Căn cứ đến' },
  'Losing Installation': { es: 'Instalación de salida', de: 'Abgangsstandort', fr: 'Installation de départ', ko: '출발 기지', ja: '出発基地', tl: 'Papalitang Base', ar: 'منشأة المغادرة', zh: '离开基地', it: 'Base di partenza', pt: 'Instalação de partida', vi: 'Căn cứ rời đi' },
  'Departure Date': { es: 'Fecha de salida', de: 'Abreisedatum', fr: 'Date de départ', ko: '출발일', ja: '出発日', tl: 'Petsa ng Pag-alis', ar: 'تاريخ المغادرة', zh: '出发日期', it: 'Data di partenza', pt: 'Data de partida', vi: 'Ngày khởi hành' },
  'Continue': { es: 'Continuar', de: 'Weiter', fr: 'Continuer', ko: '계속', ja: '続行', tl: 'Magpatuloy', ar: 'متابعة', zh: '继续', it: 'Continua', pt: 'Continuar', vi: 'Tiếp tục' },
  'Back': { es: 'Atrás', de: 'Zurück', fr: 'Retour', ko: '뒤로', ja: '戻る', tl: 'Bumalik', ar: 'رجوع', zh: '返回', it: 'Indietro', pt: 'Voltar', vi: 'Quay lại' },
  'Next': { es: 'Siguiente', de: 'Weiter', fr: 'Suivant', ko: '다음', ja: '次へ', tl: 'Susunod', ar: 'التالي', zh: '下一步', it: 'Avanti', pt: 'Próximo', vi: 'Tiếp' },
  'Skip': { es: 'Omitir', de: 'Überspringen', fr: 'Ignorer', ko: '건너뛰기', ja: 'スキップ', tl: 'Laktawan', ar: 'تخطي', zh: '跳过', it: 'Salta', pt: 'Pular', vi: 'Bỏ qua' },
  'Open': { es: 'Abrir', de: 'Öffnen', fr: 'Ouvrir', ko: '열기', ja: '開く', tl: 'Buksan', ar: 'فتح', zh: '打开', it: 'Apri', pt: 'Abrir', vi: 'Mở' },
  'Open Resource': { es: 'Abrir recurso', de: 'Ressource öffnen', fr: 'Ouvrir la ressource', ko: '자료 열기', ja: 'リソースを開く', tl: 'Buksan ang Resource', ar: 'فتح المورد', zh: '打开资源', it: 'Apri risorsa', pt: 'Abrir recurso', vi: 'Mở tài nguyên' },
  'Search': { es: 'Buscar', de: 'Suchen', fr: 'Rechercher', ko: '검색', ja: '検索', tl: 'Maghanap', ar: 'بحث', zh: '搜索', it: 'Cerca', pt: 'Pesquisar', vi: 'Tìm kiếm' },
  'Reset / Re-onboard': { es: 'Restablecer / reconfigurar', de: 'Zurücksetzen / neu einrichten', fr: 'Réinitialiser / refaire l’accueil', ko: '재설정 / 다시 시작', ja: 'リセット / 再設定', tl: 'I-reset / ulitin ang setup', ar: 'إعادة الضبط / البدء من جديد', zh: '重置 / 重新设置', it: 'Ripristina / nuova configurazione', pt: 'Redefinir / refazer configuração', vi: 'Đặt lại / thiết lập lại' },
  'See Demo First': { es: 'Ver demo primero', de: 'Demo zuerst ansehen', fr: 'Voir la démo d’abord', ko: '데모 먼저 보기', ja: '先にデモを見る', tl: 'Tingnan muna ang demo', ar: 'عرض العرض التوضيحي أولاً', zh: '先看演示', it: 'Vedi prima la demo', pt: 'Ver demonstração primeiro', vi: 'Xem demo trước' },
  'Launch Demo': { es: 'Iniciar demo', de: 'Demo starten', fr: 'Lancer la démo', ko: '데모 시작', ja: 'デモを開始', tl: 'Simulan ang demo', ar: 'تشغيل العرض التوضيحي', zh: '启动演示', it: 'Avvia demo', pt: 'Iniciar demo', vi: 'Mở demo' },
  'Demo Tour': { es: 'Tour demo', de: 'Demo-Tour', fr: 'Visite démo', ko: '데모 투어', ja: 'デモツアー', tl: 'Demo Tour', ar: 'جولة العرض', zh: '演示导览', it: 'Tour demo', pt: 'Tour de demonstração', vi: 'Tham quan demo' },
  'Thank You for Your Service': { es: 'Gracias por su servicio', de: 'Vielen Dank für Ihren Dienst', fr: 'Merci pour votre service', ko: '복무에 감사드립니다', ja: 'ご奉仕に感謝します', tl: 'Salamat sa iyong serbisyo', ar: 'شكراً لخدمتك', zh: '感谢您的服役', it: 'Grazie per il tuo servizio', pt: 'Obrigado pelo seu serviço', vi: 'Cảm ơn sự phục vụ của bạn' },
  'Route Planner': { es: 'Planificador de ruta', de: 'Routenplaner', fr: 'Planificateur d’itinéraire', ko: '경로 계획', ja: 'ルート計画', tl: 'Tagaplano ng Ruta', ar: 'مخطط الطريق', zh: '路线规划', it: 'Pianifica percorso', pt: 'Planejador de rota', vi: 'Lập tuyến đường' },
  'Directions': { es: 'Indicaciones', de: 'Wegbeschreibung', fr: 'Itinéraires', ko: '길 안내', ja: '経路案内', tl: 'Direksyon', ar: 'الاتجاهات', zh: '路线', it: 'Indicazioni', pt: 'Direções', vi: 'Chỉ đường' },
  'Saved Routes': { es: 'Rutas guardadas', de: 'Gespeicherte Routen', fr: 'Itinéraires enregistrés', ko: '저장된 경로', ja: '保存済みルート', tl: 'Naka-save na Ruta', ar: 'الطرق المحفوظة', zh: '已保存路线', it: 'Percorsi salvati', pt: 'Rotas salvas', vi: 'Tuyến đã lưu' },
  'Base Map': { es: 'Mapa de la base', de: 'Basiskarte', fr: 'Carte de la base', ko: '기지 지도', ja: '基地マップ', tl: 'Mapa ng Base', ar: 'خريطة القاعدة', zh: '基地地图', it: 'Mappa base', pt: 'Mapa da base', vi: 'Bản đồ căn cứ' },
  'Deployment': { es: 'Despliegue', de: 'Einsatz', fr: 'Déploiement', ko: '파병', ja: '派遣', tl: 'Deployment', ar: 'الانتشار', zh: '部署', it: 'Schieramento', pt: 'Mobilização', vi: 'Triển khai' },
  'EFMP': { es: 'EFMP', de: 'EFMP', fr: 'EFMP', ko: 'EFMP', ja: 'EFMP', tl: 'EFMP', ar: 'EFMP', zh: 'EFMP', it: 'EFMP', pt: 'EFMP', vi: 'EFMP' },
  'Employment': { es: 'Empleo', de: 'Beschäftigung', fr: 'Emploi', ko: '취업', ja: '雇用', tl: 'Trabaho', ar: 'التوظيف', zh: '就业', it: 'Occupazione', pt: 'Emprego', vi: 'Việc làm' },
  'Permanent Resident': { es: 'Residencia permanente', de: 'Daueraufenthalt', fr: 'Résident permanent', ko: '영주권', ja: '永住者', tl: 'Permanent Resident', ar: 'الإقامة الدائمة', zh: '永久居民', it: 'Residente permanente', pt: 'Residente permanente', vi: 'Thường trú nhân' },
  'Pets': { es: 'Mascotas', de: 'Haustiere', fr: 'Animaux', ko: '반려동물', ja: 'ペット', tl: 'Alagang hayop', ar: 'الحيوانات الأليفة', zh: '宠物', it: 'Animali domestici', pt: 'Animais de estimação', vi: 'Thú cưng' },
  'Schools': { es: 'Escuelas', de: 'Schulen', fr: 'Écoles', ko: '학교', ja: '学校', tl: 'Mga Paaralan', ar: 'المدارس', zh: '学校', it: 'Scuole', pt: 'Escolas', vi: 'Trường học' },
  'Home Locator': { es: 'Buscador de vivienda', de: 'Wohnungssuche', fr: 'Recherche de logement', ko: '주택 찾기', ja: '住宅検索', tl: 'Tagahanap ng Tahanan', ar: 'البحث عن السكن', zh: '住房查找', it: 'Ricerca casa', pt: 'Localizador de moradia', vi: 'Tìm nhà ở' },
  'Inventory & Claims': { es: 'Inventario y reclamos', de: 'Inventar und Ansprüche', fr: 'Inventaire et réclamations', ko: '재고 및 청구', ja: '在庫と請求', tl: 'Imbentaryo at Claims', ar: 'الجرد والمطالبات', zh: '清单和索赔', it: 'Inventario e reclami', pt: 'Inventário e reclamações', vi: 'Kiểm kê và khiếu nại' },
  'Move Aid': { es: 'Ayuda para mudanza', de: 'Umzugshilfe', fr: 'Aide au déménagement', ko: '이사 지원', ja: '引越し支援', tl: 'Tulong sa Paglipat', ar: 'مساعدة الانتقال', zh: '搬家援助', it: 'Aiuto trasloco', pt: 'Ajuda para mudança', vi: 'Hỗ trợ chuyển nhà' },
  'VA Loan': { es: 'Préstamo VA', de: 'VA-Darlehen', fr: 'Prêt VA', ko: 'VA 대출', ja: 'VAローン', tl: 'VA Loan', ar: 'قرض VA', zh: 'VA贷款', it: 'Prestito VA', pt: 'Empréstimo VA', vi: 'Khoản vay VA' },
  'Tuition Assistance': { es: 'Asistencia de matrícula', de: 'Studienbeihilfe', fr: 'Aide aux frais de scolarité', ko: '학비 지원', ja: '授業料支援', tl: 'Tulong sa Tuition', ar: 'مساعدة الرسوم الدراسية', zh: '学费援助', it: 'Assistenza tasse universitarie', pt: 'Assistência de mensalidade', vi: 'Hỗ trợ học phí' },
  'Security Controls': { es: 'Controles de seguridad', de: 'Sicherheitskontrollen', fr: 'Contrôles de sécurité', ko: '보안 제어', ja: 'セキュリティ制御', tl: 'Mga Kontrol sa Seguridad', ar: 'ضوابط الأمان', zh: '安全控制', it: 'Controlli di sicurezza', pt: 'Controles de segurança', vi: 'Kiểm soát bảo mật' },
  'Official public data disclaimer': { es: 'Aviso de datos públicos oficiales', de: 'Hinweis zu offiziellen öffentlichen Daten', fr: 'Avis sur les données publiques officielles', ko: '공식 공개 데이터 고지', ja: '公式公開データ免責事項', tl: 'Paunawa sa opisyal na pampublikong data', ar: 'إخلاء مسؤولية البيانات العامة الرسمية', zh: '官方公共数据免责声明', it: 'Avviso sui dati pubblici ufficiali', pt: 'Aviso de dados públicos oficiais', vi: 'Tuyên bố dữ liệu công khai chính thức' },
  'Independent application notice': { es: 'Aviso de aplicación independiente', de: 'Hinweis zur unabhängigen Anwendung', fr: 'Avis d’application indépendante', ko: '독립 애플리케이션 고지', ja: '独立アプリ通知', tl: 'Paunawa ng independent application', ar: 'إشعار التطبيق المستقل', zh: '独立应用通知', it: 'Avviso applicazione indipendente', pt: 'Aviso de aplicativo independente', vi: 'Thông báo ứng dụng độc lập' },
  'Manual location search': { es: 'Búsqueda manual de ubicación', de: 'Manuelle Standortsuche', fr: 'Recherche manuelle de lieu', ko: '수동 위치 검색', ja: '手動場所検索', tl: 'Manwal na paghahanap ng lokasyon', ar: 'بحث يدوي عن الموقع', zh: '手动位置搜索', it: 'Ricerca manuale posizione', pt: 'Busca manual de local', vi: 'Tìm vị trí thủ công' },
  'Official housing links': { es: 'Enlaces oficiales de vivienda', de: 'Offizielle Wohnungslinks', fr: 'Liens officiels logement', ko: '공식 주거 링크', ja: '公式住宅リンク', tl: 'Opisyal na link sa pabahay', ar: 'روابط السكن الرسمية', zh: '官方住房链接', it: 'Link ufficiali alloggio', pt: 'Links oficiais de moradia', vi: 'Liên kết nhà ở chính thức' },
  'Open official site': { es: 'Abrir sitio oficial', de: 'Offizielle Seite öffnen', fr: 'Ouvrir le site officiel', ko: '공식 사이트 열기', ja: '公式サイトを開く', tl: 'Buksan ang opisyal na site', ar: 'فتح الموقع الرسمي', zh: '打开官方网站', it: 'Apri sito ufficiale', pt: 'Abrir site oficial', vi: 'Mở trang chính thức' },
};

function normalizeLanguage(language) {
  const code = String(language || 'en').toLowerCase();
  return SUPPORTED.has(code) ? code : 'en';
}

function translateExact(original, lang) {
  if (!original || lang === 'en') return original;
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const compact = original.trim().replace(/\s+/g, ' ');
  const translated = PHRASES[compact]?.[lang];
  return translated ? `${leading}${translated}${trailing}` : original;
}

function shouldSkipNode(node) {
  const parent = node?.parentElement;
  if (!parent) return true;
  if (parent.closest('script, style, noscript, textarea, code, pre, [data-no-translate], .notranslate')) return true;
  return false;
}

function translateTextNode(node, lang) {
  if (shouldSkipNode(node)) return;
  const current = node.nodeValue || '';
  if (!current.trim()) return;

  if (node.__pcsTranslatedText && current !== node.__pcsTranslatedText) {
    node.__pcsOriginalText = current;
  } else if (!node.__pcsOriginalText) {
    node.__pcsOriginalText = current;
  }

  const original = node.__pcsOriginalText;
  const translated = translateExact(original, lang);
  if (node.nodeValue !== translated) node.nodeValue = translated;
  node.__pcsTranslatedText = translated;
}

function translateAttribute(element, attr, lang) {
  if (!element.hasAttribute(attr)) return;
  const storeName = `pcsOriginal${attr}`;
  const current = element.getAttribute(attr) || '';
  if (!current) return;
  if (!element.dataset[storeName]) element.dataset[storeName] = current;
  const original = element.dataset[storeName];
  const translated = translateExact(original, lang);
  if (current !== translated) element.setAttribute(attr, translated);
}

function applyRuntimeLanguage(lang) {
  const root = document.getElementById('root') || document.body;
  if (!root) return;
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('translate', 'yes');
  root.setAttribute('data-pcs-language-runtime', lang);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipNode(node)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => translateTextNode(node, lang));

  root.querySelectorAll('[placeholder], [aria-label], [aria-description], [title]').forEach((element) => {
    translateAttribute(element, 'placeholder', lang);
    translateAttribute(element, 'aria-label', lang);
    translateAttribute(element, 'aria-description', lang);
    translateAttribute(element, 'title', lang);
  });
}

export function useAppLanguageRuntime(language) {
  const lang = normalizeLanguage(language);
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    let applying = false;
    let scheduled = 0;
    const run = () => {
      scheduled = 0;
      applying = true;
      try {
        applyRuntimeLanguage(lang);
      } finally {
        window.setTimeout(() => { applying = false; }, 0);
      }
    };
    const schedule = () => {
      if (applying || scheduled) return;
      scheduled = window.requestAnimationFrame(run);
    };

    run();
    const root = document.getElementById('root') || document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'aria-description', 'title'] });
    window.addEventListener('pcs-language-refresh', schedule);

    return () => {
      if (scheduled) window.cancelAnimationFrame(scheduled);
      observer.disconnect();
      window.removeEventListener('pcs-language-refresh', schedule);
    };
  }, [lang]);
}
