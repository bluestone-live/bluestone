import adjustColor from '../utils/adjustColor';
import { black, blue, grey1, grey2, grey3, grey4, white } from './colors';

export default {
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
    primary: white,
    secondary: grey4,
    hover: grey3,
  },
  borderColor: {
    primary: grey2,
    secondary: grey3,
  },
  borderRadius: '4px',
  gap: {
    small: '7px',
    medium: '14px',
    large: '21px',
    largest: '28px',
  },
};
