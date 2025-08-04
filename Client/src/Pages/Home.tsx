import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const adminStr = localStorage.getItem("admin");
  const esAdmin = adminStr === "true";

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
      {/* Título principal con U y P grandes y desplazadas */}
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
        {/* U muy grande y más arriba */}
        <Typography
          component="span"
          sx={{
            fontSize: { xs: "12rem", sm: "14rem" },
            fontWeight: "900",
            color: "#000",
            lineHeight: 1,
            display: "inline-block",
            transform: "translateY(-20%)",
          }}
        >
          U
        </Typography>

        {/* P muy grande y más abajo */}
        <Typography
          component="span"
          sx={{
            fontSize: { xs: "12rem", sm: "14rem" },
            fontWeight: "900",
            color: "#000",
            lineHeight: 1,
            display: "inline-block",
            transform: "translateY(20%)",
          }}
        >
          P
        </Typography>

        {/* Accesorios pegado y alineado */}
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
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleAgregarVenta}
        >
          Agregar Venta
        </Button>

        {esAdmin && (
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
              color="warning"
              size="large"
              onClick={handleCaja}
            >
              Caja Diaria/Mensual
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
