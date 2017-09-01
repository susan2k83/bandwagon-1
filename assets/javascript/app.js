// constants
var maxButtonDisplay = 5;
var maxFactLength = 215;
var factIntervalLength = 5000;

var bandName;
var bandNameForSearch;
var soundCloudClientID = "client_id=8538a1744a7fdaa59981232897501e04"
var queryURL;
var results;
var bands = [];
var bandFacts = [];
var bandAlbums = [];
var tracks = [];

var factInterval;
var factIndex;

buttonsAdded = 0;

// click listener for adding a band
$("#add-band").on("click", function(event) {

    event.preventDefault();

    // ignore duplicates & empty strings
    if(!bands.includes($("#band-name").val()) && $("#band-name").val() != "") {

        bandName = $("#band-name").val();
    
        bands.splice(buttonsAdded % maxButtonDisplay, 1, bandName);

        writeButtons();
        buttonsAdded++;
    }
    // empty input field
    $("#band-name").val("");
});

/*
 * writeButtons()
 * iterate through the added bands and render buttons to the #spotify div.
 */
function writeButtons() {

    $("#nav-container").html("");

    for(var i = 0; i < bands.length; i++) {
        newBtn = $("<button>");
        newBtn.attr("id", "button-" + i);
        newBtn.addClass("button-primary band-btn");
        newBtn.text(bands[i]);
        $("#nav-container").append(newBtn);
    }
}

// event handler for band button click 
$("#nav-container").on("click", ".band-btn", function() {

    bandName = $(this).text();

    // handle spaces
    if(bandName.includes(" ")) {
        bandNameForSearch = bandName.replace(/ /g, "+");
    }

    else {
        bandNameForSearch = bandName;
    }

    bandNameForSearch = bandNameForSearch + "+music";

    queryURL = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" +
                bandNameForSearch + "&limit=15&format=json";
    $.ajax({

        method: "GET",
        url: queryURL,
        jsonp: "callback",
        dataType: "jsonp",
        xhrFields: {
            withCredentials: true
        }

    }).done(function(response) {

        console.log(response);

        for (var i = 0; i < response[2].length; i++) {

            bandFacts[i] = response[2][i];
        }

        // display the first factoid
        getFact();
    });

    // now get discography
    queryURL = "http://api.musicgraph.com/api/v2/album/search?api_key=30c6c15e149e566fdaa15b1d92b217f7&artist_name=" +
                 bandNameForSearch;
    $.ajax({

        method: "GET",
        url: queryURL,

    }).done(function(response) {

        console.log(response);

        for (var i = 0; i < response.data.length; i++) {

            var tempAlbum = {title: response.data[i].title, year: response.data[i].release_year};

            bandAlbums.push(tempAlbum);
        }

        displayDiscography();
    });

    // play a song
    queryURL = "https://api.soundcloud.com/tracks/?q=" + bandNameForSearch +
     "&" + soundCloudClientID;

      $.ajax({

        method: "GET",
        url: queryURL,

    }).done(function(response) {

        console.log(response);

        for (var i = 0; i < response.length; i++) {

            tracks[i] = response[i];
        }

        playTrack();
    });  

    // stop current interval
    clearInterval(factInterval);

    // display random fact on an interval        
    factInterval = setInterval(getFact, factIntervalLength);
});

function getFact() {

    factIndex = Math.floor(Math.random() * bandFacts.length);

    // check to be sure that fact is not empty...
    while(bandFacts[factIndex] === "" || bandFacts[factIndex].length > maxFactLength) {

    // ...if it is, get another one
    factIndex = Math.floor(Math.random() * bandFacts.length);
    }

    $("#fun-facts").html("<p>" + bandFacts[factIndex] + "</p>");
}

function playTrack() {

    $("#audioSource").attr("src", tracks[1].stream_url + "?" + soundCloudClientID);

    var audioController = document.querySelector("#audioController");

    audioController.load();
}

function displayDiscography() {

    $("#disc-container").html("");

    for(var i = 0; i < tracks.length; i++) {

        var newAlbumButton = $("<button>");
        var newAlbumImage = $("<img>");

        newAlbumButton.attr("id", "album-button-" + i);
        newAlbumButton.addClass("button-primary album-button");

        newAlbumImage.attr("id", "album-image-" + i);
        newAlbumImage.addClass("album-image");

        newAlbumImage.attr("src", tracks[i].artwork_url);
        newAlbumButton.text(tracks[i].title);

        $("#disc-container").append(newAlbumImage);
        $("#disc-container").append(newAlbumButton);
    }
}