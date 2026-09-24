/**
 * Privacy notice for the beta signup form.
 *
 * It describes exactly what `/api/beta-signup` does and nothing more: the email,
 * the two consents, the locale and the timestamp, written to one private
 * spreadsheet.
 *
 * This is not legal advice - it is a faithful description of the implementation,
 * meant to be reviewed by someone qualified before it goes live.
 */

/**
 * Ager has no legal entity yet, so the controller is a natural person and the
 * contact point is the project mailbox. Once an association exists, this is the
 * block to update - name, registered address and tax number.
 */
export const CONTROLLER = {
  legalName: "Simone Gandini",
  email: "ager.org@gmail.com",
};

/** How long a signup is kept. */
export const RETENTION_MONTHS = 24;

const UPDATED_AT_IT = "Ultimo aggiornamento: 24 settembre 2026";
const UPDATED_AT_EN = "Last updated: 24 September 2026";

export type PrivacySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PrivacyContent = {
  title: string;
  updatedAt: string;
  intro: string;
  sections: PrivacySection[];
  backToOnboarding: string;
};

export const betaPrivacyIt: PrivacyContent = {
  title: "Informativa privacy — beta di Ager",
  updatedAt: UPDATED_AT_IT,
  intro:
    "Questa informativa riguarda solo i dati che raccogliamo quando lasci la tua email per entrare nella beta di Ager. È scritta ai sensi degli articoli 13 e 14 del Regolamento (UE) 2016/679 (GDPR).",
  sections: [
    {
      heading: "Chi tratta i tuoi dati",
      paragraphs: [
        `Il titolare del trattamento è ${CONTROLLER.legalName}, che porta avanti il progetto Ager come persona fisica: al momento non esiste un ente giuridico dietro al progetto.`,
        `Per qualsiasi domanda o richiesta puoi scrivere a ${CONTROLLER.email}.`,
        "Non abbiamo nominato un Responsabile della protezione dei dati (DPO), perché non ricorrono i presupposti dell'articolo 37 del GDPR.",
      ],
    },
    {
      heading: "Quali dati raccogliamo",
      paragraphs: ["Quando invii il modulo di accesso alla beta registriamo soltanto:"],
      bullets: [
        "il tuo indirizzo email;",
        "se hai scelto di ricevere gli aggiornamenti sul progetto;",
        "la lingua in cui stavi usando il sito (italiano o inglese);",
        "l'etichetta del link da cui sei arrivato, quando c'è: una parola come «instagram» o «tiktok», che ci dice da quale canale proviene l'iscrizione e non dice niente su di te;",
        "la data e l'ora dell'iscrizione.",
      ],
    },
    {
      heading: "Quali dati non raccogliamo",
      paragraphs: [
        "Non registriamo il tuo indirizzo IP, il tuo browser, il tuo dispositivo né la tua posizione. Non usiamo cookie di profilazione su questa pagina. Il tuo indirizzo non compare nei log tecnici del sito.",
        "Non vendiamo, non cediamo e non scambiamo i tuoi dati con nessuno, per nessuna ragione. Non li usiamo per pubblicità.",
      ],
    },
    {
      heading: "Perché li trattiamo, e con quale base giuridica",
      bullets: [
        "Per darti accesso alla beta e tenere traccia di chi partecipa: la base giuridica è il nostro legittimo interesse a gestire una sperimentazione a inviti (art. 6.1.f GDPR).",
        "Per scriverti una volta e chiederti com'è andata con la beta: è una condizione della partecipazione, non una casella da spuntare, e la base giuridica è il nostro legittimo interesse a raccogliere un parere su una sperimentazione a inviti (art. 6.1.f GDPR). Puoi opporti in qualsiasi momento, anche solo rispondendo a quella email (art. 21 GDPR).",
        "Per mandarti ogni tanto aggiornamenti sul progetto, se hai spuntato la casella: qui la base giuridica è il tuo consenso (art. 6.1.a GDPR).",
      ],
      paragraphs: [
        "La casella degli aggiornamenti è facoltativa: puoi entrare nella beta senza spuntarla, e se la spunti puoi ritirare il consenso quando vuoi, senza che questo tocchi la liceità di quello che abbiamo fatto prima. La richiesta di parere sulla beta, invece, è parte del patto: se non vuoi riceverla scrivicelo e non ti contatteremo.",
      ],
    },
    {
      heading: "Dove finiscono",
      paragraphs: [
        "I dati vengono scritti in un unico foglio di calcolo privato ospitato su Google Sheets, accessibile solo al titolare tramite il proprio account protetto. Il sito può soltanto aggiungere una riga a quel foglio: non esiste nessuna pagina o funzione pubblica che possa rileggere gli iscritti.",
        "Il fornitore del servizio è Google Ireland Limited, che agisce come responsabile del trattamento. Eventuali trasferimenti di dati fuori dallo Spazio economico europeo avvengono sulla base delle clausole contrattuali standard approvate dalla Commissione europea.",
        "Non ci appoggiamo a nessun altro fornitore. Per difendere il modulo dagli invii automatici usiamo solo controlli che girano sul nostro server e non raccolgono nulla su di te.",
      ],
    },
    {
      heading: "Per quanto tempo li teniamo",
      paragraphs: [
        `Conserviamo l'iscrizione finché la beta resta attiva e comunque non oltre ${RETENTION_MONTHS} mesi dalla raccolta. Se ritiri il consenso o chiedi la cancellazione, rimuoviamo il tuo indirizzo prima di quel termine.`,
      ],
    },
    {
      heading: "I tuoi diritti",
      paragraphs: [
        "Puoi chiederci in qualsiasi momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento, opporti al trattamento fondato sul legittimo interesse, o riceverli in un formato leggibile da una macchina (articoli 15-22 del GDPR).",
        `Per esercitare uno di questi diritti basta una email a ${CONTROLLER.email}: ti rispondiamo entro un mese.`,
        "Se ritieni che il trattamento violi il GDPR puoi presentare reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it) o all'autorità di controllo del Paese in cui vivi.",
      ],
    },
    {
      heading: "Se cambia qualcosa",
      paragraphs: [
        "Se modificheremo il modo in cui trattiamo questi dati aggiorneremo questa pagina e, quando la modifica è rilevante, avviseremo chi si è iscritto.",
      ],
    },
  ],
  backToOnboarding: "Torna alla beta",
};

