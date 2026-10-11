import { profile } from "@/lib/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          {profile.name}
          <br />
          {profile.role} · {profile.location}
        </p>
        <p>
          <a href={profile.linkedin}>LinkedIn</a>
          {" · "}
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </p>
      </div>
    </footer>
  );
}
