import { site } from '@/lib/config';

/**
 * Polite HTTP for price collection: one request at a time, at least `delayMs` between requests (default 2 s),
 * a User-Agent that says who we are and where to reach us, up to 2 retries with back-off.
 */
export const USER_AGENT = `LekstePriceBot/1.0 (+${site.url}; ${process.env.PRICE_BOT_CONTACT ?? 'weekly price check'})`;

export class PoliteFetcher {
  private last = 0;
  constructor(private readonly delayMs = 2000) {}

  private async wait() {
    const left = this.last + this.delayMs - Date.now();
    if (left > 0) await new Promise((r) => setTimeout(r, left));
    this.last = Date.now();
  }

  /** Returns the body, or null for 404/410 (the product is gone). Throws on other failures after retries. */
  async text(url: string): Promise<string | null> {
    for (let attempt = 0; ; attempt++) {
      await this.wait();
      try {
        const res = await fetch(url, {
          headers: { 'user-agent': USER_AGENT, 'accept-language': 'lt' },
          redirect: 'follow',
        });
        if (res.status === 404 || res.status === 410) return null;
        if (res.ok) return await res.text();
        if (attempt >= 2 || (res.status < 500 && res.status !== 429)) throw new Error(`HTTP ${res.status}`);
      } catch (e) {
        if (attempt >= 2) throw e;
      }
      await new Promise((r) => setTimeout(r, this.delayMs * 2 ** (attempt + 1)));
    }
  }
}
