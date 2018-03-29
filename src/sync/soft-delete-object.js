const upload = require('./upload');
const softDeleteConfig = require('./soft-delete-config');

async function softDeleteObject(s3, bucket, key, tagging){

	let params = {
		Bucket: bucket,
		Key: key,
		Body: softDeleteConfig.body,
		Tagging: tagging
	}

	return upload(s3, params);
}

module.exports = softDeleteObject;