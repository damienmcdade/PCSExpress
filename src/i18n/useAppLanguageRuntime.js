/*
 * Purpose: App-wide language-first runtime for PCS Express.
 * Third-party dependencies: React only.
 *
 * This runtime replaces the former partial-word translator. Partial replacement
 * caused mixed strings such as translated labels embedded inside English
 * sentences. This version translates whole visible text nodes only. If a full
 * phrase has not been localized yet, non-English languages receive a complete
 * localized fallback sentence instead of an English fragment.
 */

import { useEffect } from 'react';

const RTL_LANGS = new Set(['ar']);
const SUPPORTED = new Set(['en', 'es', 'de', 'fr', 'ko', 'ja', 'tl', 'ar', 'zh', 'it', 'pt', 'vi']);

const GENERIC = {
  en: {
    section: 'Official information',
    body: 'Official public information is available from the linked source. Verify details with the official source before acting.',
    action: 'Open',
    search: 'Search',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    resource: 'Open official resource',
    unavailable: 'Official public information is not available in the local app for this item yet.',
    languageMode: 'Selected language mode is active.',
  },
  es: {
    section: 'Información oficial',
    body: 'La información pública oficial está disponible en la fuente enlazada. Verifique los detalles con la fuente oficial antes de actuar.',
    action: 'Abrir',
    search: 'Buscar',
    continue: 'Continuar',
    back: 'Atrás',
    next: 'Siguiente',
    resource: 'Abrir recurso oficial',
    unavailable: 'La información pública oficial aún no está disponible localmente para este elemento.',
    languageMode: 'El modo de idioma seleccionado está activo.',
  },
  de: {
    section: 'Offizielle Informationen',
    body: 'Offizielle öffentliche Informationen sind über die verlinkte Quelle verfügbar. Prüfen Sie Details vor dem Handeln bei der offiziellen Quelle.',
    action: 'Öffnen',
    search: 'Suchen',
    continue: 'Weiter',
    back: 'Zurück',
    next: 'Weiter',
    resource: 'Offizielle Ressource öffnen',
    unavailable: 'Für dieses Element sind lokal noch keine offiziellen öffentlichen Informationen verfügbar.',
    languageMode: 'Der ausgewählte Sprachmodus ist aktiv.',
  },
  fr: {
    section: 'Information officielle',
    body: 'Les informations publiques officielles sont disponibles dans la source liée. Vérifiez les détails auprès de la source officielle avant d’agir.',
    action: 'Ouvrir',
    search: 'Rechercher',
    continue: 'Continuer',
    back: 'Retour',
    next: 'Suivant',
    resource: 'Ouvrir la ressource officielle',
    unavailable: 'Les informations publiques officielles ne sont pas encore disponibles localement pour cet élément.',
    languageMode: 'Le mode de langue sélectionné est actif.',
  },
  ko: {
    section: '공식 정보',
    body: '공식 공개 정보는 연결된 출처에서 확인할 수 있습니다. 조치하기 전에 공식 출처에서 세부 정보를 확인하십시오.',
    action: '열기',
    search: '검색',
    continue: '계속',
    back: '뒤로',
    next: '다음',
    resource: '공식 자료 열기',
    unavailable: '이 항목의 공식 공개 정보는 아직 앱에 저장되어 있지 않습니다.',
    languageMode: '선택한 언어 모드가 활성화되어 있습니다.',
  },
  ja: {
    section: '公式情報',
    body: '公式公開情報はリンク先で確認できます。行動する前に公式ソースで詳細を確認してください。',
    action: '開く',
    search: '検索',
    continue: '続行',
    back: '戻る',
    next: '次へ',
    resource: '公式リソースを開く',
    unavailable: 'この項目の公式公開情報はまだアプリ内で利用できません。',
    languageMode: '選択した言語モードが有効です。',
  },
  tl: {
    section: 'Opisyal na impormasyon',
    body: 'Makikita ang opisyal na pampublikong impormasyon sa naka-link na source. Suriin muna ang detalye sa opisyal na source bago kumilos.',
    action: 'Buksan',
    search: 'Maghanap',
    continue: 'Magpatuloy',
    back: 'Bumalik',
    next: 'Susunod',
    resource: 'Buksan ang opisyal na resource',
    unavailable: 'Wala pang lokal na opisyal na pampublikong impormasyon para sa item na ito.',
    languageMode: 'Aktibo ang napiling wika.',
  },
  ar: {
    section: 'معلومات رسمية',
    body: 'تتوفر المعلومات العامة الرسمية من خلال المصدر المرتبط. تحقق من التفاصيل من المصدر الرسمي قبل اتخاذ أي إجراء.',
    action: 'فتح',
    search: 'بحث',
    continue: 'متابعة',
    back: 'رجوع',
    next: 'التالي',
    resource: 'فتح المورد الرسمي',
    unavailable: 'المعلومات العامة الرسمية غير متوفرة محلياً لهذا العنصر حتى الآن.',
    languageMode: 'وضع اللغة المختارة مفعل.',
  },
  zh: {
    section: '官方信息',
    body: '官方公开信息可在链接来源中查看。采取行动前请向官方来源核实详细信息。',
    action: '打开',
    search: '搜索',
    continue: '继续',
    back: '返回',
    next: '下一步',
    resource: '打开官方资源',
    unavailable: '此项目的官方公开信息尚未在本地应用中提供。',
    languageMode: '所选语言模式已启用。',
  },
  it: {
    section: 'Informazione ufficiale',
    body: 'Le informazioni pubbliche ufficiali sono disponibili dalla fonte collegata. Verifica i dettagli con la fonte ufficiale prima di agire.',
    action: 'Apri',
    search: 'Cerca',
    continue: 'Continua',
    back: 'Indietro',
    next: 'Avanti',
    resource: 'Apri risorsa ufficiale',
    unavailable: 'Le informazioni pubbliche ufficiali non sono ancora disponibili localmente per questo elemento.',
    languageMode: 'La modalità lingua selezionata è attiva.',
  },
  pt: {
    section: 'Informação oficial',
    body: 'As informações públicas oficiais estão disponíveis na fonte vinculada. Verifique os detalhes com a fonte oficial antes de agir.',
    action: 'Abrir',
    search: 'Pesquisar',
    continue: 'Continuar',
    back: 'Voltar',
    next: 'Próximo',
    resource: 'Abrir recurso oficial',
    unavailable: 'As informações públicas oficiais ainda não estão disponíveis localmente para este item.',
    languageMode: 'O modo de idioma selecionado está ativo.',
  },
  vi: {
    section: 'Thông tin chính thức',
    body: 'Thông tin công khai chính thức có sẵn từ nguồn được liên kết. Hãy xác minh chi tiết với nguồn chính thức trước khi hành động.',
    action: 'Mở',
    search: 'Tìm kiếm',
    continue: 'Tiếp tục',
    back: 'Quay lại',
    next: 'Tiếp',
    resource: 'Mở tài nguyên chính thức',
    unavailable: 'Thông tin công khai chính thức chưa có trong ứng dụng cho mục này.',
    languageMode: 'Chế độ ngôn ngữ đã chọn đang hoạt động.',
  },
};

