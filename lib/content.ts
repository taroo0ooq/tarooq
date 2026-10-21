export const profile = {
  name: "Tareq Al-Ghazzi",
  short: "Al-Ghazzi",
  role: "Head of Cloud Services, MENA",
  location: "Riyadh, Saudi Arabia",
  linkedin: "https://www.linkedin.com/in/tareq-alghazzi",
  statement: "I build cloud platforms that actually survive reality.",
  deck: "Tareq Al-Ghazzi, Head of Cloud Services, MENA. Azure platforms that survive reality: landing zones, migrations, FinOps, and governance for regulated organizations.",
  availability:
    "Available for cloud strategy, architecture reviews, migration programs, and regulated Azure delivery across MENA.",
} as const;

export const about = [
  "I build cloud platforms that actually survive reality. Not slideware. Not best-effort. Not “it works in the lab.”",
  "I have designed, governed, and delivered secure Azure environments for banks and regulated organizations across Saudi Arabia and the wider MENA region. The work covers Cloud Adoption Framework and Well-Architected landing zones, infrastructure migrations, identity and access, FinOps, and governance that holds up in production and audit.",
  "I currently lead Cloud Services for MENA at Mobiz IT. Previously I served as Lead Cloud Architect at Bank Albilad, driving multi-year Azure transformations.",
  "My focus is simple: platforms that stay reliable when things break, stay compliant when auditors arrive, and stay cost-efficient when scale hits. If your cloud has to work in production — not just in a proposal — that is the work I do.",
] as const;

export const approach = [
  "I start from the reality of production, not the ideal architecture diagram.",
  "Most cloud problems are not technical in isolation. They appear when landing zones are incomplete, identity is an afterthought, migrations ignore dependencies, security controls exist only on paper, or cost is never owned. The platforms I design assume failure, expect auditors, and treat cost as a continuous concern.",
  "The work is opinionated where it needs to be, on security baselines, landing zone structure, and identity patterns, and flexible where the business requires it. The goal is always the same: a platform that the organization can actually operate, that survives incidents, and that passes scrutiny.",
  "If a design only works in a workshop or a proposal, it is not finished.",
] as const;

export const expertise = [
  {
    title: "Azure landing zones and architecture",
    body: "CAF, WAF, and landing-zone designs that are implemented, not only documented. Identity, networking, security, management, and governance from day one.",
  },
  {
    title: "Large-scale migrations",
    body: "Controlled IaaS and VM migrations with cutover planning, dependency mapping, and a rollback path.",
  },
  {
    title: "Security and compliance",
    body: "Security remediation and audit-ready evidence for regulated markets. Controls that exist in the platform, not only on paper.",
  },
  {
    title: "Identity and access",
    body: "Identity architecture and privileged access for regulated environments.",
  },
  {
    title: "FinOps and cost governance",
    body: "Cost visibility, rightsizing, and ongoing optimization so the platform stays efficient as it scales.",
  },
  {
    title: "Governance and operating models",
    body: "Ownership, policy, monitoring, and the processes that keep the platform healthy after the project ends.",
  },
  {
    title: "Engagement design",
    body: "Gap analysis, realistic scoping, and statements of work that align effort, risk, and deliverables.",
  },
] as const;

export const convictions = [
  {
    index: "01",
    title: "Cloud is not infrastructure",
    body: "A regional cloud is a capability: one strategy, one operating model, and technology decisions that can be explained in financial and regulatory terms.",
  },
  {
    index: "02",
    title: "Maturity is discipline",
    body: "Migration volume does not define maturity. Operational discipline, cost transparency, and architectures that survive Dev, SIT, UAT, and Production do.",
  },
  {
    index: "03",
    title: "AI needs a governor",
    body: "AI is a competitive advantage when the platform is ready and the control is real. Ungoverned, it is only a faster way to create risk.",
  },
] as const;

export type Mandate = {
  id: string;
  title: string;
  summary: string;
  points: string[];
};

