/**
 * Promise wrapper for uploading an item to an s3 bucket
 * 
 * @async
 * @param {object} s3 - An AWS.S3 instance
 * @param {string} params - Upload params
 * @return {Promise<array>} 
 */
async function upload(s3, params){
	return new Promise((resolve, reject) => {

		s3.upload(params, function(err, data) {
		  if (err) reject(err);
		  else resolve(data);
		});

	});

}

module.exports = upload;