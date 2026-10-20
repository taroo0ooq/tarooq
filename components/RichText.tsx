import { MailLink } from "@/components/MailLink";
import type { Locale } from "@/lib/locale";
import { isolateLatinText } from "@/lib/markdown";

export function tx(locale: Locale, value: string) {
  return locale === "ar" ? isolateLatinText(value) : value;
}

const marker = /(\{\{(?:site|name|location|mail)\}\}|\*\*[^*]+\*\*)/g;

export function RichText({
  text,
  locale,
  site,
  name,
  location,
  mailHref,
  mailLabel,
}: {
  text: string;
  locale: Locale;
  site: string;
  name: string;
  location: string;
  mailHref: string;
  mailLabel: string;
}) {
  const parts = text.split(marker).filter((part) => part.length > 0);
  return parts.map((part, index) => {
    if (part === "{{mail}}") return <MailLink href={mailHref} key={index} label={mailLabel} />;
    if (part === "{{site}}") {
      return (
        <span dir="ltr" key={index}>
          {site}
        </span>
      );
    }
    if (part === "{{name}}") return <span key={index}>{tx(locale, name)}</span>;
    if (part === "{{location}}") return <span key={index}>{tx(locale, location)}</span>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{tx(locale, part.slice(2, -2))}</strong>;
    return <span key={index}>{tx(locale, part)}</span>;
  });
}
