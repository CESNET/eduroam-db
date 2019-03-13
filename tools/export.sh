#!/bin/bash
# ======================================================================
# prepare institution.json export for world eduroam database
# ======================================================================
function main()
{
  /home/eduroamdb/eduroam-db/web/coverage/ldap_check.js # check JSON data with ldap - type and realms must match
  /home/eduroamdb/eduroam-db/tools/inst_json.sh $coverage_files_path $institution_json_output    # create institution.json
  /home/eduroamdb/eduroam-db/maps/map_data.sh $institution_json_output > $geojson   # create geojson data from institution.json for eduroam.cz maps
  /home/eduroamdb/edudb.sh >/dev/null 2>&1      # create list of connected institutions for eduroam.cz
}
# ======================================================================
coverage_files_path="/home/eduroamdb/eduroam-db/web/coverage/coverage_files"
institution_json_output="/home/eduroamdb/www/general/institution.json"
geojson="/home/eduroamdb/www/pokryti/eduroam-cs_CZ.geojson"
main $@
# ======================================================================

