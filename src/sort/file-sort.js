const PATH = require('path');
const md5File = require('md5-file/promise');
const softDeleteConfig = require('./soft-delete-config');

async function fileSort(params, files, objects){
	let root = params.root;
	let prefix = params.prefix;
    
    let unmatchedFiles = [];
    let unmatchedObjects = [];
    let matchedDeleted = [];
    let matchedUnsynced = [];

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

                    matchedDeleted.push({
                        key: fileKey,
                        S3Object: objects[o]
                    });

				} else if (md5 !== ETag){

                    matchedUnsynced.push({
                        key: fileKey,
                        S3Object: objects[o]
                    });

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
            unmatchedFiles.push({
                key: fileKey
            });
		}

	}

    //These will be further sorted during tree sort
    unmatchedObjects = objects.splice(0);

    return {
        unmatchedFiles: unmatchedFiles,
        unmatchedObjects: unmatchedObjects,
        matchedDeleted: matchedDeleted,
        matchedUnsynced:  matchedUnsynced
    };
    
}

//Determine the file's S3 key
function keyFromPath(root, filepath, prefix){
	let splitPath = PATH.relative(root, filepath).split(PATH.sep);
		splitPath.unshift(prefix);

	return splitPath.join('/');
}

module.exports = fileSort;