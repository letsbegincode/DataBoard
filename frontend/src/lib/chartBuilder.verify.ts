/**
 * Rigorous pair-matrix check for buildChartOption.
 * Run: npx --yes tsx src/lib/chartBuilder.verify.ts
 */
import {
  averageByCategory,
  buildChartOption,
  countByCategory,
  type ChartType,
} from "./chartBuilder";
import type { PlotData } from "../types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function plot(
  col1_name: string,
  col2_name: string,
  col1_values: unknown[],
  col2_values: unknown[],
): PlotData {
  return {
    dataset_id: 1,
    col1_name,
    col2_name,
    col1_values,
    col2_values,
    row_count: col1_values.length,
  };
}

function seriesData(result: ReturnType<typeof buildChartOption>): unknown {
  const series = result.option.series as Array<{ data?: unknown }> | undefined;
  return series?.[0]?.data;
}

function xData(result: ReturnType<typeof buildChartOption>): unknown {
  const xAxis = result.option.xAxis as { data?: unknown } | undefined;
  return xAxis?.data;
}

function titleText(result: ReturnType<typeof buildChartOption>): string {
  const title = result.option.title as { text?: string } | undefined;
  return title?.text ?? "";
}

let passed = 0;

function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log("averageByCategory / countByCategory");
check("avg groups and averages correctly", () => {
  const { labels, averages, counts } = averageByCategory(
    ["Store B", "Store A", "Store B", "Store A", "Store C"],
    [4, 2, 2, 4, 5],
  );
  assert(JSON.stringify(labels) === JSON.stringify(["Store B", "Store A", "Store C"]), "label order");
  assert(averages[0] === 3 && averages[1] === 3 && averages[2] === 5, "averages");
  assert(JSON.stringify(counts) === JSON.stringify([2, 2, 1]), "counts");
});

check("avg skips null / non-numeric", () => {
  const { labels, averages } = averageByCategory(
    ["A", "A", "B"],
    [10, null, "x"],
  );
  assert(labels.length === 1 && labels[0] === "A" && averages[0] === 10, "only A");
});

check("count by category", () => {
  const { labels, counts } = countByCategory(["B", "A", "B", "B"]);
  assert(JSON.stringify(labels) === JSON.stringify(["B", "A"]), "order");
  assert(JSON.stringify(counts) === JSON.stringify([3, 1]), "counts");
});

const stores = ["Store D", "Store B", "Store B", "Store D", "Store A"];
const ratings = [3, 4, 2, 5, 1];

