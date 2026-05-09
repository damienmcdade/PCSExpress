/*
 * Purpose: App-wide preferred-language runtime for visible PCS Express UI text.
 * Third-party dependencies: React only.
 */

import { useEffect } from 'react';

const RTL_LANGS = new Set(['ar']);
const SUPPORTED = new Set(['en', 'es', 'de', 'fr', 'ko', 'ja', 'tl', 'ar', 'zh', 'it', 'pt', 'vi']);

const COMMON_PHRASES = {
  'PCS Express': { es: 'PCS Express', de: 'PCS Express', fr: 'PCS Express', ko: 'PCS Express', ja: 'PCS Express', tl: 'PCS Express', ar: 'PCS Express', zh: 'PCS Express', it: 'PCS Express', pt: 'PCS Express', vi: 'PCS Express' },
  'Home': { es: 'Inicio', de: 'Start', fr: 'Accueil', ko: '홈', ja: 'ホーム', tl: 'Home', ar: 'الرئيسية', zh: '首页', it: 'Home', pt: 'Início', vi: 'Trang chủ' },
  'Checklist': { es: 'Lista', de: 'Checkliste', fr: 'Liste', ko: '체크리스트', ja: 'チェックリスト', tl: 'Checklist', ar: 'قائمة التحقق', zh: '清单', it: 'Checklist', pt: 'Checklist', vi: 'Danh sách' },
  'Documents': { es: 'Documentos', de: 'Dokumente', fr: 'Documents', ko: '문서', ja: '書類', tl: 'Dokumento', ar: 'المستندات', zh: '文件', it: 'Documenti', pt: 'Documentos', vi: 'Tài liệu' },
  'Education': { es: 'Educación', de: 'Bildung', fr: 'Éducation', ko: '교육', ja: '教育', tl: 'Edukasyon', ar: 'التعليم', zh: '教育', it: 'Istruzione', pt: 'Educação', vi: 'Giáo dục' },
  'Family Readiness': { es: 'Preparación familiar', de: 'Familienbereitschaft', fr: 'Préparation familiale', ko: '가족 준비', ja: '家族準備', tl: 'Family Readiness', ar: 'جاهزية العائلة', zh: '家庭准备', it: 'Prontezza familiare', pt: 'Prontidão familiar', vi: 'Sẵn sàng gia đình' },
  'Home Relocation': { es: 'Reubicación del hogar', de: 'Wohnungssuche', fr: 'Relogement', ko: '주거 이전', ja: '住居移転', tl: 'Home Relocation', ar: 'السكن والانتقال', zh: '住房搬迁', it: 'Trasferimento casa', pt: 'Mudança residencial', vi: 'Nhà ở & chuyển nhà' },
  'Mental Readiness': { es: 'Preparación mental', de: 'Mentale Bereitschaft', fr: 'Préparation mentale', ko: '정신 준비', ja: 'メンタル準備', tl: 'Mental Readiness', ar: 'الجاهزية النفسية', zh: '心理准备', it: 'Prontezza mentale', pt: 'Prontidão mental', vi: 'Sẵn sàng tinh thần' },
  'Navigation': { es: 'Navegación', de: 'Navigation', fr: 'Navigation', ko: '내비게이션', ja: 'ナビゲーション', tl: 'Navigation', ar: 'الملاحة', zh: '导航', it: 'Navigazione', pt: 'Navegação', vi: 'Điều hướng' },
  'Resources': { es: 'Recursos', de: 'Ressourcen', fr: 'Ressources', ko: '자료', ja: 'リソース', tl: 'Resources', ar: 'الموارد', zh: '资源', it: 'Risorse', pt: 'Recursos', vi: 'Tài nguyên' },
  'Spiritual Readiness': { es: 'Preparación espiritual', de: 'Spirituelle Bereitschaft', fr: 'Préparation spirituelle', ko: '영적 준비', ja: 'スピリチュアル準備', tl: 'Spiritual Readiness', ar: 'الجاهزية الروحية', zh: '精神准备', it: 'Prontezza spirituale', pt: 'Prontidão espiritual', vi: 'Sẵn sàng tâm linh' },
  'Translation': { es: 'Traducción', de: 'Übersetzung', fr: 'Traduction', ko: '번역', ja: '翻訳', tl: 'Translation', ar: 'الترجمة', zh: '翻译', it: 'Traduzione', pt: 'Tradução', vi: 'Dịch thuật' },
  'Veterans': { es: 'Veteranos', de: 'Veteranen', fr: 'Vétérans', ko: '재향군인', ja: '退役軍人', tl: 'Veterans', ar: 'المحاربون القدامى', zh: '退伍军人', it: 'Veterani', pt: 'Veteranos', vi: 'Cựu chiến binh' },
  'Continue': { es: 'Continuar', de: 'Weiter', fr: 'Continuer', ko: '계속', ja: '続行', tl: 'Magpatuloy', ar: 'متابعة', zh: '继续', it: 'Continua', pt: 'Continuar', vi: 'Tiếp tục' },
  'Back': { es: 'Atrás', de: 'Zurück', fr: 'Retour', ko: '뒤로', ja: '戻る', tl: 'Bumalik', ar: 'رجوع', zh: '返回', it: 'Indietro', pt: 'Voltar', vi: 'Quay lại' },
  'Next': { es: 'Siguiente', de: 'Weiter', fr: 'Suivant', ko: '다음', ja: '次へ', tl: 'Susunod', ar: 'التالي', zh: '下一步', it: 'Avanti', pt: 'Próximo', vi: 'Tiếp' },
  'Open': { es: 'Abrir', de: 'Öffnen', fr: 'Ouvrir', ko: '열기', ja: '開く', tl: 'Buksan', ar: 'فتح', zh: '打开', it: 'Apri', pt: 'Abrir', vi: 'Mở' },
  'Search': { es: 'Buscar', de: 'Suchen', fr: 'Rechercher', ko: '검색', ja: '検索', tl: 'Maghanap', ar: 'بحث', zh: '搜索', it: 'Cerca', pt: 'Pesquisar', vi: 'Tìm kiếm' },
  'Official': { es: 'Oficial', de: 'Offiziell', fr: 'Officiel', ko: '공식', ja: '公式', tl: 'Opisyal', ar: 'رسمي', zh: '官方', it: 'Ufficiale', pt: 'Oficial', vi: 'Chính thức' },
  'Official Resource': { es: 'Recurso oficial', de: 'Offizielle Ressource', fr: 'Ressource officielle', ko: '공식 자료', ja: '公式リソース', tl: 'Opisyal na Resource', ar: 'مورد رسمي', zh: '官方资源', it: 'Risorsa ufficiale', pt: 'Recurso oficial', vi: 'Tài nguyên chính thức' },
  'Open Resource': { es: 'Abrir recurso', de: 'Ressource öffnen', fr: 'Ouvrir la ressource', ko: '자료 열기', ja: 'リソースを開く', tl: 'Buksan ang Resource', ar: 'فتح المورد', zh: '打开资源', it: 'Apri risorsa', pt: 'Abrir recurso', vi: 'Mở tài nguyên' },
  'Search Jobs': { es: 'Buscar empleos', de: 'Jobs suchen', fr: 'Rechercher des emplois', ko: '일자리 검색', ja: '求人検索', tl: 'Maghanap ng Trabaho', ar: 'بحث عن وظائف', zh: '搜索工作', it: 'Cerca lavoro', pt: 'Pesquisar empregos', vi: 'Tìm việc làm' },
  'Job Search': { es: 'Búsqueda de empleo', de: 'Jobsuche', fr: 'Recherche d’emploi', ko: '일자리 검색', ja: '求人検索', tl: 'Job Search', ar: 'بحث الوظائف', zh: '求职搜索', it: 'Ricerca lavoro', pt: 'Busca de emprego', vi: 'Tìm việc' },
  'Job Resources': { es: 'Recursos de empleo', de: 'Job-Ressourcen', fr: 'Ressources emploi', ko: '취업 자료', ja: '就職リソース', tl: 'Job Resources', ar: 'موارد الوظائف', zh: '就业资源', it: 'Risorse lavoro', pt: 'Recursos de emprego', vi: 'Tài nguyên việc làm' },
  'Employment': { es: 'Empleo', de: 'Beschäftigung', fr: 'Emploi', ko: '취업', ja: '雇用', tl: 'Trabaho', ar: 'التوظيف', zh: '就业', it: 'Occupazione', pt: 'Emprego', vi: 'Việc làm' },
  'Deployment': { es: 'Despliegue', de: 'Einsatz', fr: 'Déploiement', ko: '파병', ja: '派遣', tl: 'Deployment', ar: 'الانتشار', zh: '部署', it: 'Schieramento', pt: 'Mobilização', vi: 'Triển khai' },
  'Permanent Resident': { es: 'Residencia permanente', de: 'Daueraufenthalt', fr: 'Résident permanent', ko: '영주권', ja: '永住者', tl: 'Permanent Resident', ar: 'الإقامة الدائمة', zh: '永久居民', it: 'Residente permanente', pt: 'Residente permanente', vi: 'Thường trú nhân' },
  'Pets': { es: 'Mascotas', de: 'Haustiere', fr: 'Animaux', ko: '반려동물', ja: 'ペット', tl: 'Alagang hayop', ar: 'الحيوانات الأليفة', zh: '宠物', it: 'Animali domestici', pt: 'Animais de estimação', vi: 'Thú cưng' },
  'Schools': { es: 'Escuelas', de: 'Schulen', fr: 'Écoles', ko: '학교', ja: '学校', tl: 'Mga Paaralan', ar: 'المدارس', zh: '学校', it: 'Scuole', pt: 'Escolas', vi: 'Trường học' },
  'Schools & Childcare': { es: 'Escuelas y cuidado infantil', de: 'Schulen und Kinderbetreuung', fr: 'Écoles et garde d’enfants', ko: '학교 및 보육', ja: '学校と保育', tl: 'Mga Paaralan at Childcare', ar: 'المدارس ورعاية الأطفال', zh: '学校和儿童照护', it: 'Scuole e assistenza bambini', pt: 'Escolas e cuidados infantis', vi: 'Trường học và chăm sóc trẻ em' },
  'K–12 Schools': { es: 'Escuelas K-12', de: 'K-12 Schulen', fr: 'Écoles K-12', ko: 'K-12 학교', ja: 'K-12 学校', tl: 'K-12 Schools', ar: 'مدارس K-12', zh: 'K-12 学校', it: 'Scuole K-12', pt: 'Escolas K-12', vi: 'Trường K-12' },
  'Daycare & CDC': { es: 'Guardería y CDC', de: 'Kinderbetreuung und CDC', fr: 'Garderie et CDC', ko: '보육 및 CDC', ja: '保育とCDC', tl: 'Daycare at CDC', ar: 'الرعاية النهارية وCDC', zh: '日托和儿童发展中心', it: 'Asilo e CDC', pt: 'Creche e CDC', vi: 'Nhà trẻ và CDC' },
  'Find Schools': { es: 'Encontrar escuelas', de: 'Schulen finden', fr: 'Trouver des écoles', ko: '학교 찾기', ja: '学校を探す', tl: 'Maghanap ng Paaralan', ar: 'العثور على مدارس', zh: '查找学校', it: 'Trova scuole', pt: 'Encontrar escolas', vi: 'Tìm trường' },
  'Colleges': { es: 'Universidades', de: 'Hochschulen', fr: 'Universités', ko: '대학', ja: '大学', tl: 'Kolehiyo', ar: 'الكليات', zh: '大学', it: 'College', pt: 'Faculdades', vi: 'Cao đẳng/Đại học' },
  'GI Bill Chapters': { es: 'Capítulos GI Bill', de: 'GI Bill Kapitel', fr: 'Chapitres GI Bill', ko: 'GI Bill 장', ja: 'GI Bill 章', tl: 'GI Bill Chapters', ar: 'فصول GI Bill', zh: 'GI Bill 章节', it: 'Capitoli GI Bill', pt: 'Capítulos GI Bill', vi: 'Các chương GI Bill' },
  'Tuition Assistance': { es: 'Asistencia de matrícula', de: 'Studienbeihilfe', fr: 'Aide aux frais de scolarité', ko: '학비 지원', ja: '授業料支援', tl: 'Tulong sa Tuition', ar: 'مساعدة الرسوم الدراسية', zh: '学费援助', it: 'Assistenza tasse universitarie', pt: 'Assistência de mensalidade', vi: 'Hỗ trợ học phí' },
  'Base Map': { es: 'Mapa de la base', de: 'Basiskarte', fr: 'Carte de la base', ko: '기지 지도', ja: '基地マップ', tl: 'Mapa ng Base', ar: 'خريطة القاعدة', zh: '基地地图', it: 'Mappa base', pt: 'Mapa da base', vi: 'Bản đồ căn cứ' },
  'Select Installation': { es: 'Seleccionar instalación', de: 'Standort auswählen', fr: 'Sélectionner l’installation', ko: '설치 선택', ja: '施設を選択', tl: 'Piliin ang Installation', ar: 'اختر المنشأة', zh: '选择设施', it: 'Seleziona installazione', pt: 'Selecionar instalação', vi: 'Chọn cơ sở' },
  'Official public location view': { es: 'Vista pública oficial de ubicación', de: 'Offizielle öffentliche Standortansicht', fr: 'Vue officielle publique de l’emplacement', ko: '공식 공개 위치 보기', ja: '公式公開位置表示', tl: 'Opisyal na pampublikong view ng lokasyon', ar: 'عرض موقع عام رسمي', zh: '官方公共位置视图', it: 'Vista pubblica ufficiale della posizione', pt: 'Visualização pública oficial da localização', vi: 'Chế độ xem vị trí công khai chính thức' },
  'Family Support': { es: 'Apoyo familiar', de: 'Familienunterstützung', fr: 'Soutien familial', ko: '가족 지원', ja: '家族支援', tl: 'Suporta sa Pamilya', ar: 'دعم الأسرة', zh: '家庭支持', it: 'Supporto familiare', pt: 'Apoio familiar', vi: 'Hỗ trợ gia đình' },
  'Crisis Support': { es: 'Apoyo en crisis', de: 'Krisenhilfe', fr: 'Soutien de crise', ko: '위기 지원', ja: '危機支援', tl: 'Crisis Support', ar: 'دعم الأزمات', zh: '危机支持', it: 'Supporto crisi', pt: 'Apoio em crise', vi: 'Hỗ trợ khủng hoảng' },
  'Counseling': { es: 'Consejería', de: 'Beratung', fr: 'Conseil', ko: '상담', ja: 'カウンセリング', tl: 'Counseling', ar: 'الإرشاد', zh: '咨询', it: 'Consulenza', pt: 'Aconselhamento', vi: 'Tư vấn' },
  'Self-Care Tools': { es: 'Herramientas de autocuidado', de: 'Selbsthilfe-Tools', fr: 'Outils d’autosoins', ko: '자기 관리 도구', ja: 'セルフケアツール', tl: 'Self-Care Tools', ar: 'أدوات العناية الذاتية', zh: '自我护理工具', it: 'Strumenti di cura personale', pt: 'Ferramentas de autocuidado', vi: 'Công cụ tự chăm sóc' },
  'Security Controls': { es: 'Controles de seguridad', de: 'Sicherheitskontrollen', fr: 'Contrôles de sécurité', ko: '보안 제어', ja: 'セキュリティ制御', tl: 'Mga Kontrol sa Seguridad', ar: 'ضوابط الأمان', zh: '安全控制', it: 'Controlli di sicurezza', pt: 'Controles de segurança', vi: 'Kiểm soát bảo mật' },
  'Official public data disclaimer': { es: 'Aviso de datos públicos oficiales', de: 'Hinweis zu offiziellen öffentlichen Daten', fr: 'Avis sur les données publiques officielles', ko: '공식 공개 데이터 고지', ja: '公式公開データ免責事項', tl: 'Paunawa sa opisyal na pampublikong data', ar: 'إخلاء مسؤولية البيانات العامة الرسمية', zh: '官方公共数据免责声明', it: 'Avviso sui dati pubblici ufficiali', pt: 'Aviso de dados públicos oficiais', vi: 'Tuyên bố dữ liệu công khai chính thức' },
  'Independent application notice': { es: 'Aviso de aplicación independiente', de: 'Hinweis zur unabhängigen Anwendung', fr: 'Avis d’application indépendante', ko: '독립 애플리케이션 고지', ja: '独立アプリ通知', tl: 'Paunawa ng independent application', ar: 'إشعار التطبيق المستقل', zh: '独立应用通知', it: 'Avviso applicazione indipendente', pt: 'Aviso de aplicativo independente', vi: 'Thông báo ứng dụng độc lập' },
  'Thank You for Your Service': { es: 'Gracias por su servicio', de: 'Vielen Dank für Ihren Dienst', fr: 'Merci pour votre service', ko: '복무에 감사드립니다', ja: 'ご奉仕に感謝します', tl: 'Salamat sa iyong serbisyo', ar: 'شكراً لخدمتك', zh: '感谢您的服役', it: 'Grazie per il tuo servizio', pt: 'Obrigado pelo seu serviço', vi: 'Cảm ơn sự phục vụ của bạn' },
};

