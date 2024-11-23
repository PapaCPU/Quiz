// script.js

let alleFragen = [];
let nochNichtBeantworteteFragen = [];
let aktuelleBlockFragen = [];
let aktuelleFrageIndex = 0;
let richtigBeantworteteFragen = [];
let falschBeantworteteFragen = [];
let timer;
let zeitUebrig = 30;
let aktuelleFrageNummer = 1;
const blockGroesse = 10;

// Elemente aus dem DOM
const startmenue = document.getElementById('startmenue');
const fragenHochladenButton = document.getElementById('fragen-hochladen-button');
const dateiInput = document.getElementById('datei-input');
const quizStartenButton = document.getElementById('quiz-starten-button');
const weiterspielenButton = document.getElementById('weiterspielen-button');
const quizContainer = document.getElementById('quiz-container');
const weiterButton = document.getElementById('weiter-button');
const speichernButton = document.getElementById('speichern-button');
const frageText = document.getElementById('frage-text');
const optionenContainer = document.getElementById('optionen-container');
const aktuelleFrageNummerElement = document.getElementById('aktuelle-frage-nummer');
const gesamtFragenElement = document.getElementById('gesamt-fragen');
const zeitElement = document.getElementById('zeit');
const quizEndeModal = document.getElementById('quiz-ende-modal');
const schliessenButton = document.getElementById('schliessen-button');
const neuStartenButton = document.getElementById('neu-starten-button');

// Überprüfen, ob ein gespeicherter Spielstand vorhanden ist
if (localStorage.getItem('quizFortschritt')) {
  weiterspielenButton.disabled = false;
}

// Event Listener für "Fragen hochladen"
fragenHochladenButton.addEventListener('click', () => {
  dateiInput.click();
});

// Event Listener für Datei-Upload
dateiInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file && file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      alleFragen = parseFragen(text);
      if (alleFragen.length > 0) {
        nochNichtBeantworteteFragen = mischeFragen([...alleFragen]);
        quizStartenButton.disabled = false;
        alert('Fragen erfolgreich hochgeladen!');
      } else {
        alert('Die hochgeladene Datei enthält keine gültigen Fragen.');
      }
    };
    reader.readAsText(file);
  } else {
    alert('Bitte wähle eine gültige .txt-Datei aus.');
  }
});

// Event Listener für "Quiz starten"
quizStartenButton.addEventListener('click', () => {
  startmenue.style.display = 'none';
  quizContainer.style.display = 'block';
  initialisiereQuiz();
});

// Event Listener für "Weiterspielen"
weiterspielenButton.addEventListener('click', () => {
  startmenue.style.display = 'none';
  quizContainer.style.display = 'block';
  initialisiereQuiz(true);
});

// Funktion zum Parsen der Textdatei in ein Array von Fragen
function parseFragen(text) {
  const fragenArray = [];
  const fragenTexte = text.split('---').filter(f => f.trim().length > 0);

  fragenTexte.forEach(fragenText => {
    const zeilen = fragenText.trim().split('\n').filter(l => l.trim().length > 0);
    if (zeilen.length >= 5) {
      const frageObj = {
        frage: '',
        optionen: [],
        antwort: 0
      };

      zeilen.forEach((zeile, index) => {
        if (index === 0) {
          frageObj.frage = zeile.replace(/\*\*/g, '').trim();
        } else if (index <= 3) {
          frageObj.optionen.push(zeile.trim());
        } else {
          frageObj.antwort = parseInt(zeile.replace(/\*\*/g, '').trim());
        }
      });

      if (frageObj.frage && frageObj.optionen.length === 3 && frageObj.antwort >= 1 && frageObj.antwort <= 3) {
        fragenArray.push(frageObj);
      }
    }
  });

  return fragenArray;
}

// Funktion zum Initialisieren des Quiz
function initialisiereQuiz(fortsetzen = false) {
  if (fortsetzen) {
    // Gespeicherten Fortschritt laden
    const gespeicherterFortschritt = JSON.parse(localStorage.getItem('quizFortschritt'));
    if (gespeicherterFortschritt) {
      alleFragen = gespeicherterFortschritt.alleFragen;
      nochNichtBeantworteteFragen = gespeicherterFortschritt.nochNichtBeantworteteFragen;
      aktuelleBlockFragen = gespeicherterFortschritt.aktuelleBlockFragen;
      richtigBeantworteteFragen = gespeicherterFortschritt.richtigBeantworteteFragen;
      falschBeantworteteFragen = gespeicherterFortschritt.falschBeantworteteFragen;
      aktuelleFrageIndex = gespeicherterFortschritt.aktuelleFrageIndex;
      aktuelleFrageNummer = gespeicherterFortschritt.aktuelleFrageNummer;
    } else {
      alert('Kein gespeicherter Spielstand gefunden.');
      location.reload();
    }
  } else {
    starteNeuenBlock();
  }

  gesamtFragenElement.textContent = aktuelleBlockFragen.length;
  zeigeFrage();
  starteTimer();
}

