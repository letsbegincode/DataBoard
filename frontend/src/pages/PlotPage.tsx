import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import Navbar from "../components/Navbar";
import InfoCard from "../components/InfoCard";
import { ChartSkeleton, FormFieldSkeleton, ComputeResultSkeleton, ButtonPending } from "../components/Skeleton";
import { Dataset, PlotData, ComputeResponse } from "../types";
import { listDatasets, getPlotData, computeStatistic } from "../api/datasets";
import { buildChartOption, type ChartType } from "../lib/chartBuilder";

export default function PlotPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const [computeCol, setComputeCol] = useState("");
  const [computeOp, setComputeOp] = useState<"min" | "max" | "sum">("sum");
  const [computeResult, setComputeResult] = useState<ComputeResponse | null>(null);
  const [computeError, setComputeError] = useState("");
  const [computing, setComputing] = useState(false);

  const [col1, setCol1] = useState("");
  const [col2, setCol2] = useState("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [plotData, setPlotData] = useState<PlotData | null>(null);
  const [plotError, setPlotError] = useState("");
  const [plotting, setPlotting] = useState(false);

  useEffect(() => {
    setDatasetsLoading(true);
    listDatasets(1, 100)
      .then((res) => setDatasets(res.items))
      .finally(() => setDatasetsLoading(false));
  }, []);

  const handleDatasetChange = (datasetId: string) => {
    const ds = datasets.find((d) => d.id === Number(datasetId));
    setSelectedDataset(ds || null);
    setComputeCol("");
    setComputeResult(null);
    setComputeError("");
    setCol1("");
    setCol2("");
    setPlotData(null);
    setPlotError("");
  };

  const handleCompute = async () => {
    if (!selectedDataset || !computeCol) return;
    setComputeError("");
    setComputeResult(null);
    setComputing(true);
    try {
      const result = await computeStatistic(selectedDataset.id, {
        column: computeCol,
        operation: computeOp,
      });
      setComputeResult(result);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setComputeError(typeof detail === "string" ? detail : "Compute failed");
    } finally {
      setComputing(false);
    }
  };

  const handlePlot = async () => {
    if (!selectedDataset || !col1 || !col2) return;
    setPlotError("");
    setPlotting(true);
    setPlotData(null);
    try {
      const data = await getPlotData(selectedDataset.id, col1, col2);
      setPlotData(data);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setPlotError(typeof detail === "string" ? detail : "Failed to get plot data");
    } finally {
      setPlotting(false);
    }
  };

  const { option, hint } = useMemo(() => {
    if (!plotData) return { option: {}, hint: "" };
    return buildChartOption(plotData, chartType);
  }, [plotData, chartType]);

  return (
    <div className="page-shell">
      <Navbar />
      <main className="page-content">
        <header className="page-header panel-header">
          <h1>Analytics & Visualization</h1>
        </header>

        <InfoCard title="About this page" defaultOpen={false}>
          <p>
            Compute min / max / sum on numeric columns, then plot two columns with Apache ECharts.
            Bar/line average the numeric column per category (one bar/point per group).
            Scatter plots one point per row; text×text works for product vs region.
          </p>
        </InfoCard>

        <section className="dataset-picker surface-panel">
          <h2>1. Choose a dataset</h2>
          {datasetsLoading ? (
            <FormFieldSkeleton />
          ) : (
            <div className="form-group">
              <label htmlFor="plot-dataset">Dataset</label>
              <select
                id="plot-dataset"
                onChange={(e) => handleDatasetChange(e.target.value)}
                defaultValue=""
              >
                <option value="">Select dataset</option>
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            </div>
          )}
          {!datasetsLoading && datasets.length === 0 && (
            <p className="empty-hint">No datasets yet — upload one on the Data page first.</p>
          )}
        </section>

        {selectedDataset && (
          <>
            <section className="compute-section surface-panel">
              <h2>2. Compute a statistic</h2>
              <InfoCard title="How compute works" defaultOpen={false} className="info-card--nested">
                <p>
                  Runs on the full column. Non-numeric columns show a clear error; empty or all-null
                  columns return a message instead of a number.
                </p>
              </InfoCard>
              <div className="compute-form">
                <div className="form-group">
                  <label>Column</label>
                  <select
                    value={computeCol}
                    onChange={(e) => setComputeCol(e.target.value)}
                    disabled={computing}
                  >
                    <option value="">Select column</option>
                    {selectedDataset.column_names.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Operation</label>
                  <select
                    value={computeOp}
                    onChange={(e) => setComputeOp(e.target.value as "min" | "max" | "sum")}
                    disabled={computing}
                  >
                    <option value="min">Min</option>
                    <option value="max">Max</option>
                    <option value="sum">Sum</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleCompute}
                  disabled={!computeCol || computing}
                >
                  {computing ? <ButtonPending label="Computing…" /> : "Compute"}
                </button>
              </div>
              {computing && (
                <p className="action-status" role="status">Running statistic on the full column…</p>
              )}
              {computeError && <p className="error">{computeError}</p>}
              {computing && <ComputeResultSkeleton />}
              {!computing && computeResult && (
                <div className="compute-result">
                  {computeResult.value !== null ? (
                    <p>
                      <strong>{computeResult.operation}({computeResult.column})</strong>
                      {" "}= {computeResult.value}
                    </p>
                  ) : (
                    <p className="error">{computeResult.message}</p>
                  )}
                </div>
              )}
            </section>

            <section className="plot-config surface-panel">
              <h2>3. Configure chart</h2>
              <InfoCard title="Chart tips" defaultOpen={false} className="info-card--nested">
                <p>
                  Loads the first ~30 rows. Bar/line group and average (e.g.{" "}
                  <strong>store × rating</strong> → avg rating per store). Scatter keeps row-level
                  points. Try <strong>product × price</strong> (bar) or{" "}
                  <strong>product × region</strong> (scatter).
                </p>
              </InfoCard>

              <div className="plot-form">
                <div className="form-group">
                  <label>Column 1 (X-axis)</label>
                  <select value={col1} onChange={(e) => setCol1(e.target.value)} disabled={plotting}>
                    <option value="">Select column</option>
                    {selectedDataset.column_names.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Column 2 (Y-axis)</label>
                  <select value={col2} onChange={(e) => setCol2(e.target.value)} disabled={plotting}>
                    <option value="">Select column</option>
                    {selectedDataset.column_names.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chart type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    disabled={plotting}
                  >
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="scatter">Scatter</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handlePlot}
                  disabled={!col1 || !col2 || plotting}
                >
                  {plotting ? <ButtonPending label="Generating…" /> : "Generate Chart"}
                </button>
              </div>

              {plotting && (
                <p className="action-status" role="status">Building chart — hang tight if the API is waking up.</p>
              )}
              {plotError && <p className="error">{plotError}</p>}
            </section>

            {(plotting || plotData) && (
              <section className="chart-section surface-panel">
                <h2>{plotting ? "Generating chart…" : "Chart"}</h2>
                {plotting && <ChartSkeleton />}
                {!plotting && plotData && (
                  <>
                    {hint && <p className="chart-hint">{hint}</p>}
                    <ReactECharts
                      option={option}
                      style={{ height: "420px", width: "100%" }}
                      notMerge
                      lazyUpdate
                    />
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
