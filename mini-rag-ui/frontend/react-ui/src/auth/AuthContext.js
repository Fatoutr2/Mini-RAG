import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate(); // ✅ marche parce que BrowserRouter est au-dessus
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    return token ? { token, role } : null;
  });

  const login = (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setUser({ token, role });

    // Redirection selon role
    if (role === "member") navigate("/member");
    else if (role === "admin") navigate("/admin");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/?login=1");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
