import { pathExists } from 'fs-extra';
import { tmpdir } from 'os';
import { join } from 'path';
import { chromium, ChromiumBrowser } from 'playwright';
import { saveVideo } from '../src/saveVideo';
import * as puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';

function savePathForTest(): string {
  return join(tmpdir(), `${Date.now()}.mp4`);
}

describe('saveVideo playwright', () => {
  let browser: ChromiumBrowser;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(() => browser.close());

  it('captures a video of the page', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();

    const savePath = savePathForTest();
    const capture = await saveVideo(page, savePath);
    await page.setContent('<html>hello world</html>');
    await capture.stop();

    const videoPathExists = await pathExists(savePath);
    expect(videoPathExists).toBe(true);

    await page.close();
  });
});

describe('saveVideo puppeteer', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch();
  })

  afterAll(() => browser.close());

  it('captures a video of the page', async () => {
    const page = await browser.newPage();

    const savePath = savePathForTest();
    const capture = await saveVideo(page, savePath);
    await page.setContent('<html>hello world</html>');
    await capture.stop();

    const videoPathExists = await pathExists(savePath);
    expect(videoPathExists).toBe(true);

    await page.close();
  });
});
