const SYNC = {
	SyncTypes: require('./sync-types'),
	makeKey: require('./make-key'),
	keyToPath: require('./key-to-path'),
	getRootId: require('./get-root-id'),
	isLocalCurrent: require('./is-local-current'),
	listBucket: require('./list-bucket'),
	sortMatches: require('./sort-matches'),
	softDeleteConfig: require('./soft-delete-config'),
	softDeleteObject: require('./soft-delete-object'),
	download: require('./download'),
	syncUp: require('./sync-up'),
	upload: require('./upload'),
	uploadFile: require('./upload-file'),	
	uploadTags: require('./upload-tags'),
	initUploadFile: require('./init-upload-file')
}

module.exports = SYNC;