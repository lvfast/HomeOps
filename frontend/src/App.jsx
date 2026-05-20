import { Link, NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.jsx";
import PublicStatusPage from "./pages/PublicStatusPage.jsx";
import ServiceDetailPage from "./pages/ServiceDetailPage.jsx";

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">H</span>
          <span>
            <strong>HomeOps</strong>
            <small>Mini SRE dashboard</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/public-status">Public status</NavLink>
        </nav>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/service/:id" element={<ServiceDetailPage />} />
          <Route path="/public-status" element={<PublicStatusPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
