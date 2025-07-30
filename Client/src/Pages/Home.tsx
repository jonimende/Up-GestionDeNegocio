import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const adminStr = localStorage.getItem("admin");
  const esAdmin = adminStr === "true";

  const handleAgregarVenta = () => {
    navigate("/ventas/nuevo");
  };

  const handleVerNotas = () => {
    navigate("/notas");
  };

  const handleAgregarStock = () => {
    navigate("/stock/nuevo");
  };

  const handleAdminVentas = () => {
    navigate("/admin/ventas");
  };

  const handleControlStock = () => {
    navigate("/control-stock");
  };

  // Nuevo handler para caja
  const handleCaja = () => {
    navigate("/ventas/caja");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
      <Typography variant="h3" gutterBottom>
        Bienvenido al Home Privado
      </Typography>

      <Box sx={{ mt: 4, display: "flex", flexDirection: "column", gap: 2 }}>
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

            {/* Botón nuevo para Caja */}
            <Button
              variant="contained"
              color="warning"
              size="large"
              onClick={handleCaja}
            >
              Caja Diaria/Mensual
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
};

export default Home;
