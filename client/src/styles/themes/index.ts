import { DefaultTheme } from './darkTheme';

type ThemeProps = typeof DefaultTheme;

export type ThemedProps<T = {}> = Partial<T> & {
  theme: ThemeProps;
};

export { DefaultTheme } from './darkTheme';
