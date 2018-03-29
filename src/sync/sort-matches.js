const PATH = require('path');
const md5File = require('md5-file/promise');
const softDeleteConfig = require('./soft-delete-config');
const isLocalCurrent = require('./is-local-current');
const SyncObjects = require('../class/sync-objects');

/**
 * Sorting function to find mismatches between a directory and S3 bucket.
 * 
 * @async
 * @param {string} params - Param object
 * @param {string} files - A flat list of paths to each file in the directory (use listFilesDeep())
 * @param {string} objects - Object list return from S3 listObjects()
 * @return {object} - object with three arrays representing the sorted files/objects
 */
async function sortMatches(params, files, objects){

	let root = params.root;
	let prefix = params.prefix;
	let syncObjects = [];

	//Find unmatched/mismatched files
	for (let f = 0; f < files.length; f++){

		let fileUnmatched = true; //File matched flag
		let fileKey = keyFromPath(root, files[f], prefix);

		for (let o = 0; o < objects.length; o++){

			//KEY COMPARISON
			if (fileKey === objects[o].Key){
				fileUnmatched = false; 

				//-----------------------------------------MD5 COMPARISON -------------------------------------------------

				let md5 = await md5File(PATH.join(files[f])); //MD5 for file
				let ETag = objects[o].ETag.replace(/(['"])/g, ''); //MD5 for object (sanatized for quotation marks)

				//Check if ETag equals special "soft deleted" md5
				if (ETag === softDeleteConfig.md5){

					let obj = new SyncObjects.MatchedDeleted(params, fileKey, objects[o]);
					syncObjects.push(obj);

				} else if (md5 !== ETag){

					let obj = new SyncObjects.MatchedUnsynced(params, fileKey, objects[o]);
					syncObjects.push(obj);

				}

				//---------------------------------------------------------------------------------------------------------	
				
				//Remove this element from objects list as it won't be matched again
				//(and the loop breaks, so removing it won't cause issues)
				objects.splice(o, 1);
				break;

			}

		}

		//No matching object was found
		if (fileUnmatched){
			let obj = new SyncObjects.UnmatchedFile(params, fileKey);
			syncObjects.push(obj);
		}

	}

	//For any remaining objects, create UnmatchedObject
	objects.forEach((unmatched) => {
		let obj = new SyncObjects.UnmatchedObject(params, unmatched.Key, unmatched);
		syncObjects.push(obj);
	});

	return syncObjects;
}

//Determine the file's S3 key
function keyFromPath(root, filepath, prefix){
	let splitPath = PATH.relative(root, filepath).split(PATH.sep);
		splitPath.unshift(prefix);

	return splitPath.join('/');
}

module.exports = sortMatches;
