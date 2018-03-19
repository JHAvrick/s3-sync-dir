const TagSet = require('../class/tag-set');
const upload = require('./upload');
const getObjectTags = require('./get-object-tags');
const softDeleteConfig = require('./soft-delete-config');

async function softDeleteObject(s3, bucket, key, tagSet){

	tagSet.resetDeviceList();

	let params = {
		Bucket: bucket,
		Key: key,
		Body: softDeleteConfig.body,
		Tagging: tagSet.toQueryString()
	}

	return upload(s3, params);
}

module.exports = softDeleteObject;