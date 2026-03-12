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
  Card,
  CardContent,
  Divider,
} from "@mui/material";

interface DecodedToken {
  admin: boolean;
  id: number;
}

interface ResCaja {
  total: number;
  cantidad: number;
  totalNeto: number;
  balance: number;
  ganancia?: number; // Agregamos la ganancia que ahora manda el backend
  celulares?: { total: number; cantidad: number };
  accesorios?: { total: number; cantidad: number };
}

interface Movimiento {
  id: number;
  tipoMovimiento: "gasto" | "retiro" | "ingreso";
  monto: number;
  metodoPago: string;
  descripcion: string;
  fecha: string;
  usuarioId: number;
}

const Caja = () => {
  const navigate = useNavigate();

  // Estados de fecha y filtros
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = useState<string>(hoy);
  const [metodoPago, setMetodoPago] = useState<"Efectivo" | "Transferencia" | "Todos">("Todos");

  // Estados de datos
  const [cajaData, setCajaData] = useState<ResCaja | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de formulario de movimientos
  const [tipoMovimiento, setTipoMovimiento] = useState<"gasto" | "retiro" | "ingreso">("gasto");
  const [montoMovimiento, setMontoMovimiento] = useState<number | "">("");
  const [metodoPagoMovimiento, setMetodoPagoMovimiento] = useState<"Efectivo" | "Transferencia">("Efectivo");
  const [descripcionMovimiento, setDescripcionMovimiento] = useState<string>("");
  const [enviandoMovimiento, setEnviandoMovimiento] = useState(false);

  // Autenticación
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // UI States (Snackbar y Dialogos)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const apiUrl = "https://up-gestiondenegocio-production.up.railway.app";

  const cargarDatos = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const resCaja = await axios.get<ResCaja>(`${apiUrl}/ventas/caja/consulta`, {
        params: { tipo: "diaria", metodoPago, fecha },
        headers: { Authorization: `Bearer ${token}` },
      });
      setCajaData(resCaja.data);

      const resMov = await axios.get<Movimiento[]>(`${apiUrl}/caja/movimientos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Filtramos en el front los movimientos del día seleccionado
      const movimientosDelDia = resMov.data.filter((mov) => mov.fecha.startsWith(fecha));
      setMovimientos(movimientosDelDia);
      setError(null);
    } catch (err: any) {
      setError("Error al obtener los datos de la caja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const verificarAuth = async () => {
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
        await cargarDatos();
      } catch (err) {
        setError("Error validando sesión");
        setLoading(false);
      }
    };
    verificarAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, metodoPago]);

  const agregarMovimiento = async () => {
    if (!montoMovimiento || Number(montoMovimiento) <= 0) {
      return setSnackbar({ open: true, message: "El monto debe ser mayor a 0", severity: "error" });
    }
    if (!descripcionMovimiento.trim()) {
      return setSnackbar({ open: true, message: "Añade una descripción", severity: "error" });
    }

    setEnviandoMovimiento(true);
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${apiUrl}/caja/movimientos`,
        {
          tipoMovimiento,
          monto: Number(montoMovimiento),
          metodoPago: metodoPagoMovimiento,
          descripcion: descripcionMovimiento,
          usuarioId: userId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: "Movimiento registrado", severity: "success" });
      setMontoMovimiento("");
      setDescripcionMovimiento("");
      await cargarDatos();
    } catch (error) {
      setSnackbar({ open: true, message: "Error al registrar movimiento", severity: "error" });
    } finally {
      setEnviandoMovimiento(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (movimientoAEliminar === null) return;
    setEliminando(true);
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${apiUrl}/caja/movimientos/${movimientoAEliminar}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: "Eliminado", severity: "success" });
      await cargarDatos();
    } catch (err) {
      setSnackbar({ open: true, message: "Error al eliminar", severity: "error" });
    } finally {
      setEliminando(false);
      setConfirmOpen(false);
    }
  };

  if (loading && !cajaData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, p: 2, fontFamily: "'Roboto', sans-serif" }}>
      
      {/* Controles Superiores */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: "#1565c0" }}>
          Caja Diaria
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            type="date"
            label="Día a consultar"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button variant="outlined" onClick={() => navigate("/home")}>
            Volver
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Contenedor Principal (Reemplaza a Grid) */}
      <Box 
        display="flex" 
        flexDirection={{ xs: "column", md: "row" }} 
        gap={3} 
        mb={3}
      >
        {/* COLUMNA IZQUIERDA: Totales (Cambia según rol) */}
        <Box flex={{ xs: "1 1 auto", md: "0 0 40%" }}>
          <Card elevation={3} sx={{ borderRadius: 3, backgroundColor: isAdmin ? "#f8f9fa" : "#e3f2fd", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="textSecondary">
                Resumen de Ingresos
              </Typography>
              
              <Typography variant="h3" fontWeight="bold" sx={{ color: "#2e7d32" }}>
                ${cajaData?.total.toFixed(2) || "0.00"}
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Total Generado por Ventas ({cajaData?.cantidad || 0} artículos)
              </Typography>

              {isAdmin && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Celulares:</Typography>
                    <Typography fontWeight="bold">${cajaData?.celulares?.total.toFixed(2) || "0.00"}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Accesorios:</Typography>
                    <Typography fontWeight="bold">${cajaData?.accesorios?.total.toFixed(2) || "0.00"}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Efectivo Físico (Neto):</Typography>
                    <Typography fontWeight="bold" sx={{ color: "#1565c0" }}>
                      ${cajaData?.totalNeto.toFixed(2) || "0.00"}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body1">Ganancia Real:</Typography>
                    <Typography fontWeight="bold" sx={{ color: "#d81b60" }}>
                      ${cajaData?.ganancia?.toFixed(2) || "0.00"}
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* COLUMNA DERECHA: Agregar Movimientos (Para todos los usuarios) */}
        <Box flex={{ xs: "1 1 auto", md: "1 1 auto" }}>
          <Card elevation={3} sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registrar Movimiento
              </Typography>
              
              <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mb={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select value={tipoMovimiento} label="Tipo" onChange={(e) => setTipoMovimiento(e.target.value as any)}>
                    <MenuItem value="ingreso">Fondo Inicial / Ingreso</MenuItem>
                    <MenuItem value="gasto">Gasto (Insumos, etc)</MenuItem>
                    {isAdmin && <MenuItem value="retiro">Retiro de Ganancia</MenuItem>}
                  </Select>
                </FormControl>

                <TextField
                  label="Monto"
                  type="number"
                  fullWidth
                  size="small"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(e.target.value ? Number(e.target.value) : "")}
                />
              </Box>

              <TextField
                label="Descripción"
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                value={descripcionMovimiento}
                onChange={(e) => setDescripcionMovimiento(e.target.value)}
              />
              
              <Button variant="contained" color="primary" fullWidth onClick={agregarMovimiento} disabled={enviandoMovimiento}>
                {enviandoMovimiento ? "Guardando..." : "Guardar Movimiento"}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* TABLA DE MOVIMIENTOS */}
      <Box>
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Movimientos del Día
            </Typography>
            {movimientos.length === 0 ? (
              <Typography color="textSecondary">No hay movimientos registrados hoy.</Typography>
            ) : (
              <Box overflow="auto">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Hora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      {isAdmin && <TableCell align="center">Acciones</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimientos.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>{new Date(mov.fecha).toLocaleTimeString()}</TableCell>
                        <TableCell sx={{
                          color: mov.tipoMovimiento === "ingreso" ? "green" : mov.tipoMovimiento === "gasto" ? "red" : "orange",
                          fontWeight: "bold", textTransform: "uppercase"
                        }}>
                          {mov.tipoMovimiento}
                        </TableCell>
                        <TableCell>{mov.descripcion}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                          ${Number(mov.monto).toFixed(2)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="center">
                            <Button color="error" size="small" onClick={() => { setMovimientoAEliminar(mov.id); setConfirmOpen(true); }}>
                              Borrar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Dialogos y Snackbars */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>¿Seguro que deseas eliminar este movimiento?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={eliminando}>
            {eliminando ? "Borrando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Caja;