const { SESSION_COOKIE, cookie } = require("../_session");

// Cierra la sesión borrando la cookie.
module.exports = function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, "", 0));
    res.status(200).json({ ok: true });
};
