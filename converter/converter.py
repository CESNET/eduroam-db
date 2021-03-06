#!/usr/bin/env python3
# ==============================================================================
# convert eduroam database xml v1 format to new json v2
# parameters:
# 1) directory with institution.xml files
# 2) directory where to output corresponding converted json files
# ==============================================================================

# imports
# ==============================================================================
import sys
import os
import lxml.etree
import lxml.objectify
import datetime
import config
import json
import dateutil.parser
import pytz
import click
import re
import os
from functools import singledispatch
# ==============================================================================

# ==============================================================================
# command line arguments and options
# ==============================================================================
@click.command()
@click.argument('input_dir', type=click.Path(exists=True))
@click.argument('output_dir', type=click.Path(exists=True))
@click.option('-fc', 'fix_coord_chars', is_flag=True, help='fix wrong characters used in coordinates definitions')
@click.option('-fl', 'fix_lon_lat', is_flag=True, help='enable swapping of lon and lat if switched. Configure list of accepted values in config.py')
@click.option('-c', 'check_lon_lat', is_flag=True, help='check that longitude and latitude are in defined ranges. Configure list of accepted values in config.py')
@click.option('-v', 'verbose', is_flag=True, help='enable verbose output')
def cli(input_dir, output_dir, fix_coord_chars, fix_lon_lat, check_lon_lat, verbose):
  """This script converts institution.xml files to json v2 format.
  It requires positional parameters input_dir and output_dir.
  input_dir specifies the input directory with institution.xml files.
  output_dir specifies the output directory for json files.
  """

  main(input_dir, output_dir, { "fix_coord_chars" : fix_coord_chars, "fix_lon_lat" : fix_lon_lat,
                                "check_lon_lat" : check_lon_lat, "verbose" : verbose })

# ==============================================================================
# better serialization into json
# taken from https://hynek.me/articles/serialization/
# ==============================================================================
@singledispatch
def to_serializable(val):
    """Used by default."""
    return str(val)

# ==============================================================================
# better serialization into json
# taken from https://hynek.me/articles/serialization/
# ==============================================================================
@to_serializable.register(datetime.datetime)
def ts_datetime(val):
    """Used if *val* is an instance of datetime."""
    return val.isoformat() + "Z"

# ==============================================================================
# list xml files in input_dir
# ==============================================================================
def list_files(input_dir):
  files = []

  for f in os.listdir(input_dir):
    if(f.endswith(".xml")):
      files.append(f)

  return files

# ==============================================================================
# read xml file
# ==============================================================================
def read_xml(filename):
  data = lxml.objectify.parse(filename)
  return data

# ==============================================================================
# convert institution.xml coords to json format
# ==============================================================================
def convert_coords(lon, lat):
  lon_s = str(lon).split("'")[1].split('"')[0] # seconds
  lon_m = str(lon).split("'")[0].split('°')[1] # minutes
  lon_d = str(lon).split("'")[0].split('°')[0] # degrees

  lat_s = str(lat).split("'")[1].split('"')[0] # seconds
  lat_m = str(lat).split("'")[0].split('°')[1] # minutes
  lat_d = str(lat).split("'")[0].split('°')[0] # degrees

  lon_ret = float(lon_d) + (float(lon_m) + float(lon_s) / 60) / 60  # convert lon
  lat_ret = float(lat_d) + (float(lat_m) + float(lat_s) / 60) / 60  # convert lat

  # limit to 6 decimal places
  lon_ret = round(lon_ret, 6)
  lat_ret = round(lat_ret, 6)

  return str(str(lon_ret) + "," + str(lat_ret))

# ==============================================================================
# get inst_name with required_lang language
# ==============================================================================
def get_inst_name(root, required_lang):
  ret = []
  got_req_lang = False

  for i in root.institution.org_name:                     # iterate possible language variants of org_name
    if i.get("lang") == required_lang:
      got_req_lang = True

    tmp = i
    tmp = re.sub(r'^\s+', '', str(tmp))
    tmp = re.sub(r'\s+$', '', str(tmp))

    ret.append({ "lang" : i.get("lang"), "data" : tmp })

  if got_req_lang == False:  # required_lang language not found in source data
    ret.append({ "lang" : required_lang, "data" : root.institution.org_name })   # insert institution name with language forced to required_lang


  ret.sort(key=lambda x:x["lang"])               # order array by lang value
  return ret

