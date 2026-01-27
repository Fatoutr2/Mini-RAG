// src/routes/AdminRouter.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../pages/AdminDashboard";
import Dashboard from "../pages/Dashboard";

export default function AdminRouter() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/*" element={<Dashboard />} />
    </Routes>
  );
}
