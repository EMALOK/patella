# Role: Senior Frontend Developer / AI Agent

## Task
Crea una single-page application (SPA) "mock" per la gestione di un sistema di tornei di Beer Pong, chiamata "Progetto Patella". 
L'obiettivo è creare un prototipo funzionale lato client.

## Vincoli Tecnici (CRITICAL)
- **Frontend Only:** Niente backend, niente database, niente API esterne.
- **Persistenza:** Solo in-memory (useState/global state) o localStorage per la durata della sessione.
- **Inizializzazione:** Il sistema deve caricare automaticamente dati di mock (utenti, tornei, partite) all'avvio per mostrare subito le funzionalità.
- **Tech Stack:** React (Vite) con Tailwind CSS (o simili), usando TypeScript se possibile.

## Struttura Dati Gerarchica (Implementazione Obbligatoria)
Devi implementare rigorosamente la seguente gerarchia di modelli. Il sistema deve gestire le relazioni tra questi oggetti:

1. **Torneo:** Entità principale (Nome, Luogo, Data, Stato: OPEN/IN_PROGRESS/COMPLETED).
2. **Slot/Tabellone:** La struttura che organizza i partecipanti. Deve supportare l'eliminazione diretta.
3. **Partita:** Contenuta nello Slot. Gestisce due utenti (Giocatore A vs Giocatore B).
4. **Shot (Referto):** La parte più complessa. È una lista di eventi che descrivono la partita. Per ogni tiro (Shot) devi salvare:
   - Giocatore che ha tirato.
   - Livello alcolemico attuale (calcolato o mockato).
   - Risultato (Colpito/Mancato + ID bicchiere colpito).
   - Stato della partita prima del tiro.

## Requisiti Funzionali per l'Agente
1. **Mock Data Engine:** Crea un file di `mockData.js` con una struttura complessa che includa almeno 4 utenti e 1 torneo attivo.
2. **Workflow Organizzatore:**
   - Permetti di passare da stato `OPEN` a `IN_PROGRESS` (generando il tabellone).
   - Implementa l'interfaccia per inserire i dati di ogni partita tramite la compilazione sequenziale degli `Shot`.
3. **Logica di Gioco:**
   - Se un giocatore supera una soglia di alcol (NumDrink), deve essere segnalato/squalificato (vittoria a tavolino).
   - Aggiornamento automatico dello stato della partita in base ai tiri inseriti.
4. **UI:** - Dashboard per visualizzare i tornei.
   - View dettaglio torneo (Tabellone).
   - View Partita con form di inserimento tiri (Shot) che aggiorna il referto in tempo reale.

## Istruzioni di Output
- Inizia creando la struttura dei componenti basata sulla gerarchia (Torneo > Slot > Partita > Shot).
- Assicurati che lo stato dell'applicazione sia immutabile e gestito correttamente.
- Non implementare autenticazione reale; usa una selezione mock di utente per simulare l'organizzatore.

Inizia ora con l'architettura dei dati e i tipi TypeScript.