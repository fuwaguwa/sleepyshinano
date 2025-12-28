/**
 * Pick a random item from an array
 */
export function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Check if a link is a direct image/GIF link
 */
export function isImageAndGif(url: string) {
  return url.match(/^http[^?]*.(jpg|jpeg|png|gif)(\?(.*))?$/gim) != null;
}
