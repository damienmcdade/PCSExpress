/*
 * Purpose: App-wide language runtime for PCS Express.
 * Third-party dependencies: React only.
 *
 * The app contains a large amount of static PCS guidance. Source-level
 * dictionaries cover core navigation, while this runtime covers remaining
 * headings, tabs, cards, checklists, button labels, placeholders, and fallback
 * guidance without mixing English into the selected onboarding language.
 */

import { useEffect } from 'react';

const RTL_LANGS = new Set(['ar']);
// The 11 curated locales (es..vi) carry per-key entries throughout
// this file. The 8 African / additional locales (sw..af) are
// supported only via the Google Translate runtime — when the user
// picks one of them, the in-app dictionary contributes nothing, and
// Google Translate covers every visible string instead. Adding them
// to SUPPORTED lets normalizeLanguage() pass them through cleanly so
// the lang attribute and CSP relaxation all line up.
const SUPPORTED = new Set([
  'en', 'es', 'de', 'fr', 'ko', 'ja', 'tl', 'ar', 'zh', 'it', 'pt', 'vi',
  'sw', 'ha', 'yo', 'am', 'zu', 'ig', 'so', 'af',
]);

const tr = (es, de, fr, ko, ja, tl, ar, zh, it, pt, vi) => ({ es, de, fr, ko, ja, tl, ar, zh, it, pt, vi });

// Languages that have a curated in-app dictionary (the args of tr()). The
// other SUPPORTED locales (the African set: sw/ha/yo/am/zu/ig/so/af) have
// NO dictionary, so the runtime must not rewrite their text — otherwise
// chooseFallback()/localizedSentence() fall through to GENERIC.es and a
// Swahili user is shown Spanish. Those languages are handled entirely by
// the Google Translate layer; the runtime leaves the source English in place.
const CURATED = new Set(['es', 'de', 'fr', 'ko', 'ja', 'tl', 'ar', 'zh', 'it', 'pt', 'vi']);

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
    item: 'Review this item and verify details with the official source before acting.',
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
    item: 'Revise este elemento y verifique los detalles con la fuente oficial antes de actuar.',
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
    item: 'Prüfen Sie diesen Punkt und bestätigen Sie Details vor dem Handeln bei der offiziellen Quelle.',
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
    item: 'Consultez cet élément et vérifiez les détails auprès de la source officielle avant d’agir.',
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
    item: '이 항목을 확인하고 조치하기 전에 공식 출처에서 세부 정보를 확인하십시오.',
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
    item: 'この項目を確認し、行動する前に公式ソースで詳細を確認してください。',
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
    item: 'Suriin ang item na ito at kumpirmahin ang detalye sa opisyal na source bago kumilos.',
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
    item: 'راجع هذا العنصر وتحقق من التفاصيل من المصدر الرسمي قبل اتخاذ أي إجراء.',
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
    item: '查看此项目，并在采取行动前向官方来源核实详细信息。',
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
    item: 'Consulta questo elemento e verifica i dettagli con la fonte ufficiale prima di agire.',
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
    item: 'Revise este item e confirme os detalhes com a fonte oficial antes de agir.',
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
    item: 'Xem mục này và xác minh chi tiết với nguồn chính thức trước khi hành động.',
  },
};

