const TagSet = require('../class/tag-set');
const DIR = require('../dir/dir-tools');
const SYNC = require('../sync/sync-tools');
const PATH = require('path');

async function handleMatchedUnsynced(params, unsynced, callbacks){
	let s3 = params.s3;
    let bucket = params.bucket;
    let prefix = params.prefix;
	let root = params.root;
	let rootId = params.rootId;

	for (let i = 0; i < unsynced.length; i++){

		//Callback params
		let callbackParams = {
			bucket: bucket,
			root: root,
			prefix: prefix,
			key: unsynced[i].object.Key,
			name: PATH.basename(unsynced[i].file)
		}

		try {

			//Get tags for any possibly out-of-sync objects
            let filePath = PATH.join(unsynced[i].file);
			let key = SYNC.makeKey(prefix, root, filePath);
			let mdate = unsynced[i].object.LastModified;
			let localIsCurrent = await SYNC.isLocalCurrent(filePath, mdate);
			let md5 = await md5File(filePath);
			let tags = new TagSet(s3, bucket, key, rootId);
			await tags.fetch();


			//Compare md5 to most recent tag md5
			//If there is a match, this file IS synced, but is probably larger than 5mb
			if (!tags.isMD5Match(md5)){

				//In either case, we want to know that this device was synced
				tags.updateDeviceHistory();

				if (localIsCurrent){

					//If uploading, add the newest md5 to the history stack
					tags.addToMD5History(md5);

					callbackParams.type =  SYNC.SyncTypes.UPLOAD;
					if (callbacks.onBefore(callbackParams)){
						await SYNC.syncUp(s3, bucket, key, tags);
						callbacks.onComplete(callbackParams);
					}
						
				} else {
					
					let params = { Bucket: bucket, Key: key }

					callbackParams.type =  SYNC.SyncTypes.DOWNLOAD;
					if (callbacks.onBefore(callbackParams)){
						//Build the path if it doesn't exist, then download the file
						//Upload a new set of tags so we know the object was synced here
						await DIR.buildPath(root, PATH.relative(root, filePath));
						await SYNC.download(s3, params, PATH.join(root, filePath));
						await SYNC.uploadTags(s3, bucket, key, tags); 

						callbacks.onComplete(callbackParams);
					}

				}

			}

		} catch (err) {
			callbacks.onError(err, callbackParams);
		}

	}

}

module.exports = handleMatchedUnsynced;