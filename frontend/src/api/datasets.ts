import client from "./client";
import { Dataset, DatasetListResponse, DatasetPreview, ComputeRequest, ComputeResponse, PlotData } from "../types";

export async function uploadDataset(file: File, name: string): Promise<Dataset> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  const res = await client.post("/dataset", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function listDatasets(page = 1, limit = 10): Promise<DatasetListResponse> {
  const res = await client.get(`/dataset?page=${page}&limit=${limit}`);
  return res.data;
}

export async function getDatasetPreview(datasetId: number): Promise<DatasetPreview> {
  const res = await client.get(`/dataset/${datasetId}/preview`);
  return res.data;
}

export async function deleteDataset(datasetId: number): Promise<void> {
  await client.delete(`/dataset/${datasetId}`);
}

export async function computeStatistic(datasetId: number, data: ComputeRequest): Promise<ComputeResponse> {
  const res = await client.post(`/dataset/${datasetId}/compute`, data);
  return res.data;
}

export async function getPlotData(datasetId: number, col1: string, col2: string): Promise<PlotData> {
  const res = await client.get(`/dataset/${datasetId}/plot?col1=${col1}&col2=${col2}`);
  return res.data;
}
