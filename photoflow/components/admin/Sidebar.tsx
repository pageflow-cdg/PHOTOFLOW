"use client";

import Image from "next/image";
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
  ChevronRight,
  Menu,
  X,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userName: string;
  allowedPages: string[];
  onLogout: () => void;
  desktopOpen: boolean;
  mobileOpen: boolean;
  onDesktopToggle: () => void;
  onMobileToggle: () => void;
  onMobileClose: () => void;
}

const menuItems = [
  { href: "/admin/impressao", label: "Impressão", icon: Printer },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/closer", label: "Closer", icon: Mic },
  { href: "/admin/relatorio", label: "Relatório", icon: BarChart3 },
  { href: "/admin/cadastro", label: "Cadastro", icon: Settings },
  { href: "/admin/form-fechado", label: "Form Fechado", icon: Camera },
];

export function Sidebar({
  userName,
  allowedPages,
  onLogout,
  desktopOpen,
  mobileOpen,
  onDesktopToggle,
  onMobileToggle,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = menuItems.filter((item) =>
    allowedPages.includes(item.href)
  );
  const activeItem =
    visibleItems.find((item) => pathname.startsWith(item.href)) ?? visibleItems[0];
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const renderNavigationItems = (collapsed: boolean, onNavigate?: () => void) => (
    <div className={cn("mt-4 space-y-2", collapsed && "mt-0")}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group flex rounded-2xl border transition-all duration-200",
              collapsed
                ? "items-center justify-center px-0 py-3"
                : "items-center justify-between px-4 py-3",
              isActive
                ? "border-[#18BDD5]/35 bg-linear-to-br from-[#18BDD5] to-[#1599BD] text-[#04121f] shadow-[0_18px_40px_rgba(24,189,213,0.18)]"
                : "border-transparent bg-white/3 text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white"
            )}
          >
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}> 
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                  isActive
                    ? "border-black/10 bg-black/10 text-[#04121f]"
                    : "border-white/10 bg-white/3 text-[#18BDD5] group-hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>

              {!collapsed && (
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p
                    className={cn(
                      "text-xs",
                      isActive ? "text-[#06314f]" : "text-slate-500 group-hover:text-slate-300"
                    )}
                  >
                    {item.href === "/admin/impressao"
                      ? "Fila operacional"
                      : item.href === "/admin/closer"
                        ? "Atendimento de vendas"
                        : "Área administrativa"}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isActive
                    ? "text-[#04121f]"
                    : "text-slate-500 group-hover:translate-x-0.5 group-hover:text-white"
                )}
              />
            )}
          </Link>
        );
      })}
    </div>
  );

  const desktopCollapsed = !desktopOpen;

  const desktopShell = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "relative overflow-hidden border-b border-white/10",
          desktopCollapsed ? "px-3 py-3" : "px-3 pt-3 pb-2"
        )}
      >
        <span
          aria-hidden
          className="absolute -right-12 top-4 h-28 w-28 rounded-full bg-[#18BDD5]/10 blur-2xl"
        />
        <span
          aria-hidden
          className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-[#1599BD]/10 blur-2xl"
        />

        <div className="relative z-10">
          <div className={cn("flex items-center", desktopCollapsed ? "justify-center" : "justify-end") }>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDesktopToggle}
              className="h-10 w-10 rounded-2xl border border-white/10 bg-white/4 text-white hover:bg-white/10 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {desktopCollapsed ? (
            <div className="mt-2 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.28em] text-[#18BDD5]">
                PF
              </div>
            </div>
          ) : (
            <div className="-mt-1 px-1 pb-1">
              <Image
                src="/cdg/photoflow.webp"
                alt="PhotoFlow"
                width={260}
                height={80}
                className="h-auto w-full max-w-60 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
          )}
        </div>
      </div>

      <nav className={cn("flex-1 py-6", desktopCollapsed ? "px-3" : "px-4")}>
        {!desktopCollapsed && (
          <p className="px-2 text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
            Navegação
          </p>
        )}
        {renderNavigationItems(desktopCollapsed)}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-3xl border border-white/10 bg-white/4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          {desktopCollapsed ? (
            <div className="flex flex-col items-center gap-3 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-white">
                {userInitials || "PF"}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="h-10 w-10 rounded-2xl border border-white/10 bg-white/4 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm font-semibold text-white">{userName}</p>
              <p className="mt-1 text-xs text-slate-400">Sessão ativa</p>

              <Button
                variant="ghost"
                onClick={onLogout}
                className="mt-4 w-full justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-slate-200 hover:bg-white/8 hover:text-white"
              >
                Encerrar sessão
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#071322]/88 backdrop-blur-xl md:hidden">
        <div className="flex h-20 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            className="h-10 w-10 rounded-2xl border border-white/10 bg-white/4 text-white hover:bg-white/10 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <Image
              src="/cdg/photoflow.webp"
              alt="PhotoFlow"
              width={170}
              height={52}
              className="h-auto w-32 object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300">
              {activeItem?.label ?? "Painel"}
            </span>
          </div>
        </div>
      </div>

      <aside className="hidden h-screen border-r border-white/10 bg-[#061321] md:flex md:w-full md:flex-col">
        {desktopShell}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#02060d]/62 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-80 border-r border-white/10 bg-[#061321] transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="relative overflow-hidden border-b border-white/10 px-3 pt-3 pb-2">
            <span
              aria-hidden
              className="absolute -right-12 top-4 h-28 w-28 rounded-full bg-[#18BDD5]/10 blur-2xl"
            />
            <span
              aria-hidden
              className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-[#1599BD]/10 blur-2xl"
            />

            <div className="relative z-10 flex items-start justify-between gap-2">
              <div className="-mt-1 px-1 pb-1">
                <Image
                  src="/cdg/photoflow.webp"
                  alt="PhotoFlow"
                  width={260}
                  height={80}
                  className="h-auto w-full max-w-60 object-contain"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileClose}
                className="h-10 w-10 rounded-2xl border border-white/10 bg-white/4 text-white hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6">
            <p className="px-2 text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
              Navegação
            </p>
            {renderNavigationItems(false, onMobileClose)}
          </nav>

          <div className="border-t border-white/10 p-4">
            <div className="rounded-3xl border border-white/10 bg-white/4 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.16)] backdrop-blur-xl">
              <p className="text-sm font-semibold text-white">{userName}</p>
              <p className="mt-1 text-xs text-slate-400">Sessão ativa</p>

              <Button
                variant="ghost"
                onClick={onLogout}
                className="mt-4 w-full justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-slate-200 hover:bg-white/8 hover:text-white"
              >
                Encerrar sessão
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
