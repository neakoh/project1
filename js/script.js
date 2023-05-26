const map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false}).setView([0,0], 2);
var tiles = L.tileLayer('https://maptiles.p.rapidapi.com/en/map/v1/{z}/{x}/{y}.png?rapidapi-key=650a4aee3dmshcbae477804e985dp1d43b8jsnc80d07159f68', {
	attribution: '&copy; <a href="http://www.maptilesapi.com/">MapTiles API</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	apikey: '<650a4aee3dmshcbae477804e985dp1d43b8jsnc80d07159f68>',
	maxZoom: 19
}).addTo(map);


// Feature Groups
var countryBorder = new L.FeatureGroup().addTo(map);
var cityGroup = new L.FeatureGroup().addTo(map)
var attractionMarkers = L.markerClusterGroup({
    spiderfyOnMaxZoom: false,
	disableClusteringAtZoom: 15,
}).addTo(map);
var airportLayer = new L.FeatureGroup().addTo(map);

var accommodation = new L.FeatureGroup().addTo(attractionMarkers);
var natural = new L.FeatureGroup().addTo(attractionMarkers);
var catering = new L.FeatureGroup().addTo(attractionMarkers);
var tourism = new L.FeatureGroup().addTo(attractionMarkers);
var entertainment = new L.FeatureGroup().addTo(attractionMarkers);

tiles.on('load', function(){
    $('#map').css({'visibility':'visible'});
    $('#enterDiv').css({'visibility':'visible'}).addClass('fadeIn');
})

