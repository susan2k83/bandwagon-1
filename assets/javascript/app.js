const maxButtonDisplay = 5;
const maxFirstFactLength = 70;
const maxFactLength = 295;
const maxSentences = 10;
const factIntervalLength = 5000;

var bands = [];
var buttonsAdded = 0;

var searchTerms = [];
var searchTermIndex;
var firstFacts = [];

var soundCloudID = "8538a1744a7fdaa59981232897501e04"
var queryURL;

var sentences = [];
var sentenceCounter = 0;

var newBand = {
                    name: "",
                    bandNameForSearch: "",
                    facts: [],
                    firstFact: "",
                    tracks: []
};

var currentBand = {
                    name: "",
                    bandNameForSearch: "",
                    facts: [],
                    firstFact: "",
                    tracks: []
};

var factInterval;

// firebase key array (if needed)
var keys = [];

// Firebase configuration & initialization
var config = {
    apiKey: "AIzaSyAiexV0rlMuaZQbv-wTHO3Cj5arNwsXIw4",
    authDomain: "first-project-171de.firebaseapp.com",
    databaseURL: "https://first-project-171de.firebaseio.com",
    projectId: "first-project-171de",
    storageBucket: "first-project-171de.appspot.com",
    messagingSenderId: "949949647628"
};

firebase.initializeApp(config);
var database = firebase.database();

getBandsFromFirebase();

function addBandToFirebase() {

    database.ref("/BandWagon").push(bands[buttonsAdded]);
}

/*
 * getBandsFromFirebase()
 * checks Firebase for any records in "/BandWagon"
 *  and populates keys[] and bands[] 
 */
function getBandsFromFirebase() {

    database.ref("/BandWagon").on("value", function(snapshot) {

        var bandCounter = 0;

        snapshot.forEach(function(childSnapshot) {

            // get keys in case we want to do something with them
            keys[bandCounter] = childSnapshot.key;

            // get band and increment counter
            bands[bandCounter++] = childSnapshot.val();
        });

        writeButtons();
        buttonsAdded = bands.length;
    });
}

/*
 * writeButtons()
 * iterate through the added bands and render buttons to the #spotify div.
 */
function writeButtons() {

    $("#nav-container").html("");

    // make a new button for each band and display on navbar
    for(var i = 0; i < bands.length; i++) {

        newBtn = $("<button>");
        newBtn.attr("data-index", i);
        newBtn.addClass("button-primary band-btn");
        newBtn.html(bands[i].name);

        $("#nav-container").append("<li class=\"btn-container\"><button data-index=\"" + i +
            "\" class=\"button-primary band-btn\">" + bands[i].name +
            "</button></li>");
    }
}

/*
 * playTrack(index)
 * Receives an index into currentBand.tracks[] and changes the audio source attribute to the stream_url.
 * Loads the song to autoplay.
 */
function playTrack(index) {

        $("#audioSource").attr("src", currentBand.tracks[index].stream_url + "?client_id=" + soundCloudID);


    // handle spaces
    if(bandName.includes(" ")) {
        bandNameForSearch = bandName.replace(/ /g, "+");
    }
        var audioController = document.querySelector("#audioController");

        audioController.load();

        $("#now-playing-image").attr("src", currentBand.tracks[index].artwork_url);
        $("#now-playing").html(currentBand.tracks[index].title);
}

