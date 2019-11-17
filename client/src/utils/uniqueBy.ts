/**
 * Unique array by given key
 * @param targetArray Target array
 * @param key unique key
 */
export const uniqueBy = (targetArray: any[], key: string) =>
  targetArray.filter(
    (el, index, self) =>
      self.findIndex(selfEl => selfEl[key] === el[key]) === index,
  );
