module.exports = async function handler(req, res) {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send("No se recibió el código de autorización.");
    }

    const clientId = process.env.CLAVEUNICA_CLIENT_ID;
    const clientSecret = process.env.CLAVEUNICA_CLIENT_SECRET;
    const redirectUri = process.env.CLAVEUNICA_REDIRECT_URI;

    try {
        // 1. Cambiar el código por el Access Token
        const tokenResponse = await fetch("https://accounts.claveunica.gob.cl/openid/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
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
            console.error("Error obteniendo token:", await tokenResponse.text());
            return res.status(500).send("Error al comunicarse con ClaveÚnica (Token)");
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Obtener información del usuario (RUT y Nombre)
        const userInfoResponse = await fetch("https://accounts.claveunica.gob.cl/openid/userinfo/", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!userInfoResponse.ok) {
            console.error("Error obteniendo userInfo:", await userInfoResponse.text());
            return res.status(500).send("Error al obtener datos del usuario desde ClaveÚnica");
        }

        const userInfo = await userInfoResponse.json();

        // Extraemos los datos útiles para mostrar en consola de Vercel
        const rut = userInfo.RolUnico.numero;
        const dv = userInfo.RolUnico.DV;
        const nombres = userInfo.name.nombres.join(" ");
        const apellidos = userInfo.name.apellidos.join(" ");

        console.log(`Ingreso exitoso: ${nombres} ${apellidos} (RUT: ${rut}-${dv})`);

        // 3. Crear una sesión (Por ahora redirigiremos simulando éxito)
        // En el futuro aquí conectaremos a Firebase: `firebase.auth().createCustomToken(rut)`
        
        // Redirigir al dashboard indicando éxito (en la vida real se usa una cookie HTTP-only o un custom token)
        res.redirect(`/dashboard.html?rut=${rut}&nombre=${encodeURIComponent(nombres)}`);

    } catch (error) {
        console.error("Error en el flujo de ClaveÚnica:", error);
        res.status(500).send("Ocurrió un error inesperado durante la autenticación.");
    }
}
