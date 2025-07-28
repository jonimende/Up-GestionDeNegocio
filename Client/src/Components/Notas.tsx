import { useEffect, useState } from "react";
import axios from "axios";

interface Nota {
  id: number;
  contenido: string;
  createdAt: string;
}

const Notas = () => {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");

  const cargarNotas = async () => {
    try {
      const res = await axios.get<Nota[]>("http://localhost:3001/notas");
      setNotas(res.data);
      console.log("Notas cargadas:", res.data);
    } catch (error) {
      console.error("Error al cargar notas:", error);
    }
  };

  const agregarNota = async () => {
    if (nuevaNota.trim() === "") return;
    try {
      await axios.post("http://localhost:3001/notas", { contenido: nuevaNota });
      setNuevaNota("");
      cargarNotas();
    } catch (error) {
      console.error("Error al agregar nota:", error);
    }
  };

  const eliminarNota = async (id: number) => {
    try {
      await axios.delete(`http://localhost:3001/notas/${id}`);
      cargarNotas();
    } catch (error) {
      console.error("Error al eliminar nota:", error);
    }
  };

  useEffect(() => {
    cargarNotas();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>Notas</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={nuevaNota}
          onChange={(e) => setNuevaNota(e.target.value)}
          placeholder="Nueva Nota"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={agregarNota}>Agregar</button>
      </div>

      <ul>
        {notas.map((nota) => (
          <li key={nota.id} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{nota.contenido}</strong>
              <br />
              <small>{new Date(nota.createdAt).toLocaleString()}</small>
            </div>
            <button onClick={() => eliminarNota(nota.id)} style={{ marginLeft: 16 }}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notas;
