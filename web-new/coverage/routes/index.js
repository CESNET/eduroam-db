const express = require('express');
const router = express.Router();
const ldap = require('./ldap.js')
const ini = require('ini')
const fs = require('fs')
const admin_mapping = require('../config/realm_to_admin.js')
const inst_mapping = require('../config/realm_to_inst.js')
// --------------------------------------------------------------------------------------
// get the name of the user logged in the application
// --------------------------------------------------------------------------------------
function get_user(req)
{
  var username = req.headers["remote_user"];
  if(username.indexOf("@") != -1)
    username = username.split("@")[0];

  return username;
}
// --------------------------------------------------------------------------------------
// get title page
// --------------------------------------------------------------------------------------
router.get('/', function(req, res, next) {
  respond(res, get_user(req));
});
// --------------------------------------------------------------------------------------
// transform input data to array of realms
// --------------------------------------------------------------------------------------
function transform_realms(realms)
{
  var ret = [];

  if (typeof(realms) === 'object')
    for(var i in realms) {
      if(typeof(realms[i]) === 'object') {      // realm with aliases
        ret.push(realms[i][0]);         // add first realm
      }
      else
        ret.push(realms[i]);         // add realm
    }
  else      // single realm for admin?
    ;    // TODO

  return ret;
}
// --------------------------------------------------------------------------------------
// check permissions mapping of user to realms
// --------------------------------------------------------------------------------------
function get_administered_realms(user)
{
  var ret;

  if((user + "@cesnet.cz") in admin_mapping)
    ret = admin_mapping[user + "@cesnet.cz"];
  else
    ret = [];  // empty array

  return ret;
}
// --------------------------------------------------------------------------------------
// respond to user
// --------------------------------------------------------------------------------------
function respond(res, user) {
  res.render('index', { title: 'Správa informací o pokrytí', realms : get_administered_realms(user) });
}
// --------------------------------------------------------------------------------------
// get institution by realm
// --------------------------------------------------------------------------------------
router.get('/api/:inst_id', function(req, res, next)
{
  // check that inst_id has correct form - dns domain
  if(/^([a-zA-z0-9]+\.){1,}[a-zA-z0-9]+$/.test(req.params.inst_id)) {

    // check that the user has permission to read requested realm
    if(get_administered_realms(get_user(req)).indexOf(req.params.inst_id) != -1) {

      // check that requested realm exists in inst_mapping and correspoding JSON file exists
      if(req.params.inst_id in inst_mapping && fs.existsSync('./coverage_files/' + inst_mapping[req.params.inst_id] + '.json')) {
        var file = JSON.parse(fs.readFileSync('./coverage_files/' + inst_mapping[req.params.inst_id] + '.json'), 'utf8');
        res.send(file);
      }
      else  // no data available, query ldap
        ldap.get_inst(req.params.inst_id, res)
    }
    else {        // no permission to read requested realm
      res.status(401);    // unathorized
      res.send([]);       // send empty array
    }
  }
  else {        // incorrect inst_id form
    res.status(404);    // no such thing
    res.send([]);       // send empty array
  }
});
// --------------------------------------------------------------------------------------
router.post('/api/:inst_id', function(req, res, next)
{
  json = JSON.stringify(req.body, 'utf8');      // TODO - check correct file structure
  fs.writeFileSync('./coverage_files/' + inst_mapping[req.params.inst_id] + ".json", json);
  res.send("");
});
// --------------------------------------------------------------------------------------
module.exports = router;
