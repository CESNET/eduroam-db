/* --------------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------------- */
angular.module('coverage').controller('coverage_controller', ['$scope', '$http', function ($scope, $http) {
  $scope.realm_validated = false;
  $scope.locations = [];
  $scope.admin_realms = realms;

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

  //$scope.verify_realm = function() {
  //  if($scope.realm != "")
  //    verify_realm($scope, $http);
  //  else
  //    $scope.realm_validated = false;
  //}

  $scope.add_contact = function() {
    // TODO - kontrola, ze existuje $scope.json_data

    $scope.json_data.contact.push({});       // TODO
  }

  $scope.remove_contact = function(index) {
    // TODO - kontrola, ze existuje $scope.json_data
    $scope.json_data.contact.splice(index, 1);       // TODO
  }
 
  $scope.add_location = function() {
    // TODO - kontrola, ze existuje $scope.json_data
    // TODO - bude potreba dodat nejake klice, ktere jsou needitovatelne
    $scope.json_data.location.push({});
    add_empty_loc($scope);
  }

  $scope.remove_location = function(index) {
    // TODO - kontrola, ze existuje $scope.json_data
    $scope.json_data.location.splice(index, 1);
  }
 
  $scope.save_data = function() {
    save_json_to_api($scope, $http);
  }

  $scope.get_json = function() {
    get_json_from_api($scope, $http);
  }
}]);
/* --------------------------------------------------------------------------------- */
function save_json_to_api($scope, $http)
{
  // TODO - dodatecna logika, ktera zohledni vyplnena pole location do klice tag
  // TODO - update ts na aktualni cas


  $http({
    method  : 'POST',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm,
    data    : $scope.json_data
  })
  .then(function(response) {
    if(response.status == 200)
        ;       // TODO - saved popup
    console.log($scope.locations);
  }, function(err) {
    // TODO
    //if (err.status == 404)
    //  $scope.realm_validated = false;
  });

}
/* --------------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------------- */
function add_empty_loc($scope)
{
  $scope.locations.push({ port_restrict : false, ipv6 : false, transp_proxy : false,
                          nat : false, wired : false, heading : "Nová lokalita" });
}
/* --------------------------------------------------------------------------------- */
// TODO
/* --------------------------------------------------------------------------------- */
function parse_location_data($scope, locations)
{
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

    if("wired" in locations[i])     // wired eduroam is available
      loc.wired = true;
    else
      loc.wired = true;

    // accordion
    loc.heading = locations[i].address[0].street.data + " " + locations[i].address[0].city.data;

    $scope.locations.push(loc);
  }
}
/* --------------------------------------------------------------------------------- */
// TODO
/* --------------------------------------------------------------------------------- */
function get_json_from_api($scope, $http)
{
  $http({
    method  : 'GET',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm
  })
  .then(function(response) {
    if(response.status == 200) {
      parse_location_data($scope, response.data.location);
      $scope.realm_validated = true;
      $scope.json_data = response.data;
    }

      //fill_form($scope);
  }, function(err) {
    if (err.status == 404)
      $scope.realm_validated = false;
  });

}
/* --------------------------------------------------------------------------------- */
function fill_form($scope)
{
  
}
/* --------------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------------- */
