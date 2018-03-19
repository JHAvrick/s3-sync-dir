const listBucket = require('./list-bucket');
const listFilesDeep = require('../dir/md5-files-deep');

//Find matching filenames
	//Check md5
		//If not matching, check modified date
			//The more recent version should proliferate

//Find unmatching filenames



async function diffDir(s3, dir, bucket){

	try {

		let bucketList = (await listBucket(s3, bucket)).Contents;
		let fileList = await md5FilesDeep(dir);

}



module.exports = diffDir;


/*

{
	syncDeviceID:
	syncID:
	syncStart:
	syncEnd:
	syncCompleted:
}


Machine 1:
	
Machine 2:
	-- File 1

File 1 History:
	Created by Machine 1
	Edited by Machine 2

Situation:
	Last version is Machine 2
	File absent on Machine 1


*/