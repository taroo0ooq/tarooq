export const profile = {
  name: "tarooq",
  handle: "taroo0ooq",
  role: "Systems engineer",
  email: "justbe_83@hotmail.com",
  github: "https://github.com/taroo0ooq",
  statement: "Keep the secret on the device.",
  deck: "Zero-knowledge vaults, native clients, and delivery gates that stay shut until the scans are green.",
} as const;

export const principles = [
  {
    index: "01",
    title: "The secret stays local",
    body: "Master passwords and vault records are designed to never leave the device in plaintext. Recovery is a passphrase the operator holds, not an account on someone else's server.",
  },
  {
    index: "02",
    title: "The gate is the merge",
    body: "GitHub Actions is the source of truth. SAST, DAST, footprint, and end-to-end checks fail closed. A red required-gate means the next phase does not start.",
  },
  {
    index: "03",
    title: "One core, every surface",
    body: "The cryptographic engine is shared. Desktop, mobile, browser, and API are clients of that core — Tauri, Flutter, Manifest V3, and Go — instead of four copies of the lock.",
  },
] as const;

export type Evidence = "Shipped" | "Production" | "Practice";

export type Project = {
  slug: string;
  index: string;
  name: string;
  status: string;
  evidence: Evidence;
  summary: string;
  highlights: string[];
  stack: string[];
  href: string;
  hrefLabel: string;
  group: "Security" | "Native" | "Product";
};

export const projects: Project[] = [
  {
    slug: "keyvault",
    index: "01",
    name: "KeyVault",
    status: "Engineering underway",
    evidence: "Shipped",
    group: "Security",
    summary:
      "Local-first, zero-knowledge password manager. The vault lives on the device. The merge lives behind a required CI gate.",
    highlights: [
      "Argon2id KDF, AES-256-GCM and XChaCha20-Poly1305 records, buffers zeroized on drop",
      "Rust core with a C ABI, a loopback daemon, and a native messaging host",
      "Tauri desktop, Flutter mobile, and a Manifest V3 autofill extension",
      "Fail-closed SAST and DAST: CodeQL, Semgrep, cargo-audit, cargo-deny, gitleaks, TruffleHog, OWASP ZAP",
      "TOTP, HIBP k-anonymity, CSV import and export, trash, optional SQLCipher",
      "Release footprint target under 15 MB idle RAM and desktop binary",
    ],
    stack: ["Rust", "Tauri", "Flutter", "TypeScript", "Playwright"],
    href: "https://github.com/taroo0ooq/keyvault",
    hrefLabel: "github.com/taroo0ooq/keyvault",
  },
  {
    slug: "localvault",
    index: "02",
    name: "LocalVault",
    status: "v1 stages complete",
    evidence: "Shipped",
    group: "Security",
    summary:
      "Multi-user zero-knowledge vault. A Docker Desktop host, light clients, and access over the LAN or a tunnel.",
    highlights: [
      "Go API plus web, Manifest V3 extension, Tauri desktop, and Flutter mobile with OS autofill",
      "Argon2id device profiles and AES-256-GCM",
      "Enrollment order: username, PIN, recovery passphrase",
      "Stages S0 through S8 marked complete, including hardening and full DAST",
      "Release path with SBOM, checksums, and optional cosign",
    ],
    stack: ["Go", "TypeScript", "Tauri", "Flutter", "Docker"],
    href: "https://github.com/taroo0ooq/localvault",
    hrefLabel: "github.com/taroo0ooq/localvault",
  },
  {
    slug: "waraq-windows",
    index: "03",
    name: "Waraq for Windows",
    status: "Windows port",
    evidence: "Shipped",
    group: "Native",
    summary:
      "Windows port of the GPL-3 live wallpaper app. Video and GIF render behind the desktop through a WorkerW host.",
    highlights: [
      "C# / .NET 8 and WPF",
      "Wallpaper host strategy: WorkerW on Progman, across the virtual desktop",
      "Apply a local video or GIF, stop on demand, and tear down when the app exits",
      "Upstream macOS app is Swift; this program is the Windows client",
    ],
    stack: ["C#", ".NET 8", "WPF"],
    href: "https://github.com/taroo0ooq/waraq-windows",
    hrefLabel: "github.com/taroo0ooq/waraq-windows",
  },
  {
    slug: "syriantalent",
    index: "04",
    name: "SyrianTalent",
    status: "In production",
    evidence: "Production",
    group: "Product",
    summary:
      "Arabic-first job platform connecting employers and job seekers in Syria. Live on Vercel.",
    highlights: [
      "Next.js and TypeScript product UI, Arabic-first",
      "Prisma and Supabase for data",
      "WhatsApp reach through WAHA",
      "Develop branch for features, main for production releases",
    ],
    stack: ["Next.js", "TypeScript", "Prisma", "Supabase", "Vercel"],
    href: "https://syriantalent-rosy.vercel.app",
    hrefLabel: "syriantalent-rosy.vercel.app",
  },
];

