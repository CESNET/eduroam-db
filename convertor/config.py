#!/usr/bin/env python3
# ==============================================================================
# configuration file for eduroam-db converter
# ==============================================================================
ROid = "CZ01"                      # ROid provided by database operator
default_lang = "cs"                # default lang used in country where the NRO is managing eduroam
default_contact_privacy = 0        # 0 - private (default), 1 - public
default_contact_type = 0           # 0 - person (default), 1 - service/department
local_timezone = "Europe/Prague"   # time zone of the NRO country
default_stage = 1                  # 0 - preproduction/test, 1 - active
default_location_type = 0          # 0 - single spot, 1 - area, 2 - mobile
# ==============================================================================
# option specific configuration
# ==============================================================================
lon_values = list(range(11, 19, 1))     # values between [11,18] are accepted as latitude
lat_values = list(range(48, 52, 1))     # values between [48,51] are accepted as longtitude
