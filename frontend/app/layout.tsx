import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/SidebarContext";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MainWrapper from "@/components/MainWrapper";

export const metadata: Metadata = {
  title: "ComplianceOS — Network Compliance Engine",
  description: "Vendor-Agnostic CIS Benchmark Network Compliance Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script: apply theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var dark=s==='dark'||(s==null&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full overflow-x-hidden">
              {/* Fixed Sidebar */}
              <Sidebar />

              {/* Main content handled by our dynamic wrapper */}
              <MainWrapper>
                {children}
              </MainWrapper>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}