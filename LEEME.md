# OBOX — Manual completo de uso, equipo, publicación y mantenimiento

## 1. Qué es Obox

Obox es una herramienta interna para organizar el trabajo de una agencia de marketing.

La lógica principal es:

**Cliente → Campaña / proyecto → Tablero → Entregables / tarjetas → Archivos → Aprobación**

Además tiene una agenda personal, calendario, Daily, Semana y Retro.

La web está pensada para trabajar con un equipo y guardar la información online usando Firebase.

---

# 2. Módulos de Obox

## Tablero de tareas

Es la vista diaria. Ordena las tareas en:

- Top 3
- Atrasadas
- Hoy
- Mañana
- Espera de respuesta
- Todo lo demás
- Tareas cerradas

Sirve para saber qué hay que hacer primero.

### Top 3

Son las tres tareas más importantes del día. Obox limita el sistema a tres tareas activas.

### Atrasadas

Tareas abiertas cuya fecha ya pasó.

### Espera de respuesta

Conviene usar este estado cuando el trabajo está frenado porque falta una respuesta, aprobación o material externo.

---

# 3. Calendario

Muestra las tareas según su fecha.

Es útil para detectar acumulación de trabajo y vencimientos.

El calendario no reemplaza el tablero: el tablero sirve para priorizar y el calendario para ubicar el trabajo en el tiempo.

---

# 4. Tableros (Trello)

Esta es la vista de producción.

Cada tablero pertenece a un cliente y tiene columnas. Por defecto:

1. Ideas
2. En producción
3. En revisión
4. Esperando al cliente
5. Listo

Las tarjetas se pueden mover entre columnas arrastrándolas.

## Qué representa una tarjeta

Una tarjeta representa un entregable o pieza de trabajo concreta.

Ejemplos:

- Reel campaña octubre
- Carrusel promoción
- Copy publicación
- Video institucional
- Placa para stories

## Dentro de una tarjeta

Una tarjeta puede tener:

- Título
- Campaña / proyecto
- Responsable
- Fecha de vencimiento
- Tipo de entregable
- Estado de aprobación
- Etiquetas
- Descripción / brief
- Checklist
- Adjuntos

### Campaña / proyecto

Sirve para agrupar entregables que pertenecen al mismo trabajo.

Ejemplo:

**Cliente:** Aisushi

**Campaña:** Día de la Madre 2026

**Tarjetas:**
- Concepto creativo
- Reel 1
- Reel 2
- Stories
- Copy
- Placa final

Esto evita mezclar trabajos distintos del mismo cliente.

---

# 5. Estados de aprobación

En cada tarjeta se puede indicar:

- No requiere
- Pendiente
- Enviado al cliente
- Aprobado
- Con cambios

Recomendación de uso:

**En revisión → Enviado al cliente → Aprobado**

Si vuelve con cambios:

**Con cambios → En producción → Enviado al cliente**

---

# 6. Archivos

Obox admite tres formas de trabajar con archivos:

### Links

La opción recomendada para archivos pesados.

Podés pegar links de:

- Google Drive
- Figma
- Dropbox
- OneDrive
- WeTransfer
- cualquier otro servicio que genere un link accesible

### Archivos chicos

Si Firebase Storage no está activado, Obox permite guardar archivos chicos directamente y comprime automáticamente algunas imágenes.

### Firebase Storage

Si se activa Storage, la versión actual permite subir archivos de hasta 25 MB desde una tarjeta.

Para videos, PSD, archivos de edición o materiales grandes, la recomendación es mantenerlos en Drive/Figma/Dropbox y guardar el link en Obox. Así Obox sigue siendo gratis y liviana.

---

# 7. Campañas y proyectos

La sección **Equipo** incluye ahora **Campañas y proyectos**.

Desde ahí se puede:

