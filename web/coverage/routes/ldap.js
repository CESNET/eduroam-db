const ldap = require('ldapjs');
const config = require('../config/config.js');
const secrets = require('../config/secrets.js');
const assert = require('assert');
const async = require('async');
const authors = require('./authors');
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// get institution's data by ldap dn
// --------------------------------------------------------------------------------------
function get_inst_data(client, data, realm, response)
{
  var items = [ 'street', 'l', 'o', 'dc' ];      // 'o;lang-cs' and 'o;lang-en' are subtypes of 'o', no need to declare explicitly
  var opts = {
    scope: 'sub',
    attributes: items
  };

  if(data.o_pointer)
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

        response.send({ data : create_institituon_json(data), author : authors.get_last_edit_author(realm) });
      });
    });

  else {    // no org pointer available
    data.inst_details = {};
    response.send({ data : create_institituon_json(data), author : authors.get_last_edit_author(realm) });
  }
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
    "instid": data.inst_details.dc.replace(/ /g, "_"),
    "ROid": "CZ01"
  };

  // --------------------------------------------------------------------------------------

  for(var i in data.manager_details) {
    if(typeof(data.manager_details[i].mail) === 'object')       // mupltiple addresses
      var contact = { "type": 0, "privacy": 0, "email": data.manager_details[i].mail[0], "name": data.manager_details[i]['cn;lang-cs'] };
    else        // one mail only
      var contact = { "type": 0, "privacy": 0, "email": data.manager_details[i].mail, "name": data.manager_details[i]['cn;lang-cs'] };

    // add phone number if available
    // priorities: 'mobile' > 'telephonenumber' > 'ipphone'
    if(data.manager_details[i].mobile) {
      if(typeof(data.manager_details[i].mobile) === 'object')
        contact.phone = data.manager_details[i].mobile[0];
      else
        contact.phone = data.manager_details[i].mobile;
    }

    else if(data.manager_details[i].telephonenumber) {
      if(typeof(data.manager_details[i].telephonenumber) === 'object')
        contact.phone = data.manager_details[i].telephonenumber[0];
      else
        contact.phone = data.manager_details[i].telephonenumber;
    }

    else if(data.manager_details[i].ipphone) {
      if(typeof(data.manager_details[i].ipphone) === 'object')
        contact.phone = data.manager_details[i].ipphone[0];
      else
        contact.phone = data.manager_details[i].ipphone;
    }
    // no phone information is added if not available

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

  if(data.inst_details['o;lang-cs'])        // Czech name
    ret.inst_name.push({ "data": data.inst_details['o;lang-cs'], "lang": "cs" });
  else {                                    // generic name
    if(data.inst_details.o)
      ret.inst_name.push({ "data": data.inst_details.o, "lang": "cs" });
    else
      ret.inst_name.push({ "data": "", "lang": "cs" });         // no name available
  }

  if(data.inst_details['o;lang-en'])        // English name
    ret.inst_name.push({ "data": data.inst_details['o;lang-en'], "lang": "en" });
  else {                                    // generic name
    if(data.inst_details.o)
      ret.inst_name.push({ "data": data.inst_details.o, "lang": "en" });
    else
      ret.inst_name.push({ "data": "", "lang": "en" });         // no name available
  }

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
  var items = [ 'cn', 'mail', 'mobile', 'telephonenumber', 'ipphone' ];
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
        ret.managers = entry.object.manager;
      else
        ret.managers.push(entry.object.manager);
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
    });

    res.on('end', function(result) {
      get_managers(client, ret, function() {
        get_inst_data(client, ret, realm, response);
      });
    });
  });
}
// --------------------------------------------------------------------------------------
// get basic institution data
// --------------------------------------------------------------------------------------
function get_inst_basic(client, realm, callback)
{
  var items = [ 'eduroamMemberType', 'cn' ];
  var ret = [];

  var opts = {
    filter: 'cn=' + realm,
    scope: 'sub',
    attributes: items
  };

  if(!realm)        // remove filter if no specific realm was defined
    delete opts.filter;

  client.search(config.search_base_realms, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      if(entry.object.cn && entry.object.eduroamMemberType)
        ret.push({ realms : entry.object.cn , type : entry.object.eduroamMemberType })
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
    });

    res.on('end', function(result) {
      client.unbind(function(err) {   // unbind after all search operations are done
        assert.ifError(err);
      });

      callback(ret);
    });
  });
}
// --------------------------------------------------------------------------------------
// check institution data
// --------------------------------------------------------------------------------------
exp.check_inst_data = function(realm, callback) {
  var client = ldap.createClient({
    url: 'ldaps://' + config.ldap_host
  });

  client.bind(config.bind_dn, secrets.ldap_pass, function(err) {
    assert.ifError(err)
  })

  get_inst_basic(client, realm, callback);
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
