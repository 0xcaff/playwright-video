import { Page } from './utils';
import { PageVideoCapture } from './PageVideoCapture';

export const saveVideo = (
  page: Page,
  savePath: string,
): Promise<PageVideoCapture> => {
  return PageVideoCapture.start({ page, savePath });
};
