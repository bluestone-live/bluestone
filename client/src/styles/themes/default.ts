import adjustColor from '../utils/adjustColor';

const primaryColor = '#0096b7';

export default {
  fontFamily: 'Helvetica, Arial, sans-serif',
  fontSize: '14px',
  fontColor: '#333',
  fontColorLight: '#777',
  primaryColor,
  primaryColorLight: adjustColor(primaryColor, 40),
  backgroundColor: 'f6f9fc',
  borderColor: '#e8e8e8',
  borderRadius: '4px',
};
