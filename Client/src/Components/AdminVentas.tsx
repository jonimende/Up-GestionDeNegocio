import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface Venta {
  id: number;
  cantidad: number | string;
  total: number | string;
  fecha: string;
  celularId?: number | null;
  accesorioId?: number | null;
  reparacionId?: number | null;
  comprador?: string | null;
  ganancia?: number | null;
  idProveedor?: number | null;
  metodoPago?: string | null;

  Celular?: {
    modelo?: string;
    almacenamiento?: string;
    bateria?: string;
    color?: string;
    precio?: number;
    observaciones?: string;
    imei?: string;
    fechaIngreso?: string;
    idProveedor?: number | null;
  };
  Accesorios?: {
    nombre?: string;
  };
  Reparacion?: {
    descripcion?: string;
    reparadoPor?: string;
  };
  Proveedor?: {
    id?: number;
    nombre?: string;
  };
}

interface VentaForm extends Venta {
  modelo?: string;
  almacenamiento?: string;
  bateria?: string;
  color?: string;
  precio?: number;
  observaciones?: string;
  imei?: string;
  fechaIngreso?: string;
  accesorios?: string;
  reparacionDescripcion?: string;
  reparadoPor?: string;
  proveedorId?: number | null;
  proveedorNombre?: string;
  metodoPago?: string | null;
}

interface DecodedToken {
  admin: boolean;
}

interface Proveedor {
  id: number;
  nombre: string;
}

const METODOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta"];

