import { useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-main)" }}>
      <LoginModal onClose={() => navigate("/")} />
    </div>
  );
}