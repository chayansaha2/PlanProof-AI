import React from "react";
import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "https://planproof-ai.onrender.com").replace(/\/+$/, "");
export default function App() {
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [tasks, setTasks] = useState("T2, T1, T3");
  const [constraints, setConstraints] = useState("T1,T2");
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState("validate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => {
        if (!r.ok) throw new Error("API unavailable");
        return r.json();
      })
      .then(data => setApiStatus(data.status || "Connected"))
      .catch(() => setApiStatus("Not connected"));
  }, []);

  async function validatePlan() {
    setResultType("validate");
    setLoading(true);
    setError("");
    setResult(null);

    const taskOrder = tasks.split(",").map(s => s.trim()).filter(Boolean);
    const edges = constraints.split("\n").flatMap(line =>
      line.split(";").map(s => s.trim()).filter(Boolean).map(pair =>
        pair.split(",").map(s => s.trim())
      )
    );

    if (edges.some(edge => edge.length !== 2)) {
      setError("Enter each dependency as BeforeTask,AfterTask.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_order: taskOrder,
          required_tasks: taskOrder,
          precedence_constraints: edges
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      setResult(data);
    } catch (e) {
      setError(`Could not validate the plan. Check that the backend is running and its port 8000 is accessible. ${e.message}`);
    } finally {
      setLoading(false);
    }
  }


  async function repairPlan() {
    setResultType("repair");
    setLoading(true);
    setError("");
    setResult(null);

    const taskOrder = tasks.split(",").map(s => s.trim()).filter(Boolean);
    const edges = constraints
      .split("\n")
      .flatMap(line =>
        line.split(";").map(s => s.trim()).filter(Boolean).map(pair =>
          pair.split(",").map(s => s.trim())
        )
      );

    if (edges.some(edge => edge.length !== 2)) {
      setError("Enter each dependency as BeforeTask,AfterTask.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/repair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_order: taskOrder,
          required_tasks: taskOrder,
          precedence_constraints: edges
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      setResult(data);
    } catch (e) {
      setError(`Could not repair the plan. ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">P</span><span>PlanProof <b>AI</b></span></div>
        <p className="side-label">WORKSPACE</p>
        <div className="nav-item active">▦ &nbsp; Plan Validator</div>
        <div className="nav-item">◇ &nbsp; Plan Repair <small>Next</small></div>
        <div className="sidebar-bottom">Constraint-aware planning<br /><span>Research prototype · v0.1</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><span className="eyebrow">WORKSPACE / OVERVIEW</span><h1>Plan Validation</h1></div>
          <div className="status-pill"><span className={apiStatus === "healthy" || apiStatus === "running" ? "status-dot" : "status-dot offline"}></span> API {apiStatus}</div>
        </header>

        <section className="welcome">
          <div><span className="eyebrow light">PLANPROOF AI ENGINE</span><h2>Make every task order<br />provably valid.</h2><p>Check task dependencies and identify precedence violations before work begins.</p></div>
          <div className="hero-symbol">✓</div>
        </section>

        <div className="section-heading"><div><h2>Validate a project plan</h2><p>Enter tasks in their proposed execution order.</p></div><span className="tag">LIVE API</span></div>

        <section className="workspace-grid">
          <div className="panel">
            <label htmlFor="tasks">Task execution order</label>
            <textarea id="tasks" value={tasks} onChange={e => setTasks(e.target.value)} rows="3" placeholder="T1, T2, T3" />
            <p className="field-help">Separate task IDs with commas.</p>
            <label htmlFor="constraints">Required dependencies</label>
            <textarea id="constraints" value={constraints} onChange={e => setConstraints(e.target.value)} rows="3" placeholder={"T1,T2\nT2,T3"} />
            <p className="field-help">One dependency per line: prerequisite,dependent.</p>
            <button className="primary-button" onClick={validatePlan} disabled={loading}>{loading ? "Processing..." : "✓  Validate plan"}</button>
            <button className="primary-button" onClick={repairPlan} disabled={loading} style={{ marginTop: "10px" }}>{loading ? "Processing..." : "↻  Repair plan"}</button>
            {error && <p className="error-message">{error}</p>}
          </div>

          <div className="panel result-panel">
            <span className="eyebrow">VALIDATION RESULT</span>
            {!result && !error && <div className="empty-result"><div className="result-icon">↗</div><h3>Awaiting analysis</h3><p>Submit your plan to check task order and dependency constraints.</p></div>}
            {result && <div className="result-content">
              <div className={(resultType === "repair" ? result.success : result.valid) ? "result-icon success" : "result-icon failure"}>
                {(resultType === "repair" ? result.success : result.valid) ? "✓" : "!"}
              </div>
              <h3>{resultType === "repair"
                ? (result.success ? "Repair successful" : "Repair unsuccessful")
                : (result.valid ? "Plan is valid" : "Plan needs attention")}</h3>
              <p>{resultType === "repair"
                ? (result.success ? "A valid task order has been generated." : (result.errors || ["The plan could not be repaired."]).join(" "))
                : (result.valid ? "No precedence violations were reported." : "The validator found dependency violations.")}</p>
              {resultType === "repair" && result.success && <div className="repaired-order">
                <strong>Plan repair comparison</strong>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 120, 100, 0.09)", border: "1px solid rgba(255, 120, 100, 0.25)" }}>
                    <small style={{ color: "#ff9b91" }}>ORIGINAL ORDER</small>
                    <p style={{ margin: "10px 0", overflowWrap: "anywhere" }}>{(result.original_order || []).join(" → ")}</p>
                  </div>
                  <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(50, 210, 150, 0.09)", border: "1px solid rgba(50, 210, 150, 0.25)" }}>
                    <small style={{ color: "#55e0b0" }}>REPAIRED ORDER</small>
                    <p style={{ margin: "10px 0", overflowWrap: "anywhere" }}>{(result.repaired_order || []).join(" → ")}</p>
                  </div>
                </div>
                <p style={{ marginTop: "12px" }}>Tasks reordered: <strong>{result.changes ?? 0}</strong></p>
                <button className="primary-button" onClick={() => navigator.clipboard.writeText((result.repaired_order || []).join(", "))} style={{ marginTop: "8px" }}>
                  Copy repaired order
                </button>
              </div>}
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>}
          </div>
        </section>
        <footer>PlanProof AI <span>Research prototype · Results depend on the configured validator.</span></footer>
      </main>
    </div>
  );
}
