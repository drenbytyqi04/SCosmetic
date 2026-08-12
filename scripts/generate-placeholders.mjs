/**
 * Generates the placeholder imagery used by the storefront until real product
 * photography is supplied.
 *
 * Everything is drawn procedurally and encoded as PNG with Node's built-in zlib —
 * no image libraries, no network, no binary assets checked in by hand. Re-run with:
 *
 *   node scripts/generate-placeholders.mjs
 *
 * Replace the files in /public/images with real photography and delete this script.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public', 'images');

/* ------------------------------------------------------------------ *
 * PNG encoding
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Encodes raw RGB pixel data as a PNG buffer using per-scanline "Up" filtering. */
function encodePng(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const out = y * (stride + 1);
    raw[out] = 2; // filter: Up — smooth vertical gradients compress to near-zero
    for (let x = 0; x < stride; x++) {
      const cur = rgb[y * stride + x];
      const above = y === 0 ? 0 : rgb[(y - 1) * stride + x];
      raw[out + 1 + x] = (cur - above) & 0xff;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ *
 * Tiny drawing helpers (all values in 0..1 unless noted)
 * ------------------------------------------------------------------ */

const hex = (value) => {
  const n = parseInt(value.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
};
const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const smoothstep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
/** Signed distance to a rounded rectangle centred at (cx, cy). */
const sdRoundRect = (px, py, cx, cy, hw, hh, r) => {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.sqrt(ax * ax + ay * ay) - r;
};

/**
 * Renders one abstract "product still life": a graded backdrop, a soft key light
 * and an out-of-focus silhouette. Deliberately abstract so it never pretends to be
 * a real photograph of a real product.
 */
function render({ width, height, palette, variant = 0, light = { x: 0.34, y: 0.26 } }) {
  const [top, bottom, accent, cap] = palette.map(hex);
  const rgb = Buffer.alloc(width * height * 3);
  const aspect = height / width;

  // Silhouette geometry per variant, expressed relative to width.
  const forms = [
    { hw: 0.115, hh: 0.3, r: 0.05, cy: 0.58, capH: 0.075 }, // serum bottle
    { hw: 0.175, hh: 0.14, r: 0.06, cy: 0.62, capH: 0.045 }, // cream jar
    { hw: 0.062, hh: 0.28, r: 0.03, cy: 0.56, capH: 0.11 }, // slim tube
    { hw: 0.145, hh: 0.235, r: 0.11, cy: 0.6, capH: 0.06 }, // compact / flacon
  ];
  const form = forms[variant % forms.length];

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);

      // Backdrop: gradient on a gentle diagonal.
      let color = mix(top, bottom, clamp01(v * 0.86 + u * 0.14));

      // Key light — broad, soft, slightly warm.
      const lx = (u - light.x) / 0.62;
      const ly = (v - light.y) / (0.62 * aspect * 1.15);
      const glow = 1 - smoothstep(0, 1, Math.sqrt(lx * lx + ly * ly));
      color = mix(color, [255, 252, 247], glow * 0.4);

      // Contact shadow beneath the form.
      const sx = (u - 0.5) / 0.3;
      const sy = (v - (form.cy + form.hh * aspect * 0.98)) / 0.045;
      const shadow = 1 - smoothstep(0, 1, Math.sqrt(sx * sx + sy * sy));
      color = mix(color, mix(bottom, [70, 55, 44], 0.55), shadow * 0.3);

      // The silhouette itself, with a vertical sheen so it reads as glass.
      const d = sdRoundRect(u, v / aspect, 0.5, form.cy / aspect, form.hw, form.hh, form.r);
      const inside = 1 - smoothstep(-0.004, 0.004, d);
      if (inside > 0) {
        const across = clamp01((u - (0.5 - form.hw)) / (form.hw * 2));
        const sheen = Math.pow(Math.sin(across * Math.PI), 1.6);
        let body = mix(mix(accent, [30, 22, 16], 0.12), mix(accent, [255, 255, 255], 0.55), sheen);
        // Cap / collar at the top of the form.
        const capTop = form.cy / aspect - form.hh;
        const inCap = 1 - smoothstep(capTop + form.capH - 0.006, capTop + form.capH + 0.006, v / aspect);
        body = mix(body, mix(cap, [255, 255, 255], sheen * 0.32), inCap);
        color = mix(color, body, inside * 0.95);
      }

      // Edge vignette keeps the crop feeling photographed rather than flat.
      const vig = smoothstep(0.55, 1.25, Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2) * 1.7);
      color = mix(color, mix(bottom, [90, 74, 60], 0.35), vig * 0.16);

      const o = (y * width + x) * 3;
      rgb[o] = Math.round(clamp01(color[0] / 255) * 255);
      rgb[o + 1] = Math.round(clamp01(color[1] / 255) * 255);
      rgb[o + 2] = Math.round(clamp01(color[2] / 255) * 255);
    }
  }

  return encodePng(width, height, rgb);
}

