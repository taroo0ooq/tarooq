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
    light: "#0B1626",
    dark: "#0B1626",
    ink: "#F3EEE4",
    accent: "#C8A96A",
  },
  brass: {
    name: "Graphite and Brass",
    light: "#FFFFFF",
    dark: "#111111",
    ink: "#111111",
    accent: "#A67C3D",
  },
  emerald: {
    name: "Emerald Noir",
    light: "#F6F2EA",
    dark: "#071C18",
    ink: "#0F2E26",
    accent: "#C9A75E",
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

export const paletteInitScript = `(function(){try{var allowed={champagne:1,brass:1,emerald:1};var colors={champagne:{light:"#0B1626",dark:"#0B1626"},brass:{light:"#FFFFFF",dark:"#111111"},emerald:{light:"#F6F2EA",dark:"#071C18"}};var params=new URLSearchParams(location.search);var fromQuery=params.get("palette");var stored="";try{stored=localStorage.getItem("${paletteStorageKey}")||"";}catch(e){}if(!stored){var match=document.cookie.match(/(?:^|; )${paletteStorageKey}=([^;]*)/);stored=match?decodeURIComponent(match[1]):"";}var palette="";if(fromQuery==="default"||fromQuery==="current"){palette="";}else if(fromQuery&&allowed[fromQuery]){palette=fromQuery;}else if(allowed[stored]){palette=stored;}var root=document.documentElement;if(palette){root.setAttribute("data-palette",palette);}else{root.removeAttribute("data-palette");}var theme=root.getAttribute("data-theme")==="dark"?"dark":"light";if(palette==="champagne"){root.style.colorScheme="dark";}else if(palette){root.style.colorScheme=theme;}try{localStorage.setItem("${paletteStorageKey}",palette);}catch(e){}document.cookie="${paletteStorageKey}="+encodeURIComponent(palette)+"; Path=/; Max-Age="+(palette?2592000:0)+"; SameSite=Lax";if(palette&&colors[palette]){var color=colors[palette][theme];document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){meta.setAttribute("content",color);});}}catch(e){}})();`;
