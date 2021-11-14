const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res, _next) => {
  try {
    const files = await fs.readdir(path.resolve(__dirname+'/../../species/'));
    const names = files.map(filename => filename.split('.')[0]);
    res.json(names);
  } catch (err) {
    console.log(err);
  }
}
