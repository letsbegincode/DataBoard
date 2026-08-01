export interface User {
  id: number;
  email: string;
  name?: string | null;
}

export interface Dataset {
  id: number;
  name: string;
  original_filename: string;
  column_names: string[];
  row_count: number;
  created_at: string;
}

export interface DatasetListResponse {
  items: Dataset[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface DatasetPreview {
  dataset_id: number;
  name: string;
  column_names: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
  preview_rows: number;
}

export interface ComputeRequest {
  column: string;
  operation: "min" | "max" | "sum";
}

export interface ComputeResponse {
  dataset_id: number;
  column: string;
  operation: string;
  value: number | null;
  message?: string;
}

export interface PlotData {
  dataset_id: number;
  col1_name: string;
  col2_name: string;
  col1_values: unknown[];
  col2_values: unknown[];
  row_count: number;
}
