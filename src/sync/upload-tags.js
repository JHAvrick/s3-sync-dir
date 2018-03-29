function uploadTags(s3, bucket, key, tags){
	return new Promise((resolve, reject) => {

		var params = {
			Bucket: bucket, 
			Key: key, 
			Tagging: {
				TagSet: tags
			}
		};

		s3.putObjectTagging(params, function(err, data) {
			if (err) reject(err, err.stack); // an error occurred
			else resolve(data); // successful response
		});

	});
}

module.exports = uploadTags;