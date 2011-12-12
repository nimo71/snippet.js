var http = require('http');
var snippet = require('./snippet.js');

http.createServer(function(req, res) {
	try {
		console.log('received request');
		
		snippet.processRequest(req, res);
		
		console.log('completed request');
	}
	catch (err) {
		console.log('internal server error: ' + err);
		res.writeHead(500);
        res.end();
	}
}).listen(8080, "127.0.0.1");

console.log('Node server running snippet at http://127.0.0.1:8080/');