const matrix: Array<{
  name: string;
  chart: ChartType;
  data: PlotData;
  expectLabels?: string[];
  expectValues?: number[];
  expectTitleIncludes?: string;
  expectHintIncludes?: string;
  expectSeriesLen?: number;
  expectXType?: string;
  expectYType?: string;
}> = [
  // —— BAR ——
  {
    name: "bar: text × numeric → avg Y by X (the screenshot bug)",
    chart: "bar",
    data: plot("store", "rating", stores, ratings),
    expectLabels: ["Store D", "Store B", "Store A"],
    expectValues: [4, 3, 1],
    expectTitleIncludes: "Avg rating by store",
    expectHintIncludes: "average",
  },
  {
    name: "bar: numeric × text → swap + avg X by Y",
    chart: "bar",
    data: plot("rating", "store", ratings, stores),
    expectLabels: ["Store D", "Store B", "Store A"],
    expectValues: [4, 3, 1],
    expectTitleIncludes: "Avg rating by store",
    expectHintIncludes: "swapped",
  },
  {
    name: "bar: numeric × numeric → avg Y by unique X",
    chart: "bar",
    data: plot("qty", "price", [1, 1, 2], [10, 20, 30]),
    expectLabels: ["1", "2"],
    expectValues: [15, 30],
    expectTitleIncludes: "Avg price by qty",
  },
  {
    name: "bar: text × text → count by X",
    chart: "bar",
    data: plot("product", "region", ["P1", "P2", "P1"], ["N", "S", "E"]),
    expectLabels: ["P1", "P2"],
    expectValues: [2, 1],
    expectTitleIncludes: "Count by product",
  },
  // —— LINE (same aggregation rules) ——
  {
    name: "line: text × numeric → avg",
    chart: "line",
    data: plot("store", "rating", stores, ratings),
    expectLabels: ["Store D", "Store B", "Store A"],
    expectValues: [4, 3, 1],
  },
  {
    name: "line: numeric × text → swap + avg",
    chart: "line",
    data: plot("rating", "store", ratings, stores),
    expectLabels: ["Store D", "Store B", "Store A"],
    expectValues: [4, 3, 1],
  },
  // —— SCATTER ——
  {
    name: "scatter: numeric × numeric → row points",
    chart: "scatter",
    data: plot("x", "y", [1, 2, 3], [4, 5, 6]),
    expectSeriesLen: 3,
    expectXType: "value",
    expectYType: "value",
  },
  {
    name: "scatter: text × numeric → category X, value Y, row points",
    chart: "scatter",
    data: plot("store", "rating", stores, ratings),
    expectSeriesLen: 5,
    expectXType: "category",
    expectYType: "value",
  },
  {
    name: "scatter: numeric × text → value X, category Y, row points",
    chart: "scatter",
    data: plot("rating", "store", ratings, stores),
    expectSeriesLen: 5,
    expectXType: "value",
    expectYType: "category",
  },
  {
    name: "scatter: text × text → category axes, row points",
    chart: "scatter",
    data: plot("product", "region", ["P1", "P2", "P1"], ["N", "S", "E"]),
    expectSeriesLen: 3,
    expectXType: "category",
    expectYType: "category",
  },
  // —— EMPTY / EDGE ——
  {
    name: "bar: empty columns",
    chart: "bar",
    data: plot("a", "b", [null, null], [null, ""]),
    expectTitleIncludes: "No chart data",
  },
  {
    name: "bar: text × all-null numeric",
    chart: "bar",
    data: plot("store", "rating", ["A", "B"], [null, null]),
    expectTitleIncludes: "No chart data",
  },
];

console.log("\nbuildChartOption pair matrix");
for (const case_ of matrix) {
  check(case_.name, () => {
    const result = buildChartOption(case_.data, case_.chart);
    if (case_.expectLabels) {
      assert(
        JSON.stringify(xData(result)) === JSON.stringify(case_.expectLabels),
        `labels: got ${JSON.stringify(xData(result))}`,
      );
    }
    if (case_.expectValues) {
      assert(
        JSON.stringify(seriesData(result)) === JSON.stringify(case_.expectValues),
        `values: got ${JSON.stringify(seriesData(result))}`,
      );
    }
    if (case_.expectTitleIncludes) {
      assert(
        titleText(result).includes(case_.expectTitleIncludes),
        `title: got "${titleText(result)}"`,
      );
    }
    if (case_.expectHintIncludes) {
      assert(
        result.hint.toLowerCase().includes(case_.expectHintIncludes.toLowerCase()),
        `hint: got "${result.hint}"`,
      );
    }
    if (case_.expectSeriesLen !== undefined) {
      const data = seriesData(result);
      assert(Array.isArray(data) && data.length === case_.expectSeriesLen, `series len`);
    }
    if (case_.expectXType) {
      const xAxis = result.option.xAxis as { type?: string };
      assert(xAxis.type === case_.expectXType, `x type ${xAxis.type}`);
    }
    if (case_.expectYType) {
      const yAxis = result.option.yAxis as { type?: string };
      assert(yAxis.type === case_.expectYType, `y type ${yAxis.type}`);
    }
    // Bar/line with categories must never repeat the same label as raw rows when groups exist
    if (
      (case_.chart === "bar" || case_.chart === "line") &&
      case_.expectLabels &&
      case_.data.col1_values.length > case_.expectLabels.length
    ) {
      const labels = xData(result) as string[];
      assert(new Set(labels).size === labels.length, "duplicate category labels on axis");
    }
  });
}

console.log(`\nAll ${passed} checks passed.`);
