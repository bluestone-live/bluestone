import adjustColor from './adjustColor';
import { black, blue, white, red, grey2 } from './colors';

export const DefaultTheme = {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: {
    medium: '14px',
    large: '18px',
    huge: '34px',
  },
  fontColors: {
    highlight: blue,
    primary: blue,
    secondary: '#888',
    inverted: black,
    default: white,
  },
  colors: {
    primary: blue,
    primaryLight: adjustColor(blue, 40),
  },
  backgroundColor: {
    body: grey2,
    primary: grey2,
    secondary: grey2,
    hover: grey2,
  },
  borderColor: {
    primary: black,
    secondary: black,
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
