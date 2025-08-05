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

interface CurrencyResponse {
  data: {
    ARS: {
      value: number;
    };
  };
}

const Caja = () => {
  const [tipo, setTipo] = useState<"diaria" | "mensual">("diaria");
  const [metodoPago, setMetodoPago] = useState<
    "Efectivo" | "Transferencia" | "Todos"
  >("Todos");
  const [total, setTotal] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para conversión a ARS
  const [totalEnPesos, setTotalEnPesos] = useState<number | null>(null);
  const [tasaCambio, setTasaCambio] = useState<number | null>(null); // <-- nueva variable para tasa
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [errorConversion, setErrorConversion] = useState<string | null>(null);

  const obtenerCaja = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get<ResCaja>(
        "http://localhost:3001/ventas/caja/consulta",
        {
          params: { tipo, metodoPago },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTotal(res.data.total);
      setCantidad(res.data.cantidad);
      setError(null);
      setTotalEnPesos(null); // Resetea la conversión si actualiza el total
      setTasaCambio(null); // Resetea tasa también
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

  const consultarDolar = async () => {
    setConvirtiendo(true);
    setErrorConversion(null);
    try {
      const response = await axios.get<CurrencyResponse>(
        "https://api.currencyapi.com/v3/latest",
        {
          params: {
            apikey: process.env.REACT_APP_CURRENCY_API_KEY,
            base_currency: "USD",
            currencies: "ARS",
          },
        }
      );

      const tasa = response.data.data.ARS.value;
      setTasaCambio(tasa); // guardo la tasa
      const resultado = total * tasa;
      setTotalEnPesos(resultado);
    } catch (err) {
      console.error(err);
      setErrorConversion("Error al obtener la cotización del dólar.");
    } finally {
      setConvirtiendo(false);
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
          Total generado (USD): <strong>${total.toFixed(2)}</strong>
        </Typography>

        {totalEnPesos !== null && tasaCambio !== null && (
          <Typography
            variant="h6"
            align="center"
            sx={{ color: "green", mt: 1 }}
          >
            Total en pesos (ARS): <strong>${totalEnPesos.toFixed(2)}</strong> {" "}
            <br />
            <small>Tasa de cambio usada: {tasaCambio.toFixed(4)} ARS / USD</small>
          </Typography>
        )}

        {errorConversion && (
          <Typography variant="body2" color="error" align="center" mt={1}>
            {errorConversion}
          </Typography>
        )}

        <Typography variant="subtitle1" align="center">
          Ventas realizadas: {cantidad}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" gap={2} mt={4}>
        <Button variant="contained" color="primary" onClick={obtenerCaja}>
          Actualizar
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={consultarDolar}
          disabled={convirtiendo}
        >
          {convirtiendo ? "Consultando..." : "Consultar precio en pesos"}
        </Button>
      </Box>
    </Paper>
  );
};

export default Caja;
