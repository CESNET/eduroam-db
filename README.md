# eduroam-db
This repository contains tools to convert institution.xml eduroam database files
to [new version 2](https://monitor.eduroam.org/fact_eduroam_db.php) in JSON format. 


It also containts web interface to edit converted JSON files.
The web interface is very simple. There is just one simple page with form to edit all the available information.
The backend is really simple. There are configiration files for backend that abstract from our
data storage, so its simpler if anyone else wants to use this project.


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

Before running the conversion take a look at [config](https://github.com/CESNET/eduroam-db/blob/master/converter/config.py).
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
tries to convert them. If the conversion is successfull,
all the JSON files are created in the `output_directory`.


There are various options that can affect the conversion.
To see all the options run:
```
./converter.py --help
```

### bulding the institution.json

To build the whole institution.json file, use [inst_json.sh](https://github.com/CESNET/eduroam-db/blob/master/converter/inst_json.sh).
This script uses the output of [converter.py](https://github.com/CESNET/eduroam-db/blob/master/converter/converter.py).
It takes the directory with all the created JSON files and concatenates them into desired structure.

Use the script as:
```
./inst_json.sh converter_output_directory destination_filename
```


This information changes based on new institutions connecting so a cronjob building
the institution.json should be setup if this is used.


### validation & debugging

Validator is available [here](https://monitor.eduroam.org/eduroam-database/v2/scripts/json_validation_test.php).
When the validator reports any errors it could be useful to print out the documents containing errors.
This can be simply done with `jq`. For example if the error is `[property] => institutions.institution[2].info_URL[0].data`,
the problematic document can be printed with `jq '.institutions.institution[2].info_URL[0].data' insitution.json`.

## web interface

The web application in built in node.js.

### frontend

The frontend is just one simple page with form to enable user to edit data.

### backend

The backend is composed from several API endpoints.
The main one is `/api/:inst_id` for both GET a POST request types.

The GET variant first checks the user permissions. Then it checks the mapping of given realm to institution.
If the JSON data file exists, it reads the data and sends them to frontend. If the JSON data file does not exist
it performs an LDAP query to get all the data available. After querying LDAP is finished, all the data are sent to frontend.


The POST variant first checks the user permissions. Then it checks the mapping of given realm to institution.
POST input is then checked if it is a valid JSON. Finally the input data are validated against eduroam db v2 schema.
If all checks are OK, then the data are saved.


### configuration

The main idea to use configuration for this was to separate create additional layer
that is not dependent on any specific data source.

Configuration is done via JSON format. There are two main configuration files.
The first configuration file specifies mapping of realms to administrators.
The second configuration file speficies mapping of realms to institution ids as used in conversion process.
See below for specific details.

### admin to realm mapping

It is necessary for the web application to know which administrator has permissions to edit specific realms.
This is done via configration.

The configuration file is placed in `web/coverage/config/realm_to_admin.js`.
The file is not part of the repository for security reasons.

Sample configuration may look like:
```
module.exports =
{
    "user1@university1.tld": [
        "realm1",
        "realm2",
        "realm3",
        "realm4",
        "realm5"
    ],
    "user1@university2.tld": [
        "realm1",
        "realm3"
    ],
    "user2@university2.tld": [
        "realm6"
    ],
}
```

The `module.exports` is just a node.js way of exposing file
contents to be able to use one file in another.

#### realm to institution mapping

It is necessary for the web application to know which realm corresponds to specific instid as used in converter.
This is done via configration.

The configuration file is placed in `web/coverage/config/realm_to_inst.js`.
The file is not part of the repository for security reasons.

Sample configuration may look like:
```
module.exports =
{
    "realm1.cz": "instid1",
    "realm2.cz": "instid2",
    "realm3.cz": "instid3",
    "realm4.cz": "instid4",
}
```

#### super admin mode

Application includes a super admin mode as an options for NRO adminitors to edit institutions' coverage information.
An administator needs to be manually configured to become super admin. The configuration file is placed in `web/coverage/config/admins.js`.

Sample configuration may look like:
```
module.exports =
{
  "admins" : [ "admin1@nro1.tld", "admin2@nro2.tld" ]
}
```

### dependencies

The web application is built in node.js. It needs node.js to run.

### automated data update

Since some organizations connected to eduroam might have
their eduroam coverage information in some kind of their own database we wanted to provide
some way to synchronize their data with this application.

There is an authentication exception for eiditing api in the webserver configuration so anyone can access it
even without providing any credentials. If anyone wants to synchronize the data automatically, they need to
contact us to provide them an access token which server as an alternative authentication method.

Example:
```
curl -H "Authorization:my_secret_token" -H 'Content-Type: application/json;charset=UTF-8' -H 'Accept: application/json, text/plain, */*' --data-binary $'{"my":"data"}'
```
