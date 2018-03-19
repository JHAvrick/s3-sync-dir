const uploadFile = require('./upload-file');
const TagSet = require('../class/tag-set.js');
const md5File = require('md5-file/promise');
const PATH = require('path');

async function syncUp(s3, bucket, key, tagSet) {

	let params = {
		Bucket: bucket,
		Key: key,
		Tagging: tagSet.toQueryString(), //async because of md5 fetch
	}

	return uploadFile(s3, params, PATH.join(filePath));
}

module.exports = syncUp;