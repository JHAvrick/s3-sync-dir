const PATH = require('path');
const md5File = require('md5-file/promise');
const softDeleteConfig = require('../sync/soft-delete-config');
const dirObjectConfig = require('../sync/dir-object-config');
const isLocalCurrent = require('../sync/is-local-current');
const SyncObjects = require('../class/sync-objects');

const fileSort = require('./file-sort');

/**
 * Sorting function to find mismatches between a directory and S3 bucket.
 * This method does most of the heavy computational lifting and may take a fair
 * bit of time depending on the complexity of the target directory.
 * 
 * @async
 * @param {string} params - Param object
 * @param {string} files - A flat list of paths to each file in the directory (use listFilesDeep())
 * @param {string} objects - Object list return from S3 listObjects()
 * @return {object} - object with three arrays representing the sorted files/objects
 */
async function sortMatches(params, tree, files, objects){
    
    let sortedFiles = await fileSort(params, files, objects);
    let sortedTree = await treeSort(params, tree, sortedFiles.unmatchedObjects);

    /*
     * After our initial sort we have the following:
     * 
     *  Unmatched Files - File with no matching object key
     *  Unmatched Dir - Dir with no matching object key
     *  Matched Unsynced - Files w/ matching object but non-matching MD5
     *  Matched Deleted File - File w/ matching object, but object has been soft-deleted
     *  Matched Deleted Dir - Dir w/ matching object, but object has been soft-deleted
     *  Unmatched Objects - Directories OR files with no matching key
     * 
     */ 

    let sortedUnmatchedFiles = await sortUnmatchedFiles(params, sortedFiles.unmatchedFiles);
    let 



}


async function treeSort(params, tree, objects){

	let root = params.root;
	let prefix = params.prefix;

    let unmatchedDir = [];
    let unmatchedObjects = [];
    let matchedDeletedDir = [];

    for (let i = 0; i < tree.length; i++){
        if (tree[i] === root) continue;

		let dirUnmatched = true; //File matched flag
		let dirKey = keyFromPath(root, tree[i], prefix);

        for (let o = 0; o < objects.length; o++){
            if (dirKey === objects[o].Key){
                dirUnmatched = false;

                //This is the only condition in which a matched directoy needs
                //further investigation
                let ETag = objects[o].ETag.replace(/(['"])/g, '');
                if (ETag === dirObjectConfig.deletedMd5){
                    matchedDeletedDir.push({
                        key: dirKey,
                        S3Object: objects[o]
                    })
                } 

				objects.splice(o, 1);
				break;
            }
        }

        if (dirUnmatched){
            unmatchedDir.push({
                key: dirKey
            });
        }

    }

	//Any remaining objects are either unmatched files or unmatched directories
	objects.forEach((unmatched) => {
        unmatchedObjects.push({
            key: unmatched.Key,
            S3Object: unmatched
        })
    });

    return {
        unmatchedLocal: unmatchedLocal,
        unmatchedObjects: unmatchedObjects,
        matchedDeleted: matchedDeleted
    }

}


//Determine the file's S3 key
function keyFromPath(root, filepath, prefix){
	let splitPath = PATH.relative(root, filepath).split(PATH.sep);
		splitPath.unshift(prefix);

	return splitPath.join('/');
}

module.exports = sortMatches;
