import type { PublishedContent } from "@/lib/site-content";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";

import { Header, Footer, MobileActions } from "../components/site";
import appCss from "../styles.css?url";
import { jsonLd, pageSeo } from "../lib/seo";
import { PageViews } from "@/components/page-views";
const WorkspaceShell = lazy(() =>
  import("@/components/admin/workspace-shell").then((module) => ({
    default: module.WorkspaceShell,
  })),
);
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "xIWXk62erJNQuuSSm-v_Ej6-SytEUnRPaPn_VphsylU" },
      { title: "Pelican Tours and Safaris" },
      {
        name: "description",
        content: "Guided safaris and tours across Namibia, Botswana and Zimbabwe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preload",
        href: "/fonts/sora-latin-variable.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const publishedPackage = useRouterState({
    select: (state) =>
      state.matches.find((match) => match.routeId === "/packages/$id")?.loaderData as
        { publicPackage?: PublishedContent } | undefined,
  });
  const seo = pageSeo(
    pathname,
    import.meta.env["VITE_SITE_ORIGIN"],
    publishedPackage?.publicPackage,
  );
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {seo.canonical && <link rel="canonical" href={seo.canonical} />}
        {seo.canonical && <meta property="og:url" content={seo.canonical} />}
        <meta
          name="robots"
          content={seo.indexable ? "index, follow, max-image-preview:large" : "noindex, follow"}
        />
        {seo.structuredData.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
          />
        ))}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const current = useRouterState({
    select: (state) => ({
      path: state.location.pathname,
      context: state.matches.at(-1)?.context as
        { user?: { email?: string }; adminAssurance?: string } | undefined,
    }),
  });
  const privatePage =
    current.path === "/admin" ||
    current.path.startsWith("/admin/") ||
    ["/dashboard", "/content-manage", "/trips-manage"].includes(current.path);
  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-50 focus:rounded-lg focus:bg-background focus:px-5 focus:py-3 focus:text-foreground focus:ring-2 focus:ring-primary"
      >
        Skip to content
      </a>
      {privatePage ? (
        <Suspense
          fallback={
            <p className="p-8" role="status">
              Opening your workspace…
            </p>
          }
        >
          <WorkspaceShell
            email={current.context?.user?.email ?? "Staff"}
            ready={current.context?.adminAssurance === "aal2"}
          >
            <main id="main-content" tabIndex={-1}>
              <Outlet />
            </main>
          </WorkspaceShell>
        </Suspense>
      ) : (
        <>
          <Header />
          <main id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <Footer />
          <MobileActions />
          <PageViews path={current.path} />
        </>
      )}
      <Toaster />
    </QueryClientProvider>
  );
}
