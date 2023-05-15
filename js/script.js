const map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false}).setView([0,0], 2);
var tiles = L.tileLayer('https://maptiles.p.rapidapi.com/en/map/v1/{z}/{x}/{y}.png?rapidapi-key=650a4aee3dmshcbae477804e985dp1d43b8jsnc80d07159f68', {
	attribution: '&copy; <a href="http://www.maptilesapi.com/">MapTiles API</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	apikey: '<650a4aee3dmshcbae477804e985dp1d43b8jsnc80d07159f68>',
	maxZoom: 19
}).addTo(map);
tiles.on('load', function(){
    $('#map').css({'visibility':'visible'});
    $('#enterDiv').css({'visibility':'visible'});
    $('#enterDiv').addClass('fadeIn')
})
// Feature Groups
var countryBorder = new L.FeatureGroup().addTo(map);
var cityGroup = new L.FeatureGroup().addTo(map)
var accommodation = new L.FeatureGroup().addTo(map);
var natural = new L.FeatureGroup().addTo(map);
var catering = new L.FeatureGroup().addTo(map);
var tourism = new L.FeatureGroup().addTo(map);
var entertainment = new L.FeatureGroup().addTo(map);
var airportLayer = new L.FeatureGroup().addTo(map);
// Variables
var currentLocation = "";
var countryCode = "";
var localCurrency = "";
var lat = 0;
var lng = 0;
var currentMenu = "";
var bounds = [];
var weatherName = "";
var citylat = 0;
var citylng = 0;
var checked = [];
// Populate dropdown list
async function populateCountries(){
    const response = await fetch('dependencies/countryBorders.geo.json');
    const json = await response.json();  
    const featuresArray = json['features'];
    const countries = featuresArray.map(country => [country.properties.name, country.properties.iso_a2])
    countries.sort();
    for(i = 0; i < countries.length; i++){
        $('#countryDropDown').append($('<option></option>').html(countries[i][0]).val(countries[i][0]));
    }
}
// Draw Border
async function drawBorder(){
    const response = await fetch('dependencies/countryBorders.geo.json');
    const json = await response.json();  
    const featuresArray = json['features']
    var index = -1;
    featuresArray.find(function(item, i){
        if(item.properties.name === currentLocation){
            index = i;
            return i;
        }
    });
    var coords = featuresArray[index]['geometry']['coordinates'];
    var reversedCoords = coords.map(function reverse(item) {
        return Array.isArray(item) && Array.isArray(item[0]) 
                   ? item.map(reverse) 
                   : item.reverse();
    });
    var polygon = L.polygon(reversedCoords, {color: 'white'});
    polygon.addTo(countryBorder);
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
                let cityData = result['data'];
                cityData.forEach(city => {
                    var marker = L.marker([city.latitude, city.longitude])
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
                        weatherName = city.name;
                        getWeather(weatherName);
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
                    var marker = L.ExtraMarkers.icon({
                        icon: icon,
                        markerColor: colour,
                        prefix: 'fa-solid'
                    });
                    let phone = feature.properties.datasource.raw.phone;
                    let website = feature.properties.datasource.raw.website;
                    let name = feature.properties.address_line1;
                    let address = feature.properties.address_line2
                    var marker = L.marker([feature.properties.lat, feature.properties.lon], {icon: marker})

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
    checked = [];
    $('.attractionSelector').removeClass('checked');
}
// Clear table values
const clearValues = () => {
    $('.value').html("...");
    $('#currencyResult').html("");
    weatherName = "";
}
// On load
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
// Refresh current location
$('#refreshButton').on('click', function() {
    $('#currentLocation1').html('...');
    getCurrentLocation();
})
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
                            $('.countryFlag').html($('<img>',{class: 'icon', src:'dependencies/Flag Icons/' + result['data'][0]['components']['ISO_3166-1_alpha-2'] + '.svg'}))
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
// Menu Toggle
$('#menuToggle').on('click', function() {
    $('#menuToggle').toggleClass('on');
    $('#buttonContainer').toggleClass('show');   
    $('.display').removeClass('show');
    $('#generalButton').removeClass('on');
    $('#financialButton').removeClass('on');
    $('#weatherButton').removeClass('on');
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
    $('.display').addClass('show');
    $('#generalButton').addClass('on');
    $('#financialButton').removeClass('on');
    $('#weatherButton').removeClass('on');

    $('#financialDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'hidden'});
    $('#generalDisplay').css({"visibility" : "visible"});
    $('#hide').css({'visibility': 'visible'});
    getGeneral();
})
// Accessing country financials info
$('#financialButton').on('click', function(){
    currentMenu = "finance";
    $('.display').addClass('show');
    $('#financialButton').addClass('on');
    $('#weatherButton').removeClass('on');
    $('#generalButton').removeClass('on');

    $('#financialDisplay').css({"visibility" : "visible"});
    $('#weatherDisplay').css({'visibility': 'hidden'});
    $('#generalDisplay').css({"visibility" : "hidden"});
    $('#hide').css({'visibility': 'visible'});

    $('#localCurrency').html('GBP')
    getFinancial();
})
// Exchange Currency
$('#convertButton').on('click', function(){
    exchangeCurrency();
})
// Weather Button
$('#weatherButton').on('click', function(){
    $('.display').addClass('show');
    $('#weatherButton').addClass('on');
    $('#financialButton').removeClass('on');
    $('#generalButton').removeClass('on');

    $('#financialDisplay').css({"visibility" : "hidden"});
    $('#weatherDisplay').css({'visibility': 'visible'})
    $('#generalDisplay').css({"visibility" : "hidden"});
    $('#hide').css({'visibility': 'visible'});
    getWeather(weatherName);
})
// Hide button
$('.hideButton').on('click', function(){
    $('.display').removeClass('show');
    $('.buttons').removeClass('on');
    $('#hide').css({'visibility': 'hidden'})
})
// Recenter button
$('#reCenter').on('click', function(){
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
    switch(this.id){
        case 'accommodation':
            if(!checked.includes('accommodation')){
                getCityAttractions(citylat, citylng, this.id, 'fa-bed', 'black')
                $(('#'+this.id)).addClass('checked');
                checked.push('accommodation');
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                accommodation.clearLayers();
                checked = checked.filter(e => e !== 'accommodation');
            }    
        break;
        case 'natural':
            if(!checked.includes('natural')){                
                getCityAttractions(citylat, citylng, this.id, 'fa-leaf', 'green')
                $(('#'+this.id)).addClass('checked');
                checked.push('natural');
            }
            else{              
                $(('#'+this.id)).removeClass('checked');
                natural.clearLayers();
                checked = checked.filter(e => e !== 'natural');             
            }  
        break;
        case 'catering':
            if(!checked.includes('catering')){              
                getCityAttractions(citylat, citylng, this.id, 'fa-utensils', 'yellow')
                $(('#'+this.id)).addClass('checked'); 
                checked.push('catering'); 
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                catering.clearLayers();
                checked = checked.filter(e => e !== 'catering');
            }  
        break;
        case 'tourism':
            if(!checked.includes('tourism')){
                getCityAttractions(citylat, citylng, this.id, 'fa-camera', 'blue')
                $(('#'+this.id)).addClass('checked');
                checked.push('tourism');
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                tourism.clearLayers();
                checked = checked.filter(e => e !== 'tourism'); 
            }  
        break;
        case 'entertainment':
            if(!checked.includes('entertainment')){
                getCityAttractions(citylat, citylng, this.id, 'fa-masks-theater', 'red')
                $(('#'+this.id)).addClass('checked');
                checked.push('entertainment');
            }
            else{
                $(('#'+this.id)).removeClass('checked');
                entertainment.clearLayers();
                checked = checked.filter(e => e !== 'entertainment'); 
            }  
        break;
    }
    
})

/*
Extra bits:
- Splash page animation.??
- Front page loader.
- Loading animations.
*/



