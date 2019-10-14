export const isAllEqual = (...args: number[]) =>
  args.some(value => value !== args[0]);
