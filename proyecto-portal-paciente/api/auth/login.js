module.exports = function handler(req, res) {
    const clientId = process.env.CLAVEUNICA_CLIENT_ID;
    const redirectUri = process.env.CLAVEUNICA_REDIRECT_URI;
    
    // Generar un código aleatorio por seguridad (CSRF)
    const state = Math.random().toString(36).substring(2, 15);
    
    // Endpoint oficial de autorización de ClaveÚnica
    const baseUrl = "https://accounts.claveunica.gob.cl/openid/authorize";
    
    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        scope: 'openid run name',
        redirect_uri: redirectUri,
        state: state
    });

    // Redirigir al usuario al portal del gobierno
    res.redirect(`${baseUrl}?${params.toString()}`);
}
