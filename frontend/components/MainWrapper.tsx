"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing page: no sidebar offset. Inner pages: offset on lg+ (sidebar is overlay on mobile).
  const isHomePage = pathname === "/";

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden ${
        isHomePage ? "" : "lg:ml-64"
      }`}
    >
      {children}
    </div>
  );
}