const PHRASES = {
  'PCS Express': tr('PCS Express', 'PCS Express', 'PCS Express', 'PCS Express', 'PCS Express', 'PCS Express', 'PCS Express', 'PCS Express', 'PCS Express', 'PCS Express', 'PCS Express'),
  'PCS EXPRESS': tr('PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS', 'PCS EXPRESS'),
  'Home': tr('Inicio', 'Startseite', 'Accueil', '홈', 'ホーム', 'Simula', 'الرئيسية', '首页', 'Pagina iniziale', 'Início', 'Trang chủ'),
  'More': tr('Más', 'Mehr', 'Plus', '더 보기', 'その他', 'Higit pa', 'المزيد', '更多', 'Altro', 'Mais', 'Thêm'),
  'Checklist': tr('Lista PCS', 'PCS-Checkliste', 'Liste PCS', 'PCS 체크리스트', 'PCSチェックリスト', 'Listahan ng PCS', 'قائمة PCS', 'PCS 清单', 'Lista PCS', 'Lista PCS', 'Danh sách PCS'),
  'PCS Checklist': tr('Lista PCS', 'PCS-Checkliste', 'Liste PCS', 'PCS 체크리스트', 'PCSチェックリスト', 'Listahan ng PCS', 'قائمة PCS', 'PCS 清单', 'Lista PCS', 'Lista PCS', 'Danh sách PCS'),
  'Documents': tr('Documentos', 'Dokumente', 'Documents', '문서', '書類', 'Dokumento', 'المستندات', '文件', 'Documenti', 'Documentos', 'Tài liệu'),
  'Education': tr('Educación', 'Bildung', 'Éducation', '교육', '教育', 'Edukasyon', 'التعليم', '教育', 'Istruzione', 'Educação', 'Giáo dục'),
  'Employment': tr('Empleo', 'Beschäftigung', 'Emploi', '취업', '雇用', 'Trabaho', 'التوظيف', '就业', 'Occupazione', 'Emprego', 'Việc làm'),
  'Employment & Career Center': tr('Centro de empleo y carrera', 'Beschäftigungs- und Karrierezentrum', 'Centre emploi et carrière', '취업 및 커리어 센터', '雇用・キャリアセンター', 'Sentro ng trabaho at karera', 'مركز التوظيف والمسار المهني', '就业与职业中心', 'Centro occupazione e carriera', 'Centro de emprego e carreira', 'Trung tâm việc làm và nghề nghiệp'),
  'Family Readiness': tr('Preparación familiar', 'Familienbereitschaft', 'Préparation familiale', '가족 준비', '家族準備', 'Kahandaan ng Pamilya', 'جاهزية العائلة', '家庭准备', 'Prontezza familiare', 'Prontidão familiar', 'Sẵn sàng gia đình'),
  'Home Relocation': tr('Reubicación del hogar', 'Wohnung und Umzug', 'Relogement', '주거 이전', '住居移転', 'Paglipat ng Tahanan', 'السكن والانتقال', '住房搬迁', 'Trasferimento casa', 'Mudança residencial', 'Nhà ở và chuyển nhà'),
  'Mental Readiness': tr('Preparación mental', 'Mentale Bereitschaft', 'Préparation mentale', '정신 준비', 'メンタル準備', 'Kahandaang Pangkaisipan', 'الجاهزية النفسية', '心理准备', 'Prontezza mentale', 'Prontidão mental', 'Sẵn sàng tinh thần'),
  'Navigation': tr('Navegación', 'Navigation', 'Navigation', '내비게이션', 'ナビゲーション', 'Pag-navigate', 'الملاحة', '导航', 'Navigazione', 'Navegação', 'Điều hướng'),
  'Resources': tr('Recursos', 'Ressourcen', 'Ressources', '자료', 'リソース', 'Mga Resource', 'الموارد', '资源', 'Risorse', 'Recursos', 'Tài nguyên'),
  'Spiritual Readiness': tr('Preparación espiritual', 'Spirituelle Bereitschaft', 'Préparation spirituelle', '영적 준비', 'スピリチュアル準備', 'Kahandaang Espirituwal', 'الجاهزية الروحية', '精神准备', 'Prontezza spirituale', 'Prontidão espiritual', 'Sẵn sàng tâm linh'),
  'Translation': tr('Traducción', 'Übersetzung', 'Traduction', '번역', '翻訳', 'Pagsasalin', 'الترجمة', '翻译', 'Traduzione', 'Tradução', 'Dịch thuật'),
  'Veterans': tr('Veteranos', 'Veteranen', 'Vétérans', '재향군인', '退役軍人', 'Mga Beterano', 'المحاربون القدامى', '退伍军人', 'Veterani', 'Veteranos', 'Cựu chiến binh'),
  'Branch': tr('Rama', 'Teilstreitkraft', 'Branche', '군별', '軍種', 'Sangay', 'الفرع', '军种', 'Forza armata', 'Ramo', 'Quân chủng'),
  'Profile': tr('Perfil', 'Profil', 'Profil', '프로필', 'プロフィール', 'Profile', 'الملف الشخصي', '档案', 'Profilo', 'Perfil', 'Hồ sơ'),
  'Preferred Language': tr('Idioma preferido', 'Bevorzugte Sprache', 'Langue préférée', '선호 언어', '希望言語', 'Gustong wika', 'اللغة المفضلة', '首选语言', 'Lingua preferita', 'Idioma preferido', 'Ngôn ngữ ưu tiên'),
  'Gaining Installation': tr('Instalación de destino', 'Zielstandort', 'Installation d’arrivée', '도착 기지', '赴任先基地', 'Destinasyong base', 'المنشأة الجديدة', '新基地', 'Base di destinazione', 'Instalação de destino', 'Căn cứ đến'),
  'Losing Installation': tr('Instalación de salida', 'Abgangsstandort', 'Installation de départ', '출발 기지', '出発基地', 'Base na aalisan', 'منشأة المغادرة', '离开基地', 'Base di partenza', 'Instalação de partida', 'Căn cứ rời đi'),
  'Departure Date': tr('Fecha de salida', 'Abreisedatum', 'Date de départ', '출발일', '出発日', 'Petsa ng alis', 'تاريخ المغادرة', '出发日期', 'Data di partenza', 'Data de partida', 'Ngày khởi hành'),
  'Continue': tr('Continuar', 'Weiter', 'Continuer', '계속', '続行', 'Magpatuloy', 'متابعة', '继续', 'Continua', 'Continuar', 'Tiếp tục'),
  'Back': tr('Atrás', 'Zurück', 'Retour', '뒤로', '戻る', 'Bumalik', 'رجوع', '返回', 'Indietro', 'Voltar', 'Quay lại'),
  'Next': tr('Siguiente', 'Weiter', 'Suivant', '다음', '次へ', 'Susunod', 'التالي', '下一步', 'Avanti', 'Próximo', 'Tiếp'),
  'Skip': tr('Omitir', 'Überspringen', 'Ignorer', '건너뛰기', 'スキップ', 'Laktawan', 'تخطي', '跳过', 'Salta', 'Pular', 'Bỏ qua'),
  'Open': tr('Abrir', 'Öffnen', 'Ouvrir', '열기', '開く', 'Buksan', 'فتح', '打开', 'Apri', 'Abrir', 'Mở'),
  'Open Resource →': tr('Abrir recurso', 'Ressource öffnen', 'Ouvrir la ressource', '자료 열기', 'リソースを開く', 'Buksan ang resource', 'فتح المورد', '打开资源', 'Apri risorsa', 'Abrir recurso', 'Mở tài nguyên'),
  'Open official resource': tr('Abrir recurso oficial', 'Offizielle Ressource öffnen', 'Ouvrir la ressource officielle', '공식 자료 열기', '公式リソースを開く', 'Buksan ang opisyal na resource', 'فتح المورد الرسمي', '打开官方资源', 'Apri risorsa ufficiale', 'Abrir recurso oficial', 'Mở tài nguyên chính thức'),
  'Search': tr('Buscar', 'Suchen', 'Rechercher', '검색', '検索', 'Maghanap', 'بحث', '搜索', 'Cerca', 'Pesquisar', 'Tìm kiếm'),
  'Reset / Re-onboard': tr('Restablecer / volver a iniciar', 'Zurücksetzen / neu einrichten', 'Réinitialiser / refaire l’accueil', '재설정 / 다시 시작', 'リセット / 再設定', 'I-reset / ulitin ang setup', 'إعادة الضبط / البدء من جديد', '重置 / 重新设置', 'Ripristina / nuova configurazione', 'Redefinir / refazer configuração', 'Đặt lại / thiết lập lại'),
  'See Demo First': tr('Ver demo primero', 'Demo zuerst ansehen', 'Voir la démo d’abord', '데모 먼저 보기', '先にデモを見る', 'Tingnan muna ang demo', 'عرض العرض التوضيحي أولاً', '先看演示', 'Vedi prima la demo', 'Ver demonstração primeiro', 'Xem demo trước'),
  'Launch Demo': tr('Iniciar demo', 'Demo starten', 'Lancer la démo', '데모 시작', 'デモを開始', 'Simulan ang demo', 'تشغيل العرض التوضيحي', '启动演示', 'Avvia demo', 'Iniciar demo', 'Mở demo'),
  'Demo Tour': tr('Tour demo', 'Demo-Tour', 'Visite démo', '데모 투어', 'デモツアー', 'Demo tour', 'جولة العرض', '演示导览', 'Tour demo', 'Tour de demonstração', 'Tham quan demo'),
  'Thank You for Your Service!': tr('¡Gracias por su servicio!', 'Vielen Dank für Ihren Dienst!', 'Merci pour votre service !', '복무에 감사드립니다!', 'ご奉仕に感謝します！', 'Salamat sa iyong serbisyo!', 'شكراً لخدمتك!', '感谢您的服役！', 'Grazie per il tuo servizio!', 'Obrigado pelo seu serviço!', 'Cảm ơn sự phục vụ của bạn!'),
  'Official information': tr('Información oficial', 'Offizielle Informationen', 'Information officielle', '공식 정보', '公式情報', 'Opisyal na impormasyon', 'معلومات رسمية', '官方信息', 'Informazione ufficiale', 'Informação oficial', 'Thông tin chính thức'),
  'Official': tr('Oficial', 'Offiziell', 'Officiel', '공식', '公式', 'Opisyal', 'رسمي', '官方', 'Ufficiale', 'Oficial', 'Chính thức'),
  'External': tr('Externo', 'Extern', 'Externe', '외부', '外部', 'External', 'خارجي', '外部', 'Esterno', 'Externo', 'Bên ngoài'),
  'Affiliated': tr('Afiliado', 'Verbunden', 'Affilié', '제휴', '提携', 'Affiliated', 'تابع', '附属', 'Affiliato', 'Afiliado', 'Liên kết'),
  'Federal': tr('Federal', 'Bund', 'Fédéral', '연방', '連邦', 'Federal', 'فدرالي', '联邦', 'Federale', 'Federal', 'Liên bang'),
  'Spouse': tr('Cónyuge', 'Ehepartner', 'Conjoint', '배우자', '配偶者', 'Asawa', 'زوج/زوجة', '配偶', 'Coniuge', 'Cônjuge', 'Vợ/chồng'),
  'Remote': tr('Remoto', 'Remote', 'À distance', '원격', 'リモート', 'Remote', 'عن بعد', '远程', 'Remoto', 'Remoto', 'Từ xa'),
  'Workshop': tr('Taller', 'Workshop', 'Atelier', '워크숍', 'ワークショップ', 'Workshop', 'ورشة', '工作坊', 'Workshop', 'Oficina', 'Hội thảo'),
  'Certification': tr('Certificación', 'Zertifikat', 'Certification', '자격증', '認定', 'Certification', 'شهادة', '证书', 'Certificazione', 'Certificação', 'Chứng chỉ'),
  'Mentorship': tr('Mentoría', 'Mentoring', 'Mentorat', '멘토링', 'メンタリング', 'Mentorship', 'إرشاد مهني', '导师支持', 'Mentorship', 'Mentoria', 'Cố vấn'),
  'Partner': tr('Socio', 'Partner', 'Partenaire', '파트너', 'パートナー', 'Partner', 'شريك', '合作伙伴', 'Partner', 'Parceiro', 'Đối tác'),
  'Business': tr('Negocio', 'Geschäft', 'Entreprise', '사업', '事業', 'Negosyo', 'عمل تجاري', '创业', 'Impresa', 'Negócio', 'Kinh doanh'),
  'Active listings': tr('Listados activos', 'Aktuelle Stellen', 'Offres actives', '활성 목록', '有効な求人', 'Aktibong listings', 'قوائم نشطة', '当前职位', 'Offerte attive', 'Vagas ativas', 'Danh sách hiện có'),
  'Search location': tr('Ubicación de búsqueda', 'Suchort', 'Lieu de recherche', '검색 위치', '検索場所', 'Lokasyon ng paghahanap', 'موقع البحث', '搜索地点', 'Località di ricerca', 'Local de busca', 'Vị trí tìm kiếm'),
  'Role or keyword': tr('Puesto o palabra clave', 'Rolle oder Stichwort', 'Poste ou mot-clé', '직무 또는 키워드', '職種またはキーワード', 'Role o keyword', 'الدور أو الكلمة المفتاحية', '职位或关键词', 'Ruolo o parola chiave', 'Cargo ou palavra-chave', 'Vai trò hoặc từ khóa'),
  'Open listings': tr('Abrir listados', 'Stellen öffnen', 'Ouvrir les offres', '목록 열기', '求人を開く', 'Buksan ang listings', 'فتح القوائم', '打开职位', 'Apri offerte', 'Abrir vagas', 'Mở danh sách'),
  'Job Search': tr('Búsqueda de empleo', 'Jobsuche', 'Recherche d’emploi', '일자리 검색', '求人検索', 'Paghahanap ng trabaho', 'البحث عن عمل', '职位搜索', 'Ricerca lavoro', 'Busca de emprego', 'Tìm việc'),
  'Job Resources': tr('Recursos de empleo', 'Job-Ressourcen', 'Ressources emploi', '취업 자료', '就職リソース', 'Mga resource sa trabaho', 'موارد التوظيف', '就业资源', 'Risorse lavoro', 'Recursos de emprego', 'Tài nguyên việc làm'),
  'Resume Assistance': tr('Ayuda con currículum', 'Lebenslaufhilfe', 'Aide CV', '이력서 지원', '履歴書支援', 'Tulong sa resume', 'مساعدة السيرة الذاتية', '简历帮助', 'Aiuto curriculum', 'Ajuda com currículo', 'Hỗ trợ hồ sơ'),
  'Internships': tr('Pasantías', 'Praktika', 'Stages', '인턴십', 'インターンシップ', 'Internships', 'التدريب العملي', '实习', 'Tirocini', 'Estágios', 'Thực tập'),
  'Employment Education Workshops': tr('Talleres de educación laboral', 'Arbeits- und Bildungsworkshops', 'Ateliers emploi et formation', '취업 교육 워크숍', '雇用教育ワークショップ', 'Employment education workshops', 'ورش التعليم المهني', '就业教育工作坊', 'Workshop lavoro e formazione', 'Oficinas de educação para emprego', 'Hội thảo giáo dục việc làm'),
  'Certifications': tr('Certificaciones', 'Zertifikate', 'Certifications', '자격증', '認定', 'Certifications', 'الشهادات', '证书', 'Certificazioni', 'Certificações', 'Chứng chỉ'),
  'Spouse Preferred': tr('Preferencia para cónyuges', 'Ehepartner bevorzugt', 'Priorité conjoint', '배우자 우대', '配偶者優先', 'Spouse preferred', 'أفضلية الزوج/الزوجة', '配偶优先', 'Preferenza coniuge', 'Preferência para cônjuge', 'Ưu tiên vợ/chồng'),
  'Connections': tr('Conexiones', 'Netzwerk', 'Connexions', '연결', 'つながり', 'Koneksyon', 'العلاقات المهنية', '人脉', 'Connessioni', 'Conexões', 'Kết nối'),
  'LinkedIn Workshop': tr('Taller de LinkedIn', 'LinkedIn-Workshop', 'Atelier LinkedIn', 'LinkedIn 워크숍', 'LinkedInワークショップ', 'LinkedIn workshop', 'ورشة LinkedIn', 'LinkedIn 工作坊', 'Workshop LinkedIn', 'Oficina LinkedIn', 'Hội thảo LinkedIn'),
  'Entrepreneurship': tr('Emprendimiento', 'Unternehmertum', 'Entrepreneuriat', '창업', '起業', 'Pagnenegosyo', 'ريادة الأعمال', '创业', 'Imprenditorialità', 'Empreendedorismo', 'Khởi nghiệp'),
  'Counseling': tr('Consejería', 'Beratung', 'Conseil', '상담', 'カウンセリング', 'Counseling', 'استشارة', '咨询', 'Consulenza', 'Aconselhamento', 'Tư vấn'),
  'Crisis Support': tr('Apoyo en crisis', 'Krisenhilfe', 'Soutien de crise', '위기 지원', '危機支援', 'Suporta sa krisis', 'دعم الأزمات', '危机支持', 'Supporto crisi', 'Apoio em crise', 'Hỗ trợ khủng hoảng'),
  'Family Support': tr('Apoyo familiar', 'Familienhilfe', 'Soutien familial', '가족 지원', '家族支援', 'Suporta sa pamilya', 'دعم العائلة', '家庭支持', 'Supporto famiglia', 'Apoio familiar', 'Hỗ trợ gia đình'),
  'Self-Care Tools': tr('Herramientas de autocuidado', 'Selbsthilfe-Tools', 'Outils d’autosoins', '자기관리 도구', 'セルフケアツール', 'Self-care tools', 'أدوات العناية الذاتية', '自我照护工具', 'Strumenti di cura personale', 'Ferramentas de autocuidado', 'Công cụ tự chăm sóc'),
  'Colleges': tr('Universidades', 'Hochschulen', 'Établissements', '대학', '大学', 'Mga kolehiyo', 'الكليات', '大学', 'College', 'Faculdades', 'Trường đại học'),
  'GI Bill Chapters': tr('Capítulos GI Bill', 'GI-Bill-Kapitel', 'Chapitres GI Bill', 'GI Bill 장', 'GI Bill章', 'GI Bill chapters', 'فصول GI Bill', 'GI Bill 章节', 'Capitoli GI Bill', 'Capítulos GI Bill', 'Các chương GI Bill'),
  'MyCAA (Spouses)': tr('MyCAA (cónyuges)', 'MyCAA (Ehepartner)', 'MyCAA (conjoints)', 'MyCAA(배우자)', 'MyCAA（配偶者）', 'MyCAA (asawa)', 'MyCAA (الأزواج)', 'MyCAA（配偶）', 'MyCAA (coniugi)', 'MyCAA (cônjuges)', 'MyCAA (vợ/chồng)'),
  'Tuition Assistance': tr('Asistencia de matrícula', 'Studiengebührenhilfe', 'Aide aux frais de scolarité', '학비 지원', '授業料支援', 'Tulong sa tuition', 'مساعدة الرسوم الدراسية', '学费援助', 'Assistenza tasse scolastiche', 'Assistência de mensalidade', 'Hỗ trợ học phí'),
  'Careers': tr('Carreras', 'Karrieren', 'Carrières', '경력', 'キャリア', 'Karera', 'المهن', '职业', 'Carriere', 'Carreiras', 'Nghề nghiệp'),
  'Financial': tr('Finanzas', 'Finanzen', 'Financier', '재정', '財務', 'Pinansyal', 'مالي', '财务', 'Finanziario', 'Financeiro', 'Tài chính'),
  'Healthcare': tr('Atención médica', 'Gesundheit', 'Santé', '의료', '医療', 'Pangkalusugan', 'الرعاية الصحية', '医疗', 'Sanità', 'Saúde', 'Y tế'),
  'Military Portals': tr('Portales militares', 'Militärportale', 'Portails militaires', '군 포털', '軍ポータル', 'Military portals', 'بوابات عسكرية', '军事门户', 'Portali militari', 'Portais militares', 'Cổng quân sự'),
  'PCS & Housing': tr('PCS y vivienda', 'PCS und Wohnen', 'PCS et logement', 'PCS 및 주거', 'PCSと住宅', 'PCS at pabahay', 'PCS والسكن', 'PCS 与住房', 'PCS e alloggio', 'PCS e moradia', 'PCS và nhà ở'),
  'Deployment': tr('Despliegue', 'Einsatz', 'Déploiement', '배치', '展開', 'Deployment', 'الانتشار', '部署', 'Schieramento', 'Desdobramento', 'Triển khai'),
  'EFMP': tr('EFMP', 'EFMP', 'EFMP', 'EFMP', 'EFMP', 'EFMP', 'EFMP', 'EFMP', 'EFMP', 'EFMP', 'EFMP'),
  'Permanent Resident': tr('Residente permanente', 'Daueraufenthalt', 'Résident permanent', '영주권', '永住者', 'Permanent resident', 'المقيم الدائم', '永久居民', 'Residente permanente', 'Residente permanente', 'Thường trú nhân'),
  'Pets': tr('Mascotas', 'Haustiere', 'Animaux', '반려동물', 'ペット', 'Alagang hayop', 'الحيوانات الأليفة', '宠物', 'Animali domestici', 'Animais de estimação', 'Thú cưng'),
  'Schools': tr('Escuelas', 'Schulen', 'Écoles', '학교', '学校', 'Mga paaralan', 'المدارس', '学校', 'Scuole', 'Escolas', 'Trường học'),
  'Home Locator': tr('Buscador de vivienda', 'Wohnungssuche', 'Recherche de logement', '주택 찾기', '住宅検索', 'Home locator', 'البحث عن سكن', '住房查找', 'Ricerca casa', 'Localizador de moradia', 'Tìm nhà ở'),
  'Inventory & Claims': tr('Inventario y reclamos', 'Inventar und Ansprüche', 'Inventaire et réclamations', '재고 및 청구', '在庫と請求', 'Imbentaryo at claims', 'الجرد والمطالبات', '清单与索赔', 'Inventario e reclami', 'Inventário e reivindicações', 'Kiểm kê và khiếu nại'),
  'Move Aid': tr('Ayuda para mudanza', 'Umzugshilfe', 'Aide au déménagement', '이사 지원', '引越し支援', 'Tulong sa paglipat', 'مساعدة الانتقال', '搬家援助', 'Aiuto trasloco', 'Ajuda para mudança', 'Hỗ trợ chuyển nhà'),
  'VA Loan': tr('Préstamo VA', 'VA-Darlehen', 'Prêt VA', 'VA 대출', 'VAローン', 'VA loan', 'قرض VA', 'VA 贷款', 'Prestito VA', 'Empréstimo VA', 'Khoản vay VA'),
  'Unit': tr('Unidad', 'Einheit', 'Unité', '부대', '部隊', 'Yunit', 'الوحدة', '单位', 'Unità', 'Unidade', 'Đơn vị'),
  'Family & Admin': tr('Familia y administración', 'Familie und Verwaltung', 'Famille et admin', '가족 및 행정', '家族と管理', 'Pamilya at admin', 'العائلة والإدارة', '家庭与行政', 'Famiglia e amministrazione', 'Família e administração', 'Gia đình và hành chính'),
  'Housing': tr('Vivienda', 'Wohnen', 'Logement', '주거', '住宅', 'Pabahay', 'السكن', '住房', 'Alloggio', 'Moradia', 'Nhà ở'),
  'Household Goods': tr('Bienes del hogar', 'Hausrat', 'Biens ménagers', '가정용품', '家財', 'Gamit sa bahay', 'الأغراض المنزلية', '家庭物品', 'Beni domestici', 'Bens domésticos', 'Đồ gia dụng'),
  'Medical': tr('Médico', 'Medizinisch', 'Médical', '의료', '医療', 'Medikal', 'طبي', '医疗', 'Medico', 'Médico', 'Y tế'),
  'Travel & Finance': tr('Viaje y finanzas', 'Reise und Finanzen', 'Voyage et finances', '여행 및 재정', '旅行と財務', 'Biyahe at pinansya', 'السفر والمالية', '旅行与财务', 'Viaggio e finanze', 'Viagem e finanças', 'Đi lại và tài chính'),
  'Green Card': tr('Tarjeta verde', 'Green Card', 'Carte verte', '영주권 카드', 'グリーンカード', 'Green card', 'البطاقة الخضراء', '绿卡', 'Carta verde', 'Green Card', 'Thẻ xanh'),
  'Citizenship': tr('Ciudadanía', 'Staatsbürgerschaft', 'Citoyenneté', '시민권', '市民権', 'Pagkamamamayan', 'الجنسية', '公民身份', 'Cittadinanza', 'Cidadania', 'Quốc tịch'),
  'Military Legal Help': tr('Ayuda legal militar', 'Militärische Rechtshilfe', 'Aide juridique militaire', '군 법률 지원', '軍法律支援', 'Tulong legal ng militar', 'مساعدة قانونية عسكرية', '军事法律帮助', 'Assistenza legale militare', 'Ajuda jurídica militar', 'Trợ giúp pháp lý quân sự'),
  'Common Phrases': tr('Frases comunes', 'Häufige Sätze', 'Phrases courantes', '일반 문구', 'よく使う表現', 'Karaniwang parirala', 'عبارات شائعة', '常用短语', 'Frasi comuni', 'Frases comuns', 'Cụm từ thông dụng'),
  'Translate': tr('Traducir', 'Übersetzen', 'Traduire', '번역', '翻訳', 'Isalin', 'ترجمة', '翻译', 'Traduci', 'Traduzir', 'Dịch'),
  'Route Planner': tr('Planificador de ruta', 'Routenplaner', 'Planificateur d’itinéraire', '경로 계획', 'ルート計画', 'Tagaplano ng ruta', 'مخطط المسار', '路线规划', 'Pianificatore percorso', 'Planejador de rota', 'Lập tuyến đường'),
  'Directions': tr('Indicaciones', 'Wegbeschreibung', 'Itinéraire', '길 안내', '道順', 'Direksyon', 'الاتجاهات', '路线', 'Indicazioni', 'Direções', 'Chỉ đường'),
  'Saved Routes': tr('Rutas guardadas', 'Gespeicherte Routen', 'Itinéraires enregistrés', '저장된 경로', '保存済みルート', 'Naka-save na ruta', 'المسارات المحفوظة', '已保存路线', 'Percorsi salvati', 'Rotas salvas', 'Tuyến đã lưu'),
  'Base Map': tr('Mapa de base', 'Basiskarte', 'Carte de base', '기지 지도', '基地地図', 'Mapa ng base', 'خريطة القاعدة', '基地地图', 'Mappa base', 'Mapa da base', 'Bản đồ căn cứ'),
  'Services': tr('Servicios', 'Dienste', 'Services', '서비스', '礼拝・サービス', 'Mga serbisyo', 'الخدمات', '服务', 'Servizi', 'Serviços', 'Dịch vụ'),
  'Orders Received': tr('Órdenes recibidas', 'Befehle erhalten', 'Ordres reçus', '명령 수령', '命令受領', 'Natanggap ang orders', 'تم استلام الأوامر', '已收到命令', 'Ordini ricevuti', 'Ordens recebidas', 'Đã nhận lệnh'),
  '90 Days Out': tr('Faltan 90 días', '90 Tage vorher', 'À 90 jours', '90일 전', '90日前', '90 araw bago umalis', 'قبل 90 يوماً', '提前90天', '90 giorni prima', '90 dias antes', 'Còn 90 ngày'),
  '60 Days Out': tr('Faltan 60 días', '60 Tage vorher', 'À 60 jours', '60일 전', '60日前', '60 araw bago umalis', 'قبل 60 يوماً', '提前60天', '60 giorni prima', '60 dias antes', 'Còn 60 ngày'),
  '30 Days Out': tr('Faltan 30 días', '30 Tage vorher', 'À 30 jours', '30일 전', '30日前', '30 araw bago umalis', 'قبل 30 يوماً', '提前30天', '30 dias antes', '30 dias antes', 'Còn 30 ngày'),
  'Move Week': tr('Semana de mudanza', 'Umzugswoche', 'Semaine du déménagement', '이사 주간', '引越し週', 'Linggo ng paglipat', 'أسبوع الانتقال', '搬家周', 'Settimana del trasloco', 'Semana da mudança', 'Tuần chuyển nhà'),
  'In-Processing': tr('Incorporación', 'Anmeldung vor Ort', 'Accueil administratif', '전입 처리', '着任手続き', 'In-processing', 'إجراءات الوصول', '报到处理', 'In-processing', 'Processamento de chegada', 'Làm thủ tục đến'),
  'Overall Progress': tr('Progreso general', 'Gesamtfortschritt', 'Progression globale', '전체 진행률', '全体の進捗', 'Kabuuang progreso', 'التقدم العام', '总体进度', 'Progresso complessivo', 'Progresso geral', 'Tiến độ tổng thể'),
  'tasks': tr('tareas', 'Aufgaben', 'tâches', '작업', 'タスク', 'gawain', 'مهام', '任务', 'attività', 'tarefas', 'nhiệm vụ'),
  'tasks remaining': tr('tareas pendientes', 'Aufgaben verbleiben', 'tâches restantes', '남은 작업', '残りタスク', 'natitirang gawain', 'مهام متبقية', '剩余任务', 'attività rimanenti', 'tarefas restantes', 'nhiệm vụ còn lại'),
  'COMPLETE': tr('COMPLETO', 'ABGESCHLOSSEN', 'TERMINÉ', '완료', '完了', 'KUMPLETO', 'مكتمل', '完成', 'COMPLETO', 'CONCLUÍDO', 'HOÀN TẤT'),
  'Enrollment / Admissions': tr('Inscripción / admisiones', 'Einschreibung / Zulassung', 'Inscription / admissions', '등록 / 입학', '入学 / 出願', 'Enrollment / admissions', 'التسجيل / القبول', '注册 / 招生', 'Iscrizione / ammissioni', 'Matrícula / admissões', 'Ghi danh / tuyển sinh'),
  'College Website': tr('Sitio de la universidad', 'Website der Hochschule', 'Site de l’établissement', '대학 웹사이트', '大学ウェブサイト', 'Website ng kolehiyo', 'موقع الكلية', '大学网站', 'Sito del college', 'Site da faculdade', 'Trang web trường'),
  'Verified enrollment link': tr('Enlace de inscripción verificado', 'Verifizierter Einschreibungslink', 'Lien d’inscription vérifié', '확인된 등록 링크', '確認済み入学リンク', 'Beripikadong enrollment link', 'رابط تسجيل موثّق', '已验证注册链接', 'Link iscrizione verificato', 'Link de matrícula verificado', 'Liên kết ghi danh đã xác minh'),
  'Enrollment link under official review': tr('Enlace de inscripción en revisión oficial', 'Einschreibungslink in offizieller Prüfung', 'Lien d’inscription en vérification officielle', '등록 링크 공식 검토 중', '入学リンクは公式確認中', 'Enrollment link ay sinusuri pa', 'رابط التسجيل قيد المراجعة الرسمية', '注册链接正在官方审核', 'Link iscrizione in verifica ufficiale', 'Link de matrícula em revisão oficial', 'Liên kết ghi danh đang được xác minh'),
  'In Progress': tr('En progreso', 'In Bearbeitung', 'En cours', '진행 중', '進行中', 'Kasalukuyang ginagawa', 'قيد التنفيذ', '进行中', 'In corso', 'Em andamento', 'Đang tiến hành'),
  'Move Complete': tr('Mudanza completada', 'Umzug abgeschlossen', 'Déménagement terminé', '이사 완료', '引越し完了', 'Kumpleto na ang paglipat', 'اكتمل الانتقال', '搬迁完成', 'Trasloco completato', 'Mudança concluída', 'Hoàn tất chuyển nhà'),
  'Schools & Childcare': tr('Escuelas y guardería', 'Schulen & Kinderbetreuung', 'Écoles et garde d\'enfants', '학교 및 보육', '学校と保育', 'Mga Paaralan at Pag-aalaga ng Bata', 'المدارس ورعاية الأطفال', '学校与托儿', 'Scuole e asilo nido', 'Escolas e creche', 'Trường học và trông trẻ'),
  'Search by Location': tr('Buscar por ubicación', 'Nach Standort suchen', 'Chercher par lieu', '위치별 검색', '場所で検索', 'Maghanap sa lokasyon', 'البحث حسب الموقع', '按地点搜索', 'Cerca per posizione', 'Buscar por localização', 'Tìm theo vị trí'),
  'Open active source': tr('Abrir fuente activa', 'Aktive Quelle öffnen', 'Ouvrir la source active', '활성 출처 열기', 'アクティブソースを開く', 'Buksan ang aktibong source', 'فتح المصدر النشط', '打开活跃来源', 'Apri fonte attiva', 'Abrir fonte ativa', 'Mở nguồn hoạt động'),
  'Apply Online': tr('Solicitar en línea', 'Online bewerben', 'Postuler en ligne', '온라인 신청', 'オンラインで申請', 'Mag-apply online', 'التقدم عبر الإنترنت', '在线申请', 'Candidati online', 'Candidatar-se online', 'Đăng ký trực tuyến'),
  'Pending Actions': tr('Acciones pendientes', 'Ausstehende Aktionen', 'Actions en attente', '대기 중인 작업', '保留中のアクション', 'Mga nakabinbing aksyon', 'الإجراءات المعلقة', '待处理操作', 'Azioni in sospeso', 'Ações pendentes', 'Hành động đang chờ'),
  'Overdue Action': tr('Acción vencida', 'Überfällige Aktion', 'Action en retard', '기한 초과 작업', '期限超過のアクション', 'Nasobrahan nang aksyon', 'إجراء متأخر', '逾期操作', 'Azione scaduta', 'Ação em atraso', 'Hành động quá hạn'),
  'Overdue Actions': tr('Acciones vencidas', 'Überfällige Aktionen', 'Actions en retard', '기한 초과 작업들', '期限超過のアクション', 'Mga nasobrahan nang aksyon', 'إجراءات متأخرة', '逾期操作', 'Azioni scadute', 'Ações em atraso', 'Các hành động quá hạn'),
  'Due Now': tr('Vence ahora', 'Jetzt fällig', 'À faire maintenant', '지금 기한', '今すぐ', 'Kailangang gawin na ngayon', 'مستحق الآن', '现在到期', 'Scade ora', 'Vence agora', 'Đến hạn ngay'),
  'task remaining': tr('tarea pendiente', 'Aufgabe verbleibt', 'tâche restante', '남은 작업', '残りタスク', 'natitirang gawain', 'مهمة متبقية', '剩余任务', 'attività rimanente', 'tarefa restante', 'nhiệm vụ còn lại'),
  'Veteran Owned & Veteran Operated Businesses': tr('Negocios de propiedad y operación de veteranos', 'Unternehmen von Veteranen', 'Entreprises détenues par des vétérans', '재향군인 소유·운영 사업체', '退役軍人所有・経営の企機', 'Mga negosyong pag-aari at pinapatakbo ng beterano', 'مشاريع مملوكة ومُدارة من محاربين قدامى', '退伍军人拥有和经营的企业', 'Imprese di veterani', 'Empresas de veteranos', 'Doanh nghiệp cựu chiến binh'),

  // Common UI content strings added 2026-05 to improve full-app translation coverage.
  'Active Duty': tr('Servicio activo', 'Aktiver Dienst', 'Service actif', '현역', '現役', 'Active duty', 'الخدمة الفعلية', '现役', 'Servizio attivo', 'Serviço ativo', 'Tại ngũ'),
  'Reserve': tr('Reserva', 'Reserve', 'Réserve', '예비군', '予備役', 'Reserve', 'الاحتياط', '预备役', 'Riserva', 'Reserva', 'Dự bị'),
  'National Guard': tr('Guardia Nacional', 'Nationalgarde', 'Garde nationale', '주방위군', '州兵', 'National Guard', 'الحرس الوطني', '国民警卫队', 'Guardia Nazionale', 'Guarda Nacional', 'Vệ binh Quốc gia'),
  'AGR': tr('AGR', 'AGR', 'AGR', 'AGR', 'AGR', 'AGR', 'AGR', 'AGR', 'AGR', 'AGR', 'AGR'),
  'Dependent': tr('Dependiente', 'Angehöriger', 'Personne à charge', '가족 구성원', '扶養家族', 'Dependent', 'تابع', '家属', 'Familiare a carico', 'Dependente', 'Người phụ thuộc'),
  'No Preference': tr('Sin preferencia', 'Keine Präferenz', 'Aucune préférence', '선호 없음', '希望なし', 'Walang preferensya', 'لا تفضيل', '无偏好', 'Nessuna preferenza', 'Sem preferência', 'Không ưu tiên'),
  'Component': tr('Componente', 'Komponente', 'Composante', '구성', '区分', 'Component', 'المكون', '组别', 'Componente', 'Componente', 'Thành phần'),
  'COMPONENT': tr('COMPONENTE', 'KOMPONENTE', 'COMPOSANTE', '구성', '区分', 'COMPONENT', 'المكون', '组别', 'COMPONENTE', 'COMPONENTE', 'THÀNH PHẦN'),
  'FIRST NAME': tr('NOMBRE', 'VORNAME', 'PRÉNOM', '이름', '名', 'PANGALAN', 'الاسم الأول', '名字', 'NOME', 'NOME', 'TÊN'),
  'LAST NAME': tr('APELLIDO', 'NACHNAME', 'NOM', '성', '姓', 'APELYIDO', 'اسم العائلة', '姓氏', 'COGNOME', 'SOBRENOME', 'HỌ'),
  'First Name': tr('Nombre', 'Vorname', 'Prénom', '이름', '名', 'Pangalan', 'الاسم الأول', '名字', 'Nome', 'Nome', 'Tên'),
  'Last Name': tr('Apellido', 'Nachname', 'Nom', '성', '姓', 'Apelyido', 'اسم العائلة', '姓氏', 'Cognome', 'Sobrenome', 'Họ'),
  'PAY GRADE & RANK': tr('GRADO Y RANGO', 'BESOLDUNGSGRUPPE & DIENSTGRAD', 'GRADE ET RANG', '계급 및 급여등급', '給与等級と階級', 'PAY GRADE AT RANK', 'الرتبة ودرجة الراتب', '军衔与级别', 'GRADO E RANGO', 'GRADUAÇÃO E POSTO', 'CẤP BẬC'),
  'Pay Grade & Rank': tr('Grado y rango', 'Besoldungsgruppe & Dienstgrad', 'Grade et rang', '계급 및 급여등급', '給与等級と階級', 'Pay grade at rank', 'الرتبة ودرجة الراتب', '军衔与级别', 'Grado e rango', 'Graduação e posto', 'Cấp bậc'),
  'PREFERRED LANGUAGE': tr('IDIOMA PREFERIDO', 'BEVORZUGTE SPRACHE', 'LANGUE PRÉFÉRÉE', '선호 언어', '希望言語', 'GUSTONG WIKA', 'اللغة المفضلة', '首选语言', 'LINGUA PREFERITA', 'IDIOMA PREFERIDO', 'NGÔN NGỮ ƯU TIÊN'),
  'optional': tr('opcional', 'optional', 'facultatif', '선택', '任意', 'opsyonal', 'اختياري', '可选', 'opzionale', 'opcional', 'tùy chọn'),
  '(optional)': tr('(opcional)', '(optional)', '(facultatif)', '(선택)', '(任意)', '(opsyonal)', '(اختياري)', '(可选)', '(opzionale)', '(opcional)', '(tùy chọn)'),
  'Branch & Profile': tr('Rama y perfil', 'Teilstreitkraft & Profil', 'Branche et profil', '군별 및 프로필', '軍種とプロフィール', 'Sangay at profile', 'الفرع والملف الشخصي', '军种与档案', 'Forza armata e profilo', 'Ramo e perfil', 'Quân chủng và hồ sơ'),

  // Branch mottos & taglines
  "This We'll Defend": tr('Esto defenderemos', 'Dies werden wir verteidigen', 'Voici ce que nous défendrons', '이를 우리는 지킨다', 'これを我々は守る', 'Ito ang aming ipagtatanggol', 'هذا ما سندافع عنه', '此乃我等所卫', 'Questo difenderemo', 'Isto defenderemos', 'Đây là điều chúng tôi bảo vệ'),
  'A Global Force for Good': tr('Una fuerza global para el bien', 'Eine globale Kraft zum Guten', 'Une force mondiale pour le bien', '선을 위한 글로벌 군대', '善のための地球規模の力', 'Pandaigdigang puwersa para sa kabutihan', 'قوة عالمية للخير', '为善而生的全球力量', 'Una forza globale per il bene', 'Uma força global para o bem', 'Lực lượng toàn cầu vì điều thiện'),
  'The Few. The Proud.': tr('Los pocos. Los orgullosos.', 'Die Wenigen. Die Stolzen.', 'Les rares. Les fiers.', '소수, 자랑스러운 자.', '少数の誇り高き者。', 'Ang iilan. Ang ipinagmamalaki.', 'القلة. الفخورون.', '少数精英，引以为傲。', 'I pochi. I fieri.', 'Os poucos. Os orgulhosos.', 'Số ít. Niềm tự hào.'),
  'Fly–Fight–Win': tr('Volar–Luchar–Vencer', 'Fliegen–Kämpfen–Siegen', 'Voler–Combattre–Vaincre', '비행–전투–승리', '飛び・戦い・勝つ', 'Lipad–Lumaban–Manalo', 'حلّق–قاتل–انتصر', '飞行–战斗–胜利', 'Volare–Combattere–Vincere', 'Voar–Lutar–Vencer', 'Bay–Chiến–Thắng'),
  'Guardians of the High Ground': tr('Guardianes del terreno elevado', 'Wächter der Höhe', 'Gardiens des hauteurs', '높은 지대의 수호자', '高所の守護者', 'Tagapagbantay ng matataas', 'حراس المرتفعات', '高地的守护者', 'Guardiani della posizione elevata', 'Guardiões das alturas', 'Người bảo vệ cao điểm'),
  'Always Ready': tr('Siempre listos', 'Stets bereit', 'Toujours prêt', '항상 준비', '常に備える', 'Laging handa', 'دائماً مستعد', '时刻准备', 'Sempre pronti', 'Sempre pronto', 'Luôn sẵn sàng'),
  'HOOAH': tr('HOOAH', 'HOOAH', 'HOOAH', 'HOOAH', 'HOOAH', 'HOOAH', 'HOOAH', 'HOOAH', 'HOOAH', 'HOOAH', 'HOOAH'),
  'BRAVO ZULU': tr('BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU', 'BRAVO ZULU'),
  'SEMPER FIDELIS': tr('SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS', 'SEMPER FIDELIS'),
  'AIM HIGH': tr('APUNTA ALTO', 'ZIELE HOCH', 'VISE HAUT', '높이 겨냥하라', '高く狙え', 'TUMINGIN SA TAAS', 'استهدف العالي', '志存高远', 'PUNTA IN ALTO', 'MIRE ALTO', 'NHẮM CAO'),
  'SEMPER SUPRA': tr('SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA', 'SEMPER SUPRA'),
  'SEMPER PARATUS': tr('SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS', 'SEMPER PARATUS'),

  // Headers & section labels
  'SECURITY CONTROLS': tr('CONTROLES DE SEGURIDAD', 'SICHERHEITSKONTROLLEN', 'CONTRÔLES DE SÉCURITÉ', '보안 제어', 'セキュリティ制御', 'SECURITY CONTROLS', 'ضوابط الأمان', '安全控制', 'CONTROLLI DI SICUREZZA', 'CONTROLES DE SEGURANÇA', 'KIỂM SOÁT BẢO MẬT'),
  'Security Controls': tr('Controles de seguridad', 'Sicherheitskontrollen', 'Contrôles de sécurité', '보안 제어', 'セキュリティ制御', 'Security controls', 'ضوابط الأمان', '安全控制', 'Controlli di sicurezza', 'Controles de segurança', 'Kiểm soát bảo mật'),
  'My Profile': tr('Mi perfil', 'Mein Profil', 'Mon profil', '내 프로필', 'マイプロフィール', 'Aking profile', 'ملفي الشخصي', '我的档案', 'Il mio profilo', 'Meu perfil', 'Hồ sơ của tôi'),
  'MY PROFILE': tr('MI PERFIL', 'MEIN PROFIL', 'MON PROFIL', '내 프로필', 'マイプロフィール', 'AKING PROFILE', 'ملفي الشخصي', '我的档案', 'IL MIO PROFILO', 'MEU PERFIL', 'HỒ SƠ CỦA TÔI'),
  'YOUR PROFILE': tr('TU PERFIL', 'IHR PROFIL', 'VOTRE PROFIL', '귀하의 프로필', 'あなたのプロフィール', 'IYONG PROFILE', 'ملفك الشخصي', '您的档案', 'IL TUO PROFILO', 'SEU PERFIL', 'HỒ SƠ CỦA BẠN'),
  'BASE INTELLIGENCE': tr('INTELIGENCIA DE BASE', 'STANDORTINFORMATIONEN', 'INFORMATIONS BASE', '기지 정보', '基地情報', 'BASE INTELLIGENCE', 'معلومات القاعدة', '基地情报', 'INFORMAZIONI BASE', 'INTELIGÊNCIA DA BASE', 'THÔNG TIN CĂN CỨ'),
  'BAH ENTITLEMENT CALCULATOR': tr('CALCULADORA DE BAH', 'BAH-RECHNER', 'CALCULATEUR BAH', 'BAH 계산기', 'BAH計算機', 'BAH calculator', 'حاسبة BAH', 'BAH 计算器', 'Calcolatore BAH', 'Calculadora BAH', 'Máy tính BAH'),
  'DUTY STATION DIRECTORY': tr('DIRECTORIO DE INSTALACIONES', 'STANDORTVERZEICHNIS', 'ANNUAIRE DES INSTALLATIONS', '기지 목록', '基地ディレクトリ', 'Duty station directory', 'دليل المنشآت', '基地目录', 'Directory installazioni', 'Diretório de instalações', 'Danh bạ căn cứ'),
  'Installation Intelligence': tr('Inteligencia de instalación', 'Standortinformationen', 'Informations installation', '기지 정보', '基地情報', 'Installation intelligence', 'معلومات المنشأة', '基地情报', 'Informazioni installazione', 'Inteligência da instalação', 'Thông tin căn cứ'),
  'ON-POST HOUSING WAIT TIME': tr('TIEMPO DE ESPERA EN POST', 'WARTEZEIT POSTWOHNUNG', 'TEMPS D\'ATTENTE LOGEMENT', '기지 내 주택 대기시간', '基地内住宅待機', 'WAITLIST NG ON-POST HOUSING', 'مدة انتظار سكن القاعدة', '基地内住房等候时间', 'TEMPO ATTESA ALLOGGIO BASE', 'TEMPO DE ESPERA NA BASE', 'THỜI GIAN CHỜ NHÀ TRONG CĂN CỨ'),
  'ON-POST OPERATOR': tr('OPERADOR EN POST', 'BASIS-BETREIBER', 'OPÉRATEUR DE BASE', '기지 운영자', '基地運営者', 'On-post operator', 'مشغل القاعدة', '基地运营商', 'Gestore della base', 'Operador na base', 'Đơn vị quản lý căn cứ'),
  'OFF-POST NOTES': tr('NOTAS FUERA DEL POST', 'AUSSERHALB DES STANDORTS', 'NOTES HORS BASE', '기지 외부 정보', '基地外メモ', 'Off-post notes', 'ملاحظات خارج القاعدة', '基地外注释', 'Note fuori base', 'Notas fora da base', 'Ghi chú ngoài căn cứ'),
  'TRICARE REGION': tr('REGIÓN TRICARE', 'TRICARE-REGION', 'RÉGION TRICARE', 'TRICARE 지역', 'TRICAREリージョン', 'TRICARE region', 'منطقة TRICARE', 'TRICARE 区域', 'Regione TRICARE', 'Região TRICARE', 'Khu vực TRICARE'),
  'MILITARY TREATMENT FACILITY (MTF)': tr('CENTRO MILITAR DE TRATAMIENTO (MTF)', 'MILITÄRISCHE BEHANDLUNGSEINRICHTUNG (MTF)', 'INSTALLATION DE TRAITEMENT MILITAIRE (MTF)', '군 의료시설 (MTF)', '軍医療施設 (MTF)', 'Military Treatment Facility (MTF)', 'منشأة العلاج العسكرية (MTF)', '军事医疗机构 (MTF)', 'Struttura medica militare (MTF)', 'Instalação Médica Militar (MTF)', 'Cơ sở Y tế Quân đội (MTF)'),
  'Prime Available': tr('Prime disponible', 'Prime verfügbar', 'Prime disponible', 'Prime 이용가능', 'Prime利用可', 'Prime available', 'Prime متاح', 'Prime 可用', 'Prime disponibile', 'Prime disponível', 'Có Prime'),
  'Select Available': tr('Select disponible', 'Select verfügbar', 'Select disponible', 'Select 이용가능', 'Select利用可', 'Select available', 'Select متاح', 'Select 可用', 'Select disponibile', 'Select disponível', 'Có Select'),
  'Annual Projection': tr('Proyección anual', 'Jährliche Schätzung', 'Projection annuelle', '연간 예상', '年間予測', 'Annual projection', 'التوقع السنوي', '年度预估', 'Proiezione annuale', 'Projeção anual', 'Dự kiến hằng năm'),
  'Monthly BAH': tr('BAH mensual', 'Monatliche BAH', 'BAH mensuel', '월간 BAH', '月額BAH', 'Monthly BAH', 'BAH الشهري', '月度 BAH', 'BAH mensile', 'BAH mensal', 'BAH hằng tháng'),
  'Months': tr('Meses', 'Monate', 'Mois', '개월', 'ヶ月', 'Buwan', 'أشهر', '个月', 'Mesi', 'Meses', 'Tháng'),
  'Annual BAH': tr('BAH anual', 'Jährliche BAH', 'BAH annuel', '연간 BAH', '年額BAH', 'Annual BAH', 'BAH السنوي', '年度 BAH', 'BAH annuale', 'BAH anual', 'BAH hằng năm'),
  'With Dependents': tr('Con dependientes', 'Mit Angehörigen', 'Avec personnes à charge', '부양가족 있음', '扶養家族あり', 'May dependents', 'مع التابعين', '有家属', 'Con familiari', 'Com dependentes', 'Có người phụ thuộc'),
  'Without Dependents': tr('Sin dependientes', 'Ohne Angehörige', 'Sans personnes à charge', '부양가족 없음', '扶養家族なし', 'Walang dependents', 'بدون التابعين', '无家属', 'Senza familiari', 'Sem dependentes', 'Không có người phụ thuộc'),
  'Pay Grade': tr('Grado de pago', 'Besoldungsgruppe', 'Grade', '급여등급', '給与等級', 'Pay grade', 'درجة الراتب', '军衔', 'Grado retributivo', 'Graduação', 'Cấp lương'),
  'Dependents': tr('Dependientes', 'Angehörige', 'Personnes à charge', '부양가족', '扶養家族', 'Dependents', 'التابعون', '家属', 'Familiari a carico', 'Dependentes', 'Người phụ thuộc'),
  'Gaining Duty Station': tr('Estación de destino', 'Zielstandort', 'Affectation d\'arrivée', '도착 기지', '赴任先基地', 'Destinasyon', 'محطة الواجب الجديدة', '新驻地', 'Stazione di arrivo', 'Estação de destino', 'Trạm đến'),
  'TRICARE': tr('TRICARE', 'TRICARE', 'TRICARE', 'TRICARE', 'TRICARE', 'TRICARE', 'TRICARE', 'TRICARE', 'TRICARE', 'TRICARE', 'TRICARE'),
  'Contacts': tr('Contactos', 'Kontakte', 'Contacts', '연락처', '連絡先', 'Mga contact', 'جهات الاتصال', '联系方式', 'Contatti', 'Contatos', 'Liên hệ'),
  'Community Reviews': tr('Reseñas de la comunidad', 'Community-Bewertungen', 'Avis de la communauté', '커뮤니티 리뷰', 'コミュニティレビュー', 'Mga review ng komunidad', 'مراجعات المجتمع', '社区评价', 'Recensioni della comunità', 'Avaliações da comunidade', 'Đánh giá cộng đồng'),
  'Childcare': tr('Cuidado infantil', 'Kinderbetreuung', 'Garde d\'enfants', '보육', '保育', 'Pag-aalaga ng bata', 'رعاية الأطفال', '托儿', 'Asilo nido', 'Creche', 'Trông trẻ'),
  'Reviewer rank': tr('Rango del revisor', 'Rang des Verfassers', 'Rang du critique', '평가자 계급', 'レビュアー階級', 'Rank ng reviewer', 'رتبة المراجع', '评论者军衔', 'Rango del recensore', 'Posto do avaliador', 'Cấp bậc người đánh giá'),
  'Military Family Verified': tr('Verificado por familia militar', 'Militärfamilie verifiziert', 'Famille militaire vérifiée', '군 가족 인증', '軍人家族認証済み', 'Military Family Verified', 'تم التحقق من عائلة عسكرية', '军人家庭已认证', 'Famiglia militare verificata', 'Família militar verificada', 'Đã xác minh gia đình quân nhân'),

  // Onboarding
  'Your move, simplified.': tr('Tu mudanza, simplificada.', 'Ihr Umzug, vereinfacht.', 'Votre déménagement, simplifié.', '이사 준비를 간단하게.', '引越し準備をシンプルに。', 'Pinapadali ang iyong paglipat.', 'انتقالك بشكل أبسط.', '搬迁，从未如此简单。', 'Il tuo trasloco, semplificato.', 'Sua mudança, simplificada.', 'Chuyển nhà của bạn, đơn giản hơn.'),
  'Your Bases': tr('Tus bases', 'Ihre Standorte', 'Vos bases', '귀하의 기지', 'あなたの基地', 'Iyong bases', 'قواعدك', '您的基地', 'Le tue basi', 'Suas bases', 'Căn cứ của bạn'),
  'Your Profile': tr('Tu perfil', 'Ihr Profil', 'Votre profil', '귀하의 프로필', 'あなたのプロフィール', 'Iyong profile', 'ملفك الشخصي', '您的档案', 'Il tuo profilo', 'Seu perfil', 'Hồ sơ của bạn'),
  'Build My PCS Plan': tr('Crear mi plan PCS', 'Meinen PCS-Plan erstellen', 'Créer mon plan PCS', '나의 PCS 계획 만들기', 'PCSプランを作成', 'Gumawa ng PCS plan', 'إنشاء خطة PCS', '生成我的 PCS 计划', 'Crea il mio piano PCS', 'Criar meu plano PCS', 'Tạo kế hoạch PCS của tôi'),
  'DEPARTING FROM (LOSING INSTALLATION)': tr('PARTIENDO DE (INSTALACIÓN DE SALIDA)', 'ABREISE VON (VERLASSENER STANDORT)', 'DÉPART (INSTALLATION DE DÉPART)', '출발 (이전 기지)', '出発元（離任基地）', 'PAALIS GALING (LOSING INSTALLATION)', 'مغادرة من (المنشأة السابقة)', '离开基地（原驻地）', 'PARTENZA DA (BASE DI ORIGINE)', 'SAINDO DE (INSTALAÇÃO ANTERIOR)', 'KHỞI HÀNH TỪ (CĂN CỨ CŨ)'),
  'REPORTING TO (GAINING INSTALLATION)': tr('REPORTANDO A (INSTALACIÓN DE DESTINO)', 'MELDUNG BEI (ZIELSTANDORT)', 'AFFECTATION À (INSTALLATION D\'ARRIVÉE)', '도착 (새 기지)', '着任先（赴任基地）', 'PUPUNTA SA (GAINING INSTALLATION)', 'الوصول إلى (المنشأة الجديدة)', '新驻地（前往基地）', 'DESTINAZIONE (BASE D\'ARRIVO)', 'INDO PARA (NOVA INSTALAÇÃO)', 'BÁO CÁO ĐẾN (CĂN CỨ MỚI)'),
  'DEPARTING DATE': tr('FECHA DE SALIDA', 'ABREISEDATUM', 'DATE DE DÉPART', '출발일', '出発日', 'PETSA NG PAGALIS', 'تاريخ المغادرة', '出发日期', 'DATA DI PARTENZA', 'DATA DE PARTIDA', 'NGÀY KHỞI HÀNH'),
  'OCONUS — Overseas move detected': tr('OCONUS — Mudanza al extranjero detectada', 'OCONUS — Auslandsumzug erkannt', 'OCONUS — Déménagement à l\'étranger détecté', 'OCONUS — 해외 이동 감지', 'OCONUS — 海外移動を検出', 'OCONUS — Natukoy ang overseas move', 'OCONUS — تم اكتشاف انتقال للخارج', 'OCONUS — 检测到海外搬迁', 'OCONUS — Trasferimento all\'estero rilevato', 'OCONUS — Mudança internacional detectada', 'OCONUS — Phát hiện chuyển ra nước ngoài'),

  // Common status & action words
  'Auto-filled from profile': tr('Autocompletado del perfil', 'Aus Profil ausgefüllt', 'Rempli depuis le profil', '프로필에서 자동입력', 'プロフィールから自動入力', 'Auto-fill mula sa profile', 'تعبئة تلقائية من الملف', '从档案自动填写', 'Compilato automaticamente dal profilo', 'Preenchido pelo perfil', 'Tự điền từ hồ sơ'),
  'Change': tr('Cambiar', 'Ändern', 'Modifier', '변경', '変更', 'Baguhin', 'تغيير', '更改', 'Cambia', 'Alterar', 'Thay đổi'),
  'Reset': tr('Restablecer', 'Zurücksetzen', 'Réinitialiser', '초기화', 'リセット', 'I-reset', 'إعادة الضبط', '重置', 'Reimposta', 'Redefinir', 'Đặt lại'),
  'Save': tr('Guardar', 'Speichern', 'Enregistrer', '저장', '保存', 'I-save', 'حفظ', '保存', 'Salva', 'Salvar', 'Lưu'),
  'Loading...': tr('Cargando...', 'Lädt…', 'Chargement…', '로딩 중...', '読み込み中...', 'Naglo-load...', 'جاري التحميل...', '加载中...', 'Caricamento…', 'Carregando...', 'Đang tải...'),
  'Today': tr('Hoy', 'Heute', 'Aujourd\'hui', '오늘', '今日', 'Ngayon', 'اليوم', '今天', 'Oggi', 'Hoje', 'Hôm nay'),
  'Yesterday': tr('Ayer', 'Gestern', 'Hier', '어제', '昨日', 'Kahapon', 'أمس', '昨天', 'Ieri', 'Ontem', 'Hôm qua'),
  'Apply': tr('Aplicar', 'Anwenden', 'Appliquer', '적용', '適用', 'Mag-apply', 'تطبيق', '应用', 'Applica', 'Aplicar', 'Áp dụng'),
  'Cancel': tr('Cancelar', 'Abbrechen', 'Annuler', '취소', 'キャンセル', 'Kanselahin', 'إلغاء', '取消', 'Annulla', 'Cancelar', 'Hủy'),
  'OK': tr('OK', 'OK', 'OK', '확인', 'OK', 'OK', 'موافق', '确定', 'OK', 'OK', 'OK'),
  'Close': tr('Cerrar', 'Schließen', 'Fermer', '닫기', '閉じる', 'Isara', 'إغلاق', '关闭', 'Chiudi', 'Fechar', 'Đóng'),
  'No results': tr('Sin resultados', 'Keine Ergebnisse', 'Aucun résultat', '결과 없음', '結果なし', 'Walang resulta', 'لا توجد نتائج', '无结果', 'Nessun risultato', 'Sem resultados', 'Không có kết quả'),
  'Departing': tr('Saliendo', 'Abreise', 'Départ', '출발', '出発', 'Paalis', 'مغادرة', '离开', 'In partenza', 'Partindo', 'Khởi hành'),
  'Arriving': tr('Llegando', 'Ankunft', 'Arrivée', '도착', '到着', 'Pagdating', 'وصول', '到达', 'In arrivo', 'Chegando', 'Đến'),
  'Religion': tr('Religión', 'Religion', 'Religion', '종교', '宗教', 'Relihiyon', 'الدين', '宗教', 'Religione', 'Religião', 'Tôn giáo'),
  'Faith': tr('Fe', 'Glaube', 'Foi', '신앙', '信仰', 'Pananampalataya', 'الإيمان', '信仰', 'Fede', 'Fé', 'Tín ngưỡng'),

  // Calculator / housing context
  'Your Estimated Monthly BAH': tr('Tu BAH mensual estimado', 'Ihre geschätzte monatliche BAH', 'Votre BAH mensuel estimé', '예상 월간 BAH', '推定月額BAH', 'Iyong estimated monthly BAH', 'BAH الشهري المقدر لك', '您的预估月度 BAH', 'BAH mensile stimato', 'Seu BAH mensal estimado', 'BAH hằng tháng dự tính của bạn'),
  'YOUR ESTIMATED MONTHLY BAH': tr('TU BAH MENSUAL ESTIMADO', 'IHRE GESCHÄTZTE MONATLICHE BAH', 'VOTRE BAH MENSUEL ESTIMÉ', '예상 월간 BAH', '推定月額BAH', 'ESTIMATED MONTHLY BAH MO', 'BAH الشهري المقدر لك', '您的预估月度 BAH', 'BAH MENSILE STIMATO', 'SEU BAH MENSAL ESTIMADO', 'BAH HẰNG THÁNG DỰ TÍNH'),

  // Privacy / security
  'PCS Express uses a no-document-upload design': tr('PCS Express usa un diseño sin carga de documentos', 'PCS Express verwendet ein Design ohne Dokument-Upload', 'PCS Express utilise une conception sans téléversement de documents', 'PCS Express는 문서 업로드 없는 설계를 사용합니다', 'PCS Expressは書類アップロード不要の設計を採用', 'Walang document upload ang PCS Express', 'PCS Express يستخدم تصميماً بدون رفع وثائق', 'PCS Express 采用免文档上传的设计', 'PCS Express usa un design senza caricamento documenti', 'PCS Express usa design sem upload de documentos', 'PCS Express dùng thiết kế không tải tài liệu'),
};

