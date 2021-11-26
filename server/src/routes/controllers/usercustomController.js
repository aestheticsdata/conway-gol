const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res, _next) => {
  try {
    const { filename } = req.params;
    await fs.writeFile(path.resolve(__dirname+'/../../species/user-custom/'+filename+'.hxf'), JSON.stringify(req.body));
    res.status(200).json({ msg: `${filename} saved`});
  } catch (err) {
    console.log(err);
  }
}
