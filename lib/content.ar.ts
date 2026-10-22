/**
 * Arabic copy for the public site. Parallel to lib/content.ts.
 * Product and technical names stay in English on purpose.
 * Posts are not translated here; each post keeps the language it was written in.
 */
import type { Mandate, PrivacyBlock, Role } from "./content";

export const profile = {
  name: "طارق الغزي",
  short: "الغزي",
  role: "رئيس خدمات السحابة، الشرق الأوسط وشمال أفريقيا",
  location: "الرياض، المملكة العربية السعودية",
  linkedin: "https://www.linkedin.com/in/tareq-alghazzi",
  statement: "أبني منصات سحابية تصمد في الواقع.",
  deck: "طارق الغزي، رئيس خدمات السحابة في الشرق الأوسط وشمال أفريقيا. منصات Azure تصمد في الواقع: landing zones، وترحيل، وFinOps، وحوكمة للجهات الخاضعة للتنظيم.",
  availability: "ممارستي الخاصة موضحة في صفحة الأعمال.",
} as const;

export const about = [
  "أبني منصات سحابية تصمد في الواقع. لا شرائح تُعرض ثم تُنسى. ولا جهدًا تقريبيًا. ولا «يعمل في المختبر».",
  "صمّمت وحكمت وسلّمت بيئات Azure آمنة لمصارف وجهات خاضعة للتنظيم في المملكة العربية السعودية وعبر منطقة الشرق الأوسط وشمال أفريقيا. يشمل العمل landing zones وفق CAF وWell-Architected، وترحيل البنية، والهوية والوصول، وFinOps، وحوكمة تصمد في الإنتاج وأمام التدقيق.",
  "أقود اليوم خدمات السحابة لهذه المنطقة في Mobiz IT. وسبق أن عملت معماريًا رئيسيًا للسحابة في بنك البلاد، وقُدت تحولات Azure امتدت لسنوات.",
  "تركيزي بسيط: منصات تبقى موثوقة حين تتعطل الأشياء، ومتوافقة حين يصل المدققون، وكفؤة في التكلفة حين يكبر الحجم. إذا كان على سحابتك أن تعمل في الإنتاج، لا في العرض فقط، فهذا هو العمل الذي أقوم به.",
] as const;

export const stages = [
  {
    n: "01",
    title: "المسار المعياري",
    body: "أسمي المعيار والاستثناء قبل أن أرسم شيئًا. إذا لم يملك أحد الاثنين، سينحرف التصميم.",
  },
  {
    n: "02",
    title: "Landing zone",
    body: "الـ landing zone هو نموذج التشغيل. Dev وSIT وUAT والإنتاج تعمل بالضوابط نفسها. الإنتاج ليس تصميمًا منفصلًا.",
  },
  {
    n: "03",
    title: "موجات الترحيل",
    body: "أنقل البيئة على موجات، مع الاعتماديات ومسار للتراجع. التصميم الذي لا يعمل إلا في ورشة لم يكتمل.",
  },
  {
    n: "04",
    title: "التسليم",
    body: "ينتهي العمل حين يستطيع الفريق الحفاظ على المعيار. يبقى المالكون وإجراءات التشغيل بعد انتهاء المشروع.",
  },
] as const;

export const problems = {
  title: "ما الذي يسوء فعلًا",
  intro: "أرى الأنماط نفسها في المؤسسات الخاضعة للتنظيم. لوحة المتابعة غالبًا سليمة. المنصة ليست كذلك.",
  items: [
    {
      title: "درجة خضراء",
      body: "درجة الامتثال خضراء، والمنصة ما زالت غير جاهزة للتشغيل.",
    },
    {
      title: "نسخ احتياطي أخضر",
      body: "لوحة النسخ الاحتياطي خضراء. لم يستعد أحد منها.",
    },
    {
      title: "الحجم كدليل على النضج",
      body: "يُعامل حجم الترحيل كدليل على أن السحابة نضجت.",
    },
    {
      title: "وكيل قبل السباكة",
      body: "يُبنى وكيل ذكاء اصطناعي قبل أن يملك أحد البيانات والصلاحيات.",
    },
    {
      title: "معيار بلا مالك",
      body: "يوجد معيار، ومجموعة استثناءات لا يستطيع أحد تفسيرها في أسبوع سيئ.",
    },
  ],
  reframe:
    "هذه مشكلات ملكية. أعمل على المسار المعياري، وعلى landing zone كنموذج تشغيل، وعلى التسليم، كي تصمد المنصة في الإنتاج وأمام التدقيق.",
} as const;

export const expertise = [
  {
    title: "landing zones وبنية Azure",
    body: "تصاميم CAF وWAF وlanding zones تُنفَّذ ولا تبقى وثيقة. الهوية والشبكة والأمن والإدارة والحوكمة من اليوم الأول.",
  },
  {
    title: "الترحيل واسع النطاق",
    body: "ترحيل IaaS والأجهزة الافتراضية بضبط: تخطيط الانتقال الفعلي، ورسم الاعتماديات، ومسار للرجوع.",
  },
  {
    title: "الأمن والامتثال",
    body: "معالجة الثغرات الأمنية وأدلة جاهزة للتدقيق في الأسواق المنظَّمة. ضوابط موجودة في المنصة، لا على الورق فقط.",
  },
  {
    title: "الهوية والوصول",
    body: "بنية الهوية والوصول المميز للبيئات الخاضعة للتنظيم.",
  },
  {
    title: "FinOps وحوكمة التكلفة",
    body: "وضوح التكلفة، وضبط الحجم، وتحسين مستمر كي تبقى المنصة كفؤة مع اتساعها.",
  },
  {
    title: "الحوكمة ونماذج التشغيل",
    body: "الملكية والسياسة والمراقبة والعمليات التي تبقي المنصة سليمة بعد انتهاء المشروع.",
  },
  {
    title: "تصميم الارتباط",
    body: "تحليل الفجوات، وتحديد نطاق واقعي، وبيانات نطاق العمل التي توازن الجهد والمخاطر والمخرجات.",
  },
] as const;

