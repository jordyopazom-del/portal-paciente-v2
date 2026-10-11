const { getDb } = require("../_firebase");
const { exigirSesion, aISO, moduloActivo } = require("../_oirs");

// Muestra una solicitud solo si pertenece al paciente con sesión iniciada.
module.exports = async function handler(req, res) {
    if (!moduloActivo(res, "OIRS")) return;
    const sesion = exigirSesion(req, res);
    if (!sesion) return;

    const id = String(req.query.id || "");
    if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return res.status(400).json({ error: "Solicitud inválida." });

    try {
        const doc = await getDb().collection("oirs_solicitudes").doc(id).get();
        // Si no existe o es de otra persona, la respuesta es la misma: no se revela nada.
        if (!doc.exists || doc.data().rutPaciente !== sesion.rut || doc.data().anulada) {
            return res.status(404).json({ error: "Solicitud no encontrada." });
        }
        const s = doc.data();
        res.status(200).json({
            numero: s.numero,
            tipo: s.tipo,
            materia: s.materia || "",
            unidad: s.unidad || "",
            asunto: s.asunto,
            descripcion: s.descripcion,
            solicita: s.solicita || "",
            formaRespuesta: s.formaRespuesta || "",
            estado: s.estado,
            fecha: aISO(s.fechaRecepcion || s.createdAt),
            respuesta: s.respuesta || "",
            fechaRespuesta: aISO(s.fechaRespuesta)
        });
    } catch (e) {
        console.error("Error al leer solicitud OIRS:", e.message);
        res.status(500).json({ error: "No se pudo cargar la solicitud." });
    }
};