const TERM_TRANSLATIONS = {
  es: {
    'gaining installation': 'instalación de destino', 'losing installation': 'instalación de salida', 'installation': 'instalación', 'branch': 'rama', 'profile': 'perfil', 'family': 'familia', 'children': 'niños', 'child': 'niño', 'age': 'edad', 'rank': 'rango', 'component': 'componente', 'active duty': 'servicio activo', 'reserve': 'reserva', 'national guard': 'guardia nacional', 'dependent': 'dependiente', 'official public': 'público oficial', 'public': 'público', 'data': 'datos', 'security': 'seguridad', 'locally': 'localmente', 'saved': 'guardado', 'device': 'dispositivo', 'housing': 'vivienda', 'school': 'escuela', 'college': 'universidad', 'jobs': 'empleos', 'job': 'empleo', 'remote': 'remoto', 'resource': 'recurso', 'resources': 'recursos', 'checklist': 'lista', 'progress': 'progreso', 'complete': 'completo', 'incomplete': 'incompleto', 'search': 'buscar', 'open': 'abrir', 'verify': 'verificar', 'support': 'apoyo', 'benefits': 'beneficios', 'veteran': 'veterano', 'veterans': 'veteranos', 'spouse': 'cónyuge', 'pets': 'mascotas', 'base': 'base', 'map': 'mapa', 'route': 'ruta', 'departure': 'salida', 'arrival': 'llegada', 'documents': 'documentos', 'education': 'educación', 'employment': 'empleo',
  },
  de: {
    'gaining installation': 'Zielstandort', 'losing installation': 'Abgangsstandort', 'installation': 'Standort', 'branch': 'Teilstreitkraft', 'profile': 'Profil', 'family': 'Familie', 'children': 'Kinder', 'child': 'Kind', 'age': 'Alter', 'rank': 'Dienstgrad', 'component': 'Komponente', 'active duty': 'Aktivdienst', 'reserve': 'Reserve', 'national guard': 'Nationalgarde', 'dependent': 'Angehöriger', 'official public': 'offiziell öffentlich', 'public': 'öffentlich', 'data': 'Daten', 'security': 'Sicherheit', 'locally': 'lokal', 'saved': 'gespeichert', 'device': 'Gerät', 'housing': 'Wohnraum', 'school': 'Schule', 'college': 'Hochschule', 'jobs': 'Jobs', 'job': 'Job', 'remote': 'remote', 'resource': 'Ressource', 'resources': 'Ressourcen', 'checklist': 'Checkliste', 'progress': 'Fortschritt', 'complete': 'fertig', 'search': 'Suchen', 'open': 'Öffnen', 'verify': 'prüfen', 'support': 'Unterstützung', 'benefits': 'Leistungen',
  },
  fr: {
    'gaining installation': 'installation d’arrivée', 'losing installation': 'installation de départ', 'installation': 'installation', 'branch': 'branche', 'profile': 'profil', 'family': 'famille', 'children': 'enfants', 'child': 'enfant', 'age': 'âge', 'rank': 'grade', 'component': 'composante', 'active duty': 'service actif', 'reserve': 'réserve', 'national guard': 'garde nationale', 'dependent': 'personne à charge', 'official public': 'public officiel', 'public': 'public', 'data': 'données', 'security': 'sécurité', 'locally': 'localement', 'saved': 'enregistré', 'device': 'appareil', 'housing': 'logement', 'school': 'école', 'college': 'université', 'jobs': 'emplois', 'job': 'emploi', 'remote': 'à distance', 'resource': 'ressource', 'resources': 'ressources', 'checklist': 'liste', 'progress': 'progrès', 'complete': 'terminé', 'search': 'rechercher', 'open': 'ouvrir', 'verify': 'vérifier', 'support': 'soutien', 'benefits': 'prestations',
  },
  ko: {
    'gaining installation': '도착 기지', 'losing installation': '출발 기지', 'installation': '기지', 'branch': '군별', 'profile': '프로필', 'family': '가족', 'children': '자녀', 'child': '자녀', 'age': '나이', 'rank': '계급', 'component': '신분', 'active duty': '현역', 'reserve': '예비군', 'national guard': '주방위군', 'dependent': '가족 구성원', 'official public': '공식 공개', 'public': '공개', 'data': '데이터', 'security': '보안', 'locally': '로컬에', 'saved': '저장됨', 'device': '기기', 'housing': '주거', 'school': '학교', 'college': '대학', 'jobs': '일자리', 'job': '일자리', 'remote': '원격', 'resource': '자료', 'resources': '자료', 'checklist': '체크리스트', 'progress': '진행률', 'complete': '완료', 'search': '검색', 'open': '열기', 'verify': '확인', 'support': '지원', 'benefits': '혜택',
  },
  ja: {
    'gaining installation': '赴任先基地', 'losing installation': '出発基地', 'installation': '基地', 'branch': '軍種', 'profile': 'プロフィール', 'family': '家族', 'children': '子ども', 'child': '子ども', 'age': '年齢', 'rank': '階級', 'component': '区分', 'active duty': '現役', 'reserve': '予備役', 'national guard': '州兵', 'dependent': '扶養家族', 'official public': '公式公開', 'public': '公開', 'data': 'データ', 'security': 'セキュリティ', 'locally': 'ローカルに', 'saved': '保存済み', 'device': 'デバイス', 'housing': '住宅', 'school': '学校', 'college': '大学', 'jobs': '求人', 'job': '仕事', 'remote': 'リモート', 'resource': 'リソース', 'resources': 'リソース', 'checklist': 'チェックリスト', 'progress': '進捗', 'complete': '完了', 'search': '検索', 'open': '開く', 'verify': '確認', 'support': '支援', 'benefits': '給付',
  },
  tl: {
    'gaining installation': 'gaining installation', 'losing installation': 'losing installation', 'installation': 'installation', 'branch': 'sangay', 'profile': 'profile', 'family': 'pamilya', 'children': 'mga bata', 'child': 'bata', 'age': 'edad', 'rank': 'ranggo', 'component': 'komponente', 'active duty': 'active duty', 'reserve': 'reserve', 'national guard': 'national guard', 'dependent': 'dependent', 'official public': 'opisyal na pampubliko', 'public': 'pampubliko', 'data': 'data', 'security': 'seguridad', 'locally': 'lokal', 'saved': 'naka-save', 'device': 'device', 'housing': 'pabahay', 'school': 'paaralan', 'college': 'kolehiyo', 'jobs': 'trabaho', 'job': 'trabaho', 'remote': 'remote', 'resource': 'resource', 'resources': 'resources', 'checklist': 'checklist', 'progress': 'progreso', 'complete': 'kumpleto', 'search': 'maghanap', 'open': 'buksan', 'verify': 'i-verify', 'support': 'suporta', 'benefits': 'benepisyo',
  },
  ar: {
    'gaining installation': 'المنشأة الجديدة', 'losing installation': 'منشأة المغادرة', 'installation': 'منشأة', 'branch': 'الفرع', 'profile': 'الملف الشخصي', 'family': 'العائلة', 'children': 'الأطفال', 'child': 'طفل', 'age': 'العمر', 'rank': 'الرتبة', 'component': 'المكوّن', 'active duty': 'خدمة فعلية', 'reserve': 'احتياط', 'national guard': 'الحرس الوطني', 'dependent': 'معال', 'official public': 'رسمي عام', 'public': 'عام', 'data': 'بيانات', 'security': 'الأمان', 'locally': 'محلياً', 'saved': 'محفوظ', 'device': 'الجهاز', 'housing': 'السكن', 'school': 'مدرسة', 'college': 'كلية', 'jobs': 'وظائف', 'job': 'وظيفة', 'remote': 'عن بعد', 'resource': 'مورد', 'resources': 'موارد', 'checklist': 'قائمة تحقق', 'progress': 'التقدم', 'complete': 'مكتمل', 'search': 'بحث', 'open': 'فتح', 'verify': 'تحقق', 'support': 'دعم', 'benefits': 'مزايا',
  },
  zh: {
    'gaining installation': '新基地', 'losing installation': '离开基地', 'installation': '设施', 'branch': '军种', 'profile': '档案', 'family': '家庭', 'children': '儿童', 'child': '儿童', 'age': '年龄', 'rank': '军衔', 'component': '身份类别', 'active duty': '现役', 'reserve': '预备役', 'national guard': '国民警卫队', 'dependent': '家属', 'official public': '官方公开', 'public': '公开', 'data': '数据', 'security': '安全', 'locally': '本地', 'saved': '已保存', 'device': '设备', 'housing': '住房', 'school': '学校', 'college': '大学', 'jobs': '工作', 'job': '工作', 'remote': '远程', 'resource': '资源', 'resources': '资源', 'checklist': '清单', 'progress': '进度', 'complete': '完成', 'search': '搜索', 'open': '打开', 'verify': '验证', 'support': '支持', 'benefits': '福利',
  },
  it: {
    'gaining installation': 'base di destinazione', 'losing installation': 'base di partenza', 'installation': 'installazione', 'branch': 'forza armata', 'profile': 'profilo', 'family': 'famiglia', 'children': 'bambini', 'child': 'bambino', 'age': 'età', 'rank': 'grado', 'component': 'componente', 'active duty': 'servizio attivo', 'reserve': 'riserva', 'national guard': 'guardia nazionale', 'dependent': 'familiare', 'official public': 'pubblico ufficiale', 'public': 'pubblico', 'data': 'dati', 'security': 'sicurezza', 'locally': 'localmente', 'saved': 'salvato', 'device': 'dispositivo', 'housing': 'alloggio', 'school': 'scuola', 'college': 'college', 'jobs': 'lavori', 'job': 'lavoro', 'remote': 'remoto', 'resource': 'risorsa', 'resources': 'risorse', 'checklist': 'checklist', 'progress': 'progresso', 'complete': 'completo', 'search': 'cerca', 'open': 'apri', 'verify': 'verifica', 'support': 'supporto', 'benefits': 'benefici',
  },
  pt: {
    'gaining installation': 'instalação de destino', 'losing installation': 'instalação de partida', 'installation': 'instalação', 'branch': 'ramo', 'profile': 'perfil', 'family': 'família', 'children': 'crianças', 'child': 'criança', 'age': 'idade', 'rank': 'patente', 'component': 'componente', 'active duty': 'serviço ativo', 'reserve': 'reserva', 'national guard': 'guarda nacional', 'dependent': 'dependente', 'official public': 'público oficial', 'public': 'público', 'data': 'dados', 'security': 'segurança', 'locally': 'localmente', 'saved': 'salvo', 'device': 'dispositivo', 'housing': 'moradia', 'school': 'escola', 'college': 'faculdade', 'jobs': 'empregos', 'job': 'emprego', 'remote': 'remoto', 'resource': 'recurso', 'resources': 'recursos', 'checklist': 'checklist', 'progress': 'progresso', 'complete': 'completo', 'search': 'pesquisar', 'open': 'abrir', 'verify': 'verificar', 'support': 'apoio', 'benefits': 'benefícios',
  },
  vi: {
    'gaining installation': 'căn cứ đến', 'losing installation': 'căn cứ rời đi', 'installation': 'cơ sở', 'branch': 'quân chủng', 'profile': 'hồ sơ', 'family': 'gia đình', 'children': 'trẻ em', 'child': 'trẻ em', 'age': 'tuổi', 'rank': 'cấp bậc', 'component': 'thành phần', 'active duty': 'tại ngũ', 'reserve': 'dự bị', 'national guard': 'vệ binh quốc gia', 'dependent': 'người phụ thuộc', 'official public': 'công khai chính thức', 'public': 'công khai', 'data': 'dữ liệu', 'security': 'bảo mật', 'locally': 'cục bộ', 'saved': 'đã lưu', 'device': 'thiết bị', 'housing': 'nhà ở', 'school': 'trường học', 'college': 'cao đẳng/đại học', 'jobs': 'việc làm', 'job': 'việc làm', 'remote': 'từ xa', 'resource': 'tài nguyên', 'resources': 'tài nguyên', 'checklist': 'danh sách', 'progress': 'tiến độ', 'complete': 'hoàn tất', 'search': 'tìm kiếm', 'open': 'mở', 'verify': 'xác minh', 'support': 'hỗ trợ', 'benefits': 'quyền lợi',
  },
};

