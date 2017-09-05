const maxButtonDisplay = 5;
const maxFactLength = 295;
const factIntervalLength = 5000;

var searchTerms = [];
var searchTermIndex;
var firstFacts = [];

var bandNameForSearch;
var soundCloudClientID = "client_id=8538a1744a7fdaa59981232897501e04"
var queryURL;
var bands = [];

var currentBand = {
                    name: "",
                    bandNameForSearch: "",
                    facts: [],
                    firstFact: "",
                    tracks: []
};

var factInterval;

var buttonsAdded = 0;

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

    // add band to Firebase
    database.ref("/BandWagon").push(bands[buttonsAdded]);
}

/*
 * getBandsFromFirebase()
 * checks Firebase for any records in collection BandWagon
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
        newBtn.text(bands[i].name);

        $("#nav-container").append(newBtn);
    }
}

/*
 * playTrack(index)
 * Receives an index into currentBand.tracks[] and changes the audio source attribute to the stream_url.
 * Loads the song to autoplay.
 */
function playTrack(index) {

        $("#audioSource").attr("src", currentBand.tracks[index].stream_url + "?" + soundCloudClientID);


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

    $("#discography").html("");

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
                                                    "&" + soundCloudClientID;

      $.ajax({

        method: "GET",
        url: queryURL,

    }).done(function(response) {

        console.log(response);

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
    var factIndex = Math.floor(Math.random() * currentBand.facts.length);

    // check to be sure that fact is not empty...
    while(currentBand.facts[factIndex] === "") {

        // ...if it is, get another
        factIndex = Math.floor(Math.random() * currentBand.facts.length);
    }

    // if it's a long fact...
    if(currentBand.facts[factIndex].length > maxFactLength) {

        currentBand.facts[factIndex] = currentBand.facts[factIndex].substring(0, maxFactLength) + "..";
    }

    else {
        currentBand.facts[factIndex] = currentBand.facts[factIndex].trim();
    }

    $("#fun-facts").append("<p>" + currentBand.facts[factIndex] + ".</p>");
}

/*
 * getFacts(index)
 * call wikipedia API to get extract with 10 sentences (max allowed).
 * then call again with 9 sentences and subtract the 9 from the 10, leaving one sentence.
 * repeat until only one fact  
 */
function getFacts(index) {
            
    // clear out the bandFacts array of any previous facts
    currentBand.facts = [];

    queryURL = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=" +
                        "&explaintext=&titles=" + currentBand.bandNameForSearch;

    $.ajax({

        method: "GET",
        url: queryURL,
        jsonp: "callback",
        dataType: "jsonp",
        xhrFields: { withCredentials: true }

    }).done(function(response) {

        console.log(response.query.pages[Object.keys(response.query.pages)[0]].extract);

        currentBand.facts = response.query.pages[Object.keys(response.query.pages)[0]].extract.split(".");

        //     bandFacts[factCounter - 1] = response.query.pages[Object.keys(response.query.pages)[0]].extract
        //                             .slice(bandFacts[factCounter - 2].length);

        // stop current interval
        clearInterval(factInterval);

        // display the first factoid
        $("#fun-facts").html("<p>" + currentBand.firstFact + "</p>");
        
        // display random fact on an interval        
        factInterval = setInterval(displayFact, factIntervalLength);
    }); 

}

function displaySearchTerm(index) {

    newBtn = $("<button>");
    newBtn.attr("data-index", index);
    newBtn.addClass("button-primary search-term-btn");
    newBtn.text(searchTerms[index]);

    $("#search-terms").append(newBtn);
}

function displaySearchTerms() {

    $("#search-terms").css("display", "block");
    $("#search-terms").html("<h2>Select your search</h2>");

    for(var i = 0; i < searchTerms.length; i++) {

        displaySearchTerm(i);
    }
}

// click listener for adding a band
$("#add-band").on("click", function(event) {

    event.preventDefault();

    currentBand = [];

    currentBand.name = $("#band-name").val();
    $("#band-name").val("");

    if(!Object.keys(bands).includes(currentBand.name) && currentBand.name != "") {
    
        queryURL = "https://en.wikipedia.org/w/api.php?action=opensearch&limit=5&format=json&search=" +
                                            currentBand.name;

        $.ajax({

            method: "GET",
            url: queryURL,
            jsonp: "callback",
            dataType: "jsonp",
            xhrFields: { withCredentials: true }

        }).done(function(response) {

            console.log(response);

            searchTerms = [];
            firstFacts = [];

            for(var i = 0; i < response[1].length; i++) {

                searchTerms[i] = response[1][i];
                firstFacts[i] = response[2][i];
            }

            console.log(searchTerms)

            displaySearchTerms();
        });
    }

});


// event handler for search term button click 
$("#search-terms").on("click", ".search-term-btn", function() {

    event.preventDefault();

    $("#search-terms").css("display", "none");
    
    currentBand.bandNameForSearch = searchTerms[$(this).attr("data-index")];
    currentBand.firstFact = firstFacts[$(this).attr("data-index")];
    currentBand.tracks = [];
    currentBand.facts = [];
    bands.splice(buttonsAdded % maxButtonDisplay, 1, currentBand);

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