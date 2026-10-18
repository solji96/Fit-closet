import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/calendar", label: "일정" },
  { to: "/outfit", label: "코디" },
  { to: "/wardrobe", label: "옷장" },
  { to: "/inbox", label: "알림함" },
];

export function BottomNav() {
  return (
    <nav className="nav" aria-label="주요 화면">
      {LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
          <span className="nav-mark" aria-hidden="true" />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
