


// vars
let c_index = 0;

let c_opt = 0;

let score = 0;

let answered = false;

let runs = 0;

let start = 0;

let quizHistory = [];

let n_questions = 6;

let n_options = 4;

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

const acceptedRanks = ["kingdom", "phylum", "class", "order", "family", "genus", "species", "subspecies"]



// Elements

let searchBox = document.querySelector('#search-box');

let resultList = document.querySelector('.result-list');

let taxaList = document.querySelector('#taxa-list');

let clearSearchButton = document.querySelector("#clear-search-button");

let searchBoxLocation = document.querySelector('#search-box-location');

let locationResultList = document.querySelector('.location-result-list');

let clearSearchButtonLocation = document.querySelector("#clear-search-button-location");


let locationList = document.querySelector('#locations-list');

let makeQuizButton = document.querySelector(".make-quiz-button");

let mainBody = document.querySelector('.main-body');

let controlsContainer = document.querySelector('#controls-container');

let imageView = document.querySelector('.image-view');

let nextButton = document.querySelector('.next-button');

let optionButtons = document.querySelectorAll('.option-button');

let summaryView = document.querySelector('.summary-view');

let obs_metadata_container = document.querySelector('.observation-metadata-container');


// Event listeners


searchBox.addEventListener('input', event => {
  search();
})

clearSearchButton.addEventListener('click', event => {
  searchBox.value = "";
  searchBox.focus();
  search();
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


makeQuizButton.addEventListener('click', event => {
  make_quiz();
});

nextButton.addEventListener('click', event => {
  next_question();
});


function answer(a) {
  if (!answered) {
    runs += 1;
    if (a == c_opt) {
      score += 1;
      
    }

    quizHistory.push(a == c_opt);
    quizAnswers.push(a);

    document.querySelector('.score-label').innerHTML = "Score: "
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
          "commonName": res["preferred_common_name"],
          "iNatID": res["id"]
        }

        let new_result_item = document.createElement('div');
        new_result_item.classList.add('taxon-item');


        resultList.appendChild(new_result_item);
        new_result_item.id = "result-" + i;

        let new_titles = document.createElement('div');
        new_result_item.appendChild(new_titles);
        new_titles.classList.add('taxon-title');

        let new_result_title = document.createElement('div');
        new_titles.appendChild(new_result_title);
        new_result_title.classList.add('taxon-title');


        new_result_title.innerHTML = res["name"];

        let new_result_sub_title = document.createElement('div');
        new_titles.appendChild(new_result_sub_title);
        new_result_sub_title.classList.add('taxon-sub-title');

        new_result_sub_title.innerHTML = res["preferred_common_name"];

        if (["genus", "species", "subspecies"].includes(res["rank"])) {
          new_result_title.style.fontStyle = "italic";
        }


        let new_add_button = document.createElement('img');

        new_add_button.classList.add("add-button");

        new_result_item.appendChild(new_add_button);

        new_add_button.addEventListener('click', event => {

          addTaxon(res["id"], res["name"]);

        });
    })
  }
}


function addTaxon(taxonID, taxonName) {
  taxonData[taxonID] = searchData[taxonName];

  let new_taxon_item = document.createElement('div');
  new_taxon_item.classList.add('taxon-item');


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

  new_taxon_sub_title.innerHTML = taxonData["commonName"];

  if (["genus", "species", "subspecies"].includes(taxonData["rank"])) {
    new_taxon_title.style.fontStyle = "italic";
  }

  let new_remove_button = document.createElement('img');
  new_remove_button.classList.add("remove-button");
  new_taxon_item.appendChild(new_remove_button);

  new_remove_button.addEventListener('click', event => {
    taxaList.removeChild(new_taxon_item);
    delete taxonData[taxonID];
  });

  new_taxon_item.classList.add('taxon-item');
  new_taxon_item.id = "taxon-" + taxonID;
  taxaList.appendChild(new_taxon_item);

}


function clear_results() {
  resultList.innerHTML = "";
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
      new_result_item.classList.add('location-item');
      new_result_item.id = "location-result-" + i;
      locationResultList.appendChild(new_result_item);



      let new_result_title = document.createElement('div');
      new_result_item.appendChild(new_result_title);
      new_result_title.classList.add('location-title');

      new_result_title.innerHTML = res["name"];

      let new_add_button = document.createElement('img');
      new_add_button.classList.add("add-button");
      new_result_item.appendChild(new_add_button);

      new_add_button.addEventListener('click', event => {
        addLocation(res["id"], res["name"]);
      });
    });
  }
}


