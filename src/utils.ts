import { setFfmpegPath as setFluentFfmpegPath } from 'fluent-ffmpeg';
import { ChromiumBrowserContext, Page as PlaywrightPage } from 'playwright-core';
import { Protocol } from 'playwright-core/types/protocol';
import { Page as PuppeteerPage } from 'puppeteer';

export const getFfmpegFromModule = (): string | null => {
  try {
    const ffmpegPath = require('ffmpeg-static'); // eslint-disable-line @typescript-eslint/no-var-requires
    if (ffmpegPath) return ffmpegPath;
  } catch (e) {} // eslint-disable-line no-empty

  return null;
};

export const getFfmpegPath = (): string | null => {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  return getFfmpegFromModule();
};

export const ensureFfmpegPath = (): void => {
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) {
    throw new Error(
      'playwright-video: FFmpeg path not set. Set the FFMPEG_PATH env variable or install ffmpeg-static as a dependency.',
    );
  }

  setFluentFfmpegPath(ffmpegPath);
};

export type Page = PuppeteerPage | PlaywrightPage;


function isPuppeteerPage(page: Page): page is PuppeteerPage {
  return 'target' in page;
}

function isPlawrightPage(page: Page): page is PlaywrightPage {
  return 'context' in page;
}

async function cdpSessionForPuppeteerPage(page: PuppeteerPage): Promise<CDPSession> {
  return await page.target().createCDPSession();
}

function ensurePageType(page: PlaywrightPage): void {
  const context = page.context();

  if (!(context as ChromiumBrowserContext).newCDPSession) {
    throw new Error('playwright-video: page context must be chromium');
  }
};

async function cdpSessionForPlaywrightPage(page: PlaywrightPage): Promise<CDPSession> {
    ensurePageType(page);
    const context = page.context() as ChromiumBrowserContext;
    return await context.newCDPSession(page);
}

export interface CDPSession {
  detach(): Promise<void>;
  send(method: string, params?: object): Promise<object>;
  on<T extends keyof CDPEvents>(event: T, listener: (payload: CDPEvents[T]) => void): void;
}

interface CDPEvents {
  'Page.screencastFrame': Protocol.Page.screencastFramePayload;
}

export async function cdpSessionForPage(page: Page): Promise<CDPSession> {
  if (isPlawrightPage(page)) {
    return await cdpSessionForPlaywrightPage(page);
  } else if (isPuppeteerPage(page)) {
    return await cdpSessionForPuppeteerPage(page);
  } else {
    throw new Error('playwright-video: invalid page');
  }
}
