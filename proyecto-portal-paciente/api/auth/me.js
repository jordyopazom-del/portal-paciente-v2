const { SESSION_COOKIE, leerSesion, leerCookies } = require("../_session");

// Responde "quién eres" según la cookie de sesión. Sin sesión válida: 401.
module.exports = function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const sesion = leerSesion(leerCookies(req)[SESSION_COOKIE]);
    if (!sesion) {
        return res.status(401).json({ error: "Sin sesión" });
    }
    res.status(200).json({
        rut: sesion.rut,
        nombre: sesion.nombre,
        apellidos: sesion.apellidos
    });
};
