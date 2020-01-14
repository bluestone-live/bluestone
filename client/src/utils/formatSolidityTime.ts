export const formatSolidityTime = (originalTime: string) =>
  Number.parseInt(originalTime, 10) * 1000;
