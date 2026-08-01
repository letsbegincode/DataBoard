import type { PlotData } from "../types";

export type ChartType = "scatter" | "line" | "bar";

export type ChartBuildResult = {
  option: Record<string, unknown>;
  hint: string;
};

type ColKind = "numeric" | "text" | "empty";

export function isNumericValue(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return false;
  if (typeof v === "number") return Number.isFinite(v);
  if (typeof v === "string") {
    const n = Number(v);
    return v.trim() !== "" && Number.isFinite(n);
  }
  return false;
}

export function toNumber(v: unknown): number {
  return typeof v === "number" ? v : Number(v);
}

function columnKind(values: unknown[]): ColKind {
  const present = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (present.length === 0) return "empty";
  return present.every(isNumericValue) ? "numeric" : "text";
}

function categoryLabel(v: unknown): string {
  return v === null || v === undefined || v === "" ? "—" : String(v);
}

/** Group numeric values by category; average within each group (first-seen order). */
export function averageByCategory(
  categories: unknown[],
  values: unknown[],
): { labels: string[]; averages: number[]; counts: number[] } {
  const groups = new Map<string, { sum: number; count: number }>();
  const order: string[] = [];

  const n = Math.min(categories.length, values.length);
  for (let i = 0; i < n; i++) {
    if (!isNumericValue(values[i])) continue;
    const key = categoryLabel(categories[i]);
    let g = groups.get(key);
    if (!g) {
      g = { sum: 0, count: 0 };
      groups.set(key, g);
      order.push(key);
    }
    g.sum += toNumber(values[i]);
    g.count += 1;
  }

  return {
    labels: order,
    averages: order.map((k) => {
      const g = groups.get(k)!;
      return g.sum / g.count;
    }),
    counts: order.map((k) => groups.get(k)!.count),
  };
}

/** Count rows per category (first-seen order). */
export function countByCategory(categories: unknown[]): {
  labels: string[];
  counts: number[];
} {
  const groups = new Map<string, number>();
  const order: string[] = [];
  for (const v of categories) {
    const key = categoryLabel(v);
    if (!groups.has(key)) {
      groups.set(key, 0);
      order.push(key);
    }
    groups.set(key, groups.get(key)! + 1);
  }
  return {
    labels: order,
    counts: order.map((k) => groups.get(k)!),
  };
}

function emptyResult(hint: string): ChartBuildResult {
  return {
    hint,
    option: {
      title: { text: "No chart data" },
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: [],
    },
  };
}

function barOrLineOption(args: {
  chartType: "bar" | "line";
  title: string;
  hint: string;
  categoryName: string;
  valueName: string;
  labels: string[];
  values: number[];
  seriesName: string;
}): ChartBuildResult {
  return {
    hint: args.hint,
    option: {
      title: { text: args.title },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: unknown) =>
          typeof v === "number" && Number.isFinite(v) ? String(Number(v.toFixed(4))) : String(v),
      },
      grid: { left: 56, right: 24, top: 56, bottom: 90 },
      xAxis: {
        type: "category",
        data: args.labels,
        name: args.categoryName,
        axisLabel: { rotate: 35 },
      },
      yAxis: { type: "value", name: args.valueName },
      series: [{
        type: args.chartType,
        data: args.values,
        name: args.seriesName,
      }],
    },
  };
}

