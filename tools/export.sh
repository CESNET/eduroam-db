#!/bin/bash
# ======================================================================
# prepare institution.json export for world eduroam database
# ======================================================================
function main()
{
  /home/eduroamdb/eduroam-db/tools/inst_json.sh $coverage_files_path $institution_json_output    # create institution.json
  /home/eduroamdb/eduroam-db/maps/map_data.sh $institution_json_output > $geojson   # create geojson data from institution.json for eduroam.cz maps
}
# ======================================================================
coverage_files_path="/home/eduroamdb/eduroam-db/web/coverage/coverage_files"
institution_json_output="$1"
geojson="$2"
main $@
# ======================================================================

