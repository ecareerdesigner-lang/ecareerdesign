import PublicShell, { PhotoBand } from "./PublicShell";

// Build-time switch for the redesigned content pages. NEXT_PUBLIC_ values are baked in at build,
// so this is a plain constant: server components can branch on it without becoming dynamic.
export const NEW_PAGES = process.env.NEXT_PUBLIC_NEW_PUBLIC_PAGES === "1";

const SHADE = "linear-gradient(90deg, rgba(13,26,43,0.92) 0%, rgba(13,26,43,0.74) 60%, rgba(13,26,43,0.5) 100%)";

// Photo band at the top of a page. `back` is an optional [href, label] link.
export function PageHero({ eyebrow, title, lead, back, img = "/landing/compass.jpg", priority = true, children }) {
  return (
    <PhotoBand src={img} priority={priority} shade={SHADE}>
      <div className="np-wrap np-ph">
        {back && <a className="np-crumb" href={back[0]}>&larr; {back[1]}</a>}
        {eyebrow && <p className="np-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {lead && <p className="np-lead">{lead}</p>}
        {children}
      </div>
    </PhotoBand>
  );
}

// Closing photo band with a heading and buttons.
export function CtaBand({ eyebrow, title, img = "/landing/skyline.jpg", children }) {
  return (
    <PhotoBand src={img} className="np-cta" shade={SHADE}>
      <div className="np-wrap np-cta-in">
        {eyebrow && <p className="np-eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        <div className="np-ph-actions" style={{ marginTop: 0 }}>{children}</div>
      </div>
    </PhotoBand>
  );
}

export function Section({ eyebrow, title, id, children }) {
  return (
    <section className="np-section" aria-labelledby={id}>
      {eyebrow && <p className="np-eyebrow">{eyebrow}</p>}
      {title && <h2 className="np-h2" id={id}>{title}</h2>}
      {children}
    </section>
  );
}

export function Steps({ items }) {
  return (
    <div className="np-steps">
      {items.map((it, i) => (
        <div className="np-step" key={i}>
          <div className="np-step-n" aria-hidden="true">{i + 1}</div>
          <h3>{it.title}</h3>
          <p>{it.body}</p>
        </div>
      ))}
    </div>
  );
}

export function Faq({ items }) {
  return (
    <div style={{ marginTop: 20 }}>
      {items.map((it, i) => (
        <div className="np-faq" key={i}>
          <h3>{it.q}</h3>
          <p>{it.a}</p>
        </div>
      ))}
    </div>
  );
}

// Body of a standard page: a centred column under the hero.
export function Page({ narrow, children }) {
  return <div className={narrow ? "np-narrow" : "np-wrap"}><div className="np-page">{children}</div></div>;
}

// Legal / long text page: hero with the title, then the text on a white sheet.
export function DocPage({ title, updated, children }) {
  return (
    <PublicShell>
      <PageHero eyebrow="eCareer Design" title={title} img="/landing/desk.jpg">
        {updated && <p className="np-small">{updated}</p>}
      </PageHero>
      <div className="np-narrow" style={{ marginTop: -28, position: "relative" }}>
        <div className="np-paper">{children}</div>
      </div>
      <div style={{ height: 64 }} />
    </PublicShell>
  );
}

export { PublicShell, PhotoBand };
