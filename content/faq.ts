import { personId } from "../lib/person-schema";

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqLocale = "en" | "ar";

const en: FaqItem[] = [
  {
    question: "Who is Tareq Al-Ghazzi?",
    answer:
      "Tareq Al-Ghazzi (طارق الغزي) is Head of Cloud Services, MENA at Mobiz IT, based in Riyadh, Saudi Arabia. He builds cloud platforms for enterprise and regulated organizations in MENA: Azure landing zones, migrations, security, FinOps and AI platform readiness that hold up in production and in audit. He's worked in technology since 2001.",
  },
  {
    question: "How do you spell his name?",
    answer:
      "The canonical spelling is Tareq Al-Ghazzi. You'll also see Tareq Alghazzi, Tareq Al Ghazzi and Al-Gazzi, and in Arabic طارق الغزي. The handle tarooq is his. His only LinkedIn profile linked from this site is linkedin.com/in/tareq-alghazzi.",
  },
  {
    question: "What does he work on?",
    answer:
      "Cloud platforms that survive reality. That means landing zones built as an operating model first, governance and FinOps run as one standard across markets, AI on the platform with governed data and permissions, and platform teams that keep the standard after handover.",
  },
  {
    question: "Which sectors does he work with?",
    answer:
      "Banking and financial services, government and public sector, telecom, energy and oil & gas, tourism and hospitality, and large and giga enterprises across Saudi Arabia and MENA. He doesn't name clients.",
  },
  {
    question: "Where did he work before Mobiz IT?",
    answer:
      "He was Lead Cloud Architect at Bank Albilad in Riyadh from December 2022 to November 2025, leading Azure work in a regulated Saudi banking environment. Before that he led the cloud solution offering at Abilitii (Ajlan & Bros), and worked in cloud pre-sales architecture at Crayon and Dimensions Cloud and in Microsoft cloud roles in Jeddah. He started in network and systems engineering in the UAE in 2001.",
  },
  {
    question: "What certifications does he hold?",
    answer:
      "Microsoft Certified: Azure Security Engineer Associate; AZ-300 Microsoft Azure Architect Technologies; and AWS Certified Solutions Architect – Associate.",
  },
  {
    question: "Does he work in Arabic?",
    answer: "Yes. He works and writes in English and Arabic, and this whole site is available in Arabic at alghazzi.org/ar.",
  },
  {
    question: "How can I get in touch?",
    answer: "Use the contact form at alghazzi.org/contact, or message him on LinkedIn at linkedin.com/in/tareq-alghazzi.",
  },
];

const ar: FaqItem[] = [
  {
    question: "من هو طارق الغزي؟",
    answer:
      "طارق الغزي (Tareq Al-Ghazzi) هو رئيس خدمات السحابة في الشرق الأوسط وشمال أفريقيا لدى Mobiz IT، ومقره الرياض. يبني منصات سحابية للمؤسسات والجهات الخاضعة للتنظيم في المنطقة: landing zones على Azure، والترحيل، والأمن، وFinOps، وجاهزية منصات الذكاء الاصطناعي، بحيث تصمد في الإنتاج وأمام التدقيق. يعمل في التقنية منذ عام 2001.",
  },
  {
    question: "كيف يُكتب اسمه؟",
    answer:
      "الاسم المعتمد بالعربية طارق الغزي، وبالإنجليزية Tareq Al-Ghazzi، وقد يُكتب أيضًا Tareq Alghazzi أو Tareq Al Ghazzi أو Al-Gazzi. صفحته على LinkedIn هي linkedin.com/in/tareq-alghazzi.",
  },
  {
    question: "ما مجال عمله؟",
    answer:
      "منصات سحابية تصمد في الواقع: landing zone تُبنى كنموذج تشغيل أولًا، وحوكمة وFinOps بمعيار واحد عبر الأسواق، وذكاء اصطناعي على المنصة ببيانات وصلاحيات محكومة، وفرق منصات تحافظ على المعيار بعد التسليم.",
  },
  {
    question: "ما القطاعات التي يعمل معها؟",
    answer:
      "البنوك والخدمات المالية، والقطاع الحكومي والعام، والاتصالات، والطاقة والنفط والغاز، والسياحة والضيافة، والمؤسسات الكبرى والمشاريع العملاقة في السعودية والمنطقة. ولا يذكر أسماء العملاء.",
  },
  {
    question: "أين عمل قبل Mobiz IT؟",
    answer:
      "عمل معماريًا رئيسيًا للسحابة في بنك البلاد بالرياض من ديسمبر 2022 إلى نوفمبر 2025، وقاد أعمال Azure في بيئة مصرفية سعودية خاضعة للتنظيم.",
  },
  {
    question: "ما شهاداته؟",
    answer:
      "Microsoft Certified: Azure Security Engineer Associate، وAZ-300 Microsoft Azure Architect Technologies، وAWS Certified Solutions Architect – Associate.",
  },
  {
    question: "كيف أتواصل معه؟",
    answer: "عبر نموذج التواصل في alghazzi.org/ar/contact أو عبر LinkedIn.",
  },
];

export const faq: Record<FaqLocale, { heading: string; subline: string; items: FaqItem[] }> = {
  en: {
    heading: "Questions people ask",
    subline: "Short answers, from me.",
    items: en,
  },
  ar: {
    heading: "أسئلة شائعة عن طارق الغزي",
    subline: "إجابات قصيرة، مني.",
    items: ar,
  },
};

const linkedIn = "https://www.linkedin.com/in/tareq-alghazzi";

const linkRules = [
  { text: "alghazzi.org/ar/contact", href: "/ar/contact" },
  { text: "alghazzi.org/contact", href: "/contact" },
  { text: "linkedin.com/in/tareq-alghazzi", href: linkedIn },
  { text: "LinkedIn", href: linkedIn },
] as const;

export type FaqPart = { text: string; href?: string };

export function linkifyAnswer(answer: string): FaqPart[] {
  const parts: FaqPart[] = [];
  let rest = answer;
  while (rest.length > 0) {
    let earliest: { index: number; rule: (typeof linkRules)[number] } | null = null;
    for (const rule of linkRules) {
      const index = rest.indexOf(rule.text);
      if (index === -1) continue;
      if (!earliest || index < earliest.index || (index === earliest.index && rule.text.length > earliest.rule.text.length)) {
        earliest = { index, rule };
      }
    }
    if (!earliest) {
      parts.push({ text: rest });
      break;
    }
    if (earliest.index > 0) parts.push({ text: rest.slice(0, earliest.index) });
    parts.push({ text: earliest.rule.text, href: earliest.rule.href });
    rest = rest.slice(earliest.index + earliest.rule.text.length);
  }
  return parts;
}

export function faqPageFor(locale: FaqLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    about: { "@id": personId },
    mainEntity: faq[locale].items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