function addLocation(locationID, locationName) {
  console.log("Adding location ID: " + locationID.toString());

  locationData.push(locationID);

  let new_location_item = document.createElement('div');
  new_location_item.classList.add('location-item');
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
  locationResultList.innerHTML = "";
}


// quiz stuff

async function make_quiz() {

  console.log(taxonData);

  console.log(locationData[0]);

  c_index = 0;
  score = 0;
  runs = 0;

  quizData = [];
  optionData = [];
  ObsData = [];
  imageView.style.display = "flex";
  controlsContainer.style.display = "block";
  summaryView.style.display = "none";
  obs_metadata_container.style.display = "flex";

  imageView.innerHTML = "";

  document.querySelector('.score-label').innerHTML = "Score: "
  + score.toString() + "/" + runs.toString();

  species_pool = [];


  // loop through taxonData
  for (const taxonID in taxonData) {
    console.log(taxonData[taxonID]["iNatID"]);

    const params = new URLSearchParams({
      taxon_id: String(taxonData[taxonID].iNatID),
      place_id: String(locationData),
      captive: "false",
      rank: "species",
      photos: "true",
      quality_grade: "research",
      include_ancestors: "false",
      expected_nearby: "true",
      order_by: "observations_count",
      order: "desc",
      per_page: "60",
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

    quizData.push([obs]);

    // get higher rank data for options
    let higher_rank_data = await load_higher_rank_data(2, obs);
    
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

    next_question();
    



}


function next_question() {

  c_opt = 100;

  if (c_index >= quizData.length) {
    summary();
    return;
  }
    

  answered = false;
  setImage(c_index);

  // set options
  let random_indices = [];
  while (random_indices.length < optionData[c_index].length) {
    let r = Math.floor(Math.random() * optionData[c_index].length);
    if (!random_indices.includes(r)) {
      random_indices.push(r);
    }
  }
  let options = [];
  let k = 0;

  console.log("Option data:");
  console.log(optionData[c_index]);


  while (options.length < 4) {
    let r_option = optionData[c_index][random_indices[k]]["taxon"];
    console.log("Random option:");
    console.log(r_option);
    options.push(r_option);
    if (r_option["id"] == quizData[c_index][0]["taxon"]["id"]) {
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

    new_scientific_name_span.innerHTML = quizData[c_index][0]["taxon"]["name"];
    new_common_name_span.innerHTML = quizData[c_index][0]["taxon"]["preferred_common_name"] || "";
    optionButtons[c_opt].innerHTML = "";
    optionButtons[c_opt].appendChild(new_scientific_name_span);
    optionButtons[c_opt].appendChild(new_common_name_span);

  
  }

  obs_metadata_container.innerHTML = "Observer: " + quizData[c_index][0]["user"]["name"] +
    " | Location: " + quizData[c_index][0]["place_guess"] +
    " | Date: " + new Date(quizData[c_index][0]["observed_on"]).toLocaleDateString();


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
    quality_grade: "research",
    include_ancestors: "false",
    expected_nearby: "true",
    order_by: "observations_count",
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

  if (higher_rank_data.length < n_options) {
    console.log("Not enough data, loading next rank");
    return await load_higher_rank_data(rank + 1, obs);
  }

  console.log("Loaded rank: " + rank.toString() + " with " + higher_rank_data.length.toString() + " entries.");
  return higher_rank_data;

}


function setImage(index){
  console.log("Setting image to index: " + index.toString());
  for (let child of imageView.children) {
      child.style.opacity = '0';
    }
  console.log(Array.from(imageView.children).reverse()[index]);
  Array.from(imageView.children).reverse()[index].style.opacity = '1';
    
}



function summary() {
  console.log("Quiz finished!");  
  imageView.style.display = "none";
  controlsContainer.style.display = "none";
  
  obs_metadata_container.display = "none";

  summaryView.style.display = "block";

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
    new_scientific_name_span.innerHTML = quizData[i][0]["taxon"]["name"];
    new_common_name_span.innerHTML = quizData[i][0]["taxon"]["preferred_common_name"];
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


    if (!quizHistory[i]){
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
  
  let inat_response = await fetch("https://api.inaturalist.org/v1/observations?captive=false&identified=true&introduced=false&photos=true&verifiable=true&rank=species&taxon_id=" +
    species_pool.toString() +
  "&per_page=200&identifications=most_agree&quality_grade=research&order=desc&order_by=created_at&only_id=false");

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