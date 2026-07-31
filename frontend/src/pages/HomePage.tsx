import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <main className="page-content">
        <header className="page-header hero-header">
          <p className="eyebrow">xVector Labs take-home · DataBoard</p>
          <h1>Turn CSV uploads into insight</h1>
          <p className="page-lead">
            Hello{user?.email ? `, ${user.email}` : ""}. DataBoard is a small full-stack lab for
            authenticating users, storing tabular data in PostgreSQL, computing column statistics,
            and charting results with Apache ECharts — the same shape of work you would scale later.
          </p>
          <div className="hero-actions">
            <Link className="btn-primary-link" to="/data">Go to Data</Link>
            <Link className="btn-secondary-link" to="/plot">Open Analytics</Link>
          </div>
        </header>

        <section className="mission-section">
          <h2>Mission</h2>
          <p className="section-desc">
            Give every authenticated user a private workspace to upload CSVs, preview raw rows,
            run min/max/sum safely on numeric columns (including empty / all-null / non-numeric
            edge cases), and visualize relationships without leaving the browser.
          </p>
          <div className="mission-grid">
            <div className="card">
              <h3>Secure by default</h3>
              <p>argon2 passwords, short-lived JWT access tokens, HttpOnly refresh cookies.</p>
            </div>
            <div className="card">
              <h3>Honest analytics</h3>
              <p>Compute and plot APIs document failures clearly instead of returning silent blanks.</p>
            </div>
            <div className="card">
              <h3>Interview-ready craft</h3>
              <p>Clean FastAPI modules, genuine pagination, and pytest coverage on compute edges.</p>
            </div>
          </div>
        </section>

        <section className="flow-section">
          <h2>How the system works</h2>
          <p className="section-desc">
            One view of the request path from UI → API → Neon Postgres and back.
          </p>

          <div className="flow-diagram" aria-label="Backend and frontend flow">
            <div className="flow-row">
              <div className="flow-node frontend">
                <span className="flow-label">Frontend</span>
                <strong>React + Vite</strong>
                <small>Login · Data · Plot</small>
              </div>
              <div className="flow-arrow">JWT + cookies</div>
              <div className="flow-node backend">
                <span className="flow-label">Backend</span>
                <strong>FastAPI</strong>
                <small>/auth · /dataset · compute · plot</small>
              </div>
              <div className="flow-arrow">SQLAlchemy</div>
              <div className="flow-node db">
                <span className="flow-label">Database</span>
                <strong>Neon Postgres</strong>
                <small>users · datasets · data_rows</small>
              </div>
            </div>

            <ol className="flow-steps">
              <li>
                <strong>Auth</strong> — register/login issues access JWT (body) + refresh JWT (HttpOnly cookie).
                Axios retries once via <code>POST /auth/refresh</code> on 401.
              </li>
              <li>
                <strong>Upload</strong> — multipart CSV → pandas parse → dataset metadata + JSON rows in Postgres.
              </li>
              <li>
                <strong>Preview / delete</strong> — first 25 rows for the table UI; delete cascades all rows.
              </li>
              <li>
                <strong>Compute</strong> — pull column values, coerce to float, return min/max/sum or edge messages.
              </li>
              <li>
                <strong>Plot</strong> — fetch ~30 values for two columns; ECharts renders bar/line/scatter
                (including text×text scatter).
              </li>
            </ol>
          </div>
        </section>

        <section className="home-cards-section">
          <h2>Where to go next</h2>
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
        </section>
      </main>
    </div>
  );
}
