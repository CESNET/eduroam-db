const ldap = require('ldapjs');
const config = require('../config/config.js');
const secrets = require('../config/secrets.js');
const assert = require('assert');
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
function get_inst_data(client, inst, response, callback)
{
  var items = [ 'street', 'l', 'o', 'o;lang-cs' ];      // TODO ?
  var ret = [];

  var opts = {
    scope: 'sub',
    attributes: items
  };

  client.search(inst, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      console.log(entry.object);
      ret.push(entry.object);
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
    });

    res.on('end', function(result) {
      client.unbind(function(err) {   // unbind after all search operations are done
        assert.ifError(err);
      });

      console.log(ret);
      //response.send(JSON.parse([ret]));   // TODO
      response.send([]);   // TODO

      if(callback)
        callback();
    });
  });
}
// --------------------------------------------------------------------------------------
// get institution pointer by realm
// --------------------------------------------------------------------------------------
function get_inst(client, realm, response)
{
  var items = [ 'oPointer' ];
  var ret;

  var opts = {
    filter: 'cn=' + realm,
    scope: 'sub',
    attributes: items
  };

  client.search(config.search_base_realms, opts, function(err, res) {
    assert.ifError(err);

    res.on('searchEntry', function(entry) {
      ret = entry.object.oPointer;
    });

    res.on('error', function(err) {
      console.error('error: ' + err.message);
    });

    res.on('end', function(result) {
      get_inst_data(client, ret, response);
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
