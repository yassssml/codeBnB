import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

function logado(token) {
    try {
        return Boolean(jwt.verify(token, process.env.JWT_SECRET));
    } catch {
        return false;
    }
}

export function proxy(request) {
    const temSessao = logado(request.cookies.get('token')?.value);
    const ehPaginaLogin = request.nextUrl.pathname === '/';

    if (!temSessao && !ehPaginaLogin) {
        return NextResponse.redirect(new URL('/', request.url));
    }
    if (temSessao && ehPaginaLogin) {
        return NextResponse.redirect(new URL('/inicio', request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};