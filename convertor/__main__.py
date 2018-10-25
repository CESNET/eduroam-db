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
# ==============================================================================

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
# get contents of objectified xml
# ==============================================================================
def get_data(root):
  ret = {}
  required_lang = "en"                                    # language required for some fields

  ret["instid"] = root.institution.inst_realm             # instid
  ret["ROid"] = config.ROid                               # ROid

  # type
  if root.institution.type == 1:
    ret["type"] = "IdP"

  elif root.institution.type == 2:
    ret["type"] = "SP"

  else:
    ret["type"] = "IdP+SP"

  ret["stage"] = 1                                        # stage, default value set to 1
  ret["inst_realm"] = []                                  # inst_realm

  for i in root.institution.inst_realm:                   # iterate realm and add to ret
    ret["inst_realm"].append(i)

  ret["inst_name"] = get_inst_name(root, required_lang)   # inst_name
  ret["address"] = get_address(root, required_lang)       # address


  # get coords from first location in inst.xml
  if hasattr(root.institution, 'location'):     # coords are not mandatory, so if not available do not add them to result
    ret["coordinates"] = convert_coords(root.institution.location.longitude, root.institution.location.latitude)

  # inst_type TODO

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
    json.dump(data, f)
# ==============================================================================
# convert files 
# ==============================================================================
def convert(input_dir, filename, output_dir):
  contents = read_xml(input_dir + filename)     # read xml with objectify

  #print(contents.docinfo.encoding)      # TODO
  #print((lxml.etree.tostring(contents, encoding="utf-8").decode("utf-8")))

  root = contents.getroot() # get root element
  #print(root.institution.org_name)


  print(get_data(root))
  to_json(get_data(root), output_dir + filename)
  #get_data(root)


# ==============================================================================
# main function
# ==============================================================================
def main():
  if(len(sys.argv) != 3):
    usage()
    sys.exit(1)

  input_dir = sys.argv[1]
  output_dir = sys.argv[2]

  input_list = list_files(input_dir)
  for i in input_list:
    try:
      convert(input_dir, i, output_dir)
    except:     # some exception occured
      print("failed processing " + input_dir + i)
      raise
      sys.exit(1)

# ==============================================================================
# program is run directly, not included
# ==============================================================================
if __name__ == "__main__":
  main()

