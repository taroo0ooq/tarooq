import Link from "next/link";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";

export function NotFoundPage({ locale }: { locale: Locale }) {
  const { ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">{ui.notFound.eyebrow}</p>
        <h1 className="serif">{text(ui.notFound.title)}</h1>
        <p>{text(ui.notFound.body)}</p>
        <p>
          <Link className="btn btn-purple" href={localizePath("/", locale)}>
            {ui.notFound.cta}
          </Link>
        </p>
      </header>
    </main>
  );
}
