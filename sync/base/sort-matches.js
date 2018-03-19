const PATH = require('path');
const md5File = require('md5-file/promise');
const softDeleteConfig = require('./soft-delete-config');
const isLocalCurrent = require('./is-local-current');

/**
 * Sorting function to find mismatches between a directory and S3 bucket.
 * 
 * @async
 * @param {string} root - The root directory
 * @param {string} files - A flat list of paths to each file in the directory (use listFilesDeep())
 * @param {string} objects - Object list return from S3 listObjects()
 * @return {object} - object with three arrays representing the sorted files/objects
 */
async function sortMatches(root, files, objects){

	let unmatchedFiles = []; //Files with no matching object
	let unmatchedObjects = []; //Object has no matching key - new or deleted
	let matchedDeleted = []; //Match is found, but object is flagged as deleted
	let matchedUnsynced = []; //Match found, but MD5 is possibly mismatched

	//Find unmatched/mismatched files
	for (let f = 0; f < files.length; f++){

		let fileUnmatched = true; //File matched flag
		let fileKey = PATH.relative(root, files[f]); //Get object/file key

		for (let o = 0; o < objects.length; o++){

			//KEY COMPARISON
			if (compareKeys(fileKey, objects[o].Key)){
				fileUnmatched = false; 

				//-----------------------------------------MD5 COMPARISON -------------------------------------------------

				let md5 = await md5File(PATH.join(files[f])); //MD5 for file
				let ETag = objects[o].ETag.replace(/(['"])/g, ''); //MD5 for object (sanatized for quotation marks)

				//Check if ETag equals special "soft deleted" md5
				if (ETag === softDeleteConfig.md5)
					matchedDeleted.push({ file: files[f], object: objects[o] });
				else if (md5 !== ETag)
					matchedUnsynced.push({ file: files[f], object: objects[o] });

				//---------------------------------------------------------------------------------------------------------	
				
				//Remove this element from objects list as it won't be matched again
				//(and the loop breaks, so removing it won't cause issues)
				objects.splice(o, 1);
				break;

			}

		}

		if (fileUnmatched) unmatchedFiles.push(files[f]);
	}

	unmatchedObjects = objects.slice(0);

	return {
		unmatchedFiles: unmatchedFiles,
		unmatchedObjects: unmatchedObjects,
		matchedDeleted: matchedDeleted,
		matchedUnsynced: matchedUnsynced
	}

}

function compareKeys(filePath, objectKey){
	let fileKey = filePath.replace(/\\/g, "/");
	return fileKey === objectKey;
}

module.exports = sortMatches;