const PHRASE_LOOKUP = Object.fromEntries(
  Object.entries(PHRASES).map(([key, value]) => [key.toLowerCase(), value])
);

const COMMAND_PHRASES = {
  'Copy': tr('Copiar', 'Kopieren', 'Copier', '복사', 'コピー', 'Kopyahin', 'نسخ', '复制', 'Copia', 'Copiar', 'Sao chép'),
  'Copy Translation': tr('Copiar traducción', 'Übersetzung kopieren', 'Copier la traduction', '번역 복사', '翻訳をコピー', 'Kopyahin ang salin', 'نسخ الترجمة', '复制翻译', 'Copia traduzione', 'Copiar tradução', 'Sao chép bản dịch'),
  'Clear All': tr('Borrar todo', 'Alles löschen', 'Tout effacer', '모두 지우기', 'すべて消去', 'Burahin lahat', 'مسح الكل', '全部清除', 'Cancella tutto', 'Limpar tudo', 'Xóa tất cả'),
  'Add Child': tr('Agregar menor', 'Kind hinzufügen', 'Ajouter un enfant', '자녀 추가', '子どもを追加', 'Magdagdag ng anak', 'إضافة طفل', '添加子女', 'Aggiungi figlio', 'Adicionar criança', 'Thêm trẻ em'),
  'Add Item': tr('Agregar elemento', 'Element hinzufügen', 'Ajouter un élément', '항목 추가', '項目を追加', 'Magdagdag ng item', 'إضافة عنصر', '添加项目', 'Aggiungi elemento', 'Adicionar item', 'Thêm mục'),
  'Remove': tr('Quitar', 'Entfernen', 'Supprimer', '제거', '削除', 'Alisin', 'إزالة', '移除', 'Rimuovi', 'Remover', 'Xóa'),
  'Save Route': tr('Guardar ruta', 'Route speichern', 'Enregistrer l’itinéraire', '경로 저장', 'ルートを保存', 'I-save ang ruta', 'حفظ المسار', '保存路线', 'Salva percorso', 'Salvar rota', 'Lưu tuyến'),
  'Generate On-Base Route': tr('Crear ruta en la base', 'Route auf der Basis erstellen', 'Créer un itinéraire sur la base', '기지 내 경로 만들기', '基地内ルートを作成', 'Gumawa ng ruta sa base', 'إنشاء مسار داخل القاعدة', '生成基地内路线', 'Crea percorso in base', 'Gerar rota na base', 'Tạo tuyến trong căn cứ'),
  'Search Official School Sources →': tr('Buscar fuentes escolares oficiales', 'Offizielle Schulquellen suchen', 'Rechercher les sources scolaires officielles', '공식 학교 출처 검색', '公式学校情報を検索', 'Maghanap ng opisyal na school sources', 'البحث في مصادر المدارس الرسمية', '搜索官方学校来源', 'Cerca fonti scolastiche ufficiali', 'Pesquisar fontes escolares oficiais', 'Tìm nguồn trường học chính thức'),
  'Reset Local App Data': tr('Restablecer datos locales', 'Lokale App-Daten zurücksetzen', 'Réinitialiser les données locales', '로컬 앱 데이터 재설정', 'ローカルアプリデータをリセット', 'I-reset ang lokal na app data', 'إعادة ضبط بيانات التطبيق المحلية', '重置本地应用数据', 'Reimposta dati locali', 'Redefinir dados locais', 'Đặt lại dữ liệu cục bộ'),
  'Load Example': tr('Cargar ejemplo', 'Beispiel laden', 'Charger l’exemple', '예시 불러오기', '例を読み込む', 'Mag-load ng halimbawa', 'تحميل مثال', '加载示例', 'Carica esempio', 'Carregar exemplo', 'Tải ví dụ'),
  'Close Demo': tr('Cerrar demo', 'Demo schließen', 'Fermer la démo', '데모 닫기', 'デモを閉じる', 'Isara ang demo', 'إغلاق العرض', '关闭演示', 'Chiudi demo', 'Fechar demo', 'Đóng demo'),
};

