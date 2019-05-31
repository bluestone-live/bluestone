export const setCookie = (
  key: string,
  value: string | null,
  expires: number,
) => {
  document.cookie = `${key}=${value};expires=${new Date(
    expires,
  ).toUTCString()};path=/`;
};

export const deleteCookie = (key: string) =>
  (document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:01 GMT`);

export const getCookie = (name: string) => {
  const matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
        '=([^;]*)',
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
};
