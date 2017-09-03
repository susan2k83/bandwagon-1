const maxButtonDisplay = 5;
const maxFactLength = 295;
const factIntervalLength = 5000;

var bandName;
var bandNameForSearch;
var soundCloudClientID = "client_id=8538a1744a7fdaa59981232897501e04"
var queryURL;
var results;
var bands = [];
var bandFacts = [];
var bandFacts2 = [];
var bandAlbums = [];
var tracks = [];

var currentBand = {};

var factInterval;

buttonsAdded = 0;

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
        newBtn.attr("id", "button-" + i);
        newBtn.addClass("button-primary band-btn");
        newBtn.text(bands[i]);

        $("#nav-container").append(newBtn);
    }
}

/*
 * getFact()
 * get a random fact from the current bandFacts array
 */
function getFact() {

    var factIndex = Math.floor(Math.random() * bandFacts2.length);

    // check to be sure that fact is not empty...
    while(bandFacts2[factIndex] === "") {

        // ...if it is, get another one
        factIndex = Math.floor(Math.random() * bandFacts2.length);
    }

    // if it's a long fact...
    if(bandFacts2[factIndex].length > maxFactLength) {

        bandFacts2[factIndex] = bandFacts2[factIndex].substring(0, maxFactLength) + "..";
    }

    else {
        bandFacts2[factIndex] = bandFacts2[factIndex].trim();
    }

    $("#fun-facts").html("<p>" + bandFacts2[factIndex] + ".</p>");
}

/*
 * playTrack(index)
 * Receives an index into tracks[] and changes the audio source attribute to the stream_url.
 * Loads the song to autoplay.
 */
function playTrack(index) {

        $("#audioSource").attr("src", tracks[index].stream_url + "?" + soundCloudClientID);

        var audioController = document.querySelector("#audioController");

        audioController.load();

        $("#now-playing-image").attr("src", tracks[index].artwork_url);
        $("#now-playing").html(tracks[index].title);
}

function displayDiscography() {

    $("#discography").html("");

    for(var i = 0; i < tracks.length; i++) {

        var newAlbumButton = $("<button>");
        var newAlbumImage = $("<img>");

        newAlbumButton.attr("data-index", i);
        newAlbumButton.addClass("button-primary album-button");

        newAlbumImage.attr("data-index", i);
        newAlbumImage.addClass("album-image");

        newAlbumImage.attr("src", tracks[i].artwork_url);

        var testIndex = i;
        var imageTries = 1;
        
        // check to see if there is an image in artwork_url
        while(!tracks[testIndex].artwork_url) {

            // if not, try another track

            // but first, error check to see if next position exists
            if(testIndex + 1 == tracks.length) {

                // we're at end of array, check first position
                testIndex = 0;
            }

            // next one
            else {
                testIndex++;
            }

            // try artwork_url at new location
            newAlbumImage.attr("src", tracks[testIndex].artwork_url);

            // copy new location url to tracks array
            tracks[i].artwork_url = tracks[testIndex].artwork_url;
        }
        
        // add track title to the button
        newAlbumButton.text(tracks[i].title);

        $("#discography").append(newAlbumImage);
        $("#discography").append(newAlbumButton);
    }
}

// click listener for adding a band
$("#add-band").on("click", function(event) {

    event.preventDefault();

    // ignore duplicates & empty strings
    if(!bands.includes($("#band-name").val()) && $("#band-name").val() != "") {

        bandName = $("#band-name").val();
    
        bands.splice(buttonsAdded % maxButtonDisplay, 1, bandName);

        writeButtons();

        if(buttonsAdded < maxButtonDisplay) {
            addBandToFirebase();
        }

        else {
            buttonsAdded++;
        }
    }

    // empty input field
    $("#band-name").val("");
});


// event handler for band button click 
$("#nav-container").on("click", ".band-btn", function() {

    bandName = $(this).text().trim();

    // handle spaces, capitalize next letter
    if(bandName.includes(" ")) {

        bandNameForSearch = bandName.replace(/ /g, "+");

    }

    else {
        bandNameForSearch = bandName;
    }

    // get soundCloud track
    queryURL = "https://api.soundcloud.com/tracks/?q=" + bandNameForSearch +
     "&" + soundCloudClientID;

      $.ajax({

        method: "GET",
        url: queryURL,

    }).done(function(response) {

        console.log(response);

        // clear out tracks array of any previous tracks
        tracks = [];

        for (var i = 0; i < response.length; i++) {

            tracks[i] = response[i];
        }

        displayDiscography();
    });  

    // get more facts from wiki
    var moreFactsQueryURL = "https://en.wikipedia.org/w/api.php?action=query&" +
        "&titles=" + bandNameForSearch + "&prop=extracts&exintro&explaintext&format=json"

    $.ajax({

        method: "GET",
        url: moreFactsQueryURL,
        jsonp: "callback",
        dataType: "jsonp",
        xhrFields: {
            withCredentials: true
        }

    }).done(function(response) {

        console.log(response.query.pages[Object.keys(response.query.pages)[0]].extract);
        
        // clear out the bandFacts2 array of any previous facts
        bandFacts2 = [];

        bandFacts2 = response.query.pages[Object.keys(response.query.pages)[0]].extract.split(".");

        // stop current interval
        clearInterval(factInterval);

        // display the first factoid
        getFact();
        
        // display random fact on an interval        
        factInterval = setInterval(getFact, factIntervalLength);
    }); 
});

// event handler for band button click 
$("#disc-container").on("click", ".album-button", function() {

    playTrack($(this).attr("data-index"));
});

// event handler for band image click 
$("#disc-container").on("click", ".album-image", function() {

    playTrack($(this).attr("data-index"));
});