#!/bin/bash
# ===================================================================================
# create institution.json from all institutions' files
# ===================================================================================

# ===================================================================================
# usage
# ===================================================================================
function usage
{
  echo "$0 input_dir output_file"
  echo "input_dir is a directory containing all the instition.json files to use"
  echo "output_file is the resulting file"
  exit 1
}
# ===================================================================================
# main function
# ===================================================================================
function main
{
  if [[ $# -lt 2 || ! -d $1 ]]
  then
    usage
  fi

  if [[ -e $2 ]]
  then
    # diff current version and new version
    diff -q <(jq '.' $1/*json | jq -S -s '{ "schema_version": 2, "institutions": { "institution": . } }') $2 >/dev/null

    # backup is done only when there are some changes between current and new version
    if [[ $? -ne 0 ]]
    then
      cp $2 "$2-$(date "+%Y-%m-%d-%H-%M")"      # backup previous version with current date
    fi
  fi

  # read all json files and create institituon.json from them, write result to destination file
  jq '.' $1/*json | jq -S -s '{ "schema_version": 2, "institutions": { "institution": . } }' > $2
}
# ===================================================================================
main "$@"
