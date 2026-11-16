'use server';

import { prisma } from '@lib/prisma';
import { revalidatePath } from 'next/cache';

export async function salvar({ id, ...dados }) {
    try {
        if (id) await prisma.imoveis.update({ where: { id }, data: dados });
        else await prisma.imoveis.create({ data: dados });
    } catch {
        return { erro: 'Erro ao salvar o imóvel' };
    }
    revalidatePath('/imoveis');
}

export async function excluir(id) {
    try {
        await prisma.imoveis.delete({ where: { id } });
    } catch (e) {
        if (e.code === 'P2003') return { erro: 'Imóvel possui agendamentos cadastrados' };
        return { erro: 'Erro ao excluir o imóvel' };
    }
    revalidatePath('/imoveis');
}