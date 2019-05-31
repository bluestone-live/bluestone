interface IParseObj {
  [key: string]: string;
}

/**
 * format query string
 * @param search locaion.search 字符 e.g. `?test=123`
 * @return query string 对象
 * @example
 * `
 * const qs = '?testOne=123&testTwo=456';
 * const qsObj = parse(qs);
 * `
 */
function parse(search: string): IParseObj {
  const o: IParseObj = {};
  if (search) {
    const splitArr = search.slice(1).split('&');
    const reg = /^(.+)=(.+)$/;

    splitArr.forEach(str => {
      const match = str.match(reg);
      if (match) {
        const key = match[1];
        const value = match[2];
        o[key] = value;
      }
    });
  }
  return o;
}

export default parse;
