const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res, _next) => {
  try {
    const files = await fs.readdir(path.resolve(__dirname+'/../../species/'));
    res.json(files);
  } catch (err) {
    console.log(err);
  }
}
