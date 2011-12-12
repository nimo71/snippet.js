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
			console.log('checkHtmlExists()');
			var filepath = './html' + req.url;
		    if (filepath == './') filepath = './html/index.htm';
		
		    var extname = path.extname(filepath);
		    console.log('extname = ' + extname);
			if (extname != '.html') throw 500;
			//TODO: throw objects
			
		    console.log('serving: ' + filepath);
		    path.exists(filepath, function(exists) {	//TODO: do this without callback     
		        if (!exists) throw 404;
		    });
		    return filepath;
		},
		function loadHtml(err, filepath) {
			console.log('loading html, filepath: ' + filepath);
			if (err) throw err;
			fs.readFile(filepath, this);
		},
		function processSnippets(err, content) {
			console.log('processing snippets...');
			if (err) throw err;
            var document = jsdom.jsdom(content);
            var window = document.createWindow();
            Step(
            	function () {
            		jsdom.jQueryify(window, this);
            	},
            	function (err) {
	            	window.$('p[id|="snippet"]').each(function(index, elem) {
	            		
            			var sname = window.$(elem).attr('id').split('-')[1];
            			console.log('loading snippet: ' + sname);
		            	
            			// find the snippet in the path and process
            			_(context.path).each(function (dir) {
            				var snippetPath = dir + context.separator + sname +'.js';
            				console.log('looking for snippet: ' + snippetPath);
		 					
            				path.exists(snippetPath, function(exists) {
            					if (!exists) throw 500;
            				});
            				
        					var snippet = require(snippetPath);
        					snippet.process(context, window.$, elem);
        					console.log('processed snippet: ' + sname);
        					console.log('elem content: ' + window.$(elem).html());
        					// TODO: schedule snippet processing using step... how to queue?
            			});
            		});// each	
	            	return window.$('html').html();
	            },
	            function sendResponse(err, html) {
	    			console.log('sending response: ' + html);
	    			if (err) {
	    				res.writeHead(err);
	    	            res.end();
	    	            return;
	    			}
	    	        res.writeHead(200, {'Content-Type': 'text/html'}); 
	    			res.end("<!DOCTYPE html>\n" + html);
	    			// TODO: read doctype from the html file 
	    		}
            );	        
		}
	);
};