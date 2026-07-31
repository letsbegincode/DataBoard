import { useState, ReactNode } from "react";

interface InfoCardProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/** Collapsible display card for section descriptions / overview content. */
export default function InfoCard({
  title,
  children,
  defaultOpen = true,
  className = "",
}: InfoCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`info-card ${open ? "is-open" : "is-collapsed"} ${className}`.trim()}>
      <button
        type="button"
        className="info-card-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="info-card-title">{title}</span>
        <span className="info-card-chevron" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="info-card-body">{children}</div>}
    </div>
  );
}
