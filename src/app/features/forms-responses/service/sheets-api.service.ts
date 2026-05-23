import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SheetApiResponse } from '../models/sheet-response.model';

@Injectable()
export class SheetsApiService {
  private readonly http = inject(HttpClient);

  getResponses(): Observable<SheetApiResponse> {
    return this.http.get<SheetApiResponse>(
      'https://script.google.com/macros/s/AKfycbztGrDMbMWKRk24XPV2JuxcoYar4WzLWPYTxVUZf5uXXv7rj4jEpbikwivrmPxj9jx8yA/exec',
    );
  }
}
