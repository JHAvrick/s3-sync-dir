const fs = require("fs");
const path = require("path");
const isDir = require("./is-dir");
const readdir = require("./readdir");

/**
 * Shallow list of paths to each directory contained at the given location.
 * 
 * @async
 * @param {string} dir - The top-level directory to begin scan.
 * @return {Promise<array>} List of directory paths.
 */
async function listDirs(dir){
	try {
		let dirList = [];
		let files = await readdir(dir);

		for (let i = 0; i < files.length; i++){
			let filepath = path.join(dir, files[i]);
			if (await isDir(filepath))
				dirList.push(filepath)
		}

		return dirList;

	} catch (err){
		console.log(err);
	}
}

module.exports = listDirs;