const TagSet = require('../class/tag-set.js');
const OS = require('os');

async function hasPreviouslySynced(s3, bucket,  key){
	let tags = new TagSet(s3, bucket, key);
	await tags.fetch();

	
	
	let deviceList = tags.getTag('_JSON_deviceList');

	if (deviceList.includes(OS.hostname().slice(0, 5)))
		return true;
	else 
		return false;
}

module.exports = hasPreviouslySynced;