/**
 * Editorial still life: a graded backdrop plus a small group of abstract forms.
 *
 * The hero and section banners need a subject — a bare gradient reads as a missing
 * image rather than as photography. Each form is a rounded rect with its own contact
 * shadow and vertical sheen, arranged as a loose group.
 */
function renderStill({ width, height, palette, forms, light = { x: 0.66, y: 0.26 }, horizon = 0.78 }) {
  const [top, bottom, accent, cap] = palette.map(hex);
  const rgb = Buffer.alloc(width * height * 3);
  const aspect = height / width;

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);

      // Backdrop, plus a soft surface plane so the forms have something to stand on.
      let color = mix(top, bottom, clamp01(v * 0.72 + u * 0.28));
      const plane = smoothstep(horizon - 0.05, horizon + 0.16, v);
      color = mix(color, mix(bottom, [120, 98, 78], 0.22), plane * 0.3);

      // Key light.
      const lx = (u - light.x) / 0.58;
      const ly = (v - light.y) / (0.58 * aspect * 1.3);
      const glow = 1 - smoothstep(0, 1, Math.sqrt(lx * lx + ly * ly));
      color = mix(color, [255, 252, 246], glow * 0.5);

      // Forms, painted back to front.
      for (const form of forms) {
        const cy = form.cy ?? horizon;
        const halfH = form.h / 2;
        const centreY = cy - halfH * aspect;

        // Contact shadow, cast toward the light's opposite side.
        const sx = (u - (form.cx + (form.cx < light.x ? 0.02 : -0.02))) / (form.w * 1.5);
        const sy = (v - cy) / 0.028;
        const shadow = 1 - smoothstep(0, 1, Math.sqrt(sx * sx + sy * sy));
        color = mix(color, mix(bottom, [66, 50, 38], 0.6), shadow * 0.34);

        const d = sdRoundRect(
          u,
          v / aspect,
          form.cx,
          centreY / aspect,
          form.w / 2,
          halfH,
          form.r ?? Math.min(form.w / 2, halfH) * 0.4,
        );
        const inside = 1 - smoothstep(-0.0035, 0.0035, d);
        if (inside <= 0) continue;

        const across = clamp01((u - (form.cx - form.w / 2)) / form.w);
        const sheen = Math.pow(Math.sin(across * Math.PI), 1.5);
        const tone = form.tone ?? 0;
        const base = mix(accent, tone > 0 ? [255, 255, 255] : [40, 30, 22], Math.abs(tone));
        let body = mix(mix(base, [30, 22, 16], 0.1), mix(base, [255, 255, 255], 0.6), sheen);

        // Cap band.
        const capTop = centreY / aspect - halfH;
        const capH = form.cap ?? 0;
        if (capH > 0) {
          const inCap = 1 - smoothstep(capTop + capH - 0.005, capTop + capH + 0.005, v / aspect);
          body = mix(body, mix(cap, [255, 255, 255], sheen * 0.3), inCap);
        }

        color = mix(color, body, inside * 0.96);
      }

      // Edge vignette.
      const vig = smoothstep(0.58, 1.28, Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2) * 1.65);
      color = mix(color, mix(bottom, [84, 68, 54], 0.34), vig * 0.15);

      const o = (y * width + x) * 3;
      rgb[o] = Math.round(clamp01(color[0] / 255) * 255);
      rgb[o + 1] = Math.round(clamp01(color[1] / 255) * 255);
      rgb[o + 2] = Math.round(clamp01(color[2] / 255) * 255);
    }
  }

  return encodePng(width, height, rgb);
}

/** Plain graded backdrop, used for category banners that sit behind text. */
function renderScene({ width, height, palette, light = { x: 0.68, y: 0.3 } }) {
  const [top, bottom] = palette.map(hex);
  const rgb = Buffer.alloc(width * height * 3);
  const aspect = height / width;

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      let color = mix(top, bottom, clamp01(v * 0.5 + u * 0.5));

      const lx = (u - light.x) / 0.5;
      const ly = (v - light.y) / (0.5 * aspect * 1.4);
      const glow = 1 - smoothstep(0, 1, Math.sqrt(lx * lx + ly * ly));
      color = mix(color, [255, 251, 244], glow * 0.55);

      const band = 1 - smoothstep(0.0, 0.32, Math.abs(v - 0.72 - (u - 0.5) * 0.06));
      color = mix(color, mix(bottom, [120, 96, 74], 0.28), band * 0.14);

      const vig = smoothstep(0.6, 1.3, Math.sqrt((u - 0.5) ** 2 + (v - 0.5) ** 2) * 1.6);
      color = mix(color, mix(bottom, [80, 66, 54], 0.4), vig * 0.18);

      const o = (y * width + x) * 3;
      rgb[o] = Math.round(clamp01(color[0] / 255) * 255);
      rgb[o + 1] = Math.round(clamp01(color[1] / 255) * 255);
      rgb[o + 2] = Math.round(clamp01(color[2] / 255) * 255);
    }
  }

  return encodePng(width, height, rgb);
}

