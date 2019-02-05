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
    cp $2 "$2-$(date "+%Y-%m-%d")"      # backup previous version with current date
  fi

  # read all json files and create institituon.json from them, write result to temp
  cat $1/*json | jq -s '{ "schema_version": 2, "institutions": { "institution": . } }' > $2
}
# ===================================================================================
main "$@"
