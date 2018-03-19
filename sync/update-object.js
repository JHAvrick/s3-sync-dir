const SYNC = require('./base/sync-tools');
const PATH = require('path');
const OS = require('os');

/**
 * This method should should be used to perform an update to an existing object.
 * Current tags will be merged with existing tags.
 *
 * @async
 * @param {object} s3 - An authenticated S3 instance
 * @param {string} bucket - The bucket key 
 * @param {string} root - Absolute path to the root sync folder
 * @param {string} root - Absolute path to a file within the root folder
 * @return {Promise<object>} Promise with response from S3 service
 */

async function updateObject(s3, bucket, rootPath, filePath){

	//Get current tags for this object
	let objectKey = PATH.relative(rootPath, filePath);
	let updatedTags = await SYNC.updateTags(s3, bucket, objectKey);

	let params = {
		Bucket: bucket,
		Key: objectKey,
		Tagging: updatedTags,
		Metadata: {
			exists: JSON.stringify({
				deleted: false,
				deletedBy: null,
				deletedDate: null
			})
		}
	}

	return SYNC.uploadFile(s3, params, filePath);
}



module.exports = updateObject;