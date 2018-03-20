const fs = require("fs");
const path = require("path");
const listTreeDeep = require('./list-tree-deep');
const listFiles = require('./list-files');

/**
 * Returns a flattened list of every path to every FILE in a given directory.
 * Ignores directories. 
 *
 * @async
 * @param {string} dir - The top-level directory to begin scan.
 * @return {Promise<array>} Flattened list of directory paths.
 */
async function listFilesDeep(dir){

		var tree = await listTreeDeep(dir); //Get full dir tree
		var files = [];

		for (var i = 0; i < tree.length; i++){
			files = files.concat(await listFiles(tree[i]));
		}
		
		return files;
}

module.exports = listFilesDeep;