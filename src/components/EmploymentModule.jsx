/*
 * Purpose: Employment and Career Center for PCS Express family readiness.
 * Third-party dependencies: React only.
 */

import { useEffect, useMemo, useState } from 'react'

const BASE_CITY = {
  'Fort Liberty': 'Fayetteville, NC',
  'Fort Bragg': 'Fayetteville, NC',
  'Fort Campbell': 'Clarksville, TN',
  'Fort Cavazos': 'Killeen, TX',
  'Fort Hood': 'Killeen, TX',
  'Joint Base Lewis-McChord': 'Tacoma, WA',
  'Fort Carson': 'Colorado Springs, CO',
  'Fort Bliss': 'El Paso, TX',
  'Fort Stewart': 'Hinesville, GA',
  'Fort Drum': 'Watertown, NY',
  'Fort Sill': 'Lawton, OK',
  'Fort Jackson': 'Columbia, SC',
  'Fort Meade': 'Odenton, MD',
  'Fort Knox': 'Radcliff, KY',
  'Fort Leavenworth': 'Leavenworth, KS',
  'Fort Sam Houston': 'San Antonio, TX',
  'Joint Base San Antonio': 'San Antonio, TX',
  'Fort Wainwright': 'Fairbanks, AK',
  'Fort Eisenhower': 'Augusta, GA',
  'Fort Gregg-Adams': 'Petersburg, VA',
  'Fort Leonard Wood': 'Waynesville, MO',
  'Fort Novosel': 'Daleville, AL',
  'Fort Rucker': 'Daleville, AL',
  'Schofield Barracks': 'Wahiawa, HI',
  'Fort Shafter': 'Honolulu, HI',
  'Fort Hamilton': 'Brooklyn, NY',
  'Fort Myer': 'Arlington, VA',
  'Naval Station Norfolk': 'Norfolk, VA',
  'Naval Base San Diego': 'San Diego, CA',
  'NAS Jacksonville': 'Jacksonville, FL',
  'Naval Air Station Jacksonville': 'Jacksonville, FL',
  'NAS Pensacola': 'Pensacola, FL',
  'Naval Air Station Pensacola': 'Pensacola, FL',
  'Naval Station Mayport': 'Jacksonville, FL',
  'Naval Base Kitsap': 'Bremerton, WA',
  'Naval Station Everett': 'Everett, WA',
  'NAS Oceana': 'Virginia Beach, VA',
  'Naval Air Station Oceana': 'Virginia Beach, VA',
  'NAS Whidbey Island': 'Oak Harbor, WA',
  'NAS Corpus Christi': 'Corpus Christi, TX',
  'Marine Corps Base Camp Lejeune': 'Jacksonville, NC',
  'Camp Lejeune': 'Jacksonville, NC',
  'Camp Pendleton': 'Oceanside, CA',
  'MCAS Cherry Point': 'Havelock, NC',
  'MCAS Miramar': 'San Diego, CA',
  'MCB Quantico': 'Quantico, VA',
  'Marine Corps Base Quantico': 'Quantico, VA',
  'MCAS New River': 'Jacksonville, NC',
  'MCB Hawaii Kaneohe Bay': 'Kailua, HI',
  'MCB Hawaii': 'Kailua, HI',
  'MCAS Yuma': 'Yuma, AZ',
  'MCAS Beaufort': 'Beaufort, SC',
  'Joint Base Langley-Eustis': 'Hampton, VA',
  'Eglin AFB': 'Valparaiso, FL',
  'MacDill AFB': 'Tampa, FL',
  'Travis AFB': 'Fairfield, CA',
  'Wright-Patterson AFB': 'Dayton, OH',
  'Joint Base Andrews': 'Clinton, MD',
  'Nellis AFB': 'Las Vegas, NV',
  'Edwards AFB': 'Rosamond, CA',
  'Keesler AFB': 'Biloxi, MS',
  'Little Rock AFB': 'Jacksonville, AR',
  'Dyess AFB': 'Abilene, TX',
  'Luke AFB': 'Glendale, AZ',
  'Davis-Monthan AFB': 'Tucson, AZ',
  'Fairchild AFB': 'Spokane, WA',
  'Hill AFB': 'Ogden, UT',
  'Minot AFB': 'Minot, ND',
  'Malmstrom AFB': 'Great Falls, MT',
  'Ellsworth AFB': 'Rapid City, SD',
  'Hurlburt Field': 'Fort Walton Beach, FL',
  'Moody AFB': 'Valdosta, GA',
  'Shaw AFB': 'Sumter, SC',
  'Seymour Johnson AFB': 'Goldsboro, NC',
  'Buckley SFB': 'Aurora, CO',
  'Schriever SFB': 'Colorado Springs, CO',
  'Peterson SFB': 'Colorado Springs, CO',
  'Patrick SFB': 'Cocoa Beach, FL',
  'Vandenberg SFB': 'Lompoc, CA',
  'Camp Humphreys': 'Pyeongtaek, South Korea',
  'Osan Air Base': 'Pyeongtaek, South Korea',
  'Kadena Air Base': 'Okinawa, Japan',
  'Yokota Air Base': 'Fussa, Japan',
  'Ramstein Air Base': 'Kaiserslautern, Germany',
  'Ramstein AB': 'Kaiserslautern, Germany',
  'USAG Stuttgart': 'Stuttgart, Germany',
  'USAG Wiesbaden': 'Wiesbaden, Germany',
  'USAG Bavaria (Grafenwoehr)': 'Grafenwoehr, Germany',
  'USAG Bavaria (Grafenwöhr)': 'Grafenwoehr, Germany',
  'Naval Station Rota': 'Rota, Spain',
  'Naval Support Activity Naples': 'Naples, Italy',
  'Naval Air Station Sigonella': 'Catania, Italy',
}

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  ko: 'Korean',
  ja: 'Japanese',
  tl: 'Tagalog',
  ar: 'Arabic',
  zh: 'Chinese',
  it: 'Italian',
  pt: 'Portuguese',
  vi: 'Vietnamese',
}

