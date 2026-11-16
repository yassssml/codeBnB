import bcrypt from 'bcryptjs';

try {
    process.loadEnvFile();
} catch {
    console.error('   ❌ parceria ... arquivo .env não encontrado');
    process.exit(1);
}

const { criptografar } = await import('../src/lib/cripto.js');
const { prisma } = await import('../src/lib/prisma.js');

// para ter mais linhas no banco, acrescente mais objetos em cada lista/tabela
const dados = {
    usuario: [ { nome: 'Maria', senha: bcrypt.hashSync('maria123', 10) },
               { nome: 'Carlos', senha: bcrypt.hashSync('carlos123', 10) },
               { nome: 'Ronaldo', senha: bcrypt.hashSync('ronaldo123', 10) }
            ],
    clientes: [  { nome: 'Maria', cpf: criptografar('123.456.789-01') },
                 { nome: 'Carlos', cpf: criptografar('234.567.890-12') },
                 { nome: 'Ronaldo', cpf: criptografar('345.678.901-23') }
                ],
    imoveis: [ { nome: 'Casa', clienteId: 1 },
               { nome: 'Apartamento', clienteId: 2 },
               { nome: 'Kitnet', clienteId: 3 }
            ],
    alugueis: [ { data: new Date('2026-11-10'), imovelId: 1 },
                { data: new Date('2026-11-11'), imovelId: 2 },
                { data: new Date('2026-11-12'), imovelId: 3 }
    ],
};

const tabelas = Object.keys(dados).reverse().join(', ');
await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tabelas} RESTART IDENTITY CASCADE`);
console.log('   🧹 registros anteriores apagados (ids reiniciados)');

for (const [tabela, data] of Object.entries(dados)) {
    const { count } = await prisma[tabela].createMany({ data });
    console.log(`   ✅ ${tabela}: ${count} registros`);
}

await prisma.$disconnect();