Object.entries(COMMAND_PHRASES).forEach(([key, value]) => {
  PHRASES[key] = value;
  PHRASE_LOOKUP[key.toLowerCase()] = value;
});

const PROPER_NOUNS = [
  'PCS', 'PCS Express', 'USAJOBS', 'Military OneSource', 'MySECO', 'MSEP', 'MyCAA', 'TRICARE', 'DoDEA', 'DPS', 'VA', 'GI Bill', 'FAFSA',
  'ArmyIgnitED', 'AFVEC', 'DANTES', 'DEERS', 'USPS', 'SGLI', 'TMO', 'PPPO', 'HHG', 'POV', 'MTF', 'EFMP', 'OCONUS', 'CONUS',
  'Army', 'Navy', 'Marine Corps', 'Air Force', 'Space Force', 'Coast Guard', 'DoD', 'DISA', 'CUI', 'JTR', 'DOL', 'SBA', 'VBOC',
  'LinkedIn', 'Indeed', 'ClearanceJobs', 'Hiring Our Heroes', 'SCORE', 'IVMF', 'ACP', 'USCIS', 'JAG', 'CFPB', 'CDC', 'USDA', 'APHIS',
  'MilitaryINSTALLATIONS', 'HOMES.mil', 'HEAT', 'MHS GENESIS', '988', 'MFLC', 'SECO', 'CDC', 'CYSS',
];

