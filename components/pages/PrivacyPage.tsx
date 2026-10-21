import { RichText, tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";
import { siteUrl } from "@/lib/site";

export function PrivacyPage({ locale }: { locale: Locale }) {
  const { profile, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  const mailHref = localizePath("/contact", locale);
  const shared = {
    locale,
    site: siteUrl,
    name: profile.name,
    location: profile.location,
    mailHref,
    mailLabel: ui.footer.email,
  };
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">{ui.privacy.eyebrow}</p>
        <h1 className="serif">{ui.privacy.title}</h1>
        <p>{text(ui.privacy.updated)}</p>
      </header>
      <div className="legal">
        {ui.privacy.blocks.map((block, index) => {
          if (block.kind === "h2") return <h2 key={index}>{text(block.text)}</h2>;
          if (block.kind === "h3") return <h3 key={index}>{text(block.text)}</h3>;
          if (block.kind === "ul") {
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>
                    <RichText text={item} {...shared} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={index}>
              <RichText text={block.text} {...shared} />
            </p>
          );
        })}
        <p>
          {text(profile.name)}
          <br />
          {text(profile.location)}
        </p>
        <p className="owner-link">
          <a href="/api/linkedin/start">{ui.privacy.owner}</a>
        </p>
      </div>
    </main>
  );
}
