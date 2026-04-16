"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isPrintRoute = pathname === "/admin/impressao";
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050d18]">
        <Loader2 className="h-8 w-8 animate-spin text-[#18BDD5]" />
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as { name?: string; paginas?: string };
  const allowedPages: string[] = user.paginas
    ? JSON.parse(user.paginas as string)
    : [];

  return (
    <div className="min-h-screen bg-[#050d18] text-white">
      <Toaster richColors position="top-right" />
      <div
        className="min-h-screen md:grid md:transition-all md:duration-300"
        style={{
          gridTemplateColumns: desktopSidebarOpen
            ? "20rem minmax(0, 1fr)"
            : "5.5rem minmax(0, 1fr)",
        }}
      >
        <Sidebar
          userName={user.name || "Usuário"}
          allowedPages={allowedPages}
          onLogout={() => signOut({ callbackUrl: "/login" })}
          desktopOpen={desktopSidebarOpen}
          mobileOpen={mobileSidebarOpen}
          onDesktopToggle={() => setDesktopSidebarOpen((prev) => !prev)}
          onMobileToggle={() => setMobileSidebarOpen((prev) => !prev)}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main className="min-h-screen overflow-auto pt-20 md:pt-0">
          {isPrintRoute ? (
            <div
              className="min-h-screen px-4 pb-28 pt-4 md:px-8 md:pb-8 md:pt-8"
              style={{
                background:
                  "radial-gradient(circle at top, rgba(24,189,213,0.16), transparent 28%), linear-gradient(180deg, #050d18 0%, #071321 48%, #08192b 100%)",
              }}
            >
              <div className="mx-auto w-full max-w-screen-2xl">{children}</div>
            </div>
          ) : (
            <div
              className="min-h-screen px-4 pb-8 pt-4 md:px-8 md:pt-8"
              style={{
                background:
                  "radial-gradient(circle at top, rgba(24,189,213,0.07), transparent 35%), linear-gradient(180deg, #050d18 0%, #071321 60%, #08192b 100%)",
              }}
            >
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