export const convictions = [
  {
    index: "01",
    title: "السحابة ليست بنية تحتية",
    body: "السحابة الإقليمية قدرة: استراتيجية واحدة، ونموذج تشغيل واحد، وقرارات تقنية يمكن شرحها بلغة المال والتنظيم.",
  },
  {
    index: "02",
    title: "النضج انضباط",
    body: "حجم الترحيل لا يصنع النضج. يصنعه الانضباط التشغيلي وشفافية التكلفة وبنى تصمد في Dev وSIT وUAT والإنتاج.",
  },
  {
    index: "03",
    title: "الذكاء الاصطناعي يحتاج حاكمًا",
    body: "الذكاء الاصطناعي ميزة تنافسية حين تكون المنصة جاهزة والضبط حقيقيًا. من دون حوكمة ليس إلا طريقًا أسرع إلى المخاطر.",
  },
] as const;

export const mandates: Mandate[] = [
  {
    id: "strategy",
    title: "استراتيجية سحابة إقليمية",
    summary: "استراتيجية واحدة للسحابة والذكاء الاصطناعي عبر الدول، مربوطة بالبنية والمال والتنظيم ونتيجة الأعمال.",
    points: [
      "امتلاك الاستراتيجية الإقليمية والتنفيذ، لا شريحة تتوقف عند الاشتراك",
      "مواءمة بنية المؤسسة مع الحوكمة المالية والمتطلبات التنظيمية",
      "توحيد طريقة تبني الأسواق للمنصة بدل اختراع منصة جديدة في كل مرة",
    ],
  },
  {
    id: "governance",
    title: "landing zones والحوكمة",
    summary: "landing zones وفق CAF وWell-Architected، بنموذج التشغيل نفسه من Dev/SIT حتى UAT والإنتاج.",
    points: [
      "نموذج حوكمة متوافق مع Cloud Adoption Framework وWell-Architected Framework",
      "بنية landing zone موحّدة عبر البيئات",
      "ضوابط حاكمة تستطيع الفرق البناء داخلها، لا لجنة مراجعة تصل بعد الإطلاق",
    ],
  },
  {
    id: "finops",
    title: "FinOps",
    summary: "وضوح التكلفة والمساءلة والتحسين بوصفها جزءًا من البنية.",
    points: [
      "نموذج تشغيل FinOps عبر الأسواق",
      "ذكاء تكلفة تستطيع القيادة أن تتصرف بناءً عليه",
      "الموثوقية والأداء والإنفاق تُصمَّم معًا",
    ],
  },
  {
    id: "ai",
    title: "جاهزية منصة الذكاء الاصطناعي",
    summary: "أحمال العمل المؤسسية ومبادرات LLM على منصة جاهزة فعلًا: الهوية والبيانات والتكلفة والضبط داخلة في التصميم.",
    points: [
      "تمكين أحمال العمل المدفوعة بالذكاء الاصطناعي",
      "جاهزية المنصة لأحمال العمل المتقدمة ومبادرات LLM المؤسسية",
      "أتمتة تزيل العمل اليدوي وتقصّر مدة التسليم",
    ],
  },
  {
    id: "security",
    title: "الأمن وIAM والمرونة",
    summary: "الهوية والامتثال والمرونة تُصمَّم لكل ولاية قضائية، والتعافي من الكوارث والتوافر العالي استراتيجية لا تذكرة.",
    points: [
      "توحيد الأمن وIAM إقليميًا عبر الولايات القضائية",
      "أطر أمن وهوية وامتثال للسحابة المتعددة",
      "التعافي من الكوارث والتوافر العالي من التصميم",
      "ممارسة DevSecOps عبر المشهد",
    ],
  },
];

