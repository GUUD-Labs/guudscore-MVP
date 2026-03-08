import { toast } from 'sonner';

let cooldownUntil: number | null = null;
const COOLDOWN_SECONDS = 15;
let cooldownToastId: any = null;

/**
 * Attempts to resolve an IPFS image URL using a list of public gateways.
 * Returns the first working gateway URL (using HEAD request), or the original URL if none work.
 *
 * @param url The original IPFS url (ipfs://... or https://...)
 * @returns The first working gateway url as a string, or the original url if none work
 */
export async function getNftImageUrl(url?: string): Promise<string | null> {
  if (!url) return '';
  // If already a working HTTP(S) url and not IPFS, just return
  if (!url.startsWith('ipfs://') && !url.includes('/ipfs/')) {
    return url;
  }

  // Extract the IPFS hash
  let ipfsHash = '';
  if (url.startsWith('ipfs://')) {
    ipfsHash = url.replace('ipfs://', '');
  } else {
    // Try to extract hash from /ipfs/<hash>
    const match = url.match(/\/ipfs\/([^/?#]+)/);
    if (match && match[1]) {
      ipfsHash = match[1];
    }
  }
  if (!ipfsHash) return url;

  const gateways = [
    'https://dweb.link/ipfs/',
    'https://4everland.io/ipfs/',
    'https://cf-ipfs.com/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://gateway.originprotocol.com/ipfs/',
    'https://gateway.temporal.cloud/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://ipfs.eternum.io/ipfs/',
    'https://nftstorage.link/ipfs/',
    'https://storry.tv/ipfs/',
    'https://gateway.serph.network/ipfs/',
    'https://hardbin.com/ipfs/',
    'https://ipfs.jes.xxx/ipfs/',
    'https://gateway.blocksec.com/ipfs/',
    'https://ipfs.mrh.io/ipfs/',
    'https://gateway.fleek.co/ipfs/',
  ];

  for (const gateway of gateways) {
    const testUrl = `${gateway}${ipfsHash}`;
    try {
      const res = await fetch(testUrl, { method: 'HEAD' });
      if (res.ok) {
        return testUrl;
      }
    } catch (e) {
      // Ignore and try next
    }
  }
  return null;
}

export async function fetchWithRetryAndCooldown(
  url: string,
  options: RequestInit & { responseType?: 'blob' | 'json' | 'text' } = {},
  maxRetries = 3,
  retryDelay = 700
): Promise<Response | Blob | any> {
  if (cooldownUntil && Date.now() < cooldownUntil) {
    if (!cooldownToastId) {
      // Toast göster
    }
    throw new Error('In cooldown due to repeated 429/504 errors. Please wait.');
  }

  const { responseType, ...fetchOptions } = options;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, fetchOptions);

      // 429 veya 504 hataları için retry yap
      if (res.status === 429 || res.status === 504) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
          attempt++;
          lastError = new Error(`HTTP ${res.status}`);
          continue;
        } else {
          cooldownUntil = Date.now() + COOLDOWN_SECONDS * 1000;
          if (!cooldownToastId) {
            // Toast göster
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
      }

      // Başarılı istek, cooldown'ı kaldır
      if (cooldownUntil && Date.now() >= cooldownUntil) {
        cooldownUntil = null;
        if (cooldownToastId) {
          toast.dismiss(cooldownToastId);
          cooldownToastId = null;
        }
      }

      // Diğer HTTP hatalarını kontrol et
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      // ResponseType'a göre dönüş yap
      if (responseType === 'blob') {
        return await res.blob();
      } else if (responseType === 'json') {
        return await res.json();
      } else if (responseType === 'text') {
        return await res.text();
      }

      return res;
    } catch (err: any) {
      lastError = err;
      throw err;
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

export async function resizeImage(
  blob: Blob,
  maxWidth: number,
  maxHeight: number,
  mimeType = 'image/jpeg',
  quality = 0.8
): Promise<Blob> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      let scale = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resizedBlob => resolve(resizedBlob!), mimeType, quality);
    };
    img.onerror = () => resolve(blob);
    img.src = URL.createObjectURL(blob);
  });
}