const PHRASES = {
  'PCS Express': { es: 'PCS Express', de: 'PCS Express', fr: 'PCS Express', ko: 'PCS Express', ja: 'PCS Express', tl: 'PCS Express', ar: 'PCS Express', zh: 'PCS Express', it: 'PCS Express', pt: 'PCS Express', vi: 'PCS Express' },
  'PCS EXPRESS': { es: 'PCS EXPRESS', de: 'PCS EXPRESS', fr: 'PCS EXPRESS', ko: 'PCS EXPRESS', ja: 'PCS EXPRESS', tl: 'PCS EXPRESS', ar: 'PCS EXPRESS', zh: 'PCS EXPRESS', it: 'PCS EXPRESS', pt: 'PCS EXPRESS', vi: 'PCS EXPRESS' },
  'Home': { es: 'Inicio', de: 'Start', fr: 'Accueil', ko: '홈', ja: 'ホーム', tl: 'Home', ar: 'الرئيسية', zh: '首页', it: 'Home', pt: 'Início', vi: 'Trang chủ' },
  'More': { es: 'Más', de: 'Mehr', fr: 'Plus', ko: '더 보기', ja: 'その他', tl: 'Higit pa', ar: 'المزيد', zh: '更多', it: 'Altro', pt: 'Mais', vi: 'Thêm' },
  'Checklist': { es: 'Lista', de: 'Checkliste', fr: 'Liste', ko: '체크리스트', ja: 'チェックリスト', tl: 'Checklist', ar: 'قائمة التحقق', zh: '清单', it: 'Checklist', pt: 'Checklist', vi: 'Danh sách' },
  'Documents': { es: 'Documentos', de: 'Dokumente', fr: 'Documents', ko: '문서', ja: '書類', tl: 'Dokumento', ar: 'المستندات', zh: '文件', it: 'Documenti', pt: 'Documentos', vi: 'Tài liệu' },
  'Education': { es: 'Educación', de: 'Bildung', fr: 'Éducation', ko: '교육', ja: '教育', tl: 'Edukasyon', ar: 'التعليم', zh: '教育', it: 'Istruzione', pt: 'Educação', vi: 'Giáo dục' },
  'Employment': { es: 'Empleo', de: 'Beschäftigung', fr: 'Emploi', ko: '취업', ja: '雇用', tl: 'Trabaho', ar: 'التوظيف', zh: '就业', it: 'Occupazione', pt: 'Emprego', vi: 'Việc làm' },
  'Employment & Career Center': { es: 'Centro de empleo y carrera', de: 'Beschäftigungs- und Karrierezentrum', fr: 'Centre emploi et carrière', ko: '취업 및 커리어 센터', ja: '雇用・キャリアセンター', tl: 'Employment at Career Center', ar: 'مركز التوظيف والمسار المهني', zh: '就业与职业中心', it: 'Centro occupazione e carriera', pt: 'Centro de emprego e carreira', vi: 'Trung tâm việc làm và nghề nghiệp' },
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
  'Search': { es: 'Buscar', de: 'Suchen', fr: 'Rechercher', ko: '검색', ja: '検索', tl: 'Maghanap', ar: 'بحث', zh: '搜索', it: 'Cerca', pt: 'Pesquisar', vi: 'Tìm kiếm' },
  'Reset / Re-onboard': { es: 'Restablecer / reconfigurar', de: 'Zurücksetzen / neu einrichten', fr: 'Réinitialiser / refaire l’accueil', ko: '재설정 / 다시 시작', ja: 'リセット / 再設定', tl: 'I-reset / ulitin ang setup', ar: 'إعادة الضبط / البدء من جديد', zh: '重置 / 重新设置', it: 'Ripristina / nuova configurazione', pt: 'Redefinir / refazer configuração', vi: 'Đặt lại / thiết lập lại' },
  'See Demo First': { es: 'Ver demo primero', de: 'Demo zuerst ansehen', fr: 'Voir la démo d’abord', ko: '데모 먼저 보기', ja: '先にデモを見る', tl: 'Tingnan muna ang demo', ar: 'عرض العرض التوضيحي أولاً', zh: '先看演示', it: 'Vedi prima la demo', pt: 'Ver demonstração primeiro', vi: 'Xem demo trước' },
  'Launch Demo': { es: 'Iniciar demo', de: 'Demo starten', fr: 'Lancer la démo', ko: '데모 시작', ja: 'デモを開始', tl: 'Simulan ang demo', ar: 'تشغيل العرض التوضيحي', zh: '启动演示', it: 'Avvia demo', pt: 'Iniciar demo', vi: 'Mở demo' },
  'Demo Tour': { es: 'Tour demo', de: 'Demo-Tour', fr: 'Visite démo', ko: '데모 투어', ja: 'デモツアー', tl: 'Demo Tour', ar: 'جولة العرض', zh: '演示导览', it: 'Tour demo', pt: 'Tour de demonstração', vi: 'Tham quan demo' },
  'Thank You for Your Service!': { es: '¡Gracias por su servicio!', de: 'Vielen Dank für Ihren Dienst!', fr: 'Merci pour votre service !', ko: '복무에 감사드립니다!', ja: 'ご奉仕に感謝します！', tl: 'Salamat sa iyong serbisyo!', ar: 'شكراً لخدمتك!', zh: '感谢您的服役！', it: 'Grazie per il tuo servizio!', pt: 'Obrigado pelo seu serviço!', vi: 'Cảm ơn sự phục vụ của bạn!' },
  'Official information': { es: 'Información oficial', de: 'Offizielle Informationen', fr: 'Information officielle', ko: '공식 정보', ja: '公式情報', tl: 'Opisyal na impormasyon', ar: 'معلومات رسمية', zh: '官方信息', it: 'Informazione ufficiale', pt: 'Informação oficial', vi: 'Thông tin chính thức' },
  'Open official resource': { es: 'Abrir recurso oficial', de: 'Offizielle Ressource öffnen', fr: 'Ouvrir la ressource officielle', ko: '공식 자료 열기', ja: '公式リソースを開く', tl: 'Buksan ang opisyal na resource', ar: 'فتح المورد الرسمي', zh: '打开官方资源', it: 'Apri risorsa ufficiale', pt: 'Abrir recurso oficial', vi: 'Mở tài nguyên chính thức' },
};

