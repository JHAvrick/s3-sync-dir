const TagSet = require('../class/tag-set');
const DIR = require('../dir/dir-tools');
const SYNC = require('../sync/sync-tools');
const PATH = require('path');

async function handleUnmatchedObjects(params, objects, callbacks){
	let s3 = params.s3;
    let bucket = params.bucket;
    let prefix = params.prefix;
	let root = params.root;
	let rootId = params.rootId;

	for (let i = 0; i < objects.length; i++){
		
		//Callback params
		let splitKey = objects[i].Key.split('/') //Split key to get last element as the name
		let callbackParams = {
			bucket: bucket,
			root: root,
			prefix: prefix,
			key: objects[i].Key,
			name: splitKey[splitKey.length - 1]
		}

		//Fetch tags for the unmatched object
		let tags = new TagSet(s3, bucket, objects[i].Key, rootId);
		try {
			await tags.fetch();
		} catch (err) {
			console.log(err); continue;
		}

		/*
		 * If the object has already been marked as deleted, make sure the tags note
		 * this device. No other action is needed.
		 */
		if (objects[i].ETag.replace(/(['"])/g, '') === SYNC.softDeleteConfig.md5){
			if (!tags.includesThisDevice()){
				await SYNC.uploadTags(s3, bucket, objects[i].Key, tags);
			}
			continue;
		}

		/*
		 * If the tags include this device, we assume the file was present but has
		 * since been deleted. That state is applied to the object via "soft delete".
		 */ 
		if (tags.includesThisDevice()){
			try { 
				
				callbackParams.type =  SYNC.SyncTypes.DELETE_OBJECT;
				if (callbacks.onBefore(callbackParams)){
					await SYNC.softDeleteObject(s3, bucket, objects[i].Key, tags);
					callbacks.onComplete(callbackParams);
				}
				
			} catch (err){
				callbacks.onError(err, callbackParams);
			}

		/*
		 * If the tags DO NOT include this device, we assume the file was recently 
		 * created or has never been synced to this device and perform a first-time
		 * download. The tags are then updated to reflect the fact that this device
		 * was synced for this file. If the file is later removed from this device,
		 * we will assume it was deleted.
		 */ 
		} else {
			try {

				
				let params = { Bucket: bucket, Key: objects[i].Key }
				let filePath = SYNC.keyToPath(objects[i].Key);
				tags.updateDeviceHistory();

				callbackParams.type =  SYNC.SyncTypes.DOWNLOAD;
				if (callbacks.onBefore(callbackParams)){
					//Build the path if it doesn't exist, then download the file
					//Upload a new set of tags so we know the object was synced here
					await DIR.buildPath(root, filePath);
					await SYNC.download(s3, params, PATH.join(root, filePath));
					await SYNC.uploadTags(s3, bucket, objects[i].Key, tags);

					callbacks.onComplete(callbackParams);
				}

			} catch (err) {
				callbacks.onError(err, callbackParams);
			}
		}
		

	}

	return true;
}

module.exports = handleUnmatchedObjects;