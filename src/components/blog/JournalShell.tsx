import { Link } from "@tanstack/react-router";
import { fontStack } from "@/lib/blog-types";
import type { BlogSettings } from "@/lib/blog-types";

/**
 * Shared editorial chrome (sticky brand bar + footer) for the public blog.
 * `reader` hides every navigation affordance so a shared post link shows
 * nothing but the post itself.
 */
export function JournalShell({
  settings,
  children,
  reader = false,
}: {
  settings: BlogSettings;
  children: React.ReactNode;
  reader?: boolean;
}) {
  return (
    <div
      className="blog-journal min-h-screen"
      style={
        {
          "--blog-accent": settings.accent,
          fontFamily: fontStack(settings.font),
        } as React.CSSProperties
      }
    >
      <header className="journal-bar">
        {reader ? (
          <span className="journal-brand truncate">{settings.title}</span>
        ) : (
          <Link to="/blog" className="journal-brand truncate">
            {settings.title}
          </Link>
        )}
        {reader ? (
          <span className="journal-navlink shrink-0">Journal</span>
        ) : (
          <nav className="flex shrink-0 items-center gap-4">
            <Link to="/blog" className="journal-navlink">
              Journal
            </Link>
            <Link to="/" className="journal-navlink hidden sm:inline">
              Home
            </Link>
          </nav>
        )}
      </header>

      {children}

      <footer className="px-5 pb-14 pt-10">
        <div className="journal-rule">
          <span />
        </div>
        <p className="journal-serif text-center text-lg italic">{settings.title}</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
