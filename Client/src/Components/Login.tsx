import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";

function isAxiosError(error: any): error is { response?: { data?: { error?: string } } } {
  return error && error.response && error.response.data;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post<{ token: string }>("http://localhost:3001/auth/login", {
        nombre: nombre.trim(),
        password,
      });

      localStorage.setItem("token", response.data.token);
      navigate("/home");
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Error desconocido");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error inesperado");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 2, backgroundColor: "#e3f2fd" }}>
        <Typography variant="h4" align="center" sx={{ mb: 3, color: "#1565c0" }}>
          Iniciar Sesión
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Nombre de usuario"
            variant="outlined"
            fullWidth
            required
            margin="normal"
            autoComplete="username"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Contraseña"
            variant="outlined"
            type="password"
            fullWidth
            required
            margin="normal"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
