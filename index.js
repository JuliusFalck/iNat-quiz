


// vars
let c_index = 0;

let c_opt = 0;

let score = 0;

let answered = false;

let runs = 0;

let start = 0;

let quizHistory = [];

let n_questions = 12;

const n_options = 4;

let c_species = [];

let searchData = {};

let taxonData = {};

let locationData = [];

let quizData = [];

let ObsData = [];

let optionData = [];

let species_pool = [];

let quizAnswers = [];

let quizOptions = [];

let language = "en";



let quizRank = "species";

const acceptedRanks = ["order", "family", "genus", "species"]


let months = [true, true, true, true, true, true, true, true, true, true, true, true];

let currentImage = null;

let scale = 1;
let minScale = 1;        // <-- will become "initial scale"
const maxScale = 10;
let x = 0, y = 0;

// drag state
let dragging = false;
let startX = 0, startY = 0;
let startTx = 0, startTy = 0;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));






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

let monthButtons = document.querySelectorAll('.month-button-selected');

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


monthButtons.forEach((button, i) => {
  button.addEventListener('click', event => {
    setMonth(i);
  });
});

makeQuizButton.addEventListener('click', event => {
  make_quiz();
});

nextButton.addEventListener('click', event => {
  next_question();
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



imageView.addEventListener("pointerdown", (e) => {
  dragging = true;
  imageView.setPointerCapture(e.pointerId);
  startX = e.clientX;
  startY = e.clientY;
  startTx = x;
  startTy = y;
});

imageView.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  x = startTx + (e.clientX - startX);
  y = startTy + (e.clientY - startY);
  clampPan();
  apply();
});

imageView.addEventListener("pointerup", () => {
  dragging = false;
});

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
  if (!answered) {
    runs += 1;
    if (a == c_opt) {
      score += 1;

    }

    quizHistory.push(a == c_opt);
    quizAnswers.push(a);

    scoreLabel.innerHTML = "Score: "
      + score.toString() + "/" + runs.toString();
    answered = true;
    document.querySelector('#opt-' + a.toString()).style.backgroundColor = "red";
    document.querySelector('#opt-' + c_opt.toString()).style.backgroundColor = "green";
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
}


function clear_location_results() {
  resultListLocation.innerHTML = "";
}


// quiz stuff

async function make_quiz() {

  loading("show");

  console.log(taxonData);

  console.log(locationData[0]);

  // reset vars
  quizHistory = [];
  quizAnswers = [];
  quizOptions = [];
  quizData = [];
  optionData = [];
  ObsData = [];
  species_pool = [];
  c_index = 0;
  score = 0;
  runs = 0;




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
      per_page: "200",
      page: "1"
    });

    const url = `https://api.inaturalist.org/v1/observations/species_counts?${params.toString()}`;
    const inat_response = await fetch(url);
    const data = await inat_response.json();
    console.log(data);

    data["results"].forEach((res, i) => {
      console.log("Adding species ID to pool: " + res["taxon"]["id"].toString());
      species_pool.push(res["taxon"]["id"]);
    });

  }

  console.log("Initial species pool size: " + species_pool.length.toString());


  console.log("Species pool:");
  console.log(species_pool);

  species_pool = Array.from(new Set(species_pool)); // remove duplicates

  // shuffle species pool
  species_pool = species_pool.sort(() => Math.random() - 0.5);
  console.log("Unique species pool size: " + species_pool.length.toString());
  species_pool = species_pool.slice(0, n_questions); // limit to n_questions species


  await get_observations();


  // randomize ObsData
  ObsData = ObsData.sort(() => Math.random() - 0.5);
  console.log(ObsData);

  const seen = new Set(quizData.map(item => item.taxon.id));


  for (const obs of ObsData) {
    const obsId = obs.taxon.id;

    if (seen.has(obsId)) {
      continue; // Skip duplicate
    }
    // add to seen set
    seen.add(obsId);



    let start_offset = 2;
    obs["answer"] = obs["taxon"];
    if (quizRank != "species") {


      const obsTaxonId = obs.community_taxon?.id ?? obs.taxon?.id;

      const taxonWithAncestors =
        obs.identifications?.find(i => i.taxon?.id === obsTaxonId)?.taxon;

      const ancestors = taxonWithAncestors?.ancestors; // may be undefined
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

    optionData.push(higher_rank_data);



    // console.log(quizData.length.toString() + " questions loaded.");

  }


  // console.log(quizData);
  quizData.forEach((obs, i) => {
    let new_image = document.createElement('img');
    new_image.classList.add('image-view-item');
    new_image.src = obs[0]["photos"][0]["url"].replace("square", "large");
    console.log(new_image.src);
    imageView.prepend(new_image);




  });

  await update_language();

  loading("hide");


  imageView.style.display = "flex";
  controlsContainer.style.display = "block";
  obs_metadata_container.style.display = "flex";

  scoreLabel = document.querySelector('.score-label');
  scoreLabel.style.display = "block";
  nextButton.innerHTML = "Next";

  next_question();


  






}


