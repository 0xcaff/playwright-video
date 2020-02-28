# playwright-video

🎬 Capture a video of a [Playwright](https://github.com/microsoft/playwright) page (Chromium only for now)

When Playwright adds support for the Screencast API in Firefox and WebKit, this will be updated to support these browsers.

## Install

```sh
npm i playwright playwright-video ffmpeg-static
```

If you already have [FFmpeg](https://www.ffmpeg.org) installed, you can skip the `ffmpeg-static` installation by setting the `FFMPEG_PATH` environment variable.

```sh
npm i playwright playwright-video
```

## Use

```js
import { chromium } from 'playwright';
import { VideoCapture } from 'playwright-video';

(async (): Promise<void> => {
  const iPhone = devices['iPhone 6'];

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: iPhone.viewport,
    userAgent: iPhone.userAgent,
  });

  const page = await context.newPage();

  await VideoCapture.start({
    browser,
    page,
    savePath: '/tmp/video.mp4',
  });

  await page.goto('http://example.org');

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    page.click('a'),
  ]);

  await browser.close();
})();
```

The video will be saved at the specified `savePath` (`/tmp/video.mp4` in the above example).