$(window).on('load', function(){
    function success(pos) {
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        if(lat && lng){
            getCurrentLocation();
        }
    }
    navigator.geolocation.getCurrentPosition(success);
})
// Variables
var currentLocation = "";
var countryCode = "";
var localCurrency = "";
var lat = 0;
var lng = 0;
var currentMenu = "";
var bounds = [];
var cityName = "";
var citylat = 0;
var citylng = 0;
var checked = [];
var newsCategory ='top';
var citiesRendered;
// Populate dropdown list 
const populateCountries = () => {
    $.ajax({
        url: "php/accessGeoJson.php",
        type: 'POST',
        dataType: 'json',
        success: function(result){
            if(result){
                const featuresArray = result['data'];
                const countries = featuresArray.map(country => [country.properties.name, country.properties.iso_a2])
                countries.sort();
                for(i = 0; i < countries.length; i++){
                    $('#countryDropDown').append($('<option></option>').html(countries[i][0]).val(countries[i][0]));
                } 
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Draw Border
const drawBorder = () => {
    $.ajax({
        url: "php/accessGeoJson.php",
        type: 'POST',
        dataType: 'json',
        success: function(result){
            if(result){
                const featuresArray = result['data']
                var index = -1;
                featuresArray.find(function(item, i){
                    if(item.properties.name === currentLocation){
                        index = i;
                    }
                });
                var coords = featuresArray[index]['geometry']['coordinates'];
                var reversedCoords = coords.map(function reverse(item) {
                    return Array.isArray(item) && Array.isArray(item[0]) 
                               ? item.map(reverse) 
                               : item.reverse();
                });
                var polygon = L.polygon(reversedCoords, {color: 'white'});
                polygon.addTo(countryBorder)
                
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Get current location
const getCurrentLocation = () => {
    $.ajax({
        url: "php/getCountryCode.php",
        type: 'POST',
        dataType: 'json',
        data: {
            latitude: lat,
            longitude: lng 
        },
        success: function(result){
            if(result.status.name == "ok"){
                countryCode = result['data']['countryCode'];
                currentLocation = result['data']['countryName'];
                $('#currentLocation1').html(currentLocation);
                $('#enterButton').addClass('ready');
                $('#enterLoader').remove();
                // Entering App
                $('#enterButton').on('click', function() {
                    $('#enterDiv').removeClass('fadeIn');
                    $('#nav').addClass('show');
                    $('#overlay').css({"visibility" : "visible"});
                    $('#attractionDiv').css({"visibility" : "visible"});
                    map.dragging.enable();
                    map.scrollWheelZoom.enable();
                    populateCountries();
                    // Snap to current location
                    $.ajax({
                        url: "php/getCountryCode.php",
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            latitude: lat,
                            longitude: lng 
                        },
                        success: function(result){

                            if(result.status.name == "ok"){
                                currentLocation = result['data']['countryName'];
                                countryCode = result['data']['countryCode'];
                                $.ajax({
                                    url: "php/countrySelector.php",
                                    type: 'POST', 
                                    dataType: 'json',
                                    data: {
                                        country: currentLocation
                                    },
                                    success: function(result) {
                                        var northeast = [result['data']['northeast']['lat'], result['data']['northeast']['lng']]
                                        var southwest = [result['data']['southwest']['lat'], result['data']['southwest']['lng']]           
                                        bounds = [northeast, southwest];

                                        if(result.status.name == "ok"){
                                            $('#enterDiv').remove();
                                            $('#menuToggle').toggleClass('on');
                                            $('#buttonContainer').toggleClass('show'); 
                                            map.flyToBounds(bounds);
                                            $('.currentLocation').html(currentLocation);
                                            $('.countryFlag').html($('<img>',{class: 'icon', src:'dependencies/Flag Icons/' + countryCode + '.svg'}))
                                            drawBorder()
                                            renderCities()
                                            setTimeout(function(){
                                                $('#cityAlert').css({"visibility" : "visible"});
                                                $('#cityAlert').addClass('show');
                                            }, 1000)
                                        }
                                    },
                                    error: function(error) {
                                        console.error(error);
                                    }
                                });
                            }
                        },
                        error: function(error){
                            console.log(error);
                        }
                    });
                });
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Render cities
const renderCities = () => {
    $.ajax({
        url: "php/getCities.php",
        type: 'POST', 
        dataType: 'json',
        data: {
            countryCode: countryCode
        },
        success: function(result) {
            if(result){ 
                citiesRendered = true;
                let cityData = result['data'];
                cityData.forEach(city => {
                    var marker = L.ExtraMarkers.icon({
                        icon: 'fa-city',
                        markerColor: 'blue',
                        prefix: 'fa-solid'
                    });
                    var marker = L.marker([city.latitude, city.longitude], {icon:marker})
                    .bindPopup('City: ' + city.name + '<br> Population: ' + (city.population.toLocaleString('en-US')) + '<br>');
                    marker.addTo(cityGroup)
                    .on('click', function(){
                        citylat = city.latitude;
                        citylng = city.longitude;
                        $('#cityButtons').addClass('show');
                        $('#attractionDiv').addClass('show');
                        $('#cityAlert').removeClass('show')
                        marker.openPopup();
                        clearValues();
                        clearCityAttractions();
                        map.flyTo([city.latitude, city.longitude], 10);
                        cityName = city.name;
                        getWeather(cityName);
                        getAirports(city.name, city.country);
                    })
                })    
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}
// Get city attractions
const getCityAttractions = (lat, lng, category, icon, colour) => {
    $.ajax({
        url: "php/getAttractions.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: lng,
            lng: lat,
            category: category
        },
        success: function(result){
            let attractions = result['data'];
            
            if(result){
                attractions.forEach(feature => {
                    var markerOptions = L.ExtraMarkers.icon({
                        icon: icon,
                        markerColor: colour,
                        prefix: 'fa-solid'
                    });
                    let phone = feature.properties.datasource.raw.phone;
                    let website = feature.properties.datasource.raw.website;
                    let name = feature.properties.address_line1;
                    let address = feature.properties.address_line2
                    var marker = L.marker([feature.properties.lat, feature.properties.lon], {icon: markerOptions})

                    var fullPopup = (
                        '<b>' + name + '</b><br>'
                        + address + '<br>' 
                        + "<a href='" + website + "' target='_blank'>" + website + "</a><br>"
                        + "<a href='" + phone + "'>" + phone + "</a>"
                    );
                    var websitePopup = (
                        '<b>' + name + '</b><br>'
                        + address + '<br>' 
                        + "<a href='" + website + "' target='_blank'>" + website + "</a><br>"
                    );
                    var phonePopup = (
                        '<b>' + name + '</b><br>'
                        + address + '<br>' 
                        + "<a href='" + phone + "'>" + phone + "</a>"
                    );
                    var reducedPopup = (
                        '<b>' + name + '</b><br>'
                        + address + '<br>' 
                    );
                    switch(category){
                        case 'accommodation':
                            marker.addTo(accommodation)
                            .on('click', function(){
                                if(phone && website){
                                    marker.bindPopup(fullPopup)
                                    .openPopup();
                                }
                                else if(phone && !website){
                                    marker.bindPopup(phonePopup)
                                    .openPopup();
                                }
                                else if(!phone && website){
                                    marker.bindPopup(websitePopup)
                                    .openPopup();
                                }
                                else{
                                    marker.bindPopup(reducedPopup)
                                    .openPopup();
                                }     
                            })
                            attractionMarkers.addLayer(accommodation);
                        break;
                        case 'natural':
                            marker.addTo(natural)
                            .on('click', function(){
                                if(phone && website){
                                    marker.bindPopup(fullPopup)
                                    .openPopup();
                                }
                                else if(phone && !website){
                                    marker.bindPopup(phonePopup)
                                    .openPopup();
                                }
                                else if(!phone && website){
                                    marker.bindPopup(websitePopup)
                                    .openPopup();
                                }
                                else{
                                    marker.bindPopup(reducedPopup)
                                    .openPopup();
                                }  
                            })
                            attractionMarkers.addLayer(natural);
                        break;
                        case 'catering':
                            marker.addTo(catering)
                            .on('click', function(){
                                if(phone && website){
                                    marker.bindPopup(fullPopup)
                                    .openPopup();
                                }
                                else if(phone && !website){
                                    marker.bindPopup(phonePopup)
                                    .openPopup();
                                }
                                else if(!phone && website){
                                    marker.bindPopup(websitePopup)
                                    .openPopup();
                                }
                                else{
                                    marker.bindPopup(reducedPopup)
                                    .openPopup();
                                }  
                            })
                            attractionMarkers.addLayer(catering);
                        break;
                        case 'tourism':
                            marker.addTo(tourism)
                            .on('click', function(){
                                if(phone && website){
                                    marker.bindPopup(fullPopup)
                                    .openPopup();
                                }
                                else if(phone && !website){
                                    marker.bindPopup(phonePopup)
                                    .openPopup();
                                }
                                else if(!phone && website){
                                    marker.bindPopup(websitePopup)
                                    .openPopup();
                                }
                                else{
                                    marker.bindPopup(reducedPopup)
                                    .openPopup();
                                }  
                            })
                            attractionMarkers.addLayer(tourism);
                        break;
                        case 'entertainment':
                            marker.addTo(entertainment)
                            .on('click', function(){
                                if(phone && website){
                                    marker.bindPopup(fullPopup)
                                    .openPopup();
                                }
                                else if(phone && !website){
                                    marker.bindPopup(phonePopup)
                                    .openPopup();
                                }
                                else if(!phone && website){
                                    marker.bindPopup(websitePopup)
                                    .openPopup();
                                }
                                else{
                                    marker.bindPopup(reducedPopup)
                                    .openPopup();
                                }  
                            })
                            attractionMarkers.addLayer(entertainment);
                        break;
                    }               
                })               
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Get general data
const getGeneral = () => {
    $.ajax({
    url: "php/getCountryInfo.php",
    type: 'POST', 
    dataType: 'json',
    data: {
        country: $('.currentLocation').html()
    },
    success: function(result) {   
        var population = result['data'][0]['population'] * 1000;
        var formattedPop = population.toLocaleString('en-US');
        
        if(result.status.name == "ok"){
            $('#region').html([result['data'][0]['region']]);
            $('#capital').html([result['data'][0]['capital']]);
            $('#population').html(formattedPop);
            $('#maleLE').html([result['data'][0]['life_expectancy_male']]);
            $('#femaleLE').html([result['data'][0]['life_expectancy_female']]);
        }
    },
    error: function(error) {
        console.error(error);
    }
    });
}
// Get financial data
const getFinancial = () => {
    $.ajax({
    url: "php/getCountryInfo.php",
    type: 'POST', 
    dataType: 'json',
    data: {
        country: $('.currentLocation').html()
    },
    success: function(result) {   
        if(result.status.name == "ok"){
            $('#currency').html([result['data'][0]['currency']['name']]);
            $('#currencyCode').html([result['data'][0]['currency']['code']]);
            $('#GDP').html([result['data'][0]['gdp']].toLocaleString('en-US'));
            $('#GDPperCapita').html([result['data'][0]['gdp_per_capita']].toLocaleString('en-US'));
            $('#exchangeCurrency').html([result['data'][0]['currency']['code']])
        }
    },
    error: function(error) {
        console.error(error);
    }
    });
}
// Get news
const getNews = () => {
    $.ajax({
        url: "php/getNews.php",
        type: 'POST', 
        dataType: 'json',
        data: {
            country: countryCode,
            category: newsCategory
        },
        success: function(result) {  
            if(result.status.name == "ok"){
                if(result.data.status == 'error'){
                    var noNews = $('<div></div>').css({'margin' : '10px'})
                        noNews.append($('<h1></h1>')).html('No articles found.').
                        css({
                            'padding' : '5px',
                            'margin' : '5px',
                            'font-weight' : 'bold'
                        })
                    $('#newsList').append(noNews)
                }
                else{
                    let articles = result.data.results
                    articles.forEach(article => {
                        var listItem = $('<li></li>').css({'margin' : '10px'})
                        listItem.append($('<h1></h1>')).html(article.title + '.').
                        css({
                            'padding' : '5px',
                            'margin' : '5px',
                            'font-weight' : 'bold'
                        })
                        listItem.on('click', function(){
                            var url = article.link
                            window.open(url, '_blank').focus();
                        })
                        $('#newsList').append(listItem)
                    })
                }
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}
// Get cityinfo
const getEvents = () => {
    $.ajax({
        url: "php/getEvents.php",
        type: 'POST', 
        dataType: 'json',
        data: {
            city: cityName,
            category: $('#eventCategory').val(),
            date: $('#eventDate').val()
        },
        success: function(result) {
            if(result.status.name == "ok"){
                if(result.data == null){
                    var noEvent = $('<div></div>').css({'margin' : '10px'})
                    noEvent.append($('<h1></h1>')).html('No events found.').
                    css({
                        'padding' : '5px',
                        'margin' : '5px',
                        'font-weight' : 'bold'
                    })
                $('#eventList').append(noEvent)
                }
                else{
                    let events = result.data._embedded.events
                    events.forEach(event => {
                        var listItem = $('<li>' + event.name + '</li>').css(
                            {
                                'font-weight': 'bold',
                                'height':'auto',
                                'margin':'10px'
                            }
                        )                   
                        listItem.append('<p id="eventDesc">Date: ' + event.dates.start.localDate + ' Time: ' + event.dates.start.localTime + '</p>')                 
                        listItem.on('click', function(){
                            var url = event.url
                            window.open(url, '_blank').focus();
                        })
                        $('#eventList').append(listItem)
                    }) 
                }
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}
// Get weather
const getWeather = (location) => {
    $.ajax({
        url: "php/getWeather.php",
        type: 'POST', 
        dataType: 'json',
        data: {
            location: location
        },
        success: function(result) {
            if(result){
                currentMenu = "weather";
                const cleanDate = (date) =>{
                    let formattedDate = '';
                    formattedDate += (date.slice(5).replace('-', '/'));
                    return formattedDate;
                }               
                $('#currentWLocation').html(result['data']['resolvedAddress']);
                $('.countryFlag').html($('<img>',{class: 'icon', src:'dependencies/Flag Icons/' + countryCode + '.svg'}))
                $('#condition').html(result['data']['currentConditions']['conditions'])
                $('#conditionIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['currentConditions']['icon'] + '.png'}))
                $('#currentTemp').html(result['data']['currentConditions']['temp'] + ' ℃')
                $('#feelsLike').html(result['data']['currentConditions']['feelslike'] + ' ℃')
            
                $('#dayOneIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][0]['icon'] + '.png'}))
                $('#dayOneTemp').html(result['data']['days'][0]['temp'] + ' ℃');
                $('#dayOneDate').html(cleanDate(result['data']['days'][0]['datetime']));
                $('#dayTwoIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][1]['icon'] + '.png'}))
                $('#dayTwoTemp').html(result['data']['days'][1]['temp'] + ' ℃');
                $('#dayTwoDate').html(cleanDate(result['data']['days'][1]['datetime']));
                $('#dayThreeIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][2]['icon'] + '.png'}))
                $('#dayThreeTemp').html(result['data']['days'][2]['temp'] + ' ℃');
                $('#dayThreeDate').html(cleanDate(result['data']['days'][2]['datetime']));
                $('#dayFourIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][3]['icon'] + '.png'}))
                $('#dayFourTemp').html(result['data']['days'][3]['temp'] + ' ℃');
                $('#dayFourDate').html(cleanDate(result['data']['days'][3]['datetime']));
                $('#dayFiveIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][4]['icon'] + '.png'}))
                $('#dayFiveTemp').html(result['data']['days'][4]['temp'] + ' ℃');
                $('#dayFiveDate').html(cleanDate(result['data']['days'][4]['datetime']));
                $('#daySixIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][5]['icon'] + '.png'}))
                $('#daySixTemp').html(result['data']['days'][5]['temp'] + ' ℃');
                $('#daySixDate').html(cleanDate(result['data']['days'][5]['datetime']));
                $('#daySevenIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][6]['icon'] + '.png'}))
                $('#daySevenTemp').html(result['data']['days'][6]['temp'] + ' ℃');
                $('#daySevenDate').html(cleanDate(result['data']['days'][6]['datetime']));
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}
// Get Airports
const getAirports = (city, country) => {
    $.ajax({
        url: "php/getAirports.php",
        type: 'POST', 
        dataType: 'json',
        data: {
            city: city,
            country: country
        },
        success: function(result) { 
            let airports = result['data']
            if(result.status.name == "ok"){
                airports.forEach(airport => {
                    var marker = L.ExtraMarkers.icon({
                        icon: 'fa-plane',
                        markerColor: 'gray',
                        prefix: 'fa-solid'
                    });
                    var marker = L.marker([airport.latitude, airport.longitude], {icon: marker})
                    .bindPopup('<b>' + airport.name + '</b><br>')
                    marker.addTo(airportLayer)
                    .on('click', function(){
                        marker.openPopup();
                    }) 
                })

            }
        },
        error: function(error) {
            console.error(error);
        }
        });
}
// Exchange currency
const exchangeCurrency = () => {
    $.ajax({
        url: "php/exchangeCurrency.php",
        type: 'POST',
        dataType: 'json',
        data: {
            have: $('#localCurrency').html(),
            want: $('#exchangeCurrency').html(),
            amount: $('#convertAmount').val()
        },
        success: function(result){
            if(result.status.name == "ok"){
                $('#currencyResult').html(result['data']['new_amount'].toLocaleString('en-US') + ' ' + $('#exchangeCurrency').html())
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Clear city attractions
const clearCityAttractions = () => {
    accommodation.clearLayers();
    natural.clearLayers();
    catering.clearLayers();
    tourism.clearLayers();
    entertainment.clearLayers();
    airportLayer.clearLayers();
    attractionMarkers.clearLayers();
    checked = [];
    $('.attractionSelector').removeClass('checked');
}
// Clear table values
const clearValues = () => {
    $('.value').html("...");
    $('#currencyResult').html("");
    weatherName = "";
}

// Refresh current location
$('#refreshButton').on('click', function() {
    $('#currentLocation1').html('...');
    getCurrentLocation();
})
// Country Selector
$('#countryDropDown').on('change', function() { 
    $('.buttons').removeClass('on');
    $('#cityButtons').removeClass('show');
    $('#attractionDiv').removeClass('show');
    $('.display').removeClass('show');

    clearCityAttractions();
    currentLocation = $('#countryDropDown').val()
    cityGroup.clearLayers();
    countryBorder.clearLayers();
    clearValues();
    
    $.ajax({
        url: "php/countrySelector.php",
        type: 'POST', 
        dataType: 'json',
        data: {
            country: $('#countryDropDown').val()
        },
        success: function(result) {
            var northeast = [result['data']['northeast']['lat'], result['data']['northeast']['lng']]
            var southwest = [result['data']['southwest']['lat'], result['data']['southwest']['lng']]
            bounds = [northeast, southwest]
            countryCode = [result['data'][0]['components']['ISO_3166-1_alpha-2']][0];

            if(result.status.name == "ok"){
                map.flyToBounds(bounds);
                $('.currentLocation').html($('#countryDropDown').val());
                $('.countryFlag').html($('<img>',{class: 'icon', src:'dependencies/Flag Icons/' + result['data'][0]['components']['ISO_3166-1_alpha-2'] + '.svg'}))   
                drawBorder()       
                renderCities() 
                if(currentMenu === "finance"){
                    getFinancial();
                }
                else{
                    getGeneral();
                }
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
});
// Accessing country information
$('#generalButton').on('click', function(){
    currentMenu = "general";
    $('.multiList').empty();
    $('.display').addClass('show');
    $('#generalButton').addClass('on');
    $('#newsButton').removeClass('on');
    $('#eventButton').removeClass('on');
    $('#financialButton').removeClass('on');
    $('#weatherButton').removeClass('on');
    $('#cityAlert').removeClass('show')

    $('#generalDisplay').css({"visibility" : "visible"});
    $('#newsDisplay').css({"visibility" : "hidden"});
    $('#financialDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'hidden'});
    $('#eventDisplay').css({"visibility" : "hidden"});
    $('.hideButton').css({'visibility': 'visible'});
    getGeneral();
})
// Accessing country financials info
$('#financialButton').on('click', function(){
    currentMenu = "finance";
    $('.multiList').empty();
    $('.display').addClass('show');
    $('#financialButton').addClass('on');
    $('#newsButton').removeClass('on');
    $('#eventButton').removeClass('on');
    $('#weatherButton').removeClass('on');
    $('#generalButton').removeClass('on');
    $('#cityAlert').removeClass('show')
    
    $('#financialDisplay').css({"visibility" : "visible"});
    $('#newsDisplay').css({"visibility" : "hidden"});
    $('#eventDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'hidden'});
    $('#generalDisplay').css({"visibility" : "hidden"});
    $('.hideButton').css({'visibility': 'visible'});
    $('#localCurrency').html('GBP')
    getFinancial();
})
// Accessing news
$('#newsButton').on('click', function(){
    $('.multiList').empty();
    $('.display').addClass('show');
    $('#newsButton').addClass('on');
    $('#generalButton').removeClass('on');
    $('#financialButton').removeClass('on');
    $('#weatherButton').removeClass('on');
    $('#eventButton').removeClass('on');
    $('#cityAlert').removeClass('show')

    $('#newsDisplay').css({"visibility" : "visible"});
    $('#eventDisplay').css({"visibility" : "hidden"});
    $('#financialDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'hidden'});
    $('#generalDisplay').css({"visibility" : "hidden"});
    $('.hideButton').css({'visibility': 'visible'});
    getNews();
})
// Exchange Currency
$('#convertButton').on('click', function(){
    exchangeCurrency();
})
// Weather Button
$('#weatherButton').on('click', function(){
    $('.multiList').empty();
    $('.display').addClass('show');
    $('#weatherButton').addClass('on');
    $('#newsButton').removeClass('on');
    $('#financialButton').removeClass('on');
    $('#generalButton').removeClass('on');
    $('#eventButton').removeClass('on');
    $('#cityAlert').removeClass('show')

    $('#newsDisplay').css({"visibility" : "hidden"});
    $('#eventDisplay').css({"visibility" : "hidden"});
    $('#financialDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'visible'})
    $('#generalDisplay').css({"visibility" : "hidden"});
    $('.hideButton').css({'visibility': 'visible'});
    getWeather(cityName);
})
// Weather Button
$('#eventButton').on('click', function(){
    $('.multiList').empty();
    $('.display').addClass('show');
    $('#eventButton').addClass('on');
    $('#newsButton').removeClass('on');
    $('#generalButton').removeClass('on');
    $('#financialButton').removeClass('on');
    $('#weatherButton').removeClass('on');
    $('#cityAlert').removeClass('show')

    $('#eventDisplay').css({'visibility':'visible'});
    $('#newsDisplay').css({'visibility':'hidden'});
    $('#financialDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'hidden'});
    $('#generalDisplay').css({"visibility" : "hidden"});
    $('.hideButton').css({'visibility': 'visible'});
})
// Hide button
$('.hideButton').on('click', function(){
    $('.display').removeClass('show');
    $('.buttons').removeClass('on');
    $('.hideButton').css({'visibility': 'hidden'})
})
// Recenter button
$('#reCenter').on('click', function(){
    if(citiesRendered == false){
       renderCities(); 
    }
    clearCityAttractions();
    $('#cityButtons').removeClass('show');
    $('#attractionDiv').removeClass('show');
    $('.attractionSelector').removeClass('checked');
    map.flyToBounds(bounds);
    
})
// Wikipedia link
$('#wikiButton').on('click', function(){
    var country = currentLocation.replace(' ', '_');
    var url = 'https://en.wikipedia.org/wiki/' + country;
    window.open(url, '_blank').focus();
})
// Attraction select
$('.attractionSelector').on('click', function(){      
    citiesRendered = false;
    switch(this.id){
        case 'accommodation':
            if(!checked.includes('accommodation')){
                getCityAttractions(citylat, citylng, this.id, 'fa-bed', 'black')
                $(('#'+this.id)).addClass('checked');
                checked.push('accommodation');
                cityGroup.clearLayers();
                map.flyTo([citylat, citylng], 12, {animate:true});
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                attractionMarkers.removeLayer(accommodation);
                accommodation.clearLayers();
                checked = checked.filter(e => e !== 'accommodation');
            }    
        break;
        case 'natural':
            if(!checked.includes('natural')){                
                getCityAttractions(citylat, citylng, this.id, 'fa-leaf', 'green')
                $(('#'+this.id)).addClass('checked');
                checked.push('natural');
                cityGroup.clearLayers();
                map.flyTo([citylat, citylng], 12, {animate:true});
            }
            else{              
                $(('#'+this.id)).removeClass('checked');
                attractionMarkers.removeLayer(natural);
                natural.clearLayers();
                checked = checked.filter(e => e !== 'natural');             
            }  
        break;
        case 'catering':
            if(!checked.includes('catering')){              
                getCityAttractions(citylat, citylng, this.id, 'fa-utensils', 'yellow')
                $(('#'+this.id)).addClass('checked'); 
                checked.push('catering'); 
                cityGroup.clearLayers();
                map.flyTo([citylat, citylng], 12, {animate:true});
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                attractionMarkers.removeLayer(catering);
                catering.clearLayers();
                checked = checked.filter(e => e !== 'catering');
            }  
        break;
        case 'tourism':
            if(!checked.includes('tourism')){
                getCityAttractions(citylat, citylng, this.id, 'fa-camera', 'blue')
                $(('#'+this.id)).addClass('checked');
                checked.push('tourism');
                cityGroup.clearLayers();
                map.flyTo([citylat, citylng], 12, {animate:true});
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                attractionMarkers.removeLayer(tourism);
                tourism.clearLayers();
                checked = checked.filter(e => e !== 'tourism'); 
            }  
        break;
        case 'entertainment':
            if(!checked.includes('entertainment')){
                getCityAttractions(citylat, citylng, this.id, 'fa-masks-theater', 'red')
                $(('#'+this.id)).addClass('checked');
                checked.push('entertainment');
                cityGroup.clearLayers();
                map.flyTo([citylat, citylng], 12, {animate:true});
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                attractionMarkers.removeLayer(entertainment);
                entertainment.clearLayers();
                checked = checked.filter(e => e !== 'entertainment'); 
            }  
        break;
    }
    
})
map.on('zoom', function(){
    if(map.getZoom() === 8){
        if(citiesRendered == false){
            renderCities(); 
         }
        clearCityAttractions();
        $('.display').removeClass('show');
        $('.buttons').removeClass('on');
        $('.hideButton').css({'visibility': 'hidden'})
    }
})
$('#newsCategory').on('change', function(){
    $('#newsList').empty();
    category = $('#newsCategory').val();
    getNews();
})
$('#eventSearch').on('click', function(){
    $('.multiList').empty();
    getEvents()
})




