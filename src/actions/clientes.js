'use server';

import { criptografar } from '@lib/cripto';
import { prisma } from '@lib/prisma';
import { revalidatePath } from 'next/cache';

export async function salvar({ id, ...dados }) {
    try {
        const data = { ...dados, cpf: criptografar(dados.cpf) };
        if (id) await prisma.cliente.update({ where: { id }, data });
        else await prisma.cliente.create({ data });
    } catch (e) {
        if (e.code === 'P2002') return { erro: 'CPF já cadastrado' };
        return { erro: 'Erro ao salvar o cliente' };
    }
    revalidatePath('/cliente');
}

export async function excluir(id) {
    try {
        await prisma.cliente.delete({ where: { id } });
    } catch (e) {
        if (e.code === 'P2003') return { erro: 'Cliente possui veículos cadastrados' };
        return { erro: 'Erro ao excluir o cliente' };
    }
    revalidatePath('/cliente');
}