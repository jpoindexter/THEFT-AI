import * as React from "react";
import { StrictMode } from "react";
import * as ReactDOM from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { BrowserRouter } from "@/lib/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { CompanyProvider, useCompany } from "./context/CompanyContext";
import { LiveUpdatesProvider } from "./context/LiveUpdatesProvider";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";
import { PanelProvider } from "./context/PanelContext";
import { SidebarProvider } from "./context/SidebarContext";
import { DialogProvider } from "./context/DialogContext";
import { EditorAutocompleteProvider } from "./context/EditorAutocompleteContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PluginLauncherProvider } from "./plugins/launchers";
import "@mdxeditor/editor/style.css";
import "./index.css";
import "./styles/base.css";
import "./styles/theft-surfaces.css";
import "./styles/theft-map.css";
import "./styles/theft-product-layout.css";
import "./styles/scrollbars-motion.css";
import "./styles/mdx-editor-theme.css";
import "./styles/mdx-editor-content.css";
import "./styles/markdown-code.css";
import "./styles/markdown-content.css";
import "./styles/markdown-chips-popups.css";

const ROOT_ELEMENT_ID = "root";
const ROOT_INSTANCE_KEY = "__paperclipRoot";
const GLOBAL_ROOT_STATE_KEY = "__paperclipRootState";

type RootHostElement = HTMLElement & {
  [ROOT_INSTANCE_KEY]?: Root;
};

type GlobalRootState = {
  root: Root;
  rootElement: HTMLElement;
};

type RootWindow = Window & {
  [GLOBAL_ROOT_STATE_KEY]?: GlobalRootState;
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {
        // Ignore service worker cleanup failures in local dev.
      });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
});

function CompanyAwareBreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const { selectedCompany } = useCompany();
  return <BreadcrumbProvider companyName={selectedCompany?.name ?? null}>{children}</BreadcrumbProvider>;
}

async function bootstrap() {
  const rootElement = document.getElementById(ROOT_ELEMENT_ID) as RootHostElement | null;
  if (!rootElement) {
    throw new Error(`Missing #${ROOT_ELEMENT_ID} root element`);
  }
  const rootWindow = window as RootWindow;
  const globalRootState = rootWindow[GLOBAL_ROOT_STATE_KEY];
  if (globalRootState?.rootElement === rootElement) {
    rootElement[ROOT_INSTANCE_KEY] = globalRootState.root;
  }
  const root = rootElement[ROOT_INSTANCE_KEY] ?? createRoot(rootElement);
  rootElement[ROOT_INSTANCE_KEY] = root;
  rootWindow[GLOBAL_ROOT_STATE_KEY] = { root, rootElement };

  try {
    const { initPluginBridge } = await import("./plugins/bridge-init");
    initPluginBridge(React, ReactDOM);
  } catch (error) {
    console.error("Failed to initialize plugin bridge", error);
  }

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <CompanyProvider>
              <EditorAutocompleteProvider>
                <ToastProvider>
                  <LiveUpdatesProvider>
                    <TooltipProvider>
                      <CompanyAwareBreadcrumbProvider>
                        <SidebarProvider>
                          <PanelProvider>
                            <PluginLauncherProvider>
                              <DialogProvider>
                                <App />
                              </DialogProvider>
                            </PluginLauncherProvider>
                          </PanelProvider>
                        </SidebarProvider>
                      </CompanyAwareBreadcrumbProvider>
                    </TooltipProvider>
                  </LiveUpdatesProvider>
                </ToastProvider>
              </EditorAutocompleteProvider>
            </CompanyProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

void bootstrap();
