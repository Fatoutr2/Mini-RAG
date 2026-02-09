import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = useAuth();
  return user && user.role === "admin" ? children : <Navigate to="/" />;
}