const TOPIC_TERMS = {
  checklist: tr('la lista PCS', 'die PCS-Checkliste', 'la liste PCS', 'PCS 체크리스트', 'PCSチェックリスト', 'ang PCS checklist', 'قائمة PCS', 'PCS 清单', 'la lista PCS', 'a lista PCS', 'danh sách PCS'),
  documents: tr('el seguimiento de documentos', 'die Dokumentenverfolgung', 'le suivi des documents', '문서 추적', '書類管理', 'ang pagsubaybay ng dokumento', 'تتبع المستندات', '文件跟踪', 'il monitoraggio dei documenti', 'o acompanhamento de documentos', 'theo dõi tài liệu'),
  education: tr('los recursos educativos', 'die Bildungsressourcen', 'les ressources éducatives', '교육 자료', '教育リソース', 'mga resource sa edukasyon', 'موارد التعليم', '教育资源', 'le risorse per l’istruzione', 'os recursos de educação', 'tài nguyên giáo dục'),
  employment: tr('los recursos de empleo', 'die Beschäftigungsressourcen', 'les ressources d’emploi', '취업 자료', '雇用リソース', 'mga resource sa trabaho', 'موارد التوظيف', '就业资源', 'le risorse per il lavoro', 'os recursos de emprego', 'tài nguyên việc làm'),
  family: tr('los recursos de preparación familiar', 'die Familienressourcen', 'les ressources familiales', '가족 준비 자료', '家族準備リソース', 'mga resource sa pamilya', 'موارد جاهزية العائلة', '家庭准备资源', 'le risorse familiari', 'os recursos familiares', 'tài nguyên gia đình'),
  housing: tr('los recursos de vivienda y mudanza', 'die Wohnungs- und Umzugsressourcen', 'les ressources logement et déménagement', '주거 및 이전 자료', '住宅と移転リソース', 'mga resource sa pabahay at paglipat', 'موارد السكن والانتقال', '住房和搬迁资源', 'le risorse per casa e trasferimento', 'os recursos de moradia e mudança', 'tài nguyên nhà ở và chuyển nhà'),
  mental: tr('los recursos de preparación mental', 'die mentalen Ressourcen', 'les ressources de santé mentale', '정신 준비 자료', 'メンタル準備リソース', 'mga resource sa mental readiness', 'موارد الجاهزية النفسية', '心理准备资源', 'le risorse per la prontezza mentale', 'os recursos de saúde mental', 'tài nguyên sức khỏe tinh thần'),
  navigation: tr('los recursos de navegación y mapa base', 'die Navigations- und Kartenressourcen', 'les ressources de navigation et carte', '내비게이션 및 기지 지도 자료', 'ナビゲーションと基地地図リソース', 'mga resource sa navigation at mapa ng base', 'موارد الملاحة وخريطة القاعدة', '导航和基地地图资源', 'le risorse di navigazione e mappa', 'os recursos de navegação e mapa', 'tài nguyên điều hướng và bản đồ căn cứ'),
  resources: tr('los recursos oficiales', 'die offiziellen Ressourcen', 'les ressources officielles', '공식 자료', '公式リソース', 'mga opisyal na resource', 'الموارد الرسمية', '官方资源', 'le risorse ufficiali', 'os recursos oficiais', 'tài nguyên chính thức'),
  spiritual: tr('los recursos de preparación espiritual', 'die spirituellen Ressourcen', 'les ressources spirituelles', '영적 준비 자료', 'スピリチュアル準備リソース', 'mga spiritual readiness resource', 'موارد الجاهزية الروحية', '精神准备资源', 'le risorse spirituali', 'os recursos espirituais', 'tài nguyên tinh thần'),
  translation: tr('las herramientas de traducción', 'die Übersetzungswerkzeuge', 'les outils de traduction', '번역 도구', '翻訳ツール', 'mga translation tool', 'أدوات الترجمة', '翻译工具', 'gli strumenti di traduzione', 'as ferramentas de tradução', 'công cụ dịch thuật'),
  veterans: tr('los recursos para veteranos', 'die Veteranenressourcen', 'les ressources pour vétérans', '재향군인 자료', '退役軍人リソース', 'mga resource para sa beterano', 'موارد المحاربين القدامى', '退伍军人资源', 'le risorse per veterani', 'os recursos para veteranos', 'tài nguyên cựu chiến binh'),
  security: tr('la información de seguridad', 'die Sicherheitsinformationen', 'les informations de sécurité', '보안 정보', 'セキュリティ情報', 'impormasyon sa seguridad', 'معلومات الأمان', '安全信息', 'le informazioni di sicurezza', 'as informações de segurança', 'thông tin bảo mật'),
  profile: tr('la configuración del perfil', 'die Profileinstellungen', 'les paramètres du profil', '프로필 설정', 'プロフィール設定', 'profile settings', 'إعدادات الملف الشخصي', '档案设置', 'le impostazioni del profilo', 'as configurações do perfil', 'cài đặt hồ sơ'),
};

