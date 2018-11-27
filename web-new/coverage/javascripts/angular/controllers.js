/* --------------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------------- */
angular.module('coverage').controller('coverage_controller', ['$scope', '$http', function ($scope, $http) {
  $scope.realm_validated = false;
  $scope.locations = [{}];      // TODO ?
  $scope.admin_realms = realms;

  $scope.contact_type = [
    "osoba",
    "oddělení"
  ];

  $scope.contact_privacy = [
    "privátní",
    "veřejný"
  ]

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
    $scope.json_data.location.push({});
    // TODO - bude potreba dodat nejake klice, ktere jsou needitovatelne
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
  $http({
    method  : 'POST',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm,
    data    : $scope.json_data
  })
  .then(function(response) {
    if(response.status == 200)
        ;       // TODO - saved popup
  }, function(err) {
    // TODO
    //if (err.status == 404)
    //  $scope.realm_validated = false;
  });

}
/* --------------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------------- */
function get_json_from_api($scope, $http)
{
  $http({
    method  : 'GET',
    url     : 'https://pokryti.eduroam.cz/api/' + $scope.selected_realm
  })
  .then(function(response) {
    if(response.status == 200)
      $scope.realm_validated = true;
      $scope.json_data = response.data;
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
