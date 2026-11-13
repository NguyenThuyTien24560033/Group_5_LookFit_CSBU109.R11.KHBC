
import { Link, useLocation } from "react-router-dom";
import "./Navigation.css";

const links = [
  ["Home", "/"],
  ["Discover feed", "/#feed"],
  ["Reviews", "/#reviews"],
  ["Profile", "/profile"],
  ["Recommendation", "/recommendation"],
  ["History", "/history"],
];

export default function Navigation({ internal = false, menuOpen = false }) {
  const { pathname, hash } = useLocation();

  const visibleLinks = internal
    ? links
    : links.filter(([label]) =>
        ["Home", "Discover feed", "Reviews", "History"].includes(label)
      );

  return (
    <div className={`nav-links shared-nav ${menuOpen ? "open" : ""}`}>
      {visibleLinks.map(([label, href]) => {
        const [targetPath, targetHash] = href.split("#");

        const active = targetHash
          ? pathname === targetPath && hash === `#${targetHash}`
          : pathname === href;

        return (
          <Link
            key={label}
            to={href}
            aria-current={active ? "page" : undefined}
            data-active={active ? "true" : "false"}
            className={active ? "active" : ""}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
