import { useEffect, useState } from "react";
import "./index.css";

function App() {
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    fetch("http://localhost:8787/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Training Timer Hub</p>
        <h1 className="title">L1 Modular Monolith Bootstrap</h1>
        <p className="description">
          Frontend and backend are connected successfully. This is the initial
          foundation for the Training Timer Hub project.
        </p>
        <div className="status-box">
          <span className="status-label">API Status</span>
          <span className="status-value">{status}</span>
        </div>
      </section>
    </main>
  );
}

export default App;
