import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
);

const TARGETS = [85, 80, 75, 70, 65];

function getNextTarget(percent) {
  for (let t of [...TARGETS].reverse()) {
    if (percent < t) return t;
  }
  return 85;
}

function classesNeeded(attended, held, target) {
  const T = target / 100;
  if (attended / held >= T) return 0;
  return Math.ceil((T * held - attended) / (1 - T));
}

function safeBunks(attended, held, target) {
  const T = target / 100;
  return Math.max(Math.floor(attended / T - held), 0);
}

function getRisk(percent) {
  if (percent >= 85) return { label: "Safe", color: "#10b981" };
  if (percent >= 75) return { label: "Stable", color: "#f59e0b" };
  if (percent >= 65) return { label: "Risk", color: "#f97316" };
  return { label: "Critical", color: "#ef4444" };
}

/**
 * FIXED OPTIMAL PLAN ALGORITHM
 *
 * Goal: reach overall attendance >= 75% with the MINIMUM total classes attended.
 *
 * Strategy (greedy):
 *   Each iteration, pick the subject whose single attended class gives the
 *   LARGEST improvement to the overall ratio.
 *
 *   Attending one class of subject i:
 *     new_overall = (totalAtt + 1) / (totalHeld + 1)
 *   This is the same delta for every subject, so the cheapest way to reach
 *   75% overall is simply to attend classes one by one until the threshold
 *   is met — but we distribute them to the subjects that need it most
 *   (lowest individual %) so we simultaneously improve weak subjects.
 *
 *   If overall is already >= 75%, no classes are needed.
 */