function displayDiscography() {

    $("#discography").html("<h4>\"" + currentBand.bandNameForSearch + "\"</h4>");

    for(var i = 0; i < currentBand.tracks.length; i++) {

        var newAlbumButton = $("<button>");
        var newAlbumImage = $("<img>");

        newAlbumButton.attr("data-index", i);
        newAlbumButton.addClass("button-primary album-button");

        newAlbumImage.attr("data-index", i);
        newAlbumImage.addClass("album-image");

        newAlbumImage.attr("src", currentBand.tracks[i].artwork_url);

        var testIndex = i;
        var imageTries = 1;
        
        // check to see if there is an image in artwork_url
        while(!currentBand.tracks[testIndex].artwork_url) {

            // if not, try another track

            // but first, error check to see if next position exists
            if(testIndex + 1 == currentBand.tracks.length) {

                // we're at end of array, check first position
                testIndex = 0;
            }

            // next one
            else {
                testIndex++;
            }

            // try artwork_url at new location
            newAlbumImage.attr("src", currentBand.tracks[testIndex].artwork_url);

            // copy new location url to currentBand.tracks array
            currentBand.tracks[i].artwork_url = currentBand.tracks[testIndex].artwork_url;
        }
        
        // add track title to the button
        newAlbumButton.text(currentBand.tracks[i].title);

        $("#discography").append(newAlbumImage);
        $("#discography").append(newAlbumButton);
    }
}

function getTracks() {

    queryURL = "https://api.soundcloud.com/tracks/?q=" + currentBand.bandNameForSearch +
                                                    "&client_id=" + soundCloudID;

      $.ajax({

        method: "GET",
        url: queryURL,

    }).done(function(response) {

        // clear out tracks array of any previous tracks
        currentBand.tracks = [];

        for (var i = 0; i < response.length; i++) {

            currentBand.tracks[i] = response[i];
        }

        displayDiscography();
    });  
}

/*
 * getFact()
 * get a random fact from currentBand.facts array
 */
function displayFact() {

    $("#fun-facts").html("");
    var factIndex = Math.floor(Math.random() * (currentBand.facts.length - 1 - 1 + 1) + 1);

    var factCounter = 0
    // check to be sure that fact is not empty...
    while(currentBand.facts[factIndex] === "") {

        factIndex = Math.floor(Math.random() * (currentBand.facts.length - 1 - 1 + 1) + 1);
        factCounter++

        if(factCounter > 9) {
            // error...facts array is empty
            $("#fun-facts").append("<p>There are no facts to display for this search term.</p>");
            break;
        }
    }

    // if it's a long fact...
    if(currentBand.facts[factIndex].length > maxFactLength) {

        currentBand.facts[factIndex] = currentBand.facts[factIndex].substring(0, maxFactLength) + "...";
    }

    else {
        currentBand.facts[factIndex] = currentBand.facts[factIndex].trim();
    }

    // strip wiki pronunciation container
    currentBand.facts[factIndex] = currentBand.facts[factIndex].replace(" (; ", " ( ");

    $("#fun-facts").append("<p>" + currentBand.facts[factIndex] + "</p>");
}

function getSentences(index) {

    var numSentences = index + 1;

    queryURL = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts" +
                    "&exsentences=" + (numSentences) + "&explaintext=&titles=" +
                    currentBand.bandNameForSearch;

    $.ajax({

        method: "GET",
        url: queryURL,
        jsonp: "callback",
        dataType: "jsonp",
        xhrFields: { withCredentials: true }

    }).done(function(response) {

        sentences.push(response.query.pages[Object.keys(response.query.pages)[0]].extract);

        sentenceCounter++;

        if(sentenceCounter < maxSentences) {

            getSentences(numSentences++);
        }

        else {

            currentBand.facts[0] = sentences[0];

            for(var i = 1; i < maxSentences; i++) {

                currentBand.facts[i] = sentences[i].slice(sentences[i - 1].length).trim();
            }

            // when done, check for odd cases, like "Bros."
            for(i = currentBand.facts.length - 2; i >= 0; i--) {

                if( currentBand.facts[i].endsWith("Bros.") ||
                    currentBand.facts[i].endsWith("Dr.") ||
                    currentBand.facts[i].endsWith("Rev.")) {

                    currentBand.facts[i] += " ";
                    currentBand.facts[i] += currentBand.facts[i + 1];
                    currentBand.facts.splice(i + 1, 1);
                }
            }
        }
    });
}

