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
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";

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
  // Cambié para manejar proveedor como union id:number | nombre:string
  idProveedor: number | string;
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
  const [showAddProveedor, setShowAddProveedor] = useState(false);
  const [newProveedorNombre, setNewProveedorNombre] = useState("");
  const [agregandoProveedor, setAgregandoProveedor] = useState(false);

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

    fetch("https://up-gestiondenegocio-production.up.railway.app/reparaciones", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar reparaciones");
        return res.json();
      })
      .then(setReparaciones)
      .catch(() => setReparaciones([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";

    fetch("https://up-gestiondenegocio-production.up.railway.app/proveedores", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar proveedores");
        return res.json();
      })
      .then(setProveedores)
      .catch(() => setProveedores([]));
  }, []);

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

  const handleCelularSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setCelularForm((prev) => {
      let updated = { ...prev, [name]: value };

      const precioNum = name === "precio" ? Number(value) : Number(prev.precio);
      const reparacion = reparaciones.find(
        (r) =>
          (name === "idReparacion" ? value : prev.idReparacion.toString()) ===
          r.id.toString()
      );
      const valorReparacion = reparacion ? reparacion.valor : 0;

      updated.valorFinal = (precioNum + valorReparacion).toFixed(2);

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
      
      // Preparar payload enviando idProveedor o proveedorNombre según corresponda
      const payload: any = {
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
        imei,
      };

      if (typeof idProveedor === "number") {
        payload.idProveedor = idProveedor;
      } else if (typeof idProveedor === "string" && idProveedor.trim() !== "") {
        payload.proveedorNombre = idProveedor.trim();
      }

      const res = await fetch("https://up-gestiondenegocio-production.up.railway.app/celulares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  const handleAgregarProveedor = async () => {
    if (!newProveedorNombre.trim()) {
      setError("El nombre del proveedor no puede estar vacío");
      return;
    }

    try {
      setAgregandoProveedor(true);
      setError(null);
      const token = localStorage.getItem("token") || "";

      const res = await fetch("https://up-gestiondenegocio-production.up.railway.app/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre: newProveedorNombre.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al agregar proveedor");
      }

      const nuevoProveedor = await res.json();

      // Agregar a la lista y seleccionarlo
      setProveedores((prev) => [...prev, nuevoProveedor]);
      setCelularForm((prev) => ({ ...prev, idProveedor: nuevoProveedor.id }));
      setNewProveedorNombre("");
      setShowAddProveedor(false);
      setSuccessMsg("Proveedor agregado con éxito");
    } catch (error: any) {
      setError(error.message || "Error al agregar proveedor");
    } finally {
      setAgregandoProveedor(false);
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

      const res = await fetch("https://up-gestiondenegocio-production.up.railway.app/accesorios", {
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
    <Box
      maxWidth={600}
      mx="auto"
      p={3}
      border={1}
      borderRadius={2}
      borderColor="grey.300"
      boxShadow={1}
    >
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
          <Box
            component="form"
            onSubmit={submitCelular}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
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
            <Autocomplete
              freeSolo
              options={proveedores}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.nombre
              }
              value={
                typeof celularForm.idProveedor === "number"
                  ? proveedores.find((p) => p.id === celularForm.idProveedor) || null
                  : celularForm.idProveedor
                    ? { id: -1, nombre: celularForm.idProveedor.toString() }
                    : null
              }
              onChange={(event, value) => {
                if (typeof value === "string") {
                  setCelularForm((prev) => ({ ...prev, idProveedor: value }));
                } else if (value && typeof value === "object" && "id" in value) {
                  setCelularForm((prev) => ({ ...prev, idProveedor: value.id }));
                } else {
                  setCelularForm((prev) => ({ ...prev, idProveedor: "" }));
                }
              }}
              onInputChange={(event, newInputValue) => {
                // Esto se asegura de que el input escrito manualmente se refleje en el estado
                if (newInputValue !== "") {
                  setCelularForm((prev) => ({ ...prev, idProveedor: newInputValue }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Proveedor *"
                  required
                  helperText="Puedes escribir el nombre o seleccionar uno"
                />
              )}
            />
            <Button
              onClick={() => setShowAddProveedor(!showAddProveedor)}
              variant="outlined"
              color="info"
              size="small"
            >
              {showAddProveedor ? "Cancelar" : "Agregar nuevo proveedor"}
            </Button>

            {showAddProveedor && (
              <Box display="flex" gap={1} mt={1} alignItems="center">
                <TextField
                  label="Nombre nuevo proveedor"
                  value={newProveedorNombre}
                  onChange={(e) => setNewProveedorNombre(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAgregarProveedor}
                  disabled={agregandoProveedor}
                >
                  {agregandoProveedor ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </Box>
            )}
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
          <Box
            component="form"
            onSubmit={submitAccesorio}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
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
