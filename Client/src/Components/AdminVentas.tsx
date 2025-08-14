import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Typography,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface Venta {
  id: number;
  cantidad: number | string;
  total: number | string;
  fecha: string;
  celularId?: number | null;
  accesorioId?: number | null;
  reparacionId?: number | null;
  comprador?: string | null;
  ganancia?: number | null;
  idProveedor?: number | null;
  metodoPago?: string | null;

  Celular?: {
    modelo?: string;
    almacenamiento?: string;
    bateria?: string;
    color?: string;
    precio?: number;
    observaciones?: string;
    imei?: string;
    fechaIngreso?: string;
    idProveedor?: number | null;
  };
  Accesorio?: {
    nombre?: string;
  };
  Reparacion?: {
    descripcion?: string;
    reparadoPor?: string;
  };
  Proveedor?: {
    id?: number;
    nombre?: string;
  };
}

interface VentaForm extends Venta {
  modelo?: string;
  almacenamiento?: string;
  bateria?: string;
  color?: string;
  precio?: number;
  observaciones?: string;
  imei?: string;
  fechaIngreso?: string;
  accesorios?: string;
  reparacionDescripcion?: string;
  reparadoPor?: string;
  proveedorId?: number | null;
  proveedorNombre?: string;
  metodoPago?: string | null;
}

interface DecodedToken {
  admin: boolean;
}

interface Proveedor {
  id: number;
  nombre: string;
}

const METODOS_PAGO = ["Efectivo", "Transferencia"];

