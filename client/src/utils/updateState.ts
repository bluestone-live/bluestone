export const updateState = <T, U>(key: string, value: T) => (
  prevState: U,
): U => ({
  ...prevState,
  [key]: value,
});
