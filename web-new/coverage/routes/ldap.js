const ldap = require('ldapjs');
const config = require('../config/config.js');
const secrets = require('../config/secrets.js');
const assert = require('assert');
const async = require('async');
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
exp.get_user_realms = function(user, response, callback) {

  var client = ldap.createClient({
    url: 'ldaps://' + config.ldap_host
  });

  client.bind(config.bind_dn, secrets.ldap_pass, function(err) {
    assert.ifError(err)
  })

  get_user_realms(client, user, response, callback);
}
// --------------------------------------------------------------------------------------
function get_user_realms(client, user, response, callback)
{
  var items = [ 'cn' ];
  var ret = [];

  var opts = {
    filter: 'manager=uid=' + user + "," + config.search_base_people,
    scope: 'sub',
    attributes: items
  };

  console.log(opts.filter);

  client.search(config.search_base_realms, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      ret.push(entry.object.cn);
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
      callback();
    });

    res.on('end', function(result) {
      client.unbind(function(err) {   // unbind after all search operations are done
        assert.ifError(err);
      });

      if(callback)
        callback(response, user, ret);
    });
  });
}
// --------------------------------------------------------------------------------------
// get institution's data by ldap dn
// --------------------------------------------------------------------------------------
function get_inst_data(client, data, response)
{
  var items = [ 'street', 'l', 'o', 'o;lang-cs' ];      // TODO ?

  var opts = {
    scope: 'sub',
    attributes: items
  };

  client.search(data.o_pointer, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      data.inst_details = entry.object;
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
    });

    res.on('end', function(result) {
      client.unbind(function(err) {   // unbind after all search operations are done
        assert.ifError(err);
      });

      response.send(create_institituon_json(data));       // TODO - upravit strukturu tak, aby odpovidaja JSON souborum?
    });
  });
}
// --------------------------------------------------------------------------------------
// create empty institution.json structure with ldap provided data
// --------------------------------------------------------------------------------------
function create_institituon_json(data)
{

  var ret = {
    "policy_URL": [
      {
        "data": "http://www.eduroam.cz/doku.php?id=cs:roamingova_politika",
        "lang": "cs"
      }
    ],
    "stage": 1,
    "contact": [
    ],
    "address": [
    ],
    "type": data.type,           // [ IdPSP, SP, IdP ]
    "location": [
    ],
    "inst_name": [
    ],
    "inst_realm": [
    ],
    "info_URL": [
    ],
    "instid": "cesnet.cz",          // TODO - jak se tohle vlastne generuje?        cn z organizace? v souborech je aktualne realm - hm? asi jsem vzal jina data nez z konverze edudb-cache?
    "ROid": "CZ01"
  };

  // --------------------------------------------------------------------------------------

  for(var i in data.manager_details) {
    if(typeof(data.manager_details[i].mail) === 'object')       // mupltiple addresses
      var contact = { "type": 0, "privacy": 0, "email": data.manager_details[i].mail[0], "name": data.manager_details[i]['cn;lang-cs'] };
    else        // one mail only
      var contact = { "type": 0, "privacy": 0, "email": data.manager_details[i].mail, "name": data.manager_details[i]['cn;lang-cs'] };

    ret.contact.push(contact);
  }

  // --------------------------------------------------------------------------------------

  ret.address.push(
    {
      "city": {
        "data": data.inst_details.l,
        "lang": "cs"
      },
      "street": {
        "data": data.inst_details.street,
        "lang": "cs"
      }
    });

  ret.address.push(
    {
      "city": {
        "data": data.inst_details.l,
        "lang": "en"
      },
      "street": {
        "data": data.inst_details.street,
        "lang": "en"
      }
    });

  // --------------------------------------------------------------------------------------

  ret.inst_name.push({ "data": data.inst_details.o, "lang": "cs" });
  ret.inst_name.push({ "data": data.inst_details.o, "lang": "en" });

  // --------------------------------------------------------------------------------------

  if(typeof(data.realm_list) === 'object') {
    for(var i in data.realm_list)
      ret.inst_realm.push(data.realm_list[i]);
  }
  else
    ret.inst_realm.push(data.realm_list);

  // --------------------------------------------------------------------------------------

  return ret;
}
// --------------------------------------------------------------------------------------
// get managers for specific for specific realm by dn
// --------------------------------------------------------------------------------------
function get_managers(client, ret, done)
{
  var items = [ 'cn', 'mail' ];         // TODO - phone number?
  ret.manager_details = [];

  var opts = {
    scope: 'sub',
    attributes: items
  };

  async.eachOfSeries(ret.managers, function(item, key, callback) {
    client.search(item, opts, function(err, res) {      // search for manager
      assert.ifError(err);

      res.on('searchEntry', function(entry) {
        ret.manager_details.push(entry.object);
      });

      res.on('error', function(err) {
        console.error('error: ' + err.message);
      });

      res.on('end', function(result) {
        callback();
      });
    });
  }, function() {
    done();         // all done, continue processing
  });
}
// --------------------------------------------------------------------------------------
// get institution pointer by realm
// --------------------------------------------------------------------------------------
function get_inst(client, realm, response)
{
  var items = [ 'oPointer', 'manager', 'eduroamMemberType', 'cn' ];
  var ret = {};
  ret.managers = [];

  var opts = {
    filter: 'cn=' + realm,
    scope: 'sub',
    attributes: items
  };

  client.search(config.search_base_realms, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      ret.o_pointer = entry.object.oPointer;
      ret.type = entry.object.eduroamMemberType;
      ret.realm_list = entry.object.cn;

      if(typeof(entry.object.manager) === 'object')
        ret.managers = object.entry.manager;
      else
        ret.managers.push(entry.object.manager);
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
    });

    res.on('end', function(result) {
      get_managers(client, ret, function() {
        get_inst_data(client, ret, response);
      });
    });
  });
}
// --------------------------------------------------------------------------------------
// get institution
// --------------------------------------------------------------------------------------
exp.get_inst = function(realm, response) {

  var client = ldap.createClient({
    url: 'ldaps://' + config.ldap_host
  });

  client.bind(config.bind_dn, secrets.ldap_pass, function(err) {
    assert.ifError(err)
  })

  get_inst(client, realm, response);
}
// --------------------------------------------------------------------------------------
module.exports = exp;