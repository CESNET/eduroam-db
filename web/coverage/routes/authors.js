const fs = require('fs')
// --------------------------------------------------------------------------------------
var exp = {}
// --------------------------------------------------------------------------------------
// get last edit author
// --------------------------------------------------------------------------------------
exp.get_last_edit_author = function(instid)
{
  if(fs.existsSync('./last_edit/' + instid))
    return fs.readFileSync('./last_edit/' + instid, 'utf-8', function(err, data) {
      return data;
    });

  return "Data byla importována do aplikace";
}
// --------------------------------------------------------------------------------------
// set last editor author
// --------------------------------------------------------------------------------------
exp.set_last_editor_author = function(instid, user)
{
  if(user)
    fs.writeFileSync('./last_edit/' + instid, user);
}
// --------------------------------------------------------------------------------------
module.exports = exp;
