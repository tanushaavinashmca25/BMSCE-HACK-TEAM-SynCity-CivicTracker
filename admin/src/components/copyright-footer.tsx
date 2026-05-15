const APP_NAME = "SynCity";

/** Replace with your official copyright notice (use \n for multiple lines). */
const COPYRIGHT_TEXT =
  "© 2026 SynCity. All rights reserved.\nBuilt for civic impact.";

export function CopyrightFooter() {
  const lines = COPYRIGHT_TEXT.split("\n").filter(Boolean);

  return (
    <footer className="mt-auto border-t border-border/80 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1.5 px-4 text-center sm:px-6">
        <div className="mb-2 h-0.5 w-10 rounded-full bg-border" />
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">
          {APP_NAME}
        </p>
        {lines.map((line) => (
          <p
            key={line}
            className="max-w-md text-[11px] leading-relaxed text-muted-foreground/90"
          >
            {line}
          </p>
        ))}
      </div>
    </footer>
  );
}
