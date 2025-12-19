import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Patient pages
import Index from "./pages/Index";
import Planning from "./pages/Planning";
import Checkin from "./pages/Checkin";
import Situaciones from "./pages/Situaciones";
import Mensaje from "./pages/Mensaje";
import Info from "./pages/Info";
import Ajustes from "./pages/Ajustes";
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Patient Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/situaciones" element={<Situaciones />} />
            <Route path="/mensaje" element={<Mensaje />} />
            <Route path="/info" element={<Info />} />
            <Route path="/ajustes" element={<Ajustes />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
