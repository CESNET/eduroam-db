# eduroam-db
This repository contains tools to convert institituon.xml eduroam database files
to new version 2 in JSON format.


It also containts web interface to edit converted json files.


TODO

## conversion tools

### dependencies for conversion tools

Before you begin with the conversion, make sure all the needed dependencies are available:
- python3
- python3-lxml
- python3-dateutil
- python3-tz
- python3-click

### preparations for conversion

Before running the conversion take a look at [config](https://github.com/CESNET/eduroam-db/blob/master/convertor/config.py).
Edit all the necessary values to suit your needs. You should edit at least `ROid`, `default_lang` and `local_timezone`.

Also all xml documents from connected institutions must be gathered.

### converting institution.xml to institution.json v2
TODO





## web interface
TODO
