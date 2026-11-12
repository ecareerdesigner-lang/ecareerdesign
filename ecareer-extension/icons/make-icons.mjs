// Draws the three toolbar icons (blue rounded square, white check, orange underline) with no dependencies.
import zlib from "node:zlib";
import fs from "node:fs";
const SS = 4;
const distSeg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};
function pixel(x, y) { // x,y in 0..1
  const r = 0.22, cx = Math.abs(x - 0.5) - (0.5 - r), cy = Math.abs(y - 0.5) - (0.5 - r);
  const inside = Math.hypot(Math.max(cx, 0), Math.max(cy, 0)) + Math.min(Math.max(cx, cy), 0) <= r;
  if (!inside) return [0, 0, 0, 0];
  const w = 0.055;
  if (Math.min(distSeg(x, y, 0.27, 0.50, 0.43, 0.66), distSeg(x, y, 0.43, 0.66, 0.74, 0.32)) <= w) return [255, 255, 255, 255];
  if (distSeg(x, y, 0.30, 0.82, 0.70, 0.82) <= 0.035) return [242, 122, 26, 255];
  return [30, 90, 200, 255];
}
function png(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let a = 0, rr = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const [r, gg, bb, aa] = pixel((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size);
        rr += r * aa; g += gg * aa; b += bb * aa; a += aa;
      }
      const o = py * (size * 4 + 1) + 1 + px * 4, n = SS * SS;
      raw[o] = a ? Math.round(rr / a) : 0; raw[o + 1] = a ? Math.round(g / a) : 0; raw[o + 2] = a ? Math.round(b / a) : 0; raw[o + 3] = Math.round(a / n);
    }
  }
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const dir = new URL(".", import.meta.url).pathname;
for (const s of [16, 48, 128]) fs.writeFileSync(`${dir}icon${s}.png`, png(s));
console.log("icons written");