const TEXT = {
  en: {
    title: 'Employment & Career Center',
    subtitle: 'Military spouse and service member employment support near',
    languageNote: 'This view uses your onboarding language. Official program names may remain in English because that is how the source publishes them.',
    sourcePolicy: 'Official U.S. government and military resources are prioritized. LinkedIn, Indeed, ClearanceJobs, Hiring Our Heroes, ACP, SCORE, and IVMF are marked as external or affiliated resources when used.',
    searchLocation: 'Search location',
    keywordLabel: 'Role or keyword',
    keywordHelp: 'Optional. Leave blank to search military spouse-friendly roles.',
    keywordPlaceholder: 'project manager, nurse, cybersecurity, remote',
    open: 'Open',
    openListings: 'Open listings',
    currentListings: 'Active listings',
    official: 'Official',
    external: 'External',
    affiliated: 'Affiliated',
    federal: 'Federal',
    spouse: 'Spouse',
    remote: 'Remote',
    workshop: 'Workshop',
    certification: 'Certification',
    mentorship: 'Mentorship',
    partner: 'Partner',
    business: 'Business',
    resourceText: 'Open this resource for current official guidance and available services.',
    externalText: 'Open this requested external source for current listings. Review each posting directly on the source site before applying.',
    tabJobSearch: 'Job Search',
    tabJobResources: 'Job Resources',
    tabResume: 'Resume Assistance',
    tabInternships: 'Internships',
    tabWorkshops: 'Employment Education Workshops',
    tabCertifications: 'Certifications',
    tabMentorship: 'Mentorship',
    tabSpousePreferred: 'Spouse Preferred',
    tabConnections: 'Connections',
    tabLinkedIn: 'LinkedIn Workshop',
    tabEntrepreneurship: 'Entrepreneurship',
    leadJobSearch: 'Open live searches already tailored to the gaining installation. This removes stale static job cards and avoids empty location pages by using broader current searches.',
    leadJobResources: 'Use official employment portals, military spouse hiring paths, and government career support in one place.',
    leadResume: 'Build a federal-ready resume with official USAJOBS and Department of Labor guidance. Do not place classified, CUI, SSN, or sensitive family information in a resume.',
    leadInternships: 'Find current internship, fellowship, recent graduate, and remote federal student opportunities near the gaining installation when available.',
    leadWorkshops: 'Use free employment classes, career coaching, hiring events, and readiness workshops designed for military spouses and military-connected families.',
    leadCertifications: 'Find no-cost or funded certificate pathways that support portable military spouse careers.',
    leadMentorship: 'Connect with official or vetted mentorship programs for resume review, interviews, networking, and career planning.',
    leadSpousePreferred: 'Find employers and federal hiring paths that actively support military spouse hiring and portable careers.',
    leadConnections: 'Build a professional network before arrival by using spouse employment partners, hiring events, American Job Centers, and professional groups.',
    leadLinkedIn: 'Use LinkedIn intentionally: search for recruiters, follow spouse-friendly employers, and pair LinkedIn searches with MSEP and USAJOBS results.',
    leadEntrepreneurship: 'Explore official and no-cost business training for military spouses who want to start, grow, or relocate a business.',
    resumeTipsTitle: 'Federal resume checklist',
    tip1: 'Read the full job announcement before editing your resume.',
    tip2: 'Mirror the required qualifications and specialized experience with plain language.',
    tip3: 'Use measurable accomplishments and match the announcement keywords honestly.',
    tip4: 'Follow USAJOBS page, file, and formatting guidance before applying.',
    tip5: 'Never include SSN, classified information, CUI, photos, or unrelated personal details.',
    linkedinStepsTitle: 'Recruiter search workflow',
    linkedinStep1: 'Search the target role and gaining location, then filter to People.',
    linkedinStep2: 'Use recruiter, talent acquisition, hiring manager, and military spouse keywords.',
    linkedinStep3: 'Check company pages against MSEP partners or spouse-friendly employer programs.',
    linkedinStep4: 'Send a short message that names the role, location, PCS timeline, and one relevant skill.',
  },
  es: {
    title: 'Centro de empleo y carrera',
    subtitle: 'Apoyo laboral para conyuges militares y miembros del servicio cerca de',
    languageNote: 'Esta vista usa el idioma elegido en onboarding. Algunos nombres oficiales permanecen en ingles porque asi los publica la fuente.',
    sourcePolicy: 'Se priorizan recursos oficiales del gobierno y las fuerzas armadas de EE. UU.; los sitios externos se identifican claramente.',
    searchLocation: 'Ubicacion de busqueda',
    keywordLabel: 'Puesto o palabra clave',
    keywordHelp: 'Opcional. Deje en blanco para buscar puestos favorables para conyuges militares.',
    keywordPlaceholder: 'gerente de proyecto, enfermeria, ciberseguridad, remoto',
    open: 'Abrir',
    openListings: 'Abrir listados',
    currentListings: 'Listados activos',
    official: 'Oficial',
    external: 'Externo',
    affiliated: 'Afiliado',
    federal: 'Federal',
    spouse: 'Conyuge',
    remote: 'Remoto',
    workshop: 'Clase',
    certification: 'Certificacion',
    mentorship: 'Mentoria',
    partner: 'Socio',
    business: 'Negocio',
    resourceText: 'Abra este recurso para ver orientacion oficial y servicios disponibles actualizados.',
    externalText: 'Abra esta fuente externa solicitada para ver listados actuales y revise cada publicacion antes de aplicar.',
    tabJobSearch: 'Busqueda de empleo',
    tabJobResources: 'Recursos de empleo',
    tabResume: 'Ayuda con resume',
    tabInternships: 'Pasantias',
    tabWorkshops: 'Talleres de empleo',
    tabCertifications: 'Certificaciones',
    tabMentorship: 'Mentoria',
    tabSpousePreferred: 'Preferencia para conyuges',
    tabConnections: 'Conexiones',
    tabLinkedIn: 'Taller de LinkedIn',
    tabEntrepreneurship: 'Emprendimiento',
    leadJobSearch: 'Abra busquedas activas adaptadas a la instalacion de destino, sin tarjetas antiguas ni filtros que generan paginas vacias.',
    leadJobResources: 'Use portales oficiales, rutas para conyuges militares y apoyo laboral gubernamental.',
    leadResume: 'Prepare un resume federal con guias oficiales de USAJOBS y el Departamento de Trabajo.',
    leadInternships: 'Encuentre pasantias, becas, oportunidades para recien graduados y opciones remotas cuando esten disponibles.',
    leadWorkshops: 'Use clases gratuitas, coaching, eventos de contratacion y talleres para conyuges militares.',
    leadCertifications: 'Encuentre rutas de certificados gratuitas o financiadas para carreras portatiles.',
    leadMentorship: 'Conecte con programas de mentoria para resume, entrevistas, networking y planificacion.',
    leadSpousePreferred: 'Encuentre empleadores y rutas federales que apoyan la contratacion de conyuges militares.',
    leadConnections: 'Construya una red profesional antes de llegar usando socios, eventos y centros de empleo.',
    leadLinkedIn: 'Use LinkedIn para encontrar reclutadores, empleadores favorables y oportunidades alineadas.',
    leadEntrepreneurship: 'Explore capacitacion oficial y gratuita para iniciar, crecer o reubicar un negocio.',
    resumeTipsTitle: 'Lista para resume federal',
    tip1: 'Lea todo el anuncio antes de editar el resume.',
    tip2: 'Relacione su experiencia con las calificaciones requeridas.',
    tip3: 'Use logros medibles y palabras clave reales del anuncio.',
    tip4: 'Siga las reglas de formato y paginas de USAJOBS.',
    tip5: 'No incluya SSN, informacion clasificada, CUI, fotos ni datos personales innecesarios.',
    linkedinStepsTitle: 'Flujo para buscar reclutadores',
    linkedinStep1: 'Busque el puesto y la ubicacion, luego filtre por personas.',
    linkedinStep2: 'Use palabras como recruiter, talent acquisition y hiring manager.',
    linkedinStep3: 'Compare empresas con socios MSEP o programas para conyuges.',
    linkedinStep4: 'Envíe un mensaje corto con el puesto, ubicacion, fecha PCS y una habilidad relevante.',
  },
  de: {},
  fr: {},
  ko: {},
  ja: {},
  tl: {},
  ar: {},
  zh: {},
  it: {},
  pt: {},
  vi: {},
}

