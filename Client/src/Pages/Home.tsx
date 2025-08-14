import React, { useEffect, useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: number;
  nombre: string;
  admin: boolean;
  exp: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verificarToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        setIsAdmin(decoded.admin);
        setAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    verificarToken();
  }, [navigate]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (!authenticated) return null;

  const handleAgregarVenta = () => navigate("/ventas/nuevo");
  const handleVerNotas = () => navigate("/notas");
  const handleAgregarStock = () => navigate("/stock/nuevo");
  const handleAdminVentas = () => navigate("/admin/ventas");
  const handleControlStock = () => navigate("/control-stock");
  const handleCaja = () => navigate("/ventas/caja");
  const handleAgregarReparacion = () => navigate("/admin/reparaciones");

  // Botón del sidebar
  const SidebarButton = ({
    text,
    onClick,
    color = "#1976d2",
  }: {
    text: string;
    onClick: () => void;
    color?: string;
  }) => (
    <Button
      onClick={onClick}
      fullWidth
      sx={{
        bgcolor: color,
        color: "#fff",
        textTransform: "none",
        fontWeight: 600,
        py: 1.5,
        mb: 1.5,
        borderRadius: 2,
        "&:hover": { bgcolor: "#115293", transform: "translateX(5px)" },
      }}
    >
      {text}
    </Button>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh", fontFamily: "'Montserrat', sans-serif" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 220,
          bgcolor: "#f0f0f0",
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <SidebarButton text="Agregar Venta" onClick={handleAgregarVenta} />
        <SidebarButton text="Caja Diaria/Mensual" onClick={handleCaja} color="#ff9800" />
        {isAdmin && (
          <>
            <SidebarButton text="Ver Notas" onClick={handleVerNotas} color="#9c27b0" />
            <SidebarButton text="Agregar Stock" onClick={handleAgregarStock} color="#4caf50" />
            <SidebarButton text="Administración de Ventas" onClick={handleAdminVentas} color="#f44336" />
            <SidebarButton text="Control de Stock" onClick={handleControlStock} color="#03a9f4" />
            <SidebarButton text="Agregar Reparación" onClick={handleAgregarReparacion} color="#9e9e9e" />
          </>
        )}
      </Box>

      {/* Contenido central */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)",
        }}
      >
        <Box sx={{ textAlign: "center", userSelect: "none" }}>
          <Typography
            component="span"
            sx={{
              fontSize: { xs: "10rem", sm: "12rem" },
              fontWeight: 900,
              color: "#000",
              lineHeight: 1,
              transform: "translateY(-20%)",
            }}
          >
            U
          </Typography>
          <Typography
            component="span"
            sx={{
              fontSize: { xs: "10rem", sm: "12rem" },
              fontWeight: 900,
              color: "#000",
              lineHeight: 1,
              transform: "translateY(20%)",
            }}
          >
            P
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 500,
              color: "#555",
              mt: 2,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: "1.2rem",
            }}
          >
            accesorios
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