const AdminVentas: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<VentaForm>>({});
  const [loading, setLoading] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded.admin) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(true);

        const [ventasRes, proveedoresRes] = await Promise.all([
          axios.get<Venta[]>("http://localhost:3001/ventas", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Proveedor[]>("http://localhost:3001/proveedores", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setVentas(ventasRes.data);
        setProveedores(proveedoresRes.data);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, []);

  if (!isAdmin) {
    return (
      <div>
        <h3 style={{ color: "red" }}>Acceso denegado</h3>
      </div>
    );
  }

  const validarFormulario = (): string | null => {
    if (!form.fecha) return "La fecha es obligatoria";

    if (form.cantidad === undefined || form.cantidad === null)
      return "La cantidad es obligatoria";
    if (typeof form.cantidad === "string") {
      const cantidadNum = Number(form.cantidad);
      if (isNaN(cantidadNum) || cantidadNum <= 0)
        return "La cantidad debe ser mayor a 0";
    } else if (form.cantidad <= 0) {
      return "La cantidad debe ser mayor a 0";
    }

    if (form.total === undefined || form.total === null)
      return "El total es obligatorio";
    if (typeof form.total === "string") {
      const totalNum = Number(form.total);
      if (isNaN(totalNum) || totalNum <= 0) return "El total debe ser mayor a 0";
    } else if (form.total <= 0) {
      return "El total debe ser mayor a 0";
    }

    if (form.metodoPago && !METODOS_PAGO.includes(form.metodoPago))
      return "Método de pago inválido";

    return null;
  };

  const handleEditClick = (venta: Venta) => {
    setEditandoId(venta.id);
    setForm({
      ...venta,
      fecha: venta.fecha.slice(0, 10),

      modelo: venta.Celular?.modelo ?? "",
      almacenamiento: venta.Celular?.almacenamiento ?? "",
      bateria: venta.Celular?.bateria ?? "",
      color: venta.Celular?.color ?? "",
      precio: venta.Celular?.precio ?? 0,
      observaciones: venta.Celular?.observaciones ?? "",
      imei: venta.Celular?.imei ?? "",
      fechaIngreso: venta.Celular?.fechaIngreso
        ? venta.Celular.fechaIngreso.slice(0, 10)
        : "",

      accesorios: venta.Accesorios?.nombre ?? "",

      reparacionDescripcion: venta.Reparacion?.descripcion ?? "",
      reparadoPor: venta.Reparacion?.reparadoPor ?? "",

      proveedorId: venta.Celular?.idProveedor ?? null,

      metodoPago: venta.metodoPago ?? "",
    });
    setErrorValidacion(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "cantidad" ||
        name === "total" ||
        name === "ganancia" ||
        name === "idProveedor" ||
        name === "precio" ||
        name === "proveedorId"
          ? isNaN(Number(value))
            ? value
            : Number(value)
          : value,
    }));
  };

  const handleSave = async () => {
    const error = validarFormulario();
    if (error) {
      setErrorValidacion(error);
      return;
    }
    if (!editandoId) return;
    const token = localStorage.getItem("token") || "";
    try {
      const dataToSend = {
        ...form,
      };
      delete dataToSend.proveedorNombre;

      await axios.put(`http://localhost:3001/ventas/${editandoId}`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVentas((prev) =>
        prev.map((v) =>
          v.id === editandoId
            ? {
                ...v,
                ...form,
                Celular: {
                  ...v.Celular,
                  idProveedor: form.proveedorId ?? v.Celular?.idProveedor ?? null,
                },
                Proveedor:
                  proveedores.find((p) => p.id === form.proveedorId) ?? undefined,
              }
            : v
        )
      );
      setEditandoId(null);
      setForm({});
      setErrorValidacion(null);
    } catch (error) {
      console.error("Error al guardar venta:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta venta?")) return;
    const token = localStorage.getItem("token") || "";
    try {
      await axios.delete(`http://localhost:3001/ventas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVentas((prev) => prev.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Error al eliminar venta:", error);
    }
  };

  const getProducto = (v: Venta) => {
    if (v.celularId) return "Celular";
    if (v.accesorioId) return "Accesorio";
    if (v.reparacionId) return "Reparación";
    return "-";
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Administración de Ventas</h2>
      {errorValidacion && (
        <p style={{ color: "red", marginBottom: 10 }}>{errorValidacion}</p>
      )}
      <table border={1} cellPadding={5} cellSpacing={0}>
        <thead>
          <tr>
            <th>Fecha Venta</th>
            <th>Cantidad</th>
            <th>Total</th>
            <th>Producto</th>
            <th>Modelo</th>
            <th>Almacenamiento</th>
            <th>Batería</th>
            <th>Color</th>
            <th>Precio</th>
            <th>IMEI</th>
            <th>Observaciones</th>
            <th>Accesorios</th>
            <th>Descripción Reparación</th>
            <th>Reparado Por</th>
            <th>Comprador</th>
            <th>Ganancia</th>
            <th>Proveedor</th>
            <th>Fecha Ingreso</th>
            <th>Método de Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) =>
            editandoId === venta.id ? (
              <tr key={venta.id}>
                <td>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha || ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="cantidad"
                    value={form.cantidad ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="total"
                    value={form.total ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>{getProducto(venta)}</td>
                <td>
                  <input
                    type="text"
                    name="modelo"
                    value={form.modelo ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="almacenamiento"
                    value={form.almacenamiento ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="bateria"
                    value={form.bateria ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="color"
                    value={form.color ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="precio"
                    value={form.precio ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="imei"
                    value={form.imei ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="observaciones"
                    value={form.observaciones ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="accesorios"
                    value={form.accesorios ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="reparacionDescripcion"
                    value={form.reparacionDescripcion ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="reparadoPor"
                    value={form.reparadoPor ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="comprador"
                    value={form.comprador ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    name="ganancia"
                    value={form.ganancia ?? ""}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  {proveedores.find(
                    (p) =>
                      p.id === form.proveedorId ||
                      p.id === venta.Celular?.idProveedor
                  )?.nombre ?? "-"}
                </td>
                <td>
                  <input
                    type="date"
                    name="fechaIngreso"
                    value={form.fechaIngreso ?? ""}
                    onChange={handleInputChange}
                    disabled
                  />
                </td>
                <td>
                  <select
                    name="metodoPago"
                    value={form.metodoPago ?? ""}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Seleccionar Método --</option>
                    {METODOS_PAGO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={handleSave}>Guardar</button>
                  <button onClick={() => handleDelete(venta.id)}>Eliminar</button>
                </td>
              </tr>
            ) : (
              <tr key={venta.id}>
                <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                <td>{venta.cantidad}</td>
                <td>{venta.total}</td>
                <td>{getProducto(venta)}</td>
                <td>{venta.Celular?.modelo ?? "-"}</td>
                <td>{venta.Celular?.almacenamiento ?? "-"}</td>
                <td>{venta.Celular?.bateria ?? "-"}</td>
                <td>{venta.Celular?.color ?? "-"}</td>
                <td>{venta.Celular?.precio ?? "-"}</td>
                <td>{venta.Celular?.imei ?? "-"}</td>
                <td>{venta.Celular?.observaciones ?? "-"}</td>
                <td>{venta.Accesorios?.nombre ?? "-"}</td>
                <td>{venta.Reparacion?.descripcion ?? "-"}</td>
                <td>{venta.Reparacion?.reparadoPor ?? "-"}</td>
                <td>{venta.comprador ?? "-"}</td>
                <td>{venta.ganancia ?? "-"}</td>
                <td>
                  {proveedores.find(
                    (p) => p.id === venta.Proveedor?.id || p.id === venta.Celular?.idProveedor
                  )?.nombre ?? "-"}
                </td>
                <td>
                  {venta.Celular?.fechaIngreso
                    ? new Date(venta.Celular.fechaIngreso).toLocaleDateString()
                    : "-"}
                </td>
                <td>{venta.metodoPago ?? "-"}</td>
                <td>
                  <button onClick={() => handleEditClick(venta)}>Editar</button>
                  <button onClick={() => handleDelete(venta.id)}>Eliminar</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminVentas;
