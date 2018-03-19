const PATH = require('path');
const OS = require('os');
const objToQueryString = require('./obj-to-query-string');
const objToBase64 = require('./obj-to-base-64');
const md5File = require('md5-file/promise');

async function getInitTags(filePath){

	let deviceName = OS.hostname();
	let deviceList = [deviceName];
	let syncDate = new Date().toString();
	let md5 = await md5File(PATH.join(filePath));
	
	let tags = {
		md5: md5,
		lastSyncBy: deviceName,
		lastSyncDate: syncDate,
		createdBy: deviceName,
		createdDate: syncDate,
		JSON_deviceList: deviceList,
		deleted: 'false', 
		deletedBy: 'null',
		deletedDate: 'null'
	}

	return objToQueryString(objToBase64(tags));

}

module.exports = getInitTags;