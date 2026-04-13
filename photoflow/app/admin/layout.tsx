"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as { name?: string; paginas?: string };
  const allowedPages: string[] = user.paginas
    ? JSON.parse(user.paginas as string)
    : [];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Toaster richColors position="top-right" />
      <Sidebar
        userName={user.name || "Usuário"}
        allowedPages={allowedPages}
        onLogout={() => signOut({ callbackUrl: "/login" })}
      />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