export const roles: Role[] = [
  {
    id: "mobiz",
    org: "Mobiz IT",
    title: "رئيس خدمات السحابة",
    start: "نوفمبر 2025",
    end: "حتى الآن",
    span: "نوفمبر 2025 — حتى الآن",
    place: "الرياض، المملكة العربية السعودية",
    era: "Leadership",
    summary:
      "قيادة استراتيجية Azure وبنيتها وتنفيذها في الشرق الأوسط وشمال أفريقيا. landing zones، والترحيل، ومعالجة الأمن، وFinOps، ومنصات ذكاء اصطناعي عملية للجهات الخاضعة للتنظيم. العمل يجب أن يصمد في الإنتاج وفي التدقيق.",
    points: [
      "إرساء نموذج حوكمة سحابية إقليمي متوافق مع CAF وإطار Well-Architected",
      "تطبيق انضباط FinOps لوضوح التكلفة والمساءلة والتحسين عبر الأسواق",
      "توحيد بنية landing zone ونماذج التشغيل عبر Dev/SIT وUAT والإنتاج",
      "تمهيد جاهزية منصة الذكاء الاصطناعي لأحمال العمل المتقدمة ومبادرات LLM المؤسسية",
      "قيادة توحيد الأمن وIAM إقليميًا عبر الولايات القضائية",
      "تصميم استراتيجية المرونة، بما فيها التعافي من الكوارث والتوافر العالي",
      "بناء فرق هندسة السحابة والمنصات وتوسيعها عبر اختصاصات متعددة",
    ],
  },
  {
    id: "albilad",
    org: "بنك البلاد",
    title: "المعماري الرئيسي للسحابة",
    start: "ديسمبر 2022",
    end: "نوفمبر 2025",
    span: "ديسمبر 2022 — نوفمبر 2025",
    place: "الرياض، المملكة العربية السعودية",
    era: "Leadership",
    summary:
      "قيادة عمل Azure لسنوات في مصرف سعودي خاضع للتنظيم: landing zones، وبرامج ترحيل، ومواءمة الأمن والامتثال، وبناء القدرة الداخلية. التركيز على منصات تصمد في التشغيل والتدقيق، لا على الشرائح.",
    points: [
      "تصميم landing zones وخدمات أساسية وفق CAF وWell-Architected وتطويرها لعقارات متعددة البيئات",
      "دفع الأتمتة وDevOps وتحسينات الذكاء الاصطناعي لخفض العمل اليدوي وتسريع التسليم",
      "ترسيخ FinOps والضوابط الحاكمة بحيث تكون التكلفة والموثوقية والأداء جزءًا من التصميم",
      "مواءمة نواب الرئيس وكبار المسؤولين على المقايضات، وتحويل الحوادث إلى معايير",
    ],
  },
  {
    id: "ajlan",
    org: "Ajlan & Bros Holding Group Abilitii",
    title: "مهندس حلول سحابية",
    start: "مارس 2022",
    end: "ديسمبر 2022",
    span: "مارس 2022 — ديسمبر 2022",
    place: "الرياض، المملكة العربية السعودية",
    era: "Architecture",
    summary:
      "كان يرفع تقاريره إلى الرئيس التنفيذي لـ AjlanTech. قاد عرض الحل السحابي مع مورّد سحابة جديد، لاستهداف أعمال رؤية 2030 عبر القطاعات.",
    points: [
      "تموضع العروض عبر IaaS وPaaS وSaaS، إضافة إلى الذكاء الاصطناعي وIoT",
      "العمل مع الفريق التجاري من إنشاء المشروع من الصفر حتى سياقات الاستحواذ",
    ],
  },
  {
    id: "crayon",
    org: "Crayon",
    title: "مهندس حلول سحابية",
    start: "مارس 2018",
    end: "فبراير 2022",
    span: "مارس 2018 — فبراير 2022",
    place: "الرياض، المملكة العربية السعودية",
    era: "Architecture",
    summary:
      "معماري ما قبل البيع للسحابة لحسابات المؤسسات والخدمات المالية. تولى المسار التقني من دراسة الجدوى والبنية إلى إثبات المفهوم والامتثال والقرار في الغرفة مع كبار التنفيذيين.",
    points: [
      "تصميم أحمال Azure وMicrosoft 365 / EMS، بما فيها البيئات الهجينة",
      "الاختيار بين lift-and-shift وبناء منصات Dev أو Production جديدة",
      "قيادة تقييمات الامتثال على بنى Azure المقترحة",
      "إدارة نقاشات القيمة التقنية والاقتصادية التي قادت قرارات التنفيذ",
      "مسؤولية جودة الانضمام مع Microsoft Services أو الشركاء، وأهداف الاستخدام بعدها",
    ],
  },
  {
    id: "dimensions",
    org: "Dimensions Cloud",
    title: "معماري السحابة والبنية التحتية",
    start: "سبتمبر 2016",
    end: "مارس 2018",
    span: "سبتمبر 2016 — مارس 2018",
    place: "الرياض، المملكة العربية السعودية",
    era: "Architecture",
    summary:
      "ما قبل البيع لسحابة Microsoft وP-Seller. قدّم المشورة في بنية أحمال العمل ونشرها إلى Office 365 وAzure، وتابع ارتباط العميل عبر إثباتات المفهوم ونقاشات القيمة مع التنفيذيين.",
    points: [
      "خبرة نشر سحابي من الطرف إلى الطرف لـ Office 365 وAzure",
      "مشاريع تنفيذ وإثباتات مفهوم",
      "حوارات تقنية واقتصادية مع كبار تنفيذيي العملاء",
    ],
  },
  {
    id: "alnafitha",
    org: "Alnafitha International Information Technology",
    title: "مهندس حلول سحابة Microsoft",
    start: "يوليو 2014",
    end: "أغسطس 2016",
    span: "يوليو 2014 — أغسطس 2016",
    place: "جدة، المملكة العربية السعودية",
    era: "Architecture",
    summary:
      "قدّم المشورة في بنية أحمال العمل السحابية ونشرها إلى Office 365 وAzure، من الجدوى والعرض حتى الامتثال وأسلوب الترحيل والانضمام.",
    points: [
      "بنية تقنية للتطبيقات وأحمال العمل المختارة",
      "تقييمات امتثال على تصاميم Azure المقترحة",
      "بنى Office 365 هجينة، ومسارات lift-and-shift أو منصة جديدة إلى Azure",
      "توثيق الممارسات لفرق الهندسة والبنية لدى العميل",
    ],
  },
  {
    id: "rtech",
    org: "R-Tech Saudi Arabia",
    title: "مهندس Microsoft",
    start: "أكتوبر 2012",
    end: "يوليو 2014",
    span: "أكتوبر 2012 — يوليو 2014",
    place: "جدة، المملكة العربية السعودية",
    era: "Engineering",
    summary: "Technical Solution Professional، في الجانب الهندسي من أعمال Microsoft مع العملاء في جدة.",
    points: ["عمل حلول تقنية سبق أدوار بنية ما قبل البيع اللاحقة"],
  },
  {
    id: "alsaqer",
    org: "United Al-Saqer Group",
    title: "مهندس تقني أول",
    start: "يوليو 2010",
    end: "ديسمبر 2011",
    span: "يوليو 2010 — ديسمبر 2011",
    place: "أبوظبي، الإمارات العربية المتحدة",
    era: "Engineering",
    summary: "تخطيط منظومة تطبيقات مبنية لغرض محدد لـ Abu Dhabi Motors وتنفيذها: صالة عرض BMW، والصيانة، والخدمة.",
    points: [
      "بناء الخوادم والعتاد والتخزين والخدمات وإعادة بنائها وفق معايير المشروع",
      "تركيب بنية الأنظمة وتطبيقات إدارة الأصول",
      "كتابة إجراءات التركيب والتهيئة وإبقاء معايير الأنظمة محدَّثة",
      "إدارة أجزاء المشروع وفق الالتزامات المتفق عليها، وإبقاء الموردين واللجنة التوجيهية على خط واحد",
    ],
  },
  {
    id: "nevotek",
    org: "Nevotek",
    title: "مهندس خدمة العملاء",
    start: "مارس 2007",
    end: "مايو 2010",
    span: "مارس 2007 — مايو 2010",
    place: "دبي، الإمارات العربية المتحدة",
    era: "Engineering",
    summary: "تخطيط تطبيقات مبنية لغرض محدد لأنظمة هواتف Cisco IP وتنفيذها.",
    points: [
      "تسليم أجزاء المشروع وفق الأهداف والموارد المحددة",
      "توجيه الموارد التقنية والبشرية مقابل الجودة والوقت والميزانية",
      "إبقاء النتائج مقروءة للإدارة واللجنة التوجيهية",
    ],
  },
  {
    id: "binsalmeen",
    org: "Bin Salmeen Computers",
    title: "مهندس شبكات أول",
    start: "يونيو 2005",
    end: "يونيو 2006",
    span: "يونيو 2005 — يونيو 2006",
    place: "أبوظبي، الإمارات العربية المتحدة",
    era: "Engineering",
    summary: "تصميم مشاريع شبكات العملاء وتركيبها، وإدارة الشبكة الداخلية والموقع الإلكتروني.",
    points: ["تصميم مشاريع الشبكات وتركيبها", "إدارة الشبكة الداخلية والموقع الإلكتروني"],
  },
  {
    id: "ligroup",
    org: "LI Group",
    title: "مسؤول الشبكة وقواعد البيانات والموقع الإلكتروني",
    start: "يناير 2004",
    end: "يونيو 2005",
    span: "يناير 2004 — يونيو 2005",
    place: "أبوظبي، الإمارات العربية المتحدة",
    era: "Engineering",
    summary: "إدارة الشبكة، وأعمال الموقع بـ FrontPage وFlash، وقواعد بيانات تشغيلية صغيرة في Access.",
    points: ["إدارة الشبكة", "تصميم الموقع وبناؤه", "قواعد Access للعمل اليومي"],
  },
  {
    id: "labs-role",
    org: "أبوظبي، الإمارات العربية المتحدة",
    title: "مسؤول الشبكة",
    start: "سبتمبر 2001",
    end: "ديسمبر 2003",
    span: "سبتمبر 2001 — ديسمبر 2003",
    place: "أبوظبي، الإمارات العربية المتحدة",
    era: "Engineering",
    summary: "إدارة مختبرات شبكة الجامعة: أداء الشبكة، ودعم الطلاب في استخدام المختبرات والأجهزة.",
    points: ["إدارة مختبر الشبكة", "دعم الطلاب على أجهزة المختبر"],
  },
];

