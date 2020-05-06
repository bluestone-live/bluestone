export const formatSolidityTime = (originalTime: string) =>
  Number.parseInt(originalTime, 10) * 1000;

export const getTimezone = () => {
  const zone = -(new Date().getTimezoneOffset() / 60);
  return zone > 0 ? `GMT +${zone}` : `GMT ${zone}`;
};
