
import { shareQuiz } from "./multi.js";

// vars

export let gameMode = "single"; // single or multi

export function setGameMode(mode) {
  gameMode = mode;
}

let c_index = 0;

export let c_opt = 0;

export let score = 0;

export function setScore(s) {
  score = s;
}

let answered = false;

export let runs = 0;

export function setRuns(r) {
  runs = r;
}

let start = 0;

export let quizHistory = [];

export function setQuizHistory(history) {
  quizHistory = history;
}

export let quizHistoryOpponent = [];

export function setQuizHistoryOpponent(history) {
  quizHistoryOpponent = history;
}

export let quizAnswers = [];

export function setQuizAnswers(answers) {
  quizAnswers = answers;
}


export let quizAnswersOpponent = [];

export function setQuizAnswersOpponent(answers) {
  quizAnswersOpponent = answers;
}

let n_questions = 12;

const n_options = 4;

let c_species = [];

let searchData = {};

let taxonData = {};

let locationData = [];

export let quizData = [];

export function setQuizData(data) {
  quizData = data;
}

export let optionsData = [];

export function setOptionsData(data) {
  optionsData = data;
}

let ObsData = [];

let ObsData_photo = [];

let ObsData_audio = [];


let species_pool = [];



let quizOptions = [];

let language = "en";

let obsMediaTypes = [];

let max_searches = 10;

let quizRank = "species";

const acceptedRanks = ["order", "family", "genus", "species"]


let months = [true, true, true, true, true, true, true, true, true, true, true, true];

let currentImage = null;

let currentSpectrogram = null;

let scale = 1;
let minScale = 1;        // <-- will become "initial scale"
const maxScale = 10;
let x = 0, y = 0;

// drag state
let dragging = false;
let startX = 0, startY = 0;
let startTx = 0, startTy = 0;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

let audioURL = "mistle.mp3";

let media_photo = true;

let media_audio = false;

let species_pool_audio_ids = [];

let photo_index = 0;
let audio_index = 0;

let taxon_pool = [];

let spectrogramView = document.querySelector('.spectrogram-view');


// Elements

let searchBox = document.querySelector('#search-box');

let resultListTaxa = document.querySelector('#taxa-suggestions');

let taxaList = document.querySelector('#taxa-list');

let clearSearchButton = document.querySelector("#clear-search-button");

let searchBoxLocation = document.querySelector('#search-box-location');

let resultListLocation = document.querySelector('#locations-suggestions');

let clearSearchButtonLocation = document.querySelector("#clear-search-button-location");

let clearSearchButtonLanguage = document.querySelector("#clear-search-button-language");

let locationList = document.querySelector('#locations-list');

let makeQuizButton = document.querySelector(".make-quiz-button");

let mainBody = document.querySelector('.main-body');

let controlsContainer = document.querySelector('.controls-container');

let imageView = document.querySelector('.image-view');

let mediaView = document.querySelector('.media-view');

let audioView = document.querySelector('.audio-view');

let nextButton = document.querySelector('.next-button');

let optionButtons = document.querySelectorAll('.option-button');

let rankButtons = document.querySelectorAll('.rank-button');

let scoreLabel = document.querySelector('.score-label');

let summaryView = document.querySelector('.summary-view');

let obs_metadata_container = document.querySelector('.observation-metadata-container');


let loadingContainer = document.querySelector('.loading-container');

let loadingIndicator = document.querySelector('.loading-indicator');

let loadingIndicatorText = document.querySelector('.loading-indicator-text');

let settingsMenu = document.querySelector('.settings-menu');

let languageSearchBox = document.querySelector('#language-search-box');

let languageSelect = document.querySelector('#language-suggestions');

let languageIndicator = document.querySelector('.language-indicator');

let languageDropdown = document.querySelector('.language-dropdown');

let nQuestionsInput = document.querySelector('#n-questions-input');

let photoMediaButton = document.querySelector('.media-button-selected');

let audioMediaButton = document.querySelector('.media-button');


let monthButtons = document.querySelectorAll('.month-button-selected');


const scorePlayer = document.getElementById("scorePlayer");
const scoreOpponent = document.getElementById("scoreOpponent");
const questionCounter = document.querySelector('.question-counter');

const playMenu = document.querySelector('.play-menu');
const playButton = document.querySelector('.play-button');

const quizContainer = document.querySelector('.quiz-container');

// Event listeners


searchBox.addEventListener('input', event => {
  search();
})

clearSearchButton.addEventListener('click', event => {
  searchBox.value = "";
  searchBox.focus();
  search();
})



languageSearchBox.addEventListener('input', event => {
  search_language();
})

clearSearchButtonLanguage.addEventListener('click', event => {
  languageSearchBox.value = "";
  languageSearchBox.focus();
  search_language();
})


searchBoxLocation.addEventListener('input', event => {
  search_location();
})

clearSearchButtonLocation.addEventListener('click', event => {
  searchBoxLocation.value = "";
  searchBoxLocation.focus();
  search_location();
})




optionButtons.forEach((button, i) => {
  button.addEventListener('click', event => {
    answer(i);
  });
});

rankButtons.forEach((button, i) => {
  button.addEventListener('click', event => {
    setRank(i);
  });
});


photoMediaButton.addEventListener('click', event => {
  toggleMedia(0);
});

audioMediaButton.addEventListener('click', event => {
  toggleMedia(1);
});


monthButtons.forEach((button, i) => {
  button.addEventListener('click', event => {
    setMonth(i);
  });
});

makeQuizButton.addEventListener('click', event => {
  makeQuiz();
});

nextButton.addEventListener('click', async event => {
  if (gameMode == "single") {
    await nextQuestion();
  }
});

languageIndicator.addEventListener('click', event => {
  if (languageDropdown.style.display == "block") {
    languageDropdown.style.display = "none";
    return;
  }
  languageDropdown.style.display = "block";
  languageSearchBox.focus();
  languageSearchBox.value = "";
  render(options);
});


nQuestionsInput.addEventListener('change', event => {
  n_questions = parseInt(nQuestionsInput.value);
});



playButton.addEventListener('click', async event => {
  playMenu.style.display = "none";

  await nextQuestion();

  if (gameMode == "multi") {
    shareQuiz();
  }

});


// Recommended (in case CSS isn't set):
// imageView.style.touchAction = "none";



// Track active pointers for pinch
const pointers = new Map(); // pointerId -> { clientX, clientY, x, y }
let dragPointerId = null;

// Pinch state
let pinch = null; // { startDist, startScale, anchorIx, anchorIy }

