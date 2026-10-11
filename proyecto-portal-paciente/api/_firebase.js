// Conexión a la base de datos (Firestore) desde el servidor del portal.
// Usa las mismas variables que ya usan GIA-CESFAM y las otras plataformas.
// Los pacientes nunca hablan directo con la base de datos: todo pasa por estas funciones.
let db = null;

function getDb() {
    if (db) return db;
    const admin = require("firebase-admin");
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Faltan variables de Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).");
    }
    const app = admin.apps.length
        ? admin.apps[0]
        : admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
    db = admin.firestore(app);
    return db;
}

module.exports = { getDb };
