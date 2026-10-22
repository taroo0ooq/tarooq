export const themeStorageKey = "tarooq-theme";

export const themeColors = {
  light: "#F3EEE4",
  dark: "#0B1626",
} as const;

/** Midnight is the default. Light is only the stored ivory choice. */
export const themeInitScript = `(function(){try{var stored=localStorage.getItem("${themeStorageKey}");var theme=stored==="light"?"light":"dark";document.documentElement.setAttribute("data-theme",theme);document.documentElement.style.colorScheme=theme;var color=theme==="light"?"${themeColors.light}":"${themeColors.dark}";document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta){meta.setAttribute("content",color);});}catch(e){}})();`;
