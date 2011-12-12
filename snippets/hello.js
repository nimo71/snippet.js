exports.process = function(context, $, elem) {
	console.log('In hello.process...');
	$(elem).html("Hello Snippet!");
};