var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
//var port = process.env.PORT || 8110;
var port = 8110;
//var port = 3000;

server.listen(port, function() {
	console.log('Server listening at port %d', port);
});

var lastImage = "123";

/*
// for client side
	socket = io('http://fosse.co', {
		path: '/8100/socket.io'
	});
 */

function Client(socket) {

	//this.socket = socket;
	this.id = socket.id;
	this.name = "none";
	this.isController = false;
	this.command = function() {

	};

// 	this.download = function(socket, url, filename) {
// 		var objectToSend = {};
// 		objectToSend.url = url;
// 		if (typeof(filename) != "undefined") {
// 			objectToSend.filename = filename;
// 		}
// 		socket.broadcast.to(this.id).emit("dl", objectToSend);
// 	};

// 	this.execute = function(socket, filename) {
// 		var objectToSend = {};
// 		objectToSend.filename = filename;
// 		socket.broadcast.to(this.id).emit("ex", objectToSend);
// 	};
	
	this.getImage = function(q) {
		var objectToSend = {};
		objectToSend.q = q;
		io.to(this.id).emit("ss", objectToSend);
	};
	
	this.ping = function() {
		io.to(this.id).emit("ping2");
	}
	
	this.getImage2 = function(x1, y1, x2, y2, q) {
		var objectToSend = {};
		objectToSend.x1 = x1;
		objectToSend.y1 = y1;
		objectToSend.x2 = x2;
		objectToSend.y2 = y2;
		objectToSend.q = q;
		io.to(this.id).emit("ss2", objectToSend);
	};

}




var clients = [];

var controller = null;

function findClientByID(id) {
	var index = -1;
	for (var i = 0; i < clients.length; i++) {
		if (clients[i].id == id) {
			index = i;
			return index;
		}
	}
	return index;
}

function findClientByName(name) {
	var index = -1;
	for (var i = 0; i < clients.length; i++) {
		if (clients[i].name == name) {
			index = i;
			return index;
		}
	}
	return index;
}

	function getImageFromUser(user, quality) {
		var index = findClientByName(user);
		if (index == -1) {return;}
		var client = clients[index];
		
		client.getImage(quality);
	}

	function getImageFromUser2(user, x1, y1, x2, y2, quality) {
		var index = findClientByName(user);
		if (index == -1) {return;}
		var client = clients[index];
		
		client.getImage2(x1, y1, x2, y2, quality);
	}

//var numClients = 0;

io.on('connection', function(socket) {

	//console.log("USER CONNECTED");
	//numClients += 1;

	var client = new Client(socket);
	clients.push(client);

	console.log("number of clients connected: " + clients.length);

	socket.broadcast.emit("registerNames");

	socket.on("registerName", function(data) {
		var index = findClientByID(socket.id);
		clients[index].name = data;
	});


	socket.on("listAll", function() {
		//socket.broadcast.emit("registerNames");
		io.emit("registerNames");

		var names = [];
		for (var i = 0; i < clients.length; i++) {
			var client = clients[i];
			if (client.name != "none") {
				names.push(client.name);
			}
		}

		console.log(names);
		// 		for(var i = 0; i < clients.length; i++) {
		// 			socket.emit.to(clients[i].id
		// 		}
		io.emit("names", names);
		//socket.broadcast.emit("names", names);
	});


	
	
	// after recieving the image, send it to the console
	socket.on("screenshot", function(data) {
		var obj = {};
// 		if((data[50] == lastImage[0]) && (data[61] == lastImage[1]) && (data[102] == lastImage[2])) {
// 			return;
// 		}
// 		lastImage = "";
// 		lastImage = data[50] + data[61] + data[102];
		
		obj.src = data;
		
		var index = findClientByID(socket.id);
		if (index != -1) {
			var client = clients[index];
			obj.name = client.name;
		}
		for(var i = 0; i < clients.length; i++) {
			var c = clients[i];
			if(controller != null && c.id != controller.id) {
				io.to(c.id).emit("viewImage", obj);
			} else if (controller == null) {
				io.emit("viewImage", obj);
			}
		}
		
	});
	
	
	// directed:

// 	socket.on("directedDownload", function(data) {
// 		var index = findClientByName(data.user);
// 		if (index == -1) {
// 			return;
// 		}
// 		var client = clients[index];
// 		client.download(socket, data.url);
// 	});


// 	socket.on("directedExecution", function(data) {
// 		var index = findClientByName(data.user);
// 		if (index == -1) {
// 			return;
// 		}
// 		var client = clients[index];
// 		client.execute(socket, data.filename);
// 	});
	
	socket.on("directedGetImage", function(data) {
		var index = findClientByName(data.user);
		if (index == -1) {return;}
		var client = clients[index];
		
		var quality = parseInt(data.quality);
		quality = (isNaN(quality)) ? 0 : quality;
		//client.getImageOld(socket, quality);
    client.getImage(quality);
	});
	
	
	socket.on("ping2", function() {
		console.log("ping2ed");
	});
	socket.on("pong2", function() {
		console.log("pong2ed");
	});
	socket.on("ping2", function() {
		console.log("ping2ing");
		for(var i = 0; i < clients.length; i++) {
			var client = clients[i];
			client.ping();
		}
	});
	
	socket.on("sendControllerState", function(data) {
		//console.log(data);
		//io.emit("controllerState", data);
		if(controller != null) {
			//if(Math.random() > 0.9) {
				io.to(controller.id).emit("controllerState", data);
			//}
		}
	});
	
	socket.on("directedGetImage", function(data) {
		var index = findClientByName(data.user);
		if (index == -1) {return;}
		var client = clients[index];
		
		var quality = parseInt(data.quality);
		quality = (isNaN(quality)) ? 0 : quality;
		client.getImage(quality);
	});
	
	socket.on("IamController", function() {
		var index = findClientByID(socket.id);
		client = clients[index];
		
		client.isController = true;
		controller = client;
	});
	
	
	 socket.on('disconnect', function() {
		 console.log("disconnected")
		 var i = findClientByID(socket.id)
     clients.splice(i, 1);
   });


});



// 	setInterval(function(){
// 		var user = "Matt";
//     var x1 = 255;
//     var x2 = 1665;
//     var y1 = 70;
//     var y2 = 855;
    
//     var q = parseInt((Math.random()*80));
//     //var quality = 14;
// 		//var quality = parseInt((Math.random()*10));
//     //var quality = parseInt((Math.random()*80));
//     var quality = q;
// 		//getImageFromUser(user, quality);
//     getImageFromUser2(user, x1, y1, x2, y2, quality);
// 	}, 100);



	setInterval(function(){
		var user = "Matt";
//     var x1 = 255;
//     var x2 = 1665;
//     var y1 = 70;
//     var y2 = 855;
    
    var x1 = 255-1920;
    var x2 = 1665-1920;
    var y1 = 70;
    var y2 = 855;
    
    var quality = 13;
    getImageFromUser2(user, x1, y1, x2, y2, quality);
	}, 150);

function getTime(x) {
  return Math.pow(x, (3/2)) + 40;
}



// function autoGetImage() {
//   var user = "Matt";
//   var x1 = 255;
//   var x2 = 1665;
//   var y1 = 70;
//   var y2 = 855;

//   var q = parseInt((Math.random()*50));
//   var quality = q;
//   getImageFromUser2(user, x1, y1, x2, y2, quality);
  
//   setTimeout(autoGetImage, getTime(q));
// }


//autoGetImage();