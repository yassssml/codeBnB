import { excluir, salvar } from '@actions/imoveis';
import Crud from '@components/Crud';
import { prisma } from '@lib/prisma';

const colunas = [
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'Cliente', dataIndex: 'cliente_nome' },
];

export default async function Veiculos() {
    const [veiculos, clientes] = await Promise.all([
        prisma.veiculo.findMany({ orderBy: { modelo: 'asc' }, include: { cliente: true } }),
        prisma.cliente.findMany({ orderBy: { nome: 'asc' } }),
    ]);

    const registros = veiculos.map(({ cliente, ...veiculo }) => ({ ...veiculo, cliente_nome: cliente.nome }));

    const campos = [
        { name: 'nome', label: 'Nome' },
        { name: 'cliente_id', label: 'Cliente', opcoes: clientes.map((c) => ({ value: c.id, label: c.nome })) },
    ];

    return <Crud titulo="Veículos" {...{ colunas, campos, registros, salvar, excluir }} />;
}