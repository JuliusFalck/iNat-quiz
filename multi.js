
// Import the functions you need from the SDKs you need
import {
  quizData, optionsData, gameMode, setGameMode, setOptionsData, setQuizData,
  nextQuestion, buildQuiz, quizHistory, quizAnswers, setQuizHistory, setQuizAnswers,
  quizHistoryOpponent, quizAnswersOpponent, setQuizHistoryOpponent, setQuizAnswersOpponent,
  c_opt, runs, setRuns, score, setScore
} from "./index.js";


import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdEBLIvMxxmEIGnvvVPKa3OZFXb4jcfU0",
  authDomain: "quiz-1ac1b.firebaseapp.com",
  projectId: "quiz-1ac1b",
  storageBucket: "quiz-1ac1b.firebasestorage.app",
  messagingSenderId: "11564021167",
  appId: "1:11564021167:web:47c88ecee6e7f031126b5a",
  measurementId: "G-Z1RKQPF9S3"
};


import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);



const db = getFirestore(app);

let currentGameId = null;
let currentRole = null; // "host" or "guest"
let opponentRole = null; // "host" or "guest"
let unsubscribeGame = null;




const optionButtons = document.querySelectorAll('.option-button');
const nextButton = document.querySelector('.next-button');


const multiplayerNameInput = document.getElementById("multiplayer-name-input");
const multiplayerGameIdInput = document.getElementById("multiplayer-id-input");

const hostGameButton = document.getElementById("host-multiplayer");
const joinGameButton = document.getElementById("join-multiplayer");


const playMenu = document.querySelector('.play-menu');
const quizInfo = document.querySelector('.quiz-info');
const playButton = document.querySelector('.play-button');

const scorePlayer = document.getElementById("scorePlayer");
const scoreOpponent = document.getElementById("scoreOpponent");


const leaveGameButton = document.getElementById("leave-multiplayer");

const gameTitle = document.querySelector(".game-title");
let playerList = document.querySelector(".player-list");

const multiplayerMenu = document.querySelector(".multiplayer-menu");

const buttonQuiz = document.getElementById("button-quiz");



hostGameButton.disabled = true;
joinGameButton.disabled = true;

multiplayerGameIdInput.addEventListener("input", () => {
  multiplayerGameIdInput.value = multiplayerGameIdInput.value.trim().toLowerCase();
  if (multiplayerGameIdInput.value) {
    hostGameButton.disabled = false;
    joinGameButton.disabled = false;
  } else {
    hostGameButton.disabled = true;
    joinGameButton.disabled = true;
  }
});

multiplayerNameInput.addEventListener("input", () => {
  multiplayerNameInput.value = multiplayerNameInput.value.trim();
  if (multiplayerNameInput.value) {
    hostGameButton.disabled = false;
    joinGameButton.disabled = false;
  } else {
    hostGameButton.disabled = true;
    joinGameButton.disabled = true;
  }
});


hostGameButton.addEventListener("click", () => {
  createGame();
});

joinGameButton.addEventListener("click", () => {
  joinGame();
});

optionButtons.forEach((button, i) => {
  button.addEventListener('click', event => {
    multiAnswer(i);
  });
});


leaveGameButton.addEventListener("click", () => {
  leaveGame();
});


nextButton.addEventListener("click", async () => {
  const gameId = multiplayerGameIdInput.value;
  const gameRef = doc(db, "games", gameId);

  if (currentRole === "host") {
    await updateDoc(gameRef, {
      "players.host.next": true
    });
  } else {
    await updateDoc(gameRef, {
      "players.guest.next": true
    });
  }


});







// Create a new game in Firestore with host info and quiz questions.
//  Validate inputs and check for existing game with same host ID.


async function createGame() {
  setGameMode("multi");

  const hostName = multiplayerNameInput.value;
  const gameId = multiplayerGameIdInput.value;

  if (!hostName || !gameId) {
    alert("Enter both host name and host ID.");
    return;
  }

  const gameRef = doc(db, "games", gameId);
  // const existingGame = await getDoc(gameRef);

  // if (existingGame.exists()) {
  //   alert("That host ID already has a game. Choose another ID.");
  //   return;
  // }

  let transformedQuizData = makeFirestoreSafe(quizData);
  let transformedOptionsData = makeFirestoreSafe(optionsData);

  await setDoc(gameRef, {
    gameId,
    hostName,
    guestName: null,
    start: false,
    status: "waiting",

    quizData: transformedQuizData,
    optionsData: transformedOptionsData,

    currentQuestion: 0,

    players: {
      host: {
        name: hostName,
        score: 0,
        answered: false,
        selectedIndex: null,
        next: false
      },
      guest: {
        name: null,
        score: 0,
        answered: false,
        selectedIndex: null,
        next: false
      }
    },

    createdAt: Date.now()
  });


  currentGameId = gameId;
  currentRole = "host";
  opponentRole = "guest";




  startGame();

  let hostItem = document.createElement("div");
  hostItem.className = "player-list-item";
  hostItem.innerHTML = hostName;
  playerList.appendChild(hostItem);

  console.log("Game created with ID:", gameId);


  listenToGame(gameId);
}