function next_question() {

  c_opt = 100;

  if (c_index >= quizData.length) {
    summary();
    return;
  }


  answered = false;


  // set options

  let options = [];
  let k = 0;

  console.log("Option data:");
  console.log(optionData[c_index]);


  while (options.length < 4) {
    let r_option = optionData[c_index][k];
    console.log("Random option:");
    console.log(r_option);
    options.push(r_option);
    if (r_option["id"] == quizData[c_index][0]["id"]) {
      c_opt = options.length - 1;
    }
    k += 1;
  }

  quizOptions.push(options);

  console.log("Options:");
  console.log(options);


  // set option buttons
  optionButtons.forEach((button, j) => {
    button.innerHTML = "";
    button.style.backgroundColor = "black";
    let new_scientific_name_span = document.createElement('span');
    let new_common_name_span = document.createElement('span');
    new_scientific_name_span.innerHTML = options[j]["name"];
    new_common_name_span.innerHTML = options[j]["preferred_common_name"];
    button.appendChild(new_scientific_name_span);
    button.appendChild(new_common_name_span);
  });


  // set random correct option
  if (c_opt === 100) {
    c_opt = Math.floor(Math.random() * 4);


    let new_scientific_name_span = document.createElement('span');
    let new_common_name_span = document.createElement('span');

    new_scientific_name_span.innerHTML = quizData[c_index][0]["answer"]["name"];
    new_common_name_span.innerHTML = quizData[c_index][0]["answer"]["preferred_common_name"] || "";
    optionButtons[c_opt].innerHTML = "";
    optionButtons[c_opt].appendChild(new_scientific_name_span);
    optionButtons[c_opt].appendChild(new_common_name_span);


  }

  obs_metadata_container.innerHTML = "Observer: " + quizData[c_index][0]["user"]["name"] +
    " | Location: " + quizData[c_index][0]["place_guess"] +
    " | Date: " + new Date(quizData[c_index][0]["observed_on"]).toLocaleDateString();

  setImage(c_index);

  c_index += 1;

  if (c_index >= quizData.length) {
    nextButton.innerHTML = "Finish";
  }



}



