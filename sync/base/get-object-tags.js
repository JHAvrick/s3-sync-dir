function getObjectTags(s3, bucket, key){
	return new Promise((resolve, reject) => {
		
		var params = {
			Bucket: bucket, 
			Key: key
		}

		s3.getObjectTagging(params, function(err, data) {
			if (err) reject(err, err.stack);
			else resolve(data.TagSet);
		});

	});
}

module.exports = getObjectTags;