const INTENT_TERMS = {
  official: tr('confirmar orientación pública oficial', 'offizielle öffentliche Hinweise zu bestätigen', 'confirmer les informations publiques officielles', '공식 공개 지침을 확인하는 데', '公式公開情報を確認するため', 'kumpirmahin ang opisyal na pampublikong gabay', 'لتأكيد الإرشادات العامة الرسمية', '确认官方公开指南', 'confermare le indicazioni pubbliche ufficiali', 'confirmar orientação pública oficial', 'xác minh hướng dẫn công khai chính thức'),
  jobs: tr('buscar oportunidades actuales y revisar requisitos', 'aktuelle Chancen zu suchen und Anforderungen zu prüfen', 'chercher des opportunités actuelles et vérifier les exigences', '현재 기회를 찾고 요구사항을 확인하는 데', '現在の機会を探し要件を確認するため', 'maghanap ng kasalukuyang oportunidad at suriin ang requirements', 'للبحث عن الفرص الحالية ومراجعة المتطلبات', '搜索当前机会并查看要求', 'cercare opportunità attuali e controllare i requisiti', 'buscar oportunidades atuais e revisar requisitos', 'tìm cơ hội hiện tại và xem yêu cầu'),
  resume: tr('preparar un currículum listo para empleo federal o civil', 'einen Lebenslauf für Bundes- oder zivile Stellen vorzubereiten', 'préparer un CV adapté aux emplois fédéraux ou civils', '연방 또는 민간 일자리에 맞는 이력서를 준비하는 데', '連邦または民間職向けの履歴書を準備するため', 'maghanda ng resume para sa federal o civilian jobs', 'لإعداد سيرة ذاتية مناسبة للوظائف الفدرالية أو المدنية', '准备适合联邦或民间职位的简历', 'preparare un curriculum per impieghi federali o civili', 'preparar um currículo para empregos federais ou civis', 'chuẩn bị hồ sơ cho việc làm liên bang hoặc dân sự'),
  education: tr('revisar beneficios educativos, inscripción y apoyo escolar', 'Bildungsleistungen, Einschreibung und Schulhilfe zu prüfen', 'examiner les avantages éducatifs, l’inscription et l’aide scolaire', '교육 혜택, 등록, 학교 지원을 확인하는 데', '教育給付、入学、学校支援を確認するため', 'suriin ang benepisyo sa edukasyon, enrollment, at school support', 'لمراجعة مزايا التعليم والتسجيل والدعم المدرسي', '查看教育福利、入学和学校支持', 'rivedere benefici educativi, iscrizione e supporto scolastico', 'revisar benefícios educacionais, matrícula e apoio escolar', 'xem quyền lợi giáo dục, ghi danh và hỗ trợ trường học'),
  housing: tr('comparar opciones de vivienda y apoyo de reubicación', 'Wohnoptionen und Umzugshilfe zu vergleichen', 'comparer les options de logement et l’aide au déménagement', '주거 옵션과 이전 지원을 비교하는 데', '住宅選択肢と移転支援を比較するため', 'ihambing ang pabahay at relocation support', 'لمقارنة خيارات السكن ودعم الانتقال', '比较住房选择和搬迁支持', 'confrontare opzioni abitative e supporto al trasferimento', 'comparar opções de moradia e apoio de mudança', 'so sánh lựa chọn nhà ở và hỗ trợ chuyển nhà'),
  map: tr('revisar mapas públicos y rutas sin datos restringidos', 'öffentliche Karten und Routen ohne eingeschränkte Daten zu prüfen', 'consulter les cartes publiques et itinéraires sans données restreintes', '제한 정보 없이 공개 지도와 경로를 확인하는 데', '制限情報なしで公開地図と経路を確認するため', 'suriin ang pampublikong mapa at ruta nang walang restricted data', 'لمراجعة الخرائط العامة والمسارات دون بيانات مقيدة', '查看无受限数据的公开地图和路线', 'consultare mappe pubbliche e percorsi senza dati riservati', 'revisar mapas públicos e rotas sem dados restritos', 'xem bản đồ công khai và tuyến đường không có dữ liệu hạn chế'),
  health: tr('encontrar apoyo médico, de salud mental y familiar', 'medizinische, mentale und familiäre Unterstützung zu finden', 'trouver un soutien médical, mental et familial', '의료, 정신 건강, 가족 지원을 찾는 데', '医療、メンタル、家族支援を見つけるため', 'hanapin ang medikal, mental health, at family support', 'للعثور على الدعم الطبي والنفسي والعائلي', '查找医疗、心理和家庭支持', 'trovare supporto medico, mentale e familiare', 'encontrar apoio médico, mental e familiar', 'tìm hỗ trợ y tế, tinh thần và gia đình'),
  legal: tr('revisar ayuda legal y pasos de protección familiar', 'Rechtshilfe und Familienschutzschritte zu prüfen', 'examiner l’aide juridique et les étapes de protection familiale', '법률 지원과 가족 보호 절차를 확인하는 데', '法律支援と家族保護手順を確認するため', 'suriin ang legal help at family protection steps', 'لمراجعة المساعدة القانونية وخطوات حماية الأسرة', '查看法律帮助和家庭保护步骤', 'rivedere assistenza legale e passaggi di protezione familiare', 'revisar ajuda jurídica e proteção familiar', 'xem trợ giúp pháp lý và bước bảo vệ gia đình'),
  pets: tr('planificar requisitos de viaje y cuidado de mascotas', 'Reise- und Pflegeanforderungen für Haustiere zu planen', 'planifier les exigences de voyage et de soins des animaux', '반려동물 여행 및 돌봄 요건을 계획하는 데', 'ペットの旅行とケア要件を計画するため', 'planuhin ang travel at care requirements ng pet', 'لتخطيط متطلبات سفر ورعاية الحيوانات الأليفة', '规划宠物旅行和照护要求', 'pianificare viaggio e cura degli animali', 'planejar requisitos de viagem e cuidados de animais', 'lập kế hoạch đi lại và chăm sóc thú cưng'),
  claims: tr('organizar inventario, plazos de reclamo y evidencia', 'Inventar, Anspruchsfristen und Nachweise zu organisieren', 'organiser l’inventaire, les délais de réclamation et les preuves', '재고, 청구 기한, 증거를 정리하는 데', '在庫、請求期限、証拠を整理するため', 'ayusin ang imbentaryo, claim deadline, at ebidensya', 'لتنظيم الجرد ومواعيد المطالبات والأدلة', '整理清单、索赔期限和证据', 'organizzare inventario, scadenze reclami e prove', 'organizar inventário, prazos de reclamação e evidências', 'sắp xếp kiểm kê, hạn khiếu nại và bằng chứng'),
  crisis: tr('obtener apoyo inmediato y confidencial cuando sea necesario', 'bei Bedarf sofortige vertrauliche Hilfe zu erhalten', 'obtenir un soutien immédiat et confidentiel au besoin', '필요할 때 즉각적이고 비밀이 보장되는 지원을 받는 데', '必要時に即時かつ秘密厳守の支援を受けるため', 'makakuha ng agarang confidential support kapag kailangan', 'للحصول على دعم فوري وسري عند الحاجة', '在需要时获得即时保密支持', 'ottenere supporto immediato e riservato quando serve', 'obter apoio imediato e confidencial quando necessário', 'nhận hỗ trợ khẩn cấp và bảo mật khi cần'),
  checklist: tr('completar una tarea de PCS y mantener visible el progreso', 'eine PCS-Aufgabe zu erledigen und den Fortschritt sichtbar zu halten', 'terminer une tâche PCS et garder la progression visible', 'PCS 작업을 완료하고 진행 상황을 확인하는 데', 'PCSタスクを完了し進捗を見えるようにするため', 'kumpletuhin ang PCS task at makita ang progreso', 'لإكمال مهمة PCS وإبقاء التقدم واضحاً', '完成 PCS 任务并保持进度可见', 'completare un’attività PCS e mantenere visibile il progresso', 'concluir uma tarefa PCS e manter o progresso visível', 'hoàn thành nhiệm vụ PCS và theo dõi tiến độ'),
  route: tr('planificar viajes, indicaciones y recursos de llegada', 'Reisen, Wegbeschreibungen und Ankunftsressourcen zu planen', 'planifier les déplacements, itinéraires et ressources d’arrivée', '이동, 길 안내, 도착 자료를 계획하는 데', '移動、道順、到着時リソースを計画するため', 'planuhin ang biyahe, direksyon, at arrival resources', 'لتخطيط السفر والاتجاهات وموارد الوصول', '规划旅行、路线和到达资源', 'pianificare viaggio, indicazioni e risorse di arrivo', 'planejar viagens, direções e recursos de chegada', 'lập kế hoạch di chuyển, chỉ đường và tài nguyên khi đến'),
  translate: tr('usar frases útiles durante la mudanza', 'nützliche Sätze während des Umzugs zu verwenden', 'utiliser des phrases utiles pendant le déménagement', '이동 중 유용한 문구를 사용하는 데', '移動中に役立つ表現を使うため', 'gamitin ang kapaki-pakinabang na parirala sa paglipat', 'لاستخدام عبارات مفيدة أثناء الانتقال', '在搬迁期间使用有用短语', 'usare frasi utili durante il trasferimento', 'usar frases úteis durante a mudança', 'dùng các cụm từ hữu ích khi chuyển nhà'),
  security: tr('entender controles de seguridad y límites de datos públicos', 'Sicherheitskontrollen und Grenzen öffentlicher Daten zu verstehen', 'comprendre les contrôles de sécurité et limites des données publiques', '보안 통제와 공개 데이터 한계를 이해하는 데', 'セキュリティ管理と公開データの範囲を理解するため', 'maunawaan ang security controls at public data limits', 'لفهم ضوابط الأمان وحدود البيانات العامة', '了解安全控制和公开数据限制', 'capire controlli di sicurezza e limiti dei dati pubblici', 'entender controles de segurança e limites de dados públicos', 'hiểu kiểm soát bảo mật và giới hạn dữ liệu công khai'),
};

