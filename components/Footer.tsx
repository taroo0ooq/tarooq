import Link from "next/link";
import { MailLink } from "@/components/MailLink";
import { tx } from "@/components/RichText";
import { getCopy } from "@/lib/copy";
import { localizePath, type Locale } from "@/lib/locale";

export function Footer({ locale }: { locale: Locale }) {
  const { profile, ui } = getCopy(locale);
  const text = (value: string) => tx(locale, value);
  return (
    <footer className="site-footer">
      <div>
        <strong dir="ltr">
          tarooq<i>.</i>
        </strong>
        <p>
          {text(profile.name)}
          <br />
          {text(profile.role)}
          <br />
          {text(ui.footer.based.replace("{{location}}", profile.location))}
        </p>
        <p className="footer-note">
          <Link href={localizePath("/business", locale)}>{text(profile.availability)}</Link>
        </p>
        <p className="footer-line">{text(profile.statement)}</p>
      </div>
      <div className="elsewhere">
        <span>{ui.footer.elsewhere}</span>
        <MailLink href={localizePath("/contact", locale)} label={ui.footer.email} />
        <a href={localizePath("/contact", locale)}>{ui.footer.contact}</a>
        <a href={profile.linkedin}>LinkedIn</a>
        <a href={localizePath("/privacy", locale)}>{ui.footer.privacy}</a>
        <a href={localizePath("/posts", locale)}>{ui.footer.posts}</a>
      </div>
    </footer>
  );
}
