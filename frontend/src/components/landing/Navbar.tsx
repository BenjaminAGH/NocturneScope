"use client";
import Link from "next/link";
import ThemeChanger from "./DarkSwitch";
import Image from "next/image";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  KeyIcon,
  Squares2X2Icon,
  ShareIcon,
  BellIcon,
  TrashIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ServerIcon
} from "@heroicons/react/24/outline";
import { useNotification } from "@/context/NotificationContext";
import { useGroup } from "@/context/GroupContext";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { notifications, unreadCount, markAllAsRead, clearHistory } = useNotification();

  // Rutas públicas donde solo se muestra "Iniciar Sesión"
  const publicRoutes = ['/', '/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    setIsLoggedIn(!!token);

    // Fetch user profile to get role
    if (token) {
      fetch(`${(process.env.NEXT_PUBLIC_API_URL || "https://api.nocturnesec.cl/").replace(/\/+$/, "")}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.role) {
            setUserRole(data.role);
          }
        })
        .catch(() => {
          // Ignore errors
        });
    } else {
      setUserRole(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refresh");
    document.cookie = "jwt=; path=/; max-age=0";
    setIsLoggedIn(false);
    router.push("/auth/login");
  };

  const isTopology = pathname === '/topology';

  return (
    <div
      className={`${isTopology ? 'fixed top-0 left-0 right-0' : 'sticky top-0'} z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60`}
      style={{ height: 'var(--navbar-height)' }}
    >
      <nav className="container sticky top-0 mx-auto flex items-center justify-between h-full px-4 xl:px-1">
        {/* Logo */}
        <Link href="/">
          <span className="flex items-center space-x-2">
            <Image
              src="img/scope_icon.svg"
              alt="Logo claro"
              width={100}
              height={100}
              className="block dark:hidden"
              priority
            />
            <Image
              src="img/scope_icon.svg"
              alt="Logo oscuro"
              width={100}
              height={100}
              className="hidden dark:block"
              priority
            />
          </span>
        </Link>

        {!isPublicRoute && isLoggedIn && (
          <div className="hidden md:flex items-center bg-muted/50 rounded-full p-1 border border-border/50 absolute left-1/2 transform -translate-x-1/2">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/dashboard'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/topology"
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${pathname === '/topology'
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <ShareIcon className="w-4 h-4" />
              Topología
            </Link>
          </div>
        )}

        {/* Right Side: Theme & Profile */}
        <div className="flex items-center gap-4">
          {!isPublicRoute && isLoggedIn && (
            <GroupSwitcher />
          )}
          <ThemeChanger />

          {!isPublicRoute && isLoggedIn && (
            <Menu as="div" className="relative">
              <Menu.Button className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                <BellIcon className="w-6 h-6 text-muted-foreground hover:text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-background" />
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-xl bg-card shadow-xl ring-1 ring-border focus:outline-none max-h-[400px] flex flex-col">
                  <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/30 rounded-t-xl">
                    <h3 className="text-sm font-semibold">Notificaciones</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => markAllAsRead()}
                        className="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors"
                        title="Marcar todas como leídas"
                      >
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => clearHistory()}
                        className="p-1 hover:bg-background rounded-md text-muted-foreground hover:text-destructive transition-colors"
                        title="Borrar historial"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No hay notificaciones
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-lg text-sm transition-colors ${notif.read ? 'bg-background/50 text-muted-foreground' : 'bg-muted/50 text-foreground border-l-2 border-primary'
                            }`}
                        >
                          <p>{notif.message}</p>
                          <span className="text-[10px] opacity-70 mt-1 block">
                            {new Date(notif.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          {isPublicRoute ? (
            <Link
              href={isLoggedIn ? "/dashboard" : "/auth/login"}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
            >
              {isLoggedIn ? "Ir al Dashboard" : "Iniciar Sesión"}
            </Link>
          ) : (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserCircleIcon className="w-6 h-6" />
                </div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-card py-2 shadow-xl ring-1 ring-border focus:outline-none">
                  <div className="px-4 py-2 border-b border-border/50 mb-1">
                    <p className="text-xs font-medium text-muted-foreground">Mi Cuenta</p>
                  </div>

                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/tokens"
                        className={`${active ? "bg-muted" : ""
                          } flex items-center gap-2 px-4 py-2 text-sm text-foreground mx-1 rounded-lg transition-colors`}
                      >
                        <KeyIcon className="w-4 h-4" />
                        Tokens API
                      </Link>
                    )}
                  </Menu.Item>

                  {userRole === "devadmin" && (
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/admin/users"
                          className={`${active ? "bg-muted" : ""
                            } flex items-center gap-2 px-4 py-2 text-sm text-foreground mx-1 rounded-lg transition-colors`}
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                          Administrar Usuarios
                        </Link>
                      )}
                    </Menu.Item>
                  )}

                  <div className="my-1 border-t border-border/50" />

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${active ? "bg-destructive/10 text-destructive" : "text-foreground"
                          } flex w-full items-center gap-2 px-4 py-2 text-sm mx-1 rounded-lg transition-colors text-left`}
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
      </nav>
    </div>
  );
};

function GroupSwitcher() {
  const router = useRouter();
  const { selectedGroup, groups, setSelectedGroup } = useGroup();

  if (!selectedGroup) return null;

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border/50">
        <ServerIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium max-w-[100px] truncate">{selectedGroup.Name}</span>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-xl bg-card py-2 shadow-xl ring-1 ring-border focus:outline-none">
          <div className="px-4 py-2 border-b border-border/50 mb-1">
            <p className="text-xs font-medium text-muted-foreground">Cambiar Grupo</p>
          </div>

          {groups.map((group) => (
            <Menu.Item key={group.ID}>
              {({ active }) => (
                <button
                  onClick={() => {
                    setSelectedGroup(group);
                    router.push("/dashboard");
                  }}
                  className={`${active ? "bg-muted" : ""
                    } flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground mx-1 rounded-lg transition-colors text-left`}
                >
                  <ServerIcon className="w-4 h-4 text-muted-foreground" />
                  {group.Name}
                </button>
              )}
            </Menu.Item>
          ))}

          <div className="my-1 border-t border-border/50" />

          <Menu.Item>
            {({ active }) => (
              <Link
                href="/groups"
                className={`${active ? "bg-muted" : ""
                  } flex items-center gap-2 px-4 py-2 text-sm text-primary mx-1 rounded-lg transition-colors`}
              >
                <Squares2X2Icon className="w-4 h-4" />
                Gestionar Grupos
              </Link>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
