import "@/layouts/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var t = localStorage.getItem("einklab-theme");
                var root = document.documentElement;
                root.classList.remove("light", "dark", "sapo");
                if (t === "light") {
                  root.style.colorScheme = "light";
                } else if (t === "dark") {
                  root.classList.add("dark");
                  root.style.colorScheme = "dark";
                } else {
                  root.classList.add("sapo");
                  root.style.colorScheme = "dark";
                }
              } catch (e) {}
            })();
          `,
        }}
      />

      <TooltipProvider>
        <div className="min-h-screen relative z-2 bg-background text-foreground">
          {children}
        </div>
      </TooltipProvider>

      <Toaster
        position="top-right"
        richColors
        expand={false}
        duration={4000}
        visibleToasts={3}
        theme="dark"
        offset={16}
        gap={8}
      />
    </>
  );
}
