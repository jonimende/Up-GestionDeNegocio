import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Login from "./Components/Login";
import PrivateRoute from "./Pages/PrivateRoutes";
import Home from "./Pages/Home";
import AddVenta from "./Components/AddVenta";
import Notas from "./Components/Notas";
import AddStock from "./Components/AddStock";
import AdminVentas from "./Components/AdminVentas";
import ControlDeStock from "./Components/ControlStock";
import Caja from "./Components/Caja";
import AddReparacion from "./Components/AddRepairs";
import Proveedores from "./Components/ControlProveedores";

interface TokenPayload {
  id: number;
  nombre: string;
  admin: boolean;
}

const App: React.FC = () => {
  const token = localStorage.getItem("token");
  let isAdmin = false;

  if (token) {
    try {
      const decoded = jwtDecode(token) as TokenPayload;
      isAdmin = decoded.admin;
    } catch {
      isAdmin = false;
    }
  }

  const isAuthenticated = !!token;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/home" element={<Home />} />
        <Route path="/ventas/nuevo" element={<AddVenta />} />
        <Route path="/notas" element={<Notas />} />
        {isAdmin && <Route path="/admin/ventas" element={<AdminVentas />} />}
        {isAdmin && <Route path="/stock/nuevo" element={<AddStock />} />}
        {isAdmin && <Route path="/control-stock" element={<ControlDeStock />} />}
        {isAdmin && <Route path="/admin/proveedores" element={<Proveedores />} />}
        <Route path="/ventas/caja" element={<Caja />} />
        {isAdmin && <Route path="/admin/reparaciones" element={<AddReparacion />} />}
      </Route>
    </Routes>
  );
};

export default App;
