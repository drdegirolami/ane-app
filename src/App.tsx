import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Patient pages
import Index from "./pages/Index";
import Planning from "./pages/Planning";
import Checkin from "./pages/Checkin";
import Situaciones from "./pages/Situaciones";
import Mensaje from "./pages/Mensaje";
import Info from "./pages/Info";
import Ajustes from "./pages/Ajustes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPacientes from "./pages/admin/AdminPacientes";
import AdminContenidos from "./pages/admin/AdminContenidos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth Route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Patient Routes - Protected */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute><Planning /></ProtectedRoute>} />
              <Route path="/checkin" element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
              <Route path="/situaciones" element={<ProtectedRoute><Situaciones /></ProtectedRoute>} />
              <Route path="/mensaje" element={<ProtectedRoute><Mensaje /></ProtectedRoute>} />
              <Route path="/info" element={<ProtectedRoute><Info /></ProtectedRoute>} />
              <Route path="/ajustes" element={<ProtectedRoute><Ajustes /></ProtectedRoute>} />
              
              {/* Admin Routes - Protected + Admin Only */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="pacientes" element={<AdminPacientes />} />
                <Route path="contenidos" element={<AdminContenidos />} />
                <Route path="planning" element={<AdminDashboard />} />
                <Route path="mensajes" element={<AdminDashboard />} />
                <Route path="situaciones" element={<AdminDashboard />} />
                <Route path="ajustes" element={<AdminDashboard />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