export const mandates: Mandate[] = [
  {
    id: "strategy",
    title: "Regional cloud strategy",
    summary:
      "One cloud and AI strategy across countries, tied to architecture, money, regulation, and the business result.",
    points: [
      "Own the regional strategy and the execution, not a slide that stops at the subscription",
      "Align enterprise architecture with financial governance and regulatory requirements",
      "Standardize how markets adopt the platform instead of inventing a new one each time",
    ],
  },
  {
    id: "governance",
    title: "Landing zones and governance",
    summary:
      "CAF and Well-Architected landing zones, with the same operating model from Dev/SIT through UAT and Production.",
    points: [
      "Governance model aligned to the Cloud Adoption Framework and the Well-Architected Framework",
      "Standard landing-zone architecture across environments",
      "Guardrails that teams can build inside, not a review board that arrives after go-live",
    ],
  },
  {
    id: "finops",
    title: "FinOps",
    summary:
      "Cost visibility, accountability, and optimization treated as part of the architecture.",
    points: [
      "FinOps operating model across markets",
      "Cost intelligence that leadership can act on",
      "Reliability, performance, and spend designed together",
    ],
  },
  {
    id: "ai",
    title: "AI platform readiness",
    summary:
      "Enterprise workloads and LLM initiatives on a platform that is actually ready: identity, data, cost, and control included.",
    points: [
      "AI-driven workload enablement",
      "Platform readiness for advanced workloads and enterprise LLM initiatives",
      "Automation that removes manual operations and shortens delivery",
    ],
  },
  {
    id: "security",
    title: "Security, IAM, resilience",
    summary:
      "Identity, compliance, and resilience designed per jurisdiction, with disaster recovery and high availability as strategy rather than a ticket.",
    points: [
      "Regional security and IAM standardization across jurisdictions",
      "Multicloud security, identity, and compliance frameworks",
      "Disaster recovery and high availability by design",
      "DevSecOps practice across the landscape",
    ],
  },
];

export type Era = "Leadership" | "Architecture" | "Engineering";

export type Role = {
  id: string;
  org: string;
  title: string;
  start: string;
  end: string;
  span: string;
  place: string;
  era: Era;
  summary: string;
  points: string[];
};

