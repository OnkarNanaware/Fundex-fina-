import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth + registration
import RoleLogin from "./pages/RoleLogin";
import AdminRegistration from "./pages/AdminRegistration";
import DonorRegistration from "./pages/DonorRegistration";
import VolunteerRegistration from "./pages/VolunteerRegistration";
import WaitingForApproval from "./pages/WaitingForApproval";

// Dashboards and admin pages
import VolunteerDashboard from "./Volunteer Dashboard/VolunteerDashboard";
import DonorDashboard from "./Donor Dashboard/DonorDashboard";
import VolunteerRequest from "./pages/VolunteerRequest";
import AdminPanel from "./pages/AdminPanel";
import AdminExpenses from "./pages/AdminExpenses";
import FraudAlerts from "./pages/FraudAlerts";
import AdminDashboard from "./Admin Dashboard/AdminDashboard";
import AdminRegistrationWithVerification from "./pages/AdminRegistrationWithVerification";
// Other pages
import ChooseRole from "./pages/ChooseRole";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page */}
        <Route
          path="/"
          element={
            <iframe
              src="/homepage.html"
              style={{
                width: "100vw",
                height: "100vh",
                border: "none",
                overflow: "hidden",
              }}
              title="Fundex Home"
            />
          }
        />

        {/* Choose role before login/registration */}
        <Route path="/choose-role" element={<ChooseRole />} />

        {/* Login (role-based) */}
        <Route path="/login" element={<RoleLogin />} />

        {/* Registration */}
        {/* Registration */}

        <Route path="/register/admin" element={<AdminRegistrationWithVerification />} />
        <Route path="/register/donor" element={<DonorRegistration />} />
        <Route path="/register/volunteer" element={<VolunteerRegistration />} />

        {/* Volunteer side */}
        <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        <Route path="/volunteer/request" element={<VolunteerRequest />} />
        <Route path="/volunteer/waiting" element={<WaitingForApproval />} />

        {/* Admin side */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/expenses" element={<AdminExpenses />} />
        <Route path="/admin/fraud" element={<FraudAlerts />} />

        {/* Donor side */}
        <Route path="/donor/dashboard" element={<DonorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