function getLocalPoint(e) {
  const rect = imageView.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function beginDrag(e) {
  dragging = true;
  dragPointerId = e.pointerId;
  startX = e.clientX;
  startY = e.clientY;
  startTx = x;
  startTy = y;
}

function endDrag() {
  dragging = false;
  dragPointerId = null;
}

function beginPinch() {
  const pts = [...pointers.values()];
  if (pts.length !== 2) return;

  const p1 = pts[0], p2 = pts[1];
  const d = dist(p1, p2);
  const mid = midpoint(p1, p2);

  // Anchor point in image coordinates under the pinch midpoint
  const anchorIx = (mid.x - x) / scale;
  const anchorIy = (mid.y - y) / scale;

  pinch = {
    startDist: d,
    startScale: scale,
    anchorIx,
    anchorIy
  };
}

function updatePinch() {
  if (!pinch) return;
  const pts = [...pointers.values()];
  if (pts.length !== 2) return;

  const p1 = pts[0], p2 = pts[1];
  const d = dist(p1, p2);
  const mid = midpoint(p1, p2);

  const factor = d / pinch.startDist;
  const nextScale = clamp(pinch.startScale * factor, minScale, maxScale);

  // Keep the anchored image point under the midpoint
  x = mid.x - pinch.anchorIx * nextScale;
  y = mid.y - pinch.anchorIy * nextScale;
  scale = nextScale;

  clampPan();
  apply();
}

imageView.addEventListener("pointerdown", (e) => {
  imageView.setPointerCapture(e.pointerId);

  const p = getLocalPoint(e);
  pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY, x: p.x, y: p.y });

  if (pointers.size === 1) {
    // start 1-finger pan
    beginDrag(e);
  } else if (pointers.size === 2) {
    // start pinch
    endDrag();
    beginPinch();
  }
});

imageView.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;

  const p = getLocalPoint(e);
  pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY, x: p.x, y: p.y });

  // 2-finger pinch zoom
  if (pointers.size === 2) {
    updatePinch();
    return;
  }

  // 1-finger pan
  if (!dragging || e.pointerId !== dragPointerId) return;

  x = startTx + (e.clientX - startX);
  y = startTy + (e.clientY - startY);

  clampPan();
  apply();
});

function endPointer(e) {
  pointers.delete(e.pointerId);

  // If we were pinching and one finger lifts, allow continuing pan with remaining finger
  if (pointers.size < 2) pinch = null;

  if (pointers.size === 1) {
    const remainingId = [...pointers.keys()][0];
    // continue panning from remaining finger
    const remaining = pointers.get(remainingId);
    dragging = true;
    dragPointerId = remainingId;

    // reset drag baseline to current transform
    startX = remaining.clientX;
    startY = remaining.clientY;
    startTx = x;
    startTy = y;
  } else {
    endDrag();
  }
}

imageView.addEventListener("pointerup", endPointer);
imageView.addEventListener("pointercancel", endPointer);
imageView.addEventListener("lostpointercapture", endPointer);




// Wheel zoom (zooms around cursor position)
imageView.addEventListener("wheel", (e) => {
  e.preventDefault();

  const rect = imageView.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;

  const ix = (px - x) / scale;
  const iy = (py - y) / scale;

  const zoomIntensity = 0.0015;
  const nextScale = clamp(scale * Math.exp(-e.deltaY * zoomIntensity), minScale, maxScale);

  x = px - ix * nextScale;
  y = py - iy * nextScale;
  scale = nextScale;

  clampPan();
  apply();
}, { passive: false });


window.addEventListener("resize", () => {
  // keep current scale, but don’t allow it to be below minScale after resize
  scale = Math.max(scale, minScale);
  centerImage();
});


// Functions


function answer(a) {
  nextButton.disabled = false;
  if (gameMode == "single") {
    if (!answered) {
      runs += 1;
      if (a == c_opt) {
        score += 1;
      }

      quizHistory.push(a == c_opt);
      quizAnswers.push(a);

      scoreLabel.innerHTML = "Score: "
        + score.toString() + "/" + runs.toString();
      document.querySelector('#opt-' + a.toString()).style.backgroundColor = "red";
      document.querySelector('#opt-' + c_opt.toString()).style.backgroundColor = "green";
    }
    answered = true;

  }

}



// taxa stuff


async function search() {

  if (searchBox.value == "") {
    clear_results();
  }
  else {

    // search iNat for names
    let inat_response = await fetch("https://api.inaturalist.org/v1/taxa?q=" +
      searchBox.value +
      "&is_active=true&order=desc&order_by=observations_count");

    const inat_json = await inat_response.json();
    let results = inat_json["results"];

    clear_results();

    results.forEach((res, i) => {

      // filter accepted ranks


      searchData[res["name"]] = {
        "rank": res["rank"],
        "commonName": res["matched_term"],
        "iNatID": res["id"]
      }

      let new_result_item = document.createElement('div');
      new_result_item.classList.add('search-item');


      resultListTaxa.appendChild(new_result_item);
      new_result_item.id = "result-" + i;

      let new_titles = document.createElement('div');
      new_result_item.appendChild(new_titles);
      new_titles.classList.add('taxon-title');


      let new_result_title = document.createElement('div');
      new_titles.appendChild(new_result_title);
      new_result_title.classList.add('taxon-title');
      new_result_title.style.cursor = "pointer";



      new_result_title.innerHTML = res["name"];

      let new_result_sub_title = document.createElement('div');
      new_titles.appendChild(new_result_sub_title);
      new_result_sub_title.classList.add('taxon-sub-title');
      new_result_sub_title.style.cursor = "pointer";

      new_result_sub_title.innerHTML = res["matched_term"];

      if (["genus", "species", "subspecies"].includes(res["rank"])) {
        new_result_title.style.fontStyle = "italic";
      }


      new_result_item.addEventListener('click', event => {

        addTaxon(res["id"], res["name"]);

      });
    })
  }
}


function addTaxon(taxonID, taxonName) {


  searchBox.value = "";
  clear_results();


  taxonData[taxonID] = searchData[taxonName];

  let new_taxon_item = document.createElement('div');
  new_taxon_item.classList.add('list-item');


  new_taxon_item.id = "taxon-" + taxonID;

  let new_titles = document.createElement('div');
  new_taxon_item.appendChild(new_titles);
  new_titles.classList.add('taxon-title');

  let new_taxon_title = document.createElement('div');
  new_titles.appendChild(new_taxon_title);
  new_taxon_title.classList.add('taxon-title');


  new_taxon_title.innerHTML = taxonName;
  let new_taxon_sub_title = document.createElement('div');
  new_titles.appendChild(new_taxon_sub_title);
  new_taxon_sub_title.classList.add('taxon-sub-title');

  new_taxon_sub_title.innerHTML = taxonData[taxonID]["commonName"];

  if (["genus", "species", "subspecies"].includes(taxonData[taxonID]["rank"])) {
    new_taxon_title.style.fontStyle = "italic";
  }

  let new_remove_button = document.createElement('img');
  new_remove_button.classList.add("remove-button");
  new_taxon_item.appendChild(new_remove_button);

  new_remove_button.addEventListener('click', event => {
    taxaList.removeChild(new_taxon_item);
    delete taxonData[taxonID];
  });

  new_taxon_item.classList.add('list-item');
  new_taxon_item.id = "taxon-" + taxonID;
  taxaList.appendChild(new_taxon_item);

  toggleMakeQuizButton();
}


function clear_results() {

  resultListTaxa.innerHTML = "";
}


// location stuff

