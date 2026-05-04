import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000/api";

async function api(path, method = "GET", body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(API + path, options);
    return res.json();
  } catch {
    return { message: "Cannot connect to server. Is the backend running?" };
  }
}

const DEPT_ICONS = {
  Cashier:  "👥",
  Clinic:   "🏥",
  Auditing: "📋",
};

const DEPT_COLORS = {
  Cashier:  { bg: "#2e2a6e", border: "#f5a623", icon: "#f5a623" },
  Clinic:   { bg: "#2e2a6e", border: "#f5a623", icon: "#f5a623" },
  Auditing: { bg: "#2e2a6e", border: "#f5a623", icon: "#f5a623" },
};

function statusBadge(status) {
  const map = {
    waiting:   { bg: "#f5a623", color: "#1a1744", label: "Waiting" },
    called:    { bg: "#4a90d9", color: "#fff",    label: "Called" },
    serving:   { bg: "#f5a623", color: "#1a1744", label: "Serving" },
    completed: { bg: "#4caf50", color: "#fff",    label: "Completed" },
    cancelled: { bg: "#e53e3e", color: "#fff",    label: "Cancelled" },
  };
  const st = map[status] || map.waiting;
  return (
    <span style={{
      background: st.bg, color: st.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    }}>
      {st.label}
    </span>
  );
}

// ── SIDEBAR ──────────────────────────────────────────────────
function Sidebar({ user, page, setPage, onLogout }) {
  const customerLinks = [
    { id: "dashboard", label: "Dashboard" },
    { id: "history",   label: "History" },
  ];
  const staffLinks = [
    { id: "dashboard", label: "Dashboard" },
    { id: "account",   label: "My Account" },
  ];
  const adminLinks = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "cashier",    label: "Cashier" },
    { id: "auditing",   label: "Auditing" },
    { id: "clinic",     label: "Clinic" },
    { id: "service",    label: "Manage Service" },
    { id: "users",      label: "Manage Users" },
  ];

  const links = user?.role === "admin" ? adminLinks : user?.role === "staff" ? staffLinks : customerLinks;

  return (
    <div style={s.sidebar}>
      <div style={s.sidebarLogo}>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: 1 }}>BananaQue</span>
      </div>
      <nav style={{ flex: 1, paddingTop: 16 }}>
        {links.map(l => (
          <button key={l.id} onClick={() => setPage(l.id)}
            style={{ ...s.navBtn, ...(page === l.id ? s.navBtnActive : {}) }}>
            {l.label}
          </button>
        ))}
      </nav>
      <div style={{ height: 16 }} />
    </div>
  );
}

const MOCK_QUEUES = [
  { _id: "q1", name: "Cashier Queue",  department: { name: "Cashier"  }, isActive: true },
  { _id: "q2", name: "Auditing Queue", department: { name: "Auditing" }, isActive: true },
  { _id: "q3", name: "Clinic Queue",   department: { name: "Clinic"   }, isActive: true },
];

