// Mock-UI demos of the two Premium-only tools (audit D1.5 / FIT).
// SAMPLE CONTENT: illustrative excerpts, labeled as such. Replace with real
// output from the Interview Coach / Performance Review Writer when you have it.
const C = { ink: "#16283D", soft: "#3C5069", line: "#D7DBD6", orange: "#F2660A", orangeSoft: "#FDE3CC", blue: "#2F5D8F", bg: "#fff" };

const card = { background: C.bg, border: `1px solid ${C.line}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14, color: C.ink, flex: "1 1 320px", minWidth: 0 };
const head = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };
const tag = { fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#E3ECF5", color: "#1F4268" };
const bubble = (bg) => ({ background: bg, borderRadius: 12, padding: "12px 14px", fontSize: 15, lineHeight: 1.5 });

export default function PremiumDemos() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
      <div style={card} role="group" aria-label="Sample mock interview with AI score">
        <div style={head}>
          <span style={{ fontWeight: 600, fontSize: 18 }}>Interview Coach</span>
          <span style={tag}>Sample</span>
        </div>
        <div style={bubble("#E8EEF4")}>
          <b>Question:</b> Tell me about a time you had to deliver bad news to a stakeholder.
        </div>
        <div style={bubble("#F5F6F3")}>
          <b>Your answer (excerpt):</b> &ldquo;Our reporting launch was going to slip two weeks. I called the sponsor the same day, laid out the cause, and offered a phased release so her team had usable numbers on the original date.&rdquo;
        </div>
        <div style={{ ...bubble(C.orangeSoft), display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 30, fontWeight: 600, fontFamily: "Georgia, serif" }}>4/5</span>
          <span style={{ fontSize: 14.5 }}>
            <b>STAR score.</b> Clear situation and action. Add the result: how many days earlier did her team get numbers?
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.soft }}>Example shown for illustration. Voice mock interviews are Premium.</p>
      </div>

      <div style={card} role="group" aria-label="Sample performance review excerpt">
        <div style={head}>
          <span style={{ fontWeight: 600, fontSize: 18 }}>Performance Review Writer</span>
          <span style={tag}>Sample</span>
        </div>
        <div style={bubble("#E8EEF4")}>
          <b>Standard:</b> Exceeds Fully Successful
        </div>
        <div style={bubble("#F5F6F3")}>
          &ldquo;I consistently went beyond the Fully Successful standard for customer service. I rebuilt our weekly service report so supervisors could see problems on Monday instead of Friday, and I trained three new employees on the process.&rdquo;
        </div>
        <div style={{ ...bubble(C.orangeSoft), fontSize: 14.5 }}>
          <b>AI enhancement:</b> names the result and ties it to the rating standard, in first person.
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.soft }}>Example shown for illustration. The Performance Review Writer is Premium.</p>
      </div>
    </div>
  );
}
