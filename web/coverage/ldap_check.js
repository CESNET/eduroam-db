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

    // create dict indexed by first realm
    for(var i in ldap_data) {
      if(!Array.isArray(ldap_data[i].realms)) {        // single realm
        ldap_data[i].realms = [ ldap_data[i].realms ];      // convert to array
        data[ldap_data[i].realms] = ldap_data[i];
      }
      else      // multiple realms
        data[ldap_data[i].realms[0]] = ldap_data[i];
    }

    read_json_files(data);
  });
}
// --------------------------------------------------------------------------------------
// read all JSON files
// --------------------------------------------------------------------------------------
function read_json_files(ldap_data)
{
  var dirname = './coverage_files/';

  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      console.error(err);
      return;
    }

    filenames.forEach(function(filename) {
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
  var primary_realm = content.inst_realm[0];        // primary realm, may change during run of this function?

  // check realms
  // check the length first
  if(content.inst_realm.length != data[primary_realm].realms.length) {
    content.inst_realm = data[primary_realm].realms;
    write = true;
  }
  else {        // same number of elements

    // check all the array elements
    for(var i in content.inst_realm)
      if(content.inst_realm[i] != data[primary_realm].realms[i]) {
        content.inst_realm = data[primary_realm].realms;
        write = true;
        break;
      }
  }

  // check type
  if(content.type == "IdP+SP" && data[primary_realm].type == "IdPSP")
    ;

  else if(content.type != data[primary_realm].type) {

    if(data[primary_realm].type == "IdPSP")
      content.type = "IdP+SP";
    else
      content.type = data[primary_realm].type;

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