const GENERIC_TRANSLATIONS = {
  de: ['Beschäftigungs- und Karrierezentrum', 'Unterstützung für Ehepartner und Servicemitglieder in der Nähe von', 'Diese Ansicht nutzt die Sprache aus dem Onboarding. Offizielle Programmnamen können auf Englisch bleiben.', 'Offizielle US-Regierungs- und Militärquellen werden priorisiert; externe Quellen sind gekennzeichnet.', 'Suchort', 'Rolle oder Stichwort', 'Optional. Leer lassen, um militärfreundliche Stellen zu suchen.', 'Projektmanager, Pflege, Cybersicherheit, remote', 'Öffnen', 'Stellen öffnen', 'Aktuelle Stellen', 'Offiziell', 'Extern', 'Verbunden', 'Bund', 'Ehepartner', 'Remote', 'Workshop', 'Zertifikat', 'Mentoring', 'Partner', 'Geschäft'],
  fr: ['Centre emploi et carrière', 'Soutien emploi pour conjoints militaires et militaires près de', 'Cette vue utilise la langue choisie dans l’onboarding. Certains noms officiels peuvent rester en anglais.', 'Les sources officielles du gouvernement et de l’armée des États-Unis sont prioritaires; les sources externes sont indiquées.', 'Lieu de recherche', 'Poste ou mot-clé', 'Facultatif. Laissez vide pour chercher des postes favorables aux conjoints militaires.', 'chef de projet, infirmier, cybersécurité, à distance', 'Ouvrir', 'Ouvrir les offres', 'Offres actives', 'Officiel', 'Externe', 'Affilié', 'Fédéral', 'Conjoint', 'À distance', 'Atelier', 'Certification', 'Mentorat', 'Partenaire', 'Entreprise'],
  ko: ['취업 및 커리어 센터', '도착 기지 주변 군 배우자 및 복무자 취업 지원', '이 화면은 온보딩에서 선택한 언어를 사용합니다. 공식 프로그램 이름은 출처 표기상 영어로 남을 수 있습니다.', '미국 정부 및 군 공식 자료를 우선하며 외부 자료는 표시합니다.', '검색 위치', '직무 또는 키워드', '선택 사항입니다. 비워 두면 군 배우자 친화 직무를 검색합니다.', '프로젝트 매니저, 간호, 사이버보안, 원격', '열기', '목록 열기', '활성 목록', '공식', '외부', '제휴', '연방', '배우자', '원격', '워크숍', '자격증', '멘토링', '파트너', '사업'],
  ja: ['雇用・キャリアセンター', '赴任先周辺の軍人配偶者と軍人向け雇用支援', 'この画面はオンボーディングで選んだ言語を使用します。公式名称は出典どおり英語の場合があります。', '米国政府と軍の公式情報を優先し、外部情報は明示します。', '検索場所', '職種またはキーワード', '任意です。空欄の場合は軍人配偶者向けの求人を検索します。', 'プロジェクト管理、看護、サイバーセキュリティ、リモート', '開く', '求人を開く', '有効な求人', '公式', '外部', '提携', '連邦', '配偶者', 'リモート', 'ワークショップ', '認定', 'メンタリング', 'パートナー', '事業'],
  tl: ['Employment at Career Center', 'Suporta sa trabaho para sa military spouse at service member malapit sa', 'Ginagamit ng view na ito ang wikang pinili sa onboarding. Maaaring manatiling Ingles ang opisyal na pangalan ng programa.', 'Inuuna ang opisyal na U.S. government at military sources; malinaw na minamarkahan ang external sources.', 'Lokasyon ng paghahanap', 'Role o keyword', 'Opsyonal. Iwanang blangko para maghanap ng military spouse-friendly roles.', 'project manager, nurse, cybersecurity, remote', 'Buksan', 'Buksan ang listings', 'Aktibong listings', 'Opisyal', 'External', 'Affiliated', 'Federal', 'Spouse', 'Remote', 'Workshop', 'Certification', 'Mentorship', 'Partner', 'Negosyo'],
  ar: ['مركز التوظيف والمسار المهني', 'دعم التوظيف للأزواج العسكريين وأفراد الخدمة قرب', 'تستخدم هذه الصفحة اللغة المختارة أثناء الإعداد. قد تبقى أسماء البرامج الرسمية بالإنجليزية كما تنشرها الجهة الأصلية.', 'يتم إعطاء الأولوية لمصادر الحكومة والجيش الأمريكية الرسمية؛ ويتم تمييز المصادر الخارجية.', 'موقع البحث', 'الدور أو الكلمة المفتاحية', 'اختياري. اتركه فارغا للبحث عن وظائف مناسبة للأزواج العسكريين.', 'مدير مشروع، تمريض، أمن سيبراني، عن بعد', 'فتح', 'فتح القوائم', 'قوائم نشطة', 'رسمي', 'خارجي', 'تابع', 'فدرالي', 'زوج/زوجة', 'عن بعد', 'ورشة', 'شهادة', 'إرشاد مهني', 'شريك', 'عمل تجاري'],
  zh: ['就业与职业中心', '靠近新基地的军人配偶和服役人员就业支持', '本页面使用入门设置中选择的语言。官方项目名称可能按来源保留英文。', '优先使用美国政府和军方官方资源；外部资源会清楚标注。', '搜索地点', '职位或关键词', '可选。留空将搜索军人配偶友好岗位。', '项目经理、护理、网络安全、远程', '打开', '打开职位', '当前职位', '官方', '外部', '附属', '联邦', '配偶', '远程', '工作坊', '证书', '导师', '合作伙伴', '创业'],
  it: ['Centro occupazione e carriera', 'Supporto lavoro per coniugi militari e militari vicino a', 'Questa vista usa la lingua scelta nell’onboarding. Alcuni nomi ufficiali possono restare in inglese.', 'Sono prioritarie le fonti ufficiali del governo e delle forze armate USA; le fonti esterne sono indicate.', 'Località di ricerca', 'Ruolo o parola chiave', 'Facoltativo. Lascia vuoto per cercare ruoli adatti ai coniugi militari.', 'project manager, infermieristica, cybersecurity, remoto', 'Apri', 'Apri offerte', 'Offerte attive', 'Ufficiale', 'Esterno', 'Affiliato', 'Federale', 'Coniuge', 'Remoto', 'Workshop', 'Certificazione', 'Mentorship', 'Partner', 'Impresa'],
  pt: ['Centro de emprego e carreira', 'Apoio de emprego para cônjuges militares e militares perto de', 'Esta tela usa o idioma escolhido no onboarding. Alguns nomes oficiais podem permanecer em inglês.', 'Recursos oficiais do governo e das forças armadas dos EUA são priorizados; fontes externas são identificadas.', 'Local de busca', 'Cargo ou palavra-chave', 'Opcional. Deixe em branco para buscar vagas favoráveis a cônjuges militares.', 'gerente de projeto, enfermagem, cibersegurança, remoto', 'Abrir', 'Abrir vagas', 'Vagas ativas', 'Oficial', 'Externo', 'Afiliado', 'Federal', 'Cônjuge', 'Remoto', 'Workshop', 'Certificação', 'Mentoria', 'Parceiro', 'Negócio'],
  vi: ['Trung tâm việc làm và nghề nghiệp', 'Hỗ trợ việc làm cho vợ/chồng quân nhân và quân nhân gần', 'Màn hình này dùng ngôn ngữ đã chọn khi onboarding. Tên chương trình chính thức có thể vẫn bằng tiếng Anh.', 'Ưu tiên nguồn chính thức của chính phủ và quân đội Hoa Kỳ; nguồn bên ngoài được đánh dấu rõ.', 'Vị trí tìm kiếm', 'Vai trò hoặc từ khóa', 'Tùy chọn. Để trống để tìm vai trò thân thiện với vợ/chồng quân nhân.', 'quản lý dự án, điều dưỡng, an ninh mạng, từ xa', 'Mở', 'Mở danh sách', 'Danh sách hiện có', 'Chính thức', 'Bên ngoài', 'Liên kết', 'Liên bang', 'Vợ/chồng', 'Từ xa', 'Hội thảo', 'Chứng chỉ', 'Cố vấn', 'Đối tác', 'Kinh doanh'],
}

