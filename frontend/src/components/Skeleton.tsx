/** Lightweight skeleton placeholders — no external UI kit. */

export function SkeletonLine({
  width = "100%",
  height = "0.85rem",
  className = "",
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <span
      className={`skeleton skeleton-line ${className}`.trim()}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonBlock({
  width = "100%",
  height = "1rem",
  className = "",
  radius,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  radius?: string | number;
}) {
  return (
    <div
      className={`skeleton skeleton-block ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}

/** Full-page shell while auth session is restoring. */
export function PageSkeleton() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Loading">
      <div className="skeleton-nav">
        <SkeletonBlock width={120} height={22} />
        <div className="skeleton-nav-links">
          <SkeletonBlock width={52} height={14} />
          <SkeletonBlock width={52} height={14} />
          <SkeletonBlock width={52} height={14} />
        </div>
        <SkeletonBlock width={140} height={28} radius={8} />
      </div>
      <main className="page-content">
        <SkeletonBlock width="42%" height={28} className="skeleton-mb" />
        <div className="surface-panel skeleton-panel">
          <SkeletonBlock width="28%" height={18} className="skeleton-mb" />
          <SkeletonLine width="92%" />
          <SkeletonLine width="78%" />
          <SkeletonLine width="64%" />
        </div>
        <div className="surface-panel skeleton-panel">
          <SkeletonBlock width="34%" height={18} className="skeleton-mb" />
          <div className="skeleton-list">
            <SkeletonListRow />
            <SkeletonListRow />
            <SkeletonListRow />
          </div>
        </div>
      </main>
    </div>
  );
}

export function SkeletonListRow() {
  return (
    <div className="skeleton-list-row">
      <div className="skeleton-list-main">
        <SkeletonLine width="45%" height="0.95rem" />
        <SkeletonLine width="70%" height="0.7rem" />
      </div>
      <div className="skeleton-list-actions">
        <SkeletonBlock width={72} height={34} radius={8} />
        <SkeletonBlock width={72} height={34} radius={8} />
      </div>
    </div>
  );
}

export function DatasetListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-list" aria-busy="true" aria-label="Loading datasets">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonListRow key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-container skeleton-table-wrap" aria-busy="true" aria-label="Loading preview">
      <table className="skeleton-table">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i}>
                <SkeletonLine width="70%" height="0.75rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }, (_, c) => (
                <td key={c}>
                  <SkeletonLine width={`${55 + ((r + c) % 3) * 12}%`} height="0.7rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="skeleton-chart" aria-busy="true" aria-label="Loading chart">
      <div className="skeleton-chart-bars">
        {[42, 68, 35, 80, 55, 72, 48].map((h, i) => (
          <SkeletonBlock key={i} width="100%" height={`${h}%`} radius={6} />
        ))}
      </div>
    </div>
  );
}

export function FormFieldSkeleton() {
  return (
    <div className="form-group">
      <SkeletonLine width={80} height="0.75rem" className="skeleton-mb-sm" />
      <SkeletonBlock width="100%" height={40} radius={8} />
    </div>
  );
}

/** Placeholder while a compute request is in flight. */
export function ComputeResultSkeleton() {
  return (
    <div className="compute-result compute-result--skeleton" aria-busy="true" aria-label="Computing">
      <SkeletonLine width="55%" height="1rem" />
    </div>
  );
}

/** Inline button pending label with spinner. */
export function ButtonPending({ label }: { label: string }) {
  return (
    <span className="btn-pending">
      <span className="btn-spinner" aria-hidden />
      {label}
    </span>
  );
}
