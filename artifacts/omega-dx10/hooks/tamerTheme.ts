let _primary: string | null = null;
let _primaryForeground: string = '#ffffff';

export function setTamerTheme(primary: string, foreground: string) {
  _primary = primary;
  _primaryForeground = foreground;
}

export function getTamerTheme() {
  return { primary: _primary, primaryForeground: _primaryForeground };
}
