const uploadFile = require('./upload-file');
const md5File = require('md5-file/promise');
const PATH = require('path');

async function syncUp(s3, bucket, key, tagging) {

	let params = {
		Bucket: bucket,
		Key: key,
		Tagging: tagging, //async because of md5 fetch
	}

	return uploadFile(s3, params, PATH.join(filePath));
}

module.exports = syncUp;