import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Login";
import PrivateRoute from "./Pages/PrivateRoutes";
import Home from "./Pages/Home";
import AddVenta  from "./Components/AddVenta";
import Notas from "./Components/Notas";
import AddStock from "./Components/AddStock";
const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/home" element={<Home />} />
        <Route path="/ventas/nuevo" element={<AddVenta />} />
        <Route path="/notas" element={<Notas />} />
        <Route path="/stock/nuevo" element={<AddStock />} />
      </Route>
    </Routes>
  );
};

export default App;
