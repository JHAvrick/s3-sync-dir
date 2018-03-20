const fs = require("fs");

//Promise wrapper for fs.readdir
function readdir(dir){
	return new Promise((resolve, reject) => {
		fs.readdir(dir, (err, files) => {
			if (err) reject(err);
			else resolve(files);
		});
	})
}

module.exports = readdir;