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
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<VentaForm>>({});
  const [loading, setLoading] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState<number | null>(null);

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
          axios.get<Venta[]>(
            "https://up-gestiondenegocio-production.up.railway.app/ventas",
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get<Proveedor[]>(
            "https://up-gestiondenegocio-production.up.railway.app/proveedores",
            { headers: { Authorization: `Bearer ${token}` } }
          ),
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
      if (isNaN(totalNum) || totalNum <= 0)
        return "El total debe ser mayor a 0";
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

  const handleOpenDialog = (id: number) => {
    setVentaAEliminar(id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (ventaAEliminar !== null) {
      const token = localStorage.getItem("token") || "";
      try {
        await axios.delete(
          `https://up-gestiondenegocio-production.up.railway.app/ventas/${ventaAEliminar}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVentas((prev) => prev.filter((v) => v.id !== ventaAEliminar));
      } catch (error) {
        console.error("Error al eliminar venta:", error);
      }
    }
    setOpenDialog(false);
    setVentaAEliminar(null);
  };

  const handleCancelDelete = () => {
    setOpenDialog(false);
    setVentaAEliminar(null);
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
      const dataToSend = { ...form };
      delete dataToSend.proveedorNombre;

      await axios.put(
        `https://up-gestiondenegocio-production.up.railway.app/ventas/${editandoId}`,
        dataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
                Proveedor: proveedores.find((p) => p.id === form.proveedorId) ?? undefined,
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

  const getProducto = (v: Venta) => {
    if (v.celularId) return "Celular";
    if (v.accesorioId) return "Accesorio";
    if (v.reparacionId) return "Reparación";
    return "-";
  };

  const cellStyle = {
    border: "1px solid #e0e0e0",
    verticalAlign: "middle",
    padding: "6px 8px",
  };

  // ======== RETURN ========
  if (loading) return <Typography sx={{ p: 2 }}>Cargando...</Typography>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" mb={2} fontWeight="bold">
        Administración de Ventas
      </Typography>

      <Box mb={2}>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate("/home")}
          sx={{ textTransform: "none" }}
        >
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

      <TableContainer
        component={Paper}
        sx={{ border: "1px solid #ccc", borderRadius: 2, overflowX: "auto", maxHeight: "70vh" }}
      >
        <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              {[
                "Fecha Venta",
                "Cantidad",
                "Total",
                "Producto",
                "Modelo",
                "Almacenamiento",
                "Batería",
                "Color",
                "Precio",
                "IMEI",
                "Observaciones",
                "Accesorios",
                "Descripción Reparación",
                "Reparado Por",
                "Comprador",
                "Ganancia",
                "Proveedor",
                "Fecha Ingreso",
                "Método de Pago",
                "Acciones",
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{ fontWeight: "bold", border: "1px solid #e0e0e0", backgroundColor: "#eeeeee" }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ventasFiltradas.map((venta, idx) => {
              const isEditing = editandoId === venta.id;
              const filaColor = idx % 2 === 0 ? "#fafafa" : "#fff";

              return (
                <TableRow key={venta.id} hover sx={{ backgroundColor: filaColor }}>
                  {isEditing ? (
                    <>
                      {/* Aquí van tus campos editables como antes */}
                      {/* Por brevedad se omite, pero pegá todos tus TextFields aquí */}
                      <TableCell sx={cellStyle}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={handleSave}
                          sx={{ mr: 1, textTransform: "none" }}
                        >
                          Guardar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleOpenDialog(venta.id)}
                          sx={{ textTransform: "none" }}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      {/* Aquí van tus campos no editables */}
                      <TableCell sx={cellStyle}>{new Date(venta.fecha).toLocaleDateString()}</TableCell>
                      <TableCell sx={cellStyle}>{venta.cantidad}</TableCell>
                      <TableCell sx={cellStyle}>{venta.total}</TableCell>
                      <TableCell sx={cellStyle}>{getProducto(venta)}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Celular?.modelo ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Celular?.almacenamiento ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Celular?.bateria ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Celular?.color ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Celular?.precio ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Celular?.imei ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Celular?.observaciones ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Accesorio?.nombre ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Reparacion?.descripcion ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.Reparacion?.reparadoPor ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.comprador?.trim() || "-"}</TableCell>
                      <TableCell sx={cellStyle}>{venta.ganancia ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>
                        {proveedores.find(
                          (p) => p.id === venta.Proveedor?.id || p.id === venta.Celular?.idProveedor
                        )?.nombre ?? "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.fechaIngreso
                          ? new Date(venta.Celular.fechaIngreso).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>{venta.metodoPago ?? "-"}</TableCell>
                      <TableCell sx={cellStyle}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEditClick(venta)}
                          sx={{ mr: 1, textTransform: "none" }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleOpenDialog(venta.id)}
                          sx={{ textTransform: "none" }}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro que deseas eliminar esta venta?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminVentas;
