import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  admin?: boolean;
  rol?: string;
}

const AddReparacion: React.FC = () => {
  const navigate = useNavigate();

  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [reparadoPor, setReparadoPor] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const verificarAdmin = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setIsAdmin(!!decoded.admin);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    verificarAdmin();
  }, []);

  const handleSubmit = async () => {
    setMensaje(null);
    setError(null);

    // Validaciones simples
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }
    if (!valor || isNaN(Number(valor)) || Number(valor) < 0) {
      setError('El valor debe ser un número válido mayor o igual a cero.');
      return;
    }
    if (!reparadoPor.trim()) {
      setError('El campo "Reparado Por" es obligatorio.');
      return;
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://up-gestiondenegocio-production.up.railway.app/reparaciones',
        {
          descripcion,
          valor: parseFloat(valor),
          reparadoPor,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMensaje('Reparación agregada con éxito');
      setDescripcion('');
      setValor('');
      setReparadoPor('');
    } catch (err) {
      console.error(err);
      setError('Error al agregar reparación');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Typography>
    );
  }

  if (!isAdmin) {
    return (
      <Typography
        variant="h6"
        color="error"
        align="center"
        sx={{ mt: 4 }}
      >
        No estás autorizado para agregar reparaciones.
      </Typography>
    );
  }

  return (
    <Paper
  elevation={4}
  sx={{
    p: 4,
    maxWidth: 600,
    mx: 'auto',
    mt: 4,
    fontFamily: 'Roboto, sans-serif',
  }}
>
  <Typography
    variant="h5"
    gutterBottom
    sx={{
      color: '#1565c0', // azul fuerte (MUI blue[800])
      fontWeight: 600,
      fontFamily: 'Roboto, sans-serif',
      textAlign: 'center',
    }}
  >
    Agregar Reparación
  </Typography>

      <TextField
        label="Descripción"
        fullWidth
        margin="normal"
        value={descripcion}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDescripcion(e.target.value)}
      />
      <TextField
        label="Valor"
        type="number"
        fullWidth
        margin="normal"
        inputProps={{ min: 0, step: 0.01 }}
        value={valor}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValor(e.target.value)}
      />
      <TextField
        label="Reparado Por"
        fullWidth
        margin="normal"
        value={reparadoPor}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setReparadoPor(e.target.value)}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {mensaje && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {mensaje}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
        Guardar
        </Button>

        <Button variant="outlined" color="secondary" onClick={() => navigate("/home")}>
          Volver al Home
        </Button>
      </Box>
    </Paper>
  );
};

export default AddReparacion;
