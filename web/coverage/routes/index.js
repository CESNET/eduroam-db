const express = require('express');
const router = express.Router();
const ldap = require('./ldap.js')
const fs = require('fs')
const admin_mapping = require('../config/realm_to_admin.js')
const token_mapping = require('../config/tokens.js')
const jsonschema = require('jsonschema')
const schema = require('../config/schema.json')
const admins = require('../config/admins.js')
const realms = require('../config/realms.js')
const authors = require('./authors')
const exec = require('child_process').exec;
// --------------------------------------------------------------------------------------
// get the name of the user logged in the application
// --------------------------------------------------------------------------------------
function get_user(req)
{
  return req.headers["remote_user"];
}
// --------------------------------------------------------------------------------------
// get specific realm
// --------------------------------------------------------------------------------------
router.get('/:realm', function(req, res, next) {
  respond(res, get_user(req), req.params.realm);
});
// --------------------------------------------------------------------------------------
// get title page
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  respond(res, get_user(req));
});
// --------------------------------------------------------------------------------------
// check if user is super admin
// --------------------------------------------------------------------------------------
function is_super_admin(user)
{
  if(admins.admins.indexOf(user) != -1)
    return true;        // super admin

  return false;         // NOT super admin
}
// --------------------------------------------------------------------------------------
// check permissions mapping of user to realms
// --------------------------------------------------------------------------------------
function get_administered_realms(user)
{
  var ret;
  delete require.cache[require.resolve('../config/realm_to_admin.js')]
  const admin_mapping = require('../config/realm_to_admin.js')

  if(is_super_admin(user))                     // super admin - can choose any realm
    ret = realms;

  else if(user in admin_mapping)               // regular user, can choose only own realm
    ret = admin_mapping[user];
  else
    ret = [];  // empty array

  return ret;
}
// --------------------------------------------------------------------------------------
// respond to user
// --------------------------------------------------------------------------------------
function respond(res, user, realm) {
  if(realm)
    res.render('index', { title: 'Správa informací o pokrytí', realms : get_administered_realms(user), admin : is_super_admin(user), realm : realm });
  else
    res.render('index', { title: 'Správa informací o pokrytí', realms : get_administered_realms(user), admin : is_super_admin(user), realm : "" });
}
// --------------------------------------------------------------------------------------
// get institution by realm
// --------------------------------------------------------------------------------------
router.get('/api/:inst_id', function(req, res, next)
{
  delete require.cache[require.resolve('../config/realm_to_inst.js')]
  const inst_mapping = require('../config/realm_to_inst.js')

  // check that inst_id has correct form - dns domain
  if(/^([a-zA-z0-9-]+\.){1,}[a-zA-z0-9-]+$/.test(req.params.inst_id)) {

    // check that the user has permission to read requested realm
    if(req.headers["remote_user"] && (is_super_admin(get_user(req)) || get_administered_realms(get_user(req)).indexOf(req.params.inst_id) != -1)) {

      // check that requested realm exists in inst_mapping and correspoding JSON file exists
      if(req.params.inst_id in inst_mapping && fs.existsSync('./coverage_files/' + inst_mapping[req.params.inst_id] + '.json')) {
        var file = JSON.parse(fs.readFileSync('./coverage_files/' + inst_mapping[req.params.inst_id] + '.json'), 'utf8');

        // query ldap - all realms and type
        ldap.check_inst_data(req.params.inst_id, function(ldap_data) {
          res.send({ data : check_data(fix_structure(file), ldap_data), author : authors.get_last_edit_author(req.params.inst_id) });
        });

      }
      else  // no data available, query ldap
        ldap.get_inst(req.params.inst_id, res)
    }
    else {        // no permission to read requested realm
      res.status(401);    // unathorized
      res.send("");
    }
  }
  else {        // incorrect inst_id form
    res.status(404);    // no such thing
    res.send("");
  }
});
// --------------------------------------------------------------------------------------
// check that type and realms in file match data in ldap
// forcibly assign data from ldap to data from file
// if there is no difference, then is does not matter
// --------------------------------------------------------------------------------------
function check_data(data, ldap_data)
{
  // single realm only
  if(!Array.isArray(ldap_data[0].realms))
    data.inst_realm = [ ldap_data[0].realms ];
  else
    data.inst_realm = ldap_data[0].realms;

  // slight difference for IdPSP
  if(ldap_data[0].type == "IdPSP")
    data.type = "IdP+SP";
  else
    data.type = ldap_data[0].type;

  return data;
}
// --------------------------------------------------------------------------------------
// fix JSON structure read from file to match eduroamdb v2 definition
// --------------------------------------------------------------------------------------
function fix_structure(obj)
{
  var skel = {
    "inst_name": [
      {
        "data": "",
        "lang": "cs"
      },
      {
        "data": "",
        "lang": "en"
      }
    ],
    "policy_URL": [
      {
        "data": "http://www.eduroam.cz/doku.php?id=cs:roamingova_politika",
        "lang": "cs"
      }
    ],
    "location": [
      {
        "stage": 1,
        "type": 0,
        "coordinates": "",
        "info_URL": [
          {
            "data": "",
            "lang": "cs"
          },
          {
            "data": "",
            "lang": "en"
          }
        ],
        "loc_name": [
          {
            "data": "",
            "lang": "cs"
          },
          {
            "data": "",
            "lang": "en"
          }
        ],
        "address": [
          {
            "street": {
              "data": "",
              "lang": "cs"
            },
            "city": {
              "data": "",
              "lang": "cs"
            }
          },
          {
            "street": {
              "data": "",
              "lang": "en"
            },
            "city": {
              "data": "",
              "lang": "en"
            }
          }
        ],
      }
    ],
    "info_URL": [
      {
        "data": "",
        "lang": "cs"
      },
      {
        "data": "",
        "lang": "en"
      }
    ],
    "address": [
      {
        "street": {
          "data": "",
          "lang": "cs"
        },
        "city": {
          "data": "",
          "lang": "cs"
        }
      },
      {
        "street": {
          "data": "",
          "lang": "en"
        },
        "city": {
          "data": "",
          "lang": "en"
        }
      }
    ],
    "inst_realm": [
    ],
    "contact": [
    ]
  };


  // base
  // inst_name
  if(!obj.inst_name || !Array.isArray(obj.inst_name))
    obj.inst_name = skel.inst_name;

  if(obj.inst_name.length != 2) {
    var tmp = skel.inst_name;

    for(var i = 0; i < obj.inst_name.length; i++)
      if(obj.inst_name[i].lang == "cs")
        tmp[0].data = obj.inst_name[i].data;

      else if(obj.inst_name[i].lang == "en")
        tmp[1].data = obj.inst_name[i].data;

    obj.inst_name = tmp;        // assign the final corrected object
  }

  // policy_URL
  obj.policy_URL = skel.policy_URL;

  // info_URL
  if(!obj.info_URL || !Array.isArray(obj.info_URL))
    obj.info_URL = skel.info_URL;

  if(obj.info_URL.length != 2) {
    var tmp = skel.info_URL;

    for(var i = 0; i < obj.info_URL.length; i++)
      if(obj.info_URL[i].lang == "cs")
        tmp[0].data = obj.info_URL[i].data;

      else if(obj.info_URL[i].lang == "en")
        tmp[1].data = obj.info_URL[i].data;

    obj.info_URL = tmp;        // assign the final corrected object
  }

  // address
  if(!obj.address || !Array.isArray(obj.address))
    obj.address = skel.address;

  if(obj.address.length != 2) {
    var tmp = skel.address;

    for(var i = 0; i < obj.address.length; i++)
      if(obj.address[i].street.lang == "cs" && obj.address[i].city.lang == "cs") {
        tmp[0].street.data = obj.address[i].street.data;
        tmp[0].city.data = obj.address[i].city.data;
      }

      else if(obj.address[i].street.lang == "en" && obj.address[i].city.lang == "en") {
        tmp[1].street.data = obj.address[i].street.data;
        tmp[1].city.data = obj.address[i].city.data;
      }

    obj.address = tmp;        // assign the final corrected object
  }

  // inst_realm
  if(!obj.inst_realm || !Array.isArray(obj.inst_realm))
    obj.inst_realm = skel.inst_realm;

  // contact
  if(!obj.contact || !Array.isArray(obj.contact))
    obj.contact = skel.contact;

  // ================================================================
  // locations
  if(!obj.location || !Array.isArray(obj.location))
    obj.location = skel.location;

  for(var i = 0; i < obj.location.length; i++) {
    // info_URL
    if(!obj.location[i].info_URL || !Array.isArray(obj.location[i].info_URL))
      obj.location[i].info_URL = skel.info_URL;

    if(obj.location[i].info_URL.length != 2) {
      var tmp = skel.info_URL;

      for(var j = 0; j < obj.location[i].info_URL.length; j++)
        if(obj.location[i].info_URL[j].lang == "cs")
          tmp[0].data = obj.info_URL[j].data;

        else if(obj.location[i].info_URL[j].lang == "en")
          tmp[1].data = obj.info_URL[j].data;

      obj.location[i].info_URL = tmp;        // assign the final corrected object
    }

    // address
    if(!obj.location[i].address || !Array.isArray(obj.location[i].address))
      obj.location[i].address = skel.address;

    if(obj.location[i].address.length != 2) {
      var tmp = skel.address;

      for(var j = 0; j < obj.location[i].address.length; j++)
        if(obj.location[i].address[j].street.lang == "cs" && obj.location[i].address[j].city.lang == "cs") {
          tmp[0].street.data = obj.location[i].address[j].street.data;
          tmp[0].city.data = obj.location[i].address[j].city.data;
        }

        else if(obj.location[i].address[j].street.lang == "en" && obj.location[i].address[j].city.lang == "en") {
          tmp[1].street.data = obj.location[i].address[j].street.data;
          tmp[1].city.data = obj.location[i].address[j].city.data;
        }

      obj.location[i].address = tmp;        // assign the final corrected object
    }

    // loc_name
    // loc_name is optional, do not force its existence
    if(obj.location[i].loc_name && !Array.isArray(obj.location[i].loc_name))
      obj.location[i].loc_name = skel.location[0].loc_name;

    if(obj.location[i].loc_name && obj.location[i].loc_name.length != 2) {
      var tmp = skel.location[0].loc_name;

      for(var j = 0; j < obj.location[i].loc_name.length; j++)
        if(obj.location[i].loc_name[j].lang == "cs")
          tmp[0].data = obj.location[i].loc_name[j].data;

        else if(obj.location[i].loc_name[j].lang == "en")
          tmp[1].data = obj.location[i].loc_name[j].data;

      obj.location[i].loc_name = tmp;        // assign the final corrected object
    }
  }

  return obj;
}
// --------------------------------------------------------------------------------------
// validate input against schema
// --------------------------------------------------------------------------------------
function validate_json_input(input)
{
  var data = { "schema_version": 2, "institutions": { "institution": [ input ] } };
  var v = new jsonschema.Validator();
  var ret = v.validate(data, schema);
  return ret
}
// --------------------------------------------------------------------------------------
// check if string is in JSON format
// --------------------------------------------------------------------------------------
function is_json(data)
{
  if(typeof(data) === 'object') {       // got object, try to stringify it
    try {
      JSON.stringify(data);
    } catch (e) {
      return false;
    }
    return true;
  }
  else if(typeof(data) === 'string') {        // got string, try to parse it
    try {
      JSON.parse(data);
    } catch (e) {
      return false;
    }
    return true;
  }

  return false;
}
// --------------------------------------------------------------------------------------
// save data if have correct structure and validate against schema
// --------------------------------------------------------------------------------------
function save_data(req, res)
{
  delete require.cache[require.resolve('../config/realm_to_inst.js')]
  const inst_mapping = require('../config/realm_to_inst.js')

  // check that data in JSON format
  if(is_json(req.body)) {
    var json = JSON.stringify(req.body, undefined, 4);      // pretty-print JSON output to file
    var result = validate_json_input(req.body);     // validate input against schema

    if(result.errors.length != 0) {     // check for validation errors
      res.status(400);
      var errors = [];

      for(var i = 0; i < result.errors.length; i++)       // iterate all errors
        errors.push({ property : result.errors[i].property, message : result.errors[i].message });      //  send only error property and message

      res.send(errors);          // send errors to user
    }
    else {
      // check if req.params.inst_id exists in inst_mapping
      if(inst_mapping[req.params.inst_id] === undefined) {
        res.status(401);    // unathorized
        res.send("");
      }
      else {
        fs.writeFileSync('./coverage_files/' + inst_mapping[req.params.inst_id] + ".json", json);
        authors.set_last_editor_author(req.params.inst_id, get_user(req));
        res.send("");

        // export new data, generate map data and list of connected institutions
        exec("/home/eduroamdb/eduroam-db/tools/export.sh /home/eduroamdb/www/general/institution.json /home/eduroamdb/www/pokryti/eduroam-cs_CZ.geojson", function (error, stdout, stderr) {
          if(error)
            console.error(error);

          if(stderr);
            console.error(stderr);
        });
      }
    }
  }
  else {        // is it even possible to get here? malfored data dies with code 400 at body-parser
    res.status(400);
    res.send("received malformed data: " + req.body);
  }
}
// --------------------------------------------------------------------------------------
// update JSON file by realm
// --------------------------------------------------------------------------------------
router.post('/api/:inst_id', function(req, res, next)
{
  delete require.cache[require.resolve('../config/realm_to_inst.js')]
  const inst_mapping = require('../config/realm_to_inst.js')

  // check that inst_id has correct form - dns domain
  if(/^([a-zA-z0-9-]+\.){1,}[a-zA-z0-9-]+$/.test(req.params.inst_id)) {

    // check that the user has permission to edit requested realm
    if(req.headers["remote_user"] && (is_super_admin(get_user(req)) || get_administered_realms(get_user(req)).indexOf(req.params.inst_id) != -1)) {
      save_data(req, res);
    }
    else {        // no permission to edit requested realm
      res.status(401);    // unathorized
      res.send("");
    }
  }
  else {        // incorrect inst_id form
    res.status(404);    // no such thing
    res.send("");
  }
});
// --------------------------------------------------------------------------------------
// automated update of JSON file by realm
// --------------------------------------------------------------------------------------
router.post('/api/automation/:inst_id', function(req, res, next)
{
  // check that inst_id has correct form - dns domain
  if(/^([a-zA-z0-9-]+\.){1,}[a-zA-z0-9-]+$/.test(req.params.inst_id)) {

    // TODO - update ts !!

    // token is present in request, is present in config and requested realm is accessible
    if(req.headers["authorization"] && req.headers["authorization"] in token_mapping && token_mapping[req.headers['authorization']].indexOf(req.params.inst_id) != -1) {
      save_data(req, res);
    }
    else {        // no permission to edit requested realm
      res.status(401);    // unathorized
      res.send("");
    }
  }
  else {        // incorrect inst_id form
    res.status(404);    // no such thing
    res.send("");
  }
});
// --------------------------------------------------------------------------------------
module.exports = router;