- crear una campaña
- elegir el cliente
- definir una fecha de cierre opcional
- cerrar/reactivar una campaña
- ver cuántos entregables tiene
- ver cuántos están pendientes

La campaña aparece luego dentro de las tarjetas del cliente correspondiente.

---

# 8. Equipo y permisos

Obox tiene tres roles principales:

## Dueño

Es la cuenta principal.

Puede:

- administrar todo
- aprobar personas
- crear administradores
- asignar clientes
- definir secciones
- editar/eliminar información
- administrar campañas
- hacer backups

## Admin

Puede administrar el equipo y la operación, pero no reemplaza al dueño para las acciones reservadas exclusivamente al propietario.

## Miembro

Puede trabajar sobre los clientes que tenga asignados.

Puede crear y editar tareas, tableros, tarjetas y contenido operativo de esos clientes.

## Solo lectura

Puede consultar la información que tenga asignada, pero no modificarla.

---

# 9. Cómo entra una persona nueva

1. Le pasás el link de Obox.
2. Entra con Google.
3. Obox registra una solicitud de acceso.
4. El administrador entra en **Equipo → Solicitudes**.
5. Presiona **Aprobar**.
6. Define:
   - rol
   - clientes
   - secciones
7. Guarda.
8. La persona puede recargar y trabajar con los permisos asignados.

Una persona no debería compartir una misma cuenta de Google con otra. Cada integrante debe tener su propia cuenta.

---

# 10. Cómo crear un cliente

Ir a:

**Equipo → Clientes → Agregar cliente**

Elegí un color para identificarlo visualmente.

Luego podés crearle un tablero desde **Tableros**.

---

# 11. Cómo crear una campaña

Ir a:

**Equipo → Campañas y proyectos**

Completar:

- nombre
- cliente
- fecha de cierre opcional

Después, al crear una tarjeta, seleccioná esa campaña en **Campaña / proyecto**.

---

# 12. Flujo recomendado de trabajo de la agencia

## Paso 1 — Entrada del pedido

Crear una tarea o tarjeta con el pedido concreto.

## Paso 2 — Definir responsable

Asignar a una persona.

## Paso 3 — Definir fecha

Agregar vencimiento.

## Paso 4 — Asociar campaña

Si forma parte de una campaña, elegirla.

## Paso 5 — Producción

Mover la tarjeta a **En producción**.

## Paso 6 — Revisión interna

Mover a **En revisión**.

## Paso 7 — Cliente

Mover a **Esperando al cliente** y poner aprobación **Enviado al cliente**.

## Paso 8 — Cambios

Si pide modificaciones, volver a producción y usar **Con cambios**.

## Paso 9 — Cierre

Cuando esté aprobado y terminado, mover a **Listo** y marcar aprobación **Aprobado**.

---

# 13. Daily

El Daily es personal.

Cada integrante tiene:

- Qué hice ayer
- Qué voy a hacer hoy
- Qué me está frenando
- Energía

La información del Daily no se comparte con todo el equipo.

Recomendación: usarlo a primera hora y actualizarlo cuando aparezca un bloqueo importante.

---

# 14. Semana y Retro

La sección Semana sirve para:

- definir una meta semanal
- medir el avance
- hacer una retro al final de la semana

La retro tiene tres preguntas:

- Qué salió bien
- Qué se trabó
- Qué cambio para la próxima

---

# 15. Backup

En **Equipo → Copia de seguridad** podés:

### Descargar copia

Genera un archivo JSON con:

- clientes
- campañas
- tareas
- tableros
- tarjetas
- Daily
- Semana

### Importar copia

Permite recuperar una copia o traer información de una versión anterior.

Los archivos adjuntos no se incluyen físicamente dentro del backup. Se conserva la referencia al adjunto, pero los archivos reales deben respaldarse también en el servicio donde estén almacenados.

**Recomendación:** hacer una copia semanal y antes de cambios importantes.

---

# 16. Publicar Obox gratis

