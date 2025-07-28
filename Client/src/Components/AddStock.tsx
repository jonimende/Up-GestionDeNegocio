import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";

type Reparacion = {
  id: number;
  descripcion: string;
  valor: number;
};

type Props = {
  onClose?: () => void; // Prop opcional para cerrar modal o navegación
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
};

type AccesorioForm = {
  nombre: string;
  stock: string;
};

const AddStock: React.FC<Props> = ({ onClose }) => {
  const [tipo, setTipo] = useState<null | "celular" | "accesorio">(null);

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
  });

  const [accesorioForm, setAccesorioForm] = useState<AccesorioForm>({
    nombre: "",
    stock: "",
  });

  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar reparaciones al montar el componente
  useEffect(() => {
    fetch("http://localhost:3001/reparaciones")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar reparaciones");
        return res.json();
      })
      .then((data) => setReparaciones(data))
      .catch(() => setReparaciones([]));
  }, []);

  // Manejo de cambios en formulario celular
  const handleCelularChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setCelularForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Si cambia la reparación, actualizar valorFinal automáticamente
      if (name === "idReparacion") {
        const reparacion = reparaciones.find((r) => r.id.toString() === value);
        if (reparacion) {
          updated.valorFinal = reparacion.valor.toString();
        } else {
          updated.valorFinal = "";
        }
      }

      return updated;
    });
  };

  // Manejo de cambios en formulario accesorio
  const handleAccesorioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccesorioForm((prev) => ({ ...prev, [name]: value }));
  };

  // Enviar formulario celular
  const submitCelular = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validación mínima
    if (
      !celularForm.modelo.trim() ||
      !celularForm.almacenamiento.trim() ||
      !celularForm.bateria.trim() ||
      !celularForm.color.trim() ||
      !celularForm.precio ||
      !celularForm.costo ||
      !celularForm.fechaIngreso ||
      !celularForm.stock
    ) {
      setError("Por favor, completa todos los campos obligatorios (*)");
      return;
    }

    setLoading(true);
    try {
      const body = {
        modelo: celularForm.modelo,
        almacenamiento: celularForm.almacenamiento,
        bateria: celularForm.bateria,
        color: celularForm.color,
        precio: parseFloat(celularForm.precio),
        costo: parseFloat(celularForm.costo),
        idReparacion: celularForm.idReparacion ? parseInt(celularForm.idReparacion.toString()) : null,
        valorFinal: celularForm.valorFinal ? parseFloat(celularForm.valorFinal) : null,
        fechaIngreso: celularForm.fechaIngreso,
        observaciones: celularForm.observaciones || null,
        stock: parseInt(celularForm.stock),
      };

      const res = await fetch("http://localhost:3001/celulares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      });
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  // Enviar formulario accesorio
  const submitAccesorio = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!accesorioForm.nombre.trim() || !accesorioForm.stock) {
      setError("Por favor, completa todos los campos obligatorios (*)");
      return;
    }

    setLoading(true);
    try {
      const body = {
        nombre: accesorioForm.nombre,
        stock: parseInt(accesorioForm.stock),
      };

      const res = await fetch("http://localhost:3001/accesorios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al guardar accesorio");
      }

      setSuccessMsg("Accesorio agregado con éxito");
      setAccesorioForm({ nombre: "", stock: "" });
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  // Botón para cerrar o volver
  const handleCerrar = () => {
    onClose?.();
    // Si usás navegación, podés agregar aquí para volver con useNavigate
  };

  return (
    <div className="max-w-lg mx-auto p-4 border rounded shadow">
      {!tipo && (
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
      )}

      {tipo === "celular" && (
        <>
          <h2 className="text-xl font-semibold mb-4">Agregar Celular</h2>
          <form onSubmit={submitCelular} className="space-y-4">
            <input
              type="text"
              name="modelo"
              placeholder="Modelo *"
              value={celularForm.modelo}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            <input
              type="text"
              name="almacenamiento"
              placeholder="Almacenamiento *"
              value={celularForm.almacenamiento}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            <input
              type="text"
              name="bateria"
              placeholder="Batería *"
              value={celularForm.bateria}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            <input
              type="text"
              name="color"
              placeholder="Color *"
              value={celularForm.color}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            <input
              type="number"
              name="precio"
              placeholder="Precio *"
              value={celularForm.precio}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
              step="0.01"
              required
            />
            <input
              type="number"
              name="costo"
              placeholder="Costo *"
              value={celularForm.costo}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
              step="0.01"
              required
            />
            <input
              type="date"
              name="fechaIngreso"
              placeholder="Fecha Ingreso *"
              value={celularForm.fechaIngreso}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            <textarea
              name="observaciones"
              placeholder="Observaciones"
              value={celularForm.observaciones}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
            />
            <input
              type="number"
              name="stock"
              placeholder="Stock *"
              value={celularForm.stock}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
              required
            />

            <label htmlFor="idReparacion" className="mt-4 block font-semibold">
              Reparación (opcional)
            </label>
            <select
              id="idReparacion"
              name="idReparacion"
              value={celularForm.idReparacion}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">-- Seleccione una reparación --</option>
              {reparaciones.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.descripcion} (Valor: ${rep.valor.toFixed(2)})
                </option>
              ))}
            </select>

            <input
              type="number"
              name="valorFinal"
              placeholder="Valor Final"
              value={celularForm.valorFinal}
              onChange={handleCelularChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
              step="0.01"
            />

            {error && (
              <p className="text-red-600 font-semibold">{error}</p>
            )}
            {successMsg && (
              <p className="text-green-600 font-semibold">{successMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded mt-2"
            >
              {loading ? "Guardando..." : "Guardar Celular"}
            </button>
          </form>
        </>
      )}

      {tipo === "accesorio" && (
        <>
          <h2 className="text-xl font-semibold mb-4">Agregar Accesorio</h2>
          <form onSubmit={submitAccesorio} className="space-y-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre *"
              value={accesorioForm.nombre}
              onChange={handleAccesorioChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
            <input
              type="number"
              name="stock"
              placeholder="Stock *"
              value={accesorioForm.stock}
              onChange={handleAccesorioChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              min={0}
              required
            />

            {error && (
              <p className="text-red-600 font-semibold">{error}</p>
            )}
            {successMsg && (
              <p className="text-green-600 font-semibold">{successMsg}</p>
            )}

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

      {/* Botón para cerrar o volver */}
      {tipo && (
        <button
          onClick={() => {
            setTipo(null);
            onClose?.();
          }}
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