async function load_higher_rank_data(rank, obs) {
  console.log(obs["taxon"]["id"].toString());
  console.log("Loading rank: " + rank.toString());

  let higher_rank_id = obs["taxon"]["ancestor_ids"][obs["taxon"]["ancestor_ids"].length - rank];

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


function setImage(index) {
  console.log("Setting image to index: " + index.toString());
  for (let child of imageView.children) {
    child.style.opacity = '0';
  }
  console.log(Array.from(imageView.children).reverse()[index]);
  Array.from(imageView.children).reverse()[index].style.opacity = '1';

  currentImage = Array.from(imageView.children).reverse()[index];

  console.log("Current image set:");
  console.log(currentImage);
  // reset zoom and pan
  // wait a frame to ensure the image is fully loaded

  whenImageReady(currentImage, initView);
}



function summary() {
  console.log("Quiz finished!");
  imageView.style.display = "none";
  controlsContainer.style.display = "none";

  obs_metadata_container.style.display = "none";

  summaryView.style.display = "block";

  // reset the scroll
  summaryView.scrollTop = 0;

  summaryView.innerHTML = "";

  for (let i = 0; i < n_questions; i++) {
    let summary_item = document.createElement('div');
    summary_item.classList.add('summary-item');

    summaryView.appendChild(summary_item);

    let question_number = document.createElement('div');
    question_number.classList.add('question-number');
    question_number.innerHTML = (i + 1).toString() + ".";
    summary_item.appendChild(question_number);

    let observation_link = document.createElement('img');
    observation_link.classList.add('inat-link');
    summary_item.appendChild(observation_link);

    observation_link.addEventListener('click', event => {
      window.open("https://www.inaturalist.org/observations/" + quizData[i][0]["id"].toString(), '_blank');
    });

    let summary_image = document.createElement('img');
    summary_image.classList.add('summary-image');
    summary_image.src = quizData[i][0]["photos"][0]["url"].replace("square", "large");
    summary_item.appendChild(summary_image);

    let summary_text_container = document.createElement('div');
    summary_text_container.classList.add('summary_text_container');
    summary_item.appendChild(summary_text_container);

    let summary_text_container_box = document.createElement('div');
    summary_text_container_box.classList.add('summary-text-box-right');
    summary_text_container.appendChild(summary_text_container_box);

    let summary_text = document.createElement('div');
    summary_text.classList.add('summary-text-right');
    let new_scientific_name_span = document.createElement('span');
    let new_common_name_span = document.createElement('span');
    new_scientific_name_span.innerHTML = quizData[i][0]["answer"]["name"];
    new_common_name_span.innerHTML = quizData[i][0]["answer"]["preferred_common_name"];
    summary_text.appendChild(new_scientific_name_span);
    summary_text.appendChild(new_common_name_span);
    summary_text_container_box.appendChild(summary_text);

    // links
    let taxon_link_inat = document.createElement('img');
    taxon_link_inat.classList.add('inat-link');
    summary_text_container_box.appendChild(taxon_link_inat);
    taxon_link_inat.addEventListener('click', event => {
      window.open("https://www.inaturalist.org/taxa/" + quizData[i][0]["taxon"]["id"], '_blank');
    });
    taxon_link_inat.style.height = "3vh";
    taxon_link_inat.style.width = "3vh";

    let taxon_link_wiki = document.createElement('img');
    taxon_link_wiki.classList.add('wiki-link');
    summary_text_container_box.appendChild(taxon_link_wiki);
    taxon_link_wiki.addEventListener('click', event => {
      window.open("https://en.wikipedia.org/wiki/" + quizData[i][0]["taxon"]["name"], '_blank');
    });

    let taxon_link_ecosia = document.createElement('img');
    taxon_link_ecosia.classList.add('ecosia-link');
    summary_text_container_box.appendChild(taxon_link_ecosia);
    taxon_link_ecosia.addEventListener('click', event => {
      window.open("https://www.ecosia.org/search?q=" + quizData[i][0]["taxon"]["name"], '_blank');
    });


    if (!quizHistory[i]) {
      let summary_text_container_box_wrong = document.createElement('div');
      summary_text_container_box_wrong.classList.add('summary-text-box-wrong');
      summary_text_container.appendChild(summary_text_container_box_wrong);
      let summary_text_wrong = document.createElement('div');
      summary_text_wrong.classList.add('summary-text-wrong');
      let new_scientific_name_span = document.createElement('span');
      let new_common_name_span = document.createElement('span');
      new_scientific_name_span.innerHTML = quizOptions[i][quizAnswers[i]]["name"];
      new_common_name_span.innerHTML = quizOptions[i][quizAnswers[i]]["preferred_common_name"];
      summary_text_wrong.appendChild(new_scientific_name_span);
      summary_text_wrong.appendChild(new_common_name_span);
      summary_text_container_box_wrong.appendChild(summary_text_wrong);

      // links
      let taxon_link_inat = document.createElement('img');
      taxon_link_inat.classList.add('inat-link');
      summary_text_container_box_wrong.appendChild(taxon_link_inat);
      taxon_link_inat.addEventListener('click', event => {
        window.open("https://www.inaturalist.org/taxa/" + quizOptions[i][quizAnswers[i]]["id"], '_blank');
      });
      taxon_link_inat.style.height = "3vh";
      taxon_link_inat.style.width = "3vh";

      let taxon_link_wiki = document.createElement('img');
      taxon_link_wiki.classList.add('wiki-link');
      summary_text_container_box_wrong.appendChild(taxon_link_wiki);
      taxon_link_wiki.addEventListener('click', event => {
        window.open("https://en.wikipedia.org/wiki/" + quizOptions[i][quizAnswers[i]]["name"], '_blank');
      });

      let taxon_link_ecosia = document.createElement('img');
      taxon_link_ecosia.classList.add('ecosia-link');
      summary_text_container_box_wrong.appendChild(taxon_link_ecosia);
      taxon_link_ecosia.addEventListener('click', event => {
        window.open("https://www.ecosia.org/search?q=" + quizOptions[i][quizAnswers[i]]["name"], '_blank');
      });
    }



  }

}


async function get_observations() {

  const params = new URLSearchParams({
    captive: "false",
    identified: "true",
    introduced: "false",
    photos: "true",
    verifiable: "true",
    rank: "species",
    taxon_id: species_pool.toString(),
    per_page: "200",
    quality_grade: "research",
    order: "desc",
    order_by: "created_at",
    only_id: "false"
  });

  let inat_response = await fetch("https://api.inaturalist.org/v1/observations?" + params.toString());
  const inat_json = await inat_response.json();

  let results = inat_json["results"];
  // shuffle results
  results = results.sort(() => Math.random() - 0.5);
  for (const obs of results) {
    console.log("Observation taxon ID: " + obs["taxon"]["id"].toString());
    if (species_pool.includes(obs["taxon"]["id"])) {
      ObsData.push(obs);
      species_pool = species_pool.filter(id => id !== obs["taxon"]["id"]);
    }
  }
  if (species_pool.length > 0) {
    await get_observations();
  }
  return;
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
      languageIndicator.textContent = "Language: " + capitalize(o.nativeLabel);
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
  await update_language();
}


async function update_language() {
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

  // update optionData with preferred common names in selected language
  for (let i = 0; i < optionData.length; i++) {
    for (let j = 0; j < optionData[i].length; j++) {
      ids.push(optionData[i][j]["id"]);
    }

  }

  console.log("Option IDs to update:");
  console.log(ids);

  if (ids.length > 0) {
    let results = await fetchTaxaByIds(ids, language);

    console.log("Updating option taxa with language: " + language);
    console.log(results);

    ids.forEach((id) => {
      for (let i = 0; i < optionData.length; i++) {
        for (let k = 0; k < optionData[i].length; k++) {
          if (optionData[i][k]["id"] == id) {
            let res = results.find(r => r.id === id);
            if (res) {
              optionData[i][k]["preferred_common_name"] = res["preferred_common_name"];
            }
          }
        }
      }
    });

  }

  if (c_index > 0) {
    c_index -= 1;

    next_question(); // refresh current question
  }

  if (summaryView.style.display == "block") {
    summary(); // refresh summary
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


function apply() {
  console.log(`Applying transform: translate(${x}px, ${y}px) scale(${scale})`);
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


function setMonth(i){
  console.log("Toggling month: " + (i+1).toString());
  monthButtons[i].classList.remove('month-button-selected');
  monthButtons[i].classList.add('month-button');

  months[i] = !months[i];
  console.log("Months selected:");
  console.log(months);

}

// Initial setup
setRank(3);

