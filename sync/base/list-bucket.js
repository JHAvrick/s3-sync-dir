/**
 * Promise wrapper for listing contents of s3 bucket
 * 
 * @async
 * @param {object} s3 - An AWS.S3 instance
 * @param {string} bucket - The S3 bucket key
 * @return {Promise<array>} Array of objects detailing bucket contents
 */
function listBucket(s3, bucket, prefix){
	return new Promise((resolve, reject) => {

		var params = { Bucket: bucket }
		if (prefix !== null)
			params.Prefix = prefix;

		s3.listObjectsV2(params, function(err, data) {
			if (err) reject(err, err.stack)
			else resolve(data);
		});

	});

}

module.exports = listBucket;