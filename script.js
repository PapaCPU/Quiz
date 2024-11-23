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
let aktuelleDatei = null;

// Elemente aus dem DOM
const startmenue = document.getElementById('startmenue');
const textEingebenButton = document.getElementById('text-eingeben-button');
const dateiHochladenButton = document.getElementById('datei-hochladen-button');
const dateiInput = document.getElementById('datei-input');
const textEingabe = document.getElementById('text-eingabe');
const textSendenButton = document.getElementById('text-senden-button');
const quizContainer = document.getElementById('quiz-container');
const weiterButton = document.getElementById('weiter-button');
const speichernButton = document.getElementById('speichern-button');
const hauptmenueButton = document.getElementById('hauptmenue-button');
const frageText = document.getElementById('frage-text');
const optionenContainer = document.getElementById('optionen-container');
const aktuelleFrageNummerElement = document.getElementById('aktuelle-frage-nummer');
const gesamtFragenElement = document.getElementById('gesamt-fragen');
const zeitElement = document.getElementById('zeit');
const quizEndeModal = document.getElementById('quiz-ende-modal');
const schliessenButton = document.getElementById('schliessen-button');
const neuStartenButton = document.getElementById('neu-starten-button');
const dateiListeContainer = document.getElementById('datei-liste-container');
const speicherplatzAnzeige = document.getElementById('speicherplatz-anzeige');
const bestaetigungModal = document.getElementById('bestaetigung-modal');
const jaButton = document.getElementById('ja-button');
const neinButton = document.getElementById('nein-button');
const fortschrittsbalken = document.getElementById('fortschrittsbalken');

// Event Listener für "Text eingeben"
textEingebenButton.addEventListener('click', () => {
  textEingabe.style.display = 'block';
  textSendenButton.style.display = 'block';
  dateiInput.style.display = 'none';
});

// Event Listener für "Text senden"
textSendenButton.addEventListener('click', () => {
  const text = textEingabe.value.trim();
  if (text) {
    textAnServerSenden(text);
  } else {
    alert('Bitte geben Sie einen Text ein.');
  }
});

// Funktion zum Senden des Textes an den Server
function textAnServerSenden(text) {
  // Zeige einen Ladeindikator an
  const ladeAnzeige = document.createElement('div');
  ladeAnzeige.id = 'lade-anzeige';
  ladeAnzeige.textContent = 'Das Quiz wird generiert, bitte warten...';
  startmenue.appendChild(ladeAnzeige);

  fetch('http://localhost:5000/generate_quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: text }),
  })
    .then(response => response.json())
    .then(data => {
      // Entferne den Ladeindikator
      ladeAnzeige.remove();

      if (data.quiz) {
        // Parse das empfangene Quiz
        const quizText = data.quiz;
        const fragen = parseFragen(quizText);
        if (fragen.length > 0) {
          // Speichere das Quiz im localStorage
          const dateiName = 'Generiertes Quiz';
          const dateien = JSON.parse(localStorage.getItem('quizDateien')) || {};
          dateien[dateiName] = {
            fragen: fragen,
            richtigBeantwortet: 0,
            gesamtFragen: fragen.length
          };
          localStorage.setItem('quizDateien', JSON.stringify(dateien));
          updateDateiListe();
          alert('Das Quiz wurde erfolgreich generiert!');
          textEingabe.value = ''; // Eingabefeld zurücksetzen
          textEingabe.style.display = 'none';
          textSendenButton.style.display = 'none';
        } else {
          alert('Das empfangene Quiz konnte nicht verarbeitet werden.');
        }
      } else {
        console.error('Fehler:', data.error);
        alert('Es gab einen Fehler bei der Generierung des Quiz.');
      }
    })
    .catch((error) => {
      // Entferne den Ladeindikator
      ladeAnzeige.remove();
      console.error('Fehler:', error);
      alert('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
    });
}

// Event Listener für "Datei hochladen"
dateiHochladenButton.addEventListener('click', () => {
  dateiInput.click();
});