async function search_location() {
  if (searchBoxLocation.value == "") {
    clear_location_results();
  }
  else {
    let location_response = await fetch("https://api.inaturalist.org/v1/places/autocomplete?q=" + searchBoxLocation.value + "&order_by=area");


    const inat_json = await location_response.json();
    let results = inat_json["results"];


    clear_location_results();

    results.forEach((res, i) => {
      let new_result_item = document.createElement('div');
      new_result_item.classList.add('search-item');
      new_result_item.id = "location-result-" + i;
      resultListLocation.appendChild(new_result_item);



      let new_result_title = document.createElement('div');
      new_result_item.appendChild(new_result_title);
      new_result_title.classList.add('location-title');

      new_result_title.innerHTML = res["name"];

      new_result_title.addEventListener('click', event => {
        addLocation(res["id"], res["name"]);
      });
    });
  }
}


function addLocation(locationID, locationName) {
  searchBoxLocation.value = "";
  clear_location_results();


  console.log("Adding location ID: " + locationID.toString());

  locationData.push(locationID);

  let new_location_item = document.createElement('div');
  new_location_item.classList.add('list-item');
  new_location_item.id = "location-" + locationID;


  let new_location_title = document.createElement('div');
  new_location_item.appendChild(new_location_title);
  new_location_title.classList.add('location-title');

  new_location_title.innerHTML = locationName;

  let new_remove_button = document.createElement('img');
  new_remove_button.classList.add("remove-button");
  new_location_item.appendChild(new_remove_button);

  new_remove_button.addEventListener('click', event => {
    locationList.removeChild(new_location_item);
    locationData = locationData.filter(id => id !== locationID);

  });
  console.log(locationList);
  locationList.appendChild(new_location_item);

  toggleMakeQuizButton();
}


function clear_location_results() {
  resultListLocation.innerHTML = "";
}


// quiz stuff

async function makeQuiz() {


  buttonQuiz.disabled = false;

  loading("show");

  if (mq.matches) {
    showQuiz();
  }

  console.log(taxonData);

  console.log(locationData[0]);

  // reset vars
  quizHistory = [];
  quizAnswers = [];
  quizOptions = [];
  quizData = [];
  optionsData = [];
  ObsData = [];
  ObsData_photo = [];
  ObsData_audio = [];
  obsMediaTypes = [];
  species_pool = [];
  let species_pool_audio = [];
  species_pool_audio_ids = [];
  taxon_pool = [];
  c_index = 0;
  score = 0;
  runs = 0;
  photo_index = 0;
  audio_index = 0;




  // hide quiz
  summaryView.style.display = "none";
  scoreLabel.style.display = "none";
  imageView.innerHTML = "";


  // rest score label
  document.querySelector('.score-label').innerHTML = "Score: "
    + score.toString() + "/" + runs.toString();



  // loop through taxonData
  for (const taxonID in taxonData) {
    console.log(taxonData[taxonID]["iNatID"]);
    console.log("Months selected for query:");
    console.log(months.map((m, i) => m ? (i + 1).toString() : null).filter(m => m !== null).toString());

    console.log("Media selected for query:");

    const params = new URLSearchParams({
      taxon_id: String(taxonData[taxonID].iNatID),
      place_id: String(locationData),
      captive: "false",
      rank: "species",
      photos: "true",
      month: months.map((m, i) => m ? (i + 1).toString() : null).filter(m => m !== null).toString(),
      quality_grade: "research",
      include_ancestors: "false",
      expected_nearby: "true",
      order_by: "observations_count",
      order: "desc",
      per_page: "400",
      page: "1"
    });

    const url = `https://api.inaturalist.org/v1/observations/species_counts?${params.toString()}`;
    const inat_response = await fetch(url);
    const data = await inat_response.json();
    console.log(data);

    data["results"].forEach((res, i) => {
      console.log("Adding species ID to pool: " + res["taxon"]["id"].toString());
      species_pool.push(res["taxon"]["id"]);
      species_pool_audio.push(res["taxon"]["name"]);
      species_pool_audio_ids.push(res["taxon"]["id"]);
      taxon_pool.push(res["taxon"]);
    });

  }

  console.log("Initial species pool size: " + species_pool.length.toString());


  console.log("Species pool:");
  console.log(species_pool);

  species_pool = Array.from(new Set(species_pool)); // remove duplicates

  // shuffle species pool
  // get shuffle indices
  let shuffle_indices = Array.from(Array(species_pool.length).keys());
  shuffle_indices = shuffle_indices.sort(() => Math.random() - 0.5);

  species_pool = shuffle_indices.map(i => species_pool[i]);
  species_pool_audio = shuffle_indices.map(i => species_pool_audio[i]);
  species_pool_audio_ids = shuffle_indices.map(i => species_pool_audio_ids[i]);

  species_pool = species_pool.slice(0, n_questions); // limit to n_questions species
  species_pool_audio = species_pool_audio.slice(0, n_questions);
  species_pool_audio_ids = species_pool_audio_ids.slice(0, n_questions);

  let species_pool_photo = species_pool;


  // if both media types are selected, split the species pool into two to ensure
  // enough media for each (will be further limited in get_observations functions
  // if there aren't enough with both media types)
  if (media_photo & media_audio) {
    species_pool_photo = species_pool.slice(0, Math.floor(n_questions / 2));
    species_pool_audio = species_pool_audio.slice(Math.floor(n_questions / 2), n_questions);
    species_pool_audio_ids = species_pool_audio_ids.slice(Math.floor(n_questions / 2), n_questions);
  }

  if (media_photo) {
    species_pool = species_pool_photo;
    await get_observations();
  }
  if (media_audio) {
    species_pool = species_pool_audio;
    console.log(species_pool.length.toString() + " species in audio pool");
    await get_observations_XC();
  }


  console.log("Observations loaded:");


  ObsData = ObsData.concat(ObsData_photo);
  ObsData = ObsData.concat(ObsData_audio);


  // randomize ObsData
  ObsData = ObsData.sort(() => Math.random() - 0.5);
  console.log(ObsData);

  const seen = new Set(quizData.map(item => item["taxon.id"]));


  for (const [i, obs] of ObsData.entries()) {


    const obsId = obs["taxon.id"];

    if (seen.has(obsId)) {
      continue; // Skip duplicate
    }
    // add to seen set
    seen.add(obsId);



    let start_offset = 2;
    obs["answer"] = taxon_pool.find(t => t.id === obs["taxon.id"]); // default answer is species, will be overwritten if quizRank is higher
    if (quizRank != "species") {

      const ancestors = obs["answer"].ancestors; // may be undefined
      ancestors.reverse();
      ancestors?.forEach((ancestor, i) => {
        console.log("Ancestor rank: " + ancestor["rank"]);
        if (quizRank == ancestor["rank"]) {
          start_offset = i + 2;
          obs["answer"] = ancestor;
        }
      });

    }




    quizData.push([obs]);

    console.log("Start offset for higher rank data: " + start_offset.toString());
    // get higher rank data for options
    let higher_rank_data = await load_higher_rank_data(start_offset, obs);

    let contains_answer = false;
    for (const higher_rank_obs of higher_rank_data) {
      if (higher_rank_obs["id"] == obs["answer"]["id"]) {
        contains_answer = true;
        break;
      }
    }

    if (!contains_answer) {
      let random_index = Math.floor(Math.random() * higher_rank_data.length);
      higher_rank_data[random_index] = obs["answer"];
    }

    optionsData.push(higher_rank_data);



    // console.log(quizData.length.toString() + " questions loaded.");

  }


  await buildQuiz();



  playMenu.style.display = "block";


}