export const roles: Role[] = [
  {
    id: "mobiz",
    org: "Mobiz IT",
    title: "Head of Cloud Services",
    start: "November 2025",
    end: "Present",
    span: "November 2025 — Present",
    place: "Riyadh, Saudi Arabia",
    era: "Leadership",
    summary:
      "Leading Azure strategy, architecture, and delivery across MENA. Landing zones, migrations, security remediation, FinOps, and practical AI platforms for regulated clients. The work has to hold up in production and in audit.",
    points: [
      "Established a regional cloud governance model aligned to CAF and the Well-Architected Framework",
      "Implemented FinOps discipline for cost visibility, accountability, and optimization across markets",
      "Standardized landing-zone architecture and operating models across Dev/SIT, UAT, and Production",
      "Enabled AI platform readiness for advanced workloads and enterprise LLM initiatives",
      "Led regional security and IAM standardization across jurisdictions",
      "Designed the resilience strategy, including disaster recovery and high availability",
      "Built and scaled cross-functional cloud and platform engineering teams",
    ],
  },
  {
    id: "albilad",
    org: "Bank Albilad",
    title: "Lead Cloud Architect",
    start: "December 2022",
    end: "November 2025",
    span: "December 2022 — November 2025",
    place: "Riyadh, Saudi Arabia",
    era: "Leadership",
    summary:
      "Led multi-year Azure work for a regulated Saudi bank: landing zones, migration programs, security and compliance alignment, and internal capability building. The focus was platforms that survive operations and audit, not slideware.",
    points: [
      "Designed and evolved CAF and Well-Architected landing zones and core services for multi-environment estates",
      "Drove automation, DevOps, and AI-driven improvements to cut manual operations and speed delivery",
      "Embedded FinOps and guardrails so cost, reliability, and performance are part of the design",
      "Aligned VPs and chiefs on trade-offs, and turned incidents into standards",
    ],
  },
  {
    id: "ajlan",
    org: "Ajlan & Bros Holding Group Abilitii",
    title: "Cloud Solution Architect",
    start: "March 2022",
    end: "December 2022",
    span: "March 2022 — December 2022",
    place: "Riyadh, Saudi Arabia",
    era: "Architecture",
    summary:
      "Reported to the CEO of AjlanTech. Led the cloud solution offering with a new cloud vendor, aimed at Vision 2030 work across industries.",
    points: [
      "Positioned offerings across IaaS, PaaS, and SaaS, plus AI and IoT",
      "Worked with the commercial team from greenfield creation through to acquisition contexts",
    ],
  },
  {
    id: "crayon",
    org: "Crayon",
    title: "Cloud Solution Architect",
    start: "March 2018",
    end: "February 2022",
    span: "March 2018 — February 2022",
    place: "Riyadh, Saudi Arabia",
    era: "Architecture",
    summary:
      "Cloud pre-sales architect for enterprise accounts and financial services. Owned the technical path from feasibility and architecture to PoC, compliance, and the decision in the room with senior executives.",
    points: [
      "Architected Azure and Microsoft 365 / EMS workloads, including hybrid estates",
      "Chose between lift-and-shift and new Dev or Production platforms",
      "Led compliance assessments on proposed Azure architectures",
      "Ran technical and economic value discussions that drove implementation decisions",
      "Owned onboarding quality with Microsoft Services or partners, and the usage targets after",
    ],
  },
  {
    id: "dimensions",
    org: "Dimensions Cloud",
    title: "Cloud and Infrastructure Architect",
    start: "September 2016",
    end: "March 2018",
    span: "September 2016 — March 2018",
    place: "Riyadh, Saudi Arabia",
    era: "Architecture",
    summary:
      "Microsoft cloud pre-sales and P-Seller. Advised on architecture and deployment of workloads to Office 365 and Azure, and carried the customer engagement through PoCs and executive value discussions.",
    points: [
      "End-to-end cloud deployment experience for Office 365 and Azure",
      "Implementation projects and proofs of concept",
      "Technical and economic conversations with senior customer executives",
    ],
  },
  {
    id: "alnafitha",
    org: "Alnafitha International Information Technology",
    title: "Microsoft Cloud Solution Architect",
    start: "July 2014",
    end: "August 2016",
    span: "July 2014 — August 2016",
    place: "Jeddah, Saudi Arabia",
    era: "Architecture",
    summary:
      "Advised on architecture and deployment of cloud workloads to Office 365 and Azure, from feasibility and proposal through compliance, migration approach, and onboarding.",
    points: [
      "Technical architecture for selected applications and workloads",
      "Compliance assessments on proposed Azure designs",
      "Hybrid Office 365 architectures, and lift-and-shift or new-platform paths to Azure",
      "Documented practices for client engineering and architecture teams",
    ],
  },
  {
    id: "rtech",
    org: "R-Tech Saudi Arabia",
    title: "Microsoft Engineer",
    start: "October 2012",
    end: "July 2014",
    span: "October 2012 — July 2014",
    place: "Jeddah, Saudi Arabia",
    era: "Engineering",
    summary: "Technical Solution Professional, on the Microsoft engineering side of customer work in Jeddah.",
    points: ["Technical solution work ahead of the later pre-sales architecture roles"],
  },
  {
    id: "alsaqer",
    org: "United Al-Saqer Group",
    title: "Senior Technical Engineer",
    start: "July 2010",
    end: "December 2011",
    span: "July 2010 — December 2011",
    place: "Abu Dhabi, United Arab Emirates",
    era: "Engineering",
    summary:
      "Planned and implemented a purpose-built application estate for Abu Dhabi Motors: BMW showroom, maintenance, and service.",
    points: [
      "Built and rebuilt servers, hardware, storage, and services to project standards",
      "Installed systems infrastructure and asset-management applications",
      "Wrote installation and configuration procedures and kept system standards current",
      "Ran project segments to the agreed commitments, and kept suppliers and the steering committee aligned",
    ],
  },
  {
    id: "nevotek",
    org: "Nevotek",
    title: "Customer Service Engineer",
    start: "March 2007",
    end: "May 2010",
    span: "March 2007 — May 2010",
    place: "Dubai, United Arab Emirates",
    era: "Engineering",
    summary: "Planned and implemented purpose-built applications for Cisco IP phone systems.",
    points: [
      "Delivered project segments to the stated objectives and resources",
      "Directed technical and personnel resources against quality, time, and budget",
      "Kept results legible to management and the steering committee",
    ],
  },
  {
    id: "binsalmeen",
    org: "Bin Salmeen Computers",
    title: "Senior Network Engineer",
    start: "June 2005",
    end: "June 2006",
    span: "June 2005 — June 2006",
    place: "Abu Dhabi, United Arab Emirates",
    era: "Engineering",
    summary: "Designed and installed customer network projects, and administered the internal network and website.",
    points: ["Network project design and installation", "Internal network and website administration"],
  },
  {
    id: "ligroup",
    org: "LI Group",
    title: "Network, Database and Website Administrator",
    start: "January 2004",
    end: "June 2005",
    span: "January 2004 — June 2005",
    place: "Abu Dhabi, United Arab Emirates",
    era: "Engineering",
    summary:
      "Network administration, website work in FrontPage and Flash, and small operational databases in Access.",
    points: ["Network administration", "Website design and build", "Access databases for day-to-day operations"],
  },
  {
    id: "labs-role",
    org: "Abu Dhabi, UAE",
    title: "Network Administrator",
    start: "September 2001",
    end: "December 2003",
    span: "September 2001 — December 2003",
    place: "Abu Dhabi, United Arab Emirates",
    era: "Engineering",
    summary: "Administered the university network labs: performance of the network, and support for students using the labs and equipment.",
    points: ["Network lab administration", "Student support on lab equipment"],
  },
];

export const eras = ["All", "Leadership", "Architecture", "Engineering"] as const;

export const certifications = [
  "Microsoft Certified: Azure Security Engineer Associate",
  "AZ-300 Microsoft Azure Architect Technologies",
  "AWS Certified Solutions Architect – Associate",
  "Microsoft Private Cloud Professional 2012 SP1",
  "MCPS: Microsoft Certified Professional",
];

