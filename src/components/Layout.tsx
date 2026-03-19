import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { AiChatPanel } from "@/components/AiChatPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

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
          <div className="flex-1 overflow-hidden">
            {chatOpen ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={70} minSize={40}>
                  <main className="h-full overflow-auto">{children}</main>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <AiChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <main className="h-full overflow-auto">{children}</main>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
