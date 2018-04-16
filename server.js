const fs = require('fs');
const express = require('express'); // npm install express
let bodyParser = require('body-parser'); //this helps understand object thru jason from the front end. this is how to install it: npm install body-parser
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http); //npm install socket.io --save

//this is to update function



//start of mongoDB, mongoose and mlab section
let mongoose = require('mongoose'); //npm install -S mongoose
let url = 'mongodb://user:user@ds147118.mlab.com:47118/to-do-list'

mongoose.connect(url, function(error) {
    if (error) {
        console.log("Sorry Something Happened" + error);
    } else {
        console.log("Connected to MongoDB database.");
    }
});
//Schema is a new MODEL that holds the mongoose database
let Schema = mongoose.model('Notes', {
    notes: String
});

//end of mongo section 

//express routes
app.use('/client', express.static('client'));
app.use('/js', express.static('client/js'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))
http.listen(8080);
console.log("server is running");
//this is a nother way to do the http.listen() without assigning a local host number.
//if you do this make sure you remove all 8080 references
// http.listen(process.env.PORT, process.env.IP, function(){
//     console.log("Server has started.");
// });

//this is getting the information from server once you reload the page
app.get('/getNotes', function(req, result) {
    console.log("Data requested and sent");
    Schema.find({}, function (error, notes) {
            if(error) {
                console.log("Sorry we had issues searching the database")
            } else {
                result.send(notes);
            }
        });
});

app.post('/updateNote', function(req, result) {
    console.log("Received an update request");
  
    let noteToUpdate = {
        notes: req.body.notes
    }
    Schema.findByIdAndUpdate(req.body._id, noteToUpdate, {new: true}, function(error, todo){
        if (error) {
            console.log("sorry we could not find or there was a problem")
        } else {
            console.log("Document updated")
            result.send(200);
        }
    });
})

//to delete notes

app.post('/deleteNote', function(req, result) {
    let noteId = req.body._id;
    let objectToDelete = req.body._id;


    objectToDelete = {
        _id: { $oid: objectToDelete}
    };
    
    console.log(objectToDelete);
    Schema.findByIdAndRemove(noteId, function (error, todo){
        if (error) {
            console.log("sorry we could not find or there was a problem")
        } else {
            console.log("Document delete.")
            result.send(200);
        }
    });
});    

// this is a listener when someone ask for submitNote
app.post('/submitNote', function (req, result) {
    //console.log('something was submitted');
    console.log(req.body); //this consolelogs whatever we receive for submitNote
    
    let newNote = new Schema(req.body);
    newNote.save(function(error){
    if(error) {
        console.log("sorry, the document was not saved:" + error);
    } else {
        console.log("Document was saved");
    
        Schema.find({}, function (error, notes) {
            if(error) {
                console.log("Sorry we had issues searching the database")
            } else {
                io.emit('important', notes);
            }
        });
    }
});

    result.send(200);
});