La arquitectura recomendada es:

**Cloudflare Pages → web**

**Firebase → login + base de datos + permisos**

No necesitás un servidor propio.

## Paso 1 — Crear Firebase

Entrar a:

https://console.firebase.google.com/

Crear un proyecto.

No hace falta activar Google Analytics para Obox.

## Paso 2 — Authentication

Firebase → Authentication → comenzar.

Activar Google como proveedor.

## Paso 3 — Firestore

Firebase → Firestore Database → crear base de datos.

Elegir modo producción.

## Paso 4 — Reglas

Abrir `firestore.rules`.

Reemplazar:

`TU_EMAIL@gmail.com`

por el Gmail que va a ser dueño de Obox.

Publicar las reglas.

## Paso 5 — Registrar la web

Firebase → Configuración del proyecto → Tus apps → Web (`</>`).

Registrar Obox.

Copiar el objeto `firebaseConfig` a `firebase-config.js`.

No publicar nunca una contraseña o clave privada en ese archivo. La configuración web de Firebase puede ser visible; la protección real está en Authentication y Security Rules.

## Paso 6 — Crear el repositorio

Crear un repositorio privado en GitHub y subir el contenido de esta carpeta.

No subir información sensible ni archivos de configuración que contengan secretos privados.

## Paso 7 — Cloudflare Pages

En Cloudflare:

Workers & Pages → Create application → Pages → conectar GitHub.

Seleccionar el repositorio de Obox.

Si es una web estática sin build:

- Branch: `main`
- Build command: `exit 0`
- Output directory: la carpeta donde está `index.html` (en este proyecto, la raíz)

Publicar.

Cloudflare dará una dirección `*.pages.dev`.

## Paso 8 — Autorizar el dominio

Volver a Firebase:

Authentication → configuración → dominios autorizados.

Agregar el dominio de Cloudflare sin `https://`.

Ejemplo:

`obox.pages.dev`

Si después conectás un dominio propio, también se agrega ahí.

## Paso 9 — Primera prueba

Entrar con la cuenta del dueño.

Verificar:

- login
- clientes
- tareas
- tablero
- campañas
- tarjetas
- archivos
- backup

## Paso 10 — Probar permisos

Antes de invitar al equipo:

1. usar una segunda cuenta de Google
2. solicitar acceso
3. aprobarla
4. asignarle un único cliente
5. verificar que pueda trabajar con ese cliente
6. verificar que no pueda acceder a otro cliente
7. probar una cuenta solo lectura

---

# 17. Firebase: qué hace cada cosa

### Authentication

Sabe quién está entrando.

### Firestore

Guarda la información de Obox:

- clientes
- tareas
- campañas
- tableros
- tarjetas
- miembros
- solicitudes

### Storage

Puede guardar archivos grandes, si se activa.

### Security Rules

Determinan qué puede leer o modificar cada usuario.

Esto es fundamental: ocultar un botón en la web NO es seguridad. Las reglas de Firebase son las que realmente protegen los datos.

---

# 18. Qué NO tocar si no sabés programar

No modificar sin necesidad:

- `firestore.rules`
- `storage.rules`
- la estructura de Firebase
- IDs de clientes existentes
- IDs de tarjetas existentes

Sí podés modificar de forma segura:

- nombres de clientes
- colores
- campañas
- tareas
- tarjetas
- responsables
- fechas
- descripciones
- etiquetas

---

# 19. Cómo actualizar la web en el futuro

Si la web está conectada a GitHub + Cloudflare Pages:

1. modificar el código
2. probarlo localmente
3. guardar el cambio en Git
4. hacer push a `main`
5. Cloudflare genera una nueva versión automáticamente

Antes de cambios importantes:

1. descargar backup desde Obox
2. modificar
3. probar
4. publicar
5. comprobar login y permisos

---

# 20. Errores frecuentes

### “Dominio no autorizado”

