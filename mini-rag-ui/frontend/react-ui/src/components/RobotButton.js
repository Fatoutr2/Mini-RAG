// RobotButton.js
import "../assets/css/Index.css";

export default function RobotButton({ onClick, className }) {
  return (
    <button onClick={onClick} className={className}>
      🤖
    </button>
  );
}
