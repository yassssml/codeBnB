import crypto from 'node:crypto';

const hash = crypto.createHash('sha512').update(process.env.CRIPTO_CHAVE).digest();
const chave = hash.subarray(0, 32);
const iv = hash.subarray(32, 48);

export function criptografar(texto) {
    const cifra = crypto.createCipheriv('aes-256-cbc', chave, iv);
    return cifra.update(texto, 'utf8', 'hex') + cifra.final('hex');
}

export function descriptografar(texto) {
    const decifra = crypto.createDecipheriv('aes-256-cbc', chave, iv);
    return decifra.update(texto, 'hex', 'utf8') + decifra.final('utf8');
}