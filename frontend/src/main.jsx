import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css"; // ← add
import { initTheme } from "./lib/theme"; // ← add

initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2600,
            className: "shyfly-toast",
            style: {
              background: "#430d2c",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "14px",
              padding: "10px 18px",
            },
            iconTheme: { primary: "#f9698f", secondary: "#fff" },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
