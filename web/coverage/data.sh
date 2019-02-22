#!/bin/bash

# THIS SCRIPT OVERWRITES ALL THE PRODUCTION DATA, DO NOT USE UNLESS YOU KNOW WHAT YOU'RE DOING!!!

## delete all current coverage info
#rm /home/eduroamdb/eduroam-db/web/coverage/coverage_files/*
#
## copy all xml data to working directory
#cp ~/edudb-cache/*cache /home/eduroamdb/eduroam-db/web/coverage/coverage_files/
#
## copy all xml data downloaded by hand to working directory
## possibly overwrite the earlier copied data
## there may be some corrections
#cp ~/edudb-cache-rucni/*cache /home/eduroamdb/eduroam-db/web/coverage/coverage_files/
#
## move all .cache to .xml
#for i in /home/eduroamdb/eduroam-db/web/coverage/coverage_files/*cache
#do
#  mv $i $(echo $i | sed 's/cache$/xml/')
#done
#
## convert all xml files to json
#~/eduroam-db/converter/converter.py -fc -fl -v /home/eduroamdb/eduroam-db/web/coverage/coverage_files/ /home/eduroamdb/eduroam-db/web/coverage/coverage_files/
#
## delete xml files in working dir
#rm /home/eduroamdb/eduroam-db/web/coverage/coverage_files/*xml
#
## process all the convrted data with jq to get rid of utf-8 escape sequences
#for i in /home/eduroamdb/eduroam-db/web/coverage/coverage_files/*json
#do
#  dest=$(echo $i | sed 's/json$/json_converted/')
#  jq '.' $i > $dest
#done
#
## move all .json_converted to .json
#for i in /home/eduroamdb/eduroam-db/web/coverage/coverage_files/*json_converted
#do
#  mv $i $(echo $i | sed 's/json_converted$/json/')
#done
#
