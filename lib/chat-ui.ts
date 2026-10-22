import { cleanPath, localizePath, stripLocale, type Locale } from "./locale";

export function showChatWidget(pathname: string) {
  return stripLocale(cleanPath(pathname || "/")) !== "/posts/new";
}

export function chatContactHref(locale: Locale) {
  return localizePath("/contact", locale);
}
