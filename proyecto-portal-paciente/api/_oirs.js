// Reglas comunes de OIRS: tipos, validación y número de seguimiento.
const { SESSION_COOKIE, leerSesion, leerCookies } = require("./_session");

const TIPOS = ["reclamo", "consulta", "sugerencia", "solicitud", "felicitacion"];
const MATERIAS = [
    "Trato", "Tiempo de espera", "Información", "Infraestructura",
    "Competencia técnica", "Acceso a la atención", "Otro"
];
const FORMAS = ["correo", "carta", "retiro"];
const MAX_POR_DIA = 5;

// Devuelve la sesión del paciente o responde 401. Nunca se confía en un RUT enviado por el navegador.
function exigirSesion(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const sesion = leerSesion(leerCookies(req)[SESSION_COOKIE]);
    if (!sesion) {
        res.status(401).json({ error: "Sin sesión" });
        return null;
    }
    return sesion;
}

function limpiar(valor, max) {
    return String(valor ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function limpiarTexto(valor, max) {
    // Conserva saltos de línea en textos largos
    return String(valor ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").trim().slice(0, max);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida lo que escribe el paciente. Devuelve { error } o { datos }.
// El nombre y el RUT NO se piden: salen de la sesión de ClaveÚnica.
function validarSolicitud(body) {
    const b = body && typeof body === "object" ? body : {};
    const tipo = limpiar(b.tipo, 20);
    const materia = limpiar(b.materia, 40);
    const unidad = limpiar(b.unidad, 100);
    const descripcion = limpiarTexto(b.descripcion, 3000);
    let asunto = limpiar(b.asunto, 120);
    const solicita = limpiarTexto(b.solicita, 1000);
    const telefono = limpiar(b.telefono, 20);
    const formaRespuesta = limpiar(b.formaRespuesta, 10);
    const correo = limpiar(b.correo, 100);
    const domicilio = limpiar(b.domicilio, 160);
    const comuna = limpiar(b.comuna, 60);

    if (!TIPOS.includes(tipo)) return { error: "Selecciona un tipo de solicitud válido." };
    if (materia && !MATERIAS.includes(materia)) return { error: "La materia seleccionada no es válida." };
    if (descripcion.length < 20) return { error: "Describe lo ocurrido con más detalle (mínimo 20 letras)." };
    if (!asunto) asunto = descripcion.length > 70 ? descripcion.slice(0, 70).trim() + "…" : descripcion;
    if (asunto.length < 5) return { error: "Escribe un asunto (mínimo 5 letras)." };
    if (!FORMAS.includes(formaRespuesta)) return { error: "Indica cómo quieres recibir la respuesta." };
    if (formaRespuesta === "correo" && !EMAIL.test(correo)) return { error: "Para recibir la respuesta por correo, escribe un correo válido." };
    if (correo && !EMAIL.test(correo)) return { error: "El correo no es válido." };
    if (formaRespuesta === "carta" && domicilio.length < 5) return { error: "Para recibir una carta, escribe tu domicilio." };
    if (telefono && !/^[0-9 +()-]{8,20}$/.test(telefono)) return { error: "El teléfono no es válido." };

    // Datos opcionales que el CESFAM usa para estadística
    const fechaNac = /^\d{4}-\d{2}-\d{2}$/.test(String(b.fechaNac || "")) ? b.fechaNac : "";
    const sexo = ["H", "M"].includes(b.sexo) ? b.sexo : "";
    const genero = ["F", "M", "T"].includes(b.genero) ? b.genero : "";
    const prais = ["si", "no"].includes(b.prais) ? b.prais : "";
    const nombreSocial = limpiar(b.nombreSocial, 80);
    const nacionalidad = limpiar(b.nacionalidad, 60);
    const puebloOriginario = limpiar(b.puebloOriginario, 60);

    return { datos: { tipo, materia, unidad, asunto, descripcion, solicita, telefono, formaRespuesta, correo, domicilio, comuna,
        fechaNac, sexo, genero, prais, nombreSocial, nacionalidad, puebloOriginario } };
}

// Número correlativo por año: OIRS-2026-0001
async function generarNumero(db, anio, prefijo = "OIRS", coleccion = "oirs_contador") {
    const ref = db.collection(coleccion).doc(String(anio));
    return db.runTransaction(async (tx) => {
        const doc = await tx.get(ref);
        const n = (doc.exists ? doc.data().n : 0) + 1;
        tx.set(ref, { n });
        return `${prefijo}-${anio}-${String(n).padStart(4, "0")}`;
    });
}

function aISO(valor) {
    if (!valor) return null;
    const d = typeof valor.toDate === "function" ? valor.toDate() : new Date(valor);
    return isNaN(d) ? null : d.toISOString();
}

module.exports = { TIPOS, MATERIAS, MAX_POR_DIA, exigirSesion, validarSolicitud, generarNumero, aISO, limpiar, limpiarTexto };