// join game as guest by entering host ID and guest name.
// Validate inputs and update Firestore document to add guest info and change status to "active".

async function joinGame() {
  setGameMode("multi");

  const guestName = multiplayerNameInput.value;
  const gameId = multiplayerGameIdInput.value;

  if (!guestName || !gameId) {
    alert("Enter both your name and the host ID.");
    return;
  }

  const gameRef = doc(db, "games", gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    alert("No game found with that host ID.");
    return;
  }

  const game = gameSnap.data();

  if (game.status !== "waiting") {
    alert("This game has already started or finished.");
    return;
  }

  await updateDoc(gameRef, {
    guestName,
    status: "active",
    "players.guest.name": guestName,
    "players.guest.score": 0,
    "players.guest.answered": false,
    "players.guest.selectedIndex": null
  });

  currentGameId = gameId;
  currentRole = "guest";
  opponentRole = "host";


  startGame();

  let hostItem = document.createElement("div");
  hostItem.className = "player-list-item";
  hostItem.textContent = game.hostName;
  playerList.appendChild(hostItem);

  let guestItem = document.createElement("div");
  guestItem.className = "player-list-item";
  guestItem.textContent = guestName;
  playerList.appendChild(guestItem);


  listenToGame(gameId);

  playMenu.style.display = "block";
  quizInfo.style.display = "block";
  playButton.style.display = "none";
  quizInfo.textContent = "Waiting for host...";

  buttonQuiz.disabled = false;




}


function startGame() {

  for (let child of multiplayerMenu.children) {
    child.style.display = "none";
  }

  leaveGameButton.style.display = "block";
  const gameId = multiplayerGameIdInput.value;

  gameTitle.textContent = gameId;

}

// update quiz

export async function shareQuiz() {
  const gameId = multiplayerGameIdInput.value;
  const gameRef = doc(db, "games", gameId);
  let transformedQuizData = makeFirestoreSafe(quizData);
  let transformedOptionsData = makeFirestoreSafe(optionsData);

  console.log("Sharing quiz with Firestore...");
  console.log("Transformed quiz data:", transformedQuizData);
  console.log("Transformed options data:", transformedOptionsData);

  await updateDoc(gameRef, {
    quizData: transformedQuizData,
    optionsData: transformedOptionsData,
    start: true
  });

}




// Listen for game updates in real-time and update the UI accordingly.
function listenToGame(gameId) {
  const gameRef = doc(db, "games", gameId);

  if (unsubscribeGame) {
    unsubscribeGame();
  }

  unsubscribeGame = onSnapshot(gameRef, (snapshot) => {
    if (!snapshot.exists()) {
      alert("Game no longer exists.");
      return;
    }

    const game = snapshot.data();
    renderGame(game);
  });
}



// Render game state based on game data,
// including player scores, current question, and answer options.

async function renderGame(game) {
  // gameTitle.textContent = `Game: ${game.gameId}`;
  // statusEl.textContent = `Status: ${game.status}`;

  const host = game.players.host;
  const guest = game.players.guest;


  if (game.start && currentRole === "guest") {
    updateDoc(doc(db, "games", game.gameId), {
      start: false
    });

    playMenu.style.display = "none";
    setQuizData(unwrapFirestoreSafe(game.quizData));
    setOptionsData(unwrapFirestoreSafe(game.optionsData));
    console.log(quizData.length);
    console.log("Quiz data set in joinGame:", quizData);
    console.log("Options data set in joinGame:", optionsData);


    await buildQuiz();
    await nextQuestion();

    scorePlayer.innerHTML = game.players[currentRole].name + " " + game.players[currentRole].score;
    scoreOpponent.innerHTML = game.players[opponentRole].score + " " + game.players[opponentRole].name;


  }

  if (currentRole === "host" && game.guestName && playerList.children.length === 1) {
    console.log("Adding guest to player list...");
    console.log(game.guestName);
    let guestItem = document.createElement("div");
    guestItem.className = "player-list-item";
    guestItem.textContent = game.guestName;
    playerList.appendChild(guestItem);

    scorePlayer.innerHTML = game.players[currentRole].name + " " + game.players[currentRole].score;
    scoreOpponent.innerHTML = game.players[opponentRole].score + " " + game.players[opponentRole].name;

  }




  let bothAnswered = host.answered && guest.answered;


  if (bothAnswered && !game.players[currentRole].show) {
    updateDoc(doc(db, "games", game.gameId), {
      [`players.${currentRole}.show`]: true,
    });
    console.log("Both players have answered, showing results...");
    showAnswerResults(game);


  }


  let bothNext = host.next && guest.next;

  if (bothNext) {
    optionButtons.forEach((button, i) => {
      button.style.backgroundColor = "black";
      button.style.border = "0.2vh solid white";
    });

    console.log("Both players ready for next question, moving on...");

    await nextQuestion();
    updateDoc(doc(db, "games", game.gameId), {
      "players.host.next": false,
      "players.guest.next": false,
      "players.host.answered": false,
      "players.guest.answered": false,
      [`players.${currentRole}.show`]: false
    });

  }
  else if (game.players[currentRole].next) {
    nextButton.innerHTML = "Waiting for opponent...";
  }
}


