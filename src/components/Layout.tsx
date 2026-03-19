import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { AiChatPanel } from "@/components/AiChatPanel";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onToggleChat={() => setChatOpen((v) => !v)} chatOpen={chatOpen} />
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-auto">
              {children}
            </main>
            <AiChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
