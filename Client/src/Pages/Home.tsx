import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authenticated) {
    // En teoría nunca debería llegar acá porque redirigimos arriba,
    // pero por seguridad mostramos nada o mensaje.
    return null;
  }

  const handleAgregarVenta = () => navigate("/ventas/nuevo");
  const handleVerNotas = () => navigate("/notas");
  const handleAgregarStock = () => navigate("/stock/nuevo");
  const handleAdminVentas = () => navigate("/admin/ventas");
  const handleControlStock = () => navigate("/control-stock");
  const handleCaja = () => navigate("/ventas/caja");
  const handleAgregarReparacion = () => navigate("/admin/reparaciones");

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: 8,
        textAlign: "center",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.3,
          mb: 6,
          justifyContent: "center",
          userSelect: "none",
        }}
      >
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
            mt: "20px",
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: "1rem",
            ml: 0.5,
            userSelect: "none",
          }}
        >
          accesorios
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxWidth: 400,
          mx: "auto",
        }}
      >
        {/* Este botón siempre se muestra para todos los usuarios autenticados */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleAgregarVenta}
        >
          Agregar Venta
        </Button>

        {/* Estos botones sólo se muestran si es admin */}
        <Button
            variant="contained"
            color="warning"
            size="large"
            onClick={handleCaja}
            >
            Caja Diaria/Mensual
        </Button>
        {isAdmin && (
          <>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={handleVerNotas}
            >
              Ver Notas
            </Button>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleAgregarStock}
            >
              Agregar Stock
            </Button>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleAdminVentas}
            >
              Administración de Ventas
            </Button>
            <Button
              variant="contained"
              color="info"
              size="large"
              onClick={handleControlStock}
            >
              Control de Stock
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={handleAgregarReparacion}
            >
              Agregar Reparación
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Home;
