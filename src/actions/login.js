'use server';

import { prisma } from '@lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const TEMPO_VIDA = 60 * 60; // 1 hora = 3600 segundos

export async function entrar({ nome, senha }) {
    let usuario;
    try {
        usuario = await prisma.usuario.findUnique({ where: { nome } });
    } catch {
        return { erro: 'Erro ao conectar com o banco' };
    }

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
        return { erro: 'Usuário ou senha incorretos' };
    }

    const token = jwt.sign({ nome: usuario.nome }, process.env.JWT_SECRET, { expiresIn: TEMPO_VIDA, });
    const cookieStore = await cookies();
    cookieStore.set('token', token, { httpOnly: true, sameSite: 'lax', maxAge: TEMPO_VIDA });

    redirect('/inicio');
}

export async function sair() {
    (await cookies()).delete('token');
    redirect('/');
}