const TOPIC_RULES = [
  ['employment', /job|career|resume|internship|mentor|mentorship|linkedin|certification|entrepreneur|employment|spouse preferred|workshop|salary|hiring|recruiter|usajobs|indeed|clearancejobs/i],
  ['housing', /home relocation|housing|home locator|move aid|moving|relocation|va loan|claims|inventory|landlord|lodging|bedroom|bathroom|square footage|bah|dps/i],
  ['documents', /document|orders|unit|pdf|file|record|paperwork|attachment/i],
  ['education', /education|school|college|tuition|mycaa|gi bill|fafsa|degree|certificate|enrollment|student|dantes/i],
  ['family', /family|efmp|pet|child|children|spouse|dependent|permanent resident|deployment|readiness group|uscis/i],
  ['navigation', /navigation|map|base map|route|directions|installation|gate|traffic|location/i],
  ['mental', /mental|crisis|counseling|therapy|health|wellness|stress|988|support line|mflc/i],
  ['spiritual', /spiritual|faith|religion|chaplain|chapel|worship|prayer/i],
  ['veterans', /veteran|veterans|business owner|owned business|vboc|sba/i],
  ['translation', /translation|translate|language|phrase|interpreter/i],
  ['checklist', /checklist|task|phase|milestone|progress|deadline|complete|schedule|notify|obtain|register|transfer|confirm|arrange/i],
  ['security', /security|privacy|public data|classified|cui|disa|dod|encrypted|local device/i],
  ['resources', /resource|official source|link|benefit|program|assistance|support/i],
  ['profile', /profile|onboarding|branch|component|rank|pay grade|preferred language/i],
];

const INTENT_RULES = [
  ['jobs', /job|career|employment|hiring|recruiter|linkedin|indeed|usajobs|clearancejobs|msep/i],
  ['resume', /resume|cv|application|announcement|qualifications|specialized experience/i],
  ['education', /school|college|education|tuition|gi bill|mycaa|dantes|student|degree|certificate|enroll|admission/i],
  ['housing', /housing|home|lodging|bah|landlord|lease|va loan|mortgage|on-post|temporary/i],
  ['map', /map|installation|gate|route|directions|traffic|base/i],
  ['health', /medical|dental|tricare|health|mhs genesis|mtf|care|beneficiary/i],
  ['legal', /legal|jag|uscis|green card|citizenship|naturalization|petition|interview|scra/i],
  ['pets', /pet|dog|cat|animal|veterinary|aphis|travel certificate/i],
  ['claims', /claim|inventory|damage|replacement|evidence|deadline|household goods|dps/i],
  ['crisis', /crisis|988|suicide|emergency|brandon act|confidential/i],
  ['route', /travel|route|directions|weather|lodging|arrival|pov/i],
  ['translate', /translate|translation|phrase|language|interpreter/i],
  ['security', /security|classified|cui|privacy|local device|public data|disa|dod/i],
  ['checklist', /request|review|make|notify|begin|schedule|create|research|apply|update|arrange|obtain|connect|confirm|forward|cancel|settle|prepare|verify|photograph|return|pick up|ensure|check|report|complete|register|transfer|set up|enroll/i],
  ['official', /official|public|source|resource|guidance|program|benefit|portal/i],
];

const COMMON_WORDS = /\b(the|and|or|for|with|from|your|you|near|official|public|information|resources|search|open|review|complete|support|move|home|family|service|military|spouse|installation|documents|checklist|profile|language|category|available|local|data|security|career|employment|education|school|housing|navigation|map|pets|deployment|counseling|crisis|financial|healthcare|resume|internship|workshop|certification|mentorship|connection|translation|veteran|claims|inventory|tuition|orders|unit|travel|finance|medical)\b/i;

function normalizeLanguage(language) {
  const code = String(language || 'en').toLowerCase();
  return SUPPORTED.has(code) ? code : 'en';
}

