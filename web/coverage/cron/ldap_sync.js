const ldap = require('ldapjs');
const fs = require('fs');
const assert = require('assert');
const secrets = require('../config/secrets.js');
const config = require('../config/config.js');
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// sync data
// --------------------------------------------------------------------------------------
exp.sync = function (callback) {
  var client = ldap.createClient({
    url: 'ldaps://' + config.ldap_host
  });

  client.bind(config.bind_dn, secrets.ldap_pass, function(err) {
    assert.ifError(err)
  })

  exp.search_realms(client, config.search_base_realms, callback);
};
// --------------------------------------------------------------------------------------
// search ldap for realms
// --------------------------------------------------------------------------------------
exp.search_realms = function (client, search_base, callback)
{
  // items which are registered for each realm
  var items = [ 'dn', 'cn', 'manager', 'oPointer' ];
  var ret = [];

  var opts = {
    filter: '(objectclass=eduroamRealm)',
    scope: 'sub',
    attributes: items
  };

  client.search(search_base, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      var dict = {};
      dict.managers = [];
      dict.realm = [];

      if(typeof(entry.object['cn']) === 'object')	// multiple realms
        dict.realm = entry.object['cn'][0]     // get primary realm only
      else  // one realm only
        dict.realm = entry.object['cn']

      if(typeof(entry.object['manager']) === 'object') {	// multiple managers
        for(var manager in entry.object['manager'])
          dict.managers.push(entry.object['manager'][manager].toLowerCase());
      }
      else  // one manager only
        dict.managers.push(entry.object['manager'].toLowerCase());

      if(entry.object['oPointer'])
        dict.org_ptr = entry.object['oPointer'];

      ret.push(dict);		// prepare results for config
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
      if(callback)
        callback();
    });

    res.on('end', function(result) {
      if(callback)
        search_admins(client, config.search_base_people, ret, callback)
      else
        search_admins(client, config.search_base_people, ret)
    });
  });
}
// --------------------------------------------------------------------------------------
// search admins
// --------------------------------------------------------------------------------------
function search_admins(client, search_base, data, callback)
{
  // items which are registered for each realm
  var items = [ 'edupersonuniqueid', 'dn' ];
  var ret = {};

  var opts = {
    filter: '(objectclass=*)',
    scope: 'sub',
    attributes: items
  };

  client.search(search_base, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      if(entry.object['edupersonuniqueid'])
        ret[entry.object['dn'].toLowerCase()] = entry.object['edupersonuniqueid'];
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
      if(callback)
        callback();
    });

    res.on('end', function(result) {
      client.unbind(function(err) {   // unbind after all search operations are done
        assert.ifError(err);
      });

      prepare_data(data, ret);

      if(callback)
        callback();
    });
  });
}
// --------------------------------------------------------------------------------------
// sort realms by domain
// --------------------------------------------------------------------------------------
function sort_by_domain(a, b)
{
  var tmp_a = a.split(".").reverse().join(".");
  var tmp_b = b.split(".").reverse().join(".");

  if(tmp_a > tmp_b)
    return 1;

  return -1;
}
// --------------------------------------------------------------------------------------
// prepare data in needed form
// --------------------------------------------------------------------------------------
function prepare_data(realms, managers)
{
  var ret = {};
  ret.admin_to_realm = {};
  ret.realm_to_inst = {};
  var tmp_realms = [];

  for(var i in realms) {
    tmp_realms.push(realms[i].realm);

    for(var j in realms[i].managers) {
      realms[i].managers[j] = managers[realms[i].managers[j]];

      if(ret.admin_to_realm[realms[i].managers[j]])
        ret.admin_to_realm[realms[i].managers[j]].push(realms[i].realm);
      else {
        ret.admin_to_realm[realms[i].managers[j]] = [];
        ret.admin_to_realm[realms[i].managers[j]].push(realms[i].realm);
      }
    }

    if(realms[i].org_ptr)
      ret.realm_to_inst[realms[i].realm] = realms[i].org_ptr.replace("dc=", "").replace(",ou=Organizations,dc=cesnet,dc=cz", "").replace(/ /g, "_");
  }

  ret.realms = tmp_realms.sort(sort_by_domain);
  generate_config(ret);
}
// --------------------------------------------------------------------------------------
// generate configuration files
// --------------------------------------------------------------------------------------
function generate_config(data)
{
  fs.writeFileSync("./config/realm_to_admin.js", "module.exports = \n");
  fs.appendFileSync("./config/realm_to_admin.js", JSON.stringify(data.admin_to_realm, null, 4));
  fs.writeFileSync("./config/realm_to_inst.js", "module.exports = \n");
  fs.appendFileSync("./config/realm_to_inst.js", JSON.stringify(data.realm_to_inst, null, 4));
  fs.writeFileSync("./config/realms.js", "module.exports = \n");
  fs.appendFileSync("./config/realms.js", JSON.stringify(data.realms, null, 4));
}
// --------------------------------------------------------------------------------------
module.exports = exp;

