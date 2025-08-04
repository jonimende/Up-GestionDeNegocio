import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Alert,
  SelectChangeEvent,
} from "@mui/material";

// Tipos
type Reparacion = {
  id: number;
  descripcion: string;
  valor: number;
};

type Proveedor = {
  id: number;
  nombre: string;
};

type Props = {
  onClose?: () => void;
};

type CelularForm = {
  modelo: string;
  almacenamiento: string;
  bateria: string;
  color: string;
  precio: string;
  costo: string;
  idReparacion: string | number;
  valorFinal: string;
  fechaIngreso: string;
  observaciones: string;
  stock: string;
  idProveedor: string | number;
  imei: string;
};

type AccesorioForm = {
  nombre: string;
  stock: string;
  precio: string;
};

const AddStock: React.FC<Props> = ({ onClose }) => {
  const [tipo, setTipo] = useState<null | "celular" | "accesorio">(null);
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [celularForm, setCelularForm] = useState<CelularForm>({
    modelo: "",
    almacenamiento: "",
    bateria: "",
    color: "",
    precio: "",
    costo: "",
    idReparacion: "",
    valorFinal: "",
    fechaIngreso: "",
    observaciones: "",
    stock: "",
    idProveedor: "",
    imei: "",
  });

  const [accesorioForm, setAccesorioForm] = useState<AccesorioForm>({
    nombre: "",
    stock: "",
    precio: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timeout = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMsg]);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    fetch("http://localhost:3001/reparaciones", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar reparaciones");
        return res.json();
      })
      .then(setReparaciones)
      .catch((error) => {
        console.error(error);
        setReparaciones([]);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    fetch("http://localhost:3001/proveedores", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar proveedores");
        return res.json();
      })
      .then(setProveedores)
      .catch((error) => {
        console.error(error);
        setProveedores([]);
      });
  }, []);

  // Manejador para inputs tipo texto, number y textarea
  const handleCelularChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setCelularForm((prev) => {
      let updated = { ...prev, [name]: value };

      const precioNum =
        name === "precio" ? parseFloat(value) : parseFloat(prev.precio);
      const reparacion = reparaciones.find(
        (r) =>
          (name === "idReparacion" ? value : prev.idReparacion.toString()) ===
          r.id.toString()
      );
      const valorReparacion = reparacion ? reparacion.valor : 0;

      const precioValido = !isNaN(precioNum) ? precioNum : 0;

      updated.valorFinal = (precioValido + valorReparacion).toFixed(2);

      return updated;
    });
  };

  // Manejador para selects (MUI) - tiene tipo específico SelectChangeEvent<string>
  const handleCelularSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCelularForm((prev) => {
      let updated = { ...prev, [name]: value };

      const precioNum = name === "precio" ? parseFloat(value) : parseFloat(prev.precio);
      const reparacion = reparaciones.find(
        (r) =>
          (name === "idReparacion" ? value : prev.idReparacion.toString()) ===
          r.id.toString()
      );
      const valorReparacion = reparacion ? reparacion.valor : 0;

      const precioValido = !isNaN(precioNum) ? precioNum : 0;
      updated.valorFinal = (precioValido + valorReparacion).toFixed(2);

      return updated;
    });
  };

  const handleAccesorioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccesorioForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitCelular = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const {
      modelo,
      almacenamiento,
      bateria,
      color,
      precio,
      costo,
      fechaIngreso,
      stock,
      idProveedor,
      imei,
    } = celularForm;

    if (
      !modelo.trim() ||
      !almacenamiento.trim() ||
      !bateria.trim() ||
      !color.trim() ||
      !precio ||
      !costo ||
      !fechaIngreso ||
      !stock ||
      !idProveedor ||
      !imei.trim()
    ) {
      setError(
        "Por favor, completa todos los campos obligatorios (*) incluyendo IMEI"
      );
      return;
    }

    if (
      parseFloat(precio) < 0 ||
      parseFloat(costo) < 0 ||
      parseInt(stock) < 0
    ) {
      setError("Los valores numéricos deben ser mayores o iguales a cero");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const body = {
        modelo,
        almacenamiento,
        bateria,
        color,
        precio: parseFloat(precio),
        costo: parseFloat(costo),
        idReparacion: celularForm.idReparacion
          ? parseInt(celularForm.idReparacion.toString())
          : null,
        valorFinal: celularForm.valorFinal
          ? parseFloat(celularForm.valorFinal)
          : null,
        fechaIngreso,
        observaciones: celularForm.observaciones || null,
        stock: parseInt(stock),
        idProveedor: parseInt(idProveedor.toString()),
        imei,
      };

      const res = await fetch("http://localhost:3001/celulares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al guardar celular");
      }

      setSuccessMsg("Celular agregado con éxito");
      setCelularForm({
        modelo: "",
        almacenamiento: "",
        bateria: "",
        color: "",
        precio: "",
        costo: "",
        idReparacion: "",
        valorFinal: "",
        fechaIngreso: "",
        observaciones: "",
        stock: "",
        idProveedor: "",
        imei: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitAccesorio = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const { nombre, stock, precio } = accesorioForm;

    if (!nombre.trim() || !stock || !precio) {
      setError("Por favor, completa todos los campos obligatorios (*)");
      return;
    }

    if (parseInt(stock) < 0 || parseFloat(precio) < 0) {
      setError("Los valores numéricos deben ser mayores o iguales a cero");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const body = {
        nombre,
        stock: parseInt(stock),
        precio: parseFloat(precio),
      };

      const res = await fetch("http://localhost:3001/accesorios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al guardar accesorio");
      }

      setSuccessMsg("Accesorio agregado con éxito");
      setAccesorioForm({ nombre: "", stock: "", precio: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = () => {
    setTipo(null);
    onClose?.();
  };

  return (
    <Box maxWidth={600} mx="auto" p={3} border={1} borderRadius={2} borderColor="grey.300" boxShadow={1}>
      {!tipo ? (
        <Box textAlign="center">
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Agregar Stock
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setTipo("celular")}
            sx={{ mr: 2 }}
          >
            Agregar Celular
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setTipo("accesorio")}
          >
            Agregar Accesorio
          </Button>
        </Box>
      ) : tipo === "celular" ? (
        <>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Agregar Celular
          </Typography>
          <Box component="form" onSubmit={submitCelular} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              "modelo",
              "almacenamiento",
              "bateria",
              "color",
              "precio",
              "costo",
              "fechaIngreso",
              "stock",
            ].map((field) => (
              <TextField
                key={field}
                type={
                  field === "fechaIngreso"
                    ? "date"
                    : ["precio", "costo", "stock"].includes(field)
                    ? "number"
                    : "text"
                }
                name={field}
                label={`${field.charAt(0).toUpperCase() + field.slice(1)} *`}
                value={celularForm[field as keyof CelularForm] as string}
                onChange={handleCelularChange}
                required
                inputProps={{
                  min: ["precio", "costo", "stock"].includes(field) ? 0 : undefined,
                  step: ["precio", "costo"].includes(field) ? "0.01" : undefined,
                }}
              />
            ))}

            <TextField
              label="IMEI *"
              name="imei"
              value={celularForm.imei}
              onChange={handleCelularChange}
              required
            />

            <FormControl fullWidth>
              <InputLabel id="proveedor-label">Proveedor *</InputLabel>
              <Select
                labelId="proveedor-label"
                id="idProveedor"
                name="idProveedor"
                value={celularForm.idProveedor.toString()}
                label="Proveedor *"
                onChange={handleCelularSelectChange}
                required
              >
                <MenuItem value="">
                  <em>-- Seleccione un proveedor --</em>
                </MenuItem>
                {proveedores.map((p) => (
                  <MenuItem key={p.id} value={p.id.toString()}>
                    {p.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Observaciones"
              name="observaciones"
              value={celularForm.observaciones}
              onChange={handleCelularChange}
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel id="reparacion-label">Reparación (opcional)</InputLabel>
              <Select
                labelId="reparacion-label"
                id="idReparacion"
                name="idReparacion"
                value={celularForm.idReparacion.toString()}
                label="Reparación (opcional)"
                onChange={handleCelularSelectChange}
              >
                <MenuItem value="">
                  <em>-- Seleccione una reparación --</em>
                </MenuItem>
                {reparaciones.map((r) => (
                  <MenuItem key={r.id} value={r.id.toString()}>
                    {r.descripcion} (Valor: ${r.valor.toFixed(2)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Total (Precio + Reparación)"
              value={celularForm.valorFinal}
              InputProps={{
                readOnly: true,
              }}
              sx={{ bgcolor: "grey.200", cursor: "not-allowed" }}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {successMsg && <Alert severity="success">{successMsg}</Alert>}

            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? "Guardando..." : "Guardar Celular"}
            </Button>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Agregar Accesorio
          </Typography>
          <Box component="form" onSubmit={submitAccesorio} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nombre *"
              name="nombre"
              value={accesorioForm.nombre}
              onChange={handleAccesorioChange}
              required
            />
            <TextField
              label="Stock *"
              name="stock"
              type="number"
              value={accesorioForm.stock}
              onChange={handleAccesorioChange}
              inputProps={{ min: 0 }}
              required
            />
            <TextField
              label="Precio *"
              name="precio"
              type="number"
              value={accesorioForm.precio}
              onChange={handleAccesorioChange}
              inputProps={{ min: 0, step: "0.01" }}
              required
            />

            {error && <Alert severity="error">{error}</Alert>}
            {successMsg && <Alert severity="success">{successMsg}</Alert>}

            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? "Guardando..." : "Guardar Accesorio"}
            </Button>
          </Box>
        </>
      )}

      {tipo && (
        <Button
          onClick={handleCerrar}
          sx={{ mt: 4, textDecoration: "underline", fontSize: "0.875rem" }}
          variant="text"
          color="inherit"
          type="button"
        >
          Cerrar / Volver
        </Button>
      )}
    </Box>
  );
};

export default AddStock;