// Event Listener für Datei-Upload
dateiInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file && file.name.endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      // Sende den Text an den Server
      textAnServerSenden(text);
      dateiInput.value = ''; // Reset des Dateiauswahlfelds
    };
    reader.readAsText(file);
  } else {
    alert('Bitte wähle eine gültige .txt-Datei aus.');
  }
});

// Funktion zum Aktualisieren der Dateiliste
function updateDateiListe() {
  dateiListeContainer.innerHTML = '';
  const dateien = JSON.parse(localStorage.getItem('quizDateien')) || {};
  for (const [dateiName, dateiData] of Object.entries(dateien)) {
    const dateiEintrag = document.createElement('div');
    dateiEintrag.classList.add('datei-eintrag');

    const dateiInfo = document.createElement('div');
    dateiInfo.classList.add('datei-info');

    const dateiNameElement = document.createElement('div');
    dateiNameElement.classList.add('datei-name');
    dateiNameElement.textContent = dateiName;

    const dateiStatistik = document.createElement('div');
    dateiStatistik.classList.add('datei-statistik');
    dateiStatistik.textContent = `${dateiData.richtigBeantwortet} von ${dateiData.gesamtFragen} richtig beantwortet`;

    dateiInfo.appendChild(dateiNameElement);
    dateiInfo.appendChild(dateiStatistik);

    const dateiButtonsContainer = document.createElement('div');
    dateiButtonsContainer.classList.add('datei-buttons');

    const quizStartenButton = document.createElement('button');
    quizStartenButton.textContent = 'Quiz starten';
    quizStartenButton.classList.add('quiz-starten-button');
    quizStartenButton.addEventListener('click', () => {
      aktuelleDatei = dateiName;
      startQuizMitDatei(dateiName);
    });

    const dateiLoeschenButton = document.createElement('button');
    dateiLoeschenButton.textContent = 'Löschen';
    dateiLoeschenButton.classList.add('datei-loeschen-button');
    dateiLoeschenButton.addEventListener('click', () => {
      if (confirm(`Möchtest du das Quiz "${dateiName}" wirklich löschen?`)) {
        delete dateien[dateiName];
        localStorage.setItem('quizDateien', JSON.stringify(dateien));
        updateDateiListe();
        updateSpeicherplatzAnzeige();
      }
    });

    dateiButtonsContainer.appendChild(quizStartenButton);
    dateiButtonsContainer.appendChild(dateiLoeschenButton);

    dateiEintrag.appendChild(dateiInfo);
    dateiEintrag.appendChild(dateiButtonsContainer);

    dateiListeContainer.appendChild(dateiEintrag);
  }

  updateSpeicherplatzAnzeige();
}

// Rest des Codes bleibt unverändert...

// Beim Laden der Seite
window.onload = () => {
  updateDateiListe();
  // Prüfen, ob ein gespeicherter Fortschritt vorhanden ist
  const gespeicherterFortschritt = JSON.parse(localStorage.getItem('quizFortschritt'));
  if (gespeicherterFortschritt) {
    if (confirm('Du hast einen gespeicherten Fortschritt. Möchtest du fortfahren?')) {
      aktuelleDatei = gespeicherterFortschritt.aktuelleDatei;
      alleFragen = gespeicherterFortschritt.alleFragen;
      nochNichtBeantworteteFragen = gespeicherterFortschritt.nochNichtBeantworteteFragen;
      aktuelleBlockFragen = gespeicherterFortschritt.aktuelleBlockFragen;
      richtigBeantworteteFragen = gespeicherterFortschritt.richtigBeantworteteFragen;
      falschBeantworteteFragen = gespeicherterFortschritt.falschBeantworteteFragen;
      aktuelleFrageIndex = gespeicherterFortschritt.aktuelleFrageIndex;
      aktuelleFrageNummer = gespeicherterFortschritt.aktuelleFrageNummer;
      startmenue.style.display = 'none';
      quizContainer.style.display = 'block';
      gesamtFragenElement.textContent = aktuelleBlockFragen.length;
      updateFortschrittsbalken();
      zeigeFrage();
      starteTimer();
    }
  }
};
