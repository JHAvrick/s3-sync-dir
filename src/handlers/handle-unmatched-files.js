const SYNC = require('../sync/sync-tools');

/*
 * This method should be called for files which are not matched to any object and
 * will initiate the first-time upload for the given files. 
 */ 
async function  handleUnmatchedFiles(params, unmatched){
	let s3 = params.s3;
	let bucket = params.bucket;
    let root = params.root;
	let prefix = params.prefix;
    let rootId = params.rootId;

	for (let i = 0; i < unmatched.length; i++){

		try {
            console.log("Performing initial upload...");
			let key = SYNC.makeKey(prefix, root, unmatched[i]);
			await SYNC.initUploadFile(s3, bucket, key, rootId, unmatched[i]);

		} catch (err) {
			console.log(err);
		}

	}

	return true;
}

module.exports = handleUnmatchedFiles;