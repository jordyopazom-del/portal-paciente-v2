const crypto = require("crypto");
const { SESSION_COOKIE, STATE_COOKIE, SESSION_HORAS, crearSesion, leerCookies, cookie } = require("../_session");

module.exports = async function handler(req, res) {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).send("No se recibió el código de autorización.");
    }

    // Verificar que quien vuelve es el mismo que inició el ingreso
    const stateGuardado = leerCookies(req)[STATE_COOKIE];
    const a = Buffer.from(String(state));
    const b = Buffer.from(String(stateGuardado || ""));
    if (!stateGuardado || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(400).send("Ingreso inválido o expirado. Vuelve a intentarlo desde el portal.");
    }

    const clientId = process.env.CLAVEUNICA_CLIENT_ID;
    const clientSecret = process.env.CLAVEUNICA_CLIENT_SECRET;
    const redirectUri = process.env.CLAVEUNICA_REDIRECT_URI;

    try {
        // 1. Cambiar el código por el Access Token
        const tokenResponse = await fetch("https://accounts.claveunica.gob.cl/openid/token/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
                code: code,
                state: state
            }).toString()
        });

        if (!tokenResponse.ok) {
            console.error("Error obteniendo token de ClaveÚnica. Estado HTTP:", tokenResponse.status);
            return res.status(500).send("Error al comunicarse con ClaveÚnica (Token)");
        }

        const { access_token } = await tokenResponse.json();

        // 2. Obtener RUT y nombre del usuario
        const userInfoResponse = await fetch("https://accounts.claveunica.gob.cl/openid/userinfo/", {
            method: "POST",
            headers: { "Authorization": `Bearer ${access_token}` }
        });

        if (!userInfoResponse.ok) {
            console.error("Error obteniendo userInfo de ClaveÚnica. Estado HTTP:", userInfoResponse.status);
            return res.status(500).send("Error al obtener datos del usuario desde ClaveÚnica");
        }

        const userInfo = await userInfoResponse.json();

        // 3. Crear la sesión firmada. El RUT NO se escribe en logs ni en la URL.
        const sesion = crearSesion({
            rut: `${userInfo.RolUnico.numero}-${userInfo.RolUnico.DV}`,
            nombre: userInfo.name.nombres.join(" "),
            apellidos: userInfo.name.apellidos.join(" ")
        });

        res.setHeader("Set-Cookie", [
            cookie(SESSION_COOKIE, sesion, SESSION_HORAS * 3600),
            cookie(STATE_COOKIE, "", 0)
        ]);
        res.redirect("/dashboard.html");

    } catch (error) {
        console.error("Error en el flujo de ClaveÚnica:", error.message);
        res.status(500).send("Ocurrió un error inesperado durante la autenticación.");
    }
};
