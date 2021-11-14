const express = require('express');
const app = express();
const cors = require('cors');


app.use(cors());

// Bodyparser Middleware
app.use(express.json());

app.use('/list', require('./routes/api/list'));
app.use('/critter', require('./routes/api/critter'));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
