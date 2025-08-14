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
} from "@mui/material";

interface DecodedToken {
  admin: boolean;
  id: number;
}

interface ResCaja {
  total: number;
  cantidad: number;
  celulares?: { total: number; cantidad: number };
  accesorios?: { total: number; cantidad: number };
  frenteTotal?: number; // total de usuarios no admin
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

const Caja: React.FC = () => {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState<"diaria" | "mensual">("diaria");
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Transferencia" | "Todos">("Todos");
  const [total, setTotal] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(0);
  const [celularesData, setCelularesData] = useState({ total: 0, cantidad: 0 });
  const [accesoriosData, setAccesoriosData] = useState({ total: 0, cantidad: 0 });
  const [totalFrente, setTotalFrente] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const [tipoMovimiento, setTipoMovimiento] = useState<"gasto" | "retiro">("gasto");
  const [montoMovimiento, setMontoMovimiento] = useState<number>(0);
  const [metodoPagoMovimiento, setMetodoPagoMovimiento] = useState<"Efectivo" | "Transferencia">("Efectivo");
  const [descripcionMovimiento, setDescripcionMovimiento] = useState<string>("");
  const [movimientoError, setMovimientoError] = useState<string | null>(null);
  const [movimientoSuccess, setMovimientoSuccess] = useState<string | null>(null);
  const [enviandoMovimiento, setEnviandoMovimiento] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

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
      setTotalFrente(res.data.frenteTotal || 0);
      setError(null);
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

      // Si no es admin, filtrar solo los movimientos del usuario
      const movimientosFiltrados = isAdmin ? res.data : res.data.filter((mov) => mov.usuarioId === userId);
      setMovimientos(movimientosFiltrados.map((mov) => ({ ...mov, monto: Number(mov.monto) })));
    } catch (err) {
      console.error("Error cargando movimientos:", err);
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
    } catch (error) {
      setMovimientoError("Error al agregar movimiento");
    } finally {
      setEnviandoMovimiento(false);
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
      await axios.delete(`https://up-gestiondenegocio-production.up.railway.app/caja/movimientos/${movimientoAEliminar}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: "Movimiento eliminado correctamente", severity: "success" });
      await obtenerMovimientos();
      await obtenerCaja();
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

  const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

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
        await obtenerCaja();
        await obtenerMovimientos();
      } catch {
        setIsAdmin(false);
        setError("Error validando token");
      } finally {
        setLoading(false);
      }
    };
    verificarAdminYObtenerDatos();
  }, [tipo]);

  if (loading) return <Box textAlign="center" mt={6}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 5, mb: 5 }}>
      {/* Sección Totales */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: "#f5f5f5" }}>
        <Typography variant="h5" align="center" sx={{ fontWeight: "bold", mb: 2, color: "#1565c0" }}>
          Caja {tipo === "diaria" ? "Diaria" : "Mensual"}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <FormControl fullWidth disabled={!isAdmin}>
            <InputLabel>Tipo</InputLabel>
            <Select value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value as any)}>
              <MenuItem value="diaria">Diaria</MenuItem>
              <MenuItem value="mensual">Mensual</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Método de Pago</InputLabel>
            <Select value={metodoPago} label="Método de Pago" onChange={(e) => setMetodoPago(e.target.value as any)}>
              <MenuItem value="Todos">Todos</MenuItem>
              <MenuItem value="Efectivo">Efectivo</MenuItem>
              <MenuItem value="Transferencia">Transferencia</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
          <Typography variant="h6">
            {isAdmin ? "Total generado (USD)" : "Tu total (USD)"}: <strong>${total.toFixed(2)}</strong>
          </Typography>

          {isAdmin && totalFrente > 0 && (
            <Typography variant="body1" sx={{ color: "#444" }}>
              Caja del frente (Usuarios no admin): <strong>${totalFrente.toFixed(2)}</strong>
            </Typography>
          )}

          {isAdmin && (
            <>
              <Typography variant="body2">Celulares: ${celularesData.total.toFixed(2)} ({celularesData.cantidad} ventas)</Typography>
              <Typography variant="body2">Accesorios: ${accesoriosData.total.toFixed(2)} ({accesoriosData.cantidad} ventas)</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Ventas realizadas: {cantidad}</Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>Balance actual: ${balance.toFixed(2)} USD</Typography>
            </>
          )}
        </Box>

        <Box display="flex" justifyContent="center" gap={2} mt={3} flexWrap="wrap">
          <Button variant="contained" color="primary" onClick={obtenerCaja}>Actualizar caja</Button>
        </Box>
      </Paper>

      {/* Sección Movimientos */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, maxHeight: 400, overflow: "auto", backgroundColor: "#fff" }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Movimientos recientes</Typography>

        {movimientos.length === 0 ? (
          <Typography>No hay movimientos registrados</Typography>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Monto (USD)</TableCell>
                <TableCell>Método de Pago</TableCell>
                <TableCell>Descripción</TableCell>
                {isAdmin && <TableCell>Acciones</TableCell>}
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
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleEliminarClick(mov.id)}
                        disabled={eliminando && movimientoAEliminar === mov.id}
                      >
                        {eliminando && movimientoAEliminar === mov.id ? <CircularProgress size={20} /> : "Eliminar"}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Formulario para registrar movimiento (solo admin) */}
      {isAdmin && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, backgroundColor: "#f5f5f5" }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Registrar gasto o retiro</Typography>

          {movimientoError && <Alert severity="error" sx={{ mb: 2 }}>{movimientoError}</Alert>}
          {movimientoSuccess && <Alert severity="success" sx={{ mb: 2 }}>{movimientoSuccess}</Alert>}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de movimiento</InputLabel>
            <Select value={tipoMovimiento} label="Tipo de movimiento" onChange={(e) => setTipoMovimiento(e.target.value as any)}>
              <MenuItem value="gasto">Gasto</MenuItem>
              <MenuItem value="retiro">Retiro</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Monto"
            type="number"
            fullWidth
            value={montoMovimiento}
            onChange={(e) => setMontoMovimiento(Number(e.target.value))}
            inputProps={{ min: 0, step: "0.01" }}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Método de pago</InputLabel>
            <Select value={metodoPagoMovimiento} label="Método de pago" onChange={(e) => setMetodoPagoMovimiento(e.target.value as any)}>
              <MenuItem value="Efectivo">Efectivo</MenuItem>
              <MenuItem value="Transferencia">Transferencia</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Descripción"
            multiline
            rows={3}
            fullWidth
            value={descripcionMovimiento}
            onChange={(e) => setDescripcionMovimiento(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button variant="contained" color="success" fullWidth onClick={agregarMovimiento} disabled={enviandoMovimiento}>
            {enviandoMovimiento ? "Guardando..." : "Agregar movimiento"}
          </Button>
        </Paper>
      )}

      {/* Dialogo de confirmación */}
      <Dialog open={confirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Estás seguro que deseas eliminar este movimiento? Esta acción no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={eliminando}>
            {eliminando ? <CircularProgress size={20} /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Botón volver */}
      <Box textAlign="center" mt={4}>
        <Button variant="text" color="inherit" onClick={() => navigate("/home")}>← Volver al Inicio</Button>
      </Box>
    </Box>
  );
};

export default Caja;
