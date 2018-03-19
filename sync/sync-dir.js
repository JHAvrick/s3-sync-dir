const DIR = require('./dir/dir-tools');
const SYNC = require('./base/sync-tools');
const PATH = require('path');
const md5File = require('md5-file/promise');
const TagSet = require('./class/tag-set');
const softDeleteConfig = require('./base/soft-delete-config');

//Callbacks
	//FIRST TIME UPLOADS
		//onBeforeUpload(bucket, root, file) - return false to cancel upload
		//onUploadComplete(bucket, root, file)

async function syncDir(s3, bucket, root, callbacks = {}){

	//Fetch objects and scan root directory
	let objects = (await SYNC.listBucket(s3, bucket)).Contents;
	let files = await DIR.listFilesDeep(PATH.join(root));

	//Diff and sort
	let sorted = await SYNC.sortMatches(root, files, objects);

	
	await handleUnmatchedFiles({
		s3: s3, 
		bucket: bucket,
		root: root,
		unmatched: sorted.unmatchedFiles,
		onBeforeUpload: callbacks.onBeforeUpload,
		onUploadComplete: callbacks.onUploadComplete
	});
	

	await handleUnmatchedObjects({
		s3: s3, 
		bucket: bucket,
		root: root,
		objects: sorted.unmatchedObjects
	});

	
	await handleMatchedDeleted({
		s3: s3, 
		bucket: bucket,
		root: root,
		matchedDeleted: sorted.matchedDeleted	
	});

	await handleMatchedUnsynced({
		s3: s3, 
		bucket: bucket,
		root: root,
		matchedUnsynced: sorted.matchedUnsynced
	});
	

	//console.log(sorted);
}


/*
 * This method should be called for files which are not matched to any object and
 * will initiate the first-time upload for the given files. 
 */ 
async function  handleUnmatchedFiles(params){
	let s3 = params.s3;
	let bucket = params.bucket;
	let root = params.root;
	let unmatched = params.unmatched;
	let onBeforeUpload = params.onBeforeUpload || function(){return true};
	let onUploadComplete = params.onUploadComplete || function(){};

	for (let i = 0; i < unmatched.length; i++){

		try {

			//if (onBeforeUpload(bucket, root, unmatched[i])){
				await SYNC.initUploadFile(s3, bucket, root, unmatched[i]);
				//onUploadComplete(bucket, root, unmatched[i]);
			//}

		} catch (err) {
			console.log(err);
		}

	}

	return true;
}

async function handleUnmatchedObjects(params){
	let s3 = params.s3;
	let bucket = params.bucket;
	let root = params.root;
	let objects = params.objects;

	for (let i = 0; i < objects.length; i++){
		
		let tags = new TagSet(s3, bucket, objects[i].Key);
		await tags.fetch();

		/*
		 * If the object has already been marked as deleted, make sure the tags note
		 * this device. No other action is needed.
		 */
		if (objects[i].ETag.replace(/(['"])/g, '') === softDeleteConfig.md5){
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
				tags.updateDeviceHistory();

				//Build the path if it doesn't exist, then download the file
				//Upload a new set of tags so we know the object was synced here
				await DIR.buildPath(root, objects[i].Key.replace(/\//g, PATH.sep));
				await SYNC.download(s3, params, PATH.join(root, objects[i].Key));
				await SYNC.uploadTags(s3, bucket, objects[i].Key, tags);

			} catch (err) {
				console.log(err);
			}
		}
		

	}

	return true;
}

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
async function handleMatchedDeleted(params){
	let s3 = params.s3;
	let bucket = params.bucket;
	let root = params.root;
	let matchedDeleted = params.matchedDeleted;

	for (let i = 0; i < matchedDeleted.length; i++){

		try {

			//Parse some data about file/object
			let filePath = matchedDeleted[i].file;
			let key = PATH.relative(root, matchedDeleted[i].file).replace(/\\/g, "/");
			let mdate = matchedDeleted[i].object.LastModified;

			//Some async operations to get more data
			let fileMD5 = await md5File(filePath);
			let localIsCurrent = await SYNC.isLocalCurrent(filePath, mdate);
			let tags = new TagSet(s3, bucket, key);
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

				console.log("localIsCurrent: " + localIsCurrent);
				console.log("tags include device: " + tags.includesThisDevice());
				console.log("includes md5: " + tags.includesMD5(fileMD5));

				console.log("Deleted file was restored or recreated: uploading file...");
				await SYNC.initUploadFile(s3, bucket, root, filePath);

			//If none of these conditions are matched, it is assumed safe to delete the local file
			} else {

				console.log("File was deleted on another device: deleting file...");

				//Update tags so we know this file's deletion state has been synced
				//to this device next time (thereby possibly meeting condition 2 above)
				tags.addToMD5History(fileMD5);
				tags.updateDeviceHistory();

				await SYNC.uploadTags(s3, bucket, key, tags);
				await DIR.deleteFile(filePath);

			}

		} catch (err) {

			console.log(err);

		}

	}

}

async function handleMatchedUnsynced(params){
	let s3 = params.s3;
	let bucket = params.bucket;
	let root = params.root;
	let unsynced = params.matchedUnsynced;

	for (let i = 0; i < unsynced.length; i++){
		try {

			//Get tags for any possibly out-of-sync objects
			let filePath = PATH.join(unsynced[i].file);
			let key = PATH.relative(root, filePath).replace(/\\/g, "/");
			let mdate = unsynced[i].object.LastModified;

			let localIsCurrent = await SYNC.isLocalCurrent(filePath, mdate);
			let md5 = await md5File(filePath);
			let tags = new TagSet(s3, bucket, key);
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

					await SYNC.syncUp(s3, bucket, root, filePath, tags);

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

module.exports = syncDir;