// submit selected answer index to Firestore and update player's score based on correctness.



async function multiAnswer(a) {
  if (gameMode == "multi") {
    const gameId = multiplayerGameIdInput.value;
    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);
    const game = gameSnap.data();


    if (!game.players[currentRole].answered) {
      if (game.players[opponentRole].answered) {


        let opponent_a = game.players[opponentRole].selectedIndex;
        let opponent_score = game.players[opponentRole].score;

        setQuizHistory([...quizHistory, a == c_opt]);
        setQuizAnswers([...quizAnswers, a]);


        if (a == c_opt) {
          setScore(score + 1);
        }

        let opponent_score_delta = 0;

        if (opponent_a == c_opt) {
          opponent_score_delta = 1;
        }

        await updateDoc(gameRef, {
          [`players.${currentRole}.answered`]: true,
          [`players.${currentRole}.selectedIndex`]: a,
          [`players.${currentRole}.score`]: score,
          [`players.${opponentRole}.score`]: opponent_score + opponent_score_delta
        });

      }
      else {
        setQuizHistory([...quizHistory, a == c_opt]);
        setQuizAnswers([...quizAnswers, a]);
        document.querySelector('#opt-' + a.toString()).style.border = "0.2vh solid green";

        await updateDoc(gameRef, {
          [`players.${currentRole}.answered`]: true,
          [`players.${currentRole}.selectedIndex`]: a
        });

      }
    }


  }

}





// Show results of the current question, including correct answer and each player's choice.


async function showAnswerResults(game) {
  console.log("Showing answer results...");
  console.log("c_opt: " + c_opt.toString());



  let a = game.players[currentRole].selectedIndex;
  let opponent_a = game.players[opponentRole].selectedIndex;


  setQuizHistoryOpponent([...quizHistoryOpponent, opponent_a == c_opt]);
  setQuizAnswersOpponent([...quizAnswersOpponent, opponent_a]);

  document.querySelector('#opt-' + a.toString()).style.backgroundColor = "red";
  document.querySelector('#opt-' + c_opt.toString()).style.backgroundColor = "green";
  document.querySelector('#opt-' + a.toString()).style.border = "0.2vh solid green";
  document.querySelector('#opt-' + opponent_a.toString()).style.border = "0.2vh solid mediumblue";

  scorePlayer.style.display = "block";
  scoreOpponent.style.display = "block";
  scorePlayer.innerHTML = game.players[currentRole].name + " " + game.players[currentRole].score;
  scoreOpponent.innerHTML = game.players[opponentRole].score + " " + game.players[opponentRole].name;

}


function leaveGame() {
  if (unsubscribeGame) {
    unsubscribeGame();
  }
  currentGameId = null;
  currentRole = null;
  opponentRole = null;
  playMenu.style.display = "none";
  quizInfo.style.display = "none";
  scorePlayer.style.display = "none";
  scoreOpponent.style.display = "none";
  playerList.innerHTML = "";
  setQuizHistory([]);
  setQuizAnswers([]);
  setScore(0);
  setRuns(0);
  optionButtons.forEach((button) => {
    button.style.backgroundColor = "black";
    button.style.border = "0.2vh solid white";
  });

  for (let child of multiplayerMenu.children) {
    child.style.display = "flex";
  }

  leaveGameButton.style.display = "none";

  gameTitle.textContent = "";

}



function makeFirestoreSafe(value) {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(item => {
      if (Array.isArray(item)) {
        return {
          values: makeFirestoreSafe(item)
        };
      }

      return makeFirestoreSafe(item);
    });
  }

  if (value && typeof value === "object") {
    const cleaned = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      cleaned[key] = makeFirestoreSafe(nestedValue);
    }

    return cleaned;
  }

  return value;
}



function unwrapFirestoreSafe(value) {
  if (Array.isArray(value)) {
    return value.map(unwrapFirestoreSafe);
  }

  if (
    value &&
    typeof value === "object" &&
    Object.keys(value).length === 1 &&
    Object.prototype.hasOwnProperty.call(value, "values")
  ) {
    return unwrapFirestoreSafe(value.values);
  }

  if (value && typeof value === "object") {
    const result = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = unwrapFirestoreSafe(nestedValue);
    }

    return result;
  }

  return value;
}