export type Domain = {
  id: string;
  title: string;
  evidence: Evidence;
  summary: string;
  knowledge: string[];
  showsUpIn: string[];
};

export const domains: Domain[] = [
  {
    id: "crypto",
    title: "Zero-knowledge cryptography",
    evidence: "Shipped",
    summary:
      "Vault crypto designed so a server, if one exists at all, cannot read the secret. The key is derived on the device and the records are authenticated encryption.",
    knowledge: [
      "Argon2id as the password KDF, including memory and iteration profiles per device",
      "AES-256-GCM and XChaCha20-Poly1305 for records",
      "Master secret kept off the wire and out of plaintext storage",
      "Sensitive material zeroized when it is dropped",
      "Platform wrappers for DPAPI, Keychain, and KeyStore",
      "TOTP second factors inside the vault, including a mobile FFI path",
      "HIBP range queries (k-anonymity) for breach checks",
      "Optional SQLCipher storage and a recovery passphrase at enroll",
    ],
    showsUpIn: ["KeyVault", "LocalVault"],
  },
  {
    id: "rust",
    title: "Rust systems and FFI",
    evidence: "Shipped",
    summary:
      "The cryptographic engine is a Rust workspace. Other languages talk to it through a small C ABI and a loopback daemon, not through a reimplementation.",
    knowledge: [
      "vault-core: KDF, vault crypto, generator, SQL schema",
      "A local daemon for health, API, and DAST against loopback",
      "vault-ffi C ABI for Flutter and other non-Rust clients",
      "Native messaging host for Chrome and Firefox",
      "Release size and idle working-set budgets, measured in script",
      "cargo-audit, cargo-deny, and clippy as merge gates",
    ],
    showsUpIn: ["KeyVault"],
  },
  {
    id: "clients",
    title: "Desktop, mobile, and browser clients",
    evidence: "Shipped",
    summary:
      "The same vault shows up as a desktop app, a phone app, and a browser extension. Each client is thin. Autofill is part of the product, not a later idea.",
    knowledge: [
      "Tauri v2 shells on Windows and macOS",
      "Flutter UI with dart:ffi into the native core",
      "Android Autofill and iOS credential-provider direction",
      "Manifest V3 extensions: autofill, autosave, generate-and-fill, TOTP reveal",
      "Secure tunnel pairing through cloudflared or ngrok when a client is off-box",
      "Playwright coverage for the extension",
    ],
    showsUpIn: ["KeyVault", "LocalVault"],
  },
  {
    id: "delivery",
    title: "Security delivery pipelines",
    evidence: "Shipped",
    summary:
      "CI is the primary path. Local builds are for iteration. A merge needs a green required-gate, and open automated findings block the next phase.",
    knowledge: [
      "GitHub Actions workflows for CI, SAST, DAST, E2E, and FFI",
      "CodeQL, Semgrep, npm audit, Flutter analyze",
      "Secret scanning with gitleaks and TruffleHog",
      "OWASP ZAP baseline with fail-closed auth probes",
      "SBOM, checksums, and optional cosign on release",
      "Residual-risk registers and stage handover documents",
    ],
    showsUpIn: ["KeyVault", "LocalVault"],
  },
  {
    id: "go",
    title: "Go services and local hosting",
    evidence: "Shipped",
    summary:
      "LocalVault's host is a Go API in Docker Desktop. Clients stay light. The box on the desk is the trust boundary.",
    knowledge: [
      "Multi-user vault API and enrollment",
      "Docker Compose deploy for the host",
      "Health checks on loopback",
      "Web client, importers, and shared TypeScript packages beside the API",
      "LAN access and Cloudflare or ngrok tunnel edges",
    ],
    showsUpIn: ["LocalVault"],
  },
  {
    id: "windows",
    title: "Windows native applications",
    evidence: "Shipped",
    summary:
      "Desktop software on Windows, from a cryptographic daemon to a wallpaper host that has to negotiate with the shell.",
    knowledge: [
      "C# / .NET 8 and WPF application structure",
      "WorkerW / Progman wallpaper hosting across the virtual desktop",
      "Video and GIF wallpaper lifecycle: apply, stop, exit teardown",
      "WinUI 3 exploration beside the WPF host",
      "PowerShell build, footprint, and automation scripts",
    ],
    showsUpIn: ["Waraq for Windows", "KeyVault"],
  },
  {
    id: "product",
    title: "Product web and data",
    evidence: "Production",
    summary:
      "Arabic-first product work in production: a hiring platform with a real database, messaging, and a release branch that is not the development branch.",
    knowledge: [
      "Next.js and TypeScript application UI",
      "Prisma with Supabase",
      "WhatsApp integration through WAHA",
      "Vercel production deploys",
      "Feature work on develop, production only from main",
    ],
    showsUpIn: ["SyrianTalent"],
  },
  {
    id: "azure",
    title: "Microsoft cloud and identity",
    evidence: "Practice",
    summary:
      "Platform work across Azure and Entra: clusters, app hosting, identity, data, cost, and model deployments. The public artifact is older. The practice is current.",
    knowledge: [
      "Azure Kubernetes Service, including Automatic readiness and networking choices",
      "App Service, Container Apps, and Functions hosting decisions",
      "Entra ID app registration, OAuth, and agent identity token exchange",
      "Blob, file, queue, and table storage, plus lifecycle tiers",
      "Service Bus and Event Hubs",
      "Quotas, cost, zone redundancy, and compliance posture",
      "Microsoft Foundry model deployment, evaluation, and fine-tuning",
      "Earlier public work: SharePoint 2016 high availability on Azure, in PowerShell",
    ],
    showsUpIn: ["Azure SharePoint HA"],
  },
  {
    id: "integration",
    title: "Integrations and automation",
    evidence: "Practice",
    summary:
      "Glue between systems: ServiceNow automation, scripted infrastructure, and MCP tools that let an agent talk to an operational platform.",
    knowledge: [
      "ServiceNow integration work, including a private MCP server",
      "PowerShell for Windows and Azure automation",
      "Python tooling around platform APIs",
      "GitHub Actions as the policy surface, not a side script",
    ],
    showsUpIn: ["ServiceNow MCP"],
  },
];

export const languages: { name: string; usedIn: string }[] = [
  { name: "Rust", usedIn: "KeyVault core, FFI, daemon" },
  { name: "TypeScript", usedIn: "LocalVault clients, extensions, SyrianTalent" },
  { name: "Go", usedIn: "LocalVault API" },
  { name: "Dart", usedIn: "Flutter vault and SyrianTalent mobile" },
  { name: "C#", usedIn: "Waraq for Windows" },
  { name: "Swift", usedIn: "Waraq macOS sources in the Windows port repo" },
  { name: "Python", usedIn: "ServiceNow tooling and earlier platform scripts" },
  { name: "PowerShell", usedIn: "Footprint, Azure, and Windows automation" },
  { name: "Kotlin", usedIn: "Android edges of the mobile clients" },
];

export const ticker = [
  "Rust",
  "Argon2id",
  "AES-256-GCM",
  "XChaCha20",
  "Tauri",
  "Flutter",
  "Manifest V3",
  "Go",
  "Docker",
  ".NET 8",
  "Next.js",
  "Supabase",
  "Azure",
  "Entra ID",
  "SAST",
  "DAST",
  "OWASP ZAP",
  "Playwright",
];

export const groups = ["All", "Security", "Native", "Product"] as const;