export async function buildQuiz() {

  // console.log(quizData);
  quizData.forEach((obs, i) => {
    console.log(obs);
    console.log("==================================");
    if (obs[0]["media_type"] == "photo") {
      let new_image = document.createElement('img');
      new_image.classList.add('image-view-item');
      new_image.src = obs[0]["photos"][0]["url"].replace("square", "large");
      console.log(new_image.src);
      imageView.prepend(new_image);
    }
    else if (obs[0]["media_type"] == "audio") {
      console.log(obs);
      let new_spectrogram = document.createElement('img');
      new_spectrogram.classList.add('spectrogram');
      console.log(obs[0]["sono"]["full"]);
      new_spectrogram.src = obs[0]["sono"]["full"];
      spectrogramView.prepend(new_spectrogram);
    }
  });

  await updateLanguage();

  loading("hide");





}





export async function nextQuestion() {

  if (!answered) {
    nextButton.disabled = true;
  }


  console.log("Current question index: " + c_index.toString());
  console.log(quizData.length.toString() + " total questions.");

  quizContainer.style.display = "block";
  imageView.style.display = "flex";
  spectrogramView.style.display = "flex";
  controlsContainer.style.display = "block";
  obs_metadata_container.style.display = "flex";

  scoreLabel = document.querySelector('.score-label');
  if (gameMode == "multi") {
    scoreLabel.style.display = "none";
    scorePlayer.style.display = "block";
    scoreOpponent.style.display = "block";
    questionCounter.style.display = "block";
    if (c_index < quizData.length) {
      questionCounter.textContent = `${c_index + 1}/${quizData.length}`;
    }
  }
  else {
    scoreLabel.style.display = "block";
    scorePlayer.style.display = "none";
    scoreOpponent.style.display = "none";
    questionCounter.style.display = "none";
  }
  nextButton.innerHTML = "Next";

  if (c_index >= quizData.length) {
    console.log("Quiz finished, showing summary.");
    summary();
    return;
  }


  answered = false;


  // set options

  let options = [];
  let k = 0;

  console.log("Option data:");
  console.log(optionsData[c_index]);


  while (options.length < 4) {
    let r_option = optionsData[c_index][k];
    console.log("Random option:");
    console.log(r_option);
    options.push(r_option);
    console.log("current_data")
    console.log(quizData[c_index]);
    if (r_option["id"] == quizData[c_index][0]["answer"]["id"]) {
      console.log("Found correct answer in options at index: " + k.toString());
      c_opt = options.length - 1;
    }
    k += 1;
  }

  console.log("c_opt: " + c_opt.toString());

  quizOptions.push(options);

  console.log("Options:");
  console.log(options);


  // set option buttons
  optionButtons.forEach((button, j) => {
    button.innerHTML = "";
    let new_scientific_name_span = document.createElement('span');
    let new_common_name_span = document.createElement('span');
    new_scientific_name_span.innerHTML = options[j]["name"];
    new_common_name_span.innerHTML = options[j]["preferred_common_name"];
    button.appendChild(new_scientific_name_span);
    button.appendChild(new_common_name_span);
  });


  if (quizData[c_index][0]["media_type"] == "photo") {
    obs_metadata_container.innerHTML = "Observer: " + quizData[c_index][0]["user"]["name"] +
      " | Location: " + quizData[c_index][0]["place_guess"] +
      " | Date: " + new Date(quizData[c_index][0]["observed_on"]).toLocaleDateString();
  }
  console.log(obsMediaTypes);
  console.log(obsMediaTypes[c_index]);
  if (quizData[c_index][0]["media_type"] == "photo") {
    showImage(c_index);
    photo_index += 1;
  } else if (quizData[c_index][0]["media_type"] == "audio") {
    showAudio(c_index);
    audio_index += 1;
  }

  c_index += 1;



  if (c_index >= quizData.length) {
    nextButton.innerHTML = "Finish";
  }
  else {
    nextButton.innerHTML = "Next";
  }



}



async function load_higher_rank_data(rank, obs) {
  console.log(obs);
  console.log(obs["taxon.id"].toString());
  console.log("Loading rank: " + rank.toString());

  let obs_taxon = taxon_pool.find(t => t.id === obs["taxon.id"])
  let higher_rank_id = obs_taxon["ancestor_ids"][obs_taxon["ancestor_ids"].length - rank];

  console.log("Higher rank ID: " + higher_rank_id.toString());

  const params = new URLSearchParams({
    taxon_id: String(higher_rank_id),
    place_id: String(locationData),
    captive: "false",
    rank: "species",
    expected_nearby: "true",
    order_by: "observations_count",
    include_ancestors: "true",
    order: "desc",
    per_page: "80",
    page: "1"
  });

  const url = `https://api.inaturalist.org/v1/observations/species_counts?${params.toString()}`;
  const inat_response = await fetch(url);
  const data = await inat_response.json();
  console.log(data);

  const higher_rank_data = data["results"];
  console.log(higher_rank_data.length.toString() + " entries found at rank " + rank.toString());


  let options_taxa = [];
  let options_taxa_ids = [];
  higher_rank_data.forEach((res, i) => {
    if (quizRank == "species") {
      if (!options_taxa_ids.includes(res["taxon"]["id"]) && res["taxon"]["id"] != obs["answer"]["id"]) {
        options_taxa.push(res["taxon"]);
        options_taxa_ids.push(res["taxon"]["id"]);
      }
      return;
    }
    res["taxon"]["ancestors"].forEach((ancestor, j) => {
      console.log("Ancestor rank: " + ancestor["rank"]);
      if (ancestor["rank"] == quizRank && !options_taxa_ids.includes(ancestor["id"]) && ancestor["id"] != obs["answer"]["id"]) {
        options_taxa.push(ancestor);
        options_taxa_ids.push(ancestor["id"]);
      }
    });
  });

  console.log("Options taxa at rank " + quizRank + ":==============");
  console.log(options_taxa);

  if (options_taxa.length < n_options) {
    console.log("Not enough data, loading next rank");
    return await load_higher_rank_data(rank + 1, obs);
  }

  console.log("Loaded rank: " + rank.toString() + " with " + higher_rank_data.length.toString() + " entries.");
  // pick n_options random entries
  let higher_rank_data_final = [];
  let used_indices = [];
  while (higher_rank_data_final.length < n_options) {
    let r = Math.floor(Math.random() * options_taxa.length);
    if (!used_indices.includes(r)) {
      higher_rank_data_final.push(options_taxa[r]);
      used_indices.push(r);
    }
  }

  return higher_rank_data_final;

}


