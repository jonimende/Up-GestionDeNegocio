import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";

interface DecodedToken {
  admin: boolean;
}

interface ResCaja {
  total: number;
  cantidad: number;
}

const Caja = () => {
  const [tipo, setTipo] = useState<"diaria" | "mensual">("diaria");
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Transferencia" | "Todos">("Todos");
  const [total, setTotal] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const obtenerCaja = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get<ResCaja>("http://localhost:3001/ventas/caja/consulta", {
        params: { tipo, metodoPago },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotal(res.data.total);
      setCantidad(res.data.cantidad);
      setError(null);
    } catch (err: unknown) {
      const error = err as any;
      if (error?.isAxiosError) {
        console.error("Axios error:", error.response?.data || error.message);
        setError(error.response?.data?.error || "Error desde el servidor");
      } else {
        console.error("Error inesperado:", error);
        setError("Ocurrió un error inesperado.");
      }
    }
  };

  useEffect(() => {
    const verificarAdminYObtenerCaja = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded.admin) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        await obtenerCaja();
      } catch (err) {
        console.error("Error verificando admin:", err);
        setIsAdmin(false);
        setError("Error validando token");
      } finally {
        setLoading(false);
      }
    };

    verificarAdminYObtenerCaja();
  }, [tipo, metodoPago]);

  if (!isAdmin) {
    return (
      <Typography color="error" align="center" sx={{ mt: 6 }}>
        Acceso denegado
      </Typography>
    );
  }

  if (loading) {
    return (
      <Box textAlign="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        maxWidth: 600,
        mx: "auto",
        mt: 5,
        borderRadius: 3,
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <Typography
        variant="h5"
        gutterBottom
        align="center"
        sx={{ color: "#1565c0", fontWeight: "bold" }}
      >
        Caja {tipo === "diaria" ? "Diaria" : "Mensual"}
      </Typography>

      {error && (
        <Typography color="error" variant="body2" align="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box display="flex" gap={2} mt={3}>
        <FormControl fullWidth>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={tipo}
            label="Tipo"
            onChange={(e) => setTipo(e.target.value as any)}
          >
            <MenuItem value="diaria">Diaria</MenuItem>
            <MenuItem value="mensual">Mensual</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Método de Pago</InputLabel>
          <Select
            value={metodoPago}
            label="Método de Pago"
            onChange={(e) => setMetodoPago(e.target.value as any)}
          >
            <MenuItem value="Todos">Todos</MenuItem>
            <MenuItem value="Efectivo">Efectivo</MenuItem>
            <MenuItem value="Transferencia">Transferencia</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" align="center">
          Total generado: <strong>${total.toFixed(2)}</strong>
        </Typography>
        <Typography variant="subtitle1" align="center">
          Ventas realizadas: {cantidad}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" mt={4}>
        <Button variant="contained" color="primary" onClick={obtenerCaja}>
          Actualizar
        </Button>
      </Box>
    </Paper>
  );
};

export default Caja;
