import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { store } from "./redux/store";
import App from "./App.jsx";
import "./index.css";
 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
 
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#f5f0e8",
                border: "1px solid #2a2a2a",
                fontFamily: "Inter, sans-serif",
              },
              success: {
                iconTheme: { primary: "#c9a84c", secondary: "#0a0a0a" },
              },
              error: {
                iconTheme: { primary: "#c0392b", secondary: "#f5f0e8" },
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);