function showImage(index) {
  console.log("Setting image to index: " + index.toString());
  for (let child of imageView.children) {
    child.style.opacity = '0';
  }
  console.log(Array.from(imageView.children).reverse()[photo_index]);
  Array.from(imageView.children).reverse()[photo_index].style.opacity = '1';

  currentImage = Array.from(imageView.children).reverse()[photo_index];

  imageView.style.display = "block";
  audioView.style.display = "none";
  console.log("Current image set:");
  console.log(currentImage);
  // reset zoom and pan
  // wait a frame to ensure the image is fully loaded

  whenImageReady(currentImage, initView);
}



async function summary() {

  console.log("Quiz finished!");
  imageView.style.display = "none";
  controlsContainer.style.display = "none";

  obs_metadata_container.style.display = "none";

  summaryView.style.display = "block";

  // reset the scroll
  summaryView.scrollTop = 0;

  summaryView.innerHTML = "";

  if (gameMode == "single") {

    for (let i = 0; i < quizData.length; i++) {
      let summary_item = document.createElement('div');
      summary_item.classList.add('summary-item');

      summaryView.appendChild(summary_item);

      let question_number = document.createElement('div');
      question_number.classList.add('question-number');
      question_number.innerHTML = (i + 1).toString() + ".";
      summary_item.appendChild(question_number);


      if (quizData[i][0]["media_type"] == "photo") {

        let summary_image = document.createElement('img');
        summary_image.classList.add('summary-image');
        summary_image.src = quizData[i][0]["photos"][0]["url"].replace("square", "large");
        summary_item.appendChild(summary_image);

        summary_image.addEventListener('click', event => {
          window.open("https://www.inaturalist.org/observations/" + quizData[i][0]["id"].toString(), '_blank');
        });

      }

      let summary_text_container = document.createElement('div');
      summary_text_container.classList.add('summary_text_container');
      summary_item.appendChild(summary_text_container);

      let summary_text_container_box_wrong = makeSummaryBox(i, "correct");

      summary_text_container.appendChild(summary_text_container_box_wrong);

      if (!quizHistory[i]) {

        let summary_text_container_box_wrong = makeSummaryBox(i, "wrong", quizAnswers);

        summary_text_container.appendChild(summary_text_container_box_wrong);



      }
    }
  }

  else if (gameMode == "multi") {
    console.log("Quiz finished, showing multiplayer summary.");
    console.log("quizData:");
    console.log(quizData);
    console.log("quizHistory:");
    console.log(quizHistory);
    console.log("quizHistoryOpponent:");
    console.log(quizHistoryOpponent);
    console.log("quizAnswers:");
    console.log(quizAnswers);
    console.log("quizAnswersOpponent:");
    console.log(quizAnswersOpponent);


    for (let i = 0; i < quizData.length; i++) {

      console.log("Rendering summary for question " + (i).toString());

      let summary_item = document.createElement('div');
      summary_item.classList.add('summary-item');

      summaryView.appendChild(summary_item);

      let question_number = document.createElement('div');
      question_number.classList.add('question-number');
      question_number.innerHTML = (i + 1).toString() + ".";
      summary_item.appendChild(question_number);


      if (quizData[i][0]["media_type"] == "photo") {

        let summary_image = document.createElement('img');
        summary_image.classList.add('summary-image');
        summary_image.src = quizData[i][0]["photos"][0]["url"].replace("square", "large");
        summary_item.appendChild(summary_image);

        summary_image.addEventListener('click', event => {
          window.open("https://www.inaturalist.org/observations/" + quizData[i][0]["id"].toString(), '_blank');
        });

      }

      let summary_text_container = document.createElement('div');
      summary_text_container.classList.add('summary_text_container');
      summary_item.appendChild(summary_text_container);

      let summary_text_container_wrong = document.createElement('div');
      summary_text_container_wrong.classList.add('summary_wrong_text_container');
      summary_text_container.appendChild(summary_text_container_wrong);

      let summary_text_container_box = makeSummaryBox(i, "correct");

      summary_text_container_wrong.before(summary_text_container_box);

      if (!quizHistory[i]) {

        let summary_text_container_box_wrong = makeSummaryBox(i, "wrong", quizAnswers);

        summary_text_container_wrong.appendChild(summary_text_container_box_wrong);

        // sizing
        if (quizHistoryOpponent[i]) {
            summary_text_container_box_wrong.style.width = "50%";
            summary_text_container_box_wrong.style.marginRight = "auto";  
            summary_text_container_box_wrong.style.marginLeft = "0";   
        }

      }

      if (!quizHistoryOpponent[i]) {
        if (quizHistory[i] || quizOptions[i][quizAnswers[i]]["name"] != quizOptions[i][quizAnswersOpponent[i]]["name"]) {
          let summary_text_container_box_wrong = makeSummaryBox(i, "wrong", quizAnswersOpponent);

          summary_text_container_wrong.appendChild(summary_text_container_box_wrong);

          // sizing
          if (quizHistory[i]) {
            summary_text_container_box_wrong.style.width = "50%";
            summary_text_container_box_wrong.style.marginLeft = "auto";  
            summary_text_container_box_wrong.style.marginRight = "0";      
            
          }

        }

      }
    }
  }
}

function makeSummaryBox(index, type, quizAnswers) {


  let summary_text_container_box = document.createElement('div');
  if (type == "correct") {
    summary_text_container_box.classList.add('summary-text-box-right');
  } else {
    summary_text_container_box.classList.add('summary-text-box-wrong');
  }

  let summary_text = document.createElement('div');
  if (type == "correct") {
    summary_text.classList.add('summary-text-right');
  } else {
    summary_text.classList.add('summary-text-wrong');
  }
  let new_scientific_name_span = document.createElement('span');
  let new_common_name_span = document.createElement('span');
  if (type == "correct") {
    new_scientific_name_span.innerHTML = quizData[index][0]["answer"]["name"];
    new_common_name_span.innerHTML = quizData[index][0]["answer"]["preferred_common_name"];
  } else {
    new_scientific_name_span.innerHTML = quizOptions[index][quizAnswers[index]]["name"];
    new_common_name_span.innerHTML = quizOptions[index][quizAnswers[index]]["preferred_common_name"];
  }

  summary_text.appendChild(new_scientific_name_span);
  summary_text.appendChild(new_common_name_span);
  summary_text_container_box.appendChild(summary_text);

  // links
  let links_container = document.createElement('div');
  links_container.classList.add('links-container');
  summary_text_container_box.appendChild(links_container);

  let taxon_link_inat = document.createElement('img');
  taxon_link_inat.classList.add('inat-link');
  links_container.appendChild(taxon_link_inat);
  if (type == "correct") {
    taxon_link_inat.addEventListener('click', event => {
      window.open("https://www.inaturalist.org/taxa/" + quizData[index][0]["answer"]["id"], '_blank');
    });
  } else {
    taxon_link_inat.addEventListener('click', event => {
      window.open("https://www.inaturalist.org/taxa/" + quizOptions[index][quizAnswers[index]]["id"], '_blank');
    });
  }

  let taxon_link_wiki = document.createElement('img');
  taxon_link_wiki.classList.add('wiki-link');
  links_container.appendChild(taxon_link_wiki);
  if (type == "correct") {
    taxon_link_wiki.addEventListener('click', event => {
      window.open("https://en.wikipedia.org/wiki/" + quizData[index][0]["answer"]["name"], '_blank');
    });
  } else {
    taxon_link_wiki.addEventListener('click', event => {
      window.open("https://en.wikipedia.org/wiki/" + quizOptions[index][quizAnswers[index]]["name"], '_blank');
    });
  }

  let taxon_link_ecosia = document.createElement('img');
  taxon_link_ecosia.classList.add('ecosia-link');
  links_container.appendChild(taxon_link_ecosia);
  if (type == "correct") {
    taxon_link_ecosia.addEventListener('click', event => {
      window.open("https://www.ecosia.org/search?q=" + quizData[index][0]["taxon"]["name"], '_blank');
    });
  } else {
    taxon_link_ecosia.addEventListener('click', event => {
      window.open("https://www.ecosia.org/search?q=" + quizOptions[index][quizAnswers[index]]["name"], '_blank');
    });
  }

  return summary_text_container_box;
}


