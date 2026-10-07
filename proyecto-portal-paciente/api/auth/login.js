const crypto = require("crypto");
const { STATE_COOKIE, cookie } = require("../_session");

module.exports = function handler(req, res) {
    const clientId = process.env.CLAVEUNICA_CLIENT_ID;
    const redirectUri = process.env.CLAVEUNICA_REDIRECT_URI;

    // Código aleatorio seguro (anti-falsificación). Se guarda en una cookie
    // y se compara cuando ClaveÚnica devuelve al usuario.
    const state = crypto.randomBytes(24).toString("hex");

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        scope: "openid run name",
        redirect_uri: redirectUri,
        state: state
    });

    res.setHeader("Set-Cookie", cookie(STATE_COOKIE, state, 600));
    res.redirect(`https://accounts.claveunica.gob.cl/openid/authorize?${params.toString()}`);
};
