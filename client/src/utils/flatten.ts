const flatten = (array: any[], childrenKey: string): any[] =>
  array.reduce(
    (prev, curr) =>
      curr[childrenKey] && curr[childrenKey].length
        ? [...prev, curr, ...flatten(curr[childrenKey], childrenKey)]
        : [...prev, curr],
    [],
  );

export default flatten;
