#!/bin/bash
# ======================================================================
# prepare institution.json export for world eduroam database
# ======================================================================
function main()
{
  # check ldap only if ran by cron
  # ldap check is not necessary when chaning single institution
  if [[ $cron == true ]]
  then
    /home/eduroamdb/eduroam-db/web/coverage/ldap_check.js # check JSON data with ldap - type and realms must match
    commit_changes "Automatická úprava dat z důvodu rozdílů v evidenci eduroam.cz"
    remove_nonexisting  # remove files for non existing orgs
    commit_changes "Informace o pokrytí odstraněny z důvodu smazání organizace"
  fi
  /home/eduroamdb/eduroam-db/tools/inst_json.sh $coverage_files_path $institution_json_output    # create institution.json
  /home/eduroamdb/eduroam-db/maps/map_data.sh $institution_json_output > $geojson   # create geojson data from institution.json for eduroam.cz maps
  /home/eduroamdb/edudb.sh >/dev/null 2>&1      # create list of connected institutions for eduroam.cz
}
# ======================================================================
# remove coverage info files for orgs that no longer exist in config
# ======================================================================
function remove_nonexisting()
{
  # sorted list of coverage info files
  files=$(find $coverage_files_path -type f -name '*json' -exec basename -s .json '{}' \; | sort)

  # sorted list of org names from config
  config=$(tail -n +2 /home/eduroamdb/eduroam-db/web/coverage/config/realm_to_inst.js | jq -S '. | to_entries[] | .value' | tr -d '"' | sort | uniq)

  # extra files that exist, but no org exists in config (extra lines in left column of diff)
  diff=$(diff --suppress-common-lines -y <(echo "$files") <(echo "$config") | grep '<' | awk '{ print $1 }')

  for i in $diff
  do
    # rename all extra files to "_deleted"
    mv $coverage_files_path/"$i".json $coverage_files_path/"$i".json_deleted
  done
}
# ======================================================================
# commit all changes
# params:
# 1) commit message
# ======================================================================
function commit_changes()
{
  pushd $coverage_files_path &>/dev/null
  git add *
  git commit -m "$1" --author "info@eduroam.cz <info@eduroam.cz>" &>/dev/null
  popd &>/dev/null
}
# ======================================================================
coverage_files_path="/home/eduroamdb/eduroam-db/web/coverage/coverage_files"
institution_json_output="/home/eduroamdb/www/general/institution.json"
geojson="/home/eduroamdb/www/pokryti/eduroam-cs_CZ.geojson"
cron="$1"   # distinct if ran manually from application based on some changes or if ran by cron
main $@
# ======================================================================

