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

interface Nota {
  id: number;
  contenido: string;
  createdAt: string;
}

const Notas = () => {
  const navigate = useNavigate();

  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [loading, setLoading] = useState(false);
  const [notaAEliminar, setNotaAEliminar] = useState<{id: number;contenido: string;createdAt: string;} | null>(null);


  const cargarNotas = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Nota[]>("https://up-gestiondenegocio-production.up.railway.app/notas");
      setNotas(res.data);
    } catch (error) {
      console.error("Error al cargar notas:", error);
    } finally {
      setLoading(false);
    }
  };

  const agregarNota = async () => {
    if (nuevaNota.trim() === "") return;
    try {
      await axios.post("https://up-gestiondenegocio-production.up.railway.app/notas", { contenido: nuevaNota });
      setNuevaNota("");
      cargarNotas();
    } catch (error) {
      console.error("Error al agregar nota:", error);
    }
  };

  const eliminarNota = async (id: number) => {
    try {
      await axios.delete(`https://up-gestiondenegocio-production.up.railway.app/notas/${id}`);
      cargarNotas();
    } catch (error) {
      console.error("Error al eliminar nota:", error);
    }
  };

  useEffect(() => {
    cargarNotas();
  }, []);

  return (
  <Paper sx={{ maxWidth: 600, mx: "auto", p: 4, mt: 4, borderRadius: 3 }}>
    {/* Botón Volver al Home */}
    <Box sx={{ mb: 3 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/home")} // asegurate de tener `const navigate = useNavigate();`
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
      Notas
    </Typography>

    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
      <TextField
        fullWidth
        variant="outlined"
        label="Nueva Nota"
        value={nuevaNota}
        onChange={(e) => setNuevaNota(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") agregarNota();
        }}
        disabled={loading}
      />
      <Button variant="contained" color="primary" onClick={agregarNota} disabled={loading}>
        Agregar
      </Button>
    </Box>

    <List>
      {notas.length === 0 && !loading && (
        <Typography align="center" color="text.secondary">
          No hay notas para mostrar.
        </Typography>
      )}

      {notas.map((nota) => (
        <div key={nota.id}>
          <ListItem
            secondaryAction={
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setNotaAEliminar(nota)} // abrimos el dialog
              >
                Eliminar
              </Button>
            }
          >
            <ListItemText
              primary={nota.contenido}
              secondary={new Date(nota.createdAt).toLocaleString()}
            />
          </ListItem>
          <Divider component="li" />
        </div>
      ))}
    </List>

    {/* Dialog de confirmación */}
    <Dialog
      open={!!notaAEliminar}
      onClose={() => setNotaAEliminar(null)}
    >
      <DialogTitle sx={{ color: "error.main" }}>Confirmar Eliminación</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Estás seguro que deseas eliminar esta nota?
        </Typography>
        <Typography sx={{ mt: 1, fontStyle: "italic" }}>
          "{notaAEliminar?.contenido}"
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setNotaAEliminar(null)}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            eliminarNota(notaAEliminar!.id);
            setNotaAEliminar(null);
          }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  </Paper>
);
};

export default Notas;
