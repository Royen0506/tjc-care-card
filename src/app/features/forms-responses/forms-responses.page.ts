/** -- Angular Standar & third plugin -- */
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import dayjs from 'dayjs';
/** -- service & model --*/
import { SheetsApiService } from './service/sheets-api.service';
import { ContentItem } from './models/sheet-response.model';
/** -- store & Rxjs --*/
import { finalize } from 'rxjs';
/** -- component & primeNG module --*/
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forms-responses-page',
  imports: [ButtonModule, CommonModule],
  providers: [SheetsApiService],
  templateUrl: './forms-responses.page.html',
  styleUrl: './forms-responses.page.scss',
})
export class FormsResponsesPage implements OnInit {
  private readonly sheetsApiService = inject(SheetsApiService);
  protected readonly dataList = signal<ContentItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly loadingChars = ['T', 'J', 'C', '.', '.', '.'] as const;
  protected readonly now = signal(dayjs().format('YYYY-MM-DD'));
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadResponses();
  }

  private loadResponses(): void {
    this.sheetsApiService
      .getResponses()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          /** GAS 回傳 data:image/...;base64,... 可直接用於 img src */
          this.dataList.set(res.data);
        },
        error: () => this.loadError.set(true),
      });
  }
}