El dominio de la web no está agregado en Firebase Authentication.

### “Esperando acceso”

La cuenta todavía no fue aprobada o las reglas no reconocen correctamente al dueño.

### Un usuario ve vacío

Revisar que tenga clientes asignados y que haya recargado la web.

### Un usuario ve un cliente que no debería

No continuar usando la web hasta revisar `firestore.rules` y los permisos del miembro.

### No se sube un archivo

Comprobar tamaño y si Storage está activado.

### Cambié código y no aparece

Esperar el nuevo deploy de Cloudflare y hacer una recarga fuerte del navegador.

---

# 21. Regla de oro de Obox

**Una tarjeta = un entregable concreto.**

**Una campaña = un conjunto de entregables relacionados.**

**Un cliente = el nivel de permisos y organización principal.**

Si se mantiene esa lógica, Obox escala mucho mejor a medida que crece la agencia.


---

# 22. Daily obligatorio, Daily del equipo y avisos al celular

## Daily obligatorio

No hay nada que configurar. Cada día, al abrir Obox, la portada pide el Daily de hoy.
El botón **Ir a mis tareas** queda bloqueado hasta completar **qué hice ayer** y **qué voy a hacer hoy**.
"¿Qué me está frenando?" y la energía son opcionales.
Si la app queda abierta de un día para el otro, al empezar el día nuevo vuelve a la portada y pide el Daily otra vez.

## Daily del equipo (solo administradores)

En **Equipo** hay dos pestañas: **Equipo y accesos** y **Daily del equipo**.
En la segunda, el administrador ve quién ya completó el Daily de hoy y quién falta, lee lo que escribió cada persona, navega día por día y abre los días anteriores.
Las personas que marcaron algo que las frena aparecen primero.

Para que funcione hay que publicar las reglas nuevas de `firestore.rules` (mismo procedimiento que en el punto 16, paso 4).
Un administrador solo puede LEER los Daily de otros, nunca editarlos.

## Asignar a más de una persona

En una tarea o tarjeta, **Asignar a** muestra botones con las personas del equipo: tocás todas las que quieras. Cada persona nueva que sumás recibe su aviso; a quien quitás no se le avisa. "Solo mis tareas" muestra todo lo que tengas asignado, aunque lo compartas con otros. En las tarjetas del tablero se ven las caritas de los asignados.

## Subir más de un archivo

En **Adjuntos** el botón **Subir archivos** deja elegir varios a la vez (o arrastrarlos). Si alguno no se puede subir, el aviso te dice cuáles quedaron afuera.
Sin Firebase Storage, cada archivo puede pesar hasta unos **650 KB** (se guarda dentro de la base de datos). Para algo más pesado, pegá un link de Drive. Si algún día activás Storage, ese límite sube.

## Avisos al celular (gratis)

Cuando alguien asigna una tarea o tarjeta a otra persona (o la reasigna), a esa persona le llega una notificación al celular, por ejemplo:

> Joaquín te asignó la tarjeta «Cartel» · Cliente: Dimarco · Contenido de octubre · En revisión

Si la persona tiene Obox abierto, además ve el aviso adentro, aunque no haya activado el celular. Solo se avisa cuando se suma una persona nueva; editar o mover la tarjeta, o asignarte algo a vos mismo, no avisa.

### Cómo funciona sin pagar

Las notificaciones push (FCM) de Google son gratis. Lo que Firebase cobra (plan Blaze) es **Cloud Functions**, el lugar donde normalmente corre el código que las envía. Por eso Obox trae el envío en `functions/api/notificar.js`, una función de **Cloudflare Pages** (el mismo servicio donde está publicada la web), que tiene plan gratuito. Firebase se queda en el plan gratis (Spark).

### Qué hay que hacer una sola vez (lo hace el dueño)

