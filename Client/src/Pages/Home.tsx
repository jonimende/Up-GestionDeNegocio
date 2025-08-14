import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Importar íconos de Material UI
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import InventoryIcon from "@mui/icons-material/Inventory";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StoreIcon from "@mui/icons-material/Store";
import NotesIcon from "@mui/icons-material/Notes";
import BuildIcon from "@mui/icons-material/Build";

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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authenticated) return null;

  // Handlers de navegación
  const handleAgregarVenta = () => navigate("/ventas/nuevo");
  const handleVerNotas = () => navigate("/notas");
  const handleAgregarStock = () => navigate("/stock/nuevo");
  const handleAdminVentas = () => navigate("/admin/ventas");
  const handleControlStock = () => navigate("/control-stock");
  const handleCaja = () => navigate("/ventas/caja");
  const handleAgregarReparacion = () => navigate("/admin/reparaciones");

  // Función para renderizar botones con ícono y animación hover
  const SidebarButton = ({
    text,
    icon,
    onClick,
    color = "primary",
    variant = "contained",
  }: {
    text: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: "primary" | "secondary" | "error" | "success" | "warning" | "info";
    variant?: "contained" | "outlined";
  }) => (
    <Button
      startIcon={icon}
      variant={variant}
      color={color}
      onClick={onClick}
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        transition: "all 0.3s",
        "&:hover": {
          transform: "translateX(5px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        },
      }}
    >
      {text}
    </Button>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh", fontFamily: "'Montserrat', sans-serif" }}>
      {/* Sidebar izquierdo */}
      <Box
        sx={{
          width: 220,
          bgcolor: "#f0f0f0",
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        }}
      >
        <SidebarButton text="Agregar Venta" icon={<AddShoppingCartIcon />} onClick={handleAgregarVenta} />
        <SidebarButton text="Caja Diaria/Mensual" icon={<ReceiptIcon />} onClick={handleCaja} color="warning" />
        {isAdmin && (
          <>
            <SidebarButton text="Ver Notas" icon={<NotesIcon />} onClick={handleVerNotas} variant="outlined" color="secondary" />
            <SidebarButton text="Agregar Stock" icon={<InventoryIcon />} onClick={handleAgregarStock} color="success" />
            <SidebarButton text="Administración de Ventas" icon={<AdminPanelSettingsIcon />} onClick={handleAdminVentas} color="error" />
            <SidebarButton text="Control de Stock" icon={<StoreIcon />} onClick={handleControlStock} color="info" />
            <SidebarButton text="Agregar Reparación" icon={<BuildIcon />} onClick={handleAgregarReparacion} color="secondary" />
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
              fontSize: { xs: "12rem", sm: "14rem" },
              fontWeight: "900",
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
              fontSize: { xs: "12rem", sm: "14rem" },
              fontWeight: "900",
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
              fontWeight: "medium",
              color: "#555",
              mt: 2,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: "1.2rem",
              userSelect: "none",
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
