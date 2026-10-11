import { profile } from "@/lib/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          {profile.name} · {profile.role}
          <br />
          Palette: luminous blue on ink, chartreuse hook. Late-2026 signal theme.
        </p>
        <p>
          <a href={profile.github}>GitHub</a>
          {" · "}
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
      </div>
    </footer>
  );
}