export const eras = ["All", "Leadership", "Architecture", "Engineering"] as const;

export const certifications = [
  {
    name: "Microsoft Certified: Azure Security Engineer Associate",
    alt: "شارة Microsoft Certified: Azure Security Engineer Associate",
    href: "https://learn.microsoft.com/en-us/credentials/certifications/azure-security-engineer/",
    image: "/badges/azure-security-engineer-associate.png",
  },
  {
    name: "AZ-300 Microsoft Azure Architect Technologies",
    alt: "شارة AZ-300 Microsoft Azure Architect Technologies",
    href: "https://learn.microsoft.com/en-us/credentials/certifications/exams/az-300/",
    image: "/badges/az-300-azure-architect-technologies.png",
  },
  {
    name: "AWS Certified Solutions Architect – Associate",
    alt: "شارة AWS Certified Solutions Architect – Associate",
    href: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
    image: "/badges/aws-solutions-architect-associate.png",
  },
];

export const skills = ["Microsoft Azure", "Artificial Intelligence", "Azure DevOps"];

export const languages = [
  { name: "الإنجليزية", note: "لغة العمل للقيادة الإقليمية والبنية والإحاطات التنفيذية." },
  { name: "العربية", note: "لغة العمل في المملكة والمنطقة الأوسع." },
];

export const education = {
  school: "جامعة عجمان للعلوم والتكنولوجيا",
  degree: "بكالوريوس نظم المعلومات الحاسوبية",
  years: "2001 — 2004",
};

export const storyChapters = [
  {
    id: "now",
    year: "الآن",
    kicker: "الفصل 6 · قدرة إقليمية",
    title: "رئيس خدمات السحابة، الشرق الأوسط وشمال أفريقيا",
    roleIds: ["mobiz"],
    tiles: ["حوكمة CAF / WAF", "انضباط FinOps", "جاهزية منصة الذكاء الاصطناعي", "المرونة من التصميم", "بناء الفرق"],
  },
  {
    id: "bank",
    year: "2022",
    kicker: "الفصل 5 · السحابة بحجم مصرف",
    title: "الرياض، من التحالف إلى المصرف",
    roleIds: ["albilad", "ajlan"],
    tiles: [] as string[],
  },
  {
    id: "architect",
    year: "2016",
    kicker: "الفصل 4 · سنوات المعماري",
    title: "بنية ما قبل البيع للمؤسسات والخدمات المالية",
    roleIds: ["crayon", "dimensions"],
    tiles: [] as string[],
  },
  {
    id: "microsoft",
    year: "2012",
    kicker: "الفصل 3 · اللقاء مع Microsoft",
    title: "Office 365 وبدايات Azure في جدة",
    roleIds: ["alnafitha", "rtech"],
    tiles: [] as string[],
  },
  {
    id: "wires",
    year: "2005",
    kicker: "الفصل 2 · الأسلاك والهواتف",
    title: "شبكات، وهواتف Cisco، وصالة عرض BMW",
    roleIds: ["alsaqer", "nevotek", "binsalmeen"],
    tiles: [] as string[],
  },
  {
    id: "began",
    year: "2001",
    kicker: "الفصل 1 · حيث بدأ الأمر",
    title: "مختبرات، ومواقع، ودرجة في نظم المعلومات",
    roleIds: ["ligroup", "labs-role"],
    tiles: [] as string[],
    showEducation: true,
  },
] as const;

export const courseTopics = [
  { id: "cloud", title: "السحابة", line: "Azure وAWS وGoogle Cloud." },
  { id: "devops", title: "DevOps", line: "كيف تصل المنصة إلى الإنتاج." },
  { id: "ai", title: "الذكاء الاصطناعي", line: "الأساسيات ومزوّدو النماذج." },
  { id: "agents", title: "الوكلاء", line: "ابنِ وكيلًا، ثم شغّل فريقًا منهم." },
] as const;

