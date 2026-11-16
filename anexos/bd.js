import { execSync } from 'node:child_process';
import {
    abrirPgAdmin,
    aguardarServidor,
    aviso,
    carregarEnv,
    etapa,
    instrucoesDer,
    ok,
    pgAdminAberto,
    titulo,
    urlAdmin,
} from './util.js';

console.log('🚗 Criação do banco de dados (npm run bd)');

titulo('1. Configuração');
const url = carregarEnv();
const banco = url.pathname.slice(1);
ok(`.env carregado: banco de dados ${banco} em ${url.hostname}:${url.port || 5432}`);

titulo('2. Banco de dados');
await etapa('Prisma Client gerado (GENERATE)', () =>
    execSync('npx prisma generate', { stdio: 'pipe' }),
);
const { PrismaClient } = await import('@prisma/client');

const versao = await etapa('Conexão com o PostgreSQL', () =>
    aguardarServidor(url),
);
if (pgAdminAberto())
    aviso(
        `pgAdmin está aberto: ele perde a conexão com o ${banco}. Depois, botão direito em Databases > Refresh`,
    );

await etapa(`Banco ${banco} recriado (DROP + CREATE DATABASE)`, async () => {
    const admin = new PrismaClient({ datasourceUrl: urlAdmin(url) });
    try {
        await admin.$queryRawUnsafe(
            'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
            banco,
        );
        await admin.$executeRawUnsafe(
            `DROP DATABASE IF EXISTS "${banco}" WITH (FORCE)`,
        );
        await admin.$executeRawUnsafe(`CREATE DATABASE "${banco}"`);
    } finally {
        await admin.$disconnect();
    }
});

await etapa('Tabelas criadas (TABLE)', () =>
    execSync('npx prisma db push --skip-generate', { stdio: 'pipe' }),
);

await etapa('Tabelas populadas (SEED)', () => import('../prisma/seed.js'));

titulo('3. DER no pgAdmin');
await etapa('Servidor pronto para o pgAdmin', () => aguardarServidor(url));
abrirPgAdmin(versao);
console.log(
    `\nPara gerar o DER (der.png):\n${instrucoesDer(versao, banco, process.cwd())}`,
);

console.log(`
🎉 Banco ${banco} pronto!
`);
