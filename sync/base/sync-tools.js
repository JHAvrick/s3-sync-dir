const SYNC = {
	upload: require('./upload'),
	download: require('./download'),
	getObjectTags: require('./get-object-tags'),
	isLocalCurrent: require('./is-local-current'),
	listBucket: require('./list-bucket'),
	S3TagsToObj: require('./s3-tags-to-obj'),
	uploadFile: require('./upload-file'),
	sortMatches: require('./sort-matches'),
	getInitTags: require('./get-init-tags'),
	initUploadFile: require('./init-upload-file'),
	softDeleteObject: require('./soft-delete-object'),
	hasPreviouslySynced: require('./has-previously-synced'),
	syncUp: require('./sync-up'),
	uploadTags: require('./upload-tags')
}

module.exports = SYNC;