export const getEnumValidKeys = (enumValues: object) =>
  Object.keys(enumValues).filter(k => /\d+/.test(k));
