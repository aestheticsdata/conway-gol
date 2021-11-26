const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res, _next) => {
  try {
    const subdir = req.query['subdir'] ?? '';
    console.log('subdir', subdir);
    const files = await fs.readdir(path.resolve(__dirname+'/../../species/'+subdir));
    const names = files.map(filename => filename.split('.')[0]).filter(filename => filename !== ""); // filter because readdir returns an empty string
    res.json(names);
  } catch (err) {
    console.log(err);
  }
}