function computeOptimalPlan(processed) {
  // Deep-copy subject state
  let subjects = processed.map((s) => ({
    name: s.subject,
    held: s.held,
    attended: s.attended,
  }));

  let totalHeld = subjects.reduce((s, r) => s + r.held, 0);
  let totalAtt = subjects.reduce((s, r) => s + r.attended, 0);

  const plan = {};
  subjects.forEach((s) => (plan[s.name] = 0));

  // If already at or above 75%, nothing needed
  if (totalHeld === 0 || totalAtt / totalHeld >= 0.75) return plan;

  // Each attended class raises overall by the same amount regardless of subject.
  // Total classes needed to cross 75%:
  //   (totalAtt + x) / (totalHeld + x) >= 0.75
  //   totalAtt + x >= 0.75 * totalHeld + 0.75x
  //   0.25x >= 0.75 * totalHeld - totalAtt
  //   x >= (0.75 * totalHeld - totalAtt) / 0.25
  const totalNeeded = Math.ceil((0.75 * totalHeld - totalAtt) / 0.25);

  // Distribute those classes greedily to the weakest subjects first
  // (lowest attendance ratio), attending at most as many as needed per subject.
  let remaining = totalNeeded;
  while (remaining > 0) {
    // Sort ascending by current ratio
    subjects.sort((a, b) => a.attended / a.held - b.attended / b.held);
    const weakest = subjects[0];

    // How many classes to assign to this subject before it ties with the next?
    let batch;
    if (subjects.length > 1) {
      const nextRatio = subjects[1].attended / subjects[1].held;
      // attended_w + k) / (held_w + k) = nextRatio
      // => k = (nextRatio * held_w - attended_w) / (1 - nextRatio)
      const k = (nextRatio * weakest.held - weakest.attended) / (1 - nextRatio);
      batch = Math.max(1, Math.min(remaining, Math.floor(k) || 1));
    } else {
      batch = remaining;
    }

    weakest.attended += batch;
    weakest.held += batch;
    plan[weakest.name] = (plan[weakest.name] || 0) + batch;
    remaining -= batch;
  }

  return plan;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .att-root {
    --navy: #0a1628;
    --navy-mid: #112240;
    --navy-soft: #1d3461;
    --accent: #4f8ef7;
    --accent2: #7c3aed;
    --green: #10b981;
    --amber: #f59e0b;
    --orange: #f97316;
    --red: #ef4444;
    --surface: rgba(255,255,255,0.04);
    --surface2: rgba(255,255,255,0.07);
    --border: rgba(255,255,255,0.08);
    --text: #e8edf5;
    --text-muted: #8899b4;
    --radius: 14px;
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;

    font-family: var(--font-body);
    background: var(--navy);
    min-height: 100vh;
    color: var(--text);
    padding: 40px 20px 80px;
  }

  .att-inner {
    max-width: 820px;
    margin: 0 auto;
  }

  /* ── HEADER ── */
  .att-header {
    text-align: center;
    margin-bottom: 40px;
  }
  .att-header h1 {
    font-family: var(--font-display);
    font-size: clamp(26px, 5vw, 42px);
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #e8edf5 30%, #4f8ef7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .att-header p {
    color: var(--text-muted);
    font-size: 14px;
    margin-top: 6px;
    font-weight: 300;
  }

  /* ── FORM ── */
  .att-form-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    backdrop-filter: blur(12px);
    margin-bottom: 32px;
  }
  .att-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .att-input {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 14px;
    color: var(--text);
    font-family: var(--font-body);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .att-input::placeholder { color: var(--text-muted); }
  .att-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,142,247,0.15);
  }
  .att-btn {
    padding: 12px 24px;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    font-size: 14px;
    font-family: var(--font-display);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    white-space: nowrap;
  }
  .att-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79,142,247,0.3); }
  .att-check {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    font-size: 13px;
    color: var(--text-muted);
    cursor: pointer;
    width: fit-content;
  }
  .att-check input[type=checkbox] { accent-color: var(--accent); width: 15px; height: 15px; }
  .att-pass-wrap { margin-top: 12px; }

  /* ── LOADING / NAME ── */
  .att-loading {
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
    padding: 12px 0;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .att-name {
    text-align: center;
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 28px;
    color: var(--text);
  }
  .att-name span { color: var(--accent); }

  /* ── SUMMARY STRIP ── */
  .att-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }
  .sum-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sum-card.clickable { cursor: pointer; transition: transform 0.2s, border-color 0.2s; }
  .sum-card.clickable:hover { transform: translateY(-3px); border-color: var(--accent); }
  .sum-label {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
  }
  .sum-value {
    font-family: var(--font-display);
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    margin-top: 4px;
  }
  .sum-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  /* ── OPTIMAL PLAN ── */
  .plan-card {
    background: linear-gradient(135deg, rgba(79,142,247,0.08), rgba(124,58,237,0.08));
    border: 1px solid rgba(79,142,247,0.25);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 28px;
    animation: slideDown 0.3s ease;
  }
  @keyframes slideDown { from { opacity:0; transform: translateY(-8px) } to { opacity:1; transform: translateY(0) } }
  .plan-card h3 {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--accent);
    letter-spacing: 0.3px;
  }
  .plan-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }
  .plan-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .plan-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
  }
  .plan-item b { color: var(--accent); font-weight: 700; }
  .plan-sub { color: var(--text-muted); font-size: 12px; margin-top: 2px; }
  .plan-empty { color: var(--text-muted); font-size: 14px; }

  /* ── CHART ── */
  .att-chart-wrap {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 28px;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 20px;
  }

  /* ── TABLE ── */
  .att-table-wrap {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 28px;
  }
  .att-table-head {
    padding: 18px 24px 14px;
    border-bottom: 1px solid var(--border);
  }
  .att-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .att-table thead tr {
    background: rgba(255,255,255,0.03);
  }
  .att-table th {
    padding: 12px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
  }
  .att-table td {
    padding: 13px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: var(--text);
    vertical-align: middle;
  }
  .att-table tbody tr:last-child td { border-bottom: none; }
  .att-table tbody tr:hover { background: rgba(255,255,255,0.03); }

  .risk-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .risk-dot { width: 6px; height: 6px; border-radius: 50%; }

  .pct-bar-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .pct-bar-bg {
    flex: 1;
    height: 5px;
    background: rgba(255,255,255,0.07);
    border-radius: 3px;
    overflow: hidden;
    min-width: 60px;
  }
  .pct-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
  .pct-label { font-size: 13px; font-weight: 500; min-width: 38px; text-align: right; }

  .target-select {
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 5px 10px;
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-body);
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .target-select:focus { outline: none; border-color: var(--accent); }

  .num-pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .num-pill.need { background: rgba(239,68,68,0.15); color: #ef4444; }
  .num-pill.bunk { background: rgba(16,185,129,0.15); color: #10b981; }
  .num-pill.zero { background: rgba(255,255,255,0.06); color: var(--text-muted); }

  .subj-name { font-weight: 500; }
`;

function PctBar({ percent }) {
  const { color } = getRisk(percent);
  return (
    <div className="pct-bar-wrap">
      <div className="pct-bar-bg">
        <div
          className="pct-bar-fill"
          style={{ width: `${Math.min(percent, 100)}%`, background: color }}
        />
      </div>
      <span className="pct-label" style={{ color }}>
        {percent}%
      </span>
    </div>
  );
}

function RiskBadge({ percent }) {
  const { label, color } = getRisk(percent);
  return (
    <span className="risk-badge" style={{ background: `${color}18`, color }}>
      <span className="risk-dot" style={{ background: color }} />
      {label}
    </span>
  );
}

export default function Attendance() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [samePass, setSamePass] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [customTargets, setCustomTargets] = useState({});
  const [showPlan, setShowPlan] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalPassword = samePass ? username : password;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: finalPassword }),
      });
      const data = await res.json();
      setStudentName(data.studentName);
      setAttendance(data.attendance);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const subjects = attendance.slice(0, -1);

  const processed = subjects.map((row, i) => {
    const subject = row[1];
    const held = Number(row[3]);
    const attended = Number(row[4]);
    const percent = Number(row[5]);
    const autoTarget = getNextTarget(percent);
    const target =
      customTargets[i] !== undefined ? customTargets[i] : autoTarget;
    const need = classesNeeded(attended, held, target);
    const bunks = safeBunks(attended, held, target);
    const risk = getRisk(percent);
    return { subject, held, attended, percent, target, need, bunks, risk };
  });

  const totalHeld = processed.reduce((s, r) => s + r.held, 0);
  const totalAtt = processed.reduce((s, r) => s + r.attended, 0);
  const overallPercent =
    totalHeld > 0 ? ((totalAtt / totalHeld) * 100).toFixed(1) : 0;
  const overallNeed = classesNeeded(totalAtt, totalHeld, 75);
  const overallBunks = safeBunks(totalAtt, totalHeld, 75);

  const optimalPlan = processed.length > 0 ? computeOptimalPlan(processed) : {};
  const planEntries = Object.entries(optimalPlan).filter(([, v]) => v > 0);

  const chartData = {
    labels: processed.map((s) =>
      s.subject.length > 18 ? s.subject.slice(0, 18) + "…" : s.subject,
    ),
    datasets: [
      {
        label: "Attendance %",
        data: processed.map((s) => s.percent),
        backgroundColor: processed.map((s) => {
          const { color } = getRisk(s.percent);
          return color + "cc";
        }),
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Target 75%",
        data: processed.map(() => 75),
        backgroundColor: "rgba(79,142,247,0.15)",
        borderColor: "rgba(79,142,247,0.5)",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#8899b4",
          font: { size: 12, family: "'DM Sans', sans-serif" },
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        backgroundColor: "#112240",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#e8edf5",
        bodyColor: "#8899b4",
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#8899b4", font: { size: 11 } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: "#8899b4",
          font: { size: 11 },
          callback: (v) => v + "%",
        },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
    },
  };

  const overallColor =
    overallPercent >= 85
      ? "#10b981"
      : overallPercent >= 75
        ? "#f59e0b"
        : overallPercent >= 65
          ? "#f97316"
          : "#ef4444";

  return (
    <div className="att-root">
      <style>{STYLES}</style>
      <div className="att-inner">
        {/* HEADER */}
        <div className="att-header">
          <h1>Attendance Planner</h1>
          <p>CBIT · Smart attendance tracking & optimisation</p>
        </div>

        {/* FORM */}
        <div className="att-form-card">
          <form onSubmit={handleSubmit}>
            <div className="att-row">
              <input
                className="att-input"
                placeholder="ERP Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button className="att-btn" type="submit">
                Fetch
              </button>
            </div>
            <label className="att-check">
              <input
                type="checkbox"
                checked={samePass}
                onChange={() => setSamePass(!samePass)}
              />
              Username = Password
            </label>
            {!samePass && (
              <div className="att-pass-wrap">
                <input
                  className="att-input"
                  type="password"
                  placeholder="ERP Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
          </form>
        </div>

        {loading && <p className="att-loading">Fetching attendance data…</p>}
        {studentName && (
          <p className="att-name">
            <span>{studentName}</span>
          </p>
        )}

        {/* SUMMARY */}
        {processed.length > 0 && (
          <div className="att-summary">
            <div className="sum-card">
              <span className="sum-label">Overall Attendance</span>
              <span className="sum-value" style={{ color: overallColor }}>
                {overallPercent}%
              </span>
              <span className="sum-sub">
                {totalAtt} of {totalHeld} classes
              </span>
            </div>

            <div
              className="sum-card clickable"
              onClick={() => setShowPlan(!showPlan)}
              title="Click to see optimal plan"
            >
              <span className="sum-label">Classes Needed (75%)</span>
              <span
                className="sum-value"
                style={{ color: overallNeed > 0 ? "#ef4444" : "#10b981" }}
              >
                {overallNeed}
              </span>
              <span className="sum-sub">
                {showPlan ? "▲ Hide plan" : "▼ View optimal plan"}
              </span>
            </div>

            <div className="sum-card">
              <span className="sum-label">Safe Bunks (75%)</span>
              <span
                className="sum-value"
                style={{ color: overallBunks > 0 ? "#10b981" : "#8899b4" }}
              >
                {overallBunks}
              </span>
              <span className="sum-sub">across all subjects</span>
            </div>
          </div>
        )}

        {/* OPTIMAL PLAN */}
        {showPlan && processed.length > 0 && (
          <div className="plan-card">
            <h3>
              {planEntries.length === 0
                ? "✓ You're already at 75% overall"
                : `Optimal Plan — attend ${planEntries.reduce((s, [, v]) => s + v, 0)} classes to reach 75% overall`}
            </h3>
            {planEntries.length === 0 ? (
              <p className="plan-empty">No action needed. Keep it up!</p>
            ) : (
              <div className="plan-grid">
                {planEntries
                  .sort(([, a], [, b]) => b - a)
                  .map(([sub, v]) => (
                    <div className="plan-item" key={sub}>
                      <div className="plan-dot" />
                      <div>
                        <div>
                          <b>{v}</b> class{v !== 1 ? "es" : ""}
                        </div>
                        <div className="plan-sub">{sub}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* CHART */}
        {processed.length > 0 && (
          <div className="att-chart-wrap">
            <p className="section-title">Subject Breakdown</p>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}

        {/* TABLE */}
        {processed.length > 0 && (
          <div className="att-table-wrap">
            <div className="att-table-head">
              <p className="section-title" style={{ marginBottom: 0 }}>
                Attendance Planner
              </p>
            </div>
            <table className="att-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Need</th>
                  <th>Bunks</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((row, i) => (
                  <tr key={i}>
                    <td className="subj-name">{row.subject}</td>
                    <td>
                      <PctBar percent={row.percent} />
                    </td>
                    <td>
                      <RiskBadge percent={row.percent} />
                    </td>
                    <td>
                      <select
                        className="target-select"
                        value={row.target}
                        onChange={(e) =>
                          setCustomTargets({
                            ...customTargets,
                            [i]: Number(e.target.value),
                          })
                        }
                      >
                        {[85, 80, 75, 70, 65].map((t) => (
                          <option key={t} value={t}>
                            {t}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={`num-pill ${row.need > 0 ? "need" : "zero"}`}
                      >
                        {row.need > 0 ? `+${row.need}` : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`num-pill ${row.bunks > 0 ? "bunk" : "zero"}`}
                      >
                        {row.bunks > 0 ? row.bunks : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
