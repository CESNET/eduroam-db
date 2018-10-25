#!/usr/bin/env python3
# ==============================================================================
# convert eduroam database old format to new format
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
# ==============================================================================

# ==============================================================================
# command line arguments and options
# ==============================================================================
@click.command()
@click.argument('input_dir', type=click.Path(exists=True))
@click.argument('output_dir', type=click.Path(exists=True))
@click.option('--fix_coord_chars', is_flag=True, help='fix wrong characters used in coordinates definitions')
@click.option('--fix_lon_lat', is_flag=True, help='enable swapping of lon and lat if switched. Configure list of accepted values in config.py')
@click.option('--enable_float_format', is_flag=True, help='enable float format for coords. ie: 13.3702403E (180), E13.3702403 (180) or 17.265195°E (180)')
@click.option('-v', 'verbose', is_flag=True, help='enable verbose output')
def cli(input_dir, output_dir, fix_coord_chars, fix_lon_lat, enable_float_format, verbose):
  """This script converts institution.xml files to json v2 format.
  It requires positional parameters input_dir and output_dir.
  input_dir specifies the input directory with institution.xml files.
  output_dir specifies the output directory for json files.
  """

  main(input_dir, output_dir, { "fix_coord_chars" : fix_coord_chars, "fix_lon_lat" : fix_lon_lat,
                                "enable_float_format" : enable_float_format, "verbose" : verbose })

# ==============================================================================
# replace from the right
# ==============================================================================
def rreplace(s, old, new, occurrence):
  li = s.rsplit(old, occurrence)
  return new.join(li)

# ==============================================================================
# usage
# ==============================================================================
def usage():
  print("usage:")
  print(sys.argv[0] + " input_dir output_dir")

# ==============================================================================
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
  #data = lxml.etree.parse(filename)        # TODO ?
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

  return str(str(lon_ret) + ", " + str(lat_ret))

# ==============================================================================
# get inst_name with required_lang language
# ==============================================================================
def get_inst_name(root, required_lang):
  ret = []
  got_req_lang = False

  for i in root.institution.org_name:                     # iterate possible language variants of org_name
    if i.get("lang") == required_lang:
      got_req_lang = True

    ret.append({ "lang" : i.get("lang"), "data" : i })

  if got_req_lang == False:  # required_lang language not found in source data
    ret.append({ "lang" : required_lang, "data" : root.institution.org_name })   # insert institution name with language forced to required_lang

  return ret

# ==============================================================================
# get address with required_lang language
# ==============================================================================
def get_address(root, required_lang):
  ret = []
  street_lang = False
  city_lang = False

  # TODO ?
  for i in root.institution.address:
    addr = {}

    if i.street.get("lang") == required_lang:
      street_lang = True

    if i.city.get("lang") == required_lang:
      city_lang = True

    if i.street.get("lang") == None:
      addr["street"] = { "lang" : config.default_lang, "data" : i.street }
    else:
      addr["street"] = { "lang" : i.street.get("lang"), "data" : i.street }

    if i.city.get("lang") == None:
      addr["city"] = { "lang" : config.default_lang, "data" : i.city }
    else:
      addr["city"] = { "lang" : i.city.get("lang"), "data" : i.city }

    ret.append(addr)

  # TODO - handle other states too?
  if street_lang == False and city_lang == False:
    ret.append({ "street" : { "lang" : required_lang, "data" : root.institution.address.street },
                 "city"   : { "lang" : required_lang, "data" : root.institution.address.city   }})

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
  #
  #
  #


  # TODO - some more bad chars?

  return str(coord).replace("“", '"').replace("„", '"').replace(" ", "").replace("’", "'")

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
def check_coord_format(lon, lat, float_format):

  # check for correct float format
  if float_format == True:
    if re.match(r"\d{2}\.\d+", str(lon)) and re.match(r"\d{2}\.\d+", str(lat)):       # TODO - generic enough?
      lon_changed = False
      lat_changed = False
      lon = extract_lon(lon, lon_changed)    # extract the number itself
      lat = extract_lat(lat, lat_changed)    # extract the number itself

      if lon_changed == True and lat_changed == True:    # both values extracted
        return str(lon) + ", " + str(lat)   # no conversion needed

  # try regular format too
  if not re.match(r"^\d{1,3}°\d{1,2}'\d{1,2}(\.\d{1,8})?\"E$", str(lon)):
    raise ValueError("Incorrect longitude value: " + str(lon))

  if not re.match(r"^\d{1,3}°\d{1,2}'\d{1,2}(\.\d{1,8})?\"N$", str(lat)):
    raise ValueError("Incorrect latitude value: " + str(lat))

  return convert_coords(lon, lat)     # convert coords in correct formats

