# eduroam-db
This repository contains tools to convert institution.xml eduroam database files
to [new version 2](https://monitor.eduroam.org/fact_eduroam_db.php) in JSON format. 


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
- python3-pydispatch
- jq

### preparations for conversion

Before running the conversion take a look at [config](https://github.com/CESNET/eduroam-db/blob/master/convertor/config.py).
Edit all the necessary values to suit your needs. You should edit at least `ROid`, `default_lang` and `local_timezone`.
Also there is hardcoded default value for number of wired socket for eduroam set to 1!

Also all xml documents from connected institutions must be gathered.

### converting institution.xml to institution.json v2

Input filename is used as field `instid`, ie if input filename is `inst1.xml` instid is set to `inst1`.
In case there is some NRO's external evidence and you would like to match
the instid somehow with your evidence, this is what you can use to do it.

To convert xml files run script:
```
./converter.py input_directory output_directory
```

This takes all the `.xml` files from `input_directory` and
tries to convert them. If conversion is successfull,
all the json files are created in `output_directory`.


There are various options that can affect the conversion.
To see all the options run:
```
./converter.py --help
```

### bulding the institution.json

To build the whole institution.json file, use [inst_json.sh](https://github.com/CESNET/eduroam-db/blob/master/convertor/inst_json.sh).
This script uses the output of [converter.py](https://github.com/CESNET/eduroam-db/blob/master/convertor/converter.py).
It takes the directory with all the created JSON files and concatenates them into desired structure.

Use the script as:
```
./inst_json.sh converter_output_directory destination_filename
```


This information changes based on new institutions connecting so a cronjob building
the institution.json should be setup if this is used.


### debugging

Validator is available [here](https://monitor.eduroam.org/eduroam-database/v2/scripts/json_validation_test.php).
When the validator reports any errors it could be useful to print out the documents containing errors.
This can be simply done with `jq`. For example if the error is `[property] => institutions.institution[2].info_URL[0].data`,
the problematic document can be printed with `jq '.institutions.institution[2].info_URL[0].data' insitution.json`.

## web interface
TODO