const PROPER_NOUNS = [
  'PCS', 'PCS Express', 'USAJOBS', 'Military OneSource', 'MySECO', 'MSEP', 'MyCAA', 'TRICARE', 'DoDEA', 'DPS', 'VA', 'GI Bill', 'FAFSA',
  'Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard', 'DoD', 'DISA', 'EFMP', 'OCONUS', 'CONUS',
  'LinkedIn', 'Indeed', 'ClearanceJobs', 'Hiring Our Heroes', 'SCORE', 'IVMF', 'SBA', 'VBOC',
];

function normalizeLanguage(language) {
  const code = String(language || 'en').toLowerCase();
  return SUPPORTED.has(code) ? code : 'en';
}

function compactText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function translateExact(original, lang) {
  if (!original || lang === 'en') return original;
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const compact = compactText(original);
  const translated = PHRASES[compact]?.[lang];
  return translated ? `${leading}${translated}${trailing}` : null;
}

function isNumericOrSymbolOnly(text) {
  return /^[\s\d.,:/%+$#()\-–—|·*]+$/.test(text);
}

function isKnownProperNoun(text) {
  const compact = compactText(text);
  if (!compact) return true;
  if (PROPER_NOUNS.includes(compact)) return true;
  if (/^[A-Z0-9&./ -]{2,14}$/.test(compact)) return true;
  if (/^(Fort|Camp|Joint Base|Naval|NAS|MCAS|MCB|USAG|Ramstein|Kadena|Osan|Yokota|Schofield|Eglin|MacDill|Travis|Nellis|Luke|Minot|Hill|Patrick|Vandenberg)\b/.test(compact)) return true;
  return false;
}

function looksLikeEnglish(text) {
  const compact = compactText(text);
  if (!compact || isNumericOrSymbolOnly(compact) || isKnownProperNoun(compact)) return false;
  const letters = compact.match(/[A-Za-z]/g)?.length || 0;
  if (letters < 3) return false;
  const commonWords = /\b(the|and|or|for|with|from|your|you|near|official|public|information|resources|search|open|review|complete|support|move|home|family|service|military|spouse|installation|documents|checklist|profile|language|category|available|local|data|security|career|employment)\b/i;
  return commonWords.test(compact) || letters / Math.max(compact.length, 1) > 0.45;
}




// PCS_REPEAT_FIX_START
const TOPIC_TERMS = {
  checklist: { en: 'PCS checklist', es: 'la lista PCS', de: 'die PCS-Checkliste', fr: 'la liste PCS', ko: 'PCS 체크리스트', ja: 'PCSチェックリスト', tl: 'PCS checklist', ar: 'قائمة PCS', zh: 'PCS 清单', it: 'la checklist PCS', pt: 'a checklist PCS', vi: 'danh sách PCS' },
  documents: { en: 'document tracking', es: 'el seguimiento de documentos', de: 'die Dokumentenverfolgung', fr: 'le suivi des documents', ko: '문서 추적', ja: '書類管理', tl: 'pagsubaybay ng dokumento', ar: 'تتبع المستندات', zh: '文件跟踪', it: 'il monitoraggio dei documenti', pt: 'o acompanhamento de documentos', vi: 'theo dõi tài liệu' },
  education: { en: 'education resources', es: 'los recursos educativos', de: 'die Bildungsressourcen', fr: 'les ressources éducatives', ko: '교육 자료', ja: '教育リソース', tl: 'mga resource sa edukasyon', ar: 'موارد التعليم', zh: '教育资源', it: 'le risorse per l’istruzione', pt: 'os recursos de educação', vi: 'tài nguyên giáo dục' },
  employment: { en: 'employment resources', es: 'los recursos de empleo', de: 'die Beschäftigungsressourcen', fr: 'les ressources d’emploi', ko: '취업 자료', ja: '雇用リソース', tl: 'mga resource sa trabaho', ar: 'موارد التوظيف', zh: '就业资源', it: 'le risorse per il lavoro', pt: 'os recursos de emprego', vi: 'tài nguyên việc làm' },
  family: { en: 'family readiness resources', es: 'los recursos de preparación familiar', de: 'die Familienbereitschaft', fr: 'la préparation familiale', ko: '가족 준비 자료', ja: '家族準備リソース', tl: 'family readiness resources', ar: 'موارد جاهزية العائلة', zh: '家庭准备资源', it: 'le risorse familiari', pt: 'os recursos familiares', vi: 'tài nguyên sẵn sàng gia đình' },
  housing: { en: 'housing and relocation resources', es: 'los recursos de vivienda y mudanza', de: 'die Wohnungs- und Umzugsressourcen', fr: 'les ressources logement et déménagement', ko: '주거 및 이전 자료', ja: '住宅と移転リソース', tl: 'housing at relocation resources', ar: 'موارد السكن والانتقال', zh: '住房和搬迁资源', it: 'le risorse per casa e trasferimento', pt: 'os recursos de moradia e mudança', vi: 'tài nguyên nhà ở và chuyển nhà' },
  mental: { en: 'mental readiness resources', es: 'los recursos de preparación mental', de: 'die mentalen Ressourcen', fr: 'les ressources de santé mentale', ko: '정신 준비 자료', ja: 'メンタル準備リソース', tl: 'mental readiness resources', ar: 'موارد الجاهزية النفسية', zh: '心理准备资源', it: 'le risorse per la prontezza mentale', pt: 'os recursos de saúde mental', vi: 'tài nguyên sẵn sàng tinh thần' },
  navigation: { en: 'navigation and base map resources', es: 'los recursos de navegación y mapa base', de: 'die Navigations- und Kartenressourcen', fr: 'les ressources de navigation et carte', ko: '내비게이션 및 기지 지도 자료', ja: 'ナビゲーションと基地地図リソース', tl: 'navigation at base map resources', ar: 'موارد الملاحة وخريطة القاعدة', zh: '导航和基地地图资源', it: 'le risorse di navigazione e mappa', pt: 'os recursos de navegação e mapa', vi: 'tài nguyên điều hướng và bản đồ căn cứ' },
  resources: { en: 'official resources', es: 'los recursos oficiales', de: 'die offiziellen Ressourcen', fr: 'les ressources officielles', ko: '공식 자료', ja: '公式リソース', tl: 'opisyal na resources', ar: 'الموارد الرسمية', zh: '官方资源', it: 'le risorse ufficiali', pt: 'os recursos oficiais', vi: 'tài nguyên chính thức' },
  spiritual: { en: 'spiritual readiness resources', es: 'los recursos de preparación espiritual', de: 'die spirituellen Ressourcen', fr: 'les ressources spirituelles', ko: '영적 준비 자료', ja: 'スピリチュアル準備リソース', tl: 'spiritual readiness resources', ar: 'موارد الجاهزية الروحية', zh: '精神准备资源', it: 'le risorse spirituali', pt: 'os recursos espirituais', vi: 'tài nguyên sẵn sàng tâm linh' },
  translation: { en: 'translation tools', es: 'las herramientas de traducción', de: 'die Übersetzungswerkzeuge', fr: 'les outils de traduction', ko: '번역 도구', ja: '翻訳ツール', tl: 'translation tools', ar: 'أدوات الترجمة', zh: '翻译工具', it: 'gli strumenti di traduzione', pt: 'as ferramentas de tradução', vi: 'công cụ dịch thuật' },
  veterans: { en: 'veteran resources', es: 'los recursos para veteranos', de: 'die Veteranenressourcen', fr: 'les ressources pour vétérans', ko: '재향군인 자료', ja: '退役軍人リソース', tl: 'veteran resources', ar: 'موارد المحاربين القدامى', zh: '退伍军人资源', it: 'le risorse per veterani', pt: 'os recursos para veteranos', vi: 'tài nguyên cựu chiến binh' },
  security: { en: 'security information', es: 'la información de seguridad', de: 'die Sicherheitsinformationen', fr: 'les informations de sécurité', ko: '보안 정보', ja: 'セキュリティ情報', tl: 'security information', ar: 'معلومات الأمان', zh: '安全信息', it: 'le informazioni di sicurezza', pt: 'as informações de segurança', vi: 'thông tin bảo mật' },
  profile: { en: 'profile settings', es: 'la configuración del perfil', de: 'die Profileinstellungen', fr: 'les paramètres du profil', ko: '프로필 설정', ja: 'プロフィール設定', tl: 'profile settings', ar: 'إعدادات الملف الشخصي', zh: '档案设置', it: 'le impostazioni del profilo', pt: 'as configurações do perfil', vi: 'cài đặt hồ sơ' },
};

const TOPIC_TEMPLATES = {
  en: { body: (topic) => `Review ${topic} and verify details with the official source before acting.`, heading: (topic) => topic },
  es: { body: (topic) => `Revise ${topic} y verifique los detalles con la fuente oficial antes de actuar.`, heading: (topic) => topic },
  de: { body: (topic) => `Prüfen Sie ${topic} und bestätigen Sie Details vor dem Handeln bei der offiziellen Quelle.`, heading: (topic) => topic },
  fr: { body: (topic) => `Consultez ${topic} et vérifiez les détails auprès de la source officielle avant d’agir.`, heading: (topic) => topic },
  ko: { body: (topic) => `${topic}을 확인하고 조치하기 전에 공식 출처에서 세부 정보를 확인하십시오.`, heading: (topic) => topic },
  ja: { body: (topic) => `${topic}を確認し、行動する前に公式ソースで詳細を確認してください。`, heading: (topic) => topic },
  tl: { body: (topic) => `Suriin ang ${topic} at kumpirmahin ang detalye sa opisyal na source bago kumilos.`, heading: (topic) => topic },
  ar: { body: (topic) => `راجع ${topic} وتحقق من التفاصيل من المصدر الرسمي قبل اتخاذ أي إجراء.`, heading: (topic) => topic },
  zh: { body: (topic) => `查看${topic}，并在采取行动前向官方来源核实详细信息。`, heading: (topic) => topic },
  it: { body: (topic) => `Consulta ${topic} e verifica i dettagli con la fonte ufficiale prima di agire.`, heading: (topic) => topic },
  pt: { body: (topic) => `Revise ${topic} e confirme os detalhes com a fonte oficial antes de agir.`, heading: (topic) => topic },
  vi: { body: (topic) => `Xem ${topic} và xác minh chi tiết với nguồn chính thức trước khi hành động.`, heading: (topic) => topic },
};

const TOPIC_RULES = [
  ['employment', /job|career|resume|internship|mentor|mentorship|linkedin|certification|entrepreneur|employment|spouse preferred|workshop|salary|hiring|recruiter/i],
  ['housing', /home relocation|housing|home locator|move aid|moving|relocation|va loan|claims|inventory|landlord|lodging|bedroom|bathroom|square footage/i],
  ['documents', /document|orders|unit|pdf|file|record|paperwork|upload|attachment/i],
  ['education', /education|school|college|tuition|mycaa|gi bill|fafsa|degree|certificate|enrollment|student/i],
  ['family', /family|efmp|pet|child|children|spouse|dependent|permanent resident|deployment|readiness group/i],
  ['navigation', /navigation|map|base map|route|directions|installation|gate|traffic|location/i],
  ['mental', /mental|crisis|counseling|therapy|health|wellness|stress|988|support line/i],
  ['spiritual', /spiritual|faith|religion|chaplain|chapel|worship|prayer/i],
  ['veterans', /veteran|veterans|business owner|owned business/i],
  ['translation', /translation|translate|language|phrase|interpreter/i],
  ['checklist', /checklist|task|phase|milestone|progress|deadline|complete/i],
  ['security', /security|privacy|public data|classified|cui|disa|dod|encrypted|local device/i],
  ['resources', /resource|official source|link|benefit|program|assistance|support/i],
  ['profile', /profile|onboarding|branch|component|rank|pay grade|preferred language/i],
];

function topicTerm(topic, lang) {
  return TOPIC_TERMS[topic]?.[lang] || TOPIC_TERMS[topic]?.en || TOPIC_TERMS.resources[lang] || TOPIC_TERMS.resources.en;
}

function templateFor(lang) {
  return TOPIC_TEMPLATES[lang] || TOPIC_TEMPLATES.en;
}

function topicFor(text, parent) {
  const parts = [text];
  let node = parent;
  for (let i = 0; node && i < 3; i += 1) {
    parts.push(node.id || '', typeof node.className === 'string' ? node.className : '', node.getAttribute?.('aria-label') || '');
    node = node.parentElement;
  }
  const context = parts.join(' ');
  const match = TOPIC_RULES.find(([, pattern]) => pattern.test(context));
  return match?.[0] || null;
}
// PCS_REPEAT_FIX_END

function chooseFallback(original, lang, parent) {
  const compact = compactText(original);
  if (!looksLikeEnglish(compact)) return original;

  const lower = compact.toLowerCase();
  const bundle = GENERIC[lang] || GENERIC.en;
  const tag = parent?.tagName?.toLowerCase() || '';
  const role = parent?.getAttribute?.('role') || '';

  if (/^open\b|view|learn|visit|download|browse|launch/.test(lower)) return bundle.action;
  if (/search|find/.test(lower)) return bundle.search;
  if (/continue|build my pcs plan|start/.test(lower)) return bundle.continue;
  if (/back/.test(lower)) return bundle.back;
  if (/next/.test(lower)) return bundle.next;
  if (tag === 'button' || role === 'button') return bundle.action;
  if (tag === 'a') return bundle.resource;
  if (/not available|unavailable|no .*data|cannot find|not found/.test(lower)) return bundle.unavailable;

  const topic = topicFor(compact, parent);
  if (topic) {
    const label = topicTerm(topic, lang);
    const template = templateFor(lang);
    const isShortHeading = compact.length <= 42 && !/[.!?]/.test(compact);
    const headingTag = /^h[1-6]$/.test(tag);
    if (isShortHeading || headingTag) return template.heading(label);
    return original;
  }

  // Unknown paragraphs are left intact instead of being rewritten into one repeated sentence.
  // This preserves legibility and prevents the repeated-phrase bug while exact/localized UI
  // strings continue to translate through PHRASES and source-level dictionaries.
  return original;
}

function shouldSkipNode(node) {
  const parent = node?.parentElement;
  if (!parent) return true;
  if (parent.closest('script, style, noscript, textarea, code, pre, [data-no-translate], [data-no-language-runtime], .notranslate')) return true;
  if (parent.closest('input, select, option')) return true;
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
  let translated = lang === 'en' ? original : translateExact(original, lang);
  if (translated === null) translated = chooseFallback(original, lang, node.parentElement);
  if (node.nodeValue !== translated) node.nodeValue = translated;
  node.__pcsTranslatedText = translated;
}

function translateAttribute(element, attr, lang) {
  if (element.closest?.('[data-no-translate], [data-no-language-runtime], .notranslate')) return;
  if (!element.hasAttribute(attr)) return;
  const storeName = `pcsOriginal${attr}`;
  const current = element.getAttribute(attr) || '';
  if (!current) return;
  if (!element.dataset[storeName]) element.dataset[storeName] = current;
  const original = element.dataset[storeName];
  let translated = lang === 'en' ? original : translateExact(original, lang);
  if (translated === null) translated = chooseFallback(original, lang, element);
  if (current !== translated) element.setAttribute(attr, translated);
}

function applyRuntimeLanguage(lang) {
  const root = document.getElementById('root') || document.body;
  if (!root) return;
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('translate', 'no');
  root.setAttribute('data-pcs-language-runtime', lang);
  root.setAttribute('data-pcs-language-mode', lang === 'en' ? 'source' : 'exact-readable-no-repeat');

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
