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
let tempDateiName = '';
let tempFragen = [];
let uniqueId = 0;

// Elemente aus dem DOM
const startmenue = document.getElementById('startmenue');
const fragenHochladenButton = document.getElementById('fragen-hochladen-button');
const dateiInput = document.getElementById('datei-input');
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
const youtubeModal = document.getElementById('youtube-modal');
const youtubeLinkInput = document.getElementById('youtube-link-input');
const youtubeSpeichernButton = document.getElementById('youtube-speichern-button');
const youtubeOhneButton = document.getElementById('youtube-ohne-button');

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
      const fragen = parseFragen(text);
      if (fragen.length > 0) {
        // Speichere temporär die Fragen und Dateiname
        const dateiName = file.name;
        tempDateiName = dateiName;
        tempFragen = fragen;

        // Zeige das YouTube-Link-Modal
        youtubeModal.style.display = 'block';
        dateiInput.value = ''; // Reset des Dateiauswahlfelds
      } else {
        alert('Die hochgeladene Datei enthält keine gültigen Fragen.');
      }
    };
    reader.readAsText(file);
  } else {
    alert('Bitte wähle eine gültige .txt-Datei aus.');
  }
});

// Event Listener für YouTube-Link-Modal Buttons
youtubeSpeichernButton.addEventListener('click', () => {
  const youtubeLink = youtubeLinkInput.value.trim();
  speichereDateiMitLink(youtubeLink);
});

youtubeOhneButton.addEventListener('click', () => {
  speichereDateiMitLink('');
});

// Funktion zum Speichern der Datei mit oder ohne YouTube-Link
function speichereDateiMitLink(youtubeLink) {
  const dateien = JSON.parse(localStorage.getItem('quizDateien')) || {};
  dateien[tempDateiName] = {
    fragen: tempFragen,
    richtigBeantwortet: dateien[tempDateiName] ? dateien[tempDateiName].richtigBeantwortet : 0,
    gesamtFragen: tempFragen.length,
    youtubeLink: youtubeLink
  };
  localStorage.setItem('quizDateien', JSON.stringify(dateien));
  youtubeModal.style.display = 'none';
  youtubeLinkInput.value = '';
  tempDateiName = '';
  tempFragen = [];
  updateDateiListe();
  alert('Fragen erfolgreich gespeichert!');
}

// Funktion zum Aktualisieren der Dateiliste
function updateDateiListe() {
  dateiListeContainer.innerHTML = '';
  const dateien = JSON.parse(localStorage.getItem('quizDateien')) || {};
  const gespeicherteFortschritte = JSON.parse(localStorage.getItem('quizFortschritt')) || {};

  for (const [dateiName, dateiData] of Object.entries(dateien)) {
    const dateiEintrag = document.createElement('div');
    dateiEintrag.classList.add('datei-eintrag');

    const dateiInfo = document.createElement('div');
    dateiInfo.classList.add('datei-info');

    const dateiNameElement = document.createElement('div');
    dateiNameElement.classList.add('datei-name');
    dateiNameElement.textContent = dateiName;

    const prozentRichtig = ((dateiData.richtigBeantwortet / dateiData.gesamtFragen) * 100).toFixed(2);
    const dateiStatistik = document.createElement('div');
    dateiStatistik.classList.add('datei-statistik');
    dateiStatistik.textContent = `${dateiData.richtigBeantwortet} von ${dateiData.gesamtFragen} richtig beantwortet (${prozentRichtig}%)`;

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
      if (confirm(`Möchtest du die Datei "${dateiName}" wirklich löschen?`)) {
        delete dateien[dateiName];
        localStorage.setItem('quizDateien', JSON.stringify(dateien));
        updateDateiListe();
        updateSpeicherplatzAnzeige();
      }
    });

    dateiButtonsContainer.appendChild(quizStartenButton);

    // Prüfe auf gespeicherten Fortschritt
    if (gespeicherteFortschritte[dateiName]) {
      const fortsetzenButton = document.createElement('button');
      fortsetzenButton.textContent = 'Fortsetzen';
      fortsetzenButton.classList.add('fortsetzen-button');
      fortsetzenButton.addEventListener('click', () => {
        ladeGespeichertenFortschritt(dateiName);
      });
      dateiButtonsContainer.appendChild(fortsetzenButton);
    }

    dateiButtonsContainer.appendChild(dateiLoeschenButton);

    dateiEintrag.appendChild(dateiInfo);
    dateiEintrag.appendChild(dateiButtonsContainer);

    // Wenn ein YouTube-Link vorhanden ist, zeige den Player
    if (dateiData.youtubeLink && dateiData.youtubeLink !== '') {
      const videoContainer = document.createElement('div');
      videoContainer.classList.add('video-container');
      const youtubePlayer = document.createElement('iframe');
      youtubePlayer.width = '100%';
      youtubePlayer.height = '315';
      youtubePlayer.frameBorder = '0';
      youtubePlayer.allowFullscreen = true;

      const videoId = getYouTubeVideoId(dateiData.youtubeLink);
      if (videoId) {
        youtubePlayer.src = 'https://www.youtube.com/embed/' + videoId;
        videoContainer.appendChild(youtubePlayer);
        dateiEintrag.appendChild(videoContainer);
      }
    }

    dateiListeContainer.appendChild(dateiEintrag);
  }

  updateSpeicherplatzAnzeige();
}