export const skills = ["Microsoft Azure", "Artificial Intelligence", "Azure DevOps"];

export const languages = [
  { name: "English", note: "Working language for regional leadership, architecture, and executive briefings." },
  { name: "Arabic", note: "Working language across the Kingdom and the wider region." },
];

export const education = {
  school: "Ajman University of Science and Technology",
  degree: "Bachelor's degree, Computer Information Systems",
  years: "2001 — 2004",
};

export const storyChapters = [
  {
    id: "now",
    year: "Now",
    kicker: "Chapter 6 · A regional capability",
    title: "Head of Cloud Services, MENA",
    roleIds: ["mobiz"],
    tiles: ["CAF / WAF governance", "FinOps discipline", "AI platform readiness", "Resilience by design", "Building teams"],
  },
  {
    id: "bank",
    year: "2022",
    kicker: "Chapter 5 · Cloud at bank scale",
    title: "Riyadh, from alliance to the bank",
    roleIds: ["albilad", "ajlan"],
    tiles: [],
  },
  {
    id: "architect",
    year: "2016",
    kicker: "Chapter 4 · The architect years",
    title: "Pre-sales architecture for enterprise and FSI",
    roleIds: ["crayon", "dimensions"],
    tiles: [],
  },
  {
    id: "microsoft",
    year: "2012",
    kicker: "Chapter 3 · Meeting Microsoft",
    title: "Office 365 and early Azure in Jeddah",
    roleIds: ["alnafitha", "rtech"],
    tiles: [],
  },
  {
    id: "wires",
    year: "2005",
    kicker: "Chapter 2 · Wires and phones",
    title: "Networks, Cisco phones, and a BMW showroom",
    roleIds: ["alsaqer", "nevotek", "binsalmeen"],
    tiles: [],
  },
  {
    id: "began",
    year: "2001",
    kicker: "Chapter 1 · Where it began",
    title: "Labs, websites, and a CIS degree",
    roleIds: ["ligroup", "labs-role"],
    tiles: [],
    showEducation: true,
  },
] as const;

export const courseTopics = [
  { id: "cloud", title: "Cloud", line: "Azure, AWS, and Google Cloud." },
  { id: "devops", title: "DevOps", line: "How the platform gets shipped." },
  { id: "ai", title: "AI", line: "Foundations and the model providers." },
  { id: "agents", title: "Agents", line: "Build an agent, then run a team of them." },
] as const;

