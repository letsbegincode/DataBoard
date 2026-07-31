import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Dataset, DatasetListResponse, DatasetPreview } from "../types";
import {
  uploadDataset,
  listDatasets,
  getDatasetPreview,
  deleteDataset,
} from "../api/datasets";

export default function DataPage() {
  const [datasets, setDatasets] = useState<DatasetListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDatasets = async () => {
    const data = await listDatasets(page, 5);
    setDatasets(data);
  };

  useEffect(() => {
    fetchDatasets();
  }, [page]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !datasetName) return;
    setUploadError("");
    setLoading(true);
    try {
      await uploadDataset(file, datasetName);
      setFile(null);
      setDatasetName("");
      fetchDatasets();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setUploadError(typeof detail === "string" ? detail : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (datasetId: number) => {
    const data = await getDatasetPreview(datasetId);
    setPreview(data);
  };

  const handleDelete = async (dataset: Dataset) => {
    if (!window.confirm(`Delete dataset "${dataset.name}"? This cannot be undone.`)) return;
    await deleteDataset(dataset.id);
    setPreview(null);
    fetchDatasets();
  };

  return (
    <div>
      <Navbar />
      <main className="page-content">
        <h1>Data Management</h1>

        {/* Upload Section */}
        <section className="upload-section">
          <h2>Upload Dataset</h2>
          <form onSubmit={handleUpload}>
            <input
              type="text"
              placeholder="Dataset name"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              required
            />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload CSV"}
            </button>
          </form>
          {uploadError && <p className="error">{uploadError}</p>}
        </section>

        {/* Dataset List Section */}
        <section className="dataset-list-section">
          <h2>Your Datasets</h2>
          {datasets && datasets.items.length === 0 && <p>No datasets yet. Upload one above.</p>}
          {datasets && datasets.items.map((ds) => (
            <div key={ds.id} className="dataset-item">
              <div>
                <strong>{ds.name}</strong> ({ds.original_filename})
                <span className="dataset-meta"> — {ds.row_count} rows, {ds.column_names.length} columns</span>
              </div>
              <div>
                <button onClick={() => handlePreview(ds.id)}>Preview</button>
                <button className="delete-btn" onClick={() => handleDelete(ds)}>Delete</button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {datasets && datasets.pages > 1 && (
            <div className="pagination">
              <button disabled={!datasets.has_prev} onClick={() => setPage(page - 1)}>Previous</button>
              <span>Page {datasets.page} of {datasets.pages} ({datasets.total} total)</span>
              <button disabled={!datasets.has_next} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </section>

        {/* Preview Section */}
        {preview && (
          <section className="preview-section">
            <h2>Preview: {preview.name}</h2>
            <p>Showing {preview.preview_rows} of {preview.total_rows} rows</p>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {preview.column_names.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i}>
                      {preview.column_names.map((col) => (
                        <td key={col}>{row[col] != null ? String(row[col]) : "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
