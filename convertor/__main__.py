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
  return "TODO"

# ==============================================================================
# get inst_name with required_lang language
# ==============================================================================
def get_inst_name(root, required_lang):
  ret = []
  got_req_lang = False

  for i in root.institution.org_name:                     # iterate possible language variants of org_name
    if i.get("lang") == required_lang:
      got_req_lang = True

    ret.append({ "lang" : i.get("lang"), "data" : i})

  if got_req_lang == False  # required_lang language not found in source data
    ret.append({ "lang" : required_lang, "data" : root.institution.org_name})   # insert institution name with language forced to required_lang

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

  ret["inst_name"] = get_inst_name                        # inst_name
  ret["address"] = []                                     # address

  # TODO ?
  for i in root.institution.address:                      # iterate possible language variants of org_name
    addr = {}

    if i.street.get("lang") == None:
      addr["street"] = { "lang" : config.default_lang, "data" : i.street }
    else:
      addr["street"] = { "lang" : i.street.get("lang"), "data" : i.street }

    if i.city.get("lang") == None:
      addr["city"] = { "lang" : config.default_lang, "data" : i.city }
    else:
      addr["city"] = { "lang" : i.city.get("lang"), "data" : i.city }

    ret["address"].append(addr)


  # get coords from first location in inst.xml
  ret["coordinates"] = convert_coords(root.institution.location.longitude , root.institution.location.latitude)

  # inst_type TODO

  ret["contact"] = []                                     # contact
  for i in root.institution.contact:
    ret["contact"].append({"name" : i.name, "email" : i.email, "phone" : i.phone, "type" : 0, "privacy" : 1})   # use default values for type and privacy

  ret["info_URL"] = []                                    # info_URL
  for i in root.institution.info_URL:
    ret["info_URL"].append({"lang" : i.get("lang"), "data" : i})

  ret["policy_URL"] = []                                    # policy_URL
  for i in root.institution.policy_URL:
    ret["policy_URL"].append({"lang" : i.get("lang"), "data" : i})

  ret["ts"] = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

  return ret

# ==============================================================================
# convert files 
# ==============================================================================
def convert(filename, output_dir):
  contents = read_xml(filename)     # read xml with objectify

  #print(contents.docinfo.encoding)      # TODO
  #print((lxml.etree.tostring(contents, encoding="utf-8").decode("utf-8")))

  root = contents.getroot() # get root element
  #print(root.institution.org_name)


  print(get_data(root))
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
    convert(input_dir + i, output_dir)

# ==============================================================================
# program is run directly, not included
# ==============================================================================
if __name__ == "__main__":
  main()
