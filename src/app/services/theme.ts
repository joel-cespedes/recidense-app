import { effect, Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'user-theme';

  public theme: WritableSignal<'light' | 'dark'> = signal('light');

  constructor() {
    this.initializeTheme();

    effect(() => {
      const currentTheme = this.theme();
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(currentTheme);
      localStorage.setItem(this.THEME_KEY, currentTheme);
    });
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.theme.set(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }
  }

  toggleTheme(): void {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }

  isDarkThemeActive(): boolean {
    return this.theme() === 'dark';
  }
}
