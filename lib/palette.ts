export const paletteIds = ["champagne", "brass", "emerald"] as const;

export type PaletteId = (typeof paletteIds)[number];

export const paletteStorageKey = "tarooq-palette";

export const defaultThemeColors = {
  light: "#f8f7fc",
  dark: "#070910",
} as const;

export const paletteColors = {
  champagne: {
    name: "Midnight and Champagne",
    light: "#F8F5EF",
    dark: "#0A121E",
    ink: "#0E1B2C",
    accent: "#B8955A",
  },
  brass: {
    name: "Graphite and Brass",
    light: "#F4F3F0",
    dark: "#121417",
    ink: "#1C1F24",
    accent: "#A67C3D",
  },
  emerald: {
    name: "Emerald Noir",
    light: "#F6F2EA",
    dark: "#071C18",
    ink: "#0F2E26",
    accent: "#C2A15B",
  },
} as const;

export function isPaletteId(value: string | null | undefined): value is PaletteId {
  return value === "champagne" || value === "brass" || value === "emerald";
}

/** Query wins. `default` clears a stored choice. Otherwise the stored choice remains. */
export function resolvePalette(fromQuery: string | null, stored: string | null): PaletteId | "" {
  if (fromQuery === "default" || fromQuery === "current") return "";
  if (isPaletteId(fromQuery)) return fromQuery;
  if (isPaletteId(stored)) return stored;
  return "";
}

export function paletteThemeColor(palette: string | null | undefined, theme: "light" | "dark") {
  if (isPaletteId(palette)) return theme === "dark" ? paletteColors[palette].dark : paletteColors[palette].light;
  return defaultThemeColors[theme];
}

export const paletteInitScript = `(function(){try{var allowed={champagne:1,brass:1,emerald:1};var colors={champagne:{light:"#F8F5EF",dark:"#0A121E"},brass:{light:"#F4F3F0",dark:"#121417"},emerald:{light:"#F6F2EA",dark:"#071C18"}};var params=new URLSearchParams(location.search);var fromQuery=params.get("palette");var stored="";try{stored=localStorage.getItem("${paletteStorageKey}")||"";}catch(e){}if(!stored){var match=document.cookie.match(/(?:^|; )${paletteStorageKey}=([^;]*)/);stored=match?decodeURIComponent(match[1]):"";}var palette="";if(fromQuery==="default"||fromQuery==="current"){palette="";}else if(fromQuery&&allowed[fromQuery]){palette=fromQuery;}else if(allowed[stored]){palette=stored;}var root=document.documentElement;if(palette){root.setAttribute("data-palette",palette);}else{root.removeAttribute("data-palette");}try{localStorage.setItem("${paletteStorageKey}",palette);}catch(e){}document.cookie="${paletteStorageKey}="+encodeURIComponent(palette)+"; Path=/; Max-Age="+(palette?2592000:0)+"; SameSite=Lax";if(palette&&colors[palette]){var theme=root.getAttribute("data-theme")==="dark"?"dark":"light";var color=colors[palette][theme];document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){meta.setAttribute("content",color);});}}catch(e){}})();`;
