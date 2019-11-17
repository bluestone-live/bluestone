export const getTermObjectByValue = (value: string) => ({
  text: `${value}-Day`,
  value: Number.parseInt(value, 10),
});