// Funktion zum Starten eines neuen Blocks
function starteNeuenBlock() {
  // Kombiniere falsch beantwortete Fragen mit neuen Fragen, um einen Block von bis zu 10 Fragen zu bilden
  aktuelleBlockFragen = falschBeantworteteFragen.concat(nochNichtBeantworteteFragen.splice(0, blockGroesse - falschBeantworteteFragen.length));
  falschBeantworteteFragen = [];
  aktuelleFrageIndex = 0;
  aktuelleFrageNummer = 1;
}

// Funktion zum Mischen der Fragen
function mischeFragen(fragenArray) {
  return fragenArray.sort(() => Math.random() - 0.5);
}

// Funktion zum Anzeigen der aktuellen Frage
function zeigeFrage() {
  const frageObj = aktuelleBlockFragen[aktuelleFrageIndex];
  frageText.textContent = frageObj.frage;
  optionenContainer.innerHTML = '';
  frageObj.optionen.forEach((option, index) => {
    const button = document.createElement('button');
    button.textContent = option;
    button.classList.add('option-button');
    button.onclick = () => {
      waehleOption(index + 1, button);
    };
    optionenContainer.appendChild(button);
  });

  aktuelleFrageNummerElement.textContent = aktuelleFrageNummer;
  weiterButton.disabled = true;
}

// Funktion zur Verarbeitung der ausgewählten Option
function waehleOption(auswahl, button) {
  const frageObj = aktuelleBlockFragen[aktuelleFrageIndex];
  const buttons = document.querySelectorAll('.option-button');
  buttons.forEach(btn => {
    btn.disabled = true;
  });

  if (auswahl === frageObj.antwort) {
    richtigBeantworteteFragen.push(frageObj);
    // Entferne die Frage aus nochNichtBeantworteteFragen, falls vorhanden
    const index = nochNichtBeantworteteFragen.findIndex(f => f.frage === frageObj.frage);
    if (index !== -1) {
      nochNichtBeantworteteFragen.splice(index, 1);
    }
    button.classList.add('correct');
  } else {
    falschBeantworteteFragen.push(frageObj);
    button.classList.add('incorrect');
    // Zeige die korrekte Antwort an
    buttons[frageObj.antwort - 1].classList.add('correct');
  }

  weiterButton.disabled = false;
}

// Funktion zum Starten des Timers
function starteTimer() {
  zeitUebrig = 30;
  zeitElement.textContent = zeitUebrig;
  timer = setInterval(() => {
    zeitUebrig--;
    zeitElement.textContent = zeitUebrig;
    if (zeitUebrig <= 0) {
      clearInterval(timer);
      // Zeit abgelaufen, zur nächsten Frage
      zurNaechstenFrage();
    }
  }, 1000);
}

// Funktion zum Anhalten des Timers
function stoppeTimer() {
  clearInterval(timer);
}

// Funktion zum Weitergehen zur nächsten Frage oder Block
function zurNaechstenFrage() {
  stoppeTimer();
  aktuelleFrageIndex++;
  aktuelleFrageNummer++;
  if (aktuelleFrageIndex < aktuelleBlockFragen.length) {
    zeigeFrage();
    starteTimer();
  } else {
    // Nach dem Block prüfen, ob es falsch beantwortete Fragen oder noch unbeantwortete Fragen gibt
    if (falschBeantworteteFragen.length > 0 || nochNichtBeantworteteFragen.length > 0) {
      starteNeuenBlock();
      if (aktuelleBlockFragen.length > 0) {
        gesamtFragenElement.textContent = aktuelleBlockFragen.length;
        zeigeFrage();
        starteTimer();
      } else {
        quizBeenden();
      }
    } else {
      quizBeenden();
    }
  }
}

// Funktion zum Beenden des Quiz
function quizBeenden() {
  // Zeige das Modal-Fenster an
  quizEndeModal.style.display = 'block';
  localStorage.removeItem('quizFortschritt');
}

// Event Listener für den Weiter-Button
weiterButton.addEventListener('click', () => {
  zurNaechstenFrage();
});

// Event Listener für den Speichern & Beenden-Button
speichernButton.addEventListener('click', () => {
  speichereFortschritt();
  alert('Dein Fortschritt wurde gespeichert. Du kannst später weitermachen.');
});

// Event Listener für das Schließen des Modals
schliessenButton.addEventListener('click', () => {
  quizEndeModal.style.display = 'none';
  location.reload();
});

// Event Listener für den "Neu starten"-Button
neuStartenButton.addEventListener('click', () => {
  quizEndeModal.style.display = 'none';
  location.reload();
});

// Funktion zum Speichern des Fortschritts
function speichereFortschritt() {
  const fortschritt = {
    alleFragen,
    nochNichtBeantworteteFragen,
    aktuelleBlockFragen,
    richtigBeantworteteFragen,
    falschBeantworteteFragen,
    aktuelleFrageIndex,
    aktuelleFrageNummer
  };
  localStorage.setItem('quizFortschritt', JSON.stringify(fortschritt));
  stoppeTimer();
}

// Beim Laden der Seite
window.onload = () => {
  // Nichts weiter zu tun, da das Startmenü angezeigt wird
};