# ==============================================================================
# get address with required_lang language
# ==============================================================================
def get_address(elem, required_lang):
  ret = []
  street_lang = False
  city_lang = False

  addr = {}

  if elem.street.get("lang") == required_lang:
    street_lang = True

  if elem.city.get("lang") == required_lang:
    city_lang = True

  if elem.street.get("lang") == None:
    addr["street"] = { "lang" : config.default_lang, "data" : elem.street }
  else:
    addr["street"] = { "lang" : elem.street.get("lang"), "data" : elem.street }

  if elem.city.get("lang") == None:
    addr["city"] = { "lang" : config.default_lang, "data" : elem.city }
  else:
    addr["city"] = { "lang" : elem.city.get("lang"), "data" : elem.city }

  ret.append(addr)

  # TODO - handle other states too?
  if street_lang == False and city_lang == False:
    ret.append({ "street" : { "lang" : required_lang, "data" : elem.street },
                 "city"   : { "lang" : required_lang, "data" : elem.city   }})

  ret.sort(key=lambda x:x['city']["lang"])               # order array by lang value
  return ret

# ==============================================================================
# determine inst type
# ==============================================================================
def get_inst_type(elem):
  if elem == 1:
    return "IdP"

  elif elem == 2:
    return "SP"

  return "IdP+SP"

# ==============================================================================
# fix characters in coordinates
# ==============================================================================
def fix_coord_chars(coord):
  # replace:
  # - "“" with '"'
  # - "„" with '"'
  # - " " with ""
  # - "’" with "'"
  # - "´" with "'"
  #

  return str(coord).replace("“", '"').replace("„", '"').replace(" ", "").replace("’", "'").replace("´", "'")

# ==============================================================================
# extract longitude
# ==============================================================================
def extract_lon(lon, lon_changed):

  if re.match(r"^\d{1,3}\.\d+E \(180\)$", str(lon)):     # 13.3702403E (180)
    lon_changed = True
    return str(lon).split(" ")

  elif re.match(r"^E\d{1,3}\.\d+ \(180\)$", str(lon)):   # E13.3702403 (180)
    lon_changed = True
    return str(lon).split(" ")[1:]

  elif re.match(r"^\d{1,3}\.\d+°E \(180\)$", str(lon)):  # 17.265195°E (180)
    lon_changed = True
    return str(lon).split(" ")[:-2]

  return lon    # unknown format, return the original value

# ==============================================================================
# extract latitude
# ==============================================================================
def extract_lat(lat, lat_changed):

  if re.match(r"^\d{1,3}\.\d+N \(90\)$", str(lat)):     # 49.7289725N (90)
    lat_changed = True
    return str(lat).split(" ")

  elif re.match(r"^N\d{1,3}\.\d+ \(90\)$", str(lat)):   # N49.7289725 (90)
    lat_changed = True
    return str(lat).split(" ")[1:]

  elif re.match(r"^\d{1,3}\.\d+°N \(90\)$", str(lon)):  # 49.594309°N (90)
    lat_changed = True
    return str(lon).split(" ")[:-2]

  return lat    # unknown format, return the original value

# ==============================================================================
# check correct format for coords
# ==============================================================================
def check_coord_format(lon, lat, options):
  coord_formats = [
    0,        # regular
    1,        # float
    2,        # regular swapped
  ]

  # determine format first
  if re.match(r"^\d{1,3}°\d{1,2}'\d{1,2}(\.\d{1,8})?\"E$", str(lon)) and re.match(r"^\d{1,3}°\d{1,2}'\d{1,2}(\.\d{1,8})?\"N$", str(lat)):
    c_format = 0  # regular

  elif re.match(r"^\d{1,3}°\d{1,2}'\d{1,2}(\.\d{1,8})?\"E$", str(lat)) and re.match(r"^\d{1,3}°\d{1,2}'\d{1,2}(\.\d{1,8})?\"N$", str(lon)):
    c_format = 2  # regular swapped

  elif re.match(r"\d{1,3}\.\d+", str(lon)) and re.match(r"\d{1,3}\.\d+", str(lat)):
    c_format = 1  # float

  else:
    raise ValueError("coords in unknown format: " + str(lon) + "," + str(lat))


  # check options
  if options['fix_lon_lat'] == True:

    if c_format == 2:
      lon, lat = lat, lon   # swap

      if options['verbose'] == True:
        print("swapped longitude and latitude")

    if c_format == 1:
      lon_changed = False
      lat_changed = False
      lon = extract_lon(lon, lon_changed)    # extract the number itself
      lat = extract_lat(lat, lat_changed)    # extract the number itself

      if lon_changed == True and lat_changed == True:   # both numbers extracted
        lon, lat = fix_lon_lat(lon, lat)       # swap based on range check

  if c_format == 0 or c_format == 2:
    ret = convert_coords(lon, lat)
  else:
    ret = str(lon) + "," + str(lat);

  # check coords by ranges
  if options['check_lon_lat'] == True:
    check_coord_ranges(ret.split(",")[0], ret.split(",")[1])

  return ret

