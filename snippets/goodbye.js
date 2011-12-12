exports.process = function(context, $, elem) {
	console.log('In goodbye.process...');
	console.log('elem content: ' + $(elem).html());
	$(elem).text("Goodbye Snippet!");
	console.log('new content: ' + $(elem).html());
};