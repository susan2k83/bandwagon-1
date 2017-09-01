// constants
var maxButtonDisplay = 5;
var maxFactLength = 215;
var factIntervalLength = 5000;

var bandName;
var bandNameForSearch;
var queryURL;
var results;
var bands = [];
var bandFacts = [];
var bandAlbums = [];

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

        // play a video
        playVideo();
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

function playVideo() {
    
}

function displayDiscography() {

    $("#disc-container").html("");
    
    for(var i = 0; i < bandAlbums.length; i++) {

        var newAlbumButton = $("<button>");
        newAlbumButton.attr("id", "album-button-" + i);
        newAlbumButton.addClass("button-primary album-button");

        // var newButtonString = "";

        // In case we want to display the year
        // if(bandAlbums[i].year) {
        //     newButtonString = bandAlbums[i].title + " (" + bandAlbums[i].year + ")";
        // }

        // else {
        //     newButtonString = bandAlbums[i].title;
        // }

        newAlbumButton.text(bandAlbums[i].title);

        $("#disc-container").append(newAlbumButton);
    }
}