// Funktion zum Starten des Quiz mit ausgewählter Datei
function startQuizMitDatei(dateiName) {
  const dateien = JSON.parse(localStorage.getItem('quizDateien'));
  if (dateien && dateien[dateiName]) {
    alleFragen = dateien[dateiName].fragen;
    nochNichtBeantworteteFragen = mischeFragen([...alleFragen]);
    richtigBeantworteteFragen = [];
    falschBeantworteteFragen = [];
    aktuelleBlockFragen = [];
    aktuelleFrageIndex = 0;
    aktuelleFrageNummer = 1;
    startmenue.style.display = 'none';
    quizContainer.style.display = 'block';
    starteNeuenBlock();
    gesamtFragenElement.textContent = aktuelleBlockFragen.length;
    updateFortschrittsbalken();
    zeigeFrage();
    starteTimer();
  } else {
    alert('Fehler beim Laden der Datei.');
  }
}

// Funktion zum Extrahieren der Video-ID aus einem YouTube-Link
function getYouTubeVideoId(url) {
  const regex = /(?:\?v=|\/embed\/|\.be\/|\/watch\?v=|\/v\/|\/u\/\w\/|\/embed\/|\/watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regex);
  return match && match[1].length === 11 ? match[1] : null;
}

// Funktion zum Aktualisieren der Speicherplatzanzeige
function updateSpeicherplatzAnzeige() {
  const total = 5 * 1024 * 1024; // 5 MB
  const used = unescape(encodeURIComponent(JSON.stringify(localStorage))).length;
  const remaining = total - used;
  speicherplatzAnzeige.textContent = `Verfügbarer Speicherplatz: ${(remaining / 1024).toFixed(2)} KB von ${(total / 1024).toFixed(2)} KB`;
}

// Funktion zum Aktualisieren des Fortschrittsbalkens
function updateFortschrittsbalken() {
  const progress = (aktuelleFrageNummer - 1) / aktuelleBlockFragen.length * 100;
  fortschrittsbalken.style.width = `${progress}%`;
}

