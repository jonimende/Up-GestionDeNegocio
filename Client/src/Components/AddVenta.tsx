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
  precio?: number;
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

function isAxiosError(error: any): error is { isAxiosError: boolean; response?: { status?: number } } {
  return error && error.isAxiosError === true;
}

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
    fechaIngreso: null,
  });

  const [selectedAccesorio, setSelectedAccesorio] = useState<number | ''>('');
  const [selectedReparacion, setSelectedReparacion] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [total, setTotal] = useState<number | ''>('');
  const [imei, setImei] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<string>('');

  const [isAdmin, setIsAdmin] = useState(false);
  const [comprador, setComprador] = useState('');
  const [ganancia, setGanancia] = useState<number | ''>('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaVenta, setFechaVenta] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showDescuento, setShowDescuento] = useState(false);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState<number>(0);

  // Nuevo estado para el nombre del proveedor editable
  const [proveedorNombre, setProveedorNombre] = useState<string>('');

  const refetchLists = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [celRes, accRes, repRes, provRes] = await Promise.all([
        axios.get<Celular[]>('http://localhost:3001/celulares/disponibles', config),
        axios.get<Item[]>('http://localhost:3001/accesorios/disponibles', config),
        axios.get<Reparacion[]>('http://localhost:3001/reparaciones', config),
        axios.get<Proveedor[]>('http://localhost:3001/proveedores', config),
      ]);
      setCelulares(celRes.data);
      setAccesorios(accRes.data);
      setReparaciones(repRes.data);
      setProveedores(provRes.data);
    } catch {
      setError('Error al recargar productos');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        if (token) {
          const decoded = jwtDecode<{ admin: boolean }>(token);
          if (decoded.admin) setIsAdmin(true);
        }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [celRes, accRes, repRes, provRes] = await Promise.all([
          axios.get<Celular[]>('http://localhost:3001/celulares/disponibles', config),
          axios.get<Item[]>('http://localhost:3001/accesorios/disponibles', config),
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
        fechaIngreso: value.fechaIngreso || null,
      });
      setFechaIngreso(value.fechaIngreso ? value.fechaIngreso.substring(0, 10) : '');
      setFechaVenta(new Date().toISOString().substring(0, 10));
      if (isAdmin) {
        setImei(value.imei || '');
      } else {
        setImei('');
      }
      setTotal(value.precio * cantidad);

      // Actualizamos el proveedorNombre cuando seleccionamos un celular
      if (value.proveedorId) {
        const prov = proveedores.find(p => p.id === value.proveedorId);
        setProveedorNombre(prov ? prov.nombre : '');
      } else {
        setProveedorNombre('');
      }
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
        fechaIngreso: null,
      });
      setFechaIngreso('');
      setFechaVenta('');
      setImei('');
      setTotal('');
      setProveedorNombre('');
    }
  };

  // Manejo selección / ingreso proveedor
  const handleProveedorSelect = (value: Proveedor | null) => {
    if (value) {
      setCelularData({ ...celularData, proveedorId: value.id });
      setProveedorNombre(value.nombre);
    } else {
      setCelularData({ ...celularData, proveedorId: null });
      setProveedorNombre('');
    }
  };

  useEffect(() => {
    let precioCelular = 0;
    if (selectedCelularId !== '') {
      const celular = celulares.find(c => c.id === selectedCelularId);
      if (celular) precioCelular = celular.precio;
    }

    let precioAccesorio = 0;
    if (selectedAccesorio !== '') {
      const accesorio = accesorios.find(a => a.id === selectedAccesorio);
      if (accesorio && accesorio.precio) precioAccesorio = accesorio.precio;
    }

    const nuevoTotal = (precioCelular + precioAccesorio) * cantidad;
    setTotal(nuevoTotal);
  }, [cantidad, selectedCelularId, selectedAccesorio, celulares, accesorios]);

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
    if (selectedCelularId !== '' && !celularData.modelo)
      return setError('Complete los datos del celular');
    if (!comprador.trim()) return setError('Falta el comprador');
    if (isAdmin && selectedCelularId !== '' && !imei.trim()) return setError('Falta el IMEI');
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
        comprador: comprador.trim(),
        proveedorId: celularData.proveedorId,
        proveedorNombre: proveedorNombre.trim() || null,
      };
      if (isAdmin) {
        payload.ganancia = ganancia !== '' ? ganancia : null;
        payload.fechaIngreso = fechaIngreso || null;
        payload.fechaVenta = fechaVenta || null;
        payload.imei = imei;
      }
      await axios.post('http://localhost:3001/ventas', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await refetchLists();

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
        fechaIngreso: null,
      });
      setComprador('');
      setGanancia('');
      setFechaIngreso('');
      setFechaVenta('');
      setImei('');
      setMetodoPago('');
      setPorcentajeDescuento(0);
      setShowDescuento(false);
      setProveedorNombre('');
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          setError('Producto ya no disponible o fue eliminado');
        } else {
          setError('Error al guardar la venta');
        }
      } else {
        setError('Error inesperado al guardar la venta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontWeight: '700',
            fontFamily: "'Roboto Slab', serif",
            color: '#3f51b5',
            mb: 4,
          }}
        >
          Agregar Venta
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Celular */}
          <Autocomplete
            options={celulares}
            getOptionLabel={(option) => option.modelo}
            value={celulares.find((c) => c.id === selectedCelularId) || null}
            onChange={(_, value) => handleCelularSelect(value)}
            renderInput={(params) => <TextField {...params} label="Celular" sx={{ mb: 2 }} />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
              ...(isAdmin && { justifyContent: 'space-between' }),
            }}
          >
            <TextField
              label="Modelo"
              sx={{ flex: isAdmin ? '0 0 48%' : '1 1 100%' }}
              value={celularData.modelo}
              onChange={(e) => setCelularData({ ...celularData, modelo: e.target.value })}
              disabled={loading}
            />
            <TextField
              label="Almacenamiento"
              sx={{ flex: isAdmin ? '0 0 48%' : '1 1 100%' }}
              value={celularData.almacenamiento}
              onChange={(e) => setCelularData({ ...celularData, almacenamiento: e.target.value })}
              disabled={loading}
            />
            <TextField
              label="Batería"
              sx={{ flex: isAdmin ? '0 0 48%' : '1 1 100%' }}
              value={celularData.bateria}
              onChange={(e) => setCelularData({ ...celularData, bateria: e.target.value })}
              disabled={loading}
            />
            <TextField
              label="Color"
              sx={{ flex: isAdmin ? '0 0 48%' : '1 1 100%' }}
              value={celularData.color}
              onChange={(e) => setCelularData({ ...celularData, color: e.target.value })}
              disabled={loading}
            />
            <TextField
              label="Precio"
              type="number"
              sx={{ flex: isAdmin ? '0 0 48%' : '1 1 100%' }}
              value={celularData.precio}
              onChange={(e) => setCelularData({ ...celularData, precio: Number(e.target.value) })}
              disabled={loading}
            />
            <TextField
              label="Observaciones"
              multiline
              rows={2}
              sx={{ flex: isAdmin ? '0 0 48%' : '1 1 100%' }}
              value={celularData.observaciones}
              onChange={(e) => setCelularData({ ...celularData, observaciones: e.target.value })}
              disabled={loading}
            />
          </Box>

          {/* Proveedor editable */}
          <Autocomplete
            options={proveedores}
            getOptionLabel={(option) => {
              // option puede ser string o Proveedor
              if (typeof option === 'string') {
                return option; // texto libre
              }
              return option.nombre; // objeto proveedor
            }}
            value={
              // value puede ser string | Proveedor | null
              typeof proveedorNombre === 'string'
                ? null
                : proveedorNombre
            }
            onChange={(_, value) => {
              if (typeof value === 'string') {
                // texto libre ingresado manualmente
                setProveedorNombre(value);
                setCelularData({ ...celularData, proveedorId: null });
              } else if (value && typeof value === 'object') {
                // valor seleccionado del listado
                setProveedorNombre(value.nombre);
                setCelularData({ ...celularData, proveedorId: value.id });
              } else {
                setProveedorNombre('');
                setCelularData({ ...celularData, proveedorId: null });
              }
            }}
            inputValue={proveedorNombre}
            onInputChange={(_, newInputValue) => setProveedorNombre(newInputValue)}
            renderInput={(params) => (
              <TextField {...params} label="Proveedor" sx={{ mb: 2 }} />
            )}
            disabled={loading}
            freeSolo
          />
          {/* Accesorio */}
          <Autocomplete
            options={accesorios}
            getOptionLabel={(option) => option.nombre}
            value={accesorios.find((a) => a.id === selectedAccesorio) || null}
            onChange={(_, value) => setSelectedAccesorio(value ? value.id : '')}
            renderInput={(params) => <TextField {...params} label="Accesorio" sx={{ mb: 2 }} />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          {/* Reparación */}
          <Autocomplete
            options={reparaciones}
            getOptionLabel={(option) => option.descripcion}
            value={reparaciones.find((r) => r.id === selectedReparacion) || null}
            onChange={(_, value) => {
              setSelectedReparacion(value ? value.id : '');
              if (value?.valor) setTotal(value.valor);
            }}
            renderInput={(params) => <TextField {...params} label="Reparación" sx={{ mb: 2 }} />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={loading}
          />

          {/* Cantidad y total */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Cantidad"
              type="number"
              sx={{ flex: 1 }}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              disabled={loading}
            />
            <TextField
              label="Total"
              type="number"
              sx={{ flex: 1 }}
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              disabled={loading}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setShowDescuento(!showDescuento)}
              sx={{ flex: '1 1 30%' }}
              disabled={loading}
            >
              {showDescuento ? 'Cancelar Descuento' : 'Agregar Descuento'}
            </Button>

            {showDescuento && (
              <>
                <TextField
                  label="Descuento (%)"
                  type="number"
                  sx={{ flex: '1 1 30%' }}
                  value={porcentajeDescuento}
                  onChange={(e) => setPorcentajeDescuento(Number(e.target.value))}
                  disabled={loading}
                />
                <Box sx={{ flex: '1 1 30%', display: 'flex', alignItems: 'center' }}>
                  <Typography>
                    Nuevo Total: ${total && porcentajeDescuento
                      ? (total - (total * (porcentajeDescuento / 100))).toFixed(2)
                      : total}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    if (total && porcentajeDescuento >= 0) {
                      const nuevoTotal = total - (total * (porcentajeDescuento / 100));
                      setTotal(Number(nuevoTotal.toFixed(2)));
                      setShowDescuento(false);
                      setPorcentajeDescuento(0);
                    }
                  }}
                  sx={{ flex: '1 1 30%' }}
                  disabled={loading || !porcentajeDescuento}
                >
                  Aplicar Descuento
                </Button>
              </>
            )}
          </Box>

          {/* Admin: IMEI */}
          {isAdmin && (
            <TextField
              label="IMEI"
              fullWidth
              sx={{ mb: 2 }}
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              disabled={loading}
            />
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl sx={{ flex: '0 0 48%' }}>
              <InputLabel id="metodo-pago-label">Método de pago</InputLabel>
              <Select
                labelId="metodo-pago-label"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                label="Método de pago"
                disabled={loading}
              >
                {metodoPagoOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Comprador"
              sx={{ flex: '0 0 48%' }}
              value={comprador}
              onChange={(e) => setComprador(e.target.value)}
              disabled={loading}
            />
          </Box>
          {isAdmin && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3,
              }}
            >
              <TextField
                label="Ganancia"
                type="number"
                sx={{ flex: '0 0 48%' }}
                value={ganancia}
                onChange={(e) => setGanancia(Number(e.target.value))}
                disabled={loading}
              />
              <TextField
                label="Fecha Ingreso"
                type="date"
                sx={{ flex: '0 0 48%' }}
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
              <TextField
                label="Fecha Venta"
                type="date"
                sx={{ flex: '0 0 48%' }}
                value={fechaVenta}
                onChange={(e) => setFechaVenta(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={loading}
              />
            </Box>
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
