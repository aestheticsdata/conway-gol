const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res, _next) => {
  try {
    let { name } = req.params;
    let file;

    if (name.includes('-custom')) {
      file = await fs.readFile(path.resolve(__dirname+`/../../species/user-custom/${name.split('-custom')[0]}.hxf`), 'utf-8');
    } else {
      file = await fs.readFile(path.resolve(__dirname+`/../../species/${name}.hxf`), 'utf-8');
    }

    res.json(file);
  } catch (err) {
    console.log(err);
  }
}
