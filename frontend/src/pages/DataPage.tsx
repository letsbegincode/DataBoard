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
  const [previewOpen, setPreviewOpen] = useState(true);

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
    setPreviewOpen(true);
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
        <header className="page-header">
          <h1>Data Management</h1>
          <p className="page-lead">
            Upload CSV files, browse your library, preview the first 25 rows, and remove
            datasets you no longer need. Each upload is stored privately under your account.
          </p>
        </header>

        <section className="upload-section">
          <h2>Upload Dataset</h2>
          <p className="section-desc">
            Choose a friendly name and a <strong>.csv</strong> file. Columns can be text or
            numbers — null cells are preserved for compute edge cases.
          </p>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label htmlFor="dataset-name">Dataset name</label>
              <input
                id="dataset-name"
                type="text"
                placeholder="e.g. Retail Q1"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dataset-file">CSV file</label>
              <input
                id="dataset-file"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload CSV"}
            </button>
          </form>
          {uploadError && <p className="error">{uploadError}</p>}
        </section>

        <section className="dataset-list-section">
          <h2>Your Datasets</h2>
          <p className="section-desc">
            Paginated list of datasets you own. Use Preview to inspect raw rows, or Delete to
            permanently remove the dataset and all stored rows.
          </p>
          {datasets && datasets.items.length === 0 && (
            <p className="empty-hint">No datasets yet. Upload a sample from <code>sample_data/</code>.</p>
          )}
          {datasets && datasets.items.map((ds) => (
            <div key={ds.id} className="dataset-item">
              <div>
                <strong>{ds.name}</strong> ({ds.original_filename})
                <span className="dataset-meta">
                  {" "}— {ds.row_count} rows, {ds.column_names.length} columns
                </span>
              </div>
              <div>
                <button type="button" onClick={() => handlePreview(ds.id)}>Preview</button>
                <button type="button" className="delete-btn" onClick={() => handleDelete(ds)}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {datasets && datasets.pages > 1 && (
            <div className="pagination">
              <button type="button" disabled={!datasets.has_prev} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>
                Page {datasets.page} of {datasets.pages} ({datasets.total} total)
              </span>
              <button type="button" disabled={!datasets.has_next} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </section>

        {preview && (
          <section className="preview-section">
            <div className="preview-header">
              <div>
                <h2>Preview: {preview.name}</h2>
                <p className="section-desc">
                  Showing first {preview.preview_rows} of {preview.total_rows} rows (API limit: 25).
                </p>
              </div>
              <div className="preview-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPreviewOpen((open) => !open)}
                >
                  {previewOpen ? "Hide preview" : "Show preview"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setPreview(null)}
                >
                  Close
                </button>
              </div>
            </div>

            {previewOpen && (
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
            )}
          </section>
        )}
      </main>
    </div>
  );
}