export const betaPrivacyEn: PrivacyContent = {
  title: "Privacy notice — Ager beta",
  updatedAt: UPDATED_AT_EN,
  intro:
    "This notice covers only the data we collect when you leave your email to join the Ager beta. It is written under Articles 13 and 14 of Regulation (EU) 2016/679 (GDPR).",
  sections: [
    {
      heading: "Who processes your data",
      paragraphs: [
        `The data controller is ${CONTROLLER.legalName}, who runs the Ager project as a natural person: there is no legal entity behind the project at this time.`,
        `For any question or request you can write to ${CONTROLLER.email}.`,
        "We have not appointed a Data Protection Officer, as the conditions in Article 37 GDPR do not apply.",
      ],
    },
    {
      heading: "What we collect",
      paragraphs: ["When you submit the beta form we record only:"],
      bullets: [
        "your email address;",
        "whether you chose to receive updates about the project;",
        "the language you were using the site in (Italian or English);",
        "the label of the link you arrived from, when there is one: a word such as \"instagram\" or \"tiktok\", which tells us which channel the signup came from and nothing about you;",
        "the date and time of the signup.",
      ],
    },
    {
      heading: "What we do not collect",
      paragraphs: [
        "We do not record your IP address, browser, device or location. We use no profiling cookies on this page. Your address never appears in the site's technical logs.",
        "We do not sell, share or trade your data with anyone, for any reason. We do not use it for advertising.",
      ],
    },
    {
      heading: "Why we process it, and on what legal basis",
      bullets: [
        "To give you access to the beta and keep track of who is taking part: our legitimate interest in running an invite-only trial (Art. 6(1)(f) GDPR).",
        "To write to you once and ask how the beta went: this is a condition of taking part, not a box to tick, and the legal basis is our legitimate interest in collecting feedback on an invite-only trial (Art. 6(1)(f) GDPR). You can object at any time, including by simply replying to that email (Art. 21 GDPR).",
        "To send you occasional updates about the project, if you ticked the box: here the legal basis is your consent (Art. 6(1)(a) GDPR).",
      ],
      paragraphs: [
        "The updates box is optional: you can join the beta without ticking it, and if you do tick it you can withdraw your consent at any time, without affecting the lawfulness of processing before it. The feedback request, on the other hand, is part of the deal: if you would rather not get it, tell us and we will not write.",
      ],
    },
    {
      heading: "Where it goes",
      paragraphs: [
        "The data is written to a single private spreadsheet hosted on Google Sheets, reachable only by the controller through their own protected account. The website can only append a row to that sheet: no public page or function can read the signups back.",
        "The provider is Google Ireland Limited, acting as data processor. Any transfer outside the European Economic Area relies on the standard contractual clauses approved by the European Commission.",
        "We rely on no other provider. To protect the form from automated submissions we only use checks that run on our own server and collect nothing about you.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        `We keep the signup for as long as the beta runs, and in any case no longer than ${RETENTION_MONTHS} months from collection. If you withdraw consent or ask for erasure, we remove your address before that.`,
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "At any time you can ask us to access your data, correct it, erase it, restrict its processing, object to processing based on legitimate interest, or receive it in a machine-readable format (Articles 15-22 GDPR).",
        `To exercise any of these rights, an email to ${CONTROLLER.email} is enough: we answer within one month.`,
        "If you believe the processing breaches the GDPR you can lodge a complaint with the Italian Data Protection Authority (www.garanteprivacy.it) or with the supervisory authority of the country you live in.",
      ],
    },
    {
      heading: "If something changes",
      paragraphs: [
        "If we change how we process this data we will update this page and, where the change is significant, tell the people who signed up.",
      ],
    },
  ],
  backToOnboarding: "Back to the beta",
};

export function betaPrivacyContent(locale: string): PrivacyContent {
  return locale === "en" ? betaPrivacyEn : betaPrivacyIt;
}