const GENERIC_KEYS = ['title', 'subtitle', 'languageNote', 'sourcePolicy', 'searchLocation', 'keywordLabel', 'keywordHelp', 'keywordPlaceholder', 'open', 'openListings', 'currentListings', 'official', 'external', 'affiliated', 'federal', 'spouse', 'remote', 'workshop', 'certification', 'mentorship', 'partner', 'business']

Object.entries(GENERIC_TRANSLATIONS).forEach(([lang, values]) => {
  GENERIC_KEYS.forEach((key, index) => {
    TEXT[lang][key] = values[index] || TEXT.en[key]
  })
})

const TAB_TRANSLATIONS = {
  de: { tabJobSearch: 'Jobsuche', tabJobResources: 'Job-Ressourcen', tabResume: 'Lebenslaufhilfe', tabInternships: 'Praktika', tabWorkshops: 'Arbeits-Workshops', tabCertifications: 'Zertifikate', tabMentorship: 'Mentoring', tabSpousePreferred: 'Ehepartner bevorzugt', tabConnections: 'Netzwerk', tabLinkedIn: 'LinkedIn-Workshop', tabEntrepreneurship: 'Unternehmertum', resumeTipsTitle: 'Checkliste für Bundeslebenslauf', linkedinStepsTitle: 'Ablauf zur Recruiter-Suche' },
  fr: { tabJobSearch: 'Recherche d’emploi', tabJobResources: 'Ressources emploi', tabResume: 'Aide CV', tabInternships: 'Stages', tabWorkshops: 'Ateliers emploi', tabCertifications: 'Certifications', tabMentorship: 'Mentorat', tabSpousePreferred: 'Priorité conjoint', tabConnections: 'Connexions', tabLinkedIn: 'Atelier LinkedIn', tabEntrepreneurship: 'Entrepreneuriat', resumeTipsTitle: 'Liste CV fédéral', linkedinStepsTitle: 'Recherche de recruteurs' },
  ko: { tabJobSearch: '일자리 검색', tabJobResources: '취업 자료', tabResume: '이력서 지원', tabInternships: '인턴십', tabWorkshops: '취업 워크숍', tabCertifications: '자격증', tabMentorship: '멘토링', tabSpousePreferred: '배우자 우대', tabConnections: '연결', tabLinkedIn: 'LinkedIn 워크숍', tabEntrepreneurship: '창업', resumeTipsTitle: '연방 이력서 체크리스트', linkedinStepsTitle: '채용 담당자 검색 절차' },
  ja: { tabJobSearch: '求人検索', tabJobResources: '就職リソース', tabResume: '履歴書支援', tabInternships: 'インターンシップ', tabWorkshops: '雇用ワークショップ', tabCertifications: '認定', tabMentorship: 'メンタリング', tabSpousePreferred: '配偶者優先', tabConnections: 'つながり', tabLinkedIn: 'LinkedInワークショップ', tabEntrepreneurship: '起業', resumeTipsTitle: '連邦履歴書チェックリスト', linkedinStepsTitle: '採用担当者検索手順' },
  tl: { tabJobSearch: 'Paghahanap ng trabaho', tabJobResources: 'Mga resource sa trabaho', tabResume: 'Tulong sa resume', tabInternships: 'Internships', tabWorkshops: 'Employment workshops', tabCertifications: 'Certifications', tabMentorship: 'Mentorship', tabSpousePreferred: 'Spouse preferred', tabConnections: 'Koneksyon', tabLinkedIn: 'LinkedIn workshop', tabEntrepreneurship: 'Pagnenegosyo', resumeTipsTitle: 'Federal resume checklist', linkedinStepsTitle: 'Recruiter search workflow' },
  ar: { tabJobSearch: 'البحث عن عمل', tabJobResources: 'موارد التوظيف', tabResume: 'مساعدة السيرة الذاتية', tabInternships: 'التدريب العملي', tabWorkshops: 'ورش التوظيف', tabCertifications: 'الشهادات', tabMentorship: 'الإرشاد المهني', tabSpousePreferred: 'أفضلية الزوج/الزوجة', tabConnections: 'العلاقات المهنية', tabLinkedIn: 'ورشة LinkedIn', tabEntrepreneurship: 'ريادة الأعمال', resumeTipsTitle: 'قائمة السيرة الذاتية الفدرالية', linkedinStepsTitle: 'خطوات البحث عن مسؤولي التوظيف' },
  zh: { tabJobSearch: '职位搜索', tabJobResources: '就业资源', tabResume: '简历帮助', tabInternships: '实习', tabWorkshops: '就业工作坊', tabCertifications: '证书', tabMentorship: '导师支持', tabSpousePreferred: '配偶优先', tabConnections: '人脉', tabLinkedIn: 'LinkedIn 工作坊', tabEntrepreneurship: '创业', resumeTipsTitle: '联邦简历清单', linkedinStepsTitle: '招聘人员搜索流程' },
  it: { tabJobSearch: 'Ricerca lavoro', tabJobResources: 'Risorse lavoro', tabResume: 'Aiuto curriculum', tabInternships: 'Tirocini', tabWorkshops: 'Workshop lavoro', tabCertifications: 'Certificazioni', tabMentorship: 'Mentorship', tabSpousePreferred: 'Preferenza coniuge', tabConnections: 'Connessioni', tabLinkedIn: 'Workshop LinkedIn', tabEntrepreneurship: 'Imprenditorialità', resumeTipsTitle: 'Checklist curriculum federale', linkedinStepsTitle: 'Ricerca recruiter' },
  pt: { tabJobSearch: 'Busca de emprego', tabJobResources: 'Recursos de emprego', tabResume: 'Ajuda com currículo', tabInternships: 'Estágios', tabWorkshops: 'Oficinas de emprego', tabCertifications: 'Certificações', tabMentorship: 'Mentoria', tabSpousePreferred: 'Preferência para cônjuge', tabConnections: 'Conexões', tabLinkedIn: 'Oficina LinkedIn', tabEntrepreneurship: 'Empreendedorismo', resumeTipsTitle: 'Checklist de currículo federal', linkedinStepsTitle: 'Busca de recrutadores' },
  vi: { tabJobSearch: 'Tìm việc', tabJobResources: 'Tài nguyên việc làm', tabResume: 'Hỗ trợ hồ sơ', tabInternships: 'Thực tập', tabWorkshops: 'Hội thảo việc làm', tabCertifications: 'Chứng chỉ', tabMentorship: 'Cố vấn', tabSpousePreferred: 'Ưu tiên vợ/chồng', tabConnections: 'Kết nối', tabLinkedIn: 'Hội thảo LinkedIn', tabEntrepreneurship: 'Khởi nghiệp', resumeTipsTitle: 'Danh sách hồ sơ liên bang', linkedinStepsTitle: 'Quy trình tìm nhà tuyển dụng' },
}

Object.entries(TAB_TRANSLATIONS).forEach(([lang, entries]) => {
  Object.assign(TEXT[lang], entries)
})

