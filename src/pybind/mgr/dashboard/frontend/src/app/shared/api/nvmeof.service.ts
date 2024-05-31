import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import _ from 'lodash';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';

export const MAX_NAMESPACE = 1024;

export interface ListenerRequest {
  host_name: string;
  traddr: string;
  trsvcid: number;
}

export interface NamespaceCreateRequest {
  rbd_image_name: string;
  rbd_pool: string;
  size: number;
}

export interface NamespaceEditRequest {
  rbd_image_size: number;
}

export interface InitiatorRequest {
  host_nqn: string;
}

const API_PATH = 'api/nvmeof';
const UI_API_PATH = 'ui-api/nvmeof';

@Injectable({
  providedIn: 'root'
})
export class NvmeofService {
  constructor(private http: HttpClient) {}

  listGateways() {
    return this.http.get(`${BASE_URL}/gateway`);
  }
}
