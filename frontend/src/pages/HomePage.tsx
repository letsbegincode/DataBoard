import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import InfoCard from "../components/InfoCard";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="page-shell home-shell">
      <Navbar />
      <main className="page-content page-content--centered">
        <header className="hero-panel">
          <p className="eyebrow">xVector Labs · DataBoard</p>
          <h1>Turn CSV uploads into insight</h1>
          <p className="page-lead page-lead--centered">
            Hello{user?.email ? `, ${user.email}` : ""}. Upload your datasets, run clear statistics,
            and explore charts in a private workspace built for everyday data work.
          </p>
          <div className="hero-actions hero-actions--centered">
            <Link className="btn-primary-link" to="/data">Go to Data</Link>
            <Link className="btn-secondary-link" to="/plot">Open Analytics</Link>
          </div>
        </header>

        <InfoCard title="Mission" defaultOpen>
          <p>
            Give every signed-in user a private place to upload CSVs, preview rows, compute
            min / max / sum on numeric columns, and chart relationships — without leaving the browser.
          </p>
          <div className="mission-grid">
            <div className="mini-card">
              <h3>Private & secure</h3>
              <p>Your datasets stay under your account, protected by hashed passwords and short-lived sessions.</p>
            </div>
            <div className="mini-card">
              <h3>Clear results</h3>
              <p>When a column can’t be computed or a chart isn’t ready, you get a plain message — not a blank screen.</p>
            </div>
            <div className="mini-card">
              <h3>Simple workflow</h3>
              <p>Upload on Data, analyze on Plot — preview, paginate, and delete whenever you need.</p>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="How the system works" defaultOpen>
          <p className="info-intro info-intro--center">
            Browser never talks to the database — only to the API.
          </p>

          <div className="flow-diagram" aria-label="Correct request and response path">
            <div className="flow-chain">
              <div className="flow-node flow-node--fe">
                <strong>React</strong>
                <span>Frontend</span>
              </div>

              <div className="flow-hop" aria-hidden>
                <span className="flow-hop-line flow-hop-line--req" />
                <span className="flow-hop-label">HTTP + JWT</span>
                <span className="flow-hop-line flow-hop-line--res" />
              </div>

              <div className="flow-node flow-node--api">
                <strong>FastAPI</strong>
                <span>Backend</span>
              </div>

              <div className="flow-hop" aria-hidden>
                <span className="flow-hop-line flow-hop-line--req" />
                <span className="flow-hop-label">SQLAlchemy</span>
                <span className="flow-hop-line flow-hop-line--res" />
              </div>

              <div className="flow-node flow-node--db">
                <strong>Neon</strong>
                <span>Postgres</span>
              </div>
            </div>

            <ol className="flow-steps">
              <li>
                <strong>1. Request</strong> — UI calls FastAPI (<code>/auth</code>, <code>/dataset</code>, compute, plot).
              </li>
              <li>
                <strong>2. Persist / query</strong> — FastAPI reads or writes Neon Postgres.
              </li>
              <li>
                <strong>3. Response</strong> — Neon → FastAPI → JSON back to the UI. No DB ↔ browser link.
              </li>
            </ol>

            <div className="flow-chips" aria-label="Main actions">
              <span className="flow-chip">Auth</span>
              <span className="flow-chip">Upload</span>
              <span className="flow-chip">Preview</span>
              <span className="flow-chip">Compute</span>
              <span className="flow-chip">Plot</span>
            </div>
          </div>
        </InfoCard>

        <InfoCard title="Where to go next" defaultOpen>
          <div className="home-cards">
            <Link to="/data" className="card card-link">
              <h3>Data</h3>
              <p>Upload CSVs from <code>sample_data/</code>, preview, paginate, and delete.</p>
            </Link>
            <Link to="/plot" className="card card-link">
              <h3>Plot</h3>
              <p>Compute statistics and build interactive charts from your datasets.</p>
            </Link>
          </div>
        </InfoCard>
      </main>
    </div>
  );
}
