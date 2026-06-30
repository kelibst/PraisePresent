// About settings: real app info. The version is injected at build time via the
// `__APP_VERSION__` define (from package.json — see vite.renderer.config.ts), so
// the renderer never reaches into the filesystem (§1.3). Read-only, no controls.

export default function AboutSettings() {
  const rows: { label: string; value: string }[] = [
    { label: 'Version', value: `v${__APP_VERSION__}` },
    { label: 'Application', value: 'PraisePresent' },
    { label: 'Scripture', value: 'World English Bible (WEB) · bundled, offline' },
  ];

  return (
    <section className="max-w-2xl rounded-lg border bg-card p-6">
      <h2 className="mb-1 text-lg font-semibold text-foreground">About PraisePresent</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Worship presentation for scripture, songs, and media.
      </p>

      <dl className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-3">
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="text-sm font-medium text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
