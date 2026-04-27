import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const BG_DEEP = '#040C06';
const HEIRLOOM = '#F7F1EE';
const POD = '#91A63B';
const MAZORCA = '#F1A91E';

const GRAIN_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.6"/></svg>`
  );

let cachedFonts: { barlow: ArrayBuffer; cormorant: ArrayBuffer; dmsans: ArrayBuffer } | null = null;

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const [barlow, cormorant, dmsans] = await Promise.all([
    fetch(new URL('./og-fonts/barlow-condensed-900.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('./og-fonts/cormorant-garamond-italic-variable.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('./og-fonts/dm-sans-variable.ttf', import.meta.url)).then((r) => r.arrayBuffer()),
  ]);
  cachedFonts = { barlow, cormorant, dmsans };
  return cachedFonts;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const titleA = url.searchParams.get('a') ?? 'CACAO';
  const titleB = url.searchParams.get('b') ?? 'FRUTA';
  const titleC = url.searchParams.get('c') ?? 'BRUTAL';
  const eyebrow = url.searchParams.get('eyebrow') ?? 'CAUA · BIOTECNOLOGÍA DEL CACAO COLOMBIANO';
  const tagline = url.searchParams.get('tagline') ?? 'Del genoma colombiano al mundo. Fruta. Brutal.';
  const footerLeft = url.searchParams.get('url') ?? 'cacaofrutabrutal.com';
  const footerRight = url.searchParams.get('right') ?? 'FINE-FLAVOR · WHOLE FOODS 2026';

  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 64px',
          background: BG_DEEP,
          color: HEIRLOOM,
          fontFamily: 'DM Sans',
          position: 'relative',
        }}
      >
        {/* Radial color glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            backgroundImage:
              'radial-gradient(ellipse 720px 520px at 82% 28%, rgba(145,166,59,0.10), transparent 62%), radial-gradient(ellipse 540px 360px at 12% 88%, rgba(241,169,30,0.05), transparent 70%)',
            display: 'flex',
          }}
        />
        {/* Grain noise overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '630px',
            backgroundImage: `url("${GRAIN_SVG}")`,
            backgroundSize: '240px 240px',
            opacity: 0.06,
            display: 'flex',
          }}
        />

        {/* Eyebrow row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2 }}>
          <div style={{ width: 4, height: 22, background: MAZORCA, display: 'flex' }} />
          <div
            style={{
              fontFamily: 'DM Sans',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: MAZORCA,
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* Corner mark */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 64,
            fontFamily: 'DM Sans',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(247,241,238,0.4)',
            display: 'flex',
            zIndex: 2,
          }}
        >
          EST · 2024 · HUILA · COLOMBIA
        </div>

        {/* Hero block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 2,
            marginTop: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'Barlow Condensed',
              fontWeight: 900,
              fontSize: 152,
              lineHeight: 0.86,
              letterSpacing: '-0.025em',
              textTransform: 'uppercase',
              color: HEIRLOOM,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex' }}>{titleA}</div>
            <div style={{ display: 'flex', color: POD }}>{titleB}</div>
            <div style={{ display: 'flex' }}>{titleC}</div>
          </div>
          <div style={{ width: 88, height: 3, background: POD, marginTop: 28, display: 'flex' }} />
          <div
            style={{
              fontFamily: 'Cormorant Garamond',
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 30,
              lineHeight: 1.25,
              color: 'rgba(247,241,238,0.92)',
              maxWidth: 820,
              marginTop: 22,
              display: 'flex',
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 3, height: 18, background: MAZORCA, display: 'flex' }} />
            <div
              style={{
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: HEIRLOOM,
              }}
            >
              {footerLeft}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 3, height: 18, background: MAZORCA, display: 'flex' }} />
            <div
              style={{
                fontFamily: 'DM Sans',
                fontWeight: 500,
                fontSize: 13,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: MAZORCA,
              }}
            >
              {footerRight}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Barlow Condensed', data: fonts.barlow, weight: 900, style: 'normal' },
        { name: 'Cormorant Garamond', data: fonts.cormorant, weight: 500, style: 'italic' },
        { name: 'DM Sans', data: fonts.dmsans, weight: 700, style: 'normal' },
      ],
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  );
}
