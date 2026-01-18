


// vars
let c_index = 0;

let c_opt = 0;

let score = 0;

let answered = false;

let all_english_names = [];

let all_species_names = [];

let sound_dict = {};

let audio_element = new Audio();

let runs = 0;

let spectrogram = document.querySelector('.spectro-view');

let start = 0;

let n_questions = 12;

let n_options = 4;

let c_species = [];

let searchData = {};

let taxonData = {};

let quizData = [];

let ObsData = [];

let optionData = [];

let species_pool = [];

const acceptedRanks = ["kingdom", "phylum", "class", "order", "family", "genus", "species", "subspecies"]



// Elements

let searchBox = document.querySelector('.search-box');

let resultList = document.querySelector('.result-list');

let taxaList = document.querySelector('#taxa-list');

let clearSearchButton = document.querySelector(".clear-search-button");

let makeQuizButton = document.querySelector(".make-quiz-button");

let imageView = document.querySelector('.image-view');


let nextButton = document.querySelector('.next-button');

let optionButtons = document.querySelectorAll('.option-button');

// Event listeners


searchBox.addEventListener('input', event => {
  search();
})

clearSearchButton.addEventListener('click', event => {
  searchBox.value = "";
  searchBox.focus();
  search();
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
    document.querySelector('.score-label').innerHTML = "Score: "
      + score.toString() + "/" + runs.toString();
    answered = true;
    document.querySelector('#opt-' + a.toString()).style.backgroundColor = "red";
    document.querySelector('#opt-' + c_opt.toString()).style.backgroundColor = "green";
  }

}



// load data


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
      if (acceptedRanks.includes(res["rank"])) {


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
      }
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
  new_remove_button.classList.add("remove-taxon-button");
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



async function make_quiz() {

  c_index = 0;
  score = 0;
  runs = 0;

  quizData = [];
  optionData = [];
  ObsData = [];
  imageView.innerHTML = "";

  document.querySelector('.score-label').innerHTML = "Score: "
  + score.toString() + "/" + runs.toString();

  species_pool = [];


  // loop through taxonData
  for (const taxonID in taxonData) {
    console.log(taxonData[taxonID]["iNatID"]);

      let inat_response = await fetch("https://api.inaturalist.org/v1/taxa?taxon_id=" + taxonData[taxonID]["iNatID"] + "&rank=species&order=desc&order_by=observations_count");
      
      const inat_json = await inat_response.json();
      console.log(inat_json);

      inat_json["results"].forEach((res, i) => {
        console.log("Adding species ID to pool: " + res["id"].toString());
        species_pool.push(res["id"]);
      });

  }


  console.log("Species pool:");
  console.log(species_pool);

  species_pool = Array.from(new Set(species_pool)); // remove duplicates
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

  c_opt = 12;

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
    let r_option = optionData[c_index][random_indices[k]]
    console.log("Random option:");
    console.log(r_option);
    options.push(r_option);
    if (r_option["id"] == quizData[c_index][0]["taxon"]["id"]) {
       c_opt = options.length - 1;
    }
    k += 1;
  }

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
  if (c_opt === 12) {
    c_opt = Math.floor(Math.random() * 4);
 

    let new_scientific_name_span = document.createElement('span');
    let new_common_name_span = document.createElement('span');

    new_scientific_name_span.innerHTML = quizData[c_index][0]["taxon"]["name"];
    new_common_name_span.innerHTML = quizData[c_index][0]["taxon"]["preferred_common_name"] || "";
    optionButtons[c_opt].innerHTML = "";
    optionButtons[c_opt].appendChild(new_scientific_name_span);
    optionButtons[c_opt].appendChild(new_common_name_span);

  
  }
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

  let higher_rank_response = await fetch("https://api.inaturalist.org/v1/taxa?taxon_id=" + higher_rank_id.toString() + "&rank=species&order=desc&order_by=observations_count");

  const inat_json = await higher_rank_response.json();
  const higher_rank_data = inat_json["results"];
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
  console.log( Array.from(imageView.children).reverse()[index]);
  Array.from(imageView.children).reverse()[index].style.opacity = '1';
    
}



function summary() {
  console.log("Quiz finished!");  
  imageView.innerHTML = "";
  let summary_text = document.createElement('div');
  summary_text.classList.add('summary-text');
  summary_text.innerHTML = "Quiz finished! Your final score is "
    + score.toString() + " out of " + runs.toString() + ".";
  imageView.appendChild(summary_text);
}


async function get_observations() {
  
  let inat_response = await fetch("https://api.inaturalist.org/v1/observations?captive=false&identified=true&introduced=false&photos=true&verifiable=true&rank=species&taxon_id=" +
    species_pool.toString() +
  "&per_page=200&identifications=most_agree&quality_grade=research&order=desc&order_by=created_at&only_id=false");

  const inat_json = await inat_response.json();

  let results = inat_json["results"];
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