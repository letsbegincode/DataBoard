import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <main className="page-content">
        <h1>Welcome to DataBoard</h1>
        <p>Hello, {user?.email}! Manage your datasets and create visualizations.</p>
        <div className="home-cards">
          <div className="card">
            <h2>Data</h2>
            <p>Upload CSV files, preview data, and manage your datasets.</p>
          </div>
          <div className="card">
            <h2>Plot</h2>
            <p>Visualize your data with interactive charts.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
