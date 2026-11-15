// Adds an invisible, selectable/searchable text layer to the image-based resume PDF export.
// The export is a screenshot (html2canvas), so without this the PDF has no text at all and ATS
// systems, our own scoring tools and copy/paste see an empty document.
// Everything here is best-effort: callers wrap it in try/catch so the PDF still downloads.

const MAP = { "‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", "•": "-", "·": "-", "…": "...", " ": " ", "−": "-" };

function clean(s) {
  return s
    .replace(/[‘’“”–—•·… −]/g, (c) => MAP[c])
    .replace(/[^\x20-\x7E¡-ÿ]/g, "")
    .replace(/\s+/g, " ");
}

// Returns text segments with positions in CSS px relative to the element's top-left, in document order.
export function collectTextSegments(element) {
  const root = element.getBoundingClientRect();
  const segments = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node;
  while ((node = walker.nextNode())) {
    const value = node.nodeValue;
    if (!value || !value.trim()) continue;
    const parent = node.parentElement;
    if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) continue;
    const cs = getComputedStyle(parent);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) continue;
    const fontPx = parseFloat(cs.fontSize) || 12;

    let current = null;
    const re = /\S+/g;
    let m;
    while ((m = re.exec(value))) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getClientRects()[0];
      if (!r || r.width === 0 || r.height === 0) continue;
      const top = r.top - root.top;
      if (current && Math.abs(top - current.top) < Math.max(2, current.h * 0.4) && r.left >= current.right - 1) {
        current.text += " " + m[0];
        current.right = r.right;
      } else {
        if (current) segments.push(current);
        current = { text: m[0], left: r.left - root.left, right: r.right, top, h: r.height, fontPx };
      }
    }
    if (current) segments.push(current);
  }
  return segments;
}

// pages: [{ startPx, heightPx }] in canvas pixels. scaleRatio: canvas px per CSS px.
export function addTextLayer(pdf, segments, pages, scaleRatio, canvasWidth, pageWidthPt) {
  const ptPerCanvasPx = pageWidthPt / canvasWidth;
  pdf.setFont("helvetica", "normal");
  for (const seg of segments) {
    const text = clean(seg.text).trim();
    if (!text) continue;
    const midPx = (seg.top + seg.h / 2) * scaleRatio;
    const pageIdx = pages.findIndex((p) => midPx >= p.startPx && midPx < p.startPx + p.heightPx);
    if (pageIdx < 0) continue;
    const page = pages[pageIdx];
    pdf.setPage(pageIdx + 1);
    const sizePt = Math.max(4, seg.fontPx * scaleRatio * ptPerCanvasPx);
    pdf.setFontSize(sizePt);
    const x = seg.left * scaleRatio * ptPerCanvasPx;
    const y = ((seg.top + seg.h * 0.8) * scaleRatio - page.startPx) * ptPerCanvasPx;
    pdf.text(text + " ", x, y, { renderingMode: "invisible" });
  }
}
