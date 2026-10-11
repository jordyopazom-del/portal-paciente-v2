// Reglas comunes de Historia Clínica: documentos, validación y textos de resumen.
const { limpiar, aISO } = require("./_oirs");

const MAX_POR_DIA = 5;

// Mismos documentos del formulario de solicitud de antecedentes del CESFAM
const DOCUMENTOS = {
    lectura: { etiqueta: "Lectura de ficha clínica", pideDetalle: false },
    cartolas: { etiqueta: "Cartolas de programa", pideDetalle: false },
    examenes: { etiqueta: "Exámenes", pideDetalle: true },
    dau: { etiqueta: "DAU (hoja de atención de urgencia)", pideDetalle: true },
    informe: { etiqueta: "Informe médico o profesional de salud", pideDetalle: true },
    otro: { etiqueta: "Otro documento", pideDetalle: true }
};

function fechaValida(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const d = new Date(iso + "T12:00:00");
    return !isNaN(d) && d.toISOString().slice(0, 10) === iso;
}

// Valida lo que escribe el paciente. Devuelve { error } o { datos }.
function validarSolicitudHc(body) {
    const b = body && typeof body === "object" ? body : {};
    const telefono = limpiar(b.telefono, 20);
    if (telefono && !/^[0-9 +()-]{8,20}$/.test(telefono)) return { error: "El teléfono no es válido." };

    const f = b.ficha && typeof b.ficha === "object" ? b.ficha : {};
    const modo = ["ninguna", "completa", "parcial"].includes(f.modo) ? f.modo : "ninguna";
    let desde = "", hasta = "";
    if (modo === "parcial") {
        desde = limpiar(f.desde, 10);
        hasta = limpiar(f.hasta, 10);
        if (!fechaValida(desde) || !fechaValida(hasta)) return { error: "Indica las fechas desde y hasta de la copia parcial." };
        if (desde > hasta) return { error: "La fecha \"desde\" no puede ser posterior a \"hasta\"." };
        if (hasta > new Date().toISOString().slice(0, 10)) return { error: "La fecha \"hasta\" no puede ser futura." };
    }

    const vistos = new Set();
    const documentos = [];
    for (const d of Array.isArray(b.documentos) ? b.documentos.slice(0, 12) : []) {
        const clave = limpiar(d && d.clave, 20);
        if (!DOCUMENTOS[clave] || vistos.has(clave)) continue;
        vistos.add(clave);
        const detalle = DOCUMENTOS[clave].pideDetalle ? limpiar(d.detalle, 200) : "";
        if (DOCUMENTOS[clave].pideDetalle && detalle.length < 3) {
            return { error: `Especifica el detalle de: ${DOCUMENTOS[clave].etiqueta}.` };
        }
        documentos.push({ clave, detalle });
    }

    if (modo === "ninguna" && !documentos.length) return { error: "Indica qué necesitas: copia de ficha clínica u otro documento." };
    return { datos: { telefono, ficha: { modo, desde, hasta }, documentos } };
}

function fechaISO(iso) {
    const [a, m, d] = String(iso || "").split("-");
    return a ? `${d}-${m}-${a}` : "";
}

// Lista legible de lo solicitado (para que el paciente la vea)
function lineasSolicitud(s) {
    const lineas = [];
    const f = s.ficha || {};
    if (f.modo === "completa") lineas.push("Copia completa de la ficha clínica");
    if (f.modo === "parcial") lineas.push(`Copia parcial de la ficha clínica (desde ${fechaISO(f.desde)} hasta ${fechaISO(f.hasta)})`);
    (s.documentos || []).forEach(d => {
        const def = DOCUMENTOS[d.clave];
        lineas.push((def ? def.etiqueta : d.clave) + (d.detalle ? `: ${d.detalle}` : ""));
    });
    return lineas;
}

module.exports = { MAX_POR_DIA, DOCUMENTOS, validarSolicitudHc, lineasSolicitud, aISO };
