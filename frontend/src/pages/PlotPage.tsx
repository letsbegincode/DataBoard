import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import Navbar from "../components/Navbar";
import { Dataset, PlotData, ComputeResponse } from "../types";
import { listDatasets, getPlotData, computeStatistic } from "../api/datasets";

type ChartType = "scatter" | "line" | "bar";

export default function PlotPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  // Compute section state
  const [computeCol, setComputeCol] = useState("");
  const [computeOp, setComputeOp] = useState<"min" | "max" | "sum">("sum");
  const [computeResult, setComputeResult] = useState<ComputeResponse | null>(null);
  const [computeError, setComputeError] = useState("");

  // Plot section state
  const [col1, setCol1] = useState("");
  const [col2, setCol2] = useState("");
  const [chartType, setChartType] = useState<ChartType>("scatter");
  const [plotData, setPlotData] = useState<PlotData | null>(null);
  const [plotError, setPlotError] = useState("");

  useEffect(() => {
    listDatasets(1, 100).then((res) => setDatasets(res.items));
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
    try {
      const result = await computeStatistic(selectedDataset.id, {
        column: computeCol,
        operation: computeOp,
      });
      setComputeResult(result);
    } catch (err: any) {
      setComputeError(err.response?.data?.detail || "Compute failed");
    }
  };

  const handlePlot = async () => {
    if (!selectedDataset || !col1 || !col2) return;
    setPlotError("");
    try {
      const data = await getPlotData(selectedDataset.id, col1, col2);
      setPlotData(data);
    } catch (err: any) {
      setPlotError(err.response?.data?.detail || "Failed to get plot data");
    }
  };

  const getChartOption = () => {
    if (!plotData) return {};

    if (chartType === "scatter") {
      return {
        title: { text: `${plotData.col1_name} vs ${plotData.col2_name}` },
        tooltip: { trigger: "item" },
        xAxis: { name: plotData.col1_name, type: "value" },
        yAxis: { name: plotData.col2_name, type: "value" },
        series: [{
          type: "scatter",
          data: plotData.col1_values.map((v, i) => [v, plotData.col2_values[i]]),
        }],
      };
    }

    // Line and Bar — col1 as category axis, col2 as value
    return {
      title: { text: `${plotData.col2_name} by ${plotData.col1_name}` },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: plotData.col1_values.map(String),
        name: plotData.col1_name,
        axisLabel: { rotate: 45 },
      },
      yAxis: { type: "value", name: plotData.col2_name },
      series: [{
        type: chartType,
        data: plotData.col2_values,
        name: plotData.col2_name,
      }],
    };
  };

  return (
    <div>
      <Navbar />
      <main className="page-content">
        <h1>Analytics & Visualization</h1>

        {/* Shared dataset picker */}
        <section className="dataset-picker">
          <div className="form-group">
            <label>Dataset</label>
            <select onChange={(e) => handleDatasetChange(e.target.value)} defaultValue="">
              <option value="">Select dataset</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>{ds.name}</option>
              ))}
            </select>
          </div>
        </section>

        {selectedDataset && (
          <>
            {/* Section 1: Compute statistic (Screen 3 requirement) */}
            <section className="compute-section">
              <h2>Compute Statistic</h2>
              <div className="compute-form">
                <select value={computeCol} onChange={(e) => setComputeCol(e.target.value)}>
                  <option value="">Select column</option>
                  {selectedDataset.column_names.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <select
                  value={computeOp}
                  onChange={(e) => setComputeOp(e.target.value as "min" | "max" | "sum")}
                >
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                  <option value="sum">Sum</option>
                </select>
                <button onClick={handleCompute} disabled={!computeCol}>
                  Compute
                </button>
              </div>
              {computeError && <p className="error">{computeError}</p>}
              {computeResult && (
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

            {/* Section 2: Plot two columns (Screen 3 requirement) */}
            <section className="plot-config">
              <h2>Configure Chart</h2>

              <div className="plot-form">
                <div className="form-group">
                  <label>Column 1 (X-axis)</label>
                  <select value={col1} onChange={(e) => setCol1(e.target.value)}>
                    <option value="">Select column</option>
                    {selectedDataset.column_names.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Column 2 (Y-axis)</label>
                  <select value={col2} onChange={(e) => setCol2(e.target.value)}>
                    <option value="">Select column</option>
                    {selectedDataset.column_names.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Chart Type</label>
                  <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)}>
                    <option value="scatter">Scatter</option>
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>

                <button onClick={handlePlot} disabled={!col1 || !col2}>
                  Generate Chart
                </button>
              </div>

              {plotError && <p className="error">{plotError}</p>}
            </section>

            {/* Chart Display */}
            {plotData && (
              <section className="chart-section">
                <ReactECharts
                  option={getChartOption()}
                  style={{ height: "400px", width: "100%" }}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
