import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    return token ? { token, role } : null;
  });

  const login = (token, role, refreshToken = "") => {  
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    setUser({ token, role });

    if (role === "member") navigate("/member");
    else if (role === "admin") navigate("/admin");
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await fetch("http://127.0.0.1:8000/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (_) {
      // no-op
    }

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("refresh_token");
    setUser(null);
    navigate("/login");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
