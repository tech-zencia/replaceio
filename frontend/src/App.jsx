import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import Auth from "./pages/Auth";
import DashboardLayout from "./layouts/DashboardLayout";
import Home from "./pages/dashboard/Home";
import Agent from "./pages/dashboard/Agent";
import MyListings from "./pages/dashboard/MyListings";
import SavedProperties from "./pages/dashboard/SavedProperties";
import Settings from "./pages/dashboard/Settings";
import PropertyDetail from "./pages/dashboard/PropertyDetail";

function Guard({ children }) {
  const { user } = useAuthStore();
  const location = useLocation();
  return user ? children : <Navigate to="/auth" state={{ from: location }} replace />;
}

function AuthGuard({ mode = "login" }) {
  const { user } = useAuthStore();
  return user ? <Navigate to="/" replace /> : <Auth key={mode} initialMode={mode} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{ className: "text-sm font-medium", duration: 3000 }}
      />
      <Routes>
        <Route path="/auth" element={<AuthGuard />} />
        <Route path="/login" element={<AuthGuard />} />
        <Route path="/register" element={<AuthGuard mode="register" />} />
        <Route path="/" element={<Guard><DashboardLayout /></Guard>}>
          <Route index element={<Home />} />
          <Route path="my-listings" element={<MyListings />} />
          <Route path="agent" element={<Agent />} />
          <Route path="saved" element={<SavedProperties />} />
          <Route path="settings" element={<Settings />} />
          <Route path="property/:id" element={<PropertyDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