# ==============================================================================
# check that coords are in correct ranges defined in config
# ==============================================================================
def check_coord_ranges(lon, lat):
  if not (int(float(lon)) >= config.lon_values[0] and int(float(lon)) <= config.lon_values[-1]):
    raise ValueError("longitude not in defined ranges: " + str(lon))

  if not (int(float(lat)) >= config.lat_values[0] and int(float(lon)) <= config.lat_values[-1]):
    raise ValueError("latitude not in defined ranges: " + str(lat))

# ==============================================================================
# swap lon and lat coords if they are entered incorrectly in the xml
# works only on float format
# ==============================================================================
def fix_lon_lat(lon, lat):

  if int(float(lon)) >= config.lat_values[0] and int(float(lon)) <= config.lat_values[-1] and int(float(lat)) >= config.lon_values[0] and int(float(lat)) <= config.lon_values[-1]:
    return lat, lon     # switch values

  else:
    return lon, lat     # return original values

# ==============================================================================
# get coords from first location in institution.xml
# ==============================================================================
def get_coords(elem, options, ret):
  lon = elem.longitude
  lat = elem.latitude

  if options['fix_coord_chars'] == True:
    lon = fix_coord_chars(lon)
    lat = fix_coord_chars(lat)

  ret["coordinates"] = check_coord_format(lon, lat, options)

# ==============================================================================
# get locations defined in xml
# ==============================================================================
def get_locations(root, options, inst_name):
  ret = []
  idx = 1

  for i in root.institution.location:
    loc_id = inst_name + str(idx).zfill(3)
    loc = { "locationid" : loc_id }
    idx += 1

    # coords
    get_coords(i, options, loc)

    loc['stage'] = config.default_stage
    loc['type'] = config.default_location_type

    # loc_name
    if hasattr(i, 'loc_name'):
      loc['loc_name'] = []

      if i.loc_name.get("lang") == None:
        loc['loc_name'].append({"lang" : config.default_lang, "data" : i.loc_name })   # no lang provided
      else:
        for j in i.loc_name:
          loc['loc_name'].append({"lang" : j.get("lang") , "data" : j })        # iterate all languages available

      loc['loc_name'].sort(key=lambda x:x["lang"])               # order array by lang value

    # address
    loc['address'] = get_address(i.address, "en")

    loc['SSID'] = i.SSID
    loc['enc_level'] = i.enc_level

    if hasattr(i, 'AP_no'):
      if i.AP_no != 0:
        loc['AP_no'] = int(i.AP_no)
      else:
        loc['AP_no'] = 1

    # tags
    tag = ""

    if hasattr(i, "port_restrict") and i.port_restrict == True:
      tag = tag + "port_restrict,"

    if hasattr(i, "transp_proxy") and i.transp_proxy == True:
      tag = tag +  "transp_proxy,"

    if hasattr(i, "IPv6") and i.IPv6 == True:
      tag = tag +  "IPv6,"

    if hasattr(i, "NAT") and i.NAT == True:
      tag = tag +  "NAT,"

    if tag != "":
      loc['tag'] = tag[:-1]     # trim the last comma

    # wired eduroam
    if hasattr(i, "wired") and i.wired == True:
      loc['wired_no'] = 1

    get_info_url(i, loc)

    ret.append(loc)

  return ret

# ==============================================================================
# get info_URL
# ==============================================================================
def get_info_url(elem, ret):
  if hasattr(elem, 'info_URL'):
    ret['info_URL'] = []
    empty_url = []        # list of languages, that have empty URL

    for j in elem.info_URL:
      if j == "":        # empty URL
        empty_url.append(j.get("lang"))       # append language of empty URL
        continue

      tmp = j
      tmp = re.sub(r'^\s+', '', str(tmp))
      tmp = re.sub(r'\s+$', '', str(tmp))
      ret["info_URL"].append({ "lang" : j.get("lang"), "data" : tmp })

    if len(empty_url) != 0 and len(ret['info_URL']) > 0:
      for j in empty_url:
        ret["info_URL"].append({ "lang" : j, "data" : ret["info_URL"][len(ret["info_URL"]) - 1]["data"] })    # add last non empty info_URL in lang that has empty URL
    else:
      for j in empty_url:
        ret["info_URL"].append({ "lang" : j, "data" : "" })    # no URLs available

    ret['info_URL'].sort(key=lambda x:x["lang"])               # order array by lang value

