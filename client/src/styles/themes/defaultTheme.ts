import adjustColor from './adjustColor';
import { black, blue, grey1, grey2, grey3, grey4, white, red } from './colors';

export const DefaultTheme = {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: {
    medium: '14px',
    large: '18px',
    huge: '34px',
  },
  fontColors: {
    highlight: blue,
    primary: black,
    secondary: grey1,
    inverted: white,
  },
  colors: {
    primary: blue,
    primaryLight: adjustColor(blue, 40),
  },
  backgroundColor: {
    body: grey4,
    primary: white,
    secondary: grey4,
    hover: grey3,
  },
  borderColor: {
    primary: grey2,
    secondary: grey3,
    warning: red,
  },
  borderRadius: {
    small: '2px',
    medium: '4px',
  },
  gap: {
    small: '7px',
    medium: '14px',
    large: '21px',
    largest: '28px',
  },
};
