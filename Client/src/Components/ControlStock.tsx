import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

import {
  Box,
  Typography,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

interface DecodedToken {
  admin: boolean;
}

interface Proveedor {
  id: number;
  nombre: string;
}

interface Celular {
  id: number;
  modelo: string;
  almacenamiento: string;
  bateria: string;
  color: string;
  precio: number;
  stock: number;
  idProveedor?: number;
  imei: string;
  vendido: boolean;
  fechaIngreso?: string;
}

interface Accesorio {
  id: number;
  nombre: string;
  stock: number;
  precio: number; // agregado precio
  vendido: boolean;
}

const ControlDeStock: React.FC = () => {
  // Estados generales
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [accesorios, setAccesorios] = useState<Accesorio[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filtro, setFiltro] = useState("");

  // Estados para edición
  const [celularSeleccionado, setCelularSeleccionado] = useState<Celular | null>(null);
  const [accesorioSeleccionado, setAccesorioSeleccionado] = useState<Accesorio | null>(null);

  // Carga inicial y verificación admin
  useEffect(() => {
    const verificarAdminYFetch = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAdmin(false);
        return;
      }
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded.admin) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(true);
        setLoading(true);
        const [celularesRes, accesoriosRes, proveedoresRes] = await Promise.all([
          axios.get<Celular[]>("https://up-gestiondenegocio-production.up.railway.app/celulares", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Accesorio[]>("https://up-gestiondenegocio-production.up.railway.app/accesorios", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Proveedor[]>("https://up-gestiondenegocio-production.up.railway.app/proveedores", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCelulares(celularesRes.data);
        setAccesorios(accesoriosRes.data);
        setProveedores(proveedoresRes.data);
        setError(null);
      } catch {
        setError("Error al cargar los datos");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    verificarAdminYFetch();
  }, []);

  // Filtrados y disponibles
  const celularesDisponibles = celulares.filter((c) => !c.vendido);
  const accesoriosDisponibles = accesorios.filter((a) => !a.vendido);

  const filtrarCelulares = (items: Celular[], filtro: string): Celular[] => {
    const texto = filtro.toLowerCase();
    return items.filter((c) => {
      const proveedorNombre =
        proveedores.find((p) => p.id === c.idProveedor)?.nombre.toLowerCase() ?? "";
      return (
        c.modelo.toLowerCase().includes(texto) ||
        c.almacenamiento.toLowerCase().includes(texto) ||
        c.bateria.toLowerCase().includes(texto) ||
        c.color.toLowerCase().includes(texto) ||
        c.imei.toLowerCase().includes(texto) ||
        proveedorNombre.includes(texto)
      );
    });
  };

  const filtrarAccesorios = (items: Accesorio[], filtro: string): Accesorio[] => {
    const texto = filtro.toLowerCase();
    return items.filter((a) => a.nombre.toLowerCase().includes(texto));
  };

  const celularesFiltrados = filtrarCelulares(celularesDisponibles, filtro);
  const accesoriosFiltrados = filtrarAccesorios(accesoriosDisponibles, filtro);

  // Eliminar funciones
  const eliminarCelular = async (id: number) => {
    if (!window.confirm("¿Está seguro que desea eliminar este celular?")) return;
    const token = localStorage.getItem("token") || "";
    try {
      await axios.delete(`https://up-gestiondenegocio-production.up.railway.app/celulares/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCelulares((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Error eliminando celular");
    }
  };

  const eliminarAccesorio = async (id: number) => {
    if (!window.confirm("¿Está seguro que desea eliminar este accesorio?")) return;
    const token = localStorage.getItem("token") || "";
    try {
      await axios.delete(`https://up-gestiondenegocio-production.up.railway.app/accesorios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccesorios((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Error eliminando accesorio");
    }
  };

  // Nombre proveedor para display
  const getNombreProveedor = (idProveedor?: number) => {
    if (!idProveedor) return "-";
    const prov = proveedores.find((p) => p.id === idProveedor);
    return prov ? prov.nombre : "Desconocido";
  };

  // Guardar edición celular
  const handleEditarCelular = async () => {
    if (!celularSeleccionado) return;
    const token = localStorage.getItem("token") || "";

    try {
      const { id, modelo, almacenamiento, bateria, color, precio, stock, idProveedor, imei, fechaIngreso } =
        celularSeleccionado;

      const res = await axios.put<Celular>(
        `https://up-gestiondenegocio-production.up.railway.app/celulares/${id}`,
        { modelo, almacenamiento, bateria, color, precio, stock, idProveedor, imei, fechaIngreso },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCelulares((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      );
      setCelularSeleccionado(null);
      setError(null);
    } catch {
      setError("Error actualizando celular");
    }
  };

  // Guardar edición accesorio
  const handleEditarAccesorio = async () => {
    if (!accesorioSeleccionado) return;
    const token = localStorage.getItem("token") || "";

    try {
      const { id, nombre, stock, precio } = accesorioSeleccionado;
      const res = await axios.put<Accesorio>(
        `https://up-gestiondenegocio-production.up.railway.app/accesorios/${id}`,
        { nombre, stock, precio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccesorios((prev) =>
        prev.map((a) => (a.id === id ? res.data : a))
      );
      setAccesorioSeleccionado(null);
      setError(null);
    } catch {
      setError("Error actualizando accesorio");
    }
  };

  if (!isAdmin) {
    return (
      <Box p={6} textAlign="center">
        <Typography color="error" fontWeight="bold">
          Acceso denegado
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Cargando stock...</Typography>
      </Box>
    );
  }

  return (
    <Box p={6} maxWidth="1200px" margin="0 auto">
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Control de Stock
      </Typography>

      <TextField
        label="Buscar por modelo, almacenamiento, color, proveedor, nombre accesorio..."
        variant="outlined"
        fullWidth
        margin="normal"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {/* Celulares */}
      <Box mb={6}>
        <Typography variant="h5" fontWeight="semibold" mb={2}>
          Celulares Disponibles
        </Typography>

        {celularesFiltrados.length === 0 ? (
          <Typography color="textSecondary">No hay celulares en stock.</Typography>
        ) : (
          <TableContainer component={Paper} elevation={3}>
            <Table size="small" aria-label="tabla celulares disponibles">
              <TableHead>
                <TableRow>
                  {[
                    "Modelo",
                    "Almacenamiento",
                    "Batería",
                    "Color",
                    "Precio",
                    "Stock",
                    "Proveedor",
                    "IMEI",
                    "Fecha Ingreso",
                    "Acciones",
                  ].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: "bold" }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {celularesFiltrados.map((celular) => (
                  <TableRow key={celular.id} hover>
                    <TableCell>{celular.modelo}</TableCell>
                    <TableCell>{celular.almacenamiento}</TableCell>
                    <TableCell>{celular.bateria}</TableCell>
                    <TableCell>{celular.color}</TableCell>
                    <TableCell>${celular.precio.toFixed(2)}</TableCell>
                    <TableCell>{celular.stock}</TableCell>
                    <TableCell>{getNombreProveedor(celular.idProveedor)}</TableCell>
                    <TableCell>{celular.imei}</TableCell>
                    <TableCell>{celular.fechaIngreso || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => setCelularSeleccionado(celular)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => eliminarCelular(celular.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Accesorios */}
      <Box>
        <Typography variant="h5" fontWeight="semibold" mb={2}>
          Accesorios Disponibles
        </Typography>

        {accesoriosFiltrados.length === 0 ? (
          <Typography color="textSecondary">No hay accesorios en stock.</Typography>
        ) : (
          <TableContainer component={Paper} elevation={3}>
            <Table size="small" aria-label="tabla accesorios disponibles">
              <TableHead>
                <TableRow>
                  {["Nombre", "Stock", "Precio", "Acciones"].map((header) => (
                    <TableCell key={header} sx={{ fontWeight: "bold" }}>
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {accesoriosFiltrados.map((accesorio) => (
                  <TableRow key={accesorio.id} hover>
                    <TableCell>{accesorio.nombre}</TableCell>
                    <TableCell>{accesorio.stock}</TableCell>
                    <TableCell>${accesorio.precio.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => setAccesorioSeleccionado(accesorio)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => eliminarAccesorio(accesorio.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Modal edición celular */}
      <Dialog
        open={!!celularSeleccionado}
        onClose={() => setCelularSeleccionado(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Celular</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Modelo"
            value={celularSeleccionado?.modelo || ""}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, modelo: e.target.value } : null
              )
            }
          />
          <TextField
            label="Almacenamiento"
            value={celularSeleccionado?.almacenamiento || ""}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, almacenamiento: e.target.value } : null
              )
            }
          />
          <TextField
            label="Batería"
            value={celularSeleccionado?.bateria || ""}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, bateria: e.target.value } : null
              )
            }
          />
          <TextField
            label="Color"
            value={celularSeleccionado?.color || ""}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, color: e.target.value } : null
              )
            }
          />
          <TextField
            type="number"
            label="Precio"
            value={celularSeleccionado?.precio || 0}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, precio: parseFloat(e.target.value) } : null
              )
            }
          />
          <TextField
            type="number"
            label="Stock"
            value={celularSeleccionado?.stock || 0}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, stock: parseInt(e.target.value) } : null
              )
            }
          />
          <TextField
            select
            label="Proveedor"
            value={celularSeleccionado?.idProveedor || ""}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, idProveedor: parseInt(e.target.value) } : null
              )
            }
            SelectProps={{ native: true }}
          >
            <option value="">Sin proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </TextField>
          <TextField
            label="IMEI"
            value={celularSeleccionado?.imei || ""}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, imei: e.target.value } : null
              )
            }
          />
          <TextField
            label="Fecha Ingreso"
            type="date"
            value={celularSeleccionado?.fechaIngreso || ""}
            onChange={(e) =>
              setCelularSeleccionado((prev) =>
                prev ? { ...prev, fechaIngreso: e.target.value } : null
              )
            }
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCelularSeleccionado(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditarCelular}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal edición accesorio */}
      <Dialog
        open={!!accesorioSeleccionado}
        onClose={() => setAccesorioSeleccionado(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Accesorio</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nombre"
            value={accesorioSeleccionado?.nombre || ""}
            onChange={(e) =>
              setAccesorioSeleccionado((prev) =>
                prev ? { ...prev, nombre: e.target.value } : null
              )
            }
          />
          <TextField
            type="number"
            label="Stock"
            value={accesorioSeleccionado?.stock || 0}
            onChange={(e) =>
              setAccesorioSeleccionado((prev) =>
                prev ? { ...prev, stock: parseInt(e.target.value) } : null
              )
            }
          />
          <TextField
            type="number"
            label="Precio"
            value={accesorioSeleccionado?.precio || 0}
            onChange={(e) =>
              setAccesorioSeleccionado((prev) =>
                prev ? { ...prev, precio: parseFloat(e.target.value) } : null
              )
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccesorioSeleccionado(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditarAccesorio}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ControlDeStock;
