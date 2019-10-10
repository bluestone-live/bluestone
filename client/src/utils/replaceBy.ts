/**
 * Replace a property or element by a new one
 *  When target is an Object, returns a new Object with the same behavior as Object.assign({}, target, element)
 *  When target is an Array, returns a new array where the data specifying key is overridden by the value corresponding to element
 * @param key: Only needed if the target is an array
 */
export const replaceBy = (target: any[] | any, element: any, key?: string) => {
  if (target instanceof Array && key) {
    return target.map(el =>
      el[key] === element[key]
        ? {
            ...el,
            ...element,
          }
        : el,
    );
  }
  return {
    ...target,
    ...element,
  };
};
