var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var _ = require('underscore');
var context = require('./context.js');
var Step = require('step');

exports.processRequest = function (req, res) {
	console.log('snippet.processRequest');
	var html = null;
	Step(
		function checkHtmlExists() {
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
			console.log(err);
			if (err) throw err;
			console.log('loading html, filepath: ' + filepath);
			fs.readFile(filepath, this);
		},
		function processSnippets(err, content) {
			console.log(err);
			if (err) throw err;
			console.log('processing snippets...');
            var document = jsdom.jsdom(content);
            var window = document.createWindow();
            console.log('about to step');
            Step(
            	function () {
            		console.log('jQueryfyDom...');
            		jsdom.jQueryify(window, this);
            	},
            	function (err) {
            		// load and process snippets in the order declared in the class attribute 
            		console.log('loadAndProcessSnippets()');
	            	window.$('[class^="snippet-"]').each(function(index, elem) {
	            		
	            		var classList = window.$(elem).attr('class').split(/\s+/);
	            		var snippetList = _(classList).filter(function (className) {
	            			return className.match(/^snippet-.*/);
	            		});
	            		var tagname = elem.nodeName.toLowerCase();
	            		console.log('processing: '+ snippetList +' on element '+ tagname);
	            		
	            		_(snippetList).each(function (snippetName) 
	            		{
	            			var sname = snippetName.split('-')[1];
	            			console.log('loading snippet: ' + sname);
			            	
	            			// find the snippet in the path and process
	            			_(context.path).each(function (dir) {
	            				var snippetPath = dir + context.separator + sname +'.js';
	            				console.log('looking for snippet: ' + snippetPath);
			 					
	            				if (!path.existsSync(snippetPath)) throw 500;
	            				
	            				// TODO: use _.memoize to cache snippets
	        					var snippet = require(snippetPath);
	        					snippet.process(context, window.$, elem);
	        					console.log('processed snippet, content: ' + window.$(elem).html());
	            			});
	            		});
            		});// each
	            	return window.document.innerHTML;
	            }, 
	            function sendResponse(err, html) {
	    			if (err) {
	    				console.log('error: ' + err.message);
	    				res.writeHead(err.code);
	    	            res.end();
	    	            return;
	    			}
	    			console.log('sending response: ' + html);
	    	        res.writeHead(200, {'Content-Type': 'text/html'}); 
	    			res.end(context.doctype + html);
	    		}
	        );
		},
		function sendResponse(err) {
			if (err) {
				console.log('error: ' + err.message);
				res.writeHead(err.code);
	            res.end(err.message);
	            return;
			}
		}
	);
};