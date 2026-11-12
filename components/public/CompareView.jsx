import { PublicShell, PageHero, CtaBand, Section, Faq } from "./Blocks";

// Competitor comparison page (Jobscan, Teal). Copy and metadata stay in each page file.
export default function CompareView({ eyebrow, title, lead, checked, them, rows, winsTitle, winsText, alsoText, alsoHref, alsoLabel, tryTitle, tryText, faq }) {
  return (
    <PublicShell>
      <PageHero back={["/", "eCareer Design"]} eyebrow={eyebrow} title={title} lead={lead} img="/landing/resumes.jpg">
        <p className="np-small">{checked}</p>
      </PageHero>
      <div className="np-narrow">
        <div className="np-page">
          <div className="np-tablewrap">
            <table className="np-table">
              <thead>
                <tr>
                  <th scope="col"><span className="np-sr">Feature</span></th>
                  <th scope="col" className="np-us">eCareer Design</th>
                  <th scope="col">{them}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <td className="np-us">{r.us}</td>
                    <td>{r.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Section title={winsTitle} id="np-wins">
            <p className="np-sub" style={{ maxWidth: "none", fontSize: 17, lineHeight: 1.75 }}>{winsText}</p>
            <p className="np-related">
              {alsoText} <a href={alsoHref}>{alsoLabel}</a>.
            </p>
          </Section>

          <Section title={tryTitle} id="np-try">
            <p className="np-sub" style={{ maxWidth: "none", fontSize: 17, lineHeight: 1.75 }}>{tryText}</p>
          </Section>

          <Section title="Common questions" id="np-faq">
            <Faq items={faq} />
          </Section>
        </div>
      </div>
      <CtaBand eyebrow="Free ATS score" title="See your resume's ATS score in 30 seconds">
        <a href="/ats-checker" className="np-btn np-btn-or">Check My Score Free</a>
        <a href="/pricing" className="np-btn np-btn-line">See Pricing - $9.99/mo</a>
      </CtaBand>
    </PublicShell>
  );
}
