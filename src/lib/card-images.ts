import variants from '../data/card-image-variants.json';

const catalog: Record<string, { src: string; width: number }[]> = variants;
/** Unlisted editorial selections retain the original image as a safe fallback. */
export function cardSrcset(src: string): string | undefined {
  return catalog[src]?.map(image => `${image.src} ${image.width}w`).join(', ');
}

export const heroCardSizes = '(max-width: 405px) 74vw, (max-width: 1050px) 300px, (max-width: 1440px) 25vw, 360px';
export const workCardSizes = '(max-width: 760px) calc(86vw - 48px), (max-width: 1000px) calc(50vw - 60px), (max-width: 1488px) 30vw, 440px';
