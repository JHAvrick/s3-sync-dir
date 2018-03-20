const TagSet = require('../class/tag-set');
const DIR = require('../dir/dir-tools');
const SYNC = require('../sync/sync-tools');
const PATH = require('path');

async function handleUnmatchedObjects(params, objects){
	let s3 = params.s3;
    let bucket = params.bucket;
    let prefix = params.prefix;
	let root = params.root;
	let rootId = params.rootId;

	for (let i = 0; i < objects.length; i++){
		
		let tags = new TagSet(s3, bucket, objects[i].Key, rootId);
		await tags.fetch();

		/*
		 * If the object has already been marked as deleted, make sure the tags note
		 * this device. No other action is needed.
		 */
		if (objects[i].ETag.replace(/(['"])/g, '') === SYNC.softDeleteConfig.md5){
			if (!tags.includesThisDevice()){
				console.log("Updating sync status for object: " + objects[i].Key)
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
				console.log("File was deleted: updating object...");
				await SYNC.softDeleteObject(s3, bucket, objects[i].Key, tags);
			} catch (err){
				console.log(err); 
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

				console.log("File was created or restored on another device: downloading file...");
				let params = { Bucket: bucket, Key: objects[i].Key }
				let filePath = SYNC.keyToPath(objects[i].Key);
				tags.updateDeviceHistory();

				//Build the path if it doesn't exist, then download the file
				//Upload a new set of tags so we know the object was synced here
				await DIR.buildPath(root, filePath);
				await SYNC.download(s3, params, PATH.join(root, filePath));
				await SYNC.uploadTags(s3, bucket, objects[i].Key, tags);

			} catch (err) {
				console.log(err);
			}
		}
		

	}

	return true;
}

module.exports = handleUnmatchedObjects;