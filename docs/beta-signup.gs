/**
 * Ager - beta signups
 *
 * Questo script vive DENTRO il foglio "Ager - beta signups" ed e' l'unica cosa
 * che ha il permesso di scriverci. Il sito non possiede nessuna credenziale
 * Google: chiama questo indirizzo passando un segreto condiviso, e basta.
 *
 * Come installarlo (una volta sola):
 *
 *  1. Apri il foglio -> menu Estensioni -> Apps Script.
 *  2. Cancella il contenuto di Codice.gs e incolla questo file. Salva.
 *  3. Icona ingranaggio a sinistra (Impostazioni progetto) -> Proprieta' script
 *     -> Aggiungi proprieta':
 *        nome:   SHARED_SECRET
 *        valore: una stringa lunga e casuale (il comando per generarla e' nel
 *                messaggio che accompagna questo file)
 *     Salva.
 *  4. In alto a destra -> Implementa -> Nuova implementazione
 *     -> tipo: Applicazione web
 *     -> Esegui come: Io (il tuo account)
 *     -> Chi ha accesso: Chiunque
 *     -> Implementa. Autorizza quando lo chiede (comparira' un avviso
 *        "app non verificata": e' la tua, vai su Avanzate -> Vai a...).
 *  5. Copia l'URL che finisce con /exec. Quello e' BETA_SIGNUP_WEBHOOK_URL.
 *
 * "Chi ha accesso: Chiunque" non vuol dire che i dati sono pubblici: l'indirizzo
 * accetta solo richieste che portano il segreto, e in nessun caso restituisce
 * righe gia' salvate. Se il segreto trapela, basta cambiarlo al punto 3.
 */

const SHEET_NAME = 'Iscritti';

function doPost(e) {
  const secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!secret) return reply_({ error: 'not_configured' });

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply_({ error: 'bad_request' });
  }

  if (typeof body.secret !== 'string' || !constantTimeEquals_(body.secret, secret)) {
    return reply_({ error: 'forbidden' });
  }

  const values = body.values;
  if (!Array.isArray(values) || values.length === 0 || values.length > 20) {
    return reply_({ error: 'bad_request' });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return reply_({ error: 'sheet_missing' });

  // Due iscrizioni nello stesso istante non devono finire sulla stessa riga.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.appendRow(values);
  } finally {
    lock.releaseLock();
  }

  return reply_({ ok: true });
}

/** Il confronto non si ferma al primo carattere diverso. */
function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function reply_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
