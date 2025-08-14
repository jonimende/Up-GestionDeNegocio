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
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
      | SelectChangeEvent<number>
  ) => {
    const { name, value } = e.target as { name: string; value: unknown };

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "cantidad" ||
        name === "total" ||
        name === "ganancia" ||
        name === "idProveedor" ||
        name === "precio" ||
        name === "proveedorId"
          ? Number(value)
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
      {errorValidacion && (
        <Typography color="error" sx={{ mb: 2 }}>
          {errorValidacion}
        </Typography>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={cellStyle}>Fecha</TableCell>
              <TableCell sx={cellStyle}>Cantidad</TableCell>
              <TableCell sx={cellStyle}>Total</TableCell>
              <TableCell sx={cellStyle}>Método de pago</TableCell>
              <TableCell sx={cellStyle}>Comprador</TableCell>
              <TableCell sx={cellStyle}>Producto</TableCell>
              <TableCell sx={cellStyle}>Proveedor</TableCell>
              <TableCell sx={cellStyle}>Modelo</TableCell>
              <TableCell sx={cellStyle}>Almacenamiento</TableCell>
              <TableCell sx={cellStyle}>Batería</TableCell>
              <TableCell sx={cellStyle}>Color</TableCell>
              <TableCell sx={cellStyle}>Precio</TableCell>
              <TableCell sx={cellStyle}>Observaciones</TableCell>
              <TableCell sx={cellStyle}>IMEI</TableCell>
              <TableCell sx={cellStyle}>Fecha Ingreso</TableCell>
              <TableCell sx={cellStyle}>Accesorio</TableCell>
              <TableCell sx={cellStyle}>Descripción Reparación</TableCell>
              <TableCell sx={cellStyle}>Reparado Por</TableCell>
              <TableCell sx={cellStyle}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ventasFiltradas.map((venta) => {
              const isEditing = editandoId === venta.id;
              return (
                <TableRow key={venta.id}>
                  {isEditing ? (
                    <>
                      {/* Fecha */}
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="fecha"
                          type="date"
                          size="small"
                          value={form.fecha || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>

                      {/* Cantidad */}
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="cantidad"
                          type="number"
                          size="small"
                          value={form.cantidad ?? ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>

                      {/* Total */}
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="total"
                          type="number"
                          size="small"
                          value={form.total ?? ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>

                      {/* Método de pago */}
                      <TableCell sx={cellStyle}>
                        <Select
                          name="metodoPago"
                          size="small"
                          value={form.metodoPago || ""}
                          onChange={handleInputChange}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Seleccionar</em>
                          </MenuItem>
                          {METODOS_PAGO.map((m) => (
                            <MenuItem key={m} value={m}>
                              {m}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>

                      {/* Comprador */}
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="comprador"
                          size="small"
                          value={form.comprador || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>

                      {/* Producto */}
                      <TableCell sx={cellStyle}>{getProducto(venta)}</TableCell>

                      {/* Proveedor */}
                      <TableCell sx={cellStyle}>
                        <Select
                          name="proveedorId"
                          size="small"
                          value={form.proveedorId ?? ""}
                          onChange={handleInputChange}
                          displayEmpty
                        >
                          <MenuItem value="">
                            <em>Seleccionar</em>
                          </MenuItem>
                          {proveedores.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>

                      {/* Campos Celular */}
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="modelo"
                          size="small"
                          value={form.modelo || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="almacenamiento"
                          size="small"
                          value={form.almacenamiento || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="bateria"
                          size="small"
                          value={form.bateria || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="color"
                          size="small"
                          value={form.color || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="precio"
                          type="number"
                          size="small"
                          value={form.precio ?? ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="observaciones"
                          size="small"
                          value={form.observaciones || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="imei"
                          size="small"
                          value={form.imei || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="fechaIngreso"
                          type="date"
                          size="small"
                          value={form.fechaIngreso || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>

                      {/* Campos Accesorio */}
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="accesorios"
                          size="small"
                          value={form.accesorios || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>

                      {/* Campos Reparación */}
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="reparacionDescripcion"
                          size="small"
                          value={form.reparacionDescripcion || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <TextField
                          name="reparadoPor"
                          size="small"
                          value={form.reparadoPor || ""}
                          onChange={handleInputChange}
                        />
                      </TableCell>

                      {/* Acciones */}
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
                      <TableCell sx={cellStyle}>
                        {new Date(venta.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={cellStyle}>{venta.cantidad}</TableCell>
                      <TableCell sx={cellStyle}>${venta.total}</TableCell>
                      <TableCell sx={cellStyle}>{venta.metodoPago}</TableCell>
                      <TableCell sx={cellStyle}>{venta.comprador}</TableCell>
                      <TableCell sx={cellStyle}>{getProducto(venta)}</TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Proveedor?.nombre || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.modelo || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.almacenamiento || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.bateria || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.color || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.precio ?? "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.observaciones || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.imei || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Celular?.fechaIngreso
                          ? new Date(venta.Celular.fechaIngreso).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Accesorio?.nombre || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Reparacion?.descripcion || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        {venta.Reparacion?.reparadoPor || "-"}
                      </TableCell>
                      <TableCell sx={cellStyle}>
                        <Button
                          variant="contained"
                          color="secondary"
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
