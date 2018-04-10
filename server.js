const fs = require('fs');
const express = require('express'); // npm install express
let bodyParser = require('body-parser'); //this helps understand object thru jason from the front end. this is how to install it: npm install body-parser
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http); //npm install socket.io --save
let mongoose = require('mongoose'); //npm install -S mongoose

//express routes
app.use('/client', express.static('client'));
app.use('/js', express.static('client/js'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))
http.listen(8080);

console.log("server is running");

// this is a listener when someone ask for submitNote
app.post('/submitNote', function (req, result) {
    //console.log('something was submitted');
    console.log(req.body); //this consolelogs whatever we receive for submitNote
    io.emit('important', req.body);
    result.send(200);
});