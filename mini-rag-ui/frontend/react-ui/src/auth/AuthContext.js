import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const getInitialUser = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const email = localStorage.getItem("email") || "";
  return token ? { token, role, email } : null;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getInitialUser);

  const login = (token, role, refreshToken = "", email = "") => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    if (email) localStorage.setItem("email", email);
    setUser({ token, role, email });

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
    localStorage.removeItem("email");
    setUser(null);
    navigate("/?login=1");
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
