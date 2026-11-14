
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navigation.css";

const links = [
  ["Home", "/"],
  ["Reviews", "/#reviews"],
  ["Discover feed", "/#feed"],
];

export default function Navigation({
  internal = false,
  menuOpen = false,
}) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (pathname !== "/" || !hash) return;

    const targetId = decodeURIComponent(hash.slice(1));
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [pathname, hash]);

  const visibleLinks = internal
    ? links
    : links.filter(([label]) =>
        ["Home", "Reviews", "Discover feed"].includes(label)
      );

  return (
    <div
      className={`nav-links shared-nav ${menuOpen ? "open" : ""}`}
    >
      {visibleLinks.map(([label, href]) => {
        const [targetPath, targetHash] = href.split("#");

        const active = targetHash
          ? pathname === targetPath &&
            hash === `#${targetHash}`
          : pathname === href && !hash;

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
