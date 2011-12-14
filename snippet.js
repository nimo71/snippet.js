var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var _ = require('underscore');
var context = require('./context.js');
var Step = require('step');

exports.processRequest = function (req, res) {
	console.log('snippet.processRequest');
	Step(
		function checkHtmlExists() {
			//TODO: refactor and use _.memoize to cache HTML exists check
			console.log('checkHtmlExists()');
			var filepath = './html' + req.url;
		    if (filepath == './') filepath = './html/index.htm';
		
		    var extname = path.extname(filepath);
			if (extname != '.html') throw { 
				code: 500, 
				message: 'Snippet only processes html' };
			
		    console.log('serving: ' + filepath);
		    if (!path.existsSync(filepath)) {
		    	console.log('Throwing ex');
		    	throw { 
					code: 404, 
					message: 'File not found: '+ filepath };
		    }
		    return filepath;
		},
		function loadHtml(err, filepath) {
			if (err) throw err;
			console.log('loading html, filepath: ' + filepath);
			// TODO: refactor and use _.memoize to cache loading of HTML
			fs.readFile(filepath, this);
		},
		function jQueryfy(err, content) {
			if (err) throw err;
		    var document = jsdom.jsdom(content);
		    jqueryfy(document.createWindow(), this);
		},
		function processSnippets(err, window) {
			console.log('processing snippets...');
			if (err) throw err;
			
    	    var $ = window.$;
			$('[class^="snippet-"]').each(function (index, elem) {	
	    		var classList = $(elem).attr('class').split(/\s+/);
	    		var snippetList = _(classList).filter(function (className) {
	    			return className.match(/^snippet-.*/);
	    		});
	    		var tagname = elem.nodeName.toLowerCase();
	    		console.log('processing: '+ snippetList +' on element '+ tagname);
	    		
	    		_(snippetList).each(function (snippetName) {
	    			var sname = snippetName.split('-')[1];
	    			//TODO: use _.memoize to cache snippet loading?
	    			var snippet = loadSnippet(sname);
	    			snippet.process(context, $, elem);
	    			console.log('processed snippet, content: ' + $(elem).html());
	    		});
	    	});
		    return window.document.innerHTML;
		},
		function sendResponse(err, html) {
			if (err) {
				console.log('error: ' + err);
				res.writeHead(err.code);
	            res.end(err.message);
	            return;
			}
			console.log('sending response: ' + html);
	        res.writeHead(200, {'Content-Type': 'text/html'}); 
			res.end(context.doctype + html);
		}
	);
};

function jqueryfy(window, processSnippets) {
	jsdom.jQueryify(window, function() {
		processSnippets(null, window);
	});
}

function loadSnippet(snippetName) {
	console.log('loading snippet: ' + snippetName);
	
	var snippet = null;
	
	// find the snippet in the path and process
	_(context.path).each(function (dir) {
		var snippetPath = dir + context.separator + snippetName +'.js';
		console.log('looking for snippet: ' + snippetPath);
		
		if (!path.existsSync(snippetPath)) return true;
		snippet = require(snippetPath);
	});
	if (snippet) return snippet;
	throw {
		code : 500, 
		message : 'Snippet '+ snippetName +' not found'
	};
}