const AdminVentas: React.FC = () => {
  const [ventaAEliminar, setVentaAEliminar] = useState<{id: number; comprador: string;} | null>(null);
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<VentaForm>>({});
  const [loading, setLoading] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded.admin) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(true);

        const [ventasRes, proveedoresRes] = await Promise.all([
          axios.get<Venta[]>("https://up-gestiondenegocio-production.up.railway.app/ventas", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Proveedor[]>("https://up-gestiondenegocio-production.up.railway.app/proveedores", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setVentas(ventasRes.data);
        setProveedores(proveedoresRes.data);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, []);

  if (!isAdmin) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="error">
          Acceso denegado
        </Typography>
      </Box>
    );
  }

  const validarFormulario = (): string | null => {
    if (!form.fecha) return "La fecha es obligatoria";

    if (form.cantidad === undefined || form.cantidad === null)
      return "La cantidad es obligatoria";
    if (typeof form.cantidad === "string") {
      const cantidadNum = Number(form.cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0)
        return "La cantidad debe ser mayor a 0";
    } else if (form.cantidad <= 0) {
      return "La cantidad debe ser mayor a 0";
    }

    if (form.total === undefined || form.total === null)
      return "El total es obligatorio";
    if (typeof form.total === "string") {
      const totalNum = Number(form.total);
      if (isNaN(totalNum) || totalNum <= 0) return "El total debe ser mayor a 0";
    } else if (form.total <= 0) {
      return "El total debe ser mayor a 0";
    }

    if (form.metodoPago && !METODOS_PAGO.includes(form.metodoPago))
      return "Método de pago inválido";

    return null;
  };

  const filtrarVentas = (ventas: Venta[], filtro: string) => {
    const texto = filtro.toLowerCase();
    return ventas.filter((v) => {
      const comprador = v.comprador?.toLowerCase() ?? "";
      const fecha = new Date(v.fecha).toLocaleDateString().toLowerCase();
      const imei = v.Celular?.imei?.toLowerCase() ?? "";
      const modelo = v.Celular?.modelo?.toLowerCase() ?? "";
      const metodoPago = v.metodoPago?.toLowerCase() ?? "";
      const proveedorNombre = v.Proveedor?.nombre?.toLowerCase() ?? "";
      const accesorios = v.Accesorio?.nombre?.toLowerCase() ?? "";
      const reparacionDesc = v.Reparacion?.descripcion?.toLowerCase() ?? "";

      return (
        comprador.includes(texto) ||
        fecha.includes(texto) ||
        imei.includes(texto) ||
        modelo.includes(texto) ||
        metodoPago.includes(texto) ||
        proveedorNombre.includes(texto) ||
        accesorios.includes(texto) ||
        reparacionDesc.includes(texto)
      );
    });
  };

  const ventasFiltradas = filtrarVentas(ventas, filtro);

  const handleEditClick = (venta: Venta) => {
    setEditandoId(venta.id);
    setForm({
      ...venta,
      fecha: venta.fecha.slice(0, 10),

      modelo: venta.Celular?.modelo ?? "",
      almacenamiento: venta.Celular?.almacenamiento ?? "",
      bateria: venta.Celular?.bateria ?? "",
      color: venta.Celular?.color ?? "",
      precio: venta.Celular?.precio ?? 0,
      observaciones: venta.Celular?.observaciones ?? "",
      imei: venta.Celular?.imei ?? "",
      fechaIngreso: venta.Celular?.fechaIngreso
        ? venta.Celular.fechaIngreso.slice(0, 10)
        : "",

      accesorios: venta.Accesorio?.nombre ?? "",

      reparacionDescripcion: venta.Reparacion?.descripcion ?? "",
      reparadoPor: venta.Reparacion?.reparadoPor ?? "",

      proveedorId: venta.Celular?.idProveedor ?? null,

      metodoPago: venta.metodoPago ?? "",
    });
    setErrorValidacion(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "cantidad" ||
        name === "total" ||
        name === "ganancia" ||
        name === "idProveedor" ||
        name === "precio" ||
        name === "proveedorId"
          ? isNaN(Number(value))
            ? value
            : Number(value)
          : value,
    }));
  };

  const handleSave = async () => {
    const error = validarFormulario();
    if (error) {
      setErrorValidacion(error);
      return;
    }
    if (!editandoId) return;
    const token = localStorage.getItem("token") || "";
    try {
      const dataToSend = {
        ...form,
      };
      delete dataToSend.proveedorNombre;

      await axios.put(`https://up-gestiondenegocio-production.up.railway.app/ventas/${editandoId}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVentas((prev) =>
        prev.map((v) =>
          v.id === editandoId
            ? {
                ...v,
                ...form,
                Celular: {
                  ...v.Celular,
                  idProveedor: form.proveedorId ?? v.Celular?.idProveedor ?? null,
                },
                Proveedor:
                  proveedores.find((p) => p.id === form.proveedorId) ?? undefined,
              }
            : v
        )
      );
      setEditandoId(null);
      setForm({});
      setErrorValidacion(null);
    } catch (error) {
      console.error("Error al guardar venta:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta venta?")) return;
    const token = localStorage.getItem("token") || "";
    try {
      await axios.delete(`https://up-gestiondenegocio-production.up.railway.app/ventas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVentas((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Error al eliminar venta:", error);
    }
  };

  const getProducto = (v: Venta) => {
    if (v.celularId) return "Celular";
    if (v.accesorioId) return "Accesorio";
    if (v.reparacionId) return "Reparación";
    return "-";
  };

  if (loading) return <Typography sx={{ p: 2 }}>Cargando...</Typography>;

   return (
  <Box sx={{ p: 2 }}>
    <Typography variant="h4" mb={2}>
      Administración de Ventas
    </Typography>

    {/* Botón volver al home */}
    <Box mb={2}>
      <Button variant="contained" color="secondary" onClick={() => navigate('/home')} sx={{ textTransform: 'none' }}>
        Volver al Home
      </Button>
    </Box>

    <TextField
      label="Buscar por comprador, fecha, IMEI, modelo, método pago..."
      variant="outlined"
      fullWidth
      margin="normal"
      value={filtro}
      onChange={(e) => setFiltro(e.target.value)}
    />

    {errorValidacion && (
      <Typography color="error" mb={2}>
        {errorValidacion}
      </Typography>
    )}

    {/* Tabla con scroll */}
    <Box sx={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh', mt: 2 }}>
      <TableContainer component={Paper} sx={{ border: '1px solid #ccc', borderRadius: 2 }}>
        <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              {[
                'Fecha Venta','Cantidad','Total','Producto','Modelo','Almacenamiento','Batería','Color',
                'Precio','IMEI','Observaciones','Accesorios','Descripción Reparación','Reparado Por',
                'Comprador','Ganancia','Proveedor','Fecha Ingreso','Método de Pago','Acciones'
              ].map((header) => (
                <TableCell key={header} sx={{ fontWeight: 'bold', border: '1px solid #e0e0e0', backgroundColor: '#eeeeee' }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ventasFiltradas.map((venta, idx) =>
              editandoId === venta.id ? (
                <TableRow key={venta.id} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                  {/* Aquí van tus celdas editables, igual que antes */}
                  {/* ... */}
                  <TableCell sx={cellStyle}>
                    <Button variant="contained" color="primary" size="small" onClick={handleSave} sx={{ mr: 1, textTransform: 'none' }}>
                      Guardar
                    </Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => setVentaAEliminar({ id: venta.id, comprador: venta.comprador ?? '' })} sx={{ textTransform: 'none' }}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={venta.id} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                  {/* Celdas normales */}
                  {/* ... */}
                  <TableCell sx={cellStyle}>
                    <Button variant="outlined" size="small" onClick={() => handleEditClick(venta)} sx={{ mr: 1, textTransform: 'none' }}>
                      Editar
                    </Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => setVentaAEliminar({ id: venta.id, comprador: venta.comprador ?? '' })} sx={{ textTransform: 'none' }}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>

    {/* Dialog de confirmación de eliminación */}
    <Dialog open={!!ventaAEliminar} onClose={() => setVentaAEliminar(null)}>
      <DialogTitle>Confirmar Eliminación</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Seguro que quieres eliminar la venta de <strong>{ventaAEliminar?.comprador}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setVentaAEliminar(null)}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={() => { handleDelete(ventaAEliminar!.id); setVentaAEliminar(null); }}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);


};

// 👇 Estilo aplicado a cada celda
const cellStyle = {
  border: '1px solid #e0e0e0',
  verticalAlign: 'middle',
  padding: '6px 8px',
};

export default AdminVentas;