function buildScatter(
  plotData: PlotData,
  xKind: ColKind,
  yKind: ColKind,
): ChartBuildResult {
  const xRaw = plotData.col1_values;
  const yRaw = plotData.col2_values;
  const title = `${plotData.col1_name} vs ${plotData.col2_name}`;

  if (xKind === "empty" || yKind === "empty") {
    return emptyResult("No plottable values in one or both columns.");
  }

  // numeric × numeric
  if (xKind === "numeric" && yKind === "numeric") {
    const data: [number, number][] = [];
    for (let i = 0; i < xRaw.length; i++) {
      if (!isNumericValue(xRaw[i]) || !isNumericValue(yRaw[i])) continue;
      data.push([toNumber(xRaw[i]), toNumber(yRaw[i])]);
    }
    if (data.length === 0) return emptyResult("No numeric pairs to scatter.");
    return {
      hint: "Scatter: both axes numeric (one point per row).",
      option: {
        title: { text: title },
        tooltip: { trigger: "item" },
        grid: { left: 56, right: 24, top: 56, bottom: 56 },
        xAxis: { name: plotData.col1_name, type: "value", scale: true },
        yAxis: { name: plotData.col2_name, type: "value", scale: true },
        series: [{ type: "scatter", symbolSize: 10, data }],
      },
    };
  }

  // text × numeric — categories on X, values on Y
  if (xKind === "text" && yKind === "numeric") {
    const pairs: [string, number][] = [];
    for (let i = 0; i < xRaw.length; i++) {
      if (!isNumericValue(yRaw[i])) continue;
      pairs.push([categoryLabel(xRaw[i]), toNumber(yRaw[i])]);
    }
    if (pairs.length === 0) return emptyResult("No numeric Y values to scatter.");
    const uniqX = [...new Set(pairs.map((p) => p[0]))];
    return {
      hint: "Scatter: category on X, numeric on Y (one point per row).",
      option: {
        title: { text: title },
        tooltip: { trigger: "item" },
        grid: { left: 56, right: 24, top: 56, bottom: 90 },
        xAxis: {
          type: "category",
          data: uniqX,
          name: plotData.col1_name,
          axisLabel: { rotate: 35 },
        },
        yAxis: { type: "value", name: plotData.col2_name, scale: true },
        series: [{ type: "scatter", symbolSize: 12, data: pairs }],
      },
    };
  }

  // numeric × text — values on X, categories on Y
  if (xKind === "numeric" && yKind === "text") {
    const pairs: [number, string][] = [];
    for (let i = 0; i < xRaw.length; i++) {
      if (!isNumericValue(xRaw[i])) continue;
      pairs.push([toNumber(xRaw[i]), categoryLabel(yRaw[i])]);
    }
    if (pairs.length === 0) return emptyResult("No numeric X values to scatter.");
    const uniqY = [...new Set(pairs.map((p) => p[1]))];
    return {
      hint: "Scatter: numeric on X, category on Y (one point per row).",
      option: {
        title: { text: title },
        tooltip: { trigger: "item" },
        grid: { left: 100, right: 24, top: 56, bottom: 56 },
        xAxis: { type: "value", name: plotData.col1_name, scale: true },
        yAxis: {
          type: "category",
          data: uniqY,
          name: plotData.col2_name,
        },
        series: [{ type: "scatter", symbolSize: 12, data: pairs }],
      },
    };
  }

  // text × text
  const xCats = xRaw.map(categoryLabel);
  const yCats = yRaw.map(categoryLabel);
  const uniqX = [...new Set(xCats)];
  const uniqY = [...new Set(yCats)];
  return {
    hint: "Scatter with text columns: category axes (one point per row).",
    option: {
      title: { text: title },
      tooltip: {
        trigger: "item",
        formatter: (p: { value?: unknown }) => {
          const val = p.value;
          if (!Array.isArray(val) || val.length < 2) return "";
          return `${val[0]} → ${val[1]}`;
        },
      },
      grid: { left: 100, right: 24, top: 56, bottom: 90 },
      xAxis: {
        type: "category",
        data: uniqX,
        name: plotData.col1_name,
        axisLabel: { rotate: 35 },
      },
      yAxis: {
        type: "category",
        data: uniqY,
        name: plotData.col2_name,
      },
      series: [{
        type: "scatter",
        symbolSize: 14,
        data: xCats.map((x, i) => [x, yCats[i]]),
      }],
    },
  };
}

