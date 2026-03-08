/**
 * Convert IPFS URL to alternative gateway URL to avoid rate limits and CORS
 * Using dweb.link which is reliable and has proper CORS headers
 */
export function getProxiedImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Extract IPFS hash from any IPFS URL format
  let ipfsHash: string | null = null;

  // Check for ipfs.guudfun.space (dedicated gateway) - extract full path after /ipfs/
  if (url.includes('ipfs.guudfun.space/ipfs/')) {
    const match = url.match(/\/ipfs\/([^?]+)/);
    ipfsHash = match ? match[1] : null;
  }
  // Check for gateway.pinata.cloud
  else if (url.includes('gateway.pinata.cloud/ipfs/')) {
    const match = url.match(/\/ipfs\/([^?]+)/);
    ipfsHash = match ? match[1] : null;
  }
  // Check for ipfs:// protocol
  else if (url.startsWith('ipfs://')) {
    ipfsHash = url.replace('ipfs://', '').split('?')[0];
  }
  // Check for any other IPFS gateway
  else if (url.includes('/ipfs/')) {
    const match = url.match(/\/ipfs\/([^?]+)/);
    ipfsHash = match ? match[1] : null;
  }

  // If we found an IPFS hash, use dweb.link (Protocol Labs' gateway with CORS)
  if (ipfsHash) {
    return `https://dweb.link/ipfs/${ipfsHash}`;
  }

  // Use CORS proxy for CoinGecko domains
  if (url.includes('coingecko.com')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  // Use CORS proxy for OpenSea/Seadn.io domains (all variants)
  if (url.includes('seadn.io')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  // Use CORS proxy for Base.org basenames (CORS not enabled on their API)
  if (url.includes('base.org')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  // Use CORS proxy for Twitter/X profile images
  if (url.includes('pbs.twimg.com') || url.includes('abs.twimg.com')) {
    let twitterUrl = url;
    // Replace _normal with _bigger for better quality (more reliable than _400x400)
    if (twitterUrl.includes('_normal.')) {
      twitterUrl = twitterUrl.replace('_normal.', '_bigger.');
    }
    // Use wsrv.nl which is more reliable cross-platform than images.weserv.nl
    return `https://wsrv.nl/?url=${encodeURIComponent(twitterUrl)}&default=1`;
  }

  // Use CORS proxy for GeckoTerminal images
  if (url.includes('geckoterminal.com') || url.includes('assets.geckoterminal.com')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }

  // Return as-is for other URLs
  return url;
}

/**
 * Get photo URL from user photo object
 */
export function getUserPhotoUrl(photo: { url?: string } | string | undefined | null): string | null {
  if (!photo) return null;

  if (typeof photo === 'string') {
    return getProxiedImageUrl(photo);
  }

  if (typeof photo === 'object' && photo.url) {
    return getProxiedImageUrl(photo.url);
  }

  return null;
}