// ── CUSTOMER DASHBOARD ───────────────────────────────────────
function CustomerDashboard({ token, user, setPage, onLogout }) {
  const [queues,  setQueues]  = useState([]);
  const [myEntry, setMyEntry] = useState(null);
  const [msg,     setMsg]     = useState("");
  const [joining, setJoining] = useState(null);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    if (token === DEMO_TOKEN) {
      setQueues(MOCK_QUEUES);
      return;
    }
    const [q, e] = await Promise.all([
      api("/queues", "GET", null, token),
      api("/entries/my", "GET", null, token),
    ]);
    if (Array.isArray(q)) setQueues(q);
    if (e && e._id) setMyEntry(e);
    else setMyEntry(null);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const join = async (queue) => {
    if (token === DEMO_TOKEN) {
      const dname = queue.department?.name || queue.name.replace(" Queue","");
      setMyEntry({ _id:"e1", queueNumber:1, status:"waiting", queue:{ name: dname+" Queue" }, transactionId:"TXN-DEMO-001" });
      setJoining(null);
      flash("Joined! Your number is #1");
      return;
    }
    const res = await api("/entries/join", "POST", { queueId: queue._id }, token);
    if (res._id) { flash(`Joined! Your number is #${res.queueNumber}`); setJoining(null); load(); }
    else flash(res.message);
  };

  const cancel = async () => {
    if (token === DEMO_TOKEN) { setMyEntry(null); flash("Queue cancelled."); return; }
    const res = await api("/entries/cancel", "DELETE", null, token);
    if (res.entry) { flash("Queue cancelled."); load(); }
    else flash(res.message);
  };

  const [dropOpen, setDropOpen] = useState(false);

  return (
    <div style={s.main}>
      <div style={{ ...s.topBar, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={s.topBarTitle}>BananaQue</span>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropOpen(o => !o)}
            style={{ background: "#2e2a6e", border: "1px solid #3b3475", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            👤 {user?.name || user?.email}
            <span style={{ fontSize: 10, color: "#a89fd8" }}>▼</span>
          </button>
          {dropOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "#1e1a4a", border: "1px solid #3b3475", borderRadius: 10, minWidth: 180, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #3b3475" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user?.name || "Customer"}</div>
                <div style={{ fontSize: 11, color: "#a89fd8", marginTop: 2 }}>{user?.email}</div>
              </div>
              <button
                onClick={() => { setDropOpen(false); onLogout(); }}
                style={{ display: "block", width: "100%", padding: "11px 16px", background: "transparent", border: "none", color: "#e57373", fontSize: 13, cursor: "pointer", textAlign: "left", fontWeight: 500 }}>
                ↪ Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...s.contentPad, paddingTop: 20 }}>
        <h2 style={{ ...s.pageTitle, textAlign: "center" }}>Dashboard</h2>
        <p style={{ ...s.pageSubtitle, marginBottom: 16, textAlign: "center" }}>Select a queue to join or view your active queues.</p>
        {msg && <div style={s.flash}>{msg}</div>}

        {/* Queue Cards */}
        <div style={s.cardGrid}>
          {queues.map(q => {
            const dname = q.department?.name || q.name.replace(" Queue", "");
            const icon  = DEPT_ICONS[dname] || "🏢";
            const avail = q.isActive;
            return (
              <button key={q._id}
                disabled={!avail || !!myEntry}
                onClick={() => avail && !myEntry && setJoining(q)}
                style={{
                  ...s.queueCard,
                  opacity: avail && !myEntry ? 1 : 0.5,
                  cursor: avail && !myEntry ? "pointer" : "default",
                  borderColor: joining?._id === q._id ? "#f5a623" : "transparent",
                }}>
                <span style={{ fontSize: 30, marginBottom: 8 }}>{icon}</span>
                <div style={{ fontSize: 13, color: "#c5bef0", fontWeight: 500 }}>{dname} Queue</div>
                {!avail && <div style={{ color: "#e53e3e", fontSize: 11, marginTop: 4 }}>Unavailable</div>}
              </button>
            );
          })}
          <button onClick={() => setPage("history")}
            style={{ ...s.queueCard, cursor: "pointer" }}>
            <span style={{ fontSize: 30, marginBottom: 8 }}>🕐</span>
            <div style={{ fontSize: 13, color: "#c5bef0", fontWeight: 500 }}>View History</div>
          </button>
        </div>

        {/* Join modal */}
        {joining && (
          <div style={s.joinModal}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 4 }}>
              Join {joining.department?.name || joining.name.replace(" Queue","")} Queue
            </div>
            <div style={{ fontSize: 13, color: "#a89fd8", marginBottom: 16 }}>
              Fill the details below before joining the queue.
            </div>
            <label style={s.label}>Name</label>
            <input placeholder="Enter your name" style={s.input} readOnly value={user?.name || user?.email || ""} />
            <label style={s.label}>Purpose</label>
            <select style={s.input}>
              <option value="">Select a purpose</option>
              <option>Payment</option>
              <option>Inquiry</option>
              <option>Consultation</option>
              <option>Other</option>
            </select>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={{ ...s.yellowBtn, flex: 1 }} onClick={() => join(joining)}>
                Join Queue
              </button>
              <button style={{ ...s.ghostBtn, flex: 1 }} onClick={() => setJoining(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Active Queues */}
        <h3 style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginTop: 32, marginBottom: 12, textAlign: "center" }}>
          Your Active Queues
        </h3>
        {!myEntry ? (
          <p style={{ ...s.muted, textAlign: "center" }}>No active queues. Select one above to join</p>
        ) : (
          <div style={s.entryCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 22, color: "#fff" }}>#{myEntry.queueNumber}</div>
                <div style={{ color: "#a89fd8", fontSize: 13, marginTop: 2 }}>
                  Service: <b style={{ color: "#f5a623" }}>{myEntry.queue?.name?.replace(" Queue","") || "—"}</b>
                </div>
              </div>
              {statusBadge(myEntry.status)}
            </div>
            <button style={{ ...s.cancelBtn, marginTop: 14, width: "100%" }} onClick={cancel}>
              Cancel Queue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CUSTOMER HISTORY ─────────────────────────────────────────
function CustomerHistory({ token }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api("/entries/my/history", "GET", null, token).then(d => {
      if (Array.isArray(d)) setHistory(d);
    });
  }, [token]);

  return (
    <div style={s.main}>
      <div style={s.topBar}>
        <span style={s.topBarTitle}>BananaQue</span>
      </div>
      <div style={s.contentPad}>
        <h2 style={s.pageTitle}>History</h2>
        <p style={s.pageSubtitle}>Your past queue entries.</p>
        {history.length === 0 ? (
          <p style={s.muted}>No history yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map(e => (
              <div key={e._id} style={s.historyCard}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                    {e.queue?.name?.replace(" Queue","") || "—"} — #{String(e.queueNumber).padStart(3,"0")}
                  </div>
                  <div style={{ fontSize: 12, color: "#a89fd8", marginTop: 3 }}>
                    {new Date(e.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {statusBadge(e.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STAFF DASHBOARD ──────────────────────────────────────────
function StaffDashboard({ token, user }) {
  const [queue,   setQueue]   = useState(null);
  const [entries, setEntries] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab,     setTab]     = useState("queue");
  const [msg,     setMsg]     = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    const queues = await api("/queues", "GET", null, token);
    if (!Array.isArray(queues)) return;
    const deptName = user?.department?.name;
    const q = queues.find(x => x.department?.name === deptName) || queues[0];
    if (!q) return;
    setQueue(q);
    const e = await api(`/entries/queue/${q._id}`, "GET", null, token);
    if (Array.isArray(e)) {
      setEntries(e.filter(x => x.status === "waiting"));
      setCurrent(e.find(x => x.status === "called" || x.status === "serving") || null);
    }
    const h = await api(`/entries/queue/${q._id}/history`, "GET", null, token);
    if (Array.isArray(h)) setHistory(h);
  }, [token, user]);

  useEffect(() => { load(); }, [load]);

  const callNext  = async () => { if (!queue) return; const res = await api(`/admin/call-next/${queue._id}`, "POST", null, token); flash(res.message || JSON.stringify(res)); load(); };
  const complete  = async (id) => { await api(`/admin/complete/${id}`, "POST", null, token); flash("Completed"); load(); };
  const remove    = async (id) => { await api(`/admin/entry/${id}`, "DELETE", null, token); flash("Removed"); load(); };

  return (
    <div style={s.main}>
      <div style={s.topBar}><span style={s.topBarTitle}>BananaQue</span></div>
      <div style={s.contentPad}>
        <h2 style={s.pageTitle}>{DEPT_ICONS[user?.department?.name] || "🏢"} {user?.department?.name || "Your"} — Staff</h2>
        {msg && <div style={s.flash}>{msg}</div>}
        <div style={s.tabRow}>
          {["queue","history"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(tab===t ? s.tabBtnActive : {}) }}>
              {t === "queue" ? "Queue Management" : "History"}
            </button>
          ))}
        </div>
        {tab === "queue" && (
          <>
            <div style={s.servingCard}>
              <div>
                <div style={{ fontSize: 12, color: "#a89fd8" }}>Currently Serving</div>
                {current
                  ? <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>#{String(current.queueNumber).padStart(3,"0")} <span style={{ fontSize: 14, fontWeight: 400, color: "#a89fd8" }}>{current.customer?.email}</span></div>
                  : <div style={{ fontSize: 18, color: "#4a4080", fontWeight: 700 }}>No one serving</div>}
              </div>
              <div style={{ fontSize: 13, color: "#a89fd8" }}>{entries.length} waiting</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <button style={{ ...s.ghostBtn, flex: 1 }} onClick={() => current && complete(current._id)} disabled={!current}>✓ Complete</button>
              <button style={{ ...s.yellowBtn, flex: 1 }} onClick={callNext}>Serve Next</button>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 12 }}>Waiting List</h3>
            {entries.length === 0 ? <p style={s.muted}>No customers waiting.</p> : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr>{["#","Name","Status","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e._id} style={s.tr}>
                        <td style={s.td}><b style={{ color: "#f5a623" }}>{String(e.queueNumber).padStart(3,"0")}</b></td>
                        <td style={s.td}>{e.customer?.email || "—"}</td>
                        <td style={s.td}>{statusBadge(e.status)}</td>
                        <td style={s.td}><button style={s.cancelBtnSm} onClick={() => remove(e._id)}>Cancel</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === "history" && (
          <>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 12 }}>Transaction History</h3>
            {history.length === 0 ? <p style={s.muted}>No history yet.</p> : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead><tr>{["#","Customer","Status","Date"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {history.map(e => (
                      <tr key={e._id} style={s.tr}>
                        <td style={s.td}><b style={{ color: "#f5a623" }}>#{e.queueNumber}</b></td>
                        <td style={s.td}>{e.customer?.email || "—"}</td>
                        <td style={s.td}>{statusBadge(e.status)}</td>
                        <td style={s.td}>{new Date(e.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ──────────────────────────────────────────
function AdminDashboard({ token }) {
  const [overview, setOverview] = useState([]);
  useEffect(() => {
    api("/admin/overview", "GET", null, token).then(d => { if (Array.isArray(d)) setOverview(d); });
  }, [token]);

  return (
    <div style={s.main}>
      <div style={s.topBar}><span style={s.topBarTitle}>BananaQue</span></div>
      <div style={s.contentPad}>
        <h2 style={s.pageTitle}>🍌 BananaQue — Admin</h2>
        <div style={s.cardGrid2}>
          <div style={s.mgmtCard}><span style={{ fontSize: 28 }}>👥</span><div style={{ fontWeight: 700, marginTop: 8, color: "#fff" }}>Manage Users</div><div style={s.muted}>Register new accounts and view all users</div><div style={{ color: "#f5a623", fontSize: 13, marginTop: 8, fontWeight: 600 }}>Manage →</div></div>
          <div style={s.mgmtCard}><span style={{ fontSize: 28 }}>⚙</span><div style={{ fontWeight: 700, marginTop: 8, color: "#fff" }}>Manage Service</div><div style={s.muted}>Enable or disable department services</div><div style={{ color: "#f5a623", fontSize: 13, marginTop: 8, fontWeight: 600 }}>Configure →</div></div>
        </div>
        <h3 style={{ fontWeight: 700, fontSize: 16, margin: "28px 0 8px", color: "#fff" }}>Queue Overview</h3>
        <p style={s.pageSubtitle}>Select a queue to manage.</p>
        <div style={s.cardGrid}>
          {overview.map(q => {
            const dname = q.department?.name || "Queue";
            const icon  = DEPT_ICONS[dname] || "🏢";
            return (
              <div key={q._id} style={{ ...s.overviewCard }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{dname}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#a89fd8" }}>{q.waitingCount} waiting</span>
                </div>
                <div style={{ fontSize: 12, color: "#a89fd8", marginTop: 8 }}>
                  Serving: {q.currentEntry ? `#${String(q.currentEntry.queueNumber||q.currentNumber).padStart(3,"0")} — ${q.currentEntry.customer?.email||""}` : "None"}
                </div>
                <div style={{ color: "#f5a623", fontSize: 12, marginTop: 10, fontWeight: 600 }}>Manage →</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── ADMIN QUEUE PAGE ─────────────────────────────────────────
function AdminQueuePage({ token, deptName }) {
  const [queue,   setQueue]   = useState(null);
  const [entries, setEntries] = useState([]);
  const [current, setCurrent] = useState(null);
  const [msg,     setMsg]     = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    const queues = await api("/queues", "GET", null, token);
    if (!Array.isArray(queues)) return;
    const q = queues.find(x => x.department?.name === deptName);
    if (!q) return;
    setQueue(q);
    const e = await api(`/entries/queue/${q._id}`, "GET", null, token);
    if (Array.isArray(e)) {
      setEntries(e.filter(x => x.status === "waiting"));
      setCurrent(e.find(x => x.status === "called" || x.status === "serving") || null);
    }
  }, [token, deptName]);

  useEffect(() => { load(); }, [load]);

  const callNext   = async () => { if (!queue) return; const res = await api(`/admin/call-next/${queue._id}`, "POST", null, token); flash(res.message || JSON.stringify(res)); load(); };
  const complete   = async (id) => { await api(`/admin/complete/${id}`, "POST", null, token); flash("Marked as completed"); load(); };
  const remove     = async (id) => { await api(`/admin/entry/${id}`, "DELETE", null, token); flash("Entry removed"); load(); };
  const toggleQueue = async () => { if (!queue) return; await api(`/queues/${queue._id}`, "PUT", { isActive: !queue.isActive }, token); load(); };

  return (
    <div style={s.main}>
      <div style={s.topBar}><span style={s.topBarTitle}>BananaQue</span></div>
      <div style={s.contentPad}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={s.pageTitle}>{DEPT_ICONS[deptName] || "🏢"} {deptName} Queue</h2>
          {queue && (
            <button onClick={toggleQueue} style={{ ...s.ghostBtn, fontSize: 12, padding: "6px 14px", borderColor: queue.isActive ? "#e53e3e" : "#4caf50", color: queue.isActive ? "#e53e3e" : "#4caf50" }}>
              {queue.isActive ? "Disable Queue" : "Enable Queue"}
            </button>
          )}
        </div>
        {msg && <div style={s.flash}>{msg}</div>}
        <div style={s.servingCard}>
          <div>
            <div style={{ fontSize: 12, color: "#a89fd8" }}>Currently Serving</div>
            {current
              ? <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>#{String(current.queueNumber).padStart(3,"0")} <span style={{ fontSize: 13, fontWeight: 400, color: "#a89fd8" }}>{current.customer?.email}</span></div>
              : <div style={{ fontSize: 16, color: "#4a4080", fontWeight: 600 }}>No one currently serving</div>}
          </div>
          <div style={{ fontSize: 13, color: "#a89fd8" }}>{entries.length} waiting</div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button style={{ ...s.ghostBtn, flex: 1 }} onClick={() => current && complete(current._id)} disabled={!current}>✓ Complete</button>
          <button style={{ ...s.yellowBtn, flex: 1 }} onClick={callNext}>Serve Next</button>
        </div>
        <h3 style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 12 }}>Waiting List</h3>
        {entries.length === 0 ? <p style={s.muted}>No customers waiting.</p> : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>{["#","Email","Status","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e._id} style={s.tr}>
                    <td style={s.td}><b style={{ color: "#f5a623" }}>{String(e.queueNumber).padStart(3,"0")}</b></td>
                    <td style={s.td}>{e.customer?.email || "—"}</td>
                    <td style={s.td}>{statusBadge(e.status)}</td>
                    <td style={s.td}><button style={s.cancelBtnSm} onClick={() => remove(e._id)}>Cancel</button></td>
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

// ── MANAGE USERS ─────────────────────────────────────────────
function ManageUsers({ token }) {
  const [customers, setCustomers] = useState([]);
  const [staff,     setStaff]     = useState([]);
  const [depts,     setDepts]     = useState([]);
  const [tab,       setTab]       = useState("customers");
  const [form,      setForm]      = useState({ name:"",email:"",password:"",departmentId:"" });
  const [msg,       setMsg]       = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };

  const load = useCallback(async () => {
    const [c,st,d] = await Promise.all([
      api("/admin/customers","GET",null,token),
      api("/admin/staff","GET",null,token),
      api("/admin/departments","GET",null,token),
    ]);
    if (Array.isArray(c))  setCustomers(c);
    if (Array.isArray(st)) setStaff(st);
    if (Array.isArray(d))  setDepts(d);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const createStaff = async () => {
    if (!form.name||!form.email||!form.password||!form.departmentId) return flash("All fields are required");
    const res = await api("/admin/staff","POST",form,token);
    if (res.id) { flash(`Staff ${res.name} created!`); setForm({name:"",email:"",password:"",departmentId:""}); load(); }
    else flash(res.message);
  };

  const deleteStaff = async (id) => { await api(`/admin/staff/${id}`,"DELETE",null,token); flash("Staff removed"); load(); };

  return (
    <div style={s.main}>
      <div style={s.topBar}><span style={s.topBarTitle}>BananaQue</span></div>
      <div style={s.contentPad}>
        <h2 style={s.pageTitle}>👥 Manage Users</h2>
        {msg && <div style={s.flash}>{msg}</div>}
        <div style={s.tabRow}>
          {["customers","staff","create staff"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...s.tabBtn, ...(tab===t ? s.tabBtnActive : {}) }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
        {tab === "customers" && (
          <>
            <p style={s.muted}>{customers.length} registered customers</p>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Name","Email","Registered"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{customers.map(c=><tr key={c._id} style={s.tr}><td style={s.td}>{c.name}</td><td style={s.td}>{c.email}</td><td style={s.td}>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
        {tab === "staff" && (
          <>
            <p style={s.muted}>{staff.length} staff members</p>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Name","Email","Department","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>{staff.map(st=><tr key={st._id} style={s.tr}><td style={s.td}>{st.name}</td><td style={s.td}>{st.email}</td><td style={s.td}>{st.department?.name||"—"}</td><td style={s.td}><button style={s.cancelBtnSm} onClick={()=>deleteStaff(st._id)}>Remove</button></td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
        {tab === "create staff" && (
          <div style={{ maxWidth: 420 }}>
            <p style={{ ...s.muted, marginBottom: 16 }}>Create a new staff account and assign to a department.</p>
            <input placeholder="Full name" style={s.input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <input placeholder="Email" style={s.input} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            <input placeholder="Password" type="password" style={s.input} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
            <select style={s.input} value={form.departmentId} onChange={e=>setForm({...form,departmentId:e.target.value})}>
              <option value="">Select department</option>
              {depts.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <button style={{ ...s.yellowBtn, width:"100%", marginTop: 8 }} onClick={createStaff}>Create Staff Account</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MANAGE SERVICE ───────────────────────────────────────────
function ManageService({ token }) {
  const [queues, setQueues] = useState([]);
  const [msg,    setMsg]    = useState("");
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 4000); };
  const load = () => api("/queues","GET",null,token).then(d => { if (Array.isArray(d)) setQueues(d); });
  useEffect(() => { load(); }, [token]);

  const toggle = async (q) => { await api(`/queues/${q._id}`,"PUT",{isActive:!q.isActive},token); flash(`${q.department?.name} queue ${!q.isActive?"enabled":"disabled"}`); load(); };
  const reset  = async (q) => { await api(`/queues/${q._id}/reset`,"POST",null,token); flash(`${q.department?.name} queue reset`); load(); };

  return (
    <div style={s.main}>
      <div style={s.topBar}><span style={s.topBarTitle}>BananaQue</span></div>
      <div style={s.contentPad}>
        <h2 style={s.pageTitle}>⚙ Manage Service</h2>
        <p style={s.pageSubtitle}>Enable or disable department queues.</p>
        {msg && <div style={s.flash}>{msg}</div>}
        {queues.map(q => {
          const dname = q.department?.name || "Queue";
          return (
            <div key={q._id} style={{ ...s.servingCard, marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{DEPT_ICONS[dname]} {dname}</div>
                <div style={{ fontSize: 12, color: "#a89fd8", marginTop: 4 }}>
                  Status: <b style={{ color: q.isActive ? "#4caf50" : "#e53e3e" }}>{q.isActive ? "Active" : "Disabled"}</b>
                  &nbsp;|&nbsp; Current: #{q.currentNumber} &nbsp;|&nbsp; Next: #{q.nextNumber}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...s.ghostBtn, fontSize: 12 }} onClick={() => reset(q)}>Reset</button>
                <button onClick={() => toggle(q)} style={{ ...s.ghostBtn, fontSize: 12, borderColor: q.isActive ? "#e53e3e" : "#4caf50", color: q.isActive ? "#e53e3e" : "#4caf50" }}>
                  {q.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DEMO MOCK DATA ───────────────────────────────────────────
const DEMO_USERS = {
  "customer@demo.com": { _id: "c1", name: "Demo Customer", email: "customer@demo.com", role: "customer" },
  "staff@demo.com":    { _id: "s1", name: "Demo Staff",    email: "staff@demo.com",    role: "staff", department: { name: "Cashier" } },
  "admin@demo.com":    { _id: "a1", name: "Demo Admin",    email: "admin@demo.com",    role: "admin" },
};
const DEMO_TOKEN = "demo-token-preview";

// ── Log In and Sign Up Screen ──────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"",email:"",password:"",confirm:"" });
  const [msg,  setMsg]  = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.email || !form.password) return setMsg("Please fill in all fields");
    if (mode === "register" && form.password !== form.confirm) return setMsg("Passwords do not match");

    // ── demo shortcut (no backend needed) ──
    if (DEMO_USERS[form.email]) {
      return onLogin(DEMO_TOKEN, DEMO_USERS[form.email]);
    }

    setBusy(true);
    const path = mode === "login" ? "/auth/login" : "/auth/register";
    const body = mode === "login"
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };
    const data = await api(path, "POST", body);
    setBusy(false);
    if (data.token) onLogin(data.token, data.user);
    else setMsg(data.message || "Cannot connect to server. Try a demo account below.");
  };

  return (
    <div style={s.authWrap}>
      <div style={s.authCard}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 800, fontSize: 26, color: "#fff", letterSpacing: 0.5 }}>BananaQue</div>
          <div style={{ color: "#a89fd8", fontSize: 13, marginTop: 4 }}>
            {mode === "login" ? "Sign in to continue" : "Create your account"}
          </div>
        </div>

        {mode === "register" && (
          <>
            <label style={s.label}>Username</label>
            <input placeholder="Your username" style={s.input} value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
          </>
        )}

        <label style={s.label}>Email</label>
        <input placeholder="you@example.com" style={s.input} value={form.email}
          onChange={e => setForm({...form, email: e.target.value})} />

        <label style={s.label}>Password</label>
        <input placeholder={mode === "register" ? "Min. 6 characters" : "••••••"} type="password" style={s.input}
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          onKeyDown={e => e.key === "Enter" && submit()} />

        {mode === "register" && (
          <>
            <label style={s.label}>Confirm Password</label>
            <input placeholder="••••••" type="password" style={s.input} value={form.confirm}
              onChange={e => setForm({...form, confirm: e.target.value})}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </>
        )}

        {msg && <div style={{ color: "#e57373", fontSize: 13, marginBottom: 12 }}>{msg}</div>}

        <button style={{ ...s.yellowBtn, width: "100%", marginTop: 4 }} onClick={submit} disabled={busy}>
          {busy ? "Please wait..." : mode === "login" ? "Login" : "Sign In"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button style={{ background: "none", border: "none", color: "#f5a623", fontSize: 13, cursor: "pointer" }}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(""); }}>
            {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
          </button>
        </div>


      </div>
    </div>
  );
}

// ── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("bq_token") || "");
  const [user,  setUser]  = useState(null);
  const [page,  setPage]  = useState("dashboard");

  useEffect(() => {
    if (!token) return;
    if (token === DEMO_TOKEN) return; // demo mode — user already set at login
    api("/auth/me", "GET", null, token).then(data => {
      if (data._id) setUser(data);
      else { setToken(""); localStorage.removeItem("bq_token"); }
    });
  }, [token]);

  const handleLogin = (t, u) => {
    localStorage.setItem("bq_token", t);
    setToken(t); setUser(u); setPage("dashboard");
  };

  const handleLogout = () => {
    setToken(""); setUser(null); setPage("dashboard");
    localStorage.removeItem("bq_token");
  };

  if (!token || !user) return <AuthScreen onLogin={handleLogin} />;

  const renderPage = () => {
    if (user.role === "customer") {
      if (page === "history") return <CustomerHistory token={token} />;
      return <CustomerDashboard token={token} user={user} setPage={setPage} onLogout={handleLogout} />;
    }
    if (user.role === "staff") return <StaffDashboard token={token} user={user} />;
    if (user.role === "admin") {
      if (page === "cashier")  return <AdminQueuePage token={token} deptName="Cashier" />;
      if (page === "clinic")   return <AdminQueuePage token={token} deptName="Clinic" />;
      if (page === "auditing") return <AdminQueuePage token={token} deptName="Auditing" />;
      if (page === "users")    return <ManageUsers token={token} />;
      if (page === "service")  return <ManageService token={token} />;
      return <AdminDashboard token={token} />;
    }
    return <div style={s.main}><p>Unknown role</p></div>;
  };

  return (
    <div style={s.app}>
      <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout} />
      <div style={{ flex: 1, overflowY: "auto" }}>{renderPage()}</div>
    </div>
  );
}

// ── STYLES ───────────────────────────────────────────────────
const DARK     = "#120f2e";
const PANEL    = "#1e1a4a";
const CARD     = "#2a2560";
const BORDER   = "#3b3475";
const YELLOW   = "#f5a623";
const TEXT     = "#ffffff";
const MUTED    = "#a89fd8";

const s = {
  // layout
  app:         { display: "flex", minHeight: "100vh", background: DARK, fontFamily: "'Segoe UI', system-ui, sans-serif" },
  authWrap:    { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: DARK },
  authCard:    { background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "40px 36px", width: 400 },

  // sidebar
  sidebar:      { width: 200, minHeight: "100vh", background: PANEL, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", padding: "0 0 16px" },
  sidebarLogo:  { padding: "22px 20px 18px", borderBottom: `1px solid ${BORDER}`, marginBottom: 8 },
  sidebarFooter:{ padding: "16px 20px", borderTop: `1px solid ${BORDER}` },
  navBtn:       { display: "flex", alignItems: "center", width: "100%", padding: "11px 20px", border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: MUTED, textAlign: "left" },
  navBtnActive: { background: "#2e2a6e", color: TEXT, fontWeight: 600 },
  signOutBtn:   { background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 12, padding: 0 },

  // page
  main:        { flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: DARK },
  topBar:      { background: PANEL, padding: "14px 28px", borderBottom: `1px solid ${BORDER}` },
  topBarTitle: { fontWeight: 800, fontSize: 16, color: TEXT },
  contentPad:  { padding: "28px 32px" },
  pageTitle:   { fontWeight: 700, fontSize: 22, color: TEXT, marginBottom: 4 },
  pageSubtitle:{ color: MUTED, fontSize: 13, marginBottom: 20 },
  muted:       { color: MUTED, fontSize: 13 },
  flash:       { background: "#3a3000", border: "1px solid #f5a623", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: YELLOW },

  // cards
  cardGrid:    { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 8 },
  cardGrid2:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  queueCard:   { background: CARD, border: `2px solid ${BORDER}`, borderRadius: 12, padding: "22px 14px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", textAlign: "center", transition: "border-color .15s" },
  overviewCard:{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, cursor: "pointer" },
  mgmtCard:    { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 22, cursor: "pointer" },
  entryCard:   { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, maxWidth: 480 },
  historyCard: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  servingCard: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },

  // join modal
  joinModal:   { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "22px 24px", maxWidth: 440, marginTop: 20, marginBottom: 8 },

  // tabs
  tabRow:      { display: "flex", gap: 4, marginBottom: 18, borderBottom: `1px solid ${BORDER}` },
  tabBtn:      { background: "transparent", border: "none", borderBottom: "2px solid transparent", padding: "8px 16px", cursor: "pointer", fontSize: 13, color: MUTED, marginBottom: -1 },
  tabBtnActive:{ color: YELLOW, borderBottomColor: YELLOW, fontWeight: 600 },

  // forms
  label:       { display: "block", fontSize: 12, color: MUTED, marginBottom: 5, fontWeight: 500, textAlign: "left" },
  input:       { display: "block", width: "100%", padding: "10px 12px", marginBottom: 14, background: "#0f0d28", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, color: TEXT, boxSizing: "border-box", outline: "none" },

  // buttons
  yellowBtn:   { background: YELLOW, color: "#1a1400", border: "none", padding: "11px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700 },
  ghostBtn:    { background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 },
  cancelBtn:   { background: "#c0392b", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  cancelBtnSm: { background: "transparent", color: "#e57373", border: "1px solid #e57373", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 },

  // table
  tableWrap:   { overflowX: "auto", borderRadius: 10, border: `1px solid ${BORDER}` },
  table:       { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:          { padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: .5, background: CARD, borderBottom: `1px solid ${BORDER}` },
  tr:          { borderBottom: `1px solid ${BORDER}` },
  td:          { padding: "12px 14px", color: TEXT },
};