function buildBarOrLine(
  plotData: PlotData,
  chartType: "bar" | "line",
  xKind: ColKind,
  yKind: ColKind,
): ChartBuildResult {
  const xRaw = plotData.col1_values;
  const yRaw = plotData.col2_values;
  const kind = chartType === "bar" ? "Bar" : "Line";

  if (xKind === "empty" && yKind === "empty") {
    return emptyResult("No plottable values in either column.");
  }

  // One column empty — don't silently fall through to a misleading count chart.
  if (xKind === "text" && yKind === "empty") {
    return emptyResult(
      `No numeric values in “${plotData.col2_name}” to average. Pick a numeric Y column.`,
    );
  }
  if (xKind === "empty" && yKind === "text") {
    return emptyResult(
      `No numeric values in “${plotData.col1_name}” to average. Pick a numeric column for values.`,
    );
  }
  if (xKind === "numeric" && yKind === "empty") {
    return emptyResult(`No values in “${plotData.col2_name}” to chart.`);
  }
  if (xKind === "empty" && yKind === "numeric") {
    return emptyResult(`No values in “${plotData.col1_name}” to chart.`);
  }

  // text × numeric → avg(Y) by X
  if (xKind === "text" && yKind === "numeric") {
    const { labels, averages, counts } = averageByCategory(xRaw, yRaw);
    if (labels.length === 0) {
      return emptyResult(`No numeric values in “${plotData.col2_name}” to average.`);
    }
    return barOrLineOption({
      chartType,
      title: `Avg ${plotData.col2_name} by ${plotData.col1_name}`,
      hint: `${kind}: average of ${plotData.col2_name} per ${plotData.col1_name} (${counts.reduce((a, b) => a + b, 0)} rows → ${labels.length} groups).`,
      categoryName: plotData.col1_name,
      valueName: `avg ${plotData.col2_name}`,
      labels,
      values: averages,
      seriesName: `avg ${plotData.col2_name}`,
    });
  }

  // numeric × text → swap: avg(X) by Y
  if (xKind === "numeric" && yKind === "text") {
    const { labels, averages, counts } = averageByCategory(yRaw, xRaw);
    if (labels.length === 0) {
      return emptyResult(`No numeric values in “${plotData.col1_name}” to average.`);
    }
    return barOrLineOption({
      chartType,
      title: `Avg ${plotData.col1_name} by ${plotData.col2_name}`,
      hint:
        `Y was text — swapped axes and averaged ${plotData.col1_name} per ${plotData.col2_name} ` +
        `(${counts.reduce((a, b) => a + b, 0)} rows → ${labels.length} groups).`,
      categoryName: plotData.col2_name,
      valueName: `avg ${plotData.col1_name}`,
      labels,
      values: averages,
      seriesName: `avg ${plotData.col1_name}`,
    });
  }

  // numeric × numeric → avg(Y) grouped by unique X value
  if (xKind === "numeric" && yKind === "numeric") {
    const { labels, averages, counts } = averageByCategory(xRaw, yRaw);
    if (labels.length === 0) {
      return emptyResult("No numeric pairs to chart.");
    }
    return barOrLineOption({
      chartType,
      title: `Avg ${plotData.col2_name} by ${plotData.col1_name}`,
      hint:
        `${kind}: both numeric — average of ${plotData.col2_name} per unique ${plotData.col1_name} ` +
        `(${counts.reduce((a, b) => a + b, 0)} rows → ${labels.length} groups).`,
      categoryName: plotData.col1_name,
      valueName: `avg ${plotData.col2_name}`,
      labels,
      values: averages,
      seriesName: `avg ${plotData.col2_name}`,
    });
  }

  // text × text (or anything left) → count by X
  const { labels, counts } = countByCategory(xRaw);
  if (labels.length === 0) {
    return emptyResult(`No values in “${plotData.col1_name}” to count.`);
  }
  return barOrLineOption({
    chartType,
    title: `Count by ${plotData.col1_name}`,
    hint:
      `Both columns are text. Showing counts per “${plotData.col1_name}”. ` +
      `Tip: set Y to a numeric column for averages, or use Scatter for category × category.`,
    categoryName: plotData.col1_name,
    valueName: "count",
    labels,
    values: counts,
    seriesName: "count",
  });
}

/**
 * Build ECharts option for every supported (chart type × column-kind) pair.
 *
 * Bar/line matrix:
 *   text × numeric  → avg(Y) by X
 *   numeric × text  → swap; avg(X) by Y
 *   numeric × numeric → avg(Y) by unique X
 *   text × text     → count by X
 *
 * Scatter matrix:
 *   numeric × numeric → value scatter (row points)
 *   text × numeric    → category X, value Y (row points)
 *   numeric × text    → value X, category Y (row points)
 *   text × text       → category scatter (row points)
 */
export function buildChartOption(
  plotData: PlotData,
  chartType: ChartType,
): ChartBuildResult {
  const xKind = columnKind(plotData.col1_values);
  const yKind = columnKind(plotData.col2_values);

  if (chartType === "scatter") {
    return buildScatter(plotData, xKind, yKind);
  }
  return buildBarOrLine(plotData, chartType, xKind, yKind);
}