function getFacts() {
            
    // clear out the bandFacts array of any previous facts
    currentBand.facts = [];

    sentenceCounter = 0;
    sentences = [];

    getSentences(sentenceCounter);

    // stop current interval
    clearInterval(factInterval);

    // display the first factoid    
    // strip wiki pronunciation container
    currentBand.firstFact = currentBand.firstFact.replace(" (; ", " (");
    $("#fun-facts").html("<p>" + currentBand.firstFact + "</p>");

    // display random fact on an interval        
    factInterval = setInterval(displayFact, factIntervalLength);
}

function displaySearchTerm(index) {

    var newBtn = $("<button>");
    newBtn.attr("data-index", index);
    newBtn.addClass("button-primary search-term-btn");
    newBtn.text(searchTerms[index]);

    $("#search-terms").append(newBtn);
    $("#search-terms").append("<p><i>" + firstFacts[index].slice(0,maxFirstFactLength) + "...</i></p>");
}

function displaySearchTerms() {

    $("#search-terms").css("display", "block");
    $("#search-terms").html("<h3 id=\"search-header\">Refine your search</h3>");

    $("#search-terms").append("<h5>Closest Wiki Search:</h5>");

    var newBtn = $("<button>");
    newBtn.attr("data-index", 0);
    newBtn.addClass("button search-term-btn");
    newBtn.text(searchTerms[0]);
    $("#search-terms").append(newBtn);
    $("#search-terms").append("<p><i>" + firstFacts[0].slice(0,maxFirstFactLength) + "...</i></p>");

    $("#search-terms").append("<h5>Related Searches:</h5>");

    for(var i = 1; i < searchTerms.length; i++) {

        displaySearchTerm(i);
    }

    newBtn = $("<button>");
    newBtn.attr("id", "cancel");
    newBtn.addClass("button");
    newBtn.text("cancel");

    $("#search-terms").append(newBtn);

}

// click listener for adding a band
$("#add-band").on("click", function(event) {

    event.preventDefault();

    newBand = {};

    newBand.name = $("#band-name").val().trim();
    $("#band-name").val("");

    if(!Object.keys(bands).includes(newBand.name) && newBand.name != "") {
    
        queryURL = "https://en.wikipedia.org/w/api.php?action=opensearch&limit=5&format=json&search=" +
                                            newBand.name;

        $.ajax({

            method: "GET",
            url: queryURL,
            jsonp: "callback",
            dataType: "jsonp",
            xhrFields: { withCredentials: true }

        }).done(function(response) {

            searchTerms = [];
            firstFacts = [];

            for(var i = 0; i < response[1].length; i++) {

                searchTerms[i] = response[1][i];
                firstFacts[i] = response[2][i];
            }

            displaySearchTerms();
        });
    }
});

// event handler for search term button click 
$("#search-terms").on("click", ".search-term-btn", function() {

    event.preventDefault();

    $("#search-terms").css("display", "none");
    
    newBand.bandNameForSearch = searchTerms[$(this).attr("data-index")];
    newBand.firstFact = firstFacts[$(this).attr("data-index")];
    newBand.tracks = [];
    newBand.facts = [];
    bands.splice(buttonsAdded % maxButtonDisplay, 1, newBand);

    writeButtons();

    if(buttonsAdded < maxButtonDisplay) {
        addBandToFirebase();
    }

    else {
        buttonsAdded++;
    }
});

// event handler for band button click 
$("#nav-container").on("click", ".band-btn", function() {

    currentBand = {};
    currentBand = bands[$(this).attr("data-index")]; 

    getTracks();
    getFacts();
});

// event handler for band button click 
$("#disc-container").on("click", ".album-button", function() {

    playTrack($(this).attr("data-index"));
});

// event handler for band image click 
$("#disc-container").on("click", ".album-image", function() {

    playTrack($(this).attr("data-index"));
});

$(document).on("keyup", function(event) {

    if(event.which === 27) {

        // close modal
        $("#search-terms").css("display", "none");
    }
});

$("#search-terms").on("click", "#cancel", function(event) {

        // close modal
        $("#search-terms").css("display", "none");
});