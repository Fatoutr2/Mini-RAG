import "../assets/css/Index.css";
import ChatWindowVisitor from "../components/ChatWindowVisitor";
import { useI18n } from "../i18n/LanguageContext";

export default function VisitorRAG({ onClose }) {
  const { t } = useI18n();

  return (
    <div className="modal">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h3>{t("visitorModalTitle")}</h3>

        <ChatWindowVisitor visitor={true} />
      </div>
    </div>
  );
}
