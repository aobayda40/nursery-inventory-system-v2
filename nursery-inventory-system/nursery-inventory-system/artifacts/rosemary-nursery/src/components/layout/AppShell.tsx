import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Leaf,
  Package,
  ShoppingCart,
  FlaskConical,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  FolderKanban,
  SendHorizontal,
  Users,
  ClipboardList,
  UserCircle,
  LogOut,
  ChevronDown,
  Boxes,
  ShoppingBag,
} from "lucide-react";
import { clsx } from "clsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles that can see this item. Undefined = all authenticated users */
  roles?: UserRole[];
  group?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  // ── Plants
  { href: "/plant-master", label: "Plant Master", icon: Leaf, group: "Plants" },
  { href: "/purchased-plants", label: "Purchased Plants", icon: ShoppingCart, group: "Plants" },
  { href: "/production", label: "Production", icon: FlaskConical, group: "Plants" },
  // ── Materials
  { href: "/material-master", label: "Material Master", icon: Boxes, group: "Materials" },
  { href: "/material-purchase", label: "Material Purchases", icon: ShoppingBag, group: "Materials" },
  // ── Operations
  { href: "/inventory", label: "Inventory", icon: Package, group: "Operations" },
  { href: "/projects", label: "Projects", icon: FolderKanban, group: "Operations" },
  { href: "/plant-issue", label: "Issue Voucher", icon: SendHorizontal, group: "Operations" },
  // ── System
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    roles: ["Administrator", "Manager"],
  },
  {
    href: "/audit-logs",
    label: "Audit Log",
    icon: ClipboardList,
    roles: ["Administrator", "Manager"],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  Administrator: "Administrator",
  Manager: "Manager",
  Accountant: "Accountant",
  InventoryController: "Inventory Controller",
  NurseryStaff: "Nursery Staff",
};

const NAV_GROUPS = ["Plants", "Materials", "Operations"] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  const currentItem =
    navItems.find((item) => item.href === location) ||
    navItems.find((item) => item.href !== "/" && location.startsWith(item.href)) ||
    navItems[0];
  const pageTitle = currentItem?.label || "Rosemary Nursery";

  const ungroupedItems = navItems.filter((item) => !item.group);

  return (
    <div className="min-h-[100dvh] flex w-full bg-background font-sans">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-sidebar-foreground/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:sticky top-0 z-50 h-[100dvh] flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out border-r border-sidebar-border shadow-2xl lg:shadow-none",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-sidebar-border/50">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden cursor-pointer"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-serif font-semibold text-sidebar-accent-foreground tracking-wide">
                  Rosemary
                </span>
                <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/70 font-medium">
                  Nursery
                </span>
              </div>
            )}
          </Link>
          <button
            className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-none">
          {/* Dashboard (ungrouped first) */}
          {navItems
            .filter((item) => !item.group && item.href === "/")
            .map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={clsx(
                      "shrink-0",
                      isCollapsed ? "w-6 h-6" : "w-5 h-5",
                      isActive
                        ? "text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90 transition-colors",
                    )}
                  />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}

          {/* Grouped nav sections */}
          {NAV_GROUPS.map((group) => {
            const groupItems = navItems.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="pt-3">
                {!isCollapsed && (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {group}
                  </p>
                )}
                {groupItems.map((item) => {
                  const isActive =
                    location === item.href ||
                    (item.href !== "/" && location.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group cursor-pointer",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={clsx(
                          "shrink-0",
                          isCollapsed ? "w-6 h-6" : "w-5 h-5",
                          isActive
                            ? "text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90 transition-colors",
                        )}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Remaining ungrouped items (Reports, Settings, Users, Audit Log) */}
          <div className="pt-3">
            {!isCollapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                System
              </p>
            )}
            {ungroupedItems
              .filter((item) => item.href !== "/")
              .map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group cursor-pointer",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={clsx(
                        "shrink-0",
                        isCollapsed ? "w-6 h-6" : "w-5 h-5",
                        isActive
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90 transition-colors",
                      )}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
          </div>
        </nav>

        {/* User section at bottom of sidebar */}
        {user && (
          <div className="border-t border-sidebar-border/50 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors cursor-pointer",
                    isCollapsed ? "justify-center" : "",
                  )}
                >
                  <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-[11px] text-sidebar-foreground/60 truncate">
                          {ROLE_LABELS[user.role]}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 shrink-0 text-sidebar-foreground/50" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isCollapsed ? "center" : "end"}
                side="top"
                className="w-52"
              >
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-normal truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <UserCircle className="w-4 h-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="p-4 border-t border-sidebar-border/50 hidden lg:block">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-md p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
            {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center gap-4 px-4 sm:px-6 lg:px-8 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <button
            className="lg:hidden text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-2xl font-serif font-medium text-foreground tracking-tight">
              {pageTitle}
            </h1>
            {user && (
              <Badge variant="outline" className="hidden sm:flex text-xs">
                {ROLE_LABELS[user.role]}
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background/50">
          <div className="h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
