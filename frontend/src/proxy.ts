import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/', '/auth/login', '/auth/register'];

// Rutas protegidas que requieren autenticación
const protectedRoutes = ['/dashboard', '/topology', '/tokens'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Verificar si la ruta actual es protegida
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Si es una ruta protegida, verificar autenticación
    if (isProtectedRoute) {
        // Intentar obtener el JWT de las cookies
        const jwt = request.cookies.get('jwt')?.value;

        // Si no hay JWT en cookies, intentar verificar si existe en localStorage
        // (esto se verifica en el cliente, aquí solo redirigimos)
        if (!jwt) {
            // Redirigir a login si no está autenticado
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Si es una ruta de autenticación y el usuario ya está autenticado, redirigir al dashboard
    if ((pathname === '/auth/login' || pathname === '/auth/register')) {
        const jwt = request.cookies.get('jwt')?.value;
        if (jwt) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