const COMMON_NON_EN = {
  resourceText: {
    de: 'Öffnen Sie diese Quelle für aktuelle Informationen und verfügbare Dienste.',
    fr: 'Ouvrez cette ressource pour obtenir les informations et services actuels.',
    ko: '현재 안내와 이용 가능한 서비스를 보려면 이 자료를 여십시오.',
    ja: '最新情報と利用可能なサービスを見るには、このリソースを開いてください。',
    tl: 'Buksan ang resource na ito para sa kasalukuyang gabay at serbisyo.',
    ar: 'افتح هذا المورد للاطلاع على الإرشادات والخدمات الحالية.',
    zh: '打开此资源以查看最新指导和可用服务。',
    it: 'Apri questa risorsa per informazioni e servizi aggiornati.',
    pt: 'Abra este recurso para informações e serviços atualizados.',
    vi: 'Mở tài nguyên này để xem hướng dẫn và dịch vụ hiện tại.',
  },
  externalText: {
    de: 'Öffnen Sie diese externe Quelle für aktuelle Listen und prüfen Sie jede Anzeige direkt.',
    fr: 'Ouvrez cette source externe pour les offres actuelles et vérifiez chaque annonce.',
    ko: '현재 목록은 이 외부 출처에서 열고 각 공고를 직접 확인하십시오.',
    ja: '現在の一覧はこの外部ソースで開き、各掲載を直接確認してください。',
    tl: 'Buksan ang external source na ito para sa kasalukuyang listings at suriin ang bawat posting.',
    ar: 'افتح هذا المصدر الخارجي للقوائم الحالية وراجع كل إعلان مباشرة.',
    zh: '打开此外部来源查看当前列表，并直接核对每个职位。',
    it: 'Apri questa fonte esterna per offerte aggiornate e verifica ogni annuncio.',
    pt: 'Abra esta fonte externa para vagas atuais e revise cada publicação.',
    vi: 'Mở nguồn bên ngoài này để xem danh sách hiện tại và kiểm tra từng tin.',
  },
}

Object.keys(COMMON_NON_EN.resourceText).forEach((lang) => {
  TEXT[lang].resourceText = COMMON_NON_EN.resourceText[lang]
  TEXT[lang].externalText = COMMON_NON_EN.externalText[lang]
  TEXT[lang].tabJobSearch = TEXT[lang].tabJobSearch || TEXT.en.tabJobSearch
  TEXT[lang].tabJobResources = TEXT[lang].tabJobResources || TEXT.en.tabJobResources
  TEXT[lang].tabResume = TEXT[lang].tabResume || TEXT.en.tabResume
  TEXT[lang].tabInternships = TEXT[lang].tabInternships || TEXT.en.tabInternships
  TEXT[lang].tabWorkshops = TEXT[lang].tabWorkshops || TEXT.en.tabWorkshops
  TEXT[lang].tabCertifications = TEXT[lang].tabCertifications || TEXT.en.tabCertifications
  TEXT[lang].tabMentorship = TEXT[lang].tabMentorship || TEXT.en.tabMentorship
  TEXT[lang].tabSpousePreferred = TEXT[lang].tabSpousePreferred || TEXT.en.tabSpousePreferred
  TEXT[lang].tabConnections = TEXT[lang].tabConnections || TEXT.en.tabConnections
  TEXT[lang].tabLinkedIn = TEXT[lang].tabLinkedIn || TEXT.en.tabLinkedIn
  TEXT[lang].tabEntrepreneurship = TEXT[lang].tabEntrepreneurship || TEXT.en.tabEntrepreneurship
  // Detailed leads and checklist-style guidance intentionally fall back to
  // the English source text so the app-wide language runtime can produce
  // topic-specific localized guidance instead of repeating one generic phrase.
})

const TAB_ORDER = [
  ['jobSearch', 'tabJobSearch'],
  ['jobResources', 'tabJobResources'],
  ['resume', 'tabResume'],
  ['internships', 'tabInternships'],
  ['workshops', 'tabWorkshops'],
  ['certifications', 'tabCertifications'],
  ['mentorship', 'tabMentorship'],
  ['spousePreferred', 'tabSpousePreferred'],
  ['connections', 'tabConnections'],
  ['linkedin', 'tabLinkedIn'],
  ['entrepreneurship', 'tabEntrepreneurship'],
]

