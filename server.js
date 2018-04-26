const fs = require('fs');
const express = require('express');// npm install express
var bodyParser = require('body-parser');//this helps understand object thru jason from the front end. this is how to install it: npm install body-parser
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);//npm install socket.io --save

// MongoDB Stuff
var mongoose = require('mongoose');
var url = 'mongodb://user:user@ds147118.mlab.com:47118/to-do-list';

mongoose.connect(url, function(error) {
    if (error){
        console.log("Sorry something happened: " + error);
    } else {
        console.log("Connected to MongoDB database.")
    }
});

//Schema is a new MODEL that holds the mongoose database
var Schema = mongoose.model('Notes', {
    notes: String
});

// Express 'Routes'
app.use('/', express.static('client/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
http.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started");
});
// Server Config End

// current List of Notes
var noteArray = [];
var deletedArray = [];
var updatedArray = [];
var createdArray = [];

function syncDatabase() {
    
    // Go through each item in deletedArray, and delete from MongoDB.
    if (deletedArray.length > 0) {
        
        for (var i = 0; i < deletedArray.length; i++) {
            Schema.findByIdAndRemove(deletedArray[i]._id, function (error, todo) {
                if (error) {
                    console.log("Sorry, we couldn't find anything or there was a problem. " + error);
                } else {
                    console.log("Deleted Note");
                }
            });
            
        }
        
        deletedArray = [];
    }
    
    // If noteArray is empty, ask MongoDB for the all Notes and load them into noteArray.
    if (noteArray.length == 0) {
        
        Schema.find({}, function (error, notes) {
            if (error) {
                console.log("Sorry we had issues searching the database: " + error)
            } else {
                noteArray = notes;
            }
        });
        
    }
    
    if (updatedArray.length > 0) {
        
        for (var i = 0; i < updatedArray.length; i++) {
            
            var content = {
                notes: updatedArray[i].notes
            }
            
            Schema.findByIdAndUpdate(updatedArray[i]._id, content, {new: true}, function (error) {
                if (error) {
                    console.log("Sorry, we couldn't find anything or there was a problem. " + error);
                } else {
                    console.log("Updated Note");
                }
            });
            
        }
        
        updatedArray = [];
    }
    
    

}

syncDatabase();
    
app.get('/getNotes', function (request, result) {
    // Provide all notes to the HTML display.
    var allArray = noteArray.concat(updatedArray, createdArray);
    result.send(allArray);
    result.send(200);
});

app.post('/updateNote', function (request, result) {
    
    // Arrays out of bound
    var index = noteArray.findIndex(function(note) {
        return note._id == request.body._id;
    });
    
    noteArray[index].notes = request.body.notes;
    updatedArray.push(noteArray[index]);
    noteArray.splice(index, 1);
    result.send(200);

    // var noteToUpdate = {
    //     notes: request.body.notes
    // }
    // Schema.findByIdAndUpdate(request.body._id, noteToUpdate, {new: true}, function (error, todo) {
    //     if (error) {
    //         console.log("Sorry, we couldn't find anything or there was a problem. " + error);
    //     } else {
    //         console.log("Document updated.");
    //         result.send(200);
    //     }
    //     console.log("Find function ran.")
    // });
});

app.post('/deleteNote', function (request, result) {
    
    var index = noteArray.findIndex(function(note) {
        return note._id == request.body._id;
    });
    
    deletedArray.push(noteArray[index]);
    noteArray.splice(index, 1);
    result.send(200);
});

app.post('/submitNote', function (request, result) {
    console.log(request.body);
    
    var newNote = Schema(request.body);
    newNote.save(function (error) {
    if (error) {
        console.log("Sorry the document was not saved: " + error);
    } else {
        console.log("Document was saved!");
        
        Schema.find({}, function (error, notes) {
            if (error) {
                console.log("Sorry we had issues searching the database: " + error)
            } else {
                io.emit('important', notes);
            }
        });
    }
});
    
    result.send(200);
});