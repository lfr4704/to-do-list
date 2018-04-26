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
app.use('/', express.static('client/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}))
http.listen(8080);
console.log("server is running");
//this is a nother way to do the http.listen() without assigning a local host number.
//if you do this make sure you remove all 8080 references
// http.listen(process.env.PORT, process.env.IP, function(){
//     console.log("Server has started.");
// });

let noteArray = [];
let deletedArray = [];
let updatedArray = [];
let createdArray = [];

function syncDatabase() {
    //go through each item in deletedArray, and delete from MongoDB/database
    if(deletedArray.length > 0){
        for (let i =0; i < deletedArray.length; i++){
            Schema.findByIdAndRemove(deletedArray[i], function (error, todo){
            if (error) {
                console.log("sorry we could not find or there was a problem")
            } else {
                console.log("Document delete.")
            }
            });    
        }
        deletedArray = [];
    }
    //if noteArray is empty, ask MongoDB for the all Notes and load them into noteArray.
    if (noteArray.length ==0){
        
           Schema.find({}, function (error, notes) {
            if (error) {
                console.log("Sorry we had issues searching the database: " + error)
            } else {
                noteArray = notes;
                console.log(noteArray + ", Is Array?" + Array.isArray(noteArray));
            }
        }); 
    }
    

}

syncDatabase();

//this is getting the information from server once you reload the page
app.get('/getNotes', function(req, result) {
    result.send(noteArray);
    result.send(200);//this is to confirm with brower that server is running okay
});


app.post('/updateNote', function(req, result) {
    
    let index = noteArray.findIndex(function(note){
        return note._id == req.body._id;
    });
    
    noteArray[index].notes = req.body.notes;
    updatedArray.push(noteArray[index]);
    noteArray.splice(index, 1)
    result.send(200);
    
    //  let noteToUpdate = {
    //     notes: req.body.notes
    
    // Schema.findByIdAndUpdate(req.body._id, noteToUpdate, {new: true}, function(error, todo){
    //     if (error) {
    //         console.log("sorry we could not find or there was a problem")
    //     } else {
    //         console.log("Document updated")
    //         result.send(200);
    //     }
    //     console.log("Find function ran.");
    // });
});

//to delete notes

app.post('/deleteNote', function(req, result) {
  
    var index = noteArray.findIndex(function(note) {
        return note._id == req.body._id;
    });
    
    deletedArray.push(noteArray[index]);
    noteArray.splice(index, 1);
    result.send(200);
    
    
    // Schema.findByIdAndRemove(noteId, function (error, todo){
    //     if (error) {
    //         console.log("sorry we could not find or there was a problem")
    //     } else {
    //         console.log("Document delete.")
    //         result.send(200);
    //     }
    // });
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