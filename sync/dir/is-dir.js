const fs = require("fs");

/**
 * Determines whether there is a directory at a given path.
 *
 * @async
 * @param {string} dir - The top-level directory to begin scan.
 * @return {Promise<boolean>} True if given path is a directory
 */
function isDir(filepath){
	return new Promise((resolve, reject) => {
		fs.lstat(filepath, (err, stats) => {
			if (err) reject(err);
			resolve(stats.isDirectory());
		});
	});
}

module.exports = isDir;