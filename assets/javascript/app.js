const maxButtonDisplay = 5;
const maxFirstFactLength = 70;
const maxFactLength = 295;
const maxSentences = 10;
const factIntervalLength = 5000;

var bands = [];
var buttonsAdded = 0;

var soundCloudID = "8538a1744a7fdaa59981232897501e04"
var queryURL;

var sentences = [];
var sentenceCounter = 0;

var newBand = {
                    name: "",
                    bandNameForSearch: "",
                    facts: [],
                    firstFact: "",
                    tracks: [],
                    pageURL: ""
};

var currentBand = {
                    name: "",
                    bandNameForSearch: "",
                    facts: [],
                    firstFact: "",
                    tracks: [],
                    pageURL: ""
};


var openSearch = {  searchTerms: [],
                firstFacts: [],
                pageURLs: [] }

var searchTermIndex;

var factInterval;
var factIndex = 0;

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

        // newBtn = $("<button>");
        // newBtn.attr("data-index", i);
        // newBtn.addClass("button-primary band-btn");
        // newBtn.html(bands[i].name);

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

        var audioController = document.querySelector("#audioController");

        audioController.load();

        $("#now-playing-image").attr("src", currentBand.tracks[index].artwork_url);
        $("#now-playing").html(currentBand.tracks[index].title);
}

function displayDiscography() {

    $("#discography").html("<h4>\"" + currentBand.bandNameForSearch + "\"</h4>");
    $("#discography").append("<h5><a href=\"" + currentBand.pageURL +
                    "\" target=\"_blank\">click to open Wikipedia page</a></h5>");

    for(var i = 0; i < currentBand.tracks.length; i++) {

        var newAlbumButton = $("<button>");
        var newAlbumImage = $("<img>");

        newAlbumButton.attr("data-index", i);
        newAlbumButton.addClass("button-primary album-button play-track");

        newAlbumImage.attr("data-index", i);
        newAlbumImage.addClass("album-image play-track");

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
 * displayFact()
 * get a random fact from currentBand.facts array
 */
function displayFact() {

    $("#fun-facts").html("");
    factIndex++;
    factIndex = factIndex % currentBand.facts.length;

    var factCounter = 0

    // check to be sure that fact is not empty...
    while(currentBand.facts[factIndex] === "") {

        factIndex++;
        factIndex = factIndex % currentBand.facts.length;
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
                    currentBand.facts[i].endsWith("Rev.") ||
                    currentBand.facts[i].endsWith("Jr.")) {

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
    newBtn.text(openSearch.searchTerms[index]);

    $("#search-terms").append(newBtn);
    $("#search-terms").append("<p><i>" + openSearch.firstFacts[index].slice(0,maxFirstFactLength) + "...</i></p>");
}

function displaySearchTerms() {

    $("#search-terms").css("display", "block");
    $("#search-terms").css("top", "-25px");
    $("#search-terms").html("<h3 id=\"search-header\">Refine Your Search</h3>");

    $("#search-terms").append("<h5>Closest Wiki Search:</h5>");

    var newBtn = $("<button>");
    newBtn.attr("data-index", 0);
    newBtn.addClass("button-primary search-term-btn");
    newBtn.text(openSearch.searchTerms[0]);
    $("#search-terms").append(newBtn);
    $("#search-terms").append("<p><i>" + openSearch.firstFacts[0].slice(0,maxFirstFactLength) + "...</i></p>");

    $("#search-terms").append("<h5>Related Searches:</h5>");

    for(var i = 1; i < openSearch.searchTerms.length; i++) {

        displaySearchTerm(i);
    }

    newBtn = $("<button>");
    newBtn.attr("id", "cancel");
    newBtn.addClass("button close-button");
    newBtn.text("cancel");

    $("#search-terms").append(newBtn);
}

// click listener for adding a band
$("#add-band").on("click", function(event) {

    event.preventDefault();

    var bandExists = false;

    for(var i = 0; i < bands.length; i++) {

        if($("#input-band-name").val().trim().toUpperCase() === bands[i].name.toUpperCase()) {

            bandExists = true;

            $("#search-terms").css("display", "block");
            $("#search-terms").css("top", "65px");
            $("#search-terms").html("<h5>\"" + $("#band-name").val().trim() + "\" Already Exists</h5>");

            var newBtn = $("<button>");
            newBtn.attr("type", "submit")
            newBtn.attr("id", "try-again");
            newBtn.addClass("button-primary close-button");
            newBtn.text("Try Again");

            $("#search-terms").append(newBtn);
        }
    }

    // if the band doesn't already exist and input isn't empty
    if(!bandExists && $("#input-band-name").val().trim() != "") {

        newBand = {};    
        newBand.name = $("#input-band-name").val().trim(); 
    
        queryURL = "https://en.wikipedia.org/w/api.php?action=opensearch&limit=5&format=json&search=" +
                                            newBand.name;
        $.ajax({

            method: "GET",
            url: queryURL,
            jsonp: "callback",
            dataType: "jsonp",
            xhrFields: { withCredentials: true }

        }).done(function(response) {

            openSearch.searchTerms = [];
            openSearch.firstFacts = [];
            openSearch.pageURLs = [];

            for(var i = 0; i < response[1].length; i++) {

                openSearch.searchTerms[i] = response[1][i];
                openSearch.firstFacts[i] = response[2][i];
                openSearch.pageURLs[i] = response[3][i];
            }

            displaySearchTerms();
        });
    }

    $("#input-band-name").val("");
});

// event handler for search term button click 
$("#search-terms").on("click", ".search-term-btn", function(event) {

    event.preventDefault();

    $("#search-terms").css("display", "none");
    
    newBand.bandNameForSearch = openSearch.searchTerms[$(this).attr("data-index")];
    newBand.firstFact = openSearch.firstFacts[$(this).attr("data-index")];
    newBand.pageURL = openSearch.pageURLs[$(this).attr("data-index")];
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
$("#disc-container").on("click", ".play-track", function() {

    playTrack($(this).attr("data-index"));
});

// click listener to close modal
$("#search-terms").on("click", ".close-button", function() {

        // close modal
        $("#search-terms").css("display", "none");
});

// esc key listener to close modal
$(document).on("keyup", function(event) {

    if(event.which === 27) {

        // close modal
        $("#search-terms").css("display", "none");
    }
});