# ==============================================================================
# get inst_realm
# ==============================================================================
def get_inst_realm(root, inst_type, data):
  if inst_type == "SP":       # SP
    if hasattr(root.institution, 'inst_realm'):               # this part does not strictly follow the spec: "for type SP no realms should be specified"
      data["inst_realm"] = []
      for i in root.institution.inst_realm:                   # iterate realm and add to data
        data["inst_realm"].append(i)                           # add the data if any, to not lose it when transforming from v1 to v2

  else:       # IdP or Idp+SP, inst_realm is required here
    data["inst_realm"] = []
    for i in root.institution.inst_realm:                   # iterate realm and add to data
      data["inst_realm"].append(i)
# ==============================================================================
# get contents of objectified xml
# ==============================================================================
def get_data(root, filename, options):
  ret = {}
  required_lang = "en"                                    # language required for some fields

  ret["instid"] = ".".join(filename.split(".")[:-1])      # instid
  ret["ROid"] = config.ROid                               # ROid

  ret["type"] = get_inst_type(root.institution.type)      # type

  ret["stage"] = config.default_stage                     # stage, default value set to 1

  get_inst_realm(root, ret["type"], ret)                 # inst_realm

  ret["inst_name"] = get_inst_name(root, required_lang)   # inst_name

  ret["address"] = get_address(root.institution.address, required_lang)       # address

  # get coords from first location in institution.xml
  if hasattr(root.institution, 'location'):     # coords are not mandatory, so if not available do not add them to result
    get_coords(root.institution.location, options, ret)

  if hasattr(root.institution, 'location'):
    ret["location"] = get_locations(root, options, ret["instid"])

  # inst_type TODO? not mandatory

  ret["contact"] = []                                     # contact
  for i in root.institution.contact:
    ret["contact"].append({ "name" : i.name, "email" : i.email, "phone" : i.phone, "type" : config.default_contact_type, "privacy" : config.default_contact_privacy })   # use default values for type and privacy

  get_info_url(root.institution, ret)                     # info_URL

  ret["policy_URL"] = []                                    # policy_URL
  for i in root.institution.policy_URL:
    tmp = i
    tmp = re.sub(r'^\s+', '', str(tmp))
    tmp = re.sub(r'\s+$', '', str(tmp))
    ret["policy_URL"].append({ "lang" : i.get("lang"), "data" : tmp })      # TODO - this should be the same for all languages?

  ts = dateutil.parser.parse(str(root.institution.ts))

  if ts.tzinfo is not None and ts.tzinfo.utcoffset(ts) is not None:      # timezone info is present, assume the timezone is local
    iso_ts = ts.timestamp()
  else:
    iso_ts = pytz.timezone(config.local_timezone).localize(ts).timestamp()

  ret["ts"] = str(datetime.datetime.utcfromtimestamp(iso_ts)).replace(" ", "T") + "Z"   # create utc from iso timestamp and save in iso 8601

  return ret

# ==============================================================================
# write converted output in JSON to specified file
# ==============================================================================
def to_json(data, filename):
  with open(filename.replace(".xml", ".json"), 'w') as f:
    f.write(json.dumps(data, default=to_serializable))

# ==============================================================================
# convert files 
# ==============================================================================
def convert(input_dir, filename, output_dir, options):
  contents = read_xml(input_dir + filename)     # read xml with objectify
  root = contents.getroot() # get root element
  to_json(get_data(root, filename, options), output_dir + filename)

# ==============================================================================
# main function
# ==============================================================================
def main(input_dir, output_dir, options):

  if not os.path.isdir(input_dir):
    print(input_dir + " is not a directory")
    sys.exit(1)

  if not os.path.isdir(output_dir):
    print(output_dir + " is not a directory")
    sys.exit(1)

  if not input_dir.endswith("/"):   # add directory delimiter if not provided
    input_dir = input_dir + "/"

  if not output_dir.endswith("/"):   # add directory delimiter if not provided
    output_dir = output_dir + "/"

  input_list = list_files(input_dir)
  for i in input_list:
    try:

      if options['verbose'] == True:
        print("processing " + input_dir + i)

      if os.access(input_dir + i, os.R_OK):
        convert(input_dir, i, output_dir, options)

      else:
        print("file: " + input_dir + i + " not readable")
        sys.exit(1)

    except:     # some exception occured
      print("failed processing " + input_dir + i)
      raise
      sys.exit(1)

# ==============================================================================
# program is run directly, not included
# ==============================================================================
if __name__ == "__main__":
  if len(sys.argv) == 1:
    cli.main(['--help'])
  else:
    cli()