// Funktion zum Parsen der Textdatei in ein Array von Fragen
function parseFragen(text) {
  const fragenArray = [];
  const fragenTexte = text.split('---').filter(f => f.trim().length > 0);

  fragenTexte.forEach(fragenText => {
    const zeilen = fragenText.trim().split('\n').filter(l => l.trim().length > 0);
    if (zeilen.length >= 5) {
      const frageObj = {
        id: uniqueId++,
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

// Funktion zum Starten eines neuen Blocks
function starteNeuenBlock() {
  aktuelleBlockFragen = falschBeantworteteFragen.concat(nochNichtBeantworteteFragen.splice(0, blockGroesse - falschBeantworteteFragen.length));
  falschBeantworteteFragen = [];
  aktuelleFrageIndex = 0;
  aktuelleFrageNummer = 1;
  updateFortschrittsbalken();
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
    button.setAttribute('aria-pressed', 'false');
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
    btn.setAttribute('aria-pressed', 'false');
  });

  button.setAttribute('aria-pressed', 'true');

  if (auswahl === frageObj.antwort) {
    richtigBeantworteteFragen.push(frageObj);
    button.classList.add('correct');
  } else {
    falschBeantworteteFragen.push(frageObj);
    button.classList.add('incorrect');
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
    updateFortschrittsbalken();
    zeigeFrage();
    starteTimer();
  } else {
    if (falschBeantworteteFragen.length > 0 || nochNichtBeantworteteFragen.length > 0) {
      starteNeuenBlock();
      if (aktuelleBlockFragen.length > 0) {
        gesamtFragenElement.textContent = aktuelleBlockFragen.length;
        updateFortschrittsbalken();
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
  aktualisiereDateiStatistik();

  // Gespeicherten Fortschritt für diese Datei löschen
  const gespeicherteFortschritte = JSON.parse(localStorage.getItem('quizFortschritt')) || {};
  delete gespeicherteFortschritte[aktuelleDatei];
  localStorage.setItem('quizFortschritt', JSON.stringify(gespeicherteFortschritte));

  quizEndeModal.style.display = 'block';
}

// Funktion zum Aktualisieren der Datei-Statistik
function aktualisiereDateiStatistik() {
  const dateien = JSON.parse(localStorage.getItem('quizDateien'));
  if (dateien && dateien[aktuelleDatei]) {
    dateien[aktuelleDatei].richtigBeantwortet += richtigBeantworteteFragen.length;
    dateien[aktuelleDatei].richtigBeantwortet = Math.min(dateien[aktuelleDatei].richtigBeantwortet, dateien[aktuelleDatei].gesamtFragen);
    localStorage.setItem('quizDateien', JSON.stringify(dateien));
    updateDateiListe();
  }
}

// Funktion zum Laden eines gespeicherten Fortschritts
function ladeGespeichertenFortschritt(dateiName) {
  const gespeicherteFortschritte = JSON.parse(localStorage.getItem('quizFortschritt')) || {};
  const fortschritt = gespeicherteFortschritte[dateiName];
  if (fortschritt) {
    aktuelleDatei = fortschritt.aktuelleDatei;
    alleFragen = fortschritt.alleFragen;
    nochNichtBeantworteteFragen = fortschritt.nochNichtBeantworteteFragen;
    aktuelleBlockFragen = fortschritt.aktuelleBlockFragen;
    richtigBeantworteteFragen = fortschritt.richtigBeantworteteFragen;
    falschBeantworteteFragen = fortschritt.falschBeantworteteFragen;
    aktuelleFrageIndex = fortschritt.aktuelleFrageIndex;
    aktuelleFrageNummer = fortschritt.aktuelleFrageNummer;
    startmenue.style.display = 'none';
    quizContainer.style.display = 'block';
    gesamtFragenElement.textContent = aktuelleBlockFragen.length;
    updateFortschrittsbalken();
    zeigeFrage();
    starteTimer();
  } else {
    alert('Kein gespeicherter Fortschritt gefunden.');
  }
}

// Event Listener für den Weiter-Button
weiterButton.addEventListener('click', () => {
  zurNaechstenFrage();
});

// Event Listener für den Speichern & Beenden-Button
speichernButton.addEventListener('click', () => {
  speichereFortschritt();
  bestaetigungModal.style.display = 'block';
});

// Event Listener für den Hauptmenü-Button
hauptmenueButton.addEventListener('click', () => {
  bestaetigungModal.style.display = 'block';
});

// Event Listener für das Bestätigungs-Modal
jaButton.addEventListener('click', () => {
  bestaetigungModal.style.display = 'none';
  quizContainer.style.display = 'none';
  startmenue.style.display = 'block';
  stoppeTimer();
  updateDateiListe();
});

// Wenn der Benutzer "Nein" wählt
neinButton.addEventListener('click', () => {
  bestaetigungModal.style.display = 'none';
});

// Event Listener für das Schließen des Quiz-Ende Modals
schliessenButton.addEventListener('click', () => {
  quizEndeModal.style.display = 'none';
  quizContainer.style.display = 'none';
  startmenue.style.display = 'block';
  updateDateiListe();
});

// Event Listener für den "Neu starten"-Button
neuStartenButton.addEventListener('click', () => {
  quizEndeModal.style.display = 'none';
  quizContainer.style.display = 'none';
  startmenue.style.display = 'block';
  updateDateiListe();
});

// Funktion zum Speichern des Fortschritts
function speichereFortschritt() {
  const gespeicherteFortschritte = JSON.parse(localStorage.getItem('quizFortschritt')) || {};
  gespeicherteFortschritte[aktuelleDatei] = {
    alleFragen,
    nochNichtBeantworteteFragen,
    aktuelleBlockFragen,
    richtigBeantworteteFragen,
    falschBeantworteteFragen,
    aktuelleFrageIndex,
    aktuelleFrageNummer,
    aktuelleDatei
  };
  localStorage.setItem('quizFortschritt', JSON.stringify(gespeicherteFortschritte));
  aktualisiereDateiStatistik();
}

// Beim Laden der Seite
window.onload = () => {
  updateDateiListe();
};