function compactText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitMarker(text) {
  const match = text.match(/^([✓✔•*\-–—→➜]+\s*)/);
  if (!match) return ['', text];
  return [match[1], text.slice(match[1].length).trim()];
}

function translateExact(original, lang) {
  if (!original || lang === 'en') return original;
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const compact = compactText(original);
  const translated = PHRASES[compact]?.[lang] || PHRASE_LOOKUP[compact.toLowerCase()]?.[lang];
  if (translated) return `${leading}${translated}${trailing}`;
  const [marker, body] = splitMarker(compact);
  const markerTranslated = marker
    ? PHRASES[body]?.[lang] || PHRASE_LOOKUP[body.toLowerCase()]?.[lang]
    : null;
  return markerTranslated ? `${leading}${marker}${markerTranslated}${trailing}` : null;
}

function isNumericOrSymbolOnly(text) {
  return /^[\s\d.,:/%+$#()\-–—|·*]+$/.test(text);
}

function hasVerbLikeEnglish(text) {
  return /\b(open|use|find|review|verify|confirm|apply|request|schedule|create|research|update|arrange|begin|obtain|notify|connect|prepare|register|transfer|enroll|report|complete|support|compare|search|learn|visit|download|browse|launch|track|plan|build|keep|make|bring|ask|read|follow|check|contact|call|text|chat)\b/i.test(text);
}

function isKnownProperNoun(text) {
  const compact = compactText(text);
  if (!compact) return true;
  if (PROPER_NOUNS.includes(compact)) return true;
  if (/^[A-Z0-9&./ -]{2,18}$/.test(compact)) return true;
  if (/^(Fort|Camp|Joint Base|Naval|NAS|MCAS|MCB|USAG|Ramstein|Kadena|Osan|Yokota|Schofield|Eglin|MacDill|Travis|Nellis|Luke|Minot|Hill|Patrick|Vandenberg)\b/.test(compact)) return true;
  const includesProgram = PROPER_NOUNS.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(compact));
  if (includesProgram && !/[.!?]/.test(compact) && !hasVerbLikeEnglish(compact) && compact.length <= 80) return true;
  return false;
}

function looksLikeEnglish(text) {
  const compact = compactText(text);
  if (!compact || isNumericOrSymbolOnly(compact) || isKnownProperNoun(compact)) return false;
  const letters = compact.match(/[A-Za-z]/g)?.length || 0;
  if (letters < 3) return false;
  // Only flag text containing known English function words or action verbs.
  // The prior letter-ratio fallback was removed: it caused proper names (school
  // names, installation names) to match and get replaced with garbled topic sentences.
  return COMMON_WORDS.test(compact) || hasVerbLikeEnglish(compact);
}

function topicFor(text, parent) {
  const parts = [text];
  let node = parent;
  for (let i = 0; node && i < 4; i += 1) {
    parts.push(node.id || '', typeof node.className === 'string' ? node.className : '', node.getAttribute?.('aria-label') || '', node.getAttribute?.('data-section') || '');
    node = node.parentElement;
  }
  const context = parts.join(' ');
  const match = TOPIC_RULES.find(([, pattern]) => pattern.test(context));
  return match?.[0] || 'resources';
}

function intentFor(text) {
  const match = INTENT_RULES.find(([, pattern]) => pattern.test(text));
  return match?.[0] || 'official';
}

function topicTerm(topic, lang) {
  return TOPIC_TERMS[topic]?.[lang] || TOPIC_TERMS.resources[lang] || TOPIC_TERMS.resources.es;
}

function intentTerm(intent, lang) {
  return INTENT_TERMS[intent]?.[lang] || INTENT_TERMS.official[lang] || INTENT_TERMS.official.es;
}

function sourceFrom(text) {
  const compact = compactText(text);
  const proper = PROPER_NOUNS.find((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(compact));
  if (proper) return proper;
  const acronym = compact.match(/\b[A-Z][A-Z0-9&./-]{2,}\b/);
  return acronym?.[0] || '';
}

// Korean object particle: 을 after a syllable with a final consonant (batchim),
// 를 after a vowel-final syllable (and as the default for non-Hangul endings).
// Picks the grammatically-correct particle for the interpolated topic term
// instead of a hardcoded 을, which is wrong for every vowel-final topic.
function koObjectParticle(word) {
  const s = String(word || '').trim();
  if (!s) return '를';
  const last = s.charCodeAt(s.length - 1);
  if (last >= 0xAC00 && last <= 0xD7A3) {
    return ((last - 0xAC00) % 28) === 0 ? '를' : '을';
  }
  return '를';
}

function localizedSentence({ topic, intent, source, lang, short }) {
  const t = topicTerm(topic, lang);
  const i = intentTerm(intent, lang);
  const sourceLead = source ? `${source}: ` : '';
  if (short) {
    const headings = {
      es: `${sourceLead}${t}`,
      de: `${sourceLead}${t}`,
      fr: `${sourceLead}${t}`,
      ko: `${sourceLead}${t}`,
      ja: `${sourceLead}${t}`,
      tl: `${sourceLead}${t}`,
      ar: `${sourceLead}${t}`,
      zh: `${sourceLead}${t}`,
      it: `${sourceLead}${t}`,
      pt: `${sourceLead}${t}`,
      vi: `${sourceLead}${t}`,
    };
    return headings[lang] || headings.es;
  }
  const sentences = {
    es: `${sourceLead}Use ${t} para ${i}. Verifique los detalles con la fuente oficial antes de actuar.`,
    de: `${sourceLead}Nutzen Sie ${t}, um ${i}. Prüfen Sie Details vor dem Handeln bei der offiziellen Quelle.`,
    fr: `${sourceLead}Utilisez ${t} pour ${i}. Vérifiez les détails auprès de la source officielle avant d’agir.`,
    ko: `${sourceLead}${t}${koObjectParticle(t)} 사용하여 ${i}. 조치하기 전에 공식 출처에서 세부 정보를 확인하십시오.`,
    ja: `${sourceLead}${t}を使用して${i}。行動する前に公式ソースで詳細を確認してください。`,
    tl: `${sourceLead}Gamitin ang ${t} para ${i}. Kumpirmahin ang detalye sa opisyal na source bago kumilos.`,
    ar: `${sourceLead}استخدم ${t} ${i}. تحقق من التفاصيل من المصدر الرسمي قبل اتخاذ أي إجراء.`,
    zh: `${sourceLead}使用${t}${i}。采取行动前请向官方来源核实详细信息。`,
    it: `${sourceLead}Usa ${t} per ${i}. Verifica i dettagli con la fonte ufficiale prima di agire.`,
    pt: `${sourceLead}Use ${t} para ${i}. Confirme os detalhes com a fonte oficial antes de agir.`,
    vi: `${sourceLead}Dùng ${t} để ${i}. Hãy xác minh chi tiết với nguồn chính thức trước khi hành động.`,
  };
  return sentences[lang] || sentences.es;
}

function controlContext(parent) {
  const parts = [];
  let node = parent;
  for (let i = 0; node && i < 5; i += 1) {
    parts.push(
      node.id || '',
      typeof node.className === 'string' ? node.className : '',
      node.getAttribute?.('aria-label') || '',
      node.getAttribute?.('data-section') || '',
      node.getAttribute?.('role') || ''
    );
    node = node.parentElement;
  }
  return parts.join(' ');
}

function isLikelySelectorLabel(parent, compact) {
  const tag = parent?.tagName?.toLowerCase() || '';
  const role = parent?.getAttribute?.('role') || '';
  if (tag !== 'button' && role !== 'button' && role !== 'tab') return false;
  const context = controlContext(parent);
  if (/tab|tabs|nav|navigation|category|selector|section|filter|phase|menu|bottom|sidebar|segment/i.test(context)) return true;
  if (compact.length <= 64 && !hasVerbLikeEnglish(compact) && !/[.!?]/.test(compact)) return true;
  return false;
}

function commandFallback(lower, bundle) {
  if (/^open\b|^view\b|^learn\b|^visit\b|^download\b|^browse\b|^launch\b/.test(lower)) return bundle.action;
  if (/^copy\b/.test(lower)) return '';
  if (/^clear\b|^remove\b|^reset\b|^delete\b/.test(lower)) return '';
  if (/^add\b|^save\b|^load\b|^close\b|^submit\b|^translate\b/.test(lower)) return '';
  return '';
}

function chooseFallback(original, lang, parent) {
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const compactRaw = compactText(original);
  const [marker, compact] = splitMarker(compactRaw);
  if (!looksLikeEnglish(compact)) return original;
  // Full-translation mode: long content (checklists, docs, education
  // descriptions) gets a topic-localized sentence in the target
  // language instead of staying English. The fallback sentence is
  // generic — it preserves topic + intent but loses the source's
  // specific wording. The TRANSLATION_BANNER tells non-English users
  // to expect generalized phrasing on long content. Only paragraphs
  // longer than 500 chars (true essays, multi-sentence blocks) stay in
  // English; those would be too lossy to generalize into one sentence.
  if (compact.length > 500) return original;

  const lower = compact.toLowerCase();
  const bundle = GENERIC[lang] || GENERIC.es;
  const tag = parent?.tagName?.toLowerCase() || '';
  const _role = parent?.getAttribute?.('role') || '';
  const labelLikeControl = isLikelySelectorLabel(parent, compact);

  let translated = '';
  const explicitCommand = commandFallback(lower, bundle);
  if (explicitCommand) translated = explicitCommand;
  else if (/search|find/.test(lower) && compact.length <= 80 && !labelLikeControl) translated = bundle.search;
  else if (/continue|build my pcs plan|start/.test(lower) && compact.length <= 80) translated = bundle.continue;
  else if (/^back$|go back/.test(lower)) translated = bundle.back;
  else if (/^next$/.test(lower)) translated = bundle.next;
  else if (/not available|unavailable|no .*data|cannot find|not found|under official review/.test(lower)) translated = bundle.unavailable;
  else if (tag === 'a' && compact.length <= 100 && /resource|website|enrollment|admissions|official|learn more|open|visit/.test(lower)) translated = bundle.resource;
  else {
    const topic = topicFor(compact, parent);
    const intent = intentFor(compact);
    const source = sourceFrom(compact);
    const headingTag = /^h[1-6]$/.test(tag);
    const isShortHeading = compact.length <= 44 && !/[.!?]/.test(compact);
    translated = localizedSentence({ topic, intent, source, lang, short: headingTag || isShortHeading || labelLikeControl });
  }

  return `${leading}${marker}${translated}${trailing}`;
}

function shouldSkipNode(node) {
  const parent = node?.parentElement;
  if (!parent) return true;
  if (parent.closest('script, style, noscript, textarea, code, pre, [data-no-language-runtime], .notranslate')) return true;
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
  if (element.closest?.('[data-no-language-runtime], .notranslate')) return;
  if (!element.hasAttribute(attr)) return;
  // `dataset` only accepts camelCase keys (no hyphens). Attribute
  // names with hyphens like `aria-label` need to be camelized before
  // building the storage key, otherwise dataset[key]= throws
  // "is not a valid property name".
  const camelAttr = String(attr).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const storeName = `pcsOriginal${camelAttr.charAt(0).toUpperCase()}${camelAttr.slice(1)}`;
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
  root.setAttribute('data-pcs-language-mode', lang === 'en' ? 'source' : 'app-wide-static-content');

  // Non-curated languages: leave the English source text untouched and let
  // Google Translate handle the page. Running the dictionary passes here
  // would inject Spanish fallbacks. ('en' still runs below to restore
  // originals when switching back from a curated language.)
  if (lang !== 'en' && !CURATED.has(lang)) return;

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

    // Persist language separately so it survives profile-reload races
    try { localStorage.setItem('pcs_user_language', lang); } catch {}

    let scheduled = 0;
    const catchUpTimers = [];

    // No `applying` guard — the guard caused a race condition where React
    // re-renders triggered while applying=true would be permanently dropped.
    // Without it, each RAF cancels duplicates via `scheduled`, and
    // translateTextNode is idempotent (no-op when already translated).
    const run = () => {
      scheduled = 0;
      applyRuntimeLanguage(lang);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = window.requestAnimationFrame(run);
    };

    run();

    const root = document.getElementById('root') || document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(root, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['placeholder', 'aria-label', 'aria-description', 'title'],
    });
    window.addEventListener('pcs-language-refresh', schedule);

    // Catch-up passes for async-rendered content (lazy routes, data-driven lists)
    if (lang !== 'en') {
      [300, 800, 1800, 3500].forEach(delay => {
        catchUpTimers.push(window.setTimeout(schedule, delay));
      });
    }

    return () => {
      if (scheduled) window.cancelAnimationFrame(scheduled);
      catchUpTimers.forEach(id => window.clearTimeout(id));
      observer.disconnect();
      window.removeEventListener('pcs-language-refresh', schedule);
    };
  }, [lang]);
}
