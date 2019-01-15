/* --------------------------------------------------------------------------------- */
angular.module('coverage').controller('coverage_controller', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
  init_vars($scope);
  init_functions($scope, $http, $timeout);
}]);
/* --------------------------------------------------------------------------------- */
// bind auxiliary functions to $scope
/* --------------------------------------------------------------------------------- */
function init_functions($scope, $http, $timeout)
{
  $scope.add_contact = function() {
    if($scope.json_data)
      $scope.json_data.contact.push({ type : 0, privacy : 0 });
  }

  $scope.remove_contact = function(index) {
    if($scope.json_data)
      $scope.json_data.contact.splice(index, 1);
  }
 
  $scope.add_location = function() {
    if($scope.json_data) {
      $scope.json_data.location.push({ info_URL : [], address : [] });
      add_empty_loc($scope);
    }
    // map init is done automatically by acoordion expanding
  }

  $scope.remove_location = function(index) {
    if($scope.json_data) {
      // destroy map first
      if($scope.locations[index].map)
        $scope.locations[index].map.remove();

      $scope.json_data.location.splice(index, 1);
      $scope.locations.splice(index, 1);
    }
  }
 
  $scope.save_data = function() {
    save_json_to_api($scope, $http, $timeout);
  }

  $scope.validate_basic_info = function(form) {
    validate_basic_info($scope, form);
  }

  $scope.validate_admins = function(form) {
    validate_admins($scope, form);
  }

  $scope.validate_locations = function(form) {
    validate_locations($scope, form);
  }

  $scope.get_json = function() {
    $scope.loading = true;
    $scope.api_write_error = false;                 // no write error for newly selected realm

    if($scope.coverage_map && $scope.coverage_map.map) {
      $scope.coverage_map.map.remove();       // destroy global coverage map
      $scope.coverage_map.markers = [];       // clear all global markers
    }

    if(!$scope.basic_info.open)                    // only if closed
      $scope.accordion_shared_scope.toggleOpen();     // open the basic info tab on realm change

    // wait 500 ms before displaying the form
    // when switching realms, this seems usefull in the way the user knows that the form really changed
    $timeout(function () {
      $scope.loading = false;
    }, 500);

    get_json_from_api($scope, $http, $timeout);
  }

  $scope.find_map_location = function(index) {
    query_osm_api_by_input($scope, $timeout, $http, index);      // query the openstreetmap api
  }

  $scope.init_leaflet_by_id = function(index) {
    init_leaflet_map_by_id($scope, $http, $timeout, index);
  }

  $scope.init_coverage_map = function() {
    init_coverage_map($scope);
  }

  $scope.set_location_heading = function(index) {
    // set heading if city and street are set
    if($scope.json_data.location[index].address[0] && $scope.json_data.location[index].address[0].city && $scope.json_data.location[index].address[0].city.data &&
       $scope.json_data.location[index].address[0].street && $scope.json_data.location[index].address[0].street.data) {
      $scope.locations[index].heading = $scope.json_data.location[index].address[0].street.data + " " + $scope.json_data.location[index].address[0].city.data;
      $scope.coverage_map.markers[index].bindPopup($scope.locations[index].heading); // update global map marker popup
    }
  }

  $scope.$watch('api_write_error', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        if(newValue == true)
          scroll_to_error();
      }
  });
}
/* --------------------------------------------------------------------------------- */
// scroll page to error msg
/* --------------------------------------------------------------------------------- */
function scroll_to_error()
{
  setTimeout(function() {
    var element = document.getElementById('write_error');
    var topPos = element.getBoundingClientRect().top + window.scrollY;

    // scroll to table
    $('html, body').animate({
      scrollTop: topPos
    });
  }, 100);

  // timeout is used because ng-show changes the value instantly, but
  // it takes some time to render the element to the page
  // it is possible to get top element offset only after the element has been fully render
  // not a totally clean solution is used, but it should work quite well
  // wait 100 ms for the element to be fully rendered, then get top offset and scroll the page
}
/* --------------------------------------------------------------------------------- */
// validate basic info inputs
/* --------------------------------------------------------------------------------- */
function validate_basic_info($scope, form)
{
  if(form.name_cz.$error.required)
    $scope.basic_info_error = true;

  else if(form.name_en.$error.required)
    $scope.basic_info_error = true;

  else if(form.street_cz.$error.required)
    $scope.basic_info_error = true;

  else if(form.city_cz.$error.required)
    $scope.basic_info_error = true;

  else if(form.info_url_cz.$error.required || form.info_url_cz.$error.pattern)
    $scope.basic_info_error = true;

  else if(form.info_url_en.$error.required || form.info_url_en.$error.pattern)
    $scope.basic_info_error = true;

  else if(form.type.$error.required)
    $scope.basic_info_error = true;

  else
    $scope.basic_info_error = false;
}
/* --------------------------------------------------------------------------------- */
// validate admins
/* --------------------------------------------------------------------------------- */
function validate_admins($scope, form)
{
  for(var i = 0; i < $scope.json_data.contact.length; i++) {
    if(form["admin_" + i + "_name"].$error.required) {
      $scope.admins_error = true;
      break;
    }

    else if(form["admin_" + i + "_mail"].$error.required || form["admin_" + i + "_mail"].$error.pattern) {
      $scope.admins_error = true;
      break;
    }

    else if(form["admin_" + i + "_phone"].$error.required || form["admin_" + i + "_phone"].$error.pattern) {
      $scope.admins_error = true;
      break;
    }

    else if(form["admin_" + i + "_type"].$error.required) {
      $scope.admins_error = true;
      break;
    }

    else if(form["admin_" + i + "_privacy"].$error.required) {
      $scope.admins_error = true;
      break;
    }

    else {      // no other error occured
      if(i == $scope.json_data.contact.length -1)     // last item
        $scope.admins_error = false;
    }
  }
}
/* --------------------------------------------------------------------------------- */
// validate locations
/* --------------------------------------------------------------------------------- */
function validate_locations($scope, form)
{
  for(var i = 0; i < $scope.json_data.location.length; i++) {
    $scope.locations[i].error = true;

    if(form["location_" + i + "_street"].$error.required)
      ;

    else if(form["location_" + i + "_city"].$error.required)
      ;

    else if(form["location_" + i + "_info_url_cz"].$error.required || form["location_" + i + "_info_url_cz"].$error.pattern)
      ;

    else if(form["location_" + i + "_info_url_en"].$error.required || form["location_" + i + "_info_url_en"].$error.pattern)
      ;

    else if(form["location_" + i + "_coordinates"].$error.required)
      ;

    else if(form["location_" + i + "_enc_level"].$error.required)
      ;

    // wired is set - check wired_count
    else if($scope.locations[i].wired && form["location_" + i + "_wired_count"].$error.required)
      ;

    else if(form["location_" + i + "_ap_no"].$error.required)
      ;

    else      // no other error occured
      $scope.locations[i].error = false;        // location specific error
  }

  for(var i = 0; i < $scope.json_data.location.length; i++) {
    if($scope.locations[i].error) {
      $scope.location_error = true;
      break;
    }
  }

  // no locations present
  if($scope.json_data.location.length == 0)
    $scope.location_error = true;
}
/* --------------------------------------------------------------------------------- */
// initialize auxiliary variables
/* --------------------------------------------------------------------------------- */
function init_vars($scope)
{
  $scope.loading = false;
  $scope.api_read_error = false;
  $scope.api_write_error = false;
  $scope.api_write_success = false;
  $scope.basic_info = {};           // accordion only works correctly with object
  $scope.basic_info.open = false;
  $scope.locations = [];
  $scope.admin_realms = realms;
  $scope.admin = admin;
  $scope.url_regex = /^http(s)?:\/\/.+$/;
  $scope.phone_regex = /^[+]?[()/0-9. -]{12,}$/;
  $scope.mail_regex = /^.+@.+\..+$/;

  $scope.accordion_shared_scope = {};

  // accordion errors
  $scope.basic_info_error = false;
  $scope.admins_error = false;
  $scope.location_error = false;

  $scope.contact_type = [
    "osoba",
    "oddělení"
  ];

  $scope.contact_privacy = [
    "privátní",
    "veřejný"
  ];

  $scope.marker_icon = L.icon({
    iconUrl: '/images/map_icon8.png',
    iconSize:     [32, 32], // size of the icon
    iconAnchor:   [16, 32], // point of the icon which will correspond to marker's location
    popupAnchor:  [-2, -32] // point from which the popup should open relative to the iconAnchor
});
}
/* --------------------------------------------------------------------------------- */
// add lang for info url
/* --------------------------------------------------------------------------------- */
function add_info_url_lang($scope)
{
  if(!$scope.json_data.info_URL[0])     // check if object exists
    $scope.json_data.info_URL[0] = {};

  if(!$scope.json_data.info_URL[1])     // check if object exists
    $scope.json_data.info_URL[1] = {};

  $scope.json_data.info_URL[0].lang = "cs";
  $scope.json_data.info_URL[1].lang = "en";

  for(var i in $scope.json_data.location) {
    if(!$scope.json_data.location[i].info_URL[0])     // check if object exists
      $scope.json_data.location[i].info_URL[0] = {};

    if(!$scope.json_data.location[i].info_URL[1])     // check if object exists
      $scope.json_data.location[i].info_URL[1] = {};

    $scope.json_data.location[i].info_URL[0].lang = "cs";
    $scope.json_data.location[i].info_URL[1].lang = "en";
  }
}
/* --------------------------------------------------------------------------------- */
// set tag for all locations based on seperate variables from form
/* --------------------------------------------------------------------------------- */
function set_location_tags($scope)
{
  var tag;

  for(var i in $scope.locations) {
    tag = "";

    if($scope.locations[i].port_restrict)
      tag = "port_restrict";

    if($scope.locations[i].transp_proxy) {
      if(tag != "")
        tag = tag + ",transp_proxy";
      else
        tag = "transp_proxy";
    }

    if($scope.locations[i].ipv6) {
      if(tag != "")
        tag = tag + ",IPv6";
      else
        tag = "IPv6";
    }

    if($scope.locations[i].nat) {
      if(tag != "")
        tag = tag + ",NAT";
      else
        tag = "NAT";
    }

    if(tag != "")
      $scope.json_data.location[i].tag = tag;

    if($scope.locations[i].wired)
      $scope.json_data.location[i].wired_no = $scope.locations[i].wired_count;
  }
}
/* --------------------------------------------------------------------------------- */
// add english addresses based on czech ones
// also set lang info
/* --------------------------------------------------------------------------------- */
function add_addresses($scope)
{
  if($scope.json_data) {        // check that json_data are available
    if($scope.json_data.address.length == 1) {        // english address not available, create it
      $scope.json_data.address.push({ city : {}, street : {} });
      $scope.json_data.address[1].city.data = $scope.json_data.address[0].city.data;
      $scope.json_data.address[1].city.lang = "en";
      $scope.json_data.address[1].street.data = $scope.json_data.address[0].street.data;
      $scope.json_data.address[1].street.lang = "en";
    }
    else {        // data may have changed, rewrite them
      $scope.json_data.address[1].city.data = $scope.json_data.address[0].city.data;
      $scope.json_data.address[1].city.lang = "en";
      $scope.json_data.address[1].street.data = $scope.json_data.address[0].street.data;
      $scope.json_data.address[1].street.lang = "en";
    }

    for(var i in $scope.json_data.location) {
      if($scope.json_data.location[i].address.length == 1) {        // english address not available, create it
        $scope.json_data.location[i].address.push({ city : {}, street : {} });
        $scope.json_data.location[i].address[1].city.data = $scope.json_data.location[i].address[0].city.data;
        $scope.json_data.location[i].address[1].city.lang = "en";
        $scope.json_data.location[i].address[1].street.data = $scope.json_data.location[i].address[0].street.data;
        $scope.json_data.location[i].address[1].street.lang = "en";
      }
      else {        // data may have changed, rewrite them
        $scope.json_data.location[i].address[1].city.data = $scope.json_data.location[i].address[0].city.data;
        $scope.json_data.location[i].address[1].city.lang = "en";
        $scope.json_data.location[i].address[1].street.data = $scope.json_data.location[i].address[0].street.data;
        $scope.json_data.location[i].address[1].street.lang = "en";
      }

      // rewrite language info, just in case there is none
      $scope.json_data.location[i].address[0].city.lang = "cs";
      $scope.json_data.location[i].address[0].street.lang = "cs";
    }

    // rewrite language info, just in case there is none
    $scope.json_data.address[0].city.lang = "cs";
    $scope.json_data.address[0].street.lang = "cs";
  }
}
/* --------------------------------------------------------------------------------- */
// fill additional properties to json structure
/* --------------------------------------------------------------------------------- */
function fill_form($scope)
{
  add_addresses($scope);
  set_location_tags($scope);
  add_info_url_lang($scope);
  $scope.json_data.ts = new Date().toISOString();
  // replace seconds and milliseconds with "00Z"
  $scope.json_data.ts = $scope.json_data.ts.substring(0, 17) + "00Z";
}
/* --------------------------------------------------------------------------------- */
// save filled form as json to api
/* --------------------------------------------------------------------------------- */
function save_json_to_api($scope, $http, $timeout)
{
  fill_form($scope);

  $http({
    method  : 'POST',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm,
    data    : $scope.json_data
  })
  .then(function(response) {
    if(response.status == 200) {
      $scope.api_write_error = false;
      $scope.api_write_success = true;

      $timeout(function () {
        $scope.api_write_success = false;
      }, 3000);
    }
  }, function(err) {
    $scope.api_write_error = true;

    if(err.status == 400) {
      $scope.error = "Data se nepodařilo uložit, protože došlo k chybě při validaci:";
      $scope.error_msg = JSON.stringify(err.data, undefined, 4);
    }

    else if(err.status == 401)
      $scope.error = "Nemáte oprávnění pro editaci zvoleného realmu.";

    else if(err.status == 404)
      $scope.error = "Snažíte se editovat neplatný realm.";

    else        // generic error occured on backend
      $scope.error = "Nastala chyba při ukládání dat. Nahlaste prosím tento problém správcům na adrese info@eduroam.cz.";

    scroll_to_error();
  });
}
/* --------------------------------------------------------------------------------- */
// add new location
/* --------------------------------------------------------------------------------- */
function add_empty_loc($scope)
{
  $scope.locations.push({ port_restrict : false, ipv6 : false, transp_proxy : false,
                          nat : false, wired : false, heading : "Nová lokalita" });
}
/* --------------------------------------------------------------------------------- */
// parse tag attributes from all locations to separate variables
/* --------------------------------------------------------------------------------- */
function parse_location_data($scope, locations)
{
  // destroy map before deleting array
  for(var i in $scope.locations)
    if($scope.locations[i].map)
      $scope.locations[i].map.remove();

  $scope.locations.splice(0);   // delete array before adding new elements

  for(var i in locations) {
    var loc = {};

    if(locations[i].tag && locations[i].tag.indexOf("port_restrict") != -1)
      loc.port_restrict = true;
    else
      loc.port_restrict = false;

    if(locations[i].tag && locations[i].tag.indexOf("IPv6") != -1)
      loc.ipv6 = true;
    else
      loc.ipv6 = false;

    if(locations[i].tag && locations[i].tag.indexOf("transp_proxy") != -1)
      loc.transp_proxy = true;
    else
      loc.transp_proxy = false;

    if(locations[i].tag && locations[i].tag.indexOf("NAT") != -1)
      loc.nat = true;
    else
      loc.nat = false;

    if("wired_no" in locations[i])     // wired eduroam is available
      loc.wired = true;
    else
      loc.wired = false;

    // accordion
    loc.heading = locations[i].address[0].street.data + " " + locations[i].address[0].city.data;

    $scope.locations.push(loc);
  }
}
/* --------------------------------------------------------------------------------- */
// init coverage map (all locations in one map)
/* --------------------------------------------------------------------------------- */
function init_coverage_map($scope)
{
  $scope.coverage_map = {};
  $scope.coverage_map.markers = [];
  var coords = [];
  var map = L.map('coverage_map', { gestureHandling: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

  for(var i = 0; i < $scope.json_data.location.length; i++) {
    var tmp = [];
    tmp.push($scope.json_data.location[i].coordinates.split(",")[1]);
    tmp.push($scope.json_data.location[i].coordinates.split(",")[0]);
    var marker = new L.marker(tmp, { icon : $scope.marker_icon }).addTo(map);
    marker.bindPopup($scope.locations[i].heading).openPopup();      // popup with location street and city
    coords.push(tmp);
    $scope.coverage_map.markers[i] = marker;
  }

  if($scope.json_data.location.length == 0) {    // no locations available
    coords = [[ 50.1017839, 14.3885668 ]];      // CESNET
  }

  map.fitBounds(coords);
  $scope.coverage_map.map = map;
}
/* --------------------------------------------------------------------------------- */
// update global map bounds
/* --------------------------------------------------------------------------------- */
function update_global_map($scope)
{
  var coords = [];

  for(var i = 0; i < $scope.coverage_map.markers.length; i++) {
    var tmp = $scope.coverage_map.markers[i].getLatLng()
    coords.push([tmp.lat, tmp.lng]);
  }

  $scope.coverage_map.map.fitBounds(coords);
}
/* --------------------------------------------------------------------------------- */
// update local and global map markers
/* --------------------------------------------------------------------------------- */
function update_location_marker($scope, index, lat, lon)
{
  if($scope.locations[index].marker) {      // marker exists
    $scope.locations[index].marker.setLatLng([lat, lon]);
    $scope.locations[index].marker.update();
  }

  // update global map marker
  if($scope.coverage_map.markers[index]) {
    $scope.coverage_map.markers[index].setLatLng([lat, lon]);
    $scope.coverage_map.markers[index].update();
  }

  update_global_map($scope);
}
/* --------------------------------------------------------------------------------- */
// add markers to specific location map
/* --------------------------------------------------------------------------------- */
function add_location_marker($scope, $http, $timeout, index, map)
{
  // location with defined coords
  if($scope.json_data.location[index].coordinates) {        // check if coords are defined
    var coords = [];
    coords.push($scope.json_data.location[index].coordinates.split(",")[1]);
    coords.push($scope.json_data.location[index].coordinates.split(",")[0]);
    var marker = new L.marker(coords, { icon : $scope.marker_icon }).addTo(map);       // add marker
    $scope.locations[index].marker = marker;    // store marker in location
    map.flyTo(coords, 20, { duration : 1.5 });      // fly to set point with max zoom

    if(!$scope.coverage_map.markers[index]) {    // init with coords for new location not present on global map
      var marker = new L.marker(coords, { icon : $scope.marker_icon }).addTo($scope.coverage_map.map);       // add marker to global map
      $scope.coverage_map.markers[index] = marker;    // store marker in global map

      if($scope.locations[index].heading)     // set popup if defined
        marker.bindPopup($scope.locations[index].heading);
    }
    // no need to add marker to global map otherwise
  }

  // new location
  else {        // coords not present, add marker on click
    // add marker on click
    map.on('click', function(e) {
      if(!$scope.locations[index].marker) {      // only one marker per map
        var marker = new L.marker(e.latlng, { icon : $scope.marker_icon }).addTo(map);
        $scope.locations[index].marker = marker;        // store marker in location
      }
      if(!$scope.coverage_map.markers[index]) {      // no marker in global map for this location yet
        var marker = new L.marker(e.latlng, { icon : $scope.marker_icon }).addTo($scope.coverage_map.map); // add to global map
        $scope.coverage_map.markers[index] = marker;     // save global map marker
        update_global_map($scope);

        if($scope.locations[index].heading)     // set popup if defined
          marker.bindPopup($scope.locations[index].heading);
      }
    });
  }

  // move marker on click - existing or new location
  map.on('click', function(e) {
    update_location_coords($scope, $http, $timeout, index, e.latlng.lat, e.latlng.lng);
  });
}
/* --------------------------------------------------------------------------------- */
// init leaflet map by id
/* --------------------------------------------------------------------------------- */
function init_leaflet_map_by_id($scope, $http, $timeout, index)
{
  var coords = [];
  var zoom;

  if($scope.json_data.location[index].coordinates) {        // extract coords from data
    coords.push($scope.json_data.location[index].coordinates.split(",")[1]);
    coords.push($scope.json_data.location[index].coordinates.split(",")[0]);
    zoom = 20;      // set zoom to close, if coords are available
  }
  else {
    coords = [50.1017839, 14.3885668];      // CESNET
    zoom = 8;
  }

  var map = L.map('map_' + index, { gestureHandling: true }).setView(coords, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);
  $scope.locations[index].map = map;        // save map

  add_location_marker($scope, $http, $timeout, index, map);
}
/* --------------------------------------------------------------------------------- */
// validate whole from after json data are read from backend
/* --------------------------------------------------------------------------------- */
function validate_form($scope, $timeout)
{
  $timeout(function () {
    validate_basic_info($scope, $scope.main_form);
    validate_admins($scope, $scope.main_form);
    validate_locations($scope, $scope.main_form);
  }, 200);
}
/* --------------------------------------------------------------------------------- */
// retrieve json structure from backend api
/* --------------------------------------------------------------------------------- */
function get_json_from_api($scope, $http, $timeout)
{
  $http({
    method  : 'GET',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm
  })
  .then(function(response) {
    $scope.api_read_error = false;
    if(response.status == 200) {

      $scope.json_data = response.data.data;
      parse_location_data($scope, $scope.json_data.location);
      $scope.debug = JSON.stringify($scope.json_data, undefined, 4);
      $scope.last_changed = new Date($scope.json_data.ts).toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' });
      $scope.last_changed_author = response.data.author;
      validate_form($scope, $timeout);
    }
  }, function(err) {
    $scope.api_read_error = true;

    if (err.status == 404)
      $scope.error = "Zadali jste neplatný realm.";

    if (err.status == 401)
      $scope.error = "Nejste správce požadovaného realmu.";
  });
}
/* --------------------------------------------------------------------------------- */
// update form coordinates for specific location
/* --------------------------------------------------------------------------------- */
function update_location_coords($scope, $http, $timeout, index, lat, lon)
{
  var lon = parseFloat(lon).toFixed(6);   // get lon
  var lat = parseFloat(lat).toFixed(6);   // get lat

  $timeout(function () {
    $scope.json_data.location[index].coordinates = lon + "," + lat;       // set form coordinates

    if(!$scope.locations[index].marker) {       // first marker on map
      add_location_marker($scope, $http, $timeout, index, $scope.locations[index].map);
      update_global_map($scope);
    }
    else
      update_location_marker($scope, index, lat, lon);
  }, 0);        // timeout used just to notify input field about change
}
/* --------------------------------------------------------------------------------- */
// query openstreetmap API by form inputs
/* --------------------------------------------------------------------------------- */
function query_osm_api_by_input($scope, $timeout, $http, index)
{
  var params = "format=json&email=info@eduroam.cz";

  if($scope.json_data.location[index].address[0] && $scope.json_data.location[index].address[0].street && $scope.json_data.location[index].address[0].street.data)
    params += "&street=" + encodeURI($scope.json_data.location[index].address[0].street.data);

  if($scope.json_data.location[index].address[0] && $scope.json_data.location[index].address[0].city && $scope.json_data.location[index].address[0].city.data)
    params += "&city=" + encodeURI($scope.json_data.location[index].address[0].city.data);

  $http({
    method  : 'GET',
    url     : 'https://nominatim.openstreetmap.org/search?' + params
  })
  .then(function(response) {
    if(response.data.length > 0) {   // got some data
      // there may be more results, but for simplicity work with the first one only
      $scope.osm_data = response.data[0];        // get osm API data

      // also handles markers adding/updating
      update_location_coords($scope, $http, $timeout, index, $scope.osm_data.lat, $scope.osm_data.lon);
    }
  }, function(err) {
  });
}
/* --------------------------------------------------------------------------------- */
