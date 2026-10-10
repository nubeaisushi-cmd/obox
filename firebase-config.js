/*
  Pegá acá los datos de TU proyecto de Firebase (LEEME, paso 5).
  Mientras diga "PEGA_AQUI", la agenda funciona en modo local: un solo usuario, guardado en el navegador.
  Estos datos no son secretos: lo que protege tu información son las reglas de seguridad (firestore.rules).
*/
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDzSvqN_KZLAeXSLM8W6rWI4rTYqU7tvvU",
  authDomain: "obox-3362f.firebaseapp.com",
  projectId: "obox-3362f",
  storageBucket: "obox-3362f.firebasestorage.app",
  messagingSenderId: "66746723814",
  appId: "1:66746723814:web:9c21811988d0513f6f3a27"
};

/*
  Archivos adjuntos en las tarjetas:
  - useStorage: false  -> gratis. Los archivos chicos (hasta ~650 KB, las fotos se achican solas) se guardan dentro de la base de datos. Los links funcionan siempre.
  - useStorage: true   -> archivos de hasta 25 MB en Firebase Storage. Requiere activar Storage en tu proyecto (ver LEEME, "Archivos grandes") y publicar storage.rules.
*/
window.APP_OPTIONS = { useStorage: false };


/*
  Avisos al celular (notificaciones push).
  Pegá acá la "clave pública VAPID": Firebase → Configuración del proyecto → Cloud Messaging → Certificados push web → Generar par de claves.
  Mientras diga "PEGA_AQUI", el botón de campana avisa que falta configurar. Los avisos dentro de la app funcionan igual.
*/
window.FCM_VAPID_KEY = "PEGA_AQUI";


/*
  Cómo se mandan los avisos al celular:
  - "cloudflare" (por defecto, GRATIS): lo envía la carpeta functions/ de este proyecto, que Cloudflare Pages publica sola. Ver LEEME, punto 22.
  - "firebase": lo envía una Cloud Function de Firebase (carpeta extras/firebase-functions). Requiere el plan Blaze (con tarjeta).
  Usá UNA sola de las dos, si no cada aviso llega duplicado.
*/
window.PUSH_MODE = "cloudflare";