/* ------------------------------------------------------------------ *
 * Asset manifest
 * ------------------------------------------------------------------ */

/** Category tone ramps: [backdrop top, backdrop bottom, form, cap]. */
const TONES = {
  skincare: ['#F6F0E9', '#E5D8C9', '#CBB49A', '#8A6F55'],
  lips: ['#F8ECE8', '#EBD2CC', '#C98B84', '#6B4038'],
  eyes: ['#F1ECE6', '#DBD2C7', '#95856F', '#3A3128'],
  complexion: ['#F9F3EA', '#EADDCB', '#D3B892', '#7A5F42'],
  fragrance: ['#F4F0EA', '#E2D9CA', '#D8C39A', '#2E2A25'],
  tools: ['#F6F2ED', '#E4DDD3', '#B9A48C', '#4A3F36'],
  body: ['#F2F1ED', '#DDDBD2', '#B7B2A4', '#5A544A'],
};

// Product slugs paired with their tone ramp and silhouette variant.
const PRODUCTS = [
  ['velvet-rose-lip-oil', 'lips', 2],
  ['nude-silk-matte-lipstick', 'lips', 2],
  ['glass-gloss-plumping-balm', 'lips', 0],
  ['champagne-glow-liquid-highlighter', 'complexion', 0],
  ['second-skin-serum-foundation', 'complexion', 0],
  ['soft-focus-blurring-primer', 'complexion', 0],
  ['cashmere-cheek-cream-blush', 'complexion', 3],
  ['luminous-veil-setting-powder', 'complexion', 3],
  ['ceramide-barrier-repair-cream', 'skincare', 1],
  ['hyaluronic-dew-hydrating-serum', 'skincare', 0],
  ['gentle-milk-cleansing-emulsion', 'skincare', 0],
  ['overnight-retinal-renewal-oil', 'skincare', 0],
  ['vitamin-c-brightening-ampoule', 'skincare', 0],
  ['rose-quartz-hydrating-mist', 'skincare', 0],
  ['mineral-veil-spf50-fluid', 'skincare', 0],
  ['sculpt-define-brow-pencil', 'eyes', 2],
  ['midnight-volume-mascara', 'eyes', 2],
  ['bare-essentials-eyeshadow-quad', 'eyes', 3],
  ['precision-liquid-eyeliner', 'eyes', 2],
  ['amber-cashmere-eau-de-parfum', 'fragrance', 0],
  ['white-fig-neroli-eau-de-parfum', 'fragrance', 0],
  ['sculpting-foundation-brush', 'tools', 2],
  ['dual-fibre-blush-brush', 'tools', 2],
  ['rose-quartz-gua-sha', 'tools', 3],
  ['silk-touch-body-lotion', 'body', 0],
  ['nourishing-hair-elixir', 'body', 0],
];

const CATEGORY_BANNERS = [
  ['lips', 'lips'],
  ['complexion', 'complexion'],
  ['skincare', 'skincare'],
  ['eyes', 'eyes'],
  ['fragrance', 'fragrance'],
  ['tools', 'tools'],
  ['body', 'body'],
];

