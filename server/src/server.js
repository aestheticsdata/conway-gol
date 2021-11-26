const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');


app.use(cors());

// Content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Content-type: application/json
app.use(express.json());

app.use('/list', require('./routes/api/list'));
app.use('/critter', require('./routes/api/critter'));
app.use('/usercustom', require('./routes/api/usercustom'));

const port = process.env.PORT || 5030;

app.listen(port, () => console.log(`Server started on port ${port}`));
