import { motion } from "framer-motion";
import "./FloatingActionButton.css";

interface FABProps {
  onClick: () => void;
  icon?: string;
  label?: string;
}

export default function FloatingActionButton({ onClick, icon = "+", label = "Add Task" }: FABProps) {
  return (
    <motion.button
      className="fab"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      aria-label={label}
      title={label}
    >
      <span className="fab-icon">{icon}</span>
    </motion.button>
  );
}
