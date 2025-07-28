import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import axios from 'axios';

interface Celular {
  id: number;
  modelo: string;
  almacenamiento: string;
  bateria: string;
  color: string;
  precio: number;
  observaciones?: string | null;
}

interface Item {
  id: number;
  nombre: string;
}

interface Reparacion {
  id: number;
  descripcion: string;
}

// ... importaciones y tipos igual ...

const AddVenta: React.FC = () => {
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [accesorios, setAccesorios] = useState<Item[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);

  const [selectedCelularId, setSelectedCelularId] = useState<number | ''>('');
  const [celularData, setCelularData] = useState<Omit<Celular, 'id'>>({
    modelo: '',
    almacenamiento: '',
    bateria: '',
    color: '',
    precio: 0,
    observaciones: '',
  });

  const [selectedAccesorio, setSelectedAccesorio] = useState<number | ''>('');
  const [selectedReparacion, setSelectedReparacion] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [total, setTotal] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [celRes, accRes, repRes] = await Promise.all([
          axios.get<Celular[]>("http://localhost:3001/celulares"),
          axios.get<Item[]>("http://localhost:3001/accesorios"),
          axios.get<Reparacion[]>("http://localhost:3001/reparaciones"),
        ]);
        setCelulares(celRes.data);
        setAccesorios(accRes.data);
        setReparaciones(repRes.data);
      } catch {
        setError('Error al cargar datos para selección');
      }
    };
    fetchData();
  }, []);

  const handleCelularSelect = (value: Celular | null) => {
    if (value) {
      setSelectedCelularId(value.id);
      setCelularData({
        modelo: value.modelo,
        almacenamiento: value.almacenamiento,
        bateria: value.bateria,
        color: value.color,
        precio: value.precio,
        observaciones: value.observaciones || '',
      });
    } else {
      setSelectedCelularId('');
      setCelularData({
        modelo: '',
        almacenamiento: '',
        bateria: '',
        color: '',
        precio: 0,
        observaciones: '',
      });
    }
  };

  const handleAccesorioSelect = (value: Item | null) => {
    setSelectedAccesorio(value ? value.id : '');
  };

  const handleReparacionSelect = (value: Reparacion | null) => {
    setSelectedReparacion(value ? value.id : '');
  };

  const handleInputChange = (field: keyof typeof celularData, value: string | number) => {
    setCelularData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!cantidad || cantidad < 1) {
      setError('La cantidad debe ser mayor que cero');
      return;
    }
    if (!total || total <= 0) {
      setError('El total debe ser un número positivo');
      return;
    }
    if (
      selectedCelularId === '' &&
      selectedAccesorio === '' &&
      selectedReparacion === ''
    ) {
      setError('Debe seleccionar o completar un celular, accesorio o reparación');
      return;
    }
    if (selectedCelularId === '' && !celularData.modelo) {
      setError('Debe completar el modelo del celular');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:3001/ventas', {
        cantidad,
        total,
        celular: selectedCelularId ? { id: selectedCelularId } : { ...celularData },
        accesorioId: selectedAccesorio !== '' ? selectedAccesorio : null,
        reparacionId: selectedReparacion !== '' ? selectedReparacion : null,
      });
      setSuccess('Venta agregada con éxito');
      setCantidad(1);
      setTotal('');
      setSelectedCelularId('');
      setCelularData({
        modelo: '',
        almacenamiento: '',
        bateria: '',
        color: '',
        precio: 0,
        observaciones: '',
      });
      setSelectedAccesorio('');
      setSelectedReparacion('');
    } catch {
      setError('Error al agregar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Agregar Nueva Venta
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>

          <Autocomplete
            options={celulares}
            getOptionLabel={(option) => option.modelo}
            value={celulares.find((c) => c.id === selectedCelularId) || null}
            onChange={(_, value) => handleCelularSelect(value)}
            renderInput={(params) => (
              <TextField {...params} label="Celular (opcional)" sx={{ mb: 2 }} />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          <TextField
            label="Modelo"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={celularData.modelo}
            onChange={(e) => handleInputChange('modelo', e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Almacenamiento"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={celularData.almacenamiento}
            onChange={(e) => handleInputChange('almacenamiento', e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Batería"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={celularData.bateria}
            onChange={(e) => handleInputChange('bateria', e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Color"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={celularData.color}
            onChange={(e) => handleInputChange('color', e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Precio"
            type="number"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={celularData.precio}
            onChange={(e) => handleInputChange('precio', Number(e.target.value))}
            disabled={loading}
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Observaciones"
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
            value={celularData.observaciones}
            onChange={(e) => handleInputChange('observaciones', e.target.value)}
            disabled={loading}
          />

          <Autocomplete
            options={accesorios}
            getOptionLabel={(option) => option.nombre}
            value={accesorios.find((a) => a.id === selectedAccesorio) || null}
            onChange={(_, value) => handleAccesorioSelect(value)}
            renderInput={(params) => (
              <TextField {...params} label="Accesorio (opcional)" sx={{ mb: 2 }} />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          <Autocomplete
            options={reparaciones}
            getOptionLabel={(option) => option.descripcion}
            value={reparaciones.find((r) => r.id === selectedReparacion) || null}
            onChange={(_, value) => handleReparacionSelect(value)}
            renderInput={(params) => (
              <TextField {...params} label="Reparación (opcional)" sx={{ mb: 2 }} />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          <TextField
            label="Cantidad"
            type="number"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            inputProps={{ min: 1 }}
            disabled={loading}
          />
          <TextField
            label="Total"
            type="number"
            fullWidth
            required
            sx={{ mb: 3 }}
            value={total}
            onChange={(e) => setTotal(Number(e.target.value))}
            inputProps={{ min: 0.01, step: 0.01 }}
            disabled={loading}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Agregar Venta'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddVenta;
