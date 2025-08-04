import { useEffect, useState } from "react";
import axios from "axios";
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
} from "@mui/material";

interface Nota {
  id: number;
  contenido: string;
  createdAt: string;
}

const Notas = () => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [loading, setLoading] = useState(false);

  const cargarNotas = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Nota[]>("http://localhost:3001/notas");
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
      await axios.post("http://localhost:3001/notas", { contenido: nuevaNota });
      setNuevaNota("");
      cargarNotas();
    } catch (error) {
      console.error("Error al agregar nota:", error);
    }
  };

  const eliminarNota = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3001/notas/${id}`);
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
                  onClick={() => eliminarNota(nota.id)}
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
    </Paper>
  );
};

export default Notas;
