const fs = require("fs");
const path = require("path");
const listDirs = require('./list-dirs');

/**
 * Returns a flattened version of the full directory with absolute paths to 
 * each node in the tree.
 *
 * @async
 * @param {string} dir - The top-level directory to begin scan.
 * @return {Promise<array>} Flattened list of directory paths.
 */
async function listTreeDeep(dir, ignoreList = []){

		async function flatten(dir, tree){
			tree.push(dir);

			let nextLevel = await listDirs(dir);
			for (let i = 0; i < nextLevel.length; i++){
				await flatten(nextLevel[i], tree);
			}

		}

		let topLevel = await listDirs(dir);
		let tree = [];
		for (let i = 0; i < topLevel.length; i++){
			await flatten(topLevel[i], tree);
		}

		return tree.concat(dir).filter((dirs) => {
			for (let i = 0; i < ignoreList.length; i++){
				let regEx = ignoreList[i];
				let dirname = path.basename(dirs);

				if (regEx.test(dirname))
					return false;
			}
			return true;
		});
}

module.exports = listTreeDeep;