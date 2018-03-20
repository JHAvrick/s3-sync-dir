const fs = require("fs");
const path = require("path");
const listTreeDeep = require('./list-tree-deep');
const listFiles = require('./list-files');

/**
 * Returns a flattened list of every path to every FILE AND DIR in a given directory.
 *
 * @async
 * @param {string} dir - The top-level directory to begin scan.
 * @return {Promise<array>} Flattened list of directory paths.
 */
async function listAllDeep(dir){

		var tree = [];
				tree.push(dir); //include top-level dir
				tree = tree.concat(await listTreeDeep(dir));

		var files = [];

		for (var i = 0; i < tree.length; i++){
			files = files.concat(await listFiles(tree[i]));
		}

		return tree.concat(files);
}

module.exports = listAllDeep;