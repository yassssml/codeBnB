import { execFileSync, execSync } from 'node:child_process';
import {
    cpSync,
    existsSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { createInterface } from 'node:readline/promises';
import {
    abrirPgAdmin,
    aguardarServidor,
    aviso,
    carregarEnv,
    falhar,
    instrucoesDer,
    ok,
    titulo,
} from './util.js';

const projeto = process.cwd();
const desktop = join(homedir(), 'Desktop');

const checklist = [];
const marcar = (item, certo, detalhe = '') => {
    checklist.push({ item, certo, detalhe });
    (certo ? ok : aviso)(`${item}${detalhe ? ` — ${detalhe}` : ''}`);
};

console.log('📦 Montagem da entrega (npm run entrega)');

titulo('1. Ambiente');
const url = carregarEnv();
const banco = url.pathname.slice(1);
const script = `${banco}.sql`;
ok('.env válido');

const pacote = JSON.parse(readFileSync('package.json', 'utf8'));
const nome = pacote.author?.name?.trim();
if (!nome)
    falhar(
        'Preencha seu nome completo em "author": { "name": "..." } no package.json',
    );
ok(`Nome completo: ${nome}`);

const sistema = (pacote.name ?? '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
    .join('');
if (!sistema) falhar('Preencha o "name" do sistema no package.json');
ok(`Sistema: ${sistema}`);

const descricao = pacote.description?.trim();
if (!descricao) falhar('Preencha a "description" do sistema no package.json');
ok(`Descrição: ${descricao}`);

titulo('2. Banco de dados');
let versao;
try {
    versao = await aguardarServidor(url);
} catch (e) {
    falhar(e.message);
}
ok(`PostgreSQL ${versao} respondendo`);

const { Prisma } = await import('@prisma/client');
const { prisma } = await import('../src/lib/prisma.js');
const modelos = Prisma.dmmf.datamodel.models;

for (const { name } of modelos) {
    const total = await prisma[name]
        .count()
        .catch(() => falhar(`Tabela ${name} não existe: rode npm run bd`));
    if (total < 3)
        falhar(
            `Tabela ${name} tem ${total} registro(s), a prova pede no mínimo 3: rode npm run bd`,
        );
    ok(`${name}: ${total} registros`);
}

titulo(`3. Script do banco (${script})`);

const tipo = (c) => {
    if (c.isId) return 'SERIAL PRIMARY KEY';
    if (c.nativeType)
        return (
            c.nativeType[0].toUpperCase() +
            (c.nativeType[1].length ? `(${c.nativeType[1]})` : '')
        );
    return { Int: 'INTEGER', String: 'TEXT', DateTime: 'TIMESTAMP' }[c.type];
};

const fks = (campos) =>
    Object.fromEntries(
        campos
            .filter((c) => c.relationFromFields?.length)
            .map((c) => [c.relationFromFields[0], c.type]),
    );

const valor = (v) => {
    if (v === null) return 'NULL';
    if (v instanceof Date) return `'${v.toISOString().slice(0, 10)}'`;
    if (typeof v === 'number') return v;
    return `'${String(v).replaceAll("'", "''")}'`;
};

const tabelas = modelos.map(({ name, fields }) => {
    const fk = fks(fields);
    const colunas = fields
        .filter((c) => c.kind === 'scalar')
        .map((c) => {
            let coluna = `    ${c.name} ${tipo(c)}`;
            if (c.isRequired && !c.isId) coluna += ' NOT NULL';
            if (c.isUnique) coluna += ' UNIQUE';
            if (fk[c.name]) coluna += ` REFERENCES ${fk[c.name]} (id)`;
            return coluna;
        });
    return `CREATE TABLE ${name} (\n${colunas.join(',\n')}\n);`;
});

const novosIds = {};
const inserts = [];
for (const { name, fields } of modelos) {
    const linhas = await prisma[name].findMany({ orderBy: { id: 'asc' } });
    novosIds[name] = new Map(linhas.map((linha, i) => [linha.id, i + 1]));
    for (const { id, ...campos } of linhas) {
        for (const [coluna, alvo] of Object.entries(fks(fields)))
            campos[coluna] = novosIds[alvo].get(campos[coluna]);
        inserts.push(
            `INSERT INTO ${name} (${Object.keys(campos).join(', ')}) VALUES (${Object.values(campos).map(valor).join(', ')});`,
        );
    }
    inserts.push('');
}
await prisma.$disconnect();

const sql = `CREATE DATABASE saep_db;\n\\c saep_db\n\n${tabelas.join('\n\n')}\n\n${inserts.join('\n')}`;
writeFileSync(script, sql);

const criadas = sql.match(/CREATE TABLE /g)?.length ?? 0;
const poucos = modelos
    .filter(({ name }) => sql.split(`INSERT INTO ${name} (`).length - 1 < 3)
    .map((m) => m.name);
if (criadas !== modelos.length || poucos.length)
    falhar(
        `${script} incompleto: ${criadas}/${modelos.length} tabelas; menos de 3 INSERTs em: ${poucos.join(', ')}`,
    );
ok(
    `${script} gerado: ${criadas} tabelas e ${inserts.filter(Boolean).length} INSERTs`,
);

titulo('4. Documentação (documentacao.md)');
const rl = createInterface({ input: process.stdin, output: process.stdout });

async function aguardar(texto, condicao, instrucoes) {
    let arquivo = condicao();
    while (!arquivo) {
        console.log(`\n${texto}\n${instrucoes}`);
        await rl.question('\nPressione Enter quando terminar...');
        arquivo = condicao();
    }
    return arquivo;
}

let numero = '';
while (!['01', '02', '03'].includes(numero))
    numero = (await rl.question('   Número da prova (01, 02 ou 03): '))
        .trim()
        .padStart(2, '0');
const data = new Date().toLocaleDateString('pt-BR');

const cabecalho = `# Documentação de Software

**Sistema:** ${sistema}

**Estudante:** ${nome}

**Data:** ${data}

**Número da prova:** ${numero}

${descricao}
`;

const documentacao = readFileSync('documentacao.md', 'utf8');
const inicio = documentacao.search(/^## /m);
if (inicio < 0)
    falhar(
        'documentacao.md sem seções: o conteúdo deve começar em "## 1.1 Requisitos Funcionais do Sistema"',
    );
const preenchido = `${cabecalho}\n${documentacao.slice(inicio)}`;
if (preenchido !== documentacao) writeFileSync('documentacao.md', preenchido);
ok('Cabeçalho adicionado ao documentacao.md:');
for (const [campo, valor] of [
    ['Sistema', sistema],
    ['Estudante', nome],
    ['Data', data],
    ['Número da prova', numero],
])
    console.log(`      ${campo}: ${valor}`);

titulo('5. DER (imagem ou .pdf)');
const ehDer = (arquivo) => /^der\.(png|jpe?g|pdf)$/i.test(arquivo);
const acharDer = () => readdirSync(projeto).find(ehDer);
let der = acharDer();
if (der) ok(`${der} encontrado`);
else {
    aviso('DER ainda não foi salvo na pasta do projeto');
    abrirPgAdmin(versao);
    der = await aguardar(
        'Gere o DER no pgAdmin:',
        acharDer,
        instrucoesDer(versao, banco, projeto),
    );
    ok(`${der} encontrado`);
}

titulo('6. Documentação (documentacao.pdf)');
const mtime = (arquivo) => statSync(arquivo).mtimeMs;
const pdfAtual = () =>
    existsSync('documentacao.pdf') &&
    mtime('documentacao.pdf') >= mtime('documentacao.md')
        ? 'documentacao.pdf'
        : null;
let doc = pdfAtual();
if (doc) ok('documentacao.pdf atualizado');
else {
    aviso(
        existsSync('documentacao.pdf')
            ? 'documentacao.pdf está desatualizado: exporte de novo'
            : 'documentacao.pdf ainda não foi gerado',
    );
    try {
        execSync('code -r documentacao.md', { stdio: 'ignore' });
    } catch {
        aviso(
            'Não foi possível abrir o VS Code: abra o documentacao.md manualmente',
        );
    }
    doc = await aguardar(
        'Exporte a documentação em PDF:',
        pdfAtual,
        `  1. No documentacao.md, botão direito no arquivo >
        Markdown Preview Enhanced: Open Preview to the Side
  2. Botão direito no arquivo >
        Export Chrome Puppeteer: Salvar como PDF`,
    );
    ok('documentacao.pdf atualizado');
}
rl.close();

titulo('7. Pasta da entrega');
const temporaria = join(tmpdir(), 'entrega');
const pasta = join(temporaria, nome);
const zip = join(desktop, `${nome}.zip`);
const fora = [
    'node_modules',
    '.next',
    '.git',
    '.vscode',
    'anexos',
    '.env.example',
    '.gitignore',
    'readme.md',
    'biome.json',
    'documentacao.md',
    'documentacao.pdf',
    script,
];

rmSync(temporaria, { recursive: true, force: true });
for (const arquivo of [doc, der, script])
    cpSync(arquivo, join(pasta, arquivo));
cpSync(projeto, join(pasta, 'sistema'), {
    recursive: true,
    filter: (origem) => {
        const item = relative(projeto, origem)
            .replaceAll('\\', '/')
            .toLowerCase();
        if (ehDer(item)) return false;
        return !fora.some((f) => item === f || item.startsWith(`${f}/`));
    },
});

const pacoteEntregue = join(pasta, 'sistema', 'package.json');
const copia = JSON.parse(readFileSync(pacoteEntregue, 'utf8'));
delete copia.scripts.bd;
delete copia.scripts.entrega;
delete copia.devDependencies?.['@biomejs/biome'];
writeFileSync(pacoteEntregue, `${JSON.stringify(copia, null, 4)}\n`);
ok('Pasta montada');

titulo('8. Conferência da entrega');
const naPasta = (caminho) => existsSync(join(pasta, caminho));

const raiz = readdirSync(pasta);
const repetidos = readdirSync(join(pasta, 'sistema')).filter((a) =>
    raiz.some((r) => r !== 'sistema' && r.toLowerCase() === a.toLowerCase()),
);
marcar('1. Documentação de software', naPasta(doc), doc);
marcar('2. Diagrama entidade relacionamento', naPasta(der), der);
marcar('3. Script do banco', naPasta(script), script);
marcar(
    'Sem arquivos repetidos em sistema/',
    repetidos.length === 0,
    repetidos.join(', '),
);
const funcionalidades = [
    ['4. Login', 'src/app/page.jsx'],
    ['5. Funcionalidade principal', 'src/app/inicio/page.jsx'],
    ['6. Gerenciamento de Cliente', 'src/app/clientes/page.jsx'],
    ['7. Gerenciamento de Veículo', 'src/app/veiculos/page.jsx'],
    ['8. Gerenciamento de Agendamentos', 'src/app/agendamentos/page.jsx'],
];
for (const [item, arquivo] of funcionalidades)
    marcar(item, naPasta(`sistema/${arquivo}`), `sistema/${arquivo}`);
if (!naPasta('sistema/.env'))
    aviso(
        'sistema/.env não foi copiado: o sistema entregue não conecta ao banco',
    );

titulo('9. Compactando');
const aspas = (texto) => `'${texto.replaceAll("'", "''")}'`;
execFileSync(
    'powershell',
    [
        '-NoProfile',
        '-Command',
        `Compress-Archive -LiteralPath ${aspas(pasta)} -DestinationPath ${aspas(zip)} -Force`,
    ],
    { stdio: 'inherit' },
);
const tamanho = existsSync(zip) ? statSync(zip).size : 0;
marcar(
    'Arquivo .zip na Área de Trabalho',
    tamanho > 0,
    `${zip} (${(tamanho / 1024).toFixed(0)} KB)`,
);
rmSync(temporaria, { recursive: true, force: true });
if (existsSync(join(desktop, nome)))
    aviso(
        `A pasta "${nome}" na Área de Trabalho é de uma execução anterior: a prova pede só o .zip, pode apagá-la`,
    );

const pendentes = checklist.filter((c) => !c.certo);
console.log(`
${pendentes.length ? `⚠️  Entrega com ${pendentes.length} pendência(s):` : '🎉 Entrega completa!'}
${checklist.map((c) => `  ${c.certo ? '✅' : '❌'} ${c.item}`).join('\n')}

  ${nome}.zip
  ${nome}/
  ├── ${doc}
  ├── ${der}
  ├── ${script}
  └── sistema/
`);
if (pendentes.length) process.exit(1);