async function get_observations(page_number = 1) {

  if (page_number > max_searches) {
    console.log("Max searches reached, moving on.");
    return;
  }

  // loop through true media types and fetch observations for each until we have enough observations to fill the quiz



  const params = new URLSearchParams({
    captive: "false",
    identified: "true",
    introduced: "false",
    photos: "true",
    verifiable: "true",
    rank: "species",
    taxon_id: species_pool.toString(),
    per_page: "300",
    quality_grade: "research",
    order: "desc",
    order_by: "random",
    only_id: "false",
    locale: language,
    page: page_number.toString()
  });





  let inat_response = await fetch("https://api.inaturalist.org/v1/observations?" + params.toString());
  const inat_json = await inat_response.json();


  let results = inat_json["results"];



  let pool_size_before = species_pool.length;
  results = results.sort(() => Math.random() - 0.5);
  for (const obs of results) {
    console.log("Observation taxon ID: " + obs["taxon"]["id"].toString());
    if (species_pool.includes(obs["taxon"]["id"])) {
      console.log("adding");
      obs["media_type"] = "photo";
      obs["taxon.id"] = obs["taxon"]["id"];
      ObsData_photo.push(obs);
      species_pool = species_pool.filter(id => id !== obs["taxon"]["id"]);
    }
  }

  let delta_pool = pool_size_before - species_pool.length;
  console.log(species_pool.length.toString() + " species left in pool after fetching observations.");


  if (delta_pool > 0) {
    await get_observations(page_number + 1);
  }
  return;
}

async function get_observations_XC() {

  const key = 'be0e6193ffefe2253d001494bd63aaa64133ff6d';


  for (const [i, species] of species_pool.entries()) {
    const url =
      `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(`sp:"${species}"`)}&key=${encodeURIComponent(key)}`;

    const res = await fetch(url);
    const data = await res.json();

    let recordings = data.recordings;
    recordings = recordings.sort(() => Math.random() - 0.5); // shuffle recordings

    console.log("Xeno-Canto data:");
    console.log(data);

    if (recordings.length == 0) {
      console.log("No recordings found for species: " + species);
      continue;
    }

    recordings[0]["taxon.id"] = species_pool_audio_ids[i];
    recordings[0]["media_type"] = "audio";
    ObsData_audio.push(recordings[0]);





  }
}


function loading(action) {
  if (action == "hide") {
    loadingContainer.style.display = "none";
    return;
  }

  if (action == "show") {
    loadingContainer.style.display = "block";
  }

}




// 1) Your supported locale tags (curate this list, or load it from a small JSON file)
const SUPPORTED_LOCALES = [
  "en", "sv", "pl", "de", "fr", "es", "pt-BR", "it", "nl", "fi", "da", "nb", "cs", "hu", "ja", "ko", "zh-Hans", "zh-Hant", "ru", "tr", "ar", "he", "vi", "id", "th", "ro", "el", "sr", "hr", "sk", "sl", "bg", "lt", "lv", "et", "uk", "fa", "hi", "bn", "ta", "te", "ml", "kn", "mr", "gu", "pa", "sw", "zu"
];

// Basic normalization for search (case-insensitive, strip diacritics)
function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Build display objects once, cache them
function buildLanguageOptions(locales, uiLocale = "en") {
  const dnUI = new Intl.DisplayNames([uiLocale], { type: "language" });

  return locales.map(tag => {
    // "Swedish" (in UI locale)
    const label = dnUI.of(tag) || tag;

    // Native-ish label: ask the language to name itself
    // (Works well for base languages; for regional tags it varies by engine)
    const dnNative = new Intl.DisplayNames([tag], { type: "language" });
    const nativeLabel = dnNative.of(tag) || label;

    const searchKey = norm([tag, label, nativeLabel].join(" "));

    return { tag, label, nativeLabel, searchKey };
  }).sort((a, b) => a.label.localeCompare(b.label));
}

function filterLanguageOptions(options, query) {
  const q = norm(query);
  if (!q) return options;
  return options.filter(o => o.searchKey.includes(q));
}





const uiLocale = "en"; // language of *your UI*
const options = buildLanguageOptions(SUPPORTED_LOCALES, uiLocale);




function render(list) {
  languageSelect.innerHTML = "";
  for (const o of list) {
    const opt = document.createElement("option");
    opt.classList.add("language-option");
    opt.innerHTML = `${capitalize(o.nativeLabel)}`;

    opt.addEventListener("click", async () => {
      await select_language(o.tag);
      languageSelect.innerHTML = "";
      languageSearchBox.value = "";
      languageDropdown.style.display = "none";
      languageIndicator.textContent = capitalize(o.nativeLabel);
    });

    languageSelect.appendChild(opt);
  }
}



languageSelect.addEventListener("change", async () => {
  const selectedLocale = languageSelect.value; // e.g., "sv"
  // Persist preference
  localStorage.setItem("inat_locale", selectedLocale);

  // Example: re-fetch taxa in the selected locale
  // await refreshTaxaNames(selectedLocale);
});







function search_language() {
  if (languageSearchBox.value == "") {
    languageSelect.innerHTML = "";
    return;
  }
  render(filterLanguageOptions(options, languageSearchBox.value));

}

async function select_language(lang) {
  console.log("Selected language: " + lang);
  language = lang;
  await updateLanguage();
}


