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
}

interface Accesorio {
  id: number;
  nombre: string;
  stock: number;
  vendido: boolean;
}

const ControlDeStock: React.FC = () => {
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [accesorios, setAccesorios] = useState<Accesorio[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filtro, setFiltro] = useState("");

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
          axios.get<Celular[]>("http://localhost:3001/celulares", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Accesorio[]>("http://localhost:3001/accesorios", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Proveedor[]>("http://localhost:3001/proveedores", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setCelulares(celularesRes.data);
        setAccesorios(accesoriosRes.data);
        setProveedores(proveedoresRes.data);
        setError(null);
      } catch (err) {
        setError("Error al cargar los datos");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verificarAdminYFetch();
  }, []);

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

  const eliminarCelular = async (id: number) => {
    if (!window.confirm("¿Está seguro que desea eliminar este celular?")) return;
    const token = localStorage.getItem("token") || "";
    try {
      await axios.delete(`http://localhost:3001/celulares/${id}`, {
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
      await axios.delete(`http://localhost:3001/accesorios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccesorios((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Error eliminando accesorio");
    }
  };

  const getNombreProveedor = (idProveedor?: number) => {
    if (!idProveedor) return "-";
    const prov = proveedores.find((p) => p.id === idProveedor);
    return prov ? prov.nombre : "Desconocido";
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
                    <TableCell>
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
                  {["Nombre", "Stock", "Acciones"].map((header) => (
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
                    <TableCell>
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
    </Box>
  );
};

export default ControlDeStock;
