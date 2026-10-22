import { Link } from "@tanstack/react-router";
import { adminLinks } from "@/lib/admin-navigation";
export function AdminNavigation() {
  return (
    <nav
      aria-label="Pelican administration"
      className="mb-10 flex flex-wrap gap-x-6 gap-y-3 border-y border-border py-4 text-sm"
    >
      {adminLinks.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: true }}
          activeProps={{
            className: "font-semibold underline underline-offset-4",
            "aria-current": "page",
          }}
        >
          {item.label}
        </Link>
      ))}
      <a className="ml-auto text-primary" href="/" target="_blank" rel="noreferrer">
        View website ↗
      </a>
    </nav>
  );
}