async function updateLanguage() {
  // implement later

  // update quizData with preferred common names in selected language
  let ids = [];
  for (let i = 0; i < quizData.length; i++) {
    ids.push(quizData[i][0]["answer"]["id"]);
  }

  if (ids.length > 0) {

    let results = await fetchTaxaByIds(ids, language);

    console.log("Updating quiz taxa with language: " + language);
    console.log(results);

    results.forEach((res, i) => {
      console.log("Updating taxon ID: " + res["id"].toString());
      for (let j = 0; j < quizData.length; j++) {
        if (quizData[j][0]["answer"]["id"] == res["id"]) {
          quizData[j][0]["answer"]["preferred_common_name"] = res["preferred_common_name"];
        }
      }
    });
  }

  ids = [];

  // update optionsData with preferred common names in selected language
  for (let i = 0; i < optionsData.length; i++) {
    for (let j = 0; j < optionsData[i].length; j++) {
      ids.push(optionsData[i][j]["id"]);
    }

  }

  console.log("Option IDs to update:");
  console.log(ids);

  if (ids.length > 0) {
    let results = await fetchTaxaByIds(ids, language);

    console.log("Updating option taxa with language: " + language);
    console.log(results);

    ids.forEach((id) => {
      for (let i = 0; i < optionsData.length; i++) {
        for (let k = 0; k < optionsData[i].length; k++) {
          if (optionsData[i][k]["id"] == id) {
            let res = results.find(r => r.id === id);
            if (res) {
              optionsData[i][k]["preferred_common_name"] = res["preferred_common_name"];
            }
          }
        }
      }
    });

  }

  if (c_index > 0) {
    // set option buttons
    c_index -= 1; // adjust index to match optionsData
    if (quizData[c_index][0]["media_type"] == "photo") {
      photo_index -= 1; // adjust index to match imageView children
    }
    else if (quizData[c_index][0]["media_type"] == "audio") {
      audio_index -= 1; // adjust index to match spectrogramView children
    }
    await nextQuestion(); // refresh current question to update option names

  }

  if (summaryView.style.display == "block") {
    await summary(); // refresh summary
  }

}


async function fetchTaxaByIds(taxonIds, locale) {

  const ids = taxonIds.join(",");
  const params = new URLSearchParams(
    {
      id: ids,
      locale: locale,
      per_page: "100"

    }
  );
  console.log("Fetching taxa by IDs:");
  console.log(ids);
  console.log("With locale:");
  console.log(locale);
  const url = `https://api.inaturalist.org/v1/taxa?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iNat error ${res.status}`);
  const json = await res.json();
  return json.results;
}


function capitalize(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}


function setRank(i) {
  quizRank = acceptedRanks[i];
  console.log("Set quiz rank to: " + quizRank);
  rankButtons.forEach((button) => {
    button.classList.add('rank-button');
  });
  let previousSelected = document.querySelector('.rank-button-selected');
  if (previousSelected) {
    previousSelected.classList.remove('rank-button-selected');
    previousSelected.classList.add('rank-button');
  }
  rankButtons[i].classList.remove('rank-button');
  rankButtons[i].classList.add('rank-button-selected');
}
1

function apply() {
  currentImage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}


function centerImage() {
  if (!currentImage) return;

  const vw = imageView.clientWidth;
  const vh = imageView.clientHeight;
  const iw = currentImage.naturalWidth;
  const ih = currentImage.naturalHeight;

  x = (vw - iw * scale) / 2;
  y = (vh - ih * scale) / 2;
  apply();
}

function initView() {
  let vw = imageView.clientWidth;
  let vh = imageView.clientHeight;
  let iw = currentImage.naturalWidth;
  let ih = currentImage.naturalHeight;

  console.log(`Image size: ${iw}x${ih}, View size: ${vw}x${vh}`);
  // Option A: keep original size
  // scale = 1;

  // Option B (common): fit whole image inside imageView ("contain")
  scale = Math.min(vw / iw, vh / ih);

  minScale = scale;      // <-- prevents zooming out below initial level
  centerImage();
}

function clampPan() {
  const vw = imageView.clientWidth;
  const vh = imageView.clientHeight;
  const iw = currentImage.naturalWidth * scale;
  const ih = currentImage.naturalHeight * scale;

  // X axis
  if (iw <= vw) {
    x = (vw - iw) / 2;                 // center if image narrower
  } else {
    const minX = vw - iw;
    const maxX = 0;
    x = clamp(x, minX, maxX);
  }

  // Y axis
  if (ih <= vh) {
    y = (vh - ih) / 2;                 // center if image shorter
  } else {
    const minY = vh - ih;
    const maxY = 0;
    y = clamp(y, minY, maxY);
  }
}

function whenImageReady(img, fn) {
  if (img.complete && img.naturalWidth > 0) {
    fn(); // already loaded (often from cache)
  } else {
    img.addEventListener("load", fn, { once: true });
    img.addEventListener("error", () => {
      console.error("Image failed to load:", img.src);
    }, { once: true });
  }
}


function toggleMedia(i) {
  let button = photoMediaButton;
  if (i == 1) {
    button = audioMediaButton;
  }
  if (!button.classList.contains('media-button-selected')) {
    button.classList.remove('media-button');
    button.classList.add('media-button-selected');
  }
  else {
    button.classList.remove('media-button-selected');
    button.classList.add('media-button');
  }
  if (i == 0) {
    media_photo = !media_photo;
    console.log("Media photo set to: " + media_photo.toString());
  }
  else if (i == 1) {
    media_audio = !media_audio;
    console.log("Media audio set to: " + media_audio.toString());
  }
}







function setMonth(i) {
  console.log("Toggling month: " + (i + 1).toString());
  if (!months[i]) {
    monthButtons[i].classList.remove('month-button');
    monthButtons[i].classList.add('month-button-selected');
  }
  else {
    monthButtons[i].classList.remove('month-button-selected');
    monthButtons[i].classList.add('month-button');
  }

  months[i] = !months[i];
  console.log("Months selected:");
  console.log(months);

}

// Initial setup
setRank(3);

function toggleMakeQuizButton() {
  console.log("Toggling Make Quiz button. Taxon data count: " + Object.keys(taxonData).length.toString() + ", Location data count: " + locationData.length.toString());
  if (Object.keys(taxonData).length > 0 && locationData.length > 0) {
    makeQuizButton.disabled = false;
  }
  else {
    makeQuizButton.disabled = true;
  }
  console.log("Make Quiz button disabled: " + makeQuizButton.disabled.toString());
}


const body = document.body;

const buttonFilters = document.getElementById("button-filters");
const buttonQuiz = document.getElementById("button-quiz");
const buttonMultiplayer = document.getElementById("button-multiplayer");

const mq = window.matchMedia("(max-aspect-ratio: 1/1)");
console.log("Initial media query match: " + mq.matches.toString());
function closePanels() {
  body.classList.remove("show-filters", "show-settings");
}

function showFilters() {
  body.classList.add("show-filters");
  body.classList.remove("show-quiz");
  body.classList.remove("show-multiplayer");
  buttonFilters.classList.add("toolbar-btn-selected");
  buttonQuiz.classList.remove("toolbar-btn-selected");
  buttonQuiz.classList.add("toolbar-btn");
  buttonMultiplayer.classList.remove("toolbar-btn-selected");
  buttonMultiplayer.classList.add("toolbar-btn");
  buttonFilters.classList.remove("toolbar-btn");

}

