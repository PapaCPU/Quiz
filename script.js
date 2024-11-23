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

// Funktion zum Laden der Fragen aus der Textdatei
function ladeFragen() {
  fetch('fragen.txt')
    .then(response => response.text())
    .then(text => {
      alleFragen = parseFragen(text);
      initialisiereQuiz();
    })
    .catch(error => {
      console.error('Fehler beim Laden der Fragen:', error);
    });
}

// Funktion zum Parsen der Textdatei in ein Array von Fragen
function parseFragen(text) {
  const fragenArray = [];
  const fragenTexte = text.split('---').filter(f => f.trim().length > 0);

  fragenTexte.forEach(fragenText => {
    const zeilen = fragenText.trim().split('\n').filter(l => l.trim().length > 0);
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

    fragenArray.push(frageObj);
  });

  return fragenArray;
}

// Funktion zum Initialisieren des Quiz
function initialisiereQuiz() {
  // Überprüfen, ob ein gespeicherter Fortschritt vorhanden ist
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
    nochNichtBeantworteteFragen = mischeFragen([...alleFragen]);
    starteNeuenBlock();
  }

  document.getElementById('gesamt-fragen').textContent = aktuelleBlockFragen.length;
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
  document.getElementById('frage-text').textContent = frageObj.frage;
  const optionenContainer = document.getElementById('optionen-container');
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

  document.getElementById('aktuelle-frage-nummer').textContent = aktuelleFrageNummer;
  document.getElementById('weiter-button').disabled = true;
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

  document.getElementById('weiter-button').disabled = false;
}

// Funktion zum Starten des Timers
function starteTimer() {
  zeitUebrig = 30;
  document.getElementById('zeit').textContent = zeitUebrig;
  timer = setInterval(() => {
    zeitUebrig--;
    document.getElementById('zeit').textContent = zeitUebrig;
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
        document.getElementById('gesamt-fragen').textContent = aktuelleBlockFragen.length;
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
  document.getElementById('quiz-ende-modal').style.display = 'block';
  localStorage.removeItem('quizFortschritt');
}

// Event Listener für den Weiter-Button
document.getElementById('weiter-button').addEventListener('click', () => {
  zurNaechstenFrage();
});

// Event Listener für den Speichern & Beenden-Button
document.getElementById('speichern-button').addEventListener('click', () => {
  speichereFortschritt();
  alert('Dein Fortschritt wurde gespeichert. Du kannst später weitermachen.');
});

// Event Listener für das Schließen des Modals
document.getElementById('schliessen-button').addEventListener('click', () => {
  document.getElementById('quiz-ende-modal').style.display = 'none';
});

// Event Listener für den "Neu starten"-Button
document.getElementById('neu-starten-button').addEventListener('click', () => {
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
  ladeFragen();
  // Klick außerhalb des Modals schließt dieses
  window.onclick = function(event) {
    const modal = document.getElementById('quiz-ende-modal');
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
};

