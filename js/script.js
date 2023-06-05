/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Leaflet components =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
const map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false}).setView([0,0], 2);
var openstreetTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
	maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>'
});
var baseMaps = {
    'OpenStreetMap': openstreetTile,
    'Dark Mode': Stadia_AlidadeSmoothDark
}
var layerControl = L.control.layers(baseMaps).addTo(map);
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

/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= On Load =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
openstreetTile.on('load', function(){
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

/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Variables =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
var localCurrency = ""
var currentLocation = "";
var countryCode = "";
var localCurrency = "";
var lat = 0;
var lng = 0;
var bounds = [];
var cityName = "";
var citylat = 0;
var citylng = 0;
var checked = [];
var newsCategory ='top';
var citiesRendered;

/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
-                                                  Functions
=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Info Panel Buttons =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
// General
const getGeneral = () => {
    $.ajax({
    url: "php/getCountryInfo.php",
    type: 'POST', 
    dataType: 'json',
    data: {
        countryCode: countryCode
    },
    success: function(result) {   
        var population = result['data'][0]['population'] * 1000;
        var formattedPop = population.toLocaleString('en-US');   
        if(result.status.name == "ok"){
            $('#region').html([result['data'][0]['region']]);
            $('#capital').html([result['data'][0]['capital']]);
            $('#population').html(formattedPop);
            $('#maleLE').html('Male: ' + [result['data'][0]['life_expectancy_male']]);
            $('#femaleLE').html('Female: ' + [result['data'][0]['life_expectancy_female']]);
            $('.countryFlag').html($('<img>',{class: 'icon', src:'dependencies/Flag Icons/' + countryCode + '.svg'}))
        }
    },
    error: function(error) {
        console.error(error);
    }
    });
}
// Financial
const getFinancial = () => {
    $.ajax({
    url: "php/getCountryInfo.php",
    type: 'POST', 
    dataType: 'json',
    data: {
        countryCode: countryCode
    },
    success: function(result) {   
        if(result.status.name == "ok"){
            $('#currency').html([result['data'][0]['currency']['name']]);
            $('#currencyCode').html([result['data'][0]['currency']['code']]);
            $('#GDP').html([result['data'][0]['gdp']]);
            $('#GDPperCapita').html([result['data'][0]['gdp_per_capita']]);
            $('#exchangeCurrency').val([result['data'][0]['currency']['code']])
            if(!localCurrency){
                localCurrency = $('#localCurrency').val(result['data'][0]['currency']['code'])
            }
        }
    },
    error: function(error) {
        console.error(error);
    }
    });
}
// Currency
const exchangeCurrency = () => {
    $.ajax({
        url: "php/exchangeCurrency.php",
        type: 'POST',
        dataType: 'json',
        data: {
            have: $('#localCurrency').val(),
            want: $('#exchangeCurrency').val(),
            amount: $('#convertAmount').val()
        },
        success: function(result){
            if(result.status.name == "ok"){
                $('#currencyResult').html(result['data']['new_amount'] + ' ' + $('#exchangeCurrency').val())
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// News
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
                if(result.data.totalResults == 0){
                    var noNews = $('<div></div>').css({'margin' : '10px'})
                    noNews.append($('<h1 class="noResult"></h1>')).html('No articles found.')                  
                    $('#newsList').append(noNews)
                }
                else{
                    let articles = result.data.results
                    console.log(articles);
                    articles.forEach(article => {
                        var listItem = $('<li class="multiListItem"></li>')
                        var newsTitle = $('<div class="articleTitle">' + article.title + '.<div>')
                        var newsSource = $('<p>Source: ' + article.source_id + '</p>')      
                        listItem.append(newsTitle, newsSource)
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
// Events
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
                if(result.data.page.totalElements == 0){
                    var noEvent = $('<div></div>').css({'margin' : '10px'})
                    noEvent.append($('<h1></h1>')).html('No events found.')
                    $('#eventList').append(noEvent)
                }
                else{
                    let events = result.data._embedded.events
                    events.forEach(event => {
                        var listItem = $('<li class="multiListItem"><b>' + event.name + '</b></li>')          
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
// Weather
const getWeather = (location) => {
    $.ajax({
        url: "php/getWeather.php",
        type: 'POST', 
        dataType: 'json',
        data: {
            countryCode: countryCode,
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
                $('#currentWLocation').html(location +', Today: ');
                $('#condition').html(result['data']['currentConditions']['conditions']);
                $('#conditionIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['currentConditions']['icon'] + '.png'}))
                $('#currentTemp').html(Math.floor(result['data']['currentConditions']['temp']) + '&deg;c')
            
                $('#dayOneIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][0]['icon'] + '.png'}))
                $('#dayOneTemp').html(Math.floor(result['data']['days'][0]['temp']) + '&deg;c');
                $('#dayOneDate').html(cleanDate(result['data']['days'][0]['datetime']));
                $('#dayTwoIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][1]['icon'] + '.png'}))
                $('#dayTwoTemp').html(Math.floor(result['data']['days'][1]['temp']) + '&deg;c');
                $('#dayTwoDate').html(cleanDate(result['data']['days'][1]['datetime']));
                $('#dayThreeIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][2]['icon'] + '.png'}))
                $('#dayThreeTemp').html(Math.floor(result['data']['days'][2]['temp']) + '&deg;c');
                $('#dayThreeDate').html(cleanDate(result['data']['days'][2]['datetime']));
                $('#dayFourIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][3]['icon'] + '.png'}))
                $('#dayFourTemp').html(Math.floor(result['data']['days'][3]['temp']) + '&deg;c');
                $('#dayFourDate').html(cleanDate(result['data']['days'][3]['datetime']));
                $('#dayFiveIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][4]['icon'] + '.png'}))
                $('#dayFiveTemp').html(Math.floor(result['data']['days'][4]['temp']) + '&deg;c');
                $('#dayFiveDate').html(cleanDate(result['data']['days'][4]['datetime']));
                $('#daySixIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][5]['icon'] + '.png'}))
                $('#daySixTemp').html(Math.floor(result['data']['days'][5]['temp']) + '&deg;c');
                $('#daySixDate').html(cleanDate(result['data']['days'][5]['datetime']));
                $('#daySevenIcon').html($('<img>',{class: 'icon', src:'dependencies/Weather Icons/' + result['data']['days'][6]['icon'] + '.png'}))
                $('#daySevenTemp').html(Math.floor(result['data']['days'][6]['temp']) + '&deg;c');
                $('#daySevenDate').html(cleanDate(result['data']['days'][6]['datetime']));
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}
/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Render Functions =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
// Airports
const renderAirports = (city, country) => {
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
// Border
const renderBorder = () => {
    $.ajax({
        url: "php/accessGeoJson.php",
        type: 'POST',
        dataType: 'json',
        success: function(result){
            if(result){
                const featuresArray = result['data']
                var index = -1;
                featuresArray.find(function(item, i){
                    if(item.properties.iso_a2 === countryCode){
                        index = i;
                    }
                });
                var coords = featuresArray[index]['geometry']['coordinates'];
                var reversedCoords = coords.map(function reverse(item) {
                    return Array.isArray(item) && Array.isArray(item[0]) 
                               ? item.map(reverse) 
                               : item.reverse();
                });
                var polygon = L.polygon(reversedCoords, {color: 'green', fillOpacity: '0.1'});
                polygon.addTo(countryBorder)
                map.flyToBounds(countryBorder.getBounds());                            
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Cities
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
                    .bindPopup('City: ' + city.name + '<br> Population: ' + city.population + '<br>');
                    marker.addTo(cityGroup)
                    .on('click', function(){                      
                        citylat = city.latitude;
                        citylng = city.longitude;
                        cityName = city.name;
                        clearCityAttractions();
                        $('#cityButtons').addClass('show');
                        $('#attractionDiv').addClass('show');
                        $('#cityAlert').removeClass('show')
                        marker.openPopup();                  
                        map.flyTo([city.latitude, city.longitude], 10);                       
                        getWeather(cityName);
                        renderAirports(city.name, city.country);
                    })
                })    
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}
// City Attractions
const renderCityAttractions = (lat, lng, category, icon, colour) => {
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
/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Helper Functions =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
// Get current location/Enter function
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
                $('.currentLocation').html(currentLocation);
                $('#enterButton').addClass('ready');
                $('#enterLoader').remove();               
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Clear City Attractions
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
// Clear Table Values
const clearValues = () => {
    $('#currencyResult').html("");
    weatherName = "";
}
// Populate Countries
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
                    $('#countryDropDown').append($('<option></option>').html(countries[i][0]).val(countries[i][1]));
                    $('#countryDropDown').val(countryCode)
                } 
            }
        },
        error: function(error){
            console.log(error);
        }
    });
}
// Populate Financial
const populateFinancial = () => {
    $.ajax({
        url: "php/accessCurrencyCodes.php",
        type: 'POST', 
        dataType: 'json',
        success: function(result) {   
            if(result.status.name == "ok"){
                const currencies = result['data']
                for(i = 0; i < currencies.length; i++){
                    $('#localCurrency').append($('<option></option>').html(currencies[i]['code']).val(currencies[i]['code']));
                    $('#exchangeCurrency').append($('<option></option>').html(currencies[i]['code']).val(currencies[i]['code']));
                } 
            }
        },
        error: function(error) {
            console.error(error);
        }
    });
}
/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
-                                               Utility Features
=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
// Entering App
$('#enterButton').on('click', function() {                
    $('#enterDiv').removeClass('fadeIn');      
    $('#enterDiv').remove();
    $('#nav').addClass('show');
    $('#buttonContainer').addClass('show');
    $('.leaflet-control-layers').addClass('show');                   
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    populateCountries();
    populateFinancial();                                                                                                                  
    getGeneral();
    getFinancial();
    getNews();  
    renderBorder()   
    renderCities()                           
    setTimeout(function(){
        $('#cityAlert').css({"visibility" : "visible"});
        $('#cityAlert').addClass('show');
    }, 1000)                   
});
// Country Selector
$('#countryDropDown').on('change', function() { 
    countryCode = $('#countryDropDown').val()
    cityGroup.clearLayers();
    countryBorder.clearLayers();
    $('.buttons').removeClass('on');
    $('#cityButtons').removeClass('show');
    $('#attractionDiv').removeClass('show');
    $('.display').removeClass('show');
    $('.currentLocation').html($('#countryDropDown :selected').text());
    $('.countryFlag').html($('<img>',{class: 'icon', src:'dependencies/Flag Icons/' + countryCode + '.svg'})) 
    clearCityAttractions();    
    clearValues();
    getGeneral();
    getFinancial();
    populateFinancial();  
    renderBorder();    
    renderCities(); 
});
// Refresh current location
$('#refreshButton').on('click', function() {
    $('#currentLocation1').html('...');
    getCurrentLocation();
})
// Hide button
$('.hideButton').on('click', function(){
    $('.display').removeClass('show');
    $('.buttons').removeClass('on');
    $('.hideButton').css({'visibility': 'hidden'})
})
/*=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Info Panel Buttons =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=*/
// Re-center
$('#homeButton').on('click', function(){
    if(citiesRendered == false){
       renderCities(); 
    }
    clearCityAttractions();
    $('.buttons').removeClass('on');
    $('.display').removeClass('show');
    $('#cityButtons').removeClass('show');
    $('#attractionDiv').removeClass('show');
    $('.attractionSelector').removeClass('checked');
    map.flyToBounds(countryBorder.getBounds());
    
})
// General Info
$('#generalButton').on('click', function(){
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
// Financials
$('#financialButton').on('click', function(){
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
    getFinancial();
})
$('#convertButton').on('click', function(){
    $('#currencyResult').html('...');
    exchangeCurrency();
})
// Accessing News
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
$('#newsCategory').on('change', function(){
    $('.multiList').empty();
    category = $('#newsCategory').val();
    getNews();
})
// Wikipedia
$('#wikiButton').on('click', function(){
    var country = currentLocation.replace(' ', '_');
    var url = 'https://en.wikipedia.org/wiki/' + country;
    window.open(url, '_blank').focus();
})
// Weather
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
// Accessing Events
$('#eventButton').on('click', function(){
    $('#eventDate').val(new Date().toISOString().substr(0, 10));
    $('.multiList').empty();
    $('.display').addClass('show');
    $('#eventButton').addClass('on');
    $('#newsButton').removeClass('on');
    $('#generalButton').removeClass('on');
    $('#financialButton').removeClass('on');
    $('#weatherButton').removeClass('on');
    $('#cityAlert').removeClass('show')
    getEvents()

    $('#eventDisplay').css({'visibility':'visible'});
    $('#newsDisplay').css({'visibility':'hidden'});
    $('#financialDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'hidden'});
    $('#generalDisplay').css({"visibility" : "hidden"});
    $('.hideButton').css({'visibility': 'visible'});
})
$('#eventSearch').on('click', function(){
    $('.multiList').empty();
    getEvents()
})
// Attraction Selector
$('.attractionSelector').on('click', function(){      
    citiesRendered = false;
    switch(this.id){
        case 'accommodation':
            if(!checked.includes('accommodation')){
                renderCityAttractions(citylat, citylng, this.id, 'fa-bed', 'black')
                $(('#'+this.id)).addClass('checked');
                checked.push('accommodation');
                cityGroup.clearLayers();
                if(map.getZoom() !== 12){
                    map.flyTo([citylat, citylng], 12, {animate:true});  
                }              
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
                renderCityAttractions(citylat, citylng, this.id, 'fa-leaf', 'green')
                $(('#'+this.id)).addClass('checked');
                checked.push('natural');
                cityGroup.clearLayers();
                if(map.getZoom() !== 12){
                    map.flyTo([citylat, citylng], 12, {animate:true});  
                }
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
                renderCityAttractions(citylat, citylng, this.id, 'fa-utensils', 'yellow')
                $(('#'+this.id)).addClass('checked'); 
                checked.push('catering'); 
                cityGroup.clearLayers();
                if(map.getZoom() !== 12){
                    map.flyTo([citylat, citylng], 12, {animate:true});  
                }
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
                renderCityAttractions(citylat, citylng, this.id, 'fa-camera', 'blue')
                $(('#'+this.id)).addClass('checked');
                checked.push('tourism');
                cityGroup.clearLayers();
                if(map.getZoom() !== 12){
                    map.flyTo([citylat, citylng], 12, {animate:true});  
                }
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
                renderCityAttractions(citylat, citylng, this.id, 'fa-masks-theater', 'red')
                $(('#'+this.id)).addClass('checked');
                checked.push('entertainment');
                cityGroup.clearLayers();
                if(map.getZoom() !== 12){
                    map.flyTo([citylat, citylng], 12, {animate:true});  
                }
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





