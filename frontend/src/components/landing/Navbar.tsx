"use client";
import Link from "next/link";
import ThemeChanger from "./DarkSwitch";
import Image from "next/image";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Rutas públicas donde solo se muestra "Iniciar Sesión"
  const publicRoutes = ['/', '/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Check for JWT token to determine login status
    const token = localStorage.getItem("jwt");
    setIsLoggedIn(!!token);
  }, [pathname]); // Re-check when route changes

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    // Limpiar cookie de JWT
    document.cookie = "jwt=; path=/; max-age=0";
    setIsLoggedIn(false);
    router.push("/auth/login");
  };

  const navigation = [""];

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container relative mx-auto flex flex-wrap items-center justify-between p-4 lg:justify-between xl:px-1">
        <Link href="/">
          <span className="flex items-center space-x-2 ">
            <>
              <Image
                src="/nocturneLight.svg"
                alt="Logo claro"
                width={150}
                height={150}
                className="block dark:hidden"
                priority
              />
              <Image
                src="/nocturneDark.svg"
                alt="Logo oscuro"
                width={150}
                height={150}
                className="hidden dark:block"
                priority
              />
            </>
          </span>
        </Link>

        <div className="gap-3 nav__item mr-2 lg:flex ml-auto lg:ml-0 lg:order-2 items-center">
          <ThemeChanger />

          {isPublicRoute ? (
            // En rutas públicas, mostrar "Iniciar Sesión" o "Ir al Dashboard"
            <div className="hidden mr-3 lg:flex nav__item">
              <Link
                href={isLoggedIn ? "/dashboard" : "/auth/login"}
                className="px-6 py-2 text-background font-bold bg-secondary dark:bg-primary rounded-md md:ml-5"
              >
                {isLoggedIn ? "Ir al Dashboard" : "Iniciar Sesión"}
              </Link>
            </div>
          ) : (
            // En rutas protegidas, mostrar menú de usuario
            <Menu as="div" className="relative ml-3">
              <div>
                <Menu.Button className="text-gray-500 dark:text-gray-300 rounded-full outline-none focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition-colors">
                  <span className="sr-only">Open user menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/dashboard"
                        className={`${active ? "bg-muted" : ""
                          } block px-4 py-2 text-sm text-foreground w-full text-left`}
                      >
                        Dashboard
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/topology"
                        className={`${active ? "bg-muted" : ""
                          } block px-4 py-2 text-sm text-foreground w-full text-left`}
                      >
                        Topología
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/tokens"
                        className={`${active ? "bg-muted" : ""
                          } block px-4 py-2 text-sm text-foreground w-full text-left`}
                      >
                        Tokens API
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${active ? "bg-muted" : ""
                          } block px-4 py-2 text-sm text-foreground w-full text-left`}
                      >
                        Cerrar Sesión
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>

        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button
                aria-label="Toggle Menu"
                className="px-2 py-1 text-gray-500 rounded-md lg:hidden hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:text-gray-300 dark:focus:bg-trueGray-700"
              >
                <svg
                  className="w-6 h-6 fill-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  {open ? (
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                    />
                  )}
                </svg>
              </Disclosure.Button>

              <Disclosure.Panel className="flex flex-wrap w-full my-5 lg:hidden">
                <div className="w-full">
                  {navigation.map((item, index) => (
                    <Link
                      key={index}
                      href="/"
                      className="w-full px-4 py-2 -ml-4 text-gray-500 rounded-md dark:text-gray-300 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 dark:focus:bg-gray-800 focus:outline-none"
                    >
                      {item}
                    </Link>
                  ))}
                  {!isLoggedIn && (
                    <Link
                      href="/auth/login"
                      className="w-full px-6 py-2 mt-3 text-center text-white bg-indigo-600 rounded-md lg:ml-5 block"
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                  {isLoggedIn && (
                    <button
                      onClick={handleLogout}
                      className="w-full px-6 py-2 mt-3 text-center text-white bg-red-600 rounded-md lg:ml-5 block"
                    >
                      Cerrar Sesión
                    </button>
                  )}
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <div className="hidden text-center lg:flex lg:items-center">
          <ul className="items-center justify-end flex-1 pt-6 list-none lg:pt-0 lg:flex">
            {navigation.map((menu, index) => (
              <li className="mr-3 nav__item" key={index}>
                <Link
                  href="/"
                  className="inline-block px-4 py-2 text-lg font-normal text-gray-800 no-underline rounded-md dark:text-gray-200 hover:text-indigo-500 focus:text-indigo-500 focus:bg-indigo-100 focus:outline-none dark:focus:bg-gray-800"
                >
                  {menu}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};
