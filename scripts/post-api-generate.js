#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const GENERATED_PATH = path.join(__dirname, '../src/openapi/generated');

const BASE_SERVICE_CONTENT = `/* tslint:disable */
/* eslint-disable */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from './api-configuration';

@Injectable()
export abstract class BaseService {
  constructor(
    protected config: ApiConfiguration,
    protected http: HttpClient,
  ) {}

  private _rootUrl?: string;

  get rootUrl(): string {
    return this._rootUrl || this.config.rootUrl || '';
  }

  set rootUrl(rootUrl: string) {
    this._rootUrl = rootUrl;
  }
}
`;

const PAGINATED_RESPONSE_CONTENT = `/* tslint:disable */
/* eslint-disable */
export interface PaginatedResponse<T = any> {
  has_next: boolean;
  has_prev: boolean;
  items: Array<T>;
  page: number;
  pages: number;
  size: number;
  total: number;
}
`;

function createFile(filePath, content) {
  const fullPath = path.join(GENERATED_PATH, filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Created: ${filePath}`);
}

console.log('🔧 Running post-api-generate script...\n');

// Create base-service.ts
createFile('base-service.ts', BASE_SERVICE_CONTENT);

// Create paginated-response.ts
createFile('models/paginated-response.ts', PAGINATED_RESPONSE_CONTENT);

console.log('\n✨ Post-generate script completed successfully!');
