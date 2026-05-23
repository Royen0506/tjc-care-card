import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SheetApiResponse } from '../models/sheet-response.model';

/** GAS Web App 部署網址（/exec） */
export const GAS_EXEC_URL =
  'https://script.google.com/macros/s/AKfycbztGrDMbMWKRk24XPV2JuxcoYar4WzLWPYTxVUZf5uXXv7rj4jEpbikwivrmPxj9jx8yA/exec';

@Injectable()
export class SheetsApiService {
  private readonly http = inject(HttpClient);

  /**
   * 以 JSONP 呼叫 GAS，避免 302 重新導向造成的 CORS 問題。
   * GAS doGet 需支援 `callback` 參數（見 scripts/gas-doGet.example.js）。
   */
  getResponses(): Observable<SheetApiResponse> {
    return this.http.jsonp<SheetApiResponse>(GAS_EXEC_URL, 'callback');
  }
}