export const courses = [
  {
    topic: "cloud",
    title: "Azure",
    note: "Build cloud foundations",
    tone: "t-az",
    items: [
      { name: "Azure Fundamentals (AZ-900)", detail: "Microsoft Learn · beginner", href: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/" },
      { name: "Azure Administrator (AZ-104) path", detail: "Microsoft Learn · intermediate", href: "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/" },
      { name: "Cloud Adoption Framework", detail: "Microsoft · strategy and governance", href: "https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/" },
    ],
  },
  {
    topic: "devops",
    title: "DevOps",
    note: "Ship faster, safer",
    tone: "t-do",
    items: [
      { name: "DevOps Engineer (AZ-400) path", detail: "Microsoft Learn · advanced", href: "https://learn.microsoft.com/en-us/credentials/certifications/devops-engineer/" },
      { name: "GitHub Skills", detail: "GitHub · Actions and Git", href: "https://skills.github.com/" },
      { name: "DevOps Roadmap", detail: "roadmap.sh · guided path", href: "https://roadmap.sh/devops" },
    ],
  },
  {
    topic: "ai",
    title: "AI",
    note: "Understand the why and how",
    tone: "t-ai",
    items: [
      { name: "Elements of AI", detail: "University of Helsinki · beginner", href: "https://www.elementsofai.com/" },
      { name: "Azure AI Fundamentals (AI-900)", detail: "Microsoft Learn · beginner", href: "https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/" },
      { name: "Machine Learning Crash Course", detail: "Google · intermediate", href: "https://developers.google.com/machine-learning/crash-course" },
    ],
  },
  {
    topic: "agents",
    title: "AI Agents",
    note: "Build what is next",
    tone: "t-ag",
    items: [
      { name: "AI Agents for Beginners", detail: "Microsoft · free lessons on GitHub", href: "https://github.com/microsoft/ai-agents-for-beginners" },
      { name: "Agents Course", detail: "Hugging Face · hands-on", href: "https://huggingface.co/learn/agents-course" },
      { name: "Short courses on agents and LLMs", detail: "DeepLearning.AI · short and practical", href: "https://www.deeplearning.ai/short-courses/" },
    ],
  },
  {
    topic: "cloud",
    title: "AWS",
    note: "Amazon's cloud, from the source",
    tone: "t-az",
    items: [
      { name: "AWS Cloud Practitioner Essentials", detail: "AWS Skill Builder · free, fundamental", href: "https://skillbuilder.aws/learn/94T2BEN85A/aws-cloud-practitioner-essentials" },
      { name: "Cloud Essentials learning plan", detail: "AWS Training · guided path", href: "https://aws.amazon.com/training/learn-about/cloud-practitioner/" },
      { name: "AWS Well-Architected Foundations", detail: "AWS Skill Builder · free, intermediate", href: "https://explore.skillbuilder.aws/learn/course/108/aws-well-architected-foundations" },
    ],
  },
  {
    topic: "cloud",
    title: "Google Cloud",
    note: "Paths and hands-on labs",
    tone: "t-do",
    items: [
      { name: "Getting Started with Google Cloud", detail: "Google Skills · beginner path", href: "https://www.skills.google/paths/8" },
      { name: "Cloud Engineer path", detail: "Google Skills · hands-on", href: "https://www.skills.google/paths/11" },
      { name: "Cloud Digital Leader path", detail: "Google Skills · business foundations", href: "https://www.skills.google/paths/9" },
    ],
  },
  {
    topic: "ai",
    title: "OpenAI",
    note: "Academy courses",
    tone: "t-ai",
    items: [
      { name: "AI foundations", detail: "OpenAI Academy · beginner", href: "https://academy.openai.com/public/courses/ai-foundations-juzjs" },
      { name: "Applied AI foundations", detail: "OpenAI Academy · workflows", href: "https://academy.openai.com/public/courses/applied-ai-foundations-hgk7r" },
      { name: "Agents and workflows", detail: "OpenAI Academy · directing agents", href: "https://academy.openai.com/public/courses/agents-and-workflows-bieml" },
    ],
  },
  {
    topic: "ai",
    title: "Anthropic",
    note: "Claude Academy",
    tone: "t-ag",
    items: [
      { name: "Claude 101", detail: "Claude Academy · beginner", href: "https://academy.claude.com/courses/claude-101" },
      { name: "Claude Code 101", detail: "Claude Academy · coding agent", href: "https://academy.claude.com/courses/claude-code-101" },
      { name: "Introduction to Model Context Protocol", detail: "Claude Academy · MCP", href: "https://academy.claude.com/courses/introduction-to-model-context-protocol" },
    ],
  },
  {
    topic: "ai",
    title: "xAI",
    note: "Build with the Grok API",
    tone: "t-az",
    items: [
      { name: "API quickstart", detail: "xAI · official guide", href: "https://docs.x.ai/developers/quickstart" },
      { name: "Tools overview", detail: "xAI · search, code, and functions", href: "https://docs.x.ai/developers/tools/overview" },
      { name: "API overview", detail: "xAI · models and first calls", href: "https://docs.x.ai/overview" },
    ],
  },
  {
    topic: "agents",
    title: "Hermes Agent",
    note: "Nous Research",
    tone: "t-do",
    items: [
      { name: "Learning path", detail: "Hermes Agent · official path", href: "https://hermes-agent.nousresearch.com/docs/getting-started/learning-path" },
      { name: "Quickstart", detail: "Hermes Agent · first conversation", href: "https://hermes-agent.nousresearch.com/docs/getting-started/quickstart" },
      { name: "Skills", detail: "Hermes Agent · extend the agent", href: "https://hermes-agent.nousresearch.com/docs/user-guide/features/skills" },
    ],
  },
  {
    topic: "agents",
    title: "Paperclip",
    note: "Run a company of agents",
    tone: "t-ag",
    items: [
      { name: "Quickstart path", detail: "Paperclip · first agent in minutes", href: "https://docs.paperclip.ing/guides/getting-started/five-minute-path/" },
      { name: "Key concepts", detail: "Paperclip · companies, agents, and tasks", href: "https://docs.paperclip.ing/guides/welcome/key-concepts/" },
      { name: "Hire your first agent", detail: "Paperclip · the CEO agent", href: "https://docs.paperclip.ing/guides/getting-started/your-first-agent/" },
    ],
  },
] as const;

export const businessPage = {
  audience:
    "For banks, government, and regulated enterprises across MENA that need Azure platforms which stay compliant, operable, and cost-transparent in production.",
  model: "Same operating model from Dev/SIT through UAT and Production.",
  regulatedTitle: "Built for regulated MENA realities",
  regulated:
    "Designs and delivery for regulated environments. The work assumes auditors will arrive, production will have incidents, and cost must remain transparent as the platform scales.",
  contexts: [
    "Regulated banking and financial services",
    "Government and government-linked entities",
    "Large enterprises with multi-market or multi-jurisdiction needs",
  ],
  processTitle: "How the work progresses",
  differenceTitle: "How this is different",
  differences: [
    "Hands-on architecture and delivery. Strategy does not stop at the subscription.",
    "One operating model across Dev/SIT, UAT, and Production. No separate “production is different” design.",
    "Built for regulated MENA conditions: jurisdiction-specific controls, audit readiness, and cost transparency from the start.",
  ],
  engagement:
    "Typical work includes regional strategy and a landing zone foundation, migration program support, security and compliance remediation, and an operating model with team enablement.",
  credibility: "Led by Tareq Al-Ghazzi, Head of Cloud Services, MENA.",
  closeTitle: "Let's talk about the constraint.",
  close:
    "Share the region, the regulatory context, and what “done” needs to look like. We'll map the practical path from there.",
} as const;

export const offers = [
  {
    kicker: "Advisory",
    title: "Cloud and AI strategy",
    tone: "t-az",
    summary: "Own the regional strategy and the execution, not a slide that stops at the subscription.",
    points: [
      "Align enterprise architecture with financial governance and regulatory requirements",
      "Standardize how markets adopt the platform",
      "FinOps operating model and a cost view leadership can act on",
    ],
    gets: [
      "Regional target architecture aligned to regulatory and financial governance needs",
      "FinOps operating model with a cost view leadership can act on",
      "Prioritized roadmap that connects strategy to funded execution",
      "Clear view of constraints (regulatory, organizational, technical) before design begins",
    ],
    cta: "Plan the regional strategy",
  },
  {
    kicker: "Execution",
    title: "Landing zones and delivery",
    tone: "t-do",
    summary: "CAF and Well-Architected landing zones, with guardrails teams can build inside.",
    points: [
      "The same architecture across Dev/SIT, UAT, and Production",
      "AI platform readiness for advanced workloads and enterprise LLM initiatives",
      "Automation that removes manual operations and shortens delivery",
    ],
    gets: [
      "Production-ready CAF/WAF landing zone with consistent guardrails in every environment",
      "Migration patterns and automation that internal teams can run and maintain",
      "AI-ready platform foundations for advanced and LLM workloads",
      "Reduced manual operations through automation built into the design",
    ],
    cta: "Start the landing zone",
  },
  {
    kicker: "Enablement",
    title: "Security, resilience, teams",
    tone: "t-ai",
    summary: "Identity, compliance, and resilience designed per jurisdiction, with a team that can run it.",
    points: [
      "Regional security and IAM standardization",
      "Disaster recovery and high availability by design",
      "Cross-functional cloud and platform engineering teams",
    ],
    gets: [
      "Jurisdiction-specific security and IAM baseline, ready for audit",
      "Disaster recovery and high availability designed in, not added later",
      "Operating model and team structure that can sustain the standard after handover",
      "Clear ownership so the platform remains healthy in production",
    ],
    cta: "Review the operating model",
  },
] as const;

export const steps = [
  {
    n: "01",
    title: "Discover",
    body: "The region, the constraint, and what done looks like.",
    outcome: "Constraint map, regulatory scope, and a shared definition of “done.”",
  },
  {
    n: "02",
    title: "Design",
    body: "Landing zones, FinOps, and the operating model.",
    outcome: "Target architecture, FinOps model, and guardrails that apply consistently across environments.",
  },
  {
    n: "03",
    title: "Deliver",
    body: "Governance, automation, and AI readiness in the same design.",
    outcome: "Implemented landing zone, automation, and platform patterns the team can build on.",
  },
  {
    n: "04",
    title: "Sustain",
    body: "Security, resilience, and a team that keeps the standard.",
    outcome: "Handover, runbooks, and an operating model that preserves the standard in production.",
  },
] as const;

export const topics = [
  "Business transformation",
  "Cloud and AI strategy",
  "FinOps and landing zones",
  "AI platform readiness",
  "Something else",
] as const;

export const ticker = [
  "Microsoft Azure",
  "CAF",
  "Well-Architected",
  "FinOps",
  "Landing zones",
  "DevSecOps",
  "IAM",
  "AI readiness",
  "Disaster recovery",
  "High availability",
  "Azure DevOps",
  "Microsoft 365",
  "Multicloud security",
];

export type PrivacyBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] };