# ==============================================================================
# get coords from first location in institution.xml
# ==============================================================================
def get_coords(root, options, ret):

  if hasattr(root.institution, 'location'):     # coords are not mandatory, so if not available do not add them to result
    lon = root.institution.location.longitude
    lat = root.institution.location.latitude

    if options['fix_coord_chars'] == True:
      lon = fix_coord_chars(lon)
      lat = fix_coord_chars(lat)

    if options['fix_lon_lat'] == True:
      lon, lat = fix_lon_lat(lon, lat)

    if options['enable_float_format'] == True:
      pass

    ret["coordinates"] = check_coord_format(lon, lat, options['enable_float_format'])

# ==============================================================================
# get contents of objectified xml
# ==============================================================================
def get_data(root, options):
  ret = {}
  required_lang = "en"                                    # language required for some fields

  ret["instid"] = root.institution.inst_realm             # instid
  ret["ROid"] = config.ROid                               # ROid

  ret["type"] = get_inst_type(root.institution.type)      # type

  ret["stage"] = 1                                        # stage, default value set to 1

  ret["inst_realm"] = []                                  # inst_realm
  for i in root.institution.inst_realm:                   # iterate realm and add to ret
    ret["inst_realm"].append(i)

  ret["inst_name"] = get_inst_name(root, required_lang)   # inst_name
  ret["address"] = get_address(root, required_lang)       # address

  # get coords from first location in institution.xml
  get_coords(root, options, ret)        # TODO

  # inst_type TODO
  # not mandatory

  ret["contact"] = []                                     # contact
  for i in root.institution.contact:
    ret["contact"].append({ "name" : i.name, "email" : i.email, "phone" : i.phone, "type" : config.default_contact_type, "privacy" : config.default_contact_privacy })   # use default values for type and privacy

  ret["info_URL"] = []                                    # info_URL
  for i in root.institution.info_URL:
    ret["info_URL"].append({ "lang" : i.get("lang"), "data" : i })

  ret["policy_URL"] = []                                    # policy_URL
  for i in root.institution.policy_URL:
    ret["policy_URL"].append({ "lang" : i.get("lang"), "data" : i })

  ret["ts"] = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

  return ret

# ==============================================================================
# write converted output in JSON to specified file
# ==============================================================================
def to_json(data, filename):
  with open(filename, 'w') as f:
    json.dump(json.loads(data), f)
# ==============================================================================
# convert files 
# ==============================================================================
def convert(input_dir, filename, output_dir, options):
  contents = read_xml(input_dir + filename)     # read xml with objectify

  #print(contents.docinfo.encoding)      # TODO
  #print((lxml.etree.tostring(contents, encoding="utf-8").decode("utf-8")))

  root = contents.getroot() # get root element
  #print(root.institution.org_name)


  #print(get_data(root))
  #print(json.dumps(get_data(root)))
  print(get_data(root, options))
  #to_json(get_data(root), output_dir + filename)
  #get_data(root)


# ==============================================================================
# main function
# ==============================================================================
def main(input_dir, output_dir, options):
  input_list = list_files(input_dir)
  for i in input_list:
    try:
      if options['verbose'] == True:
        print("processing " + input_dir + i)
      convert(input_dir, i, output_dir, options)
    except:     # some exception occured
      print("failed processing " + input_dir + i)
      raise
      sys.exit(1)

# ==============================================================================
# program is run directly, not included
# ==============================================================================
if __name__ == "__main__":
  cli()

