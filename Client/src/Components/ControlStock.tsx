import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  admin: boolean;
}

interface Proveedor {
  id: number;
  nombre: string;
}

interface Celular {
  id: number;
  modelo: string;
  almacenamiento: string;
  bateria: string;
  color: string;
  precio: number;
  stock: number;
  idProveedor?: number;
  imei: string;
  vendido: boolean; // agregado vendido
}

interface Accesorio {
  id: number;
  nombre: string;
  stock: number;
  vendido: boolean; // agregado vendido
}

const ControlDeStock: React.FC = () => {
  const [celulares, setCelulares] = useState<Celular[]>([]);
  const [accesorios, setAccesorios] = useState<Accesorio[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verificarAdminYFetch = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAdmin(false);
        return;
      }

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (!decoded.admin) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(true);
        setLoading(true);

        // Obtener celulares
        const celularesRes = await axios.get<Celular[]>("http://localhost:3001/celulares", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Obtener accesorios
        const accesoriosRes = await axios.get<Accesorio[]>("http://localhost:3001/accesorios", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Obtener proveedores
        const proveedoresRes = await axios.get<Proveedor[]>("http://localhost:3001/proveedores", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCelulares(celularesRes.data);
        setAccesorios(accesoriosRes.data);
        setProveedores(proveedoresRes.data);
        setError(null);
      } catch (err) {
        setError("Error al cargar los datos");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    verificarAdminYFetch();
  }, []);

  // Filtrar solo los que no están vendidos
  const celularesDisponibles = celulares.filter((c) => !c.vendido);
  const accesoriosDisponibles = accesorios.filter((a) => !a.vendido);

  const eliminarCelular = async (id: number) => {
    if (!window.confirm("¿Está seguro que desea eliminar este celular?")) return;
    const token = localStorage.getItem("token") || "";
    try {
      await axios.delete(`http://localhost:3001/celulares/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCelulares((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError("Error eliminando celular");
    }
  };

  const eliminarAccesorio = async (id: number) => {
    if (!window.confirm("¿Está seguro que desea eliminar este accesorio?")) return;
    const token = localStorage.getItem("token") || "";
    try {
      await axios.delete(`http://localhost:3001/accesorios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccesorios((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError("Error eliminando accesorio");
    }
  };

  const getNombreProveedor = (idProveedor?: number) => {
    if (!idProveedor) return "-";
    const prov = proveedores.find((p) => p.id === idProveedor);
    return prov ? prov.nombre : "Desconocido";
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Acceso denegado
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center">Cargando stock...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Control de Stock</h2>
      {error && (
        <p className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</p>
      )}

      <section className="mb-10">
        <h3 className="text-2xl font-semibold mb-4">Celulares Disponibles</h3>
        {celularesDisponibles.length === 0 ? (
          <p className="text-gray-600">No hay celulares en stock.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-300 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Modelo",
                    "Almacenamiento",
                    "Batería",
                    "Color",
                    "Precio",
                    "Stock",
                    "Proveedor",
                    "IMEI",
                    "Acciones",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-sm font-medium text-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {celularesDisponibles.map((celular) => (
                  <tr key={celular.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{celular.modelo}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{celular.almacenamiento}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{celular.bateria}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{celular.color}</td>
                    <td className="px-4 py-2 whitespace-nowrap">${celular.precio.toFixed(2)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{celular.stock}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {getNombreProveedor(celular.idProveedor)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{celular.imei}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => eliminarCelular(celular.id)}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-2xl font-semibold mb-4">Accesorios Disponibles</h3>
        {accesoriosDisponibles.length === 0 ? (
          <p className="text-gray-600">No hay accesorios en stock.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-300 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
              <thead className="bg-gray-50">
                <tr>
                  {["Nombre", "Stock", "Acciones"].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-sm font-medium text-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accesoriosDisponibles.map((accesorio) => (
                  <tr key={accesorio.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{accesorio.nombre}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{accesorio.stock}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => eliminarAccesorio(accesorio.id)}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ControlDeStock;