**1. Clave de avisos (VAPID)**
Firebase → ⚙ Configuración del proyecto → **Cloud Messaging** → **Certificados push web** → **Generar par de claves**. Pegá la clave en `firebase-config.js`, en lugar de `PEGA_AQUI` en `window.FCM_VAPID_KEY`.

**2. Clave de servicio (el "permiso" para enviar)**
Firebase → ⚙ Configuración del proyecto → **Cuentas de servicio** → **Generar nueva clave privada**. Se descarga un archivo `.json`.
**Es una contraseña: no la subas a GitHub ni la compartas.**

**3. Guardarla en Cloudflare**
Cloudflare → Workers y Pages → tu proyecto de Obox → **Settings → Variables and Secrets → Add** → tipo **Secret**, nombre exacto `FIREBASE_SERVICE_ACCOUNT`, valor: pegá TODO el contenido del `.json`. Guardá y volvé a desplegar (Deployments → Retry deployment, o subí cualquier cambio).

**4. Subir los archivos y las reglas**
Subí la carpeta completa a GitHub como siempre, **incluida `functions/`** (Cloudflare la detecta sola). Publicá `firestore.rules` en Firebase (punto 16, paso 4). `firebase-config.js` debe tener `window.PUSH_MODE = "cloudflare"`.
La carpeta `extras/firebase-functions` es una alternativa de pago (Blaze); no hace falta usarla.

### Qué hace cada persona en su celular

**iPhone** (iOS 16.4 o más nuevo): abrir la web en Safari → Compartir → **Agregar a pantalla de inicio**, abrir Obox desde ese ícono, tocar la campana y aceptar. Sin instalarla así, en iPhone no llegan.
**Android:** abrir en Chrome, tocar la campana y aceptar (y mejor instalarla desde ⋮ → Instalar app).
Cada celular se activa por separado.

### Cómo probar

1. Dos cuentas, cada una en su celular, con la campana activa.
2. Con una, asignale una tarjeta a la otra: tiene que llegar en pocos segundos, con la app cerrada.
3. Pasá la tarjeta a "En revisión" y reasignala a la primera: el aviso llega en sentido contrario.

### Si no llega

- La campana debe estar activa en ese celular y el navegador con permisos.
- `FCM_VAPID_KEY` no puede decir `PEGA_AQUI`.
- Cloudflare → tu proyecto → **Functions → Real-time logs**: ahí se ve si `/api/notificar` da error (típico: secreto mal pegado o sin volver a desplegar).
- Solo se avisa a quien tiene acceso al cliente de esa tarea o tarjeta.

### Qué está probado y qué no

Probado en pruebas automáticas con servicios simulados: la lógica de quién recibe el aviso, los controles de seguridad, el borrado de celulares viejos y la interfaz de asignación múltiple.
**No probado con servicios reales** (Cloudflare, FCM, tu Firebase): hay que hacer la prueba de arriba. Dos datos a confirmar en tu cuenta: que el plan gratuito de Cloudflare Functions alcance para firmar y enviar cada aviso (debería, es poco trabajo), y si subir archivos grandes con Firebase Storage exige Blaze en proyectos nuevos.

---

# 23. Mi perfil, eventos del calendario, recordatorios e informes con IA

**Archivos nuevos que hay que subir:** `app-v8.js`, `functions/api/informe.js`, y la carpeta `extras/recordatorios`. Además, **publicá de nuevo `firestore.rules`** (punto 16, paso 4): trae reglas nuevas para eventos y perfil. Sin eso, los eventos y el perfil no se guardan.

## Mi perfil (todos)

Tocá tu nombre arriba a la derecha. Podés cambiar **cómo te llaman** (el nombre que ve el equipo), y tu cara: **tu foto de Google**, **una foto que subas** (se recorta y achica sola) o **una carita** con el color que quieras. Vale para cada persona y no cambia nada de tu cuenta de Google.

## Eventos del calendario (reuniones, recordatorios, lo que no es una tarea)

