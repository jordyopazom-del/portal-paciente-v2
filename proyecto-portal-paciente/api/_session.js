// Utilidades de sesión (el "_" al inicio evita que Vercel lo publique como endpoint).
// La sesión es una cookie firmada: si alguien la modifica, la firma deja de coincidir y se rechaza.
const crypto = require("crypto");

const SESSION_COOKIE = "portal_sesion";
const STATE_COOKIE = "cu_state";
const SESSION_HORAS = 2;

function secreto() {
    const s = process.env.SESSION_SECRET;
    if (!s || s.length < 32) {
        throw new Error("Falta SESSION_SECRET (mínimo 32 caracteres) en las variables de entorno.");
    }
    return s;
}

function firmar(texto) {
    return crypto.createHmac("sha256", secreto()).update(texto).digest("base64url");
}

function crearSesion(datos) {
    const payload = Buffer.from(JSON.stringify({
        ...datos,
        exp: Date.now() + SESSION_HORAS * 60 * 60 * 1000
    })).toString("base64url");
    return `${payload}.${firmar(payload)}`;
}

function leerSesion(valor) {
    if (!valor || !valor.includes(".")) return null;
    const [payload, firma] = valor.split(".");
    const esperada = firmar(payload);
    const a = Buffer.from(firma);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const datos = JSON.parse(Buffer.from(payload, "base64url").toString());
        if (!datos.exp || datos.exp < Date.now()) return null;
        return datos;
    } catch {
        return null;
    }
}

function leerCookies(req) {
    const resultado = {};
    (req.headers.cookie || "").split(";").forEach(par => {
        const i = par.indexOf("=");
        if (i > 0) resultado[par.slice(0, i).trim()] = decodeURIComponent(par.slice(i + 1).trim());
    });
    return resultado;
}

function cookie(nombre, valor, segundos) {
    return `${nombre}=${encodeURIComponent(valor)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${segundos}`;
}

module.exports = {
    SESSION_COOKIE, STATE_COOKIE, SESSION_HORAS,
    crearSesion, leerSesion, leerCookies, cookie
};
