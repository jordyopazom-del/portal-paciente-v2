const { getDb } = require("../_firebase");
const { exigirSesion } = require("../_oirs");
const { lineasSolicitud, aISO } = require("../_hc");

// Lista SOLO las solicitudes del paciente con sesión iniciada.
module.exports = async function handler(req, res) {
    const sesion = exigirSesion(req, res);
    if (!sesion) return;

    try {
        const snap = await getDb().collection("hc_solicitudes").where("rutSolicitante", "==", sesion.rut).get();
        const lista = snap.docs.filter(d => !d.data().anulada).map(d => {
            const s = d.data();
            return {
                id: d.id,
                numero: s.numero,
                estado: s.estado,
                resumen: lineasSolicitud(s),
                fecha: aISO(s.fechaRecepcion || s.createdAt)
            };
        }).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
        res.status(200).json(lista);
    } catch (e) {
        console.error("Error al listar solicitudes de historia clínica:", e.message);
        res.status(500).json({ error: "No se pudieron cargar tus solicitudes." });
    }
};
