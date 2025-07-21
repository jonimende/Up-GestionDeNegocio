import React from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleAgregarVenta = () => {
    navigate("/ventas/nuevo");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
      <Typography variant="h3" gutterBottom>
        Bienvenido al Home Privado
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleAgregarVenta}
        >
          Agregar Venta
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
