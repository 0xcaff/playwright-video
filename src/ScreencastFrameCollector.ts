import Debug from 'debug';
import { EventEmitter } from 'events';
import { CDPSession, ChromiumBrowserContext, Page } from 'playwright-core';
import { ensurePageType } from './utils';

const debug = Debug('playwright-video:ScreencastFrameCollector');

export class ScreencastFrameCollector extends EventEmitter {
  public static async create(page: Page): Promise<ScreencastFrameCollector> {
    const client = await ScreencastFrameCollector.cdpSessionForPage(page);
    const collector = new ScreencastFrameCollector(client);
    collector._listenForFrames();

    return collector;
  }

  private static async cdpSessionForPage(page: Page): Promise<CDPSession> {
    ensurePageType(page);
    const context = page.context() as ChromiumBrowserContext;
    return await context.newCDPSession(page);
  }

  // public for tests
  public _client: CDPSession;
  private _stopped = false;

  protected constructor(client: CDPSession) {
    super();
    this._client = client;
  }

  private _listenForFrames(): void {
    this._client.on('Page.screencastFrame', async (payload) => {
      debug(`received frame with timestamp ${payload.metadata.timestamp}`);

      const ackPromise = this._client.send('Page.screencastFrameAck', {
        sessionId: payload.sessionId,
      });

      if (!payload.metadata.timestamp) {
        debug('skip frame without timestamp');
        return;
      }

      this.emit('screencastframe', {
        data: Buffer.from(payload.data, 'base64'),
        received: Date.now(),
        timestamp: payload.metadata.timestamp,
      });

      try {
        // capture error so it does not propagate to the user
        // most likely it is due to the page closing
        await ackPromise;
      } catch (e) {
        debug('error sending screencastFrameAck %j', e.message);
      }
    });
  }

  public async start(): Promise<void> {
    debug('start');

    await this._client.send('Page.startScreencast', {
      everyNthFrame: 1,
    });
  }

  public async stop(): Promise<void> {
    if (this._stopped) return;

    debug('stopping');
    this._stopped = true;

    // Screencast API takes time to send frames
    // Wait 1s for frames to arrive
    // TODO figure out a better pattern for this
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      debug('detaching client');
      await this._client.detach();
    } catch (e) {
      debug('error detaching client', e.message);
    }

    debug('stopped');
  }
}
