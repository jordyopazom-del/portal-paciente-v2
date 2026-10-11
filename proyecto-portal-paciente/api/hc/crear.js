const { getDb } = require("../_firebase");
const { exigirSesion, generarNumero } = require("../_oirs");
const { MAX_POR_DIA, validarSolicitudHc } = require("../_hc");

// Crea una solicitud de historia clínica a nombre del paciente con sesión iniciada.
// Por el portal solo puede pedir el propio titular: el RUT sale de la sesión, nunca del navegador.
module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const sesion = exigirSesion(req, res);
    if (!sesion) return;

    const { error, datos } = validarSolicitudHc(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const db = getDb();

        // Límite diario por paciente, para evitar abusos
        const previas = await db.collection("hc_solicitudes").where("rutSolicitante", "==", sesion.rut).get();
        const hace24h = Date.now() - 24 * 60 * 60 * 1000;
        const recientes = previas.docs.filter(d => {
            const c = d.data().createdAt;
            const t = c && typeof c.toDate === "function" ? c.toDate().getTime() : new Date(c).getTime();
            return t > hace24h;
        });
        if (recientes.length >= MAX_POR_DIA) {
            return res.status(429).json({ error: "Alcanzaste el máximo de solicitudes por día. Intenta mañana." });
        }

        const ahora = new Date();
        const numero = await generarNumero(db, ahora.getFullYear(), "HC", "hc_contador");
        const ref = await db.collection("hc_solicitudes").add({
            numero,
            canal: "portal",
            tipoSolicitante: "titular",
            solicitante: {
                nombre: `${sesion.nombre} ${sesion.apellidos || ""}`.trim(),
                rut: sesion.rut,
                telefono: datos.telefono
            },
            paciente: null,
            rutSolicitante: sesion.rut,
            ficha: datos.ficha,
            documentos: datos.documentos,
            estado: "recibida",
            nota: "",
            fechaRecepcion: ahora,
            creadoPor: "portal",
            createdAt: ahora
        });

        res.status(201).json({ id: ref.id, numero });
    } catch (e) {
        console.error("Error al crear solicitud de historia clínica:", e.message);
        res.status(500).json({ error: "No se pudo guardar la solicitud. Intenta nuevamente." });
    }
};
