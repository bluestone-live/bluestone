export const getRandomId = (length: number) =>
  Math.random()
    .toString()
    .replace(/^0\./, '')
    .substring(0, length);
