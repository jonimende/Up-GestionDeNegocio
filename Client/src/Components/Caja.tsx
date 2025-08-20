import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  TextField,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Container,
} from "@mui/material";
import { Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";

interface DecodedToken {
  admin: boolean;
  id: number;
}

interface ResCaja {
  total: number;
  cantidad: number;
  celulares?: { total: number; cantidad: number };
  accesorios?: { total: number; cantidad: number };
}

interface Movimiento {
  id: number;
  tipoMovimiento: "gasto" | "retiro";
  monto: number;
  metodoPago: string;
  descripcion: string;
  fecha: string;
  usuarioId: number;
}

interface CurrencyResponse {
  data: { ARS: { value: number } };
}

const Caja: React.FC = () => {
  const navigate = useNavigate();

  // Estados principales
  const [tipo, setTipo] = useState<"diaria" | "mensual">("diaria");
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Transferencia" | "Todos">("Todos");
  const [total, setTotal] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(0);
  const [celularesData, setCelularesData] = useState({ total: 0, cantidad: 0 });
  const [accesoriosData, setAccesoriosData] = useState({ total: 0, cantidad: 0 });
  const [balance, setBalance] = useState<number>(0);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEnPesos, setTotalEnPesos] = useState<number | null>(null);
  const [tasaCambio, setTasaCambio] = useState<number | null>(null);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [errorConversion, setErrorConversion] = useState<string | null>(null);

  // Movimientos
  const [tipoMovimiento, setTipoMovimiento] = useState<"gasto" | "retiro">("gasto");
  const [montoMovimiento, setMontoMovimiento] = useState<number>(0);
  const [metodoPagoMovimiento, setMetodoPagoMovimiento] = useState<"Efectivo" | "Transferencia">("Efectivo");
  const [descripcionMovimiento, setDescripcionMovimiento] = useState<string>("");
  const [movimientoError, setMovimientoError] = useState<string | null>(null);
  const [movimientoSuccess, setMovimientoSuccess] = useState<string | null>(null);
  const [enviandoMovimiento, setEnviandoMovimiento] = useState(false);

  // Admin y JWT
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Eliminación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Cálculo total neto
  const totalMovimientos = movimientos.reduce((acc, mov) => acc + mov.monto, 0);
  const totalNeto = total - totalMovimientos;

  // Pie chart
  const pieData = {
    labels: ["Celulares", "Accesorios"],
    datasets: [
      {
        data: [celularesData.total, accesoriosData.total],
        backgroundColor: ["#1565c0", "#ff9800"],
      },
    ],
  };

  // Funciones API
  const obtenerCaja = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get<ResCaja>(
        "https://up-gestiondenegocio-production.up.railway.app/ventas/caja/consulta",
        {
          params: { tipo, metodoPago },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTotal(res.data.total);
      setCantidad(res.data.cantidad);
      setCelularesData(res.data.celulares || { total: 0, cantidad: 0 });
      setAccesoriosData(res.data.accesorios || { total: 0, cantidad: 0 });
      setError(null);
      setTotalEnPesos(null);
      setTasaCambio(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al obtener la caja.");
    }
  };

  const obtenerMovimientos = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get<Movimiento[]>(
        "https://up-gestiondenegocio-production.up.railway.app/caja/movimientos",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMovimientos(res.data.map((mov) => ({ ...mov, monto: Number(mov.monto) })));
    } catch (err) {
      console.error("Error cargando movimientos:", err);
    }
  };

  const obtenerBalance = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get<{ balance: number }>(
        "https://up-gestiondenegocio-production.up.railway.app/caja/movimientos/balance",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(res.data.balance);
    } catch (err) {
      console.error("Error obteniendo balance:", err);
    }
  };

  const agregarMovimiento = async () => {
    if (montoMovimiento <= 0) return setMovimientoError("El monto debe ser mayor que cero");
    if (!descripcionMovimiento.trim()) return setMovimientoError("La descripción es obligatoria");
    setMovimientoError(null);
    setMovimientoSuccess(null);
    setEnviandoMovimiento(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setMovimientoError("No estás autenticado");
      setEnviandoMovimiento(false);
      return;
    }

    try {
      await axios.post(
        "https://up-gestiondenegocio-production.up.railway.app/caja/movimientos",
        {
          tipoMovimiento,
          monto: montoMovimiento,
          metodoPago: metodoPagoMovimiento,
          descripcion: descripcionMovimiento,
          usuarioId: userId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMovimientoSuccess("Movimiento agregado correctamente");
      setMontoMovimiento(0);
      setDescripcionMovimiento("");
      await obtenerCaja();
      await obtenerMovimientos();
      await obtenerBalance();
    } catch (err) {
      setMovimientoError("Error al agregar movimiento");
    } finally {
      setEnviandoMovimiento(false);
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
      setTasaCambio(tasa);
      setTotalEnPesos(totalNeto * tasa);
    } catch (err) {
      setErrorConversion("Error al obtener la cotización del dólar.");
    } finally {
      setConvirtiendo(false);
    }
  };

  const handleEliminarClick = (id: number) => {
    setMovimientoAEliminar(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (movimientoAEliminar === null) return;
    setEliminando(true);
    setConfirmOpen(false);

    const token = localStorage.getItem("token");
    if (!token) {
      setSnackbar({ open: true, message: "No estás autenticado", severity: "error" });
      setEliminando(false);
      return;
    }

    try {
      await axios.delete(
        `https://up-gestiondenegocio-production.up.railway.app/caja/movimientos/${movimientoAEliminar}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: "Movimiento eliminado correctamente", severity: "success" });
      await obtenerMovimientos();
      await obtenerCaja();
      await obtenerBalance();
    } catch (err) {
      setSnackbar({ open: true, message: "No se pudo eliminar el movimiento", severity: "error" });
    } finally {
      setEliminando(false);
      setMovimientoAEliminar(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setMovimientoAEliminar(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Inicialización JWT y datos
  useEffect(() => {
    const verificarAdminYObtenerDatos = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setIsAdmin(decoded.admin);
        setUserId(decoded.id || null);
        if (!decoded.admin && tipo !== "diaria") setTipo("diaria");
        await obtenerCaja();
        await obtenerMovimientos();
        await obtenerBalance();
        setError(null);
      } catch (err) {
        setIsAdmin(false);
        setError("Error validando token");
      } finally {
        setLoading(false);
      }
    };

    verificarAdminYObtenerDatos();
  }, [tipo]);

  // Render
  if (loading) return <Box textAlign="center" mt={6}><CircularProgress /></Box>;
  if (!isAdmin && tipo !== "diaria")
    return <Typography color="error" align="center" sx={{ mt: 6 }}>Acceso denegado a caja mensual.</Typography>;
  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" sx={{ color: "#1565c0", fontWeight: "bold", mb: 3 }}>
          Caja {tipo === "diaria" ? "Diaria" : "Mensual"}
        </Typography>

        {error && <Typography color="error" align="center">{error}</Typography>}

        <Box display="flex" gap={2} mt={2}>
          <FormControl fullWidth disabled={!isAdmin}>
            <InputLabel>Tipo</InputLabel>
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
              <MenuItem value="diaria">Diaria</MenuItem>
              <MenuItem value="mensual">Mensual</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Método de Pago</InputLabel>
            <Select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as any)}>
              <MenuItem value="Todos">Todos</MenuItem>
              <MenuItem value="Efectivo">Efectivo</MenuItem>
              <MenuItem value="Transferencia">Transferencia</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isAdmin && (
          <Box mt={4} textAlign="center">
            <Typography variant="h6">Total generado (USD): <strong>${total.toFixed(2)}</strong></Typography>
            <Typography>Celulares: <strong>${celularesData.total.toFixed(2)}</strong> ({celularesData.cantidad} ventas)</Typography>
            <Typography>Accesorios: <strong>${accesoriosData.total.toFixed(2)}</strong> ({accesoriosData.cantidad} ventas)</Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>Total neto (USD): <strong>${totalNeto.toFixed(2)}</strong></Typography>
            {totalEnPesos && tasaCambio && (
              <Typography sx={{ color: "green" }}>Total en pesos: <strong>${totalEnPesos.toFixed(2)}</strong> (Tasa: {tasaCambio})</Typography>
            )}
            <Typography sx={{ mt: 1 }}>Ventas realizadas: {cantidad}</Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>Balance actual: <strong>${balance.toFixed(2)}</strong> USD</Typography>

            {/* Pie Chart */}
            <Box sx={{ mt: 4, maxWidth: 400, mx: "auto" }}>
              <Pie data={pieData} />
            </Box>
          </Box>
        )}

        <Box display="flex" justifyContent="center" gap={2} mt={3} flexWrap="wrap">
          <Button variant="contained" onClick={obtenerCaja}>Actualizar caja</Button>
          {isAdmin && <Button variant="outlined" onClick={consultarDolar} disabled={convirtiendo}>{convirtiendo ? "Consultando..." : "Consultar precio en pesos"}</Button>}
        </Box>

        <Box textAlign="center" mt={3}>
          <Button variant="text" onClick={() => navigate("/home")}> Volver al Inicio </Button>
        </Box>

        {isAdmin && (
          <>
            {/* Formulario movimientos */}
            <Paper sx={{ mt: 5, p: 3 }}>
              <Typography variant="h6" fontWeight="bold">Registrar gasto o retiro</Typography>
              {movimientoError && <Alert severity="error">{movimientoError}</Alert>}
              {movimientoSuccess && <Alert severity="success">{movimientoSuccess}</Alert>}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tipo de movimiento</InputLabel>
                <Select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value as any)}>
                  <MenuItem value="gasto">Gasto</MenuItem>
                  <MenuItem value="retiro">Retiro</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Monto" type="number" fullWidth value={montoMovimiento} onChange={(e) => setMontoMovimiento(Number(e.target.value))} sx={{ mb: 2 }} />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Método de pago</InputLabel>
                <Select value={metodoPagoMovimiento} onChange={(e) => setMetodoPagoMovimiento(e.target.value as any)}>
                  <MenuItem value="Efectivo">Efectivo</MenuItem>
                  <MenuItem value="Transferencia">Transferencia</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Descripción" multiline rows={3} fullWidth value={descripcionMovimiento} onChange={(e) => setDescripcionMovimiento(e.target.value)} sx={{ mb: 2 }} />
              <Button variant="contained" color="success" fullWidth onClick={agregarMovimiento} disabled={enviandoMovimiento}>
                {enviandoMovimiento ? "Guardando..." : "Agregar movimiento"}
              </Button>
            </Paper>

            {/* Lista movimientos */}
            <Box mt={5} maxHeight={300} overflow="auto">
              <Typography variant="h6" fontWeight="bold">Movimientos recientes</Typography>
              {movimientos.length === 0 ? <Typography>No hay movimientos registrados</Typography> :
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Monto (USD)</TableCell>
                      <TableCell>Método de Pago</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimientos.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>{new Date(mov.fecha).toLocaleString()}</TableCell>
                        <TableCell sx={{ color: mov.tipoMovimiento === "gasto" ? "red" : "orange", fontWeight: "bold" }}>
                          {mov.tipoMovimiento.toUpperCase()}
                        </TableCell>
                        <TableCell>${mov.monto.toFixed(2)}</TableCell>
                        <TableCell>{mov.metodoPago}</TableCell>
                        <TableCell>{mov.descripcion}</TableCell>
                        <TableCell>
                          <Button variant="outlined" color="error" size="small" onClick={() => handleEliminarClick(mov.id)} disabled={eliminando && movimientoAEliminar === mov.id}>
                            {eliminando && movimientoAEliminar === mov.id ? <CircularProgress size={20} /> : "Eliminar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              }
            </Box>

            {/* Confirmación eliminación */}
            <Dialog open={confirmOpen} onClose={handleCancelDelete}>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogContent>
                <DialogContentText>¿Estás seguro que deseas eliminar este movimiento? Esta acción no se puede deshacer.</DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCancelDelete}>Cancelar</Button>
                <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={eliminando}>
                  {eliminando ? <CircularProgress size={20} /> : "Eliminar"}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
              <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Caja;
