import "@/layouts/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
