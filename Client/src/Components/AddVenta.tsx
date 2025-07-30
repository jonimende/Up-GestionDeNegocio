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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface Celular {
  id: number;
  modelo: string;
  almacenamiento: string;
  bateria: string;
  color: string;
  precio: number;
  observaciones?: string | null;
  fechaIngreso?: string | null;
  imei?: string | null;
  proveedorId?: number | null;
}

interface Item {
  id: number;
  nombre: string;
}

interface Reparacion {
  id: number;
  descripcion: string;
  valor: number;
}

interface Proveedor {
  id: number;
  nombre: string;
}

const metodoPagoOptions = ['Efectivo', 'Transferencia'];

const AddVenta: React.FC = () => {
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [accesorios, setAccesorios] = useState<Item[]>([]);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [selectedCelularId, setSelectedCelularId] = useState<number | ''>('');
  const [celularData, setCelularData] = useState<Omit<Celular, 'id'>>({
    modelo: '',
    almacenamiento: '',
    bateria: '',
    color: '',
    precio: 0,
    observaciones: '',
    imei: '',
    proveedorId: null,
  });

  const [selectedAccesorio, setSelectedAccesorio] = useState<number | ''>('');
  const [selectedReparacion, setSelectedReparacion] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [total, setTotal] = useState<number | ''>('');
  const [imei, setImei] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('');

  const [isAdmin, setIsAdmin] = useState(false);

  // Campos solo admin
  const [comprador, setComprador] = useState('');
  const [ganancia, setGanancia] = useState<number | ''>('');
  const [idProveedor, setIdProveedor] = useState<number | ''>('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaVenta, setFechaVenta] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode<{ admin: boolean }>(token);
          if (decoded.admin) setIsAdmin(true);
        }
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };
        const [celRes, accRes, repRes, provRes] = await Promise.all([
          axios.get<Celular[]>('http://localhost:3001/celulares', config),
          axios.get<Item[]>('http://localhost:3001/accesorios', config),
          axios.get<Reparacion[]>('http://localhost:3001/reparaciones', config),
          axios.get<Proveedor[]>('http://localhost:3001/proveedores', config),
        ]);
        setCelulares(celRes.data);
        setAccesorios(accRes.data);
        setReparaciones(repRes.data);
        setProveedores(provRes.data);
      } catch {
        setError('Error al cargar datos');
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
        imei: value.imei || '',
        proveedorId: value.proveedorId || null,
      });
      setFechaIngreso(value.fechaIngreso ? value.fechaIngreso.substring(0, 10) : '');
      setFechaVenta(new Date().toISOString().substring(0, 10));
      if (isAdmin) setImei(value.imei || '');
      else setImei('');
      if (isAdmin && value.proveedorId) setIdProveedor(value.proveedorId);
      else setIdProveedor('');
    } else {
      setSelectedCelularId('');
      setCelularData({
        modelo: '',
        almacenamiento: '',
        bateria: '',
        color: '',
        precio: 0,
        observaciones: '',
        imei: '',
        proveedorId: null,
      });
      setFechaIngreso('');
      setFechaVenta('');
      setImei('');
      setIdProveedor('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!cantidad || cantidad < 1) return setError('Cantidad inválida');
    if (!total || total <= 0) return setError('Total inválido');
    if (
      selectedCelularId === '' &&
      selectedAccesorio === '' &&
      selectedReparacion === ''
    )
      return setError('Seleccione al menos un producto');
    if (selectedCelularId === '' && !celularData.modelo)
      return setError('Complete los datos del celular');
    if (isAdmin && !comprador.trim()) return setError('Falta el comprador');
    if (isAdmin && !imei.trim()) return setError('Falta el IMEI');
    if (!metodoPago.trim()) return setError('Falta el método de pago');

    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const payload: any = {
        cantidad,
        total,
        celularId: selectedCelularId !== '' ? selectedCelularId : null,
        accesorioId: selectedAccesorio !== '' ? selectedAccesorio : null,
        reparacionId: selectedReparacion !== '' ? selectedReparacion : null,
        metodoPago,
      };
      if (isAdmin) {
        payload.comprador = comprador;
        payload.ganancia = ganancia !== '' ? ganancia : null;
        payload.idProveedor = idProveedor !== '' ? idProveedor : null;
        payload.fechaIngreso = fechaIngreso || null;
        payload.fechaVenta = fechaVenta || null;
        payload.imei = imei;
      }
      await axios.post('http://localhost:3001/ventas', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Venta agregada correctamente');
      setCantidad(1);
      setTotal('');
      setSelectedCelularId('');
      setSelectedAccesorio('');
      setSelectedReparacion('');
      setCelularData({
        modelo: '',
        almacenamiento: '',
        bateria: '',
        color: '',
        precio: 0,
        observaciones: '',
        imei: '',
        proveedorId: null,
      });
      setComprador('');
      setGanancia('');
      setIdProveedor('');
      setFechaIngreso('');
      setFechaVenta('');
      setImei('');
      setMetodoPago('');
    } catch {
      setError('Error al guardar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Agregar Venta
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Autocomplete
            options={celulares}
            getOptionLabel={(option) => option.modelo}
            value={celulares.find((c) => c.id === selectedCelularId) || null}
            onChange={(_, value) => handleCelularSelect(value)}
            renderInput={(params) => (
              <TextField {...params} label="Celular" sx={{ mb: 2 }} />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          <TextField
            label="Modelo"
            fullWidth
            sx={{ mb: 2 }}
            value={celularData.modelo}
            onChange={(e) =>
              setCelularData({ ...celularData, modelo: e.target.value })
            }
          />

          <TextField
            label="Almacenamiento"
            fullWidth
            sx={{ mb: 2 }}
            value={celularData.almacenamiento}
            onChange={(e) =>
              setCelularData({ ...celularData, almacenamiento: e.target.value })
            }
          />

          <TextField
            label="Batería"
            fullWidth
            sx={{ mb: 2 }}
            value={celularData.bateria}
            onChange={(e) =>
              setCelularData({ ...celularData, bateria: e.target.value })
            }
          />

          <TextField
            label="Color"
            fullWidth
            sx={{ mb: 2 }}
            value={celularData.color}
            onChange={(e) =>
              setCelularData({ ...celularData, color: e.target.value })
            }
          />

          <TextField
            label="Precio"
            fullWidth
            type="number"
            sx={{ mb: 2 }}
            value={celularData.precio}
            onChange={(e) =>
              setCelularData({ ...celularData, precio: Number(e.target.value) })
            }
          />

          <TextField
            label="Observaciones"
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
            value={celularData.observaciones}
            onChange={(e) =>
              setCelularData({ ...celularData, observaciones: e.target.value })
            }
          />

          <Autocomplete
            options={accesorios}
            getOptionLabel={(option) => option.nombre}
            value={accesorios.find((a) => a.id === selectedAccesorio) || null}
            onChange={(_, value) => setSelectedAccesorio(value ? value.id : '')}
            renderInput={(params) => (
              <TextField {...params} label="Accesorio" sx={{ mb: 2 }} />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          <Autocomplete
            options={reparaciones}
            getOptionLabel={(option) => option.descripcion}
            value={reparaciones.find((r) => r.id === selectedReparacion) || null}
            onChange={(_, value) => {
              setSelectedReparacion(value ? value.id : '');
              if (value && value.valor) setTotal(value.valor);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Reparación" sx={{ mb: 2 }} />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          <TextField
            label="Cantidad"
            fullWidth
            type="number"
            sx={{ mb: 2 }}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
          />

          <TextField
            label="Total"
            fullWidth
            type="number"
            sx={{ mb: 3 }}
            value={total}
            onChange={(e) => setTotal(Number(e.target.value))}
          />

          {/* IMEI solo admin */}
          {isAdmin && (
            <TextField
              label="IMEI"
              fullWidth
              sx={{ mb: 2 }}
              value={imei}
              onChange={(e) => setImei(e.target.value)}
            />
          )}

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="metodo-pago-label">Método de pago</InputLabel>
            <Select
              labelId="metodo-pago-label"
              label="Método de pago"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              disabled={loading}
            >
              {metodoPagoOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Campos admin */}
          {isAdmin && (
            <>
              <TextField
                label="Comprador"
                fullWidth
                sx={{ mb: 2 }}
                value={comprador}
                onChange={(e) => setComprador(e.target.value)}
              />
              <TextField
                label="Ganancia"
                fullWidth
                type="number"
                sx={{ mb: 2 }}
                value={ganancia}
                onChange={(e) => setGanancia(Number(e.target.value))}
              />
              <Autocomplete
                options={proveedores}
                getOptionLabel={(option) => option.nombre}
                value={proveedores.find((p) => p.id === idProveedor) || null}
                onChange={(_, value) => setIdProveedor(value ? value.id : '')}
                renderInput={(params) => (
                  <TextField {...params} label="Proveedor" sx={{ mb: 2 }} />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loading}
              />
              <TextField
                label="Fecha Ingreso"
                type="date"
                fullWidth
                sx={{ mb: 2 }}
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha Venta"
                type="date"
                fullWidth
                sx={{ mb: 3 }}
                value={fechaVenta}
                onChange={(e) => setFechaVenta(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Agregar Venta'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddVenta;
