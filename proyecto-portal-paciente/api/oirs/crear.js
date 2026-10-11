const { getDb } = require("../_firebase");
const { MAX_POR_DIA, exigirSesion, validarSolicitud, generarNumero } = require("../_oirs");

// Crea una solicitud OIRS a nombre del paciente que tiene sesión iniciada.
module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const sesion = exigirSesion(req, res);
    if (!sesion) return;

    const { error, datos } = validarSolicitud(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const db = getDb();

        // Límite diario por paciente, para evitar abusos
        const previas = await db.collection("oirs_solicitudes").where("rutPaciente", "==", sesion.rut).get();
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
        const numero = await generarNumero(db, ahora.getFullYear());
        const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
        const ref = await db.collection("oirs_solicitudes").add({
            numero,
            canal: "portal",
            tipo: datos.tipo,
            unidad: datos.unidad,
            materia: datos.materia,
            asunto: datos.asunto,
            descripcion: datos.descripcion,
            solicita: datos.solicita,
            adjuntos: "",
            // El nombre y el RUN salen de ClaveÚnica (sesión), nunca del navegador
            afectado: {
                nombres: sesion.nombre || "",
                apellidos: sesion.apellidos || "",
                nombreSocial: datos.nombreSocial,
                run: sesion.rut,
                fechaNac: datos.fechaNac,
                sexo: datos.sexo,
                genero: datos.genero,
                nacionalidad: datos.nacionalidad,
                puebloOriginario: datos.puebloOriginario,
                prais: datos.prais,
                domicilio: datos.domicilio,
                comuna: datos.comuna,
                telefono: datos.telefono,
                correo: datos.correo
            },
            solicitante: null,
            formaRespuesta: datos.formaRespuesta,
            autorizaCorreo: datos.formaRespuesta === "correo",
            correoRespuesta: datos.formaRespuesta === "correo" ? datos.correo : "",
            rutPaciente: sesion.rut,
            fechaRecepcion: ahora,
            horaRecepcion: hora,
            etapa: "recibida",
            estado: "recibida",
            respuesta: "",
            nota: "",
            creadoPor: "portal",
            createdAt: ahora,
            historial: [{ fecha: ahora, usuario: "portal", accion: "Ingresado", detalle: "Por el paciente, con ClaveÚnica" }]
        });

        res.status(201).json({ id: ref.id, numero });
    } catch (e) {
        console.error("Error al crear solicitud OIRS:", e.message);
        res.status(500).json({ error: "No se pudo guardar la solicitud. Intenta nuevamente." });
    }
};
