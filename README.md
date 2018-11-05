# eduroam-db
This repository contains tools to convert institituon.xml eduroam database files
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

### preparations for conversion

Before running the conversion take a look at [config](https://github.com/CESNET/eduroam-db/blob/master/convertor/config.py).
Edit all the necessary values to suit your needs. You should edit at least `ROid`, `default_lang` and `local_timezone`.

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


## web interface
TODO
