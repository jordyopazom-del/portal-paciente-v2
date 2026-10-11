const { getDb } = require("../_firebase");
const { exigirSesion, aISO } = require("../_oirs");

// Lista SOLO las solicitudes del paciente con sesión iniciada.
module.exports = async function handler(req, res) {
    const sesion = exigirSesion(req, res);
    if (!sesion) return;

    try {
        const snap = await getDb().collection("oirs_solicitudes").where("rutPaciente", "==", sesion.rut).get();
        const lista = snap.docs.filter(d => !d.data().anulada).map(d => {
            const s = d.data();
            return {
                id: d.id,
                numero: s.numero,
                tipo: s.tipo,
                asunto: s.asunto,
                estado: s.estado,
                fecha: aISO(s.fechaRecepcion || s.createdAt)
            };
        }).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
        res.status(200).json(lista);
    } catch (e) {
        console.error("Error al listar solicitudes OIRS:", e.message);
        res.status(500).json({ error: "No se pudieron cargar tus solicitudes." });
    }
};
