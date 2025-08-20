import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

interface Proveedor {
  id: number;
  nombre: string;
  createdAt: string;
}

const Proveedores = () => {
  const navigate = useNavigate();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [nuevoProveedor, setNuevoProveedor] = useState("");
  const [loading, setLoading] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState<Proveedor | null>(null);

  const API_URL = "https://up-gestiondenegocio-production.up.railway.app/proveedores";

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Proveedor[]>(API_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, // 🔹 Si usás auth
      });
      setProveedores(res.data);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  const agregarProveedor = async () => {
    if (nuevoProveedor.trim() === "") return;
    try {
      await axios.post(
        API_URL,
        { nombre: nuevoProveedor },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setNuevoProveedor("");
      cargarProveedores();
    } catch (error) {
      console.error("Error al agregar proveedor:", error);
    }
  };

  const eliminarProveedor = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      cargarProveedores();
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  return (
    <Paper sx={{ maxWidth: 600, mx: "auto", p: 4, mt: 4, borderRadius: 3, boxShadow: 4 }}>
      {/* Botón Volver al Home */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/home")}
        >
          Volver al Inicio
        </Button>
      </Box>

      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ color: "#1565c0", fontWeight: "bold" }}
      >
        Proveedores
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Nuevo Proveedor"
          value={nuevoProveedor}
          onChange={(e) => setNuevoProveedor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") agregarProveedor();
          }}
          disabled={loading}
        />
        <Button variant="contained" color="success" onClick={agregarProveedor} disabled={loading}>
          Agregar
        </Button>
      </Box>

      <List>
        {proveedores.length === 0 && !loading && (
          <Typography align="center" color="text.secondary">
            No hay proveedores registrados.
          </Typography>
        )}

        {proveedores.map((prov) => (
          <div key={prov.id}>
            <ListItem
              secondaryAction={
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setProveedorAEliminar(prov)} // abrimos el dialog
                >
                  Eliminar
                </Button>
              }
            >
              <ListItemText
                primary={prov.nombre}
                secondary={`Registrado: ${new Date(prov.createdAt).toLocaleDateString()}`}
              />
            </ListItem>
            <Divider component="li" />
          </div>
        ))}
      </List>

      {/* Dialog de confirmación */}
      <Dialog
        open={!!proveedorAEliminar}
        onClose={() => setProveedorAEliminar(null)}
      >
        <DialogTitle sx={{ color: "error.main" }}>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro que deseas eliminar este proveedor?
          </Typography>
          <Typography sx={{ mt: 1, fontStyle: "italic" }}>
            "{proveedorAEliminar?.nombre}"
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProveedorAEliminar(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              eliminarProveedor(proveedorAEliminar!.id);
              setProveedorAEliminar(null);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Proveedores;
