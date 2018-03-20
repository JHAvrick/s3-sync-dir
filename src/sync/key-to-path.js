const PATH = require('path');

function keyToPath(key){
	let splitKey = key.split("/");
		splitKey.shift();

	return PATH.join(...splitKey);
}

module.exports = keyToPath;