En el Calendario tocá un día → **Agregar evento**. Los eventos **no aparecen en Tareas ni en el tablero**, solo en el calendario.
- **¿Quién lo ve?** *Solo yo* (nadie más lo ve, ni los administradores), *Todo el equipo* o *Elegir personas*.
- **Horario:** desde / hasta (opcional). Sin hora es "todo el día".
- **Avisarme:** 1 día antes, 1 hora antes y/o 30 minutos antes. Hace falta poner una hora.
- Solo quien lo creó lo puede editar (un administrador puede borrar los de "todo el equipo").

## Recordatorios al celular (gratis): paso a paso

Un recordatorio tiene que dispararse aunque nadie tenga Obox abierto, y las funciones de Cloudflare Pages no pueden correr solas cada minuto. Por eso se usa un **Worker** aparte con "Cron" (también gratis en Cloudflare). Se hace una sola vez:

1. Cloudflare → **Workers y Pages → Crear → Worker** → ponele de nombre `obox-recordatorios` → **Implementar**.
2. **Editar código**: borrá todo y pegá el contenido completo de `extras/recordatorios/worker.js` → **Implementar**.
3. **Configuración → Variables y secretos**: agregá el secreto `FIREBASE_SERVICE_ACCOUNT` (el mismo `.json` del punto 22) y una variable `APP_URL` con la dirección de tu web (por ejemplo `https://obox.pages.dev`, sin barra al final).
4. **Configuración → Disparadores → Cron** → agregá `* * * * *` (cada minuto).
5. Probar: abrí la dirección del Worker en el navegador. Si todo está bien responde algo como `{"ok":true,"revisados":0,"enviados":0}`.

Cada persona tiene que tener la **campana activada** en su celular (punto 22). Si la campana no está activa, el recordatorio aparece adentro de Obox mientras la tengas abierta.

## Informes mensuales con IA (solo administradores)

**Equipo → Informes.** Elegís el mes y ves, por persona: tareas hechas, cuántas a tiempo, atrasadas, tarjetas listas y días de Daily. Esos números y un resumen automático **se calculan en la propia web, sin costo y sin IA**.

El botón **Generar análisis con IA** redacta un informe (resumen, lo bueno, puntos de atención, sugerencias) con esos números y con lo que la persona escribió en su Daily. También hay un **resumen general del equipo**. Para activarlo elegí UNO:

- **Con Claude (de pago, centavos por informe):** en Cloudflare → tu proyecto de Obox → Configuración → Variables y secretos → secreto `ANTHROPIC_API_KEY` con tu clave de la consola de Anthropic. Opcional: variable `ANTHROPIC_MODEL`.
- **Con Cloudflare Workers AI (tiene cuota diaria gratis):** en tu proyecto → Configuración → **Bindings → Agregar → Workers AI**, con el nombre `AI`. Opcional: variable `AI_MODEL` para elegir otro modelo.

Volvé a desplegar después de agregar cualquiera de los dos.

**Privacidad:** para escribir el análisis, los números y los textos de Daily del mes se envían al proveedor de IA que elijas. Avisale al equipo. Si no querés eso, no actives la IA: los números y el resumen automático funcionan igual.

## Qué está probado y qué no

Probado con servicios simulados: perfil (nombre, carita, foto), eventos privados/compartidos, que un evento no aparezca como tarea, la lógica de los recordatorios (a quién, cuándo, sin repetir, sin avisar cosas viejas), los controles de seguridad del informe (solo administradores) y los cálculos del informe.
**No probado con servicios reales:** Cloudflare Cron, FCM, Claude y Workers AI, ni las reglas nuevas de Firestore (no hay simulador acá). Confirmá en tu cuenta: que el plan gratis de Cloudflare te deje agregar el Cron, que el modelo por defecto de Workers AI siga disponible (si no, poné otro en `AI_MODEL`) y que las reglas se publiquen sin errores.