function normalizeLanguage(language) {
  const code = String(language || 'en').toLowerCase();
  return SUPPORTED.has(code) ? code : 'en';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function translatedPhrase(english, lang) {
  return COMMON_PHRASES[english]?.[lang] || null;
}

const sortedCommonPhrases = Object.keys(COMMON_PHRASES).sort((a, b) => b.length - a.length);
const sortedTermsByLang = {};

function sortedTerms(lang) {
  if (!sortedTermsByLang[lang]) {
    sortedTermsByLang[lang] = Object.keys(TERM_TRANSLATIONS[lang] || {}).sort((a, b) => b.length - a.length);
  }
  return sortedTermsByLang[lang];
}

function translateText(original, lang) {
  if (!original || lang === 'en') return original;
  if (!/[A-Za-z]/.test(original)) return original;

  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const compact = original.trim().replace(/\s+/g, ' ');
  const exact = translatedPhrase(compact, lang);
  if (exact) return `${leading}${exact}${trailing}`;

  let output = original;
  for (const phrase of sortedCommonPhrases) {
    const value = translatedPhrase(phrase, lang);
    if (!value || !output.includes(phrase)) continue;
    output = output.split(phrase).join(value);
  }

  const terms = TERM_TRANSLATIONS[lang] || {};
  for (const term of sortedTerms(lang)) {
    const value = terms[term];
    if (!value) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
    output = output.replace(pattern, value);
  }
  return output;
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
  const translated = lang === 'en' ? original : translateText(original, lang);
  if (node.nodeValue !== translated) node.nodeValue = translated;
  node.__pcsTranslatedText = translated;
}

function translateAttribute(element, attr, lang) {
  if (!element.hasAttribute(attr)) return;
  const storeName = `pcsOriginal${attr}`;
  const current = element.getAttribute(attr) || '';
  if (!current || !/[A-Za-z]/.test(current)) return;
  if (!element.dataset[storeName]) element.dataset[storeName] = current;
  const original = element.dataset[storeName];
  const translated = lang === 'en' ? original : translateText(original, lang);
  if (current !== translated) element.setAttribute(attr, translated);
}

function applyRuntimeLanguage(lang) {
  const root = document.getElementById('root') || document.body;
  if (!root) return;
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
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

  root.querySelectorAll('[placeholder], [aria-label], [aria-description], [title], option').forEach((element) => {
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
