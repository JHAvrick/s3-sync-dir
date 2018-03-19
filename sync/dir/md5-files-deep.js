const path = require('path');
const listFilesDeep = require('./list-files-deep');
const md5File = require('md5-file/promise');

/**
 * Get md5 for all the files in a given dir.
 * 
 * @async
 * @param {string} dir - The top-level directory to begin scan.
 * @return {Promise<array>} Array of objects, each with file path and md5.
 */
async function md5FilesDeep(dir){

	//Get list of all files
	var files = await listFilesDeep(dir);

	var md5Files = [];
	for (let i = 0; i < files.length; i++){

		try {

			md5Files.push({
				path: files[i],
				md5: await md5File(path.join(files[i]))
			})

		} catch (err){

			console.log(err);

		}

	}

	return md5Files;
}

module.exports = md5FilesDeep;