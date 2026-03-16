import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts
// import PublicLayout from './components/PublicLayout';
// import AdminLayout from './components/AdminLayout';

// Public pages
import Dashboard from "./pages/Dashboard";
import IssueDetail from "./pages/IssueDetail";
import ReportIssue from "./pages/ReportIssue";
import UserProfile from "./pages/UserProfile";
import AdvancedSearch from "./pages/AdvancedSearch";
import Bookmarks from "./pages/Bookmarks";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Donate from "./pages/Donate";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminIssues from "./pages/admin/AdminIssues";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDonations from "./pages/admin/AdminDonations";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminActivityLog from "./pages/admin/AdminActivityLog";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="issues/:id" element={<IssueDetail />} />
            <Route path="report" element={<ReportIssue />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="search" element={<AdvancedSearch />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="donate" element={<Donate />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="activity" element={<AdminActivityLog />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
