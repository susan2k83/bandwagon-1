var bandName;
var queryURL;
var results;
var facts = [];
var factIndex;


$(document).on("click", "#add-band", function(event) {

    event.preventDefault();

    bandName = $("#band-name").val();

    if(bandName.includes(" ")) {

        bandName = bandName.replace(/ /g, "+");
    }

    queryURL = "https://en.wikipedia.org/w/api.php?action=opensearch&search=" +
                bandName + "&limit=15&format=json";

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

            facts[i] = response[2][i];
            // $("#disc-container").append("<p>" + facts[i] + "</p>");
        }
    });

    // display random fact every 5 seconds        
    var factInterval = setInterval(function() {
        factIndex = Math.floor(Math.random() * facts.length)  
        $("#fun-facts").html("<p>" + facts[factIndex] + "</p>");
    }, 5000);

    // factIndex = Math.floor(Math.random() * facts.length)  
    // $("#fun-facts").html("<p>" + facts[factIndex] + "</p>");
});