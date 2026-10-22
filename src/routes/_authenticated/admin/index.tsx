import { createFileRoute, Link } from "@tanstack/react-router";
import { adminLinks } from "@/lib/admin-navigation";
export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminHome });
function AdminHome() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Welcome to Pelican</h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Your website, at your pace. Choose a task below. Drafts stay private until you publish them.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {adminLinks.slice(1).map((item) => (
          <Link
            to={item.to}
            key={item.to}
            className="rounded-lg border border-border p-6 hover:border-foreground/40"
          >
            <h2 className="text-2xl">{item.label}</h2>
            <p className="mt-3 text-muted-foreground">{item.description}</p>
            <span className="mt-5 block text-sm font-semibold text-primary">
              Open {item.label.toLowerCase()} →
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-2xl">How updates work</h2>
        <p className="mt-3 max-w-3xl">
          Save a draft, check its preview, then publish. Published updates appear when visitors next
          open the page; an already open page checks for updates every 30 seconds. Photos remain
          private until published. Unpublish hides an entry while keeping its saved history.
        </p>
      </div>
    </>
  );
}
