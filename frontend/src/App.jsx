
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  Upload,
  Zap,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const initialPlan = {
  task_order: ["T2", "T1", "T3", "T4"],
  required_tasks: ["T1", "T2", "T3", "T4"],
  precedence_constraints: [
    ["T1", "T2"],
    ["T2", "T3"],
    ["T1", "T4"],
  ],
};

export default function App() {
  const [plan, setPlan] = useState(initialPlan);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function validatePlan() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      setResult(await response.json());
    } catch {
      setError(
        "Cannot connect to the PlanProof API. Start the backend and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetPlan() {
    setPlan(initialPlan);
    setResult(null);
    setError("");
  }

  function updateOrder(value) {
    setPlan((current) => ({
      ...current,
      task_order: value
        .split(",")
        .map((task) => task.trim())
        .filter(Boolean),
    }));
    setResult(null);
  }

  const issueCount = result
    ? result.violations.length + result.errors.length
    : null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home">
          <span className="brand-mark"><GitBranch size={22} /></span>
          <span>PlanProof<span className="brand-ai"> AI</span></span>
        </a>

        <p className="nav-label">WORKSPACE</p>
        <a className="nav-item active" href="#dashboard">
          <LayoutDashboard size={18} /> Dashboard
        </a>
        <a className="nav-item" href="#plan-editor">
          <ListChecks size={18} /> Plan validator
        </a>
        <a className="nav-item" href="#results">
          <ShieldCheck size={18} /> Validation results
        </a>

        <div className="sidebar-bottom">
          <div className="engine-status">
            <span className="status-dot" />
            <div>
              <strong>PlanProof Engine</strong>
              <small>API connection required</small>
            </div>
          </div>
          <p className="sidebar-caption">Constraint-aware plan repair</p>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>Plan validation</h1>
          </div>
          <div className="topbar-badge">
            <Activity size={16} /> Research prototype
          </div>
        </header>

        <section className="welcome-section">
          <div>
            <p className="eyebrow light">INTELLIGENT PLAN ANALYSIS</p>
            <h2>Make every task order count.</h2>
            <p>
              Validate dependencies, identify ordering conflicts, and inspect
              your project plan.
            </p>
          </div>
          <div className="welcome-icon"><GitBranch size={54} /></div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-icon blue"><ListChecks size={20} /></span>
            <p>Required tasks</p>
            <strong>{plan.required_tasks.length}</strong>
            <small>Tasks in this plan</small>
          </article>
          <article className="stat-card">
            <span className="stat-icon purple"><GitBranch size={20} /></span>
            <p>Dependencies</p>
            <strong>{plan.precedence_constraints.length}</strong>
            <small>Prerequisite relationships</small>
          </article>
          <article className="stat-card">
            <span className="stat-icon green"><ShieldCheck size={20} /></span>
            <p>Plan status</p>
            <strong className="status-text">
              {result ? (result.valid ? "Valid" : "Issues") : "Not checked"}
            </strong>
            <small>
              {result ? "Latest validation" : "Run validation to check"}
            </small>
          </article>
          <article className="stat-card">
            <span className="stat-icon orange"><CircleAlert size={20} /></span>
            <p>Issues found</p>
            <strong>{issueCount ?? "—"}</strong>
            <small>From latest validation</small>
          </article>
        </section>

        <section className="workspace-grid">
          <article className="panel plan-panel" id="plan-editor">
            <div className="panel-heading">
              <div>
                <h3>Plan editor</h3>
                <p>Modify the task order before validating.</p>
              </div>
              <span className="panel-icon"><ListChecks size={19} /></span>
            </div>

            <label htmlFor="task-order">Current task order</label>
            <textarea
              id="task-order"
              value={plan.task_order.join(", ")}
              onChange={(event) => updateOrder(event.target.value)}
              rows={3}
              placeholder="T1, T2, T3, T4"
            />
            <small className="field-help">
              Enter task IDs separated by commas.
            </small>

            <div className="dependency-heading">
              <strong>Precedence constraints</strong>
              <span>{plan.precedence_constraints.length} rules</span>
            </div>

            <div className="dependency-list">
              {plan.precedence_constraints.map(([before, after], index) => (
                <div className="dependency-row" key={`${before}-${after}-${index}`}>
                  <span className="task-chip">{before}</span>
                  <ArrowRight size={16} />
                  <span className="task-chip">{after}</span>
                  <span className="dependency-note">must come first</span>
                </div>
              ))}
            </div>

            <div className="button-row">
              <button
                className="primary-button"
                onClick={validatePlan}
                disabled={loading}
              >
                <ShieldCheck size={17} />
                {loading ? "Validating..." : "Validate plan"}
              </button>
              <button className="secondary-button" onClick={resetPlan}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </article>

          <article className="panel results-panel" id="results">
            <div className="panel-heading">
              <div>
                <h3>Validation results</h3>
                <p>Results from the PlanProof API.</p>
              </div>
              <span className="panel-icon"><Zap size={19} /></span>
            </div>

            {!result && !error && (
              <div className="empty-state">
                <div className="empty-icon"><ShieldCheck size={32} /></div>
                <h4>Ready to analyze</h4>
                <p>
                  Run validation to check task completeness, duplicate IDs,
                  unknown tasks, and prerequisite order.
                </p>
              </div>
            )}

            {error && (
              <div className="message error-message">
                <CircleAlert size={20} />
                <div>
                  <strong>Connection error</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="result-content">
                <div className={`message ${result.valid ? "success-message" : "error-message"}`}>
                  {result.valid
                    ? <CheckCircle2 size={22} />
                    : <CircleAlert size={22} />}
                  <div>
                    <strong>{result.valid ? "Plan is valid" : "Plan needs attention"}</strong>
                    <p>
                      {result.valid
                        ? "All supplied structural checks passed."
                        : `${issueCount} issue(s) reported by the validator.`}
                    </p>
                  </div>
                </div>

                {result.errors.map((item, index) => (
                  <div className="issue-row" key={`error-${index}`}>
                    <CircleAlert size={16} />
                    <span>{item}</span>
                  </div>
                ))}

                {result.violations.map((item, index) => (
                  <div className="issue-row" key={`violation-${index}`}>
                    <CircleAlert size={16} />
                    <span>
                      {item.type === "precedence_violation"
                        ? `${item.before} must appear before ${item.after}.`
                        : `${item.type.replaceAll("_", " ")}: ${(item.tasks || []).join(", ")}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="panel-footer">
              <span className="status-dot" />
              Validation uses supplied task constraints
            </div>
          </article>
        </section>

        <footer className="app-footer">
          <span>PlanProof AI <span>·</span> Research prototype</span>
          <span><Upload size={14} /> Plan repair and verification</span>
        </footer>
      </main>
    </div>
  );
}

