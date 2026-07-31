import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import InfoCard from "../components/InfoCard";
import { DatasetListSkeleton, TableSkeleton } from "../components/Skeleton";
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
  const [listLoading, setListLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [listError, setListError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDatasets = async () => {
    setListLoading(true);
    setListError("");
    try {
      const data = await listDatasets(page, 5);
      setDatasets(data);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets().catch(() => {
      setListError("Could not load datasets. Try refreshing.");
      setListLoading(false);
    });
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
      await fetchDatasets();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setUploadError(typeof detail === "string" ? detail : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (datasetId: number) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreview(null);
    try {
      const data = await getDatasetPreview(datasetId);
      setPreview(data);
    } catch {
      setListError("Could not load preview. Try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const removeDatasetFromList = (datasetId: number) => {
    setPreview((prev) => (prev?.dataset_id === datasetId ? null : prev));

    if (!datasets) return;

    const items = datasets.items.filter((d) => d.id !== datasetId);
    const total = Math.max(0, datasets.total - 1);
    const pages = Math.max(1, Math.ceil(total / datasets.limit) || 1);

    if (items.length === 0 && datasets.page > 1) {
      setPage(datasets.page - 1);
      return;
    }

    setDatasets({
      ...datasets,
      items,
      total,
      pages,
      has_next: datasets.page < pages,
      has_prev: datasets.page > 1,
    });
  };

  const handleDelete = async (dataset: Dataset) => {
    if (!window.confirm(`Delete dataset "${dataset.name}"? This cannot be undone.`)) return;

    setListError("");
    setDeletingId(dataset.id);
    try {
      await deleteDataset(dataset.id);
      removeDatasetFromList(dataset.id);
    } catch (err: any) {
      if (err.response?.status === 404) {
        removeDatasetFromList(dataset.id);
      } else {
        const detail = err.response?.data?.detail;
        setListError(typeof detail === "string" ? detail : "Delete failed. Try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content">
        <header className="page-header panel-header">
          <h1>Data Management</h1>
        </header>

        <InfoCard title="About this page" defaultOpen={false}>
          <p>
            Upload CSV files, browse your library, preview the first 25 rows, and remove datasets
            you no longer need. Each upload is stored privately under your account.
          </p>
        </InfoCard>

        <section className="upload-section surface-panel">
          <h2>Upload Dataset</h2>
          <InfoCard title="Upload tips" defaultOpen={false} className="info-card--nested">
            <p>
              Choose a friendly name and a <strong>.csv</strong> file. Columns can be text or
              numbers. Try files in <code>sample_data/</code>.
            </p>
          </InfoCard>
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

        <section className="dataset-list-section surface-panel">
          <h2>Your Datasets</h2>
          <InfoCard title="List & actions" defaultOpen={false} className="info-card--nested">
            <p>
              Browse datasets you own. Use Preview to inspect rows, or Delete to remove a dataset
              permanently.
            </p>
          </InfoCard>
          {listError && <p className="error">{listError}</p>}
          {listLoading && <DatasetListSkeleton rows={3} />}
          {!listLoading && datasets && datasets.items.length === 0 && (
            <p className="empty-hint">No datasets yet. Upload a sample from <code>sample_data/</code>.</p>
          )}
          {!listLoading && datasets && datasets.items.map((ds) => (
            <div key={ds.id} className="dataset-item">
              <div>
                <strong>{ds.name}</strong> ({ds.original_filename})
                <span className="dataset-meta">
                  {" "}— {ds.row_count} rows, {ds.column_names.length} columns
                </span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => handlePreview(ds.id)}
                  disabled={previewLoading}
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  disabled={deletingId === ds.id}
                  onClick={() => handleDelete(ds)}
                >
                  {deletingId === ds.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}

          {!listLoading && datasets && datasets.pages > 1 && (
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

        {(previewLoading || preview) && (
          <section className="preview-section surface-panel">
            <div className="preview-header">
              <div>
                <h2>{preview ? `Preview: ${preview.name}` : "Preview"}</h2>
                {preview && (
                  <p className="section-desc">
                    First {preview.preview_rows} of {preview.total_rows} rows (API limit: 25).
                  </p>
                )}
              </div>
              {preview && (
                <div className="preview-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPreviewOpen((open) => !open)}
                  >
                    {previewOpen ? "Minimize" : "Expand"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPreview(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {previewLoading && <TableSkeleton rows={6} cols={4} />}
            {!previewLoading && preview && previewOpen && (
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
