// --------------------------------------------------------------------------------------
const CronJob = require('cron').CronJob;
const ldap_sync = require('./cron/ldap_sync.js')
const assert = require('assert');
const fs = require('fs');
// --------------------------------------------------------------------------------------
new CronJob('0 */5 * * * *', function() {     // run every 5 minutes
  ldap_sync.sync();         // sync configuration info from ldap
}, null, true, 'Europe/Prague');
// --------------------------------------------------------------------------------------
