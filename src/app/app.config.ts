import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
/** @angular/common/http */
import { provideHttpClient, withJsonpSupport } from '@angular/common/http';
/** @angular/platform-browser／動畫 */
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
/** @angular/router */
import { provideRouter, withHashLocation } from '@angular/router';
/** PrimeNG 全域設定與 Aura 主題 */
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withJsonpSupport()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        /** 與 Tailwind utilities 層疊順序協調（PrimeNG 官方建議） */
        options: {
          /** 固定亮色模式，停用 PrimeNG 暗色切換。 */
          darkModeSelector: false,
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
    provideRouter(routes, withHashLocation()),
  ],
};