const RESOURCE_SETS = {
  jobResources: [
    { name: 'USAJOBS', badgeKey: 'federal', url: 'https://www.usajobs.gov/', desc: 'Official federal civilian jobs portal with military spouse and veteran hiring paths.', official: true, color: '#1F4E79' },
    { name: 'USAJOBS Military Spouse Hiring Path', badgeKey: 'spouse', url: 'https://milspouse.usajobs.gov/', desc: 'Official USAJOBS entry point for eligible military spouse federal hiring.', official: true, color: '#5B3E8A' },
    { name: 'Military OneSource SECO', badgeKey: 'official', url: 'https://www.militaryonesource.mil/education-employment/seco/', desc: 'Official spouse education and career guidance from Military OneSource.', official: true, color: '#176B6B' },
    { name: 'Military Spouse Employment Partnership', badgeKey: 'spouse', url: 'https://msepjobs.militaryonesource.mil/msep/', desc: 'DoD employment partnership connecting spouses with employers committed to recruiting and retaining military spouses.', official: true, color: '#7A3E16' },
    { name: 'Department of Labor Military Spouse Employment', badgeKey: 'official', url: 'https://www.dol.gov/agencies/vets/veterans/military-spouses/employment', desc: 'Official DOL employment resources for military spouses, including American Job Centers and federal hiring paths.', official: true, color: '#334155' },
    { name: 'CareerOneStop', badgeKey: 'official', url: 'https://www.careeronestop.org/', desc: 'Department of Labor sponsored career, training, resume, and job search tools.', official: true, color: '#255E91' },
  ],
  resume: [
    { name: 'USAJOBS Resume Builder', badgeKey: 'official', url: 'https://help.usajobs.gov/how-to/account/documents/resume', desc: 'Official USAJOBS instructions for building or adding a resume to a profile.', official: true, color: '#1F4E79' },
    { name: 'USAJOBS Federal Resume Guidance', badgeKey: 'official', url: 'https://help.usajobs.gov/faq/application/documents/resume/what-to-include', desc: 'Official guidance on what federal resumes must include and what information to leave out.', official: true, color: '#2C6E49' },
    { name: 'CareerOneStop Resume Guide', badgeKey: 'official', url: 'https://www.careeronestop.org/JobSearch/Resumes/resumes.aspx', desc: 'Department of Labor sponsored resume guidance and examples.', official: true, color: '#255E91' },
    { name: 'SECO Career Coaching', badgeKey: 'official', url: 'https://www.militaryonesource.mil/resources/millife-guides/spouse-career-coaching/', desc: 'Free career coaching for eligible military spouses, including resume and interview support.', official: true, color: '#176B6B' },
  ],
  internships: [
    { name: 'USAJOBS Student Internships', badgeKey: 'federal', url: 'https://help.usajobs.gov/working-in-government/unique-hiring-paths/students', desc: 'Official federal student internship guidance and USAJOBS search entry point.', official: true, color: '#1F4E79' },
    { name: 'USAJOBS Recent Graduates', badgeKey: 'federal', url: 'https://help.usajobs.gov/working-in-government/unique-hiring-paths/recent-graduates', desc: 'Official federal recent graduate pathway guidance.', official: true, color: '#2C6E49' },
    { name: 'Virtual Student Federal Service', badgeKey: 'remote', url: 'https://careers.state.gov/intern/virtual-student-federal-service/', desc: 'Department of State virtual federal internship program for eligible students.', official: true, color: '#5B3E8A' },
    { name: 'Hiring Our Heroes Military Spouse Fellowships', badgeKey: 'affiliated', url: 'https://www.hiringourheroes.org/career-services/fellowships/internships/msfp/', desc: 'Affiliated no-cost fellowship pathway connecting military spouses with employers and professional training.', official: false, color: '#7A3E16' },
  ],
  workshops: [
    { name: 'SECO Career Coaching', badgeKey: 'official', url: 'https://www.militaryonesource.mil/resources/millife-guides/spouse-career-coaching/', desc: 'Free spouse career coaching and employment readiness support.', official: true, color: '#176B6B' },
    { name: 'MySECO', badgeKey: 'official', url: 'https://myseco.militaryonesource.mil/portal/', desc: 'Official DoD spouse education and career portal with tools, coaching, events, and career resources.', official: true, color: '#5B3E8A' },
    { name: 'Hiring Our Heroes Events', badgeKey: 'affiliated', url: 'https://www.hiringourheroes.org/events/', desc: 'Affiliated hiring events, webinars, and spouse employment workshops.', official: false, color: '#7A3E16' },
    { name: 'Department of Labor American Job Centers', badgeKey: 'official', url: 'https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx', desc: 'Official local American Job Center locator for free employment and training help.', official: true, color: '#334155' },
  ],
  certifications: [
    { name: 'MyCAA Scholarship Program', badgeKey: 'official', url: 'https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship', desc: 'Official workforce development scholarship information for eligible military spouses.', official: true, color: '#176B6B' },
    { name: 'MySECO Education and Training', badgeKey: 'official', url: 'https://myseco.militaryonesource.mil/portal/', desc: 'Official spouse career portal for education, licensing, training, and career planning.', official: true, color: '#5B3E8A' },
    { name: 'CareerOneStop Training Finder', badgeKey: 'official', url: 'https://www.careeronestop.org/FindTraining/find-training.aspx', desc: 'Department of Labor sponsored training and certification search tools.', official: true, color: '#255E91' },
    { name: 'IVMF Onward to Opportunity', badgeKey: 'affiliated', url: 'https://ivmf.syracuse.edu/programs/career-training/', desc: 'Affiliated career training and certification pathway for service members, veterans, and military spouses.', official: false, color: '#7A3E16' },
  ],
  mentorship: [
    { name: 'American Corporate Partners Active-Duty Spouse Program', badgeKey: 'mentorship', url: 'https://www.acp-usa.org/programs/active-duty-spouse-program/', desc: 'No-cost one-on-one mentorship for active-duty spouses and eligible surviving spouses.', official: false, color: '#7A3E16' },
    { name: 'SECO Career Coaching', badgeKey: 'official', url: 'https://www.militaryonesource.mil/resources/millife-guides/spouse-career-coaching/', desc: 'Official free spouse career coaching for career goals, networking, resumes, and interviews.', official: true, color: '#176B6B' },
    { name: 'MSEP and SECO 101', badgeKey: 'official', url: 'https://www.militaryonesource.mil/resources/gov/seco-and-msep-101/', desc: 'Official overview of MSEP, SECO, spouse career coaching, and spouse ambassador support.', official: true, color: '#5B3E8A' },
    { name: 'SCORE Mentors', badgeKey: 'affiliated', url: 'https://www.score.org/find-mentor', desc: 'SBA resource partner offering free small business mentoring.', official: false, color: '#334155' },
  ],
  spousePreferred: [
    { name: 'MSEP Job Search', badgeKey: 'spouse', url: 'https://msepjobs.militaryonesource.mil/msep/', desc: 'Official DoD partnership for employers committed to recruiting, hiring, promoting, and retaining military spouses.', official: true, color: '#176B6B' },
    { name: 'USAJOBS Military Spouse Hiring Path', badgeKey: 'federal', url: 'https://milspouse.usajobs.gov/', desc: 'Official federal hiring path for eligible military spouses.', official: true, color: '#1F4E79' },
    { name: 'DOL Military Spouse Employment', badgeKey: 'official', url: 'https://www.dol.gov/agencies/vets/veterans/military-spouses/employment', desc: 'Official DOL spouse employment guidance and priority of service information.', official: true, color: '#334155' },
    { name: 'Hiring Our Heroes Military Spouse Resources', badgeKey: 'affiliated', url: 'https://www.hiringourheroes.org/career-services/military-spouse-resources/', desc: 'Affiliated spouse career events, fellowships, networking, and employer connections.', official: false, color: '#7A3E16' },
  ],
  connections: [
    { name: 'MSEP Partner Network', badgeKey: 'spouse', url: 'https://msepjobs.militaryonesource.mil/msep/', desc: 'Use MSEP to identify employers with an active commitment to military spouse hiring.', official: true, color: '#176B6B' },
    { name: 'SECO Career Coaching', badgeKey: 'official', url: 'https://www.militaryonesource.mil/resources/millife-guides/spouse-career-coaching/', desc: 'Talk with a SECO career coach about networking strategy, resumes, interviews, and portable careers.', official: true, color: '#5B3E8A' },
    { name: 'American Job Center Locator', badgeKey: 'official', url: 'https://www.careeronestop.org/LocalHelp/AmericanJobCenters/american-job-centers.aspx', desc: 'Find local DOL American Job Centers for free employment help near the gaining installation.', official: true, color: '#334155' },
    { name: 'Hiring Our Heroes Events', badgeKey: 'affiliated', url: 'https://www.hiringourheroes.org/events/', desc: 'Attend virtual or in-person hiring and networking events for military-connected job seekers.', official: false, color: '#7A3E16' },
  ],
  linkedin: [
    { name: 'LinkedIn Job Search', badgeKey: 'external', url: 'https://www.linkedin.com/jobs/', desc: 'Use LinkedIn to search current roles, recruiters, and company hiring teams.', official: false, color: '#0A66C2' },
    { name: 'MSEP LinkedIn Page', badgeKey: 'external', url: 'https://www.linkedin.com/company/military-spouse-employment-partnership-msep-', desc: 'Follow MSEP activity and employer-facing spouse employment updates on LinkedIn.', official: false, color: '#0A66C2' },
    { name: 'MSEP Official Portal', badgeKey: 'official', url: 'https://msepjobs.militaryonesource.mil/msep/', desc: 'Verify spouse-friendly employers through the official MSEP portal before outreach.', official: true, color: '#176B6B' },
  ],
  entrepreneurship: [
    { name: 'SBA Military Spouse Businesses', badgeKey: 'official', url: 'https://www.sba.gov/business-guide/grow-your-business/military-spouse-businesses', desc: 'Official SBA guide for military spouse entrepreneurs, including free training and counseling resources.', official: true, color: '#1F4E79' },
    { name: 'SBA Boots to Business', badgeKey: 'official', url: 'https://www.sba.gov/sba-learning-platform/boots-business', desc: 'Official SBA entrepreneurship education program for service members and military spouses.', official: true, color: '#2C6E49' },
    { name: 'Veterans Business Outreach Centers', badgeKey: 'official', url: 'https://www.sba.gov/local-assistance/resource-partners/veterans-business-outreach-center-vboc-program', desc: 'Official SBA partner network for veteran and military spouse business counseling and training.', official: true, color: '#334155' },
    { name: 'SCORE Veteran Entrepreneurs', badgeKey: 'affiliated', url: 'https://www.score.org/veteran-entrepreneurs', desc: 'SBA resource partner with free mentoring and business education for military-connected entrepreneurs.', official: false, color: '#7A3E16' },
    { name: 'IVMF Entrepreneurship Programs', badgeKey: 'affiliated', url: 'https://ivmf.syracuse.edu/programs/entrepreneurship/', desc: 'Affiliated entrepreneurship training programs for veterans, service members, and military family members.', official: false, color: '#5B3E8A' },
  ],
}

function languageFor(profile) {
  const code = String(profile?.language || 'en').toLowerCase()
  return TEXT[code] ? code : 'en'
}

