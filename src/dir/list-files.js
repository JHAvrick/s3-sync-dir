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
async function listFiles(dir, ignoreList = []){
	try {
		let fileList = [];
		let files = (await readdir(dir)).filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

		for (let i = 0; i < files.length; i++){
			let filepath = path.join(dir, files[i]);

			//If the file is a directory, ignore it
			if (!(await isDir(filepath))){

				//Test against ignore list, if any matches are found the file is ignored
				for (let i = 0; i < ignoreList.length; i++){
					let regEx = ignoreList[i];
					let filename = path.basename(filepath);
	
					if (regEx.test(filename))
						continue;
				}
			
				fileList.push(filepath);
			}
				
		}

		return fileList;

	} catch (err){
		console.log(err);
	}
}

module.exports = listFiles;