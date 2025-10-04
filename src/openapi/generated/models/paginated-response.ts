/* tslint:disable */
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
