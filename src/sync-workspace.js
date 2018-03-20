const DIR = require('./dir/dir-tools');
const SYNC = require('./sync/sync-tools');
const PATH = require('path');

const handleUnmatchedFiles = require('./handlers/handle-unmatched-files');
const handleUnmatchedObjects = require('./handlers/handle-unmatched-objects');
const handleMatchedDeleted = require('./handlers/handle-matched-deleted');
const handleMatchedUnsynced = require('./handlers/handle-matched-unsynced');

async function syncWorkspace(s3, bucket, prefix = '', root){
	try {
		//Fetch objects and scan root directory
		let rootId = await SYNC.getRootId(root);
		let objects = (await SYNC.listBucket(s3, bucket, prefix)).Contents;
		let files = await DIR.listFilesDeep(PATH.join(root));
		let tree = await DIR.listTreeDeep(PATH.join(root));
		let sorted = await SYNC.sortMatches(root, files, objects, prefix);

		let params = {
			s3: s3,
			bucket: bucket,
			prefix: prefix,
			rootId: rootId,
			root: root
		}

		await handleUnmatchedFiles(params, sorted.unmatchedFiles);
		await handleUnmatchedObjects(params, sorted.unmatchedObjects);
		await handleMatchedDeleted(params, sorted.matchedDeleted);
		await handleMatchedUnsynced(params, sorted.matchedUnsynced);
	
	} catch (err){

		console.log(err);

	}
}

module.exports = syncWorkspace;