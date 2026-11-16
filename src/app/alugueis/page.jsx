import { excluir, salvar } from '@actions/alugueis';
import Crud from '@components/Crud';
import { descriptografar } from '@lib/cripto';
import { prisma } from '@lib/prisma';

const colunas = [
    { title: 'Data', dataIndex: 'data' },
    { title: 'Nome', dataIndex: 'imovel_nome' },
    { title: 'Cliente', dataIndex: 'cliente_nome' },
    { title: 'CPF', dataIndex: 'cliente_cpf' },
];

export default async function Alugueis() {
    const [alugueis, imoveis] = await Promise.all([
        prisma.agendamento.findMany({
            orderBy: { data: 'asc' },
            include: { imovel: { include: { cliente: true } } },
        }),
        prisma.imovel.findMany({ orderBy: { modelo: 'asc' }, include: { cliente: true } }),
    ]);

    const registros = alugueis.map(({ id, data, imovel_id, imovel }) => ({
        id,
        imovel_id,
        data: data.toISOString().slice(0, 10),
        imovel_nome: imovel.modelo,
        cliente_nome: imovel.cliente.nome,
        cliente_cpf: descriptografar(imovel.cliente.cpf),
    }));

    const campos = [
        { name: 'data', label: 'Data', tipo: 'date' },
        {
            name: 'imovel_id',
            label: 'Imóvel',
            opcoes: imoveis.map((v) => ({ value: v.id, label: `${v.modelo} (${v.cliente.nome})` })),
        },
    ];

    return <Crud titulo="Alugueis" {...{ colunas, campos, registros, salvar, excluir }} />;
}