function showQuiz() {
  body.classList.add("show-quiz");
  body.classList.remove("show-filters");
  body.classList.remove("show-multiplayer");
  buttonQuiz.classList.add("toolbar-btn-selected");
  buttonFilters.classList.remove("toolbar-btn-selected");
  buttonFilters.classList.add("toolbar-btn");
  buttonMultiplayer.classList.remove("toolbar-btn-selected");
  buttonMultiplayer.classList.add("toolbar-btn");
  buttonQuiz.classList.remove("toolbar-btn");
}


function showMultiplayer() {
  body.classList.add("show-quiz");
  body.classList.add("show-multiplayer");
  body.classList.remove("show-filters");
  buttonMultiplayer.classList.add("toolbar-btn-selected");
  buttonFilters.classList.remove("toolbar-btn-selected");
  buttonFilters.classList.add("toolbar-btn");
  buttonQuiz.classList.remove("toolbar-btn-selected");
  buttonQuiz.classList.add("toolbar-btn");
  buttonMultiplayer.classList.remove("toolbar-btn");
}

buttonFilters?.addEventListener("click", showFilters);
buttonQuiz?.addEventListener("click", showQuiz);
buttonMultiplayer?.addEventListener("click", showMultiplayer);


// close panels when switching to desktop
mq.addEventListener("change", (e) => {
  if (!e.matches) closePanels();
});

// optional: ESC closes
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePanels();
});













// Spectrogram viewer logic

const audio = document.getElementById("audio");
const viewer = document.getElementById("viewer");
const specWrap = document.getElementById("specWrap");
const playhead = document.getElementById("playhead");
const clickLine = document.getElementById("clickLine");

let zoom = 1;
let activeSpectrogramId = null;
const spectrograms = new Map();

let rafId = null;
let isScrubbing = false;



function getBaseImageWidth() {
  if (!currentSpectrogram) return 1;
  return currentSpectrogram.naturalWidth || 1;
}

function getScaledWidth() {
  return getBaseImageWidth() * zoom;
}

function syncActiveSpectrogramLayout() {

  const width = getScaledWidth();

  currentSpectrogram.style.width = `${width}px`;
  spectrogramView.style.width = `${width}px`;
  specWrap.style.width = `${width}px`;
}

function applyZoom(newZoom, anchorClientX = null) {
  const oldWidth = getScaledWidth();
  const oldScrollLeft = viewer.scrollLeft;

  if (anchorClientX == null) {
    anchorClientX = viewer.clientWidth / 2;
  }

  const anchorContentX = oldScrollLeft + anchorClientX;

  zoom = Math.max(1, Math.min(8, newZoom));

  syncActiveSpectrogramLayout();

  const newWidth = getScaledWidth();
  const ratio = newWidth / oldWidth;

  viewer.scrollLeft = anchorContentX * ratio - anchorClientX;

  updatePlayhead();
}

function timeToX(time) {
  const duration = audio.duration;
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return (time / duration) * getScaledWidth();
}

function xToTime(x) {
  const duration = audio.duration;
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  const width = getScaledWidth();
  const clampedX = Math.max(0, Math.min(x, width));

  return (clampedX / width) * duration;
}

function updatePlayhead() {
  const x = timeToX(audio.currentTime);
  playhead.style.left = `${x}px`;
}

function autoScrollToPlayheadSmooth() {
  const x = timeToX(audio.currentTime);

  // keep playhead around 35% from the left edge
  const targetScrollLeft = Math.max(0, x - viewer.clientWidth * 0.35);

  // ease toward target instead of jumping
  const current = viewer.scrollLeft;
  const diff = targetScrollLeft - current;

  // smaller = smoother but slower, bigger = snappier
  viewer.scrollLeft = current + diff * 0.12;
}
function animationLoop() {
  updatePlayhead();
  autoScrollToPlayheadSmooth();

  if (!audio.paused && !audio.ended) {
    rafId = requestAnimationFrame(animationLoop);
  } else {
    rafId = null;
  }
}

function startAnimation() {
  if (rafId == null) {
    rafId = requestAnimationFrame(animationLoop);
  }
}

function stopAnimation() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function seekFromPointerEvent(e) {
  const rect = spectrogramView.getBoundingClientRect();

  // x relative to the full visible spectrogram content element
  const x = e.clientX - rect.left;

  audio.currentTime = xToTime(x);
  updatePlayhead();
  autoScrollToPlayheadSmooth();
}

spectrogramView.addEventListener("pointerdown", (e) => {
  console.log("Spectrogram pointer down at: " + e.clientX.toString() + ", " + e.clientY.toString());
  isScrubbing = true;
  seekFromPointerEvent(e);
});

window.addEventListener("pointermove", (e) => {
  const rect = spectrogramView.getBoundingClientRect();
  const insideX = e.clientX >= rect.left && e.clientX <= rect.right;

  if (insideX) {
    clickLine.style.display = "block";
    clickLine.style.left = `${e.clientX - rect.left}px`;
  } else {
    clickLine.style.display = "none";
  }

  if (isScrubbing) {
    seekFromPointerEvent(e);
  }
});

window.addEventListener("pointerup", () => {
  isScrubbing = false;
});

spectrogramView.addEventListener("dblclick", (e) => {
  console.log("Spectrogram double-click at: " + e.clientX.toString() + ", " + e.clientY.toString());
  e.preventDefault();
  seekFromPointerEvent(e);

  if (audio.paused) audio.play();
  else audio.pause();
});

spectrogramView.addEventListener("mouseleave", () => {
  clickLine.style.display = "none";
});

audio.addEventListener("play", startAnimation);
audio.addEventListener("pause", stopAnimation);
audio.addEventListener("ended", stopAnimation);

audio.addEventListener("loadedmetadata", () => {
  updatePlayhead();
});

audio.addEventListener("seeked", () => {
  updatePlayhead();
});

audio.addEventListener("timeupdate", () => {
  // backup sync only; not used for smooth animation
  updatePlayhead();
});

// optional zoom with ctrl/cmd + wheel
viewer.addEventListener("wheel", (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  e.preventDefault();

  const rect = viewer.getBoundingClientRect();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  applyZoom(zoom * factor, e.clientX - rect.left);
}, { passive: false });


async function showAudio(index) {

  console.log("Setting audio to index: " + index.toString());
  for (let child of spectrogramView.children) {
    child.style.opacity = '0';
  }
  currentSpectrogram = Array.from(spectrogramView.children).reverse()[audio_index];
  currentSpectrogram.style.opacity = '1';
  currentSpectrogram.style.display = "block";

  console.log("Current spectrogram set:");
  console.log(currentSpectrogram);
  // reset zoom and pan
  // wait a frame to ensure the image is fully loaded

  // whenImageReady(currentSpectrogram, initView);
  console.log("Showing audio for question index: " + index.toString());
  console.log(quizData[index][0]["file"]);
  audio.src = quizData[index][0]["file"];

  audioView.style.display = "block";
  imageView.style.display = "none";

  await audio.play();
  syncActiveSpectrogramLayout();
  viewer.scrollLeft = 0;
  updatePlayhead();
  console.log("Audio playback started.");
}