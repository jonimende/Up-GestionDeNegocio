import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";

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
};

type AccesorioForm = {
  nombre: string;
  stock: string;
};

const inputClass = "w-full border border-gray-300 rounded px-3 py-2";

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
  });

  const [accesorioForm, setAccesorioForm] = useState<AccesorioForm>({
    nombre: "",
    stock: "",
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
    fetch("http://localhost:3001/reparaciones")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar reparaciones");
        return res.json();
      })
      .then(setReparaciones)
      .catch(() => setReparaciones([]));
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/proveedores")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar proveedores");
        return res.json();
      })
      .then(setProveedores)
      .catch(() => setProveedores([]));
  }, []);

  const handleCelularChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCelularForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "idReparacion") {
        const reparacion = reparaciones.find((r) => r.id.toString() === value);
        updated.valorFinal = reparacion ? reparacion.valor.toString() : "";
      }

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
      !idProveedor
    ) {
      setError("Por favor, completa todos los campos obligatorios (*)");
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
      };

      console.log("Enviando celular:", body);

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

    const { nombre, stock } = accesorioForm;

    if (!nombre.trim() || !stock) {
      setError("Por favor, completa todos los campos obligatorios (*)");
      return;
    }

    if (parseInt(stock) < 0) {
      setError("El stock debe ser mayor o igual a cero");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const body = { nombre, stock: parseInt(stock) };

      console.log("Enviando accesorio:", body);

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
      setAccesorioForm({ nombre: "", stock: "" });
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
    <div className="max-w-lg mx-auto p-4 border rounded shadow">
      {!tipo ? (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-6">Agregar Stock</h2>
          <button
            onClick={() => setTipo("celular")}
            className="mr-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Agregar Celular
          </button>
          <button
            onClick={() => setTipo("accesorio")}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Agregar Accesorio
          </button>
        </div>
      ) : tipo === "celular" ? (
        <>
          <h2 className="text-xl font-semibold mb-4">Agregar Celular</h2>
          <form onSubmit={submitCelular} className="space-y-4">
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
              <input
                key={field}
                type={
                  field === "fechaIngreso"
                    ? "date"
                    : ["precio", "costo", "stock"].includes(field)
                    ? "number"
                    : "text"
                }
                name={field}
                placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} *`}
                value={celularForm[field as keyof CelularForm] as string}
                onChange={handleCelularChange}
                className={inputClass}
                required
                min={["precio", "costo", "stock"].includes(field) ? 0 : undefined}
                step={["precio", "costo"].includes(field) ? "0.01" : undefined}
              />
            ))}

            <label htmlFor="idProveedor" className="block font-semibold">
              Proveedor *
            </label>
            <select
              id="idProveedor"
              name="idProveedor"
              value={celularForm.idProveedor}
              onChange={handleCelularChange}
              className={inputClass}
              required
            >
              <option value="">-- Seleccione un proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>

            <textarea
              name="observaciones"
              placeholder="Observaciones"
              value={celularForm.observaciones}
              onChange={handleCelularChange}
              className={inputClass}
              rows={3}
            />

            <label htmlFor="idReparacion" className="block font-semibold">
              Reparación (opcional)
            </label>
            <select
              id="idReparacion"
              name="idReparacion"
              value={celularForm.idReparacion}
              onChange={handleCelularChange}
              className={inputClass}
            >
              <option value="">-- Seleccione una reparación --</option>
              {reparaciones.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.descripcion} (Valor: ${r.valor.toFixed(2)})
                </option>
              ))}
            </select>

            <input
              type="number"
              name="valorFinal"
              placeholder="Valor Final"
              value={celularForm.valorFinal}
              onChange={handleCelularChange}
              className={inputClass}
              min={0}
              step="0.01"
            />

            {error && <p className="text-red-600 font-semibold">{error}</p>}
            {successMsg && <p className="text-green-600 font-semibold">{successMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded mt-2"
            >
              {loading ? "Guardando..." : "Guardar Celular"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">Agregar Accesorio</h2>
          <form onSubmit={submitAccesorio} className="space-y-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre *"
              value={accesorioForm.nombre}
              onChange={handleAccesorioChange}
              className={inputClass}
              required
            />
            <input
              type="number"
              name="stock"
              placeholder="Stock *"
              value={accesorioForm.stock}
              onChange={handleAccesorioChange}
              className={inputClass}
              min={0}
              required
            />

            {error && <p className="text-red-600 font-semibold">{error}</p>}
            {successMsg && <p className="text-green-600 font-semibold">{successMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded mt-2"
            >
              {loading ? "Guardando..." : "Guardar Accesorio"}
            </button>
          </form>
        </>
      )}

      {tipo && (
        <button
          onClick={handleCerrar}
          className="mt-6 underline text-sm text-gray-600 hover:text-gray-900"
          type="button"
        >
          Cerrar / Volver
        </button>
      )}
    </div>
  );
};

export default AddStock;
