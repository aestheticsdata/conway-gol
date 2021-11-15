const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res, _next) => {
  try {
    console.log('name', req.params.name)
    const file = await fs.readFile(path.resolve(__dirname+`/../../species/${req.params.name}.hxf`), 'utf-8');
    res.json(file);
  } catch (err) {
    console.log(err);
  }
}
