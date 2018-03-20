const TagSet = require('../class/tag-set');
const DIR = require('../dir/dir-tools');
const SYNC = require('../sync/sync-tools');
const PATH = require('path');

async function handleMatchedUnsynced(params, unsynced){
	let s3 = params.s3;
    let bucket = params.bucket;
    let prefix = params.prefix;
	let root = params.root;
	let rootId = params.rootId;

	for (let i = 0; i < unsynced.length; i++){
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
					console.log("Local file is more recent: Uploading...");

					//If uploading, add the newest md5 to the history stack
					tags.addToMD5History(md5);

					await SYNC.syncUp(s3, bucket, key, tags);

				} else {
					console.log("Local file is out-of-date: Downloading...");
					
					let params = { Bucket: bucket, Key: key }

					//Build the path if it doesn't exist, then download the file
					//Upload a new set of tags so we know the object was synced here
					await DIR.buildPath(root, PATH.relative(root, filePath));
					await SYNC.download(s3, params, PATH.join(root, filePath));
					await SYNC.uploadTags(s3, bucket, key, tags);

				}

			} else {

				console.log("File is synced: No action needed...");

			}

		} catch (err) {

			console.log(err);

		}

	}

}

module.exports = handleMatchedUnsynced;