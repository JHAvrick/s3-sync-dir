function S3TagsToObject(tags){
	let tagObj = {};
	for (let i = 0 ; i < tags.length; i++){
		tagObj[tags[i].Key] = Buffer.from(tags[i].Value, 'base64').toString('ascii');
	}
	return tagObj;
}

module.exports = S3TagsToObject;