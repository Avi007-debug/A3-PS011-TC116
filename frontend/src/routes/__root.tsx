import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  ScrollRestoration,
} from "@tanstack/react-router";
import { PageLoader } from "@/components/sentinel/PageLoader";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center">
        {/* Animated 404 terminal block */}
        <div className="nf-terminal mb-8">
          <div className="nf-titlebar">
            <span className="nf-dot nf-dot--red" />
            <span className="nf-dot nf-dot--yellow" />
            <span className="nf-dot nf-dot--green" />
            <span className="nf-titlebar-label">sentinel - error</span>
          </div>
          <div className="nf-body">
            <p className="nf-prompt">$ argus route --resolve</p>
            <p className="nf-error">
              [ERROR] Route not found: <code>{window.location.pathname}</code>
            </p>
            <p className="nf-warn">
              [WARN]  No match in platform navigator index (9 entries)
            </p>
            <p className="nf-ok">
              [INFO]  Suggest: navigate to / or use Explore Modules
            </p>
            <p className="nf-prompt nf-caret">$ _</p>
          </div>
        </div>

        <h1 className="text-6xl font-bold font-mono text-destructive mb-2">404</h1>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Route not in scope
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          The requested path is not registered in the ArgusASM platform
          navigator.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/"
            className="btn-primary"
          >
            ← Return to Overview
          </Link>
          <a
            href="javascript:history.back()"
            className="btn-secondary"
          >
            Go Back
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 inline-flex items-center gap-2 border border-destructive px-4 py-2 font-mono text-xs text-destructive uppercase tracking-wider">
          <span className="inline-block h-2 w-2 bg-destructive" />
          SYSTEM FAULT DETECTED
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Page load failure
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error interrupted the ArgusASM module load. The system
          can attempt recovery.
        </p>
        {error?.message && (
          <pre className="mt-4 border border-border bg-surface p-3 text-left font-mono text-xs text-destructive overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            Retry Module
          </button>
          <a
            href="/"
            className="btn-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isLoading = useRouterState({ select: (s) => s.isLoading });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <QueryClientProvider client={queryClient}>
      <ScrollRestoration />
      <PageLoader isLoading={isLoading} />
      <div key={pathname} className="page-enter">
        <Outlet />
      </div>
    </QueryClientProvider>
  );
}
