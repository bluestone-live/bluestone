const splitPath = (path: string) =>
  path
    .split('/')
    .slice(1)
    .reduce((prev: any[], curr: any, index: number) => {
      if (prev[index - 1]) {
        return [...prev, `${prev[index - 1]}/${curr}`];
      }
      return [...prev, `/${curr}`];
    }, []);

export default splitPath;
