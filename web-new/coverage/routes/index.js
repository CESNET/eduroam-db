const express = require('express');
const router = express.Router();
const ldap = require('./ldap.js')
const ini = require('ini')
const fs = require('fs')
const admin_mapping = require('../config/realm_to_admin.js')
const inst_mapping = require('../config/realm_to_inst.js')
// --------------------------------------------------------------------------------------
/* GET home page. */
router.get('/', function(req, res, next) {
  var username = req.headers["remote_user"];
  username = username.split("@")[0];

  // TODO - ptat se ldapu je uplne zbytecne
  // ale dalo by se to vyuzit tak, ze pri prihlaseni by se aktualizovali informace
  // ale asi je zbytecne to delat kdykoliv se nekdo prihlasi
  //ldap.get_user_realms(username, res, respond);

  respond(res, username, []);
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
function check_realm_permissions(user)
{
  //const config = ini.parse(fs.readFileSync('./config/realm_to_admin.ini', 'utf-8'))       // ini nefunguje, protoze nelze deklarovat klic, ktery ma vice hodnot
  // pri mnohonasobne definici klice plati posledni hodnota

  // dalsi moznost je CSV

  // JSON

  //console.log(config[user + "@cesnet.cz"]);

  var ret = admin_mapping[user + "@cesnet.cz"];

  return ret;
}
// --------------------------------------------------------------------------------------
// responsd to user
// --------------------------------------------------------------------------------------
function respond(res, user, data) {
  //res.render('index', { title: 'Správa informací o pokrytí', realms : check_realm_permissions(transform_realms(data), user) });
  res.render('index', { title: 'Správa informací o pokrytí', realms : check_realm_permissions(user) });
}

// --------------------------------------------------------------------------------------
/* GET home page. */
router.get('/api/:inst_id', function(req, res, next)
{
  // TODO check inst_id - file inclusion !

  //console.log(req.params.inst_id)
  //console.log(inst_mapping[req.params.inst_id])

  var file = JSON.parse(fs.readFileSync('./coverage_files/' + inst_mapping[req.params.inst_id] + ".json"), 'utf8');

  // TODO - response status - 200 / 404

  //console.log(file);

  if(file)
    res.send(file);
  else
    res.send([]);   // TODO
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
