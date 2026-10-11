const { getDb } = require("../_firebase");
const { exigirSesion } = require("../_oirs");
const { lineasSolicitud, aISO } = require("../_hc");

// Muestra una solicitud solo si pertenece al paciente con sesión iniciada.
// Nunca se entregan las notas internas ni quién la procesó.
module.exports = async function handler(req, res) {
    const sesion = exigirSesion(req, res);
    if (!sesion) return;

    const id = String(req.query.id || "");
    if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return res.status(400).json({ error: "Solicitud inválida." });

    try {
        const doc = await getDb().collection("hc_solicitudes").doc(id).get();
        // Si no existe o es de otra persona, la respuesta es la misma: no se revela nada.
        if (!doc.exists || doc.data().rutSolicitante !== sesion.rut || doc.data().anulada) {
            return res.status(404).json({ error: "Solicitud no encontrada." });
        }
        const s = doc.data();
        res.status(200).json({
            numero: s.numero,
            estado: s.estado,
            fecha: aISO(s.fechaRecepcion || s.createdAt),
            lineas: lineasSolicitud(s),
            fechaLista: aISO(s.fechaLista),
            fechaRetiro: aISO(s.fechaRetiro),
            fechaVencida: aISO(s.fechaVencida),
            motivoRechazo: s.estado === "rechazada" ? (s.motivoRechazo || "") : ""
        });
    } catch (e) {
        console.error("Error al leer solicitud de historia clínica:", e.message);
        res.status(500).json({ error: "No se pudo cargar la solicitud." });
    }
};
