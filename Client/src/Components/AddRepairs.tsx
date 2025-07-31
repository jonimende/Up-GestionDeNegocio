import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  admin?: boolean;
  rol?: string;
}

const AddReparacion = () => {
  const [descripcion, setDescripcion] = useState('');
  const [valor, setValor] = useState('');
  const [reparadoPor, setReparadoPor] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarAdminYObtenerCaja = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded.admin) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        // await obtenerCaja(); // si necesitás llamar algo más
      } catch (error) {
        console.error('Error verificando admin:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verificarAdminYObtenerCaja();
  }, []);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/reparaciones',
        {
          descripcion,
          valor: parseFloat(valor),
          reparadoPor,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMensaje('Reparación agregada con éxito');
      setDescripcion('');
      setValor('');
      setReparadoPor('');
    } catch (error) {
      console.error(error);
      setMensaje('Error al agregar reparación');
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (!isAdmin) {
    return (
      <Typography variant="h6" color="error" style={{ margin: 20 }}>
        No estás autorizado para agregar reparaciones.
      </Typography>
    );
  }

  return (
    <Paper style={{ padding: 20, margin: 20 }}>
      <Typography variant="h6">Agregar Reparación</Typography>
      <TextField
        label="Descripción"
        fullWidth
        margin="normal"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <TextField
        label="Valor"
        type="number"
        fullWidth
        margin="normal"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <TextField
        label="Reparado Por"
        fullWidth
        margin="normal"
        value={reparadoPor}
        onChange={(e) => setReparadoPor(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        style={{ marginTop: 16 }}
      >
        Guardar
      </Button>
      {mensaje && <Typography style={{ marginTop: 10 }}>{mensaje}</Typography>}
    </Paper>
  );
};

export default AddReparacion;
