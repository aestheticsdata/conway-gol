module.exports = async (req, res, _next) => {
  try {
    console.log('name', req.body.name)
    res.json();
  } catch (err) {
    console.log(err);
  }
}
