"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Printer,
  Users,
  BarChart3,
  Settings,
  Camera,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userName: string;
  allowedPages: string[];
  onLogout: () => void;
}

const menuItems = [
  { href: "/admin/impressao", label: "Impressão", icon: Printer },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/relatorio", label: "Relatório", icon: BarChart3 },
  { href: "/admin/cadastro", label: "Cadastro", icon: Settings },
  { href: "/admin/form-aberto", label: "Form Aberto", icon: Camera },
];

export function Sidebar({ userName, allowedPages, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = menuItems.filter((item) =>
    allowedPages.includes(item.href)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-900 text-white">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold">PhotoFlow</h1>
        <p className="text-sm text-zinc-400 mt-1">Painel Admin</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-zinc-400">Logado</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