export const courses = [
  {
    topic: "cloud",
    title: "Azure",
    note: "بناء أسس السحابة",
    tone: "t-az",
    items: [
      { name: "Azure Fundamentals (AZ-900)", detail: "Microsoft Learn · للمبتدئين", href: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/" },
      { name: "Azure Administrator (AZ-104) path", detail: "Microsoft Learn · متوسط", href: "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/" },
      { name: "Cloud Adoption Framework", detail: "Microsoft · الاستراتيجية والحوكمة", href: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/" },
    ],
  },
  {
    topic: "devops",
    title: "DevOps",
    note: "شحن أسرع وأكثر أمانًا",
    tone: "t-do",
    items: [
      { name: "DevOps Engineer (AZ-400) path", detail: "Microsoft Learn · متقدم", href: "https://learn.microsoft.com/en-us/credentials/certifications/devops-engineer/" },
      { name: "GitHub Skills", detail: "GitHub · Actions وGit", href: "https://skills.github.com/" },
      { name: "DevOps Roadmap", detail: "roadmap.sh · مسار موجه", href: "https://roadmap.sh/devops" },
    ],
  },
  {
    topic: "ai",
    title: "AI",
    note: "افهم السبب والطريقة",
    tone: "t-ai",
    items: [
      { name: "Elements of AI", detail: "University of Helsinki · للمبتدئين", href: "https://www.elementsofai.com/" },
      { name: "Azure AI Fundamentals (AI-900)", detail: "Microsoft Learn · للمبتدئين", href: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/" },
      { name: "Machine Learning Crash Course", detail: "Google · متوسط", href: "https://developers.google.com/machine-learning/crash-course" },
    ],
  },
  {
    topic: "agents",
    title: "AI Agents",
    note: "ابنِ ما هو قادم",
    tone: "t-ag",
    items: [
      { name: "AI Agents for Beginners", detail: "Microsoft · دروس مجانية على GitHub", href: "https://github.com/microsoft/ai-agents-for-beginners" },
      { name: "Agents Course", detail: "Hugging Face · تطبيقي", href: "https://huggingface.co/learn/agents-course" },
      { name: "Short courses on agents and LLMs", detail: "DeepLearning.AI · قصيرة وعملية", href: "https://www.deeplearning.ai/short-courses/" },
    ],
  },
  {
    topic: "cloud",
    title: "AWS",
    note: "سحابة Amazon من المصدر",
    tone: "t-az",
    items: [
      { name: "AWS Cloud Practitioner Essentials", detail: "AWS Skill Builder · مجاني، أساسي", href: "https://skillbuilder.aws/learn/94T2BEN85A/aws-cloud-practitioner-essentials" },
      { name: "Cloud Essentials learning plan", detail: "AWS Training · مسار موجه", href: "https://aws.amazon.com/training/learn-about/cloud-practitioner/" },
      { name: "AWS Well-Architected Foundations", detail: "AWS Skill Builder · مجاني، متوسط", href: "https://explore.skillbuilder.aws/learn/course/108/aws-well-architected-foundations" },
    ],
  },
  {
    topic: "cloud",
    title: "Google Cloud",
    note: "مسارات ومختبرات تطبيقية",
    tone: "t-do",
    items: [
      { name: "Getting Started with Google Cloud", detail: "Google Skills · مسار للمبتدئين", href: "https://www.skills.google/paths/8" },
      { name: "Cloud Engineer path", detail: "Google Skills · تطبيقي", href: "https://www.skills.google/paths/11" },
      { name: "Cloud Digital Leader path", detail: "Google Skills · أسس الأعمال", href: "https://www.skills.google/paths/9" },
    ],
  },
  {
    topic: "ai",
    title: "OpenAI",
    note: "دورات Academy",
    tone: "t-ai",
    items: [
      { name: "AI foundations", detail: "OpenAI Academy · للمبتدئين", href: "https://academy.openai.com/public/courses/ai-foundations-juzjs" },
      { name: "Applied AI foundations", detail: "OpenAI Academy · سير العمل", href: "https://academy.openai.com/public/courses/applied-ai-foundations-hgk7r" },
      { name: "Agents and workflows", detail: "OpenAI Academy · توجيه الوكلاء", href: "https://academy.openai.com/public/courses/agents-and-workflows-bieml" },
    ],
  },
  {
    topic: "ai",
    title: "Anthropic",
    note: "Claude Academy",
    tone: "t-ag",
    items: [
      { name: "Claude 101", detail: "Claude Academy · للمبتدئين", href: "https://academy.claude.com/courses/claude-101" },
      { name: "Claude Code 101", detail: "Claude Academy · وكيل البرمجة", href: "https://academy.claude.com/courses/claude-code-101" },
      { name: "Introduction to Model Context Protocol", detail: "Claude Academy · MCP", href: "https://academy.claude.com/courses/introduction-to-model-context-protocol" },
    ],
  },
  {
    topic: "ai",
    title: "xAI",
    note: "البناء باستخدام Grok API",
    tone: "t-az",
    items: [
      { name: "API quickstart", detail: "xAI · الدليل الرسمي", href: "https://docs.x.ai/developers/quickstart" },
      { name: "Tools overview", detail: "xAI · البحث والبرمجة والدوال", href: "https://docs.x.ai/developers/tools/overview" },
      { name: "API overview", detail: "xAI · النماذج وأول الاستدعاءات", href: "https://docs.x.ai/overview" },
    ],
  },
  {
    topic: "agents",
    title: "Hermes Agent",
    note: "Nous Research",
    tone: "t-do",
    items: [
      { name: "Learning path", detail: "Hermes Agent · المسار الرسمي", href: "https://hermes-agent.nousresearch.com/docs/getting-started/learning-path" },
      { name: "Quickstart", detail: "Hermes Agent · أول حوار", href: "https://hermes-agent.nousresearch.com/docs/getting-started/quickstart" },
      { name: "Skills", detail: "Hermes Agent · توسيع الوكيل", href: "https://hermes-agent.nousresearch.com/docs/user-guide/features/skills" },
    ],
  },
  {
    topic: "agents",
    title: "Paperclip",
    note: "تشغيل شركة من الوكلاء",
    tone: "t-ag",
    items: [
      { name: "Quickstart path", detail: "Paperclip · أول وكيل في دقائق", href: "https://docs.paperclip.ing/guides/getting-started/five-minute-path/" },
      { name: "Key concepts", detail: "Paperclip · الشركات والوكلاء والمهام", href: "https://docs.paperclip.ing/guides/welcome/key-concepts/" },
      { name: "Hire your first agent", detail: "Paperclip · وكيل الرئيس التنفيذي", href: "https://docs.paperclip.ing/guides/getting-started/your-first-agent/" },
    ],
  },
] as const;

export const businessPage = {
  audience:
    "للمصارف والجهات الحكومية والمؤسسات المنظَّمة في الشرق الأوسط وشمال أفريقيا التي تحتاج منصات Azure تبقى متوافقة وقابلة للتشغيل وواضحة التكلفة في الإنتاج.",
  model: "نموذج التشغيل نفسه من Dev/SIT حتى UAT والإنتاج.",
  regulatedTitle: "مبني لواقع المنطقة المنظَّم",
  regulated:
    "تصميم وتنفيذ للبيئات الخاضعة للتنظيم. يفترض العمل أن المدققين سيصلون، وأن الإنتاج ستقع فيه حوادث، وأن التكلفة يجب أن تبقى واضحة مع اتساع المنصة.",
  contexts: [
    "الخدمات المصرفية والمالية الخاضعة للتنظيم",
    "الجهات الحكومية والمرتبطة بالحكومة",
    "المؤسسات الكبيرة ذات الاحتياجات متعددة الأسواق أو الولايات القضائية",
  ],
  processTitle: "كيف يتقدم العمل",
  differenceTitle: "ما الذي يختلف هنا",
  differences: [
    "بنية وتنفيذ بالممارسة. الاستراتيجية لا تتوقف عند الاشتراك.",
    "نموذج تشغيل واحد عبر Dev/SIT وUAT والإنتاج. لا تصميم منفصل يقول إن «الإنتاج مختلف».",
    "مبني لظروف المنطقة المنظَّمة: ضوابط حسب الولاية القضائية، وجاهزية للتدقيق، وشفافية تكلفة من البداية.",
  ],
  engagement:
    "يشمل العمل المعتاد استراتيجية إقليمية وأساس landing zone، ودعم برنامج الترحيل، ومعالجة الأمن والامتثال، ونموذج تشغيل مع تمكين الفريق.",
  credibility: "بقيادة طارق الغزي، رئيس خدمات السحابة في الشرق الأوسط وشمال أفريقيا.",
  closeTitle: "لنتحدث عن القيد.",
  close: "شارك المنطقة، والسياق التنظيمي، وما الذي يجب أن يعنيه «الانتهاء». نرسم من هناك المسار العملي.",
} as const;

export const offers = [
  {
    kicker: "استشارة",
    title: "استراتيجية السحابة والذكاء الاصطناعي",
    tone: "t-az",
    summary: "امتلاك الاستراتيجية الإقليمية والتنفيذ، لا شريحة تتوقف عند الاشتراك.",
    points: [
      "مواءمة بنية المؤسسة مع الحوكمة المالية والمتطلبات التنظيمية",
      "توحيد طريقة تبني الأسواق للمنصة",
      "نموذج تشغيل FinOps وصورة تكلفة تستطيع القيادة التصرف بناءً عليها",
    ],
    gets: [
      "بنية إقليمية مستهدفة متوافقة مع احتياجات الحوكمة التنظيمية والمالية",
      "نموذج تشغيل FinOps مع صورة تكلفة تستطيع القيادة التصرف بناءً عليها",
      "خارطة طريق مرتبة بالأولوية تربط الاستراتيجية بتنفيذ ممول",
      "صورة واضحة للقيود التنظيمية والمؤسسية والتقنية قبل أن يبدأ التصميم",
    ],
    cta: "خطّط الاستراتيجية الإقليمية",
  },
  {
    kicker: "تنفيذ",
    title: "landing zones والتسليم",
    tone: "t-do",
    summary: "landing zones وفق CAF وWell-Architected، بضوابط حاكمة تستطيع الفرق البناء داخلها.",
    points: [
      "البنية نفسها عبر Dev/SIT وUAT والإنتاج",
      "جاهزية منصة الذكاء الاصطناعي لأحمال العمل المتقدمة ومبادرات LLM المؤسسية",
      "أتمتة تزيل العمل اليدوي وتقصّر مدة التسليم",
    ],
    gets: [
      "landing zone جاهزة للإنتاج وفق CAF/WAF بضوابط متسقة في كل بيئة",
      "أنماط ترحيل وأتمتة تستطيع الفرق الداخلية تشغيلها وصيانتها",
      "أسس منصة جاهزة للذكاء الاصطناعي لأحمال العمل المتقدمة وLLM",
      "عمل يدوي أقل عبر أتمتة مبنية داخل التصميم",
    ],
    cta: "ابدأ landing zone",
  },
  {
    kicker: "تمكين",
    title: "الأمن والمرونة والفرق",
    tone: "t-ai",
    summary: "هوية وامتثال ومرونة تُصمَّم لكل ولاية قضائية، مع فريق يستطيع تشغيلها.",
    points: [
      "توحيد الأمن وIAM إقليميًا",
      "التعافي من الكوارث والتوافر العالي من التصميم",
      "فرق هندسة سحابة ومنصات متعددة الاختصاصات",
    ],
    gets: [
      "خط أساس للأمن وIAM حسب الولاية القضائية، جاهز للتدقيق",
      "تعافٍ من الكوارث وتوافر عالٍ داخل التصميم، لا إضافة لاحقة",
      "نموذج تشغيل وبنية فريق يحافظان على المعيار بعد التسليم",
      "ملكية واضحة كي تبقى المنصة سليمة في الإنتاج",
    ],
    cta: "راجع نموذج التشغيل",
  },
] as const;

export const steps = [
  {
    n: "01",
    title: "استكشاف",
    body: "المنطقة، والقيد، وما الذي يعنيه الانتهاء.",
    outcome: "خريطة قيود، ونطاق تنظيمي، وتعريف مشترك لـ«الانتهاء».",
  },
  {
    n: "02",
    title: "تصميم",
    body: "landing zones وFinOps ونموذج التشغيل.",
    outcome: "بنية مستهدفة، ونموذج FinOps، وضوابط حاكمة تُطبَّق باتساق عبر البيئات.",
  },
  {
    n: "03",
    title: "تنفيذ",
    body: "الحوكمة والأتمتة وجاهزية الذكاء الاصطناعي في التصميم نفسه.",
    outcome: "landing zone منفَّذة، وأتمتة، وأنماط منصة يستطيع الفريق البناء عليها.",
  },
  {
    n: "04",
    title: "استدامة",
    body: "أمن ومرونة وفريق يحافظ على المعيار.",
    outcome: "تسليم، وإجراءات تشغيل، ونموذج تشغيل يحفظ المعيار في الإنتاج.",
  },
] as const;

export const topics = [
  "تحول الأعمال",
  "استراتيجية السحابة والذكاء الاصطناعي",
  "FinOps وlanding zones",
  "جاهزية منصة الذكاء الاصطناعي",
  "شيء آخر",
] as const;

export const ticker = [
  "Microsoft Azure",
  "CAF",
  "Well-Architected",
  "FinOps",
  "Landing zones",
  "DevSecOps",
  "IAM",
  "جاهزية الذكاء الاصطناعي",
  "التعافي من الكوارث",
  "التوافر العالي",
  "Azure DevOps",
  "Microsoft 365",
  "أمن السحابة المتعددة",
];

export const ui = {
  skip: "تخطَّ إلى المحتوى",
  nav: {
    home: "الرئيسية",
    story: "المسيرة",
    forYou: "لك",
    business: "الأعمال",
    posts: "مقالات",
    contact: "تواصل",
    menu: "القائمة",
    close: "إغلاق",
    primary: "التنقل الرئيسي",
  },
  footer: {
    based: "المقر في {{location}}. والعمل عبر منطقة الشرق الأوسط وشمال أفريقيا.",
    elsewhere: "في مكان آخر",
    contact: "تواصل",
    privacy: "الخصوصية",
    posts: "مقالات",
    email: "البريد",
  },
  theme: {
    dark: "التبديل إلى الوضع الداكن",
    light: "التبديل إلى الوضع الفاتح",
  },
  clock: {
    label: "الرياض",
    waiting: "توقيت الرياض",
    hour: "الرياض، {{hour}}:00",
  },
  quote: {
    before: "حجم الترحيل لا يصنع النضج. ",
    em: "الانضباط التشغيلي وشفافية التكلفة والبنى",
    after: " التي تصمد في Dev وSIT وUAT والإنتاج هي التي تصنعه.",
  },
  home: {
    positioning: "أبني منصات سحابية تصمد في الواقع.",
    earlier: "أظهر الأدوار السابقة",
    regulated: "أعمل مع مؤسسات خاضعة للتنظيم في الخليج والشرق الأوسط وشمال أفريقيا.",
    sectors: "المصارف والخدمات المالية؛ الحكومة والقطاع العام؛ الاتصالات؛ الطاقة والنفط والغاز؛ السياحة والضيافة؛ المؤسسات الكبرى ومشاريع الجيجا.",
    postsCta: "اقرأ المقالات",
    contactCta: "ابدأ المحادثة",
    aboutTitle: "نبذة",
    experience: "الخبرة",
    record: "السجل، الأحدث أولًا.",
    howTitle: "كيف أعمل",
    expertiseEyebrow: "الخبرة التخصصية",
    expertiseTitle: "الخبرة التخصصية",
    expertiseIntro: "بنية سحابية وتنفيذ عمليان للمؤسسات التي لا تحتمل الفشل أو عدم الامتثال.",
    certsEyebrow: "الشهادات",
    certsTitle: "شهادات إلى جانب العمل.",
    languagesLead: "اللغات:",
    languagesJoin: " و",
    skillsLead: "أبرز المهارات:",
    skillsJoin: "، ",
    education: "التعليم",
    portraitAlt: "طارق الغزي",
  },
  business: {
    eyebrow: "للأعمال",
    title: "بنية عملية للمؤسسات التي لا تحتمل الفشل.",
    cta: "لنتحدث عن القيد",
    seeHow: "اطّلع على أسلوبي في العمل",
    gets: "ما تحصل عليه",
    outcome: "النتيجة.",
    record: "اطّلع على السجل",
    start: "ابدأ الحوار",
    orHow: "أو اطّلع على أسلوبي في العمل",
  },
  forYou: {
    eyebrow: "لك",
    title: "ابدأ من حيث بدأت. تعلّم مجانًا.",
    intro: "هذه دورات عامة أرشد الناس إليها. هي توصيات، وليست شهاداتي. شهاداتي في الصفحة الرئيسية.",
    held: "الشهادات المحصلة:",
  },
  posts: {
    eyebrow: "مقالات",
    title: "ملاحظات من العمل.",
    intro: "بعض مقالاتي ومنشوراتي عن السحابة والهندسة المعمارية والعمل الذي وراءها.",
    empty: "لا مقالات بعد.",
    all: "كل المقالات",
    linkedin: "عرض على LinkedIn",
    englishMark: "English",
    arabicMark: "العربية",
    linkedinFrame: "منشور LinkedIn",
  },
  contact: {
    eyebrow: "تواصل معي",
    title: "لنبنِ شيئًا يصمد.",
    intro: "منطقة، أو landing zone، أو نموذج تكلفة، أو منصة ذكاء اصطناعي تحتاج حاكمًا. اكتب السياق، والقيد، وما الذي يعنيه الانتهاء.",
    linkedin: "LinkedIn",
    based: "المقر في {{location}}.",
    handle: "tareq-alghazzi",
  },
  form: {
    name: "الاسم",
    namePlaceholder: "اسمك",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@company.com",
    company: "الشركة",
    companyPlaceholder: "اختياري",
    topic: "الموضوع",
    message: "الرسالة",
    messagePlaceholder: "كيف أستطيع المساعدة؟",
    website: "الموقع",
    send: "إرسال الرسالة",
    sending: "جارٍ الإرسال…",
    received: "وصلت.",
    receivedNote: "الرسالة في طريقها.",
    blocked: "تعذّر الإرسال.",
    network: "انقطع الاتصال قبل إرسال الرسالة. أعد المحاولة.",
    errors: {
      company: "أبقِ اسم الشركة تحت 120 حرفًا.",
      name: "استخدم اسمًا بين حرفين و80 حرفًا.",
      email: "استخدم بريدًا حقيقيًا كي يصل الرد.",
      topic: "أبقِ الموضوع تحت 120 حرفًا.",
      message: "اكتب جملة واحدة على الأقل، وبأقل من 4000 حرف.",
      delivery: "تعذّر تسليم الرسالة. أعد المحاولة لاحقًا.",
      unconfigured: "صندوق البريد غير جاهز لاستقبال الرسائل بعد. أعد المحاولة لاحقًا.",
      json: "أرسل JSON.",
    },
  },
  notFound: {
    eyebrow: "404",
    title: "هذه الصفحة ليست على الخريطة.",
    body: "المسيرة موجودة. ابدأ من جديد، أو أرسل رسالة.",
    cta: "العودة إلى المسيرة",
  },
  meta: {
    homeTitle: "طارق الغزي — رئيس خدمات السحابة، الشرق الأوسط وشمال أفريقيا",
    shareTitle: "طارق الغزي — أبني منصات سحابية تصمد في الواقع",
    titleSuffix: "طارق الغزي",
    locality: "الرياض",
    forYouTitle: "لك",
    forYouDescription:
      "دورات ومسارات تعلم رسمية يرشد إليها طارق الغزي عبر Azure وAWS وGoogle Cloud وDevOps وOpenAI وAnthropic وxAI والوكلاء. هذه توصيات، وليست شهاداته.",
    postsTitle: "مقالات",
    postsDescription: "بعض مقالات طارق الغزي ومنشوراته عن السحابة والهندسة المعمارية والعمل الذي وراءها.",
    contactTitle: "تواصل",
    contactDescription: "تواصل مع طارق الغزي بشأن استراتيجية السحابة الإقليمية أو FinOps أو منصات الذكاء الاصطناعي أو الحوكمة.",
    privacyTitle: "الخصوصية",
    privacyDescription:
      "كيف تُجمع المعلومات الشخصية وتُستخدم وتُحمى على {{site}}، بما في ذلك نموذج التواصل ونشر مالك الموقع على LinkedIn.",
    businessTitle: "الأعمال",
    postFallbackTitle: "مقالة",
    jsonJob: profile.role,
  },
  privacy: {
    eyebrow: "الخصوصية",
    title: "الخصوصية",
    updated: "آخر تحديث: 21 أكتوبر 2026",
    owner: "ربط LinkedIn",
    blocks: [
      {
        kind: "p",
        text: "تصف سياسة الخصوصية هذه كيف تُجمع المعلومات الشخصية وتُستخدم وتُحمى على {{site}} («الموقع») وفيما يتصل بميزة النشر على LinkedIn التي يستخدمها مالك الموقع.",
      },
      {
        kind: "p",
        text: "يشغّل {{name}} هذا الموقع من {{location}}. تُرسل أسئلة الخصوصية إلى {{mail}}",
      },
      { kind: "h2", text: "1. المعلومات الشخصية التي قد نجمعها" },
      { kind: "p", text: "«المعلومات الشخصية» هي المعلومات التي تتعلق بفرد محدد أو يمكن تحديده." },
      { kind: "p", text: "نجمع المعلومات الشخصية بالطرق التالية:" },
      { kind: "h3", text: "معلومات تقدمها أنت" },
      { kind: "p", text: "حين تستخدم نموذج التواصل، تقدم:" },
      { kind: "ul", items: ["الاسم", "عنوان البريد الإلكتروني", "الموضوع", "الرسالة", "الشركة (اختياري)"] },
      {
        kind: "p",
        text: "تُرسل هذه المعلومات عبر Resend ولا تُستخدم إلا للرد على استفسارك. يُستخدم حقل مخفي لغرض واحد هو الحد من الإرسالات الآلية.",
      },
      { kind: "h3", text: "معلومات متعلقة بـ LinkedIn (لمالك الموقع فقط)" },
      {
        kind: "p",
        text: "حين يربط مالك الموقع حساب LinkedIn لنشر المقالات المعتمدة، قد نتلقى معلومات الملف الشخصي ورمز وصول ومحتوى المنشورات الجاري نشرها. يُعرض رمز الوصول مرة واحدة ليُحفظ بأمان بوصفه سرًا. لا يُكتب في عناوين الصفحات ولا في السجلات. تُنشر المقالات باسم العضو المتصل (author urn:li:person)، لا باسم صفحة شركة.",
      },
      { kind: "h3", text: "معلومات تُجمع تلقائيًا" },
      {
        kind: "p",
        text: "الاستضافة لدى Vercel. قد ينشئ مزود الاستضافة سجلات خادم معتادة (مثل عنوان IP ونوع المتصفح والصفحات المطلوبة) لأمن الموقع وتشغيله. يحصي Vercel Web Analytics الزوار ومشاهدات الصفحات دون ملفات تعريف ارتباط.",
      },
      { kind: "h2", text: "2. كيف نستخدم معلوماتك الشخصية" },
      { kind: "p", text: "نستخدم المعلومات الشخصية من أجل:" },
      {
        kind: "ul",
        items: [
          "الرد على استفسارات نموذج التواصل",
          "تشغيل الموقع وتأمينه",
          "عدّ الزوار ومشاهدات الصفحات عبر Vercel Web Analytics دون ملفات تعريف ارتباط",
          "نشر المقالات المعتمدة على LinkedIn (لمالك الموقع فقط)",
          "تضمين منشورات LinkedIn العامة في صفحات المقالات حين تكون موجودة",
        ],
      },
      { kind: "p", text: "لا نبيع المعلومات الشخصية ولا نستخدمها للإعلان." },
      { kind: "h2", text: "3. كيف نشارك معلوماتك الشخصية" },
      { kind: "p", text: "نشارك المعلومات الشخصية فقط مع:" },
      {
        kind: "ul",
        items: [
          "**Resend** — لتوصيل رسائل نموذج التواصل",
          "**Vercel** — لاستضافة الموقع ولتحليلات الويب دون ملفات تعريف ارتباط",
          "**LinkedIn** — حين ينشر مالك الموقع محتوى أو يضمّنه (كما هو موضح أعلاه)",
        ],
      },
      { kind: "p", text: "يعالج هؤلاء المزودون البيانات وفق سياساتهم. لا نبيع المعلومات الشخصية ولا نؤجرها." },
      { kind: "h2", text: "4. كيف نحمي معلوماتك الشخصية" },
      {
        kind: "p",
        text: "نتخذ تدابير معقولة لحماية المعلومات الشخصية أثناء النقل والتخزين. لا توجد وسيلة نقل أو تخزين آمنة تمامًا.",
      },
      { kind: "h2", text: "5. حقوقك وخياراتك" },
      { kind: "p", text: "يمكنك:" },
      {
        kind: "ul",
        items: [
          "عدم إرسال نموذج التواصل",
          "طلب الاطلاع على المعلومات التي أرسلتها عبر نموذج التواصل أو حذفها. أرسل ذلك الطلب إلى {{mail}}",
          "إلغاء وصول LinkedIn في أي وقت (مالك الموقع)",
        ],
      },
      { kind: "p", text: "نرد على الطلبات خلال وقت معقول." },
      { kind: "h2", text: "6. ملفات تعريف الارتباط" },
      { kind: "p", text: "لا يستخدم الموقع ملفات تعريف ارتباط للتحليلات أو الإعلان. Vercel Web Analytics لا يستخدم ملفات تعريف ارتباط." },
      {
        kind: "p",
        text: "يستخدم تسجيل الدخول إلى LinkedIn ملف تعريف ارتباط قصير العمر فقط لتأكيد عودة المصادقة. يُحذف ذلك الملف بعد ذلك.",
      },
      { kind: "h2", text: "7. الاحتفاظ بالبيانات" },
      {
        kind: "p",
        text: "تُحفظ رسائل نموذج التواصل فقط للمدة اللازمة للرد على الاستفسار وللقيد المعقول.",
      },
      { kind: "p", text: "يمكنك طلب حذف بيانات نموذج التواصل عبر {{mail}}" },
      { kind: "h2", text: "8. تحديثات سياسة الخصوصية" },
      {
        kind: "p",
        text: "قد نحدّث هذه السياسة من وقت إلى آخر. يتغير تاريخ «آخر تحديث» في الأعلى حين نفعل ذلك. استمرار استخدام الموقع بعد التحديث يعني قبول السياسة المعدلة.",
      },
      { kind: "h2", text: "9. كيف تتواصل معنا" },
      { kind: "p", text: "تُرسل أسئلة الخصوصية أو طلبات الاطلاع أو الحذف إلى {{mail}}" },
    ] satisfies PrivacyBlock[],
  },
};
