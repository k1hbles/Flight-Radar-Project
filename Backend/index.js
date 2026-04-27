const express = require('express');
const cors = require('cors');
const axios = require('axios')

require('dotenv').config();

const app = express();
app.use(cors());



// app.get('/api/flights', async function (req, res) {
//     const response = await axios.get("https://fr24api.flightradar24.com/api/live/flight-positions/full", {
//         params:req.query,
//         headers: {
//             'Authorization': "Bearer " + process.env.FR24_API_KEY,
//             'Accept-Version': 'v1'
//         }
//     })
//     res.json(response.data)
// })

app.get('/opensky/api/state/all', async function (req, res) {
    const response = await axios.get("https://opensky-network.org/api/states/all", {
        params:req.query,
        auth: {
            username: "suprhyprtestr-api-client",
            password: "GHrCh8yhEH48CWJixEQN67RNGEqkSH5",
        }
    })
    res.json(response.data)
})

app.get('/opensky/api/state/switzerland', async function(req, res){
    const response = await axios.get("https://opensky-network.org/api/states/all", {
        params: {
        lamin: "45.8389",
        lomin: "5.9962",
        lamax: "47.8229",
        lomax: "10.5226",
        }
    });
    res.json(response.data);
})
app.listen(8000, function () {
    console.log("Server has started")
})

