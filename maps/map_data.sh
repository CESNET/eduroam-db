#!/bin/bash
# ==================================================================
# generate geojson data from institution.json v2
# ==================================================================

# TODO - possible locatilazation for others?

# ==================================================================
# main
# ==================================================================
function main()
{
  jq -c '[
        .institutions.institution[] |         # iterate all institutions
        .inst_name[0].data as $inst_name |    # save inst name as $inst_name

        [ 
          .location[] |                         # iterate all locations for one institution

          # get all the necesarry keys
          { 
            inst_name : $inst_name,
            loc_name : .loc_name[1].data,       # local lang location name
            ssid : .SSID,
            info_url : .info_URL[0].data,       # local lang url info
            address : .address[0],              # local lang address
            enc : .enc_level,
            coords : .coordinates,
            tag : .tag,
            wired : .wired_no
          } |
          
          # process the data
          [ 
            (
              # check if loc_name is available
              if .loc_name != null
              then
                [ .inst_name, " - ", .loc_name ] | add
              else
                .inst_name
              end
            )

            ,   # process further data

            # add more info
            ( 
              [ 
                "<div>",
                .address.street.data, 
                ", ", 
                .address.city.data, 
                "</div><div>essid: ", 
                .ssid, 
                "</div><div>šifrování: ", 
                .enc, 
                "</div><div>konektivita:" 
              ] | add       # concatenate all fields to string
            )

            ,   # process further data

            (
              # check if wired eduroam is available
              if .wired != null
              then
                "WiFi+kabel; "
              else
                "WiFi; "
              end
            )

            ,   # process further data

            ( 
              .tag |        # get tag element values
              [
                # check IPv6
                if . != null and contains("IPv6")
                then
                  "IPv4+6; "
                else
                  "IPv4; "
                end

                ,   # process further data

                # check port_restrict
                if . != null and contains("port_restrict")
                then
                  "FW + "
                else
                  "žádný FW + "
                end
       
                ,   # process further data

                # check NAT
                if . != null and contains("NAT")
                then
                  "NAT + "
                else
                  "veřejné IP + "
                end

                ,   # process further data

                # check transp_proxy
                if . != null and contains("transp_proxy")
                then
                  "proxy</div>"
                else
                  "žádná proxy</div>"
                end
              ] | add       # concatenate all condition outputs to string
            )

            ,   # process further data

            (
              [ "<a href=", .info_url , ">Infrormace pro návštěvníky<\/a>" ] | add
            )

            ,   # process further data
            ( 
              { "type" : "Point", "coordinates" : [ .coords | split(",")[] | tonumber ] }
            )
          ]
          | [ 
              .[0],                 # location name
              (.[1:5] | add),       # location description
              .[5]                  # location geometry
            ]
        ] 
      ]
    | 
    # final output
    { 
      "type": "FeatureCollection",
      #"name": $inst_name,
      "name": "eduroam.cz",        # TODO ?
      "features": 
      [

        # iterate created data by location
        ( .[][] |
          { 
            "type": "Feature", 
            "properties": 
            {
              name : .[0],              # loc name
              description : .[1],       # loc description
            },
            geometry : .[2]             # loc geometry
          }
        )
      ]
    }
    ' $1
}
# ==================================================================
main $@
