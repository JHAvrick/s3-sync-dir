const SYNC = require('../sync/sync-tools');
const PATH = require('path');

/*
 * This method should be called for files which are not matched to any object and
 * will initiate the first-time upload for the given files. 
 */ 
async function  handleUnmatchedFiles(params, unmatched, callbacks){
	let s3 = params.s3;
	let bucket = params.bucket;
    let root = params.root;
	let prefix = params.prefix;
    let rootId = params.rootId;

	for (let i = 0; i < unmatched.length; i++){

		let key = SYNC.makeKey(prefix, root, unmatched[i]);
		let callbackParams = {
			bucket: bucket,
			root: root,
			prefix: prefix,
			key: key,
			name: PATH.basename(unmatched[i]),
			type: SYNC.SyncTypes.UPLOAD
		}

		try {

			if (callbacks.onBefore(callbackParams)){
				await SYNC.initUploadFile(s3, bucket, key, rootId, unmatched[i]);
				callbacks.onComplete(callbackParams);
			}

		} catch (err) {
			callbacks.onError(err, callbackParams)
		}

	}

	return true;
}

module.exports = handleUnmatchedFiles;
