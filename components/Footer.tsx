import { MailLink } from "@/components/MailLink";
import { profile } from "@/lib/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>
          tarooq<i>.</i>
        </strong>
        <p>
          {profile.name}
          <br />
          {profile.role}
          <br />
          Based in {profile.location}. Working across the MENA region.
        </p>
        <p className="footer-note">{profile.availability}</p>
        <p className="footer-line">{profile.statement}</p>
      </div>
      <div className="elsewhere">
        <span>Elsewhere</span>
        <MailLink />
        <a href="/contact">Get in Touch</a>
        <a href={profile.linkedin}>LinkedIn</a>
        <a href="/privacy">Privacy</a>
        <a href="/posts">Posts</a>
      </div>
    </footer>
  );
}
