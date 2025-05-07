import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";
// Bootstrap Icons
import "bootstrap-icons/font/bootstrap-icons.css";
// Bootstrap JS
import "bootstrap/dist/js/bootstrap.bundle.min.js";

createRoot(document.getElementById("root")!).render(<App />);