function run() {
  mkdirSync(join(PUBLIC, 'products'), { recursive: true });
  mkdirSync(join(PUBLIC, 'categories'), { recursive: true });
  mkdirSync(join(PUBLIC, 'editorial'), { recursive: true });

  let count = 0;

  for (const [slug, tone, variant] of PRODUCTS) {
    const palette = TONES[tone];
    const shots = [
      { suffix: '1', light: { x: 0.32, y: 0.24 }, variant },
      { suffix: '2', light: { x: 0.7, y: 0.32 }, variant: (variant + 1) % 4 },
    ];
    for (const shot of shots) {
      const png = render({
        width: 900,
        height: 1125,
        palette,
        variant: shot.variant,
        light: shot.light,
      });
      writeFileSync(join(PUBLIC, 'products', `${slug}-${shot.suffix}.png`), png);
      count++;
    }
  }

  for (const [name, tone] of CATEGORY_BANNERS) {
    writeFileSync(
      join(PUBLIC, 'categories', `${name}.png`),
      renderScene({ width: 1000, height: 1250, palette: TONES[tone] }),
    );
    count++;
  }

  /*
   * Editorial banners. `forms` are laid out in normalised coordinates: `cx` is the
   * horizontal centre, `w`/`h` the size as a fraction of width, `cy` the baseline the
   * form stands on, and `tone` shifts the fill lighter (+) or darker (−) so the group
   * reads as separate objects rather than one silhouette.
   */
  const editorial = [
    {
      name: 'hero',
      width: 1800,
      height: 1200,
      palette: TONES.complexion,
      light: { x: 0.74, y: 0.22 },
      horizon: 0.72,
      forms: [
        { cx: 0.29, w: 0.115, h: 0.46, cap: 0.06, tone: -0.15 },
        { cx: 0.44, w: 0.185, h: 0.26, r: 0.05, cap: 0.035, tone: 0.22 },
        { cx: 0.6, w: 0.065, h: 0.38, r: 0.026, cap: 0.12, tone: -0.3 },
        { cx: 0.73, w: 0.15, h: 0.17, r: 0.065, cap: 0.03, tone: 0.1 },
      ],
    },
    {
      name: 'hero-mobile',
      width: 900,
      height: 1200,
      palette: TONES.complexion,
      light: { x: 0.62, y: 0.18 },
      horizon: 0.66,
      forms: [
        { cx: 0.33, w: 0.26, h: 0.5, r: 0.1, cap: 0.1, tone: -0.15 },
        { cx: 0.64, w: 0.14, h: 0.38, r: 0.055, cap: 0.24, tone: -0.3 },
        { cx: 0.5, w: 0.34, h: 0.16, r: 0.07, cy: 0.88, cap: 0, tone: 0.24 },
      ],
    },
    {
      name: 'ritual',
      width: 1400,
      height: 1050,
      palette: TONES.skincare,
      light: { x: 0.28, y: 0.24 },
      horizon: 0.74,
      forms: [
        { cx: 0.38, w: 0.145, h: 0.46, cap: 0.065, tone: 0.12 },
        { cx: 0.57, w: 0.22, h: 0.26, r: 0.065, cap: 0.04, tone: -0.2 },
      ],
    },
    {
      name: 'atelier',
      width: 1400,
      height: 1050,
      palette: TONES.fragrance,
      light: { x: 0.72, y: 0.26 },
      horizon: 0.75,
      forms: [
        { cx: 0.39, w: 0.21, h: 0.4, r: 0.055, cap: 0.08, tone: 0.18 },
        { cx: 0.61, w: 0.165, h: 0.3, r: 0.045, cap: 0.07, tone: -0.25 },
      ],
    },
    {
      name: 'journal',
      width: 1200,
      height: 900,
      palette: TONES.lips,
      light: { x: 0.36, y: 0.26 },
      horizon: 0.75,
      forms: [
        { cx: 0.41, w: 0.08, h: 0.42, r: 0.032, cap: 0.13, tone: -0.1 },
        { cx: 0.57, w: 0.19, h: 0.18, r: 0.075, cap: 0.035, tone: 0.2 },
      ],
    },
    {
      name: 'og',
      width: 1200,
      height: 630,
      palette: TONES.complexion,
      light: { x: 0.7, y: 0.24 },
      horizon: 0.74,
      forms: [
        { cx: 0.33, w: 0.1, h: 0.4, cap: 0.05, tone: -0.15 },
        { cx: 0.48, w: 0.155, h: 0.23, r: 0.045, cap: 0.03, tone: 0.2 },
        { cx: 0.62, w: 0.056, h: 0.32, r: 0.022, cap: 0.1, tone: -0.3 },
      ],
    },
  ];
  for (const scene of editorial) {
    writeFileSync(join(PUBLIC, 'editorial', `${scene.name}.png`), renderStill(scene));
    count++;
  }

  // Instagram grid tiles reuse the product renderer at a square crop.
  mkdirSync(join(PUBLIC, 'instagram'), { recursive: true });
  const gramTones = ['lips', 'complexion', 'skincare', 'fragrance', 'eyes', 'tools'];
  gramTones.forEach((tone, i) => {
    writeFileSync(
      join(PUBLIC, 'instagram', `post-${i + 1}.png`),
      render({
        width: 700,
        height: 700,
        palette: TONES[tone],
        variant: i % 4,
        light: { x: i % 2 ? 0.66 : 0.32, y: 0.28 },
      }),
    );
    count++;
  });

  process.stdout.write(`Generated ${count} placeholder images in public/images\n`);
}

run();
