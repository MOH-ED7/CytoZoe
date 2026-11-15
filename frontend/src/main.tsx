import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./styles/tokens.css";
import "./styles/globals.css";
import "./styles/components.css";
import "./styles/orbital.css";
import "./styles/landing.css";
import "./styles/health-trends.css";
import "./styles/workspace-premium.css";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
