export const config = {
  runtime: 'edge',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const REF_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    let ref = url.searchParams.get('ref');

    // Sanitize ref parameter
    if (ref && !REF_PATTERN.test(ref)) {
      ref = null;
    }

    // Fetch the original index.html from the deployment
    const htmlResponse = await fetch(new URL('/index.html', url.origin));
    let html = await htmlResponse.text();

    // Check if this is a referral link
    if (ref) {
      // For referral links, ensure default GUUD logo is shown
      const defaultLogoUrl = 'https://app.guud.fun/preview.png';
      
      // Replace OG and Twitter meta tags with default logo
      html = html.replace(
        /<meta property="og:image" content="[^"]*" \/>/g,
        `<meta property="og:image" content="${defaultLogoUrl}" />`
      );
      
      html = html.replace(
        /<meta name="twitter:image" content="[^"]*"[^>]*\/>/g,
        `<meta name="twitter:image" content="${defaultLogoUrl}" />`
      );

      // Update title and description for referral links
      html = html.replace(
        /<meta property="og:title" content="[^"]*" \/>/g,
        `<meta property="og:title" content="Join GUUD - Reputation System for Web3" />`
      );
      
      html = html.replace(
        /<meta property="og:description" content="[^"]*" \/>/g,
        `<meta property="og:description" content="Discover your on-chain reputation score. Join using ${escapeHtml(ref)}'s referral link!" />`
      );

      html = html.replace(
        /<meta name="twitter:title" content="[^"]*" \/>/g,
        `<meta name="twitter:title" content="Join GUUD - Reputation System for Web3" />`
      );
      
      html = html.replace(
        /<meta name="twitter:description" content="[^"]*" \/>/g,
        `<meta name="twitter:description" content="Discover your on-chain reputation score. Join using ${escapeHtml(ref)}'s referral link!" />`
      );
    }

    // Return modified HTML with proper headers
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving HTML:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