export const ui = {
  skip: "Skip to content",
  nav: {
    home: "Home",
    story: "Story",
    forYou: "For You",
    business: "Business",
    posts: "Posts",
    contact: "Contact",
    menu: "Menu",
    close: "Close",
    primary: "Primary",
  },
  footer: {
    based: "Based in {{location}}. Working across the MENA region.",
    elsewhere: "Elsewhere",
    contact: "Get in Touch",
    privacy: "Privacy",
    posts: "Posts",
    email: "Email",
  },
  theme: {
    dark: "Switch to dark mode",
    light: "Switch to light mode",
  },
  clock: {
    label: "Riyadh",
    waiting: "Riyadh time",
    hour: "Riyadh, {{hour}}:00",
  },
  quote: {
    before: "Migration volume does not define maturity. Operational ",
    em: "discipline, cost transparency, and architectures",
    after: " that survive Dev, SIT, UAT, and Production do.",
  },
  home: {
    taglineLead: "I build cloud platforms that actually survive reality.",
    taglineRest: "Not slideware. Not best-effort. Not “it works in the lab.”",
    lede: "Since 2001, from Abu Dhabi, UAE as network engineer and domain admin to Head of Cloud Services at Mobiz IT in Riyadh.",
    approachCta: "View My Approach",
    contactCta: "Get in Touch",
    aboutTitle: "About",
    experience: "Experience",
    record: "The record, newest first.",
    howTitle: "How I work",
    expertiseEyebrow: "Expertise",
    expertiseTitle: "Expertise",
    expertiseIntro: "Practical cloud architecture and delivery for organizations that cannot afford failure or non-compliance.",
    certsEyebrow: "Certifications",
    certsTitle: "Certificates beside the work.",
    certsNote: "Named as earned on the CV. The CV does not date them, so they are not pinned to a chapter year.",
    languagesLead: "Languages:",
    languagesJoin: " and ",
    skillsLead: "Top skills:",
    skillsJoin: ", ",
    education: "Education",
    portraitAlt: "Tareq Al-Ghazzi",
  },
  business: {
    eyebrow: "For business",
    title: "Practical architecture for organizations that cannot afford failure.",
    cta: "Let's talk about the constraint",
    seeHow: "See how I work",
    gets: "What you get",
    outcome: "Outcome.",
    record: "View the record",
    start: "Start the conversation",
    orHow: "Or see how I work",
  },
  forYou: {
    eyebrow: "For you",
    title: "Start where I started. Learn for free.",
    intro: "These are public courses I point people to. They are recommendations, not my certifications. My certificates are on the story page.",
    held: "Held certificates:",
  },
  posts: {
    eyebrow: "Posts",
    title: "Notes from the work.",
    intro: "A few of my articles and posts on cloud, architecture, and the work behind them.",
    empty: "No posts yet.",
    all: "All posts",
    linkedin: "View on LinkedIn",
    englishMark: "English",
    arabicMark: "العربية",
    linkedinFrame: "LinkedIn post",
  },
  contact: {
    eyebrow: "Contact me",
    title: "Let's build something resilient.",
    intro: "A region, a landing zone, a cost model, or an AI platform that needs a governor. Write the context, the constraint, and what done looks like.",
    linkedin: "LinkedIn",
    based: "Based in {{location}}.",
    handle: "tareq-alghazzi",
  },
  form: {
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@company.com",
    company: "Company",
    companyPlaceholder: "Optional",
    topic: "Topic",
    message: "Message",
    messagePlaceholder: "How can I help?",
    website: "Website",
    send: "Send message",
    sending: "Sending…",
    received: "Received.",
    receivedNote: "The note is on its way.",
    blocked: "Something blocked the send.",
    network: "The network dropped the note. Try again.",
    errors: {
      company: "Keep the company name under 120 characters.",
      name: "Use a name between 2 and 80 characters.",
      email: "Use a real email address so a reply can land.",
      topic: "Keep the topic under 120 characters.",
      message: "Write at least a sentence, under 4000 characters.",
      delivery: "The note could not be delivered. Try again later.",
      unconfigured: "The mailbox is not ready to receive notes yet. Try again later.",
      json: "Send JSON.",
    },
  },
  notFound: {
    eyebrow: "404",
    title: "This page is not on the map.",
    body: "The story is. Start again, or send a note.",
    cta: "Back to the story",
  },
  meta: {
    homeTitle: "Tareq Al-Ghazzi — Head of Cloud Services, MENA",
    shareTitle: "Tareq Al-Ghazzi — I build cloud platforms that actually survive reality",
    titleSuffix: "Tareq Al-Ghazzi",
    locality: "Riyadh",
    forYouTitle: "For You",
    forYouDescription:
      "Courses and official learning paths Tareq Al-Ghazzi points people to across Azure, AWS, Google Cloud, DevOps, OpenAI, Anthropic, xAI, and agents. These are recommendations, not his certifications.",
    postsTitle: "Posts",
    postsDescription: "A few articles and posts by Tareq Al-Ghazzi on cloud, architecture, and the work behind them.",
    contactTitle: "Contact",
    contactDescription: "Contact Tareq Al-Ghazzi about regional cloud strategy, FinOps, AI platforms, or governance.",
    privacyTitle: "Privacy",
    privacyDescription:
      "How personal information is collected, used, and protected on {{site}}, including the contact form and the site owner's LinkedIn publishing.",
    businessTitle: "Business",
    postFallbackTitle: "Post",
    jsonJob: profile.role,
  },
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy",
    updated: "Last updated: October 21, 2026",
    owner: "Connect LinkedIn",
    blocks: [
      {
        kind: "p",
        text: "This privacy policy describes how personal information is collected, used, and protected on {{site}} (the “Site”) and in connection with the LinkedIn publishing feature used by the site owner.",
      },
      {
        kind: "p",
        text: "{{name}} operates this Site from {{location}}. Privacy questions go to {{mail}}",
      },
      { kind: "h2", text: "1. Personal Information We May Collect" },
      { kind: "p", text: "“Personal Information” means information that relates to an identified or identifiable individual." },
      { kind: "p", text: "We collect Personal Information in the following ways:" },
      { kind: "h3", text: "Information you provide" },
      { kind: "p", text: "When you use the contact form, you provide:" },
      { kind: "ul", items: ["Name", "Email address", "Topic", "Message", "Company (optional)"] },
      {
        kind: "p",
        text: "This information is sent through Resend and is used only to respond to your inquiry. A hidden field is used solely to reduce automated submissions.",
      },
      { kind: "h3", text: "Information related to LinkedIn (site owner only)" },
      {
        kind: "p",
        text: "When the site owner connects a LinkedIn account to publish approved articles, we may receive profile information, an access token, and the content of the posts being published. The access token is shown once so it can be stored securely as a secret. It is not written into page URLs or logs. Articles are published as the connected member (author urn:li:person), not as a company page.",
      },
      { kind: "h3", text: "Information collected automatically" },
      {
        kind: "p",
        text: "Hosting is provided by Vercel. Standard server logs (such as IP address, browser type, and pages requested) may be generated by the hosting provider for security and operation of the Site. Vercel Web Analytics counts visitors and page views without cookies.",
      },
      { kind: "h2", text: "2. How We Use Your Personal Information" },
      { kind: "p", text: "We use Personal Information to:" },
      {
        kind: "ul",
        items: [
          "Respond to contact form inquiries",
          "Operate and secure the Site",
          "Count visitors and page views with cookieless Vercel Web Analytics",
          "Publish approved articles to LinkedIn (site owner only)",
          "Embed public LinkedIn posts on article pages when they exist",
        ],
      },
      { kind: "p", text: "We do not sell Personal Information and we do not use it for advertising." },
      { kind: "h2", text: "3. How We Share Your Personal Information" },
      { kind: "p", text: "We share Personal Information only with:" },
      {
        kind: "ul",
        items: [
          "**Resend** — to deliver contact form submissions",
          "**Vercel** — for website hosting and cookieless Web Analytics",
          "**LinkedIn** — when the site owner publishes or embeds content (as described above)",
        ],
      },
      { kind: "p", text: "These providers process data according to their own policies. We do not sell or rent Personal Information." },
      { kind: "h2", text: "4. How We Protect Your Personal Information" },
      {
        kind: "p",
        text: "We take reasonable measures to protect Personal Information in transit and at rest. No method of transmission or storage is completely secure.",
      },
      { kind: "h2", text: "5. Your Rights and Choices" },
      { kind: "p", text: "You may:" },
      {
        kind: "ul",
        items: [
          "Choose not to submit the contact form",
          "Request access to or deletion of information you submitted through the contact form. Send that request to {{mail}}",
          "Revoke LinkedIn access at any time (site owner)",
        ],
      },
      { kind: "p", text: "We will respond to requests within a reasonable time." },
      { kind: "h2", text: "6. Cookies" },
      { kind: "p", text: "The Site does not use analytics or advertising cookies. Vercel Web Analytics is cookieless." },
      {
        kind: "p",
        text: "LinkedIn sign-in uses a short-lived cookie only to confirm the authentication return trip. That cookie is deleted afterward.",
      },
      { kind: "h2", text: "7. Data Retention" },
      {
        kind: "p",
        text: "Contact form submissions are kept only as long as needed to respond to the inquiry and for reasonable record-keeping.",
      },
      { kind: "p", text: "You may request deletion of contact form data through {{mail}}" },
      { kind: "h2", text: "8. Updates to this Privacy Policy" },
      {
        kind: "p",
        text: "We may update this policy from time to time. The “Last updated” date at the top will change when we do. Continued use of the Site after an update constitutes acceptance of the revised policy.",
      },
      { kind: "h2", text: "9. How to Contact Us" },
      { kind: "p", text: "Privacy questions, access requests, or deletion requests go to {{mail}}" },
    ] as PrivacyBlock[],
  },
} as const;
