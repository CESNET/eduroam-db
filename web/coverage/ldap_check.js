#!/usr/bin/env node

// --------------------------------------------------------------------------------------
const ldap = require( './routes/ldap' );
const fs = require( 'fs' );
// --------------------------------------------------------------------------------------
// check ldap data for for all realms
// --------------------------------------------------------------------------------------
function main()
{
  var data = {};

  ldap.check_inst_data(null, function(ldap_data) {

    // create dict indexed by org - that should be more stable than realm
    for(var i in ldap_data) {

      if(ldap_data[i].org) {        // only if org is present
        if(!Array.isArray(ldap_data[i].realms))               // single realm
          ldap_data[i].realms = [ ldap_data[i].realms ];      // convert to array

        else      // multiple realms
          data[ldap_data[i].realms[0]] = ldap_data[i];

        var org = ldap_data[i].org.replace(/^dc=/,'').replace(/,ou=Organizations,dc=cesnet,dc=cz$/, '').replace(/ /g, '_')      // get just org identifier, replace all ' ' with '_'
        data[org] = ldap_data[i];
      }
    }

    read_json_files(data);
  });
}
// --------------------------------------------------------------------------------------
// read all JSON files
// --------------------------------------------------------------------------------------
function read_json_files(ldap_data)
{
  var dirname = '/home/eduroamdb/eduroam-db/web/coverage/coverage_files/';

  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      console.error(err);
      return;
    }

    filenames.forEach(function(filename) {
      if(fs.lstatSync(dirname + filename).isFile())
        fs.readFile(dirname + filename, 'utf-8', function(err, content) {
          if (err) {
            console.error(err);
            return;
          }

          compare_data(dirname + filename, content, ldap_data);
        });
    });
  });
}
// --------------------------------------------------------------------------------------
// compare one file contents with ldap data
// --------------------------------------------------------------------------------------
function compare_data(filepath, content, data)
{
  var write = false;
  content = JSON.parse(content);        // read content into object
  var org = content.instid.replace(/ /g, '_');        // org identifier - should not change at all (only in rare cases?)


  // check realms
  // check the length first
  if(content.inst_realm.length != data[org].realms.length) {
    content.inst_realm = data[org].realms;
    write = true;
  }
  else {        // same number of elements

    // check all the array elements
    for(var i in content.inst_realm)
      if(content.inst_realm[i] != data[org].realms[i]) {
        content.inst_realm = data[org].realms;
        write = true;
        break;
      }
  }

  // check type
  if(content.type == "IdP+SP" && data[org].type == "IdPSP")
    ;

  else if(content.type != data[org].type) {

    if(data[org].type == "IdPSP")
      content.type = "IdP+SP";
    else
      content.type = data[org].type;

    write = true;
  }

  // ovewrite file is there are changes
  if(write) {
    var ts = new Date().toISOString();
    // replace seconds and milliseconds with "00Z"
    ts = ts.substring(0, 17) + "00Z";
    content.ts = ts;

    fs.writeFileSync(filepath, JSON.stringify(content, undefined, 4));
  }
}
// --------------------------------------------------------------------------------------
main();
// --------------------------------------------------------------------------------------
