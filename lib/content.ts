export const profile = {
  name: "Tareq Al-Ghazzi",
  short: "Al-Ghazzi",
  role: "Head of Cloud Services, MENA",
  location: "Riyadh, Saudi Arabia",
  email: "justbe_83@hotmail.com",
  linkedin: "https://www.linkedin.com/in/tareq-alghazzi",
  statement: "Cloud is a regional capability.",
  deck: "Strategy, governance, and execution for enterprise cloud and AI across MENA. FinOps, landing zones, and security sit in the design, not in a later phase.",
} as const;

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
      "Accountable for the regional cloud and AI strategy across countries, and for keeping architecture, financial governance, compliance, and business objectives on the same page.",
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
    start: "June 2022",
    end: "February 2026",
    span: "June 2022 — February 2026",
    place: "Riyadh, Saudi Arabia",
    era: "Leadership",
    summary:
      "Responsible for how Azure is used at enterprise scale: landing zones, network patterns, automation, AI use cases, and cost governance. Led cloud engineers and architects, with infra, applications, data, and security.",
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
    id: "ajman-role",
    org: "Ajman University of Science and Technology",
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
