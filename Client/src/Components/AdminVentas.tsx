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
  Collapse,
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
  
  accesorios?: {
    id: number;
    nombre: string;
    precio?: number;
    precio_costo?: number; 
    VentaAccesorio?: { cantidad: number };
  }[];

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
  accesoriosA?: string;
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
  const [expandedVentaId, setExpandedVentaId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setIsAdmin(decoded.admin);

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
      const accesorios = v.accesorios?.map(a => a.nombre.toLowerCase()).join(", ") ?? "";
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
    setExpandedVentaId(venta.id); // ACÁ ESTÁ EL ARREGLO: Esto expande el acordeón automáticamente
    
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

      accesoriosA: venta.accesorios?.map(a => a.nombre).join(", ") ?? "",

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

      // 1. Enviamos los datos al backend
      await axios.put(
        `https://up-gestiondenegocio-production.up.railway.app/ventas/${editandoId}`,
        dataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Reconstruimos el estado visual de React CORRECTAMENTE (Arreglado)
      setVentas((prev) =>
        prev.map((v) => {
          if (v.id === editandoId) {
            return {
              ...v,
              cantidad: form.cantidad ?? v.cantidad,
              total: form.total ?? v.total,
              fecha: form.fecha ?? v.fecha,
              metodoPago: form.metodoPago ?? v.metodoPago,
              comprador: form.comprador ?? v.comprador,
              Celular: v.Celular ? {
                ...v.Celular,
                modelo: form.modelo ?? v.Celular.modelo,
                almacenamiento: form.almacenamiento ?? v.Celular.almacenamiento,
                bateria: form.bateria ?? v.Celular.bateria,
                color: form.color ?? v.Celular.color,
                precio: form.precio ?? v.Celular.precio,
                observaciones: form.observaciones ?? v.Celular.observaciones,
                imei: form.imei ?? v.Celular.imei,
                idProveedor: form.proveedorId ?? v.Celular.idProveedor,
              } : undefined,
              Reparacion: v.Reparacion ? {
                ...v.Reparacion,
                descripcion: form.reparacionDescripcion ?? v.Reparacion.descripcion,
                reparadoPor: form.reparadoPor ?? v.Reparacion.reparadoPor,
              } : undefined,
              Proveedor: form.proveedorId 
                ? proveedores.find((p) => p.id === form.proveedorId) 
                : v.Proveedor,
            };
          }
          return v;
        })
      );
      
      setEditandoId(null);
      setForm({});
      setErrorValidacion(null);
    } catch (error) {
      console.error("Error al guardar venta:", error);
      setErrorValidacion("Hubo un error al comunicarse con el servidor (Revisa la consola).");
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
        Volver al Inicio
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

    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={cellStyle}>Celular</TableCell>
            <TableCell sx={cellStyle}>Fecha</TableCell>
            <TableCell sx={cellStyle}>Comprador</TableCell>
            <TableCell sx={cellStyle}>Total</TableCell>
            <TableCell sx={cellStyle}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ventasFiltradas.map((venta) => {
            const isEditing = editandoId === venta.id;
            const isExpanded = expandedVentaId === venta.id;

            return (
              <React.Fragment key={venta.id}>
                <TableRow
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => setExpandedVentaId(isExpanded ? null : venta.id)}
                >
                  <TableCell>{venta.Celular?.modelo}</TableCell>
                  <TableCell>{new Date(venta.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>{venta.comprador}</TableCell>
                  <TableCell>${venta.total}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(venta);
                      }}
                      sx={{ mr: 1, textTransform: "none" }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(venta.id);
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={5} sx={{ p: 0, borderBottom: "unset" }}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ m: 2 }}>
                        {isEditing ? (
                          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                            <TextField
                              name="fecha"
                              type="date"
                              size="small"
                              value={form.fecha || ""}
                              onChange={handleInputChange}
                              label="Fecha"
                            />
                            <TextField
                              name="cantidad"
                              type="number"
                              size="small"
                              value={form.cantidad ?? ""}
                              onChange={handleInputChange}
                              label="Cantidad"
                            />
                            <TextField
                              name="total"
                              type="number"
                              size="small"
                              value={form.total ?? ""}
                              onChange={handleInputChange}
                              label="Total"
                            />
                            <FormControl size="small">
                              <InputLabel>Método</InputLabel>
                              <Select
                                name="metodoPago"
                                value={form.metodoPago || ""}
                                onChange={handleInputChange}
                                label="Método"
                              >
                                <MenuItem value="">
                                  <em>Seleccionar método</em>
                                </MenuItem>
                                {METODOS_PAGO.map((m) => (
                                  <MenuItem key={m} value={m}>{m}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <TextField
                              name="comprador"
                              size="small"
                              value={form.comprador || ""}
                              onChange={handleInputChange}
                              label="Comprador"
                            />
                            <TextField
                              name="modelo"
                              size="small"
                              value={form.modelo || ""}
                              onChange={handleInputChange}
                              label="Modelo"
                            />
                            <TextField
                              name="almacenamiento"
                              size="small"
                              value={form.almacenamiento || ""}
                              onChange={handleInputChange}
                              label="Almacenamiento"
                            />
                            <TextField
                              name="bateria"
                              size="small"
                              value={form.bateria || ""}
                              onChange={handleInputChange}
                              label="Batería"
                            />
                            <TextField
                              name="color"
                              size="small"
                              value={form.color || ""}
                              onChange={handleInputChange}
                              label="Color"
                            />
                            <TextField
                              name="precio"
                              type="number"
                              size="small"
                              value={form.precio ?? ""}
                              onChange={handleInputChange}
                              label="Precio"
                            />
                            <TextField
                              name="observaciones"
                              size="small"
                              value={form.observaciones || ""}
                              onChange={handleInputChange}
                              label="Observaciones"
                            />
                            <TextField
                              name="imei"
                              size="small"
                              value={form.imei || ""}
                              onChange={handleInputChange}
                              label="IMEI"
                            />
                            <TextField
                              name="fechaIngreso"
                              type="date"
                              size="small"
                              value={form.fechaIngreso || ""}
                              onChange={handleInputChange}
                              label="Fecha Ingreso"
                              InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                              name="accesorios"
                              size="small"
                              value={form.accesorios || ""}
                              onChange={handleInputChange}
                              label="Accesorio"
                            />
                            <TextField
                              name="reparacionDescripcion"
                              size="small"
                              value={form.reparacionDescripcion || ""}
                              onChange={handleInputChange}
                              label="Descripción Reparación"
                            />
                            <TextField
                              name="reparadoPor"
                              size="small"
                              value={form.reparadoPor || ""}
                              onChange={handleInputChange}
                              label="Reparado Por"
                            />
                            <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "center" }}>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={handleSave}
                                sx={{ textTransform: "none" }}
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
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                            <Typography>Producto: {getProducto(venta)}</Typography>
                            <Typography>Proveedor: {venta.Proveedor?.nombre || "-"}</Typography>
                            <Typography>Modelo: {venta.Celular?.modelo || "-"}</Typography>
                            <Typography>Almacenamiento: {venta.Celular?.almacenamiento || "-"}</Typography>
                            <Typography>Batería: {venta.Celular?.bateria || "-"}</Typography>
                            <Typography>Color: {venta.Celular?.color || "-"}</Typography>
                            <Typography>Precio: {venta.Celular?.precio ?? "-"}</Typography>
                            <Typography>Observaciones: {venta.Celular?.observaciones || "-"}</Typography>
                            <Typography>IMEI: {venta.Celular?.imei || "-"}</Typography>
                            <Typography>Fecha Ingreso: {venta.Celular?.fechaIngreso ? new Date(venta.Celular.fechaIngreso).toLocaleDateString() : "-"}</Typography>
                            <Typography>Accesorios: {venta.accesorios && venta.accesorios.length > 0 
                                ? venta.accesorios.map(a => `${a.nombre} x${(a as any).VentaAccesorio?.cantidad ?? 1} (Costo: $${a.precio_costo ?? 0})`).join(", ") 
                                : "-"}
                            </Typography>
                            <Typography>Descripción Reparación: {venta.Reparacion?.descripcion || "-"}</Typography>
                            <Typography>Reparado Por: {venta.Reparacion?.reparadoPor || "-"}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
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