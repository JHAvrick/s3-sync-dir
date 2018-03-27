const TagSet = require('../class/tag-set');
const md5File = require('md5-file/promise');
const DIR = require('../dir/dir-tools');
const SYNC = require('../sync/sync-tools');
const PATH = require('path');

/*
 * Should be called when a match is found between a file and object, but the 
 * object's current state is "deleted". This method determines whether to apply
 * the object's state to the file or the file's state to the object (thereby 
 * undeleting it).
 *
 * This method is imprecise, as there are unknown variables which could cause a
 * file to be removed or created when it should not have been. As such, this method
 * leans toward NOT deleting a file unless it's sure that is the appropriate action.
 */ 
async function handleMatchedDeleted(params, matchedDeleted, callbacks){
	let s3 = params.s3;
    let bucket = params.bucket;
    let prefix = params.prefix;
	let root = params.root;
	let rootId = params.rootId;

	for (let i = 0; i < matchedDeleted.length; i++){

		//Callback params
		let callbackParams = {
			bucket: bucket,
			root: root,
			prefix: prefix,
			key: matchedDeleted[i].object.Key,
			name: PATH.basename(matchedDeleted[i].file)
		}

		try {

			//Parse some data about file/object
			let filePath = matchedDeleted[i].file;
			let key = SYNC.makeKey(prefix, root, matchedDeleted[i].file);
			let mdate = matchedDeleted[i].object.LastModified;

			//Some async operations to get more data
			let fileMD5 = await md5File(filePath);
			let localIsCurrent = await SYNC.isLocalCurrent(filePath, mdate);
			let tags = new TagSet(s3, bucket, key, rootId);
			await tags.fetch();

			/*
			 * Three conditions under which a file is considered to be more recent than
			 * it's matching object's deletion.
			 * 1 - The modified date of the file is more recent than the date of deletion
			 * 2 - The deletion state has already been synced to this device, implying that
			 *			the file was deleted, synced, and then restored
			 * 3 - The file's contents (MD5) match no previous versions of the file, implying
			 *			the file is possibly unrelated to the original file (same key, different file)
			 */ 
			if (localIsCurrent || tags.includesThisDevice() || !tags.includesMD5(fileMD5)) {

				callbackParams.type =  SYNC.SyncTypes.UPLOAD;
				if (callbacks.onBefore(callbackParams)){
					await SYNC.initUploadFile(s3, bucket, key, rootId, filePath);
					callbacks.onComplete(callbackParams);
				}
                
			//If none of these conditions are matched, it is assumed safe to delete the local file
			} else {

				//Update tags so we know this file's deletion state has been synced
				//to this device next time (thereby possibly meeting condition 2 above)
				tags.addToMD5History(fileMD5);
				tags.updateDeviceHistory();

				callbackParams.type =  SYNC.SyncTypes.DELETE_FILE;
				if (callbacks.onBefore(callbackParams)){
					await SYNC.uploadTags(s3, bucket, key, tags);
					await DIR.deleteFile(filePath);
					callbacks.onComplete(callbackParams);
				}

			}

		} catch (err) {
			callbacks.onError(err, callbackParams);
		}

	}

}

module.exports = handleMatchedDeleted;