function useCopy(profile) {
  const lang = languageFor(profile)
  return {
    lang,
    text(key) {
      return TEXT[lang]?.[key] || TEXT.en[key] || key
    },
  }
}

function installLabel(profile) {
  const raw = profile?.gainingInstallation || ''
  return raw.split(',')[0].trim() || 'your gaining installation'
}

function cityFor(profile) {
  const installation = installLabel(profile)
  return BASE_CITY[installation] || installation
}

function encoded(value) {
  return encodeURIComponent(String(value || '').trim())
}

function linkStyle(color) {
  return {
    flexShrink: 0,
    alignSelf: 'center',
    padding: '9px 14px',
    borderRadius: 8,
    background: color,
    color: '#FFFFFF',
    textDecoration: 'none',
    fontWeight: 900,
    fontSize: 11,
    border: 0,
  }
}

function Card({ item, copy }) {
  const description = copy.lang === 'en'
    ? item.desc
    : (item.official ? copy.text('resourceText') : copy.text('externalText'))
  const badgeText = copy.text(item.badgeKey || (item.official ? 'official' : 'external'))

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: '#FFFFFF', border: '1px solid #D7E0EA', borderLeft: `4px solid ${item.color || '#334155'}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{item.name}</div>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#FFFFFF', background: item.color || '#334155', padding: '3px 7px', borderRadius: 999, textTransform: 'uppercase' }}>{badgeText}</span>
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.55, color: '#46586B' }}>{description}</div>
        </div>
        <span style={linkStyle(item.color || '#334155')}>{copy.text('open')}</span>
      </div>
    </a>
  )
}

function SectionIntro({ title, lead, children }) {
  return (
    <div style={{ background: '#F7FAFC', border: '1px solid #D7E0EA', borderRadius: 8, padding: 14, marginBottom: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: '#0D1821', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 11, color: '#46586B', lineHeight: 1.55 }}>{lead}</div>
      {children}
    </div>
  )
}

function EmploymentModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('jobSearch')
  const [keyword, setKeyword] = useState('')
  const copy = useCopy(profile)
  const installation = installLabel(profile)
  const searchCity = cityFor(profile)

  // Live job listings from /api/job-listings (RemoteOK + USAJOBS).
  // Empty + fallback=true => keep the existing static portal search
  // cards visible underneath as the verified backup.
  const [liveJobs, setLiveJobs] = useState({ status: 'idle', listings: [], fallback: false, sources: null })
  useEffect(() => {
    if (activeTab !== 'jobSearch') return
    let cancelled = false
    setLiveJobs(s => ({ ...s, status: 'loading' }))
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    // searchCity is "City, ST" - split for the backend.
    const [cityPart, statePart] = String(searchCity || '').split(',').map(s => s && s.trim())
    if (cityPart) params.set('city', cityPart)
    if (statePart) params.set('state', statePart)
    // Debounce keyword changes so we do not fire on every keystroke.
    const t = setTimeout(() => {
      fetch(`/api/job-listings?${params.toString()}`, { headers: { Accept: 'application/json' } })
        .then(r => r.ok ? r.json() : { listings: [], fallback: true })
        .then(data => {
          if (cancelled) return
          setLiveJobs({
            status: 'ready',
            listings: Array.isArray(data?.listings) ? data.listings : [],
            fallback: !!data?.fallback,
            sources: data?.sources || null,
          })
        })
        .catch(() => {
          if (cancelled) return
          setLiveJobs({ status: 'ready', listings: [], fallback: true, sources: null })
        })
    }, 350)
    return () => { cancelled = true; clearTimeout(t) }
  }, [activeTab, keyword, searchCity])

  const liveSearches = useMemo(() => {
    const kw = keyword.trim() || 'military spouse'
    const localKw = encoded(kw)
    const loc = encoded(searchCity)
    const spouseKw = encoded(`${kw} military spouse`)
    return [
      { name: `USAJOBS - ${searchCity}`, badgeKey: 'federal', url: `https://www.usajobs.gov/Search/Results?k=${localKw}&l=${loc}`, desc: 'Current federal listings near the gaining installation. Use USAJOBS filters for remote, telework, pay grade, agency, and hiring path.', official: true, color: '#1F4E79' },
      { name: 'USAJOBS Military Spouse Hiring Path', badgeKey: 'spouse', url: 'https://milspouse.usajobs.gov/', desc: 'Official federal hiring path for eligible military spouses.', official: true, color: '#5B3E8A' },
      { name: `LinkedIn - ${searchCity}`, badgeKey: 'external', url: `https://www.linkedin.com/jobs/search/?keywords=${spouseKw}&location=${loc}`, desc: 'Requested external job board search for current local or remote roles. Use LinkedIn filters for remote, hybrid, company, and date posted.', official: false, color: '#0A66C2' },
      { name: `Indeed - ${searchCity}`, badgeKey: 'external', url: `https://www.indeed.com/jobs?q=${spouseKw}&l=${loc}`, desc: 'Requested external job board search for current local or remote roles. Use date posted and remote filters on Indeed.', official: false, color: '#2557A7' },
      { name: `ClearanceJobs - ${searchCity}`, badgeKey: 'external', url: `https://www.clearancejobs.com/jobs?keywords=${localKw}&location=${loc}`, desc: 'Requested external clearance-friendly job board search. Verify eligibility and clearance requirements on each posting.', official: false, color: '#334155' },
      { name: 'MSEP Military Spouse Employers', badgeKey: 'spouse', url: 'https://msepjobs.militaryonesource.mil/msep/', desc: 'Official DoD employment partnership for spouse-friendly employers and current opportunities.', official: true, color: '#176B6B' },
    ]
  }, [keyword, searchCity])

  const internshipSearches = useMemo(() => {
    const loc = encoded(searchCity)
    return [
      { name: `USAJOBS Internships - ${searchCity}`, badgeKey: 'federal', url: `https://www.usajobs.gov/Search/Results?k=internship&l=${loc}&hp=student`, desc: 'Current USAJOBS internship search near the gaining installation using the student hiring path.', official: true, color: '#1F4E79' },
      { name: 'USAJOBS Remote Internships', badgeKey: 'remote', url: 'https://www.usajobs.gov/Search/Results?k=internship&rmi=true&hp=student', desc: 'Current USAJOBS remote internship search for users who need portable options.', official: true, color: '#2C6E49' },
      ...RESOURCE_SETS.internships,
    ]
  }, [searchCity])

  const tabs = TAB_ORDER.map(([id, labelKey]) => ({ id, label: copy.text(labelKey) }))
  const tabStyle = (id) => ({
    padding: '8px 10px',
    borderRadius: 8,
    border: `1.5px solid ${activeTab === id ? theme.primary : '#D7E0EA'}`,
    background: activeTab === id ? theme.primary : '#FFFFFF',
    color: activeTab === id ? '#FFFFFF' : '#46586B',
    fontSize: 10,
    fontWeight: 900,
    cursor: 'pointer',
    letterSpacing: '.03em',
    textTransform: 'uppercase',
  })

  const renderCards = (items) => items.map((item) => <Card key={`${item.name}-${item.url}`} item={item} copy={copy} />)

  return (
    <div style={{ padding: 16 }} dir={copy.lang === 'ar' ? 'rtl' : 'ltr'} lang={copy.lang}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 2 }}>{copy.text('title')}</div>
      <div style={{ fontSize: 11, color: '#46586B', marginBottom: 10 }}>{copy.text('subtitle')} {searchCity}</div>
      <div style={{ background: '#EDF4FA', border: '1px solid #D7E0EA', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: '#334155', letterSpacing: '.09em', marginBottom: 4 }}>{copy.text('searchLocation')}</div>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#0D1821' }}>{installation} - {searchCity}</div>
        <div style={{ fontSize: 11, color: '#46586B', lineHeight: 1.55, marginTop: 6 }}>{copy.text('sourcePolicy')}</div>
        {copy.lang !== 'en' && <div style={{ fontSize: 11, color: '#46586B', lineHeight: 1.55, marginTop: 5 }}>{copy.text('languageNote')} ({LANGUAGE_NAMES[copy.lang] || copy.lang})</div>}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'jobSearch' && (
        <div>
          <SectionIntro title={copy.text('tabJobSearch')} lead={copy.text('leadJobSearch')}>
            <label style={{ display: 'block', marginTop: 12, fontSize: 11, fontWeight: 900, color: '#334155' }} htmlFor="employment-keyword">{copy.text('keywordLabel')}</label>
            <input
              id="employment-keyword"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={copy.text('keywordPlaceholder')}
              style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '11px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none', background: '#FFFFFF', color: '#0D1821' }}
            />
            <div style={{ marginTop: 6, fontSize: 10, color: '#66788A' }}>{copy.text('keywordHelp')}</div>
          </SectionIntro>

          {liveJobs.status === 'loading' && (
            <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: '#46586B' }}>
              Searching live job listings...
            </div>
          )}

          {liveJobs.status === 'ready' && liveJobs.listings.length > 0 && (
            <section style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.1em', marginBottom: 10, textTransform: 'uppercase' }}>
                Live job listings · {liveJobs.listings.length}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {liveJobs.listings.map(job => (
                  <a
                    key={job.id}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#FFFFFF', border: '1px solid #D7E0EA', borderLeft: `4px solid ${theme.accent || '#C99A3D'}`, borderRadius: 10, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4, lineHeight: 1.3 }}>{job.title}</div>
                    {job.company && (
                      <div style={{ fontSize: 11, color: '#46586B', marginBottom: 4, fontWeight: 600 }}>{job.company}</div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      <span style={{ background: job.source === 'USAJOBS' ? '#EAF4FF' : '#F0F4F8', color: job.source === 'USAJOBS' ? '#0D3B66' : '#243447', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                        {job.source}
                      </span>
                      {job.remote && (
                        <span style={{ background: '#ECFDF5', color: '#065F46', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>Remote</span>
                      )}
                      {job.location && (
                        <span style={{ background: '#F3F4F6', color: '#46586B', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{job.location.length > 40 ? job.location.slice(0, 40) + '...' : job.location}</span>
                      )}
                      {job.salaryDisplay && (
                        <span style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>{job.salaryDisplay}</span>
                      )}
                    </div>
                    {job.description && (
                      <div style={{ fontSize: 11, color: '#46586B', lineHeight: 1.5, marginBottom: 8 }}>{job.description}</div>
                    )}
                    <div style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: 6, background: theme.primary, color: '#FFF', fontSize: 11, fontWeight: 800 }}>View posting</div>
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#66788A', lineHeight: 1.5, marginTop: 8 }}>
                Listings refreshed hourly. Federal listings appear when a USAJOBS API key is configured. Verify role details, eligibility, security clearance, and posted salary on the original posting before applying.
              </div>
            </section>
          )}

          {liveJobs.status === 'ready' && liveJobs.listings.length === 0 && (
            <div style={{ background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 11, color: '#0D3B66', lineHeight: 1.5 }}>
              No live listings matched right now. Try a broader keyword or open one of the verified job-search portals below.
            </div>
          )}

          <div style={{ fontSize: 10, fontWeight: 900, color: '#66788A', letterSpacing: '.1em', marginBottom: 10 }}>{copy.text('currentListings')}</div>
          {renderCards(liveSearches)}
        </div>
      )}

      {activeTab === 'jobResources' && (
        <div>
          <SectionIntro title={copy.text('tabJobResources')} lead={copy.text('leadJobResources')} />
          {renderCards(RESOURCE_SETS.jobResources)}
        </div>
      )}

      {activeTab === 'resume' && (
        <div>
          <SectionIntro title={copy.text('tabResume')} lead={copy.text('leadResume')} />
          <div style={{ background: '#FFFFFF', border: '1px solid #D7E0EA', borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821', marginBottom: 8 }}>{copy.text('resumeTipsTitle')}</div>
            {(copy.lang === 'en' || copy.lang === 'es'
              ? [copy.text('tip1'), copy.text('tip2'), copy.text('tip3'), copy.text('tip4'), copy.text('tip5')]
              : [copy.text('resourceText')]
            ).map((tip, index, list) => (
              <div key={tip} style={{ display: 'flex', gap: 8, marginBottom: index === list.length - 1 ? 0 : 7, color: '#46586B', fontSize: 11, lineHeight: 1.45 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: theme.primary, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 900 }}>{index + 1}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
          {renderCards(RESOURCE_SETS.resume)}
        </div>
      )}

      {activeTab === 'internships' && (
        <div>
          <SectionIntro title={copy.text('tabInternships')} lead={copy.text('leadInternships')} />
          {renderCards(internshipSearches)}
        </div>
      )}

      {activeTab === 'workshops' && (
        <div>
          <SectionIntro title={copy.text('tabWorkshops')} lead={copy.text('leadWorkshops')} />
          {renderCards(RESOURCE_SETS.workshops)}
        </div>
      )}

      {activeTab === 'certifications' && (
        <div>
          <SectionIntro title={copy.text('tabCertifications')} lead={copy.text('leadCertifications')} />
          {renderCards(RESOURCE_SETS.certifications)}
        </div>
      )}

      {activeTab === 'mentorship' && (
        <div>
          <SectionIntro title={copy.text('tabMentorship')} lead={copy.text('leadMentorship')} />
          {renderCards(RESOURCE_SETS.mentorship)}
        </div>
      )}

      {activeTab === 'spousePreferred' && (
        <div>
          <SectionIntro title={copy.text('tabSpousePreferred')} lead={copy.text('leadSpousePreferred')} />
          {renderCards(RESOURCE_SETS.spousePreferred)}
        </div>
      )}

      {activeTab === 'connections' && (
        <div>
          <SectionIntro title={copy.text('tabConnections')} lead={copy.text('leadConnections')} />
          {renderCards(RESOURCE_SETS.connections)}
        </div>
      )}

      {activeTab === 'linkedin' && (
        <div>
          <SectionIntro title={copy.text('tabLinkedIn')} lead={copy.text('leadLinkedIn')} />
          <div style={{ background: '#FFFFFF', border: '1px solid #D7E0EA', borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0D1821', marginBottom: 8 }}>{copy.text('linkedinStepsTitle')}</div>
            {(copy.lang === 'en' || copy.lang === 'es'
              ? [copy.text('linkedinStep1'), copy.text('linkedinStep2'), copy.text('linkedinStep3'), copy.text('linkedinStep4')]
              : [copy.text('externalText')]
            ).map((step, index, list) => (
              <div key={step} style={{ display: 'flex', gap: 8, marginBottom: index === list.length - 1 ? 0 : 7, color: '#46586B', fontSize: 11, lineHeight: 1.45 }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: '#0A66C2', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 900 }}>{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          {renderCards(RESOURCE_SETS.linkedin)}
        </div>
      )}

      {activeTab === 'entrepreneurship' && (
        <div>
          <SectionIntro title={copy.text('tabEntrepreneurship')} lead={copy.text('leadEntrepreneurship')} />
          {renderCards(RESOURCE_SETS.entrepreneurship)}
        </div>
      )}
    </div>
  )
}

export default EmploymentModule
