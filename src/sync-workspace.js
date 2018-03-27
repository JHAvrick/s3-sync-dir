const DIR = require('./dir/dir-tools');
const SYNC = require('./sync/sync-tools');
const PATH = require('path');

const handleUnmatchedFiles = require('./handlers/handle-unmatched-files');
const handleUnmatchedObjects = require('./handlers/handle-unmatched-objects');
const handleMatchedDeleted = require('./handlers/handle-matched-deleted');
const handleMatchedUnsynced = require('./handlers/handle-matched-unsynced');

/**
 * This method checks a directory against a given bucket/prefix and attempts to
 * reconcile the differences based on modified dates and MD5 hashes. Two custom 
 * tags are used for each S3 object - _JSON_deviceList and _JSON_md5History.
 * These are used to determine whether an object has been synced (in it's most
 * recent version) to a given device. Syncing behavior for objects that DO NOT
 * have these tags may be unpredictable (i.e. objects that weren't uploaded using
 * this method). 
 * 
 * @param {Object} config
 * @param {Object} config.s3 - An authenticated S3 object
 * @param {string} config.bucket - An already-existing bucket
 * @param {string} config.root - The directory to sync
 * @param {string} config.prefix - The bucket prefix. If the prefix doesn't exist
 * it will be created.
 * @param {Array<RegExp>}  config.ignore - An array of RegExp objects. Files or dirs
 * that match any of the patterns in this array will be ignored.
 * @param {Object} callbacks - Object containing three callbacks. Each callback
 * is passed a config object with metadata about the current operation and it's
 * target. 
 * @param {callback} callbacks.onBefore - Called before any operation, return
 * false to cancel operation.
 * @param {callback} callbacks.onError - Called when an operation fails
 * @param {callback} callbacks.onComplete - Called when an operation completes
 */
async function syncWorkspace(config, callbacks){
	let s3 = config.s3;
	let bucket = config.bucket;
	let root = config.root;
	let prefix = config.prefix || '';
	let ignore = config.ignore || [];

	let events = {
		onBefore: callbacks.onBefore || function(){return true;},
		onError: callbacks.onError || function(){},
		onComplete: callbacks.onComplete || function(){},
		onSyncError: callbacks.onSyncError || function(){},
		onSyncComplete: callbacks.onSyncComplete || function(){}
	}

	try {
		//Fetch objects and scan root directory
		let rootId = await SYNC.getRootId(root);
		let objects = (await SYNC.listBucket(s3, bucket, prefix)).Contents;
		let files = await DIR.listFilesDeep(PATH.join(root), ignore);
		let tree = await DIR.listTreeDeep(PATH.join(root));
		let sorted = await SYNC.sortMatches(root, files, objects, prefix);

		let params = {
			s3: s3,
			bucket: bucket,
			prefix: prefix,
			rootId: rootId,
			root: root
		}

		await handleUnmatchedFiles(params, sorted.unmatchedFiles, events);
		await handleUnmatchedObjects(params, sorted.unmatchedObjects, events);
		await handleMatchedDeleted(params, sorted.matchedDeleted, events);
		await handleMatchedUnsynced(params, sorted.matchedUnsynced, events);
		
		events.onSyncComplete(params);

	} catch (err){
		events.onSyncError(err);
	}
}

module.exports = syncWorkspace;