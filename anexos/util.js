import { execSync, spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const ok = (mensagem) => console.log(`   ✅ ${mensagem}`);
export const aviso = (mensagem) => console.log(`   ⚠️  ${mensagem}`);
export const titulo = (texto) => console.log(`\n== ${texto} ==`);

export function falhar(mensagem) {
    console.error(`\n❌ ${mensagem}\n`);
    process.exit(1);
}

export async function etapa(mensagem, acao) {
    console.log(`⏳ ${mensagem}...`);
    try {
        const resultado = await acao();
        ok(mensagem);
        return resultado;
    } catch (e) {
        falhar(`Falhou: ${mensagem}\n${e.stderr?.toString() || e.message}`);
    }
}

export function carregarEnv() {
    try {
        process.loadEnvFile();
    } catch {
        falhar(
            'Arquivo .env não encontrado na pasta do projeto.\n' +
                '   Copie o .env.example para .env e preencha a senha, a porta e o nome do banco.',
        );
    }
    for (const nome of ['DATABASE_URL', 'JWT_SECRET', 'CRIPTO_CHAVE']) {
        const valor = process.env[nome];
        if (!valor) falhar(`A variável ${nome} não está preenchida no .env`);
        if (['SENHA', 'PORTA', 'NOME_db', 'troque-por'].some((modelo) => valor.includes(modelo)))
            falhar(
                `A variável ${nome} ainda está com o texto do .env.example: preencha com os seus valores`,
            );
    }
    try {
        return new URL(process.env.DATABASE_URL);
    } catch {
        falhar(
            'DATABASE_URL inválida. Formato: postgresql://postgres:SENHA@localhost:PORTA/NOME_db',
        );
    }
}

export function urlAdmin(url) {
    const admin = new URL(url);
    admin.pathname = '/postgres';
    return admin.toString();
}

export async function aguardarServidor(url, tentativas = 20) {
    const { PrismaClient } = await import('@prisma/client');
    const transitorio = /recupera|recovery|starting up|iniciando|P1001|Can't reach|ECONNREFUSED/i;
    let avisou = false;

    for (let i = 1; ; i++) {
        const cliente = new PrismaClient({ datasourceUrl: urlAdmin(url) });
        let motivo;
        try {
            const [{ recuperacao, versao }] = await cliente.$queryRawUnsafe(
                "SELECT pg_is_in_recovery() AS recuperacao, current_setting('server_version_num')::int / 10000 AS versao",
            );
            if (!recuperacao) return Number(versao);
            motivo = 'em modo de recuperação';
        } catch (e) {
            if (/P1000|Authentication failed|autentica/i.test(e.message))
                throw new Error(
                    'Senha ou usuário do PostgreSQL incorretos: confira a DATABASE_URL no .env',
                );
            if (!transitorio.test(e.message)) throw e;
            motivo = /recupera|recovery|starting up|iniciando/i.test(e.message)
                ? 'em modo de recuperação'
                : 'sem resposta';
        } finally {
            await cliente.$disconnect().catch(() => {});
        }

        if (i >= tentativas)
            throw new Error(
                `O PostgreSQL em ${url.hostname}:${url.port || 5432} continua ${motivo}.\n` +
                    '   Confira se o serviço postgresql está rodando (services.msc) e se a porta do .env está certa.',
            );
        if (!avisou) {
            console.log(`   ⏳ servidor ${motivo}, aguardando ficar pronto...`);
            avisou = true;
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
}

export function pgAdminAberto() {
    try {
        const tarefas = execSync('tasklist /FI "IMAGENAME eq pgAdmin4.exe" /NH', {
            encoding: 'utf8',
        });
        return tarefas.toLowerCase().includes('pgadmin4.exe');
    } catch {
        return false;
    }
}

export function caminhoPgAdmin(versao) {
    const base = 'C:\\Program Files\\PostgreSQL';
    const exe = (pasta) => join(pasta, 'pgAdmin 4', 'runtime', 'pgAdmin4.exe');
    const candidatos = [exe(join(base, String(versao)))];
    if (existsSync(base))
        for (const v of readdirSync(base).sort((a, b) => Number(b) - Number(a)))
            candidatos.push(exe(join(base, v)));
    candidatos.push(exe('C:\\Program Files'));
    return candidatos.find((c) => existsSync(c));
}

export function abrirPgAdmin(versao) {
    if (pgAdminAberto()) {
        aviso(
            'pgAdmin já está aberto: clique com o botão direito em Databases > Refresh para ver o banco atualizado',
        );
        return;
    }
    const caminho = caminhoPgAdmin(versao);
    if (!caminho) {
        aviso('pgAdmin não encontrado: abra-o manualmente');
        return;
    }
    spawn(caminho, { detached: true, stdio: 'ignore' }).unref();
    ok(`pgAdmin aberto (${caminho})`);
}

export const instrucoesDer = (
    versao,
    banco,
    projeto,
) => `  1. No pgAdmin: Servers > PostgreSQL ${versao} > Databases
  2. Botão direito em ${banco} > ERD For Database
  3. Na barra do ERD, clique em "Download image"
  4. Mova a imagem baixada para esta pasta com o nome der.png
     ${projeto}`;
