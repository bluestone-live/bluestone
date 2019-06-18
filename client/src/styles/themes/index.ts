import { DefaultTheme } from './defaultTheme';

type ThemeProps = typeof DefaultTheme;

export type ThemedProps<T = {}> = Partial<T> & {
  theme: ThemeProps;
};

export { DefaultTheme } from './defaultTheme';
