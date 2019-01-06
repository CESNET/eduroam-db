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
    query_osm_api($scope, $http, index);      // query the openstreetmap api
  }

  $scope.init_leaflet_by_id = function(index) {
    init_leaflet_map_by_id($scope, index);
  }
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
    if(form["location_" + i + "_street"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_city"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_info_url_cz"].$error.required || form["location_" + i + "_info_url_cz"].$error.pattern) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_info_url_en"].$error.required || form["location_" + i + "_info_url_en"].$error.pattern) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_coordinates"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_enc_level"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_port_restrict"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_transp_proxy"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_ipv6"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_nat"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_wired"].$error.required) {
      $scope.location_error = true;
      break;
    }

    // wired is set - check wired_count
    else if($scope.locations[i].wired && form["location_" + i + "_wired_count"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else if(form["location_" + i + "_ap_no"].$error.required) {
      $scope.location_error = true;
      break;
    }

    else {      // no other error occured
      if(i == $scope.json_data.contact.length -1)     // last item
        $scope.location_error = false;
    }
  }
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

  $scope.bool_options = [
    { key : "ano", value : true },
    { key : "ne", value : false }
  ];
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
// init leaflet map by id
/* --------------------------------------------------------------------------------- */
function init_leaflet_map_by_id($scope, index)
{
  var coords = [];

  if($scope.json_data.location[index].coordinates) {        // extract coords from data
    coords.push($scope.json_data.location[index].coordinates.split(",")[1]);
    coords.push($scope.json_data.location[index].coordinates.split(",")[0]);
  }
  else
    coords = [50.1017839, 14.3885668];      // CESNET

  var map = L.map('map_' + index).setView(coords, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);
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
      parse_location_data($scope, response.data.location);
      $scope.json_data = response.data;
      $scope.debug = JSON.stringify($scope.json_data, undefined, 4);
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
// query openstreetmap API
/* --------------------------------------------------------------------------------- */
function query_osm_api($scope, $http, index)
{
  var params = "format=json";

  if($scope.json_data.location[index].address[0].street.data)
    params += "&street=" + encodeURI($scope.json_data.location[index].address[0].street.data);

  if($scope.json_data.location[index].address[0].city.data)
    params += "&city=" + encodeURI($scope.json_data.location[index].address[0].city.data);

  $http({
    method  : 'GET',
    url     : 'https://nominatim.openstreetmap.org/search?' + params
  })
  .then(function(response) {
    if(response.data.length > 0) {   // got some data
      // there may be more results, but for simplicity work with the first one only
      $scope.osm_data = response.data[0];        // get osm API data
      var lon = parseFloat($scope.osm_data.lon).toFixed(6);   // get lon
      var lat = parseFloat($scope.osm_data.lat).toFixed(6);   // get lat

      $scope.json_data.location[index].coordinates = lon + "," + lat;       // set form coordinates

      // set map marker
    }
  }, function(err) {
    // TODO ?
  });
}
/* --------------------------------------------------------------------------------- */
