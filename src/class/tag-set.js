const PATH = require('path');
const md5File = require('md5-file/promise');

class TagSet {
	constructor(s3, bucket, key, rootId){
		this._s3 = s3;
		this._bucket = bucket;
		this._key = key;
		this._rootId = rootId;

		//fetchTags() must be called to set these properties
		this._tagsRaw = null;
		this._tags = {};
	}

	_decodeRawTags(tagSet){
		let tagObj = {};

		tagSet.forEach((tag) => {
			tagObj[tag.Key] = Buffer.from(tag.Value, 'base64').toString('ascii');

			//If the tag includse the JSON_ keyword, parse the value as a json
			if (tag.Key.indexOf("_JSON_") !== -1){
				tagObj[tag.Key] = JSON.parse(tagObj[tag.Key]);
			}

		});

		return tagObj;
	}

	_toBase64(obj){
		let base64Obj = {}
		for (var key in obj){
			if (key.indexOf("_JSON_") !== -1)
				base64Obj[key] = Buffer.from(JSON.stringify(obj[key])).toString('base64'); 
			else
				base64Obj[key] = Buffer.from(obj[key]).toString('base64');
		}
		return base64Obj;
	}


	_queryStringEncode(obj){
		var str = [];
		for (var p in obj)
				if (obj.hasOwnProperty(p)) {
						str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				}
		return str.join("&");		
	}

	//Creates a fresh set of tags for given file
	async getInitTags(filePath){
		let syncDate = new Date().toString();
		let md5 = await md5File(PATH.join(filePath));
		
		let tags = {
			_JSON_deviceList: [this._rootId],
			_JSON_md5History: [md5.substring(0, 10)]
		}

		return this._queryStringEncode(this._toBase64(tags));
	}

	//Fetches tags for object
	fetch(){
		return new Promise((resolve, reject) => {

			let params = { Bucket: this._bucket, Key: this._key }
			this._s3.getObjectTagging(params, (err, data) => {
				if (err) {

					reject(err, err.stack);
				
				} else {

					this._tagsRaw = data.TagSet;
					this._tags = this._decodeRawTags(data.TagSet);

					resolve(true);
				}
			});

		});
	}

	resetDeviceList(){
		this._tags['_JSON_deviceList'] = [this._rootId];
	}

	includesThisDevice(){
		return this._tags['_JSON_deviceList'].includes(this._rootId);
	}

	async includesMD5of(filePath){
		let md5 = await md5File(filePath);
		return this._tags['_JSON_md5History'].includes(md5.substring(0, 10));
	}

	includesMD5(md5){
		return this._tags['_JSON_md5History'].includes(md5.substring(0, 10));
	}

	updateDeviceHistory(){
		let deviceHistory = this._tags['_JSON_deviceList'];

		if (!deviceHistory.includes(this._rootId))
			deviceHistory.unshift(this._rootId)

		this._tags['_JSON_deviceList'] = deviceHistory.slice(0, 20);
	}

	addToMD5History(md5){
		let md5History = this._tags['_JSON_md5History'];
				md5History.unshift(md5.substring(0, 10));

		this._tags['_JSON_md5History'] = md5History.slice(0, 20);		
	}

	isMD5Match(md5){
		return this._tags['_JSON_md5History'][0] === md5.substring(0, 10);
	}

	async updateMD5History(filePath){
		let md5 = await md5File(PATH.join(filePath));

		let md5History = this._tags['_JSON_md5History'];
				md5History.unshift(md5.substring(0, 10));

		this._tags['_JSON_md5History'] = md5History.slice(0, 20);
	}

	setTag(key, value){
		this._tags[key] = value;
	}

	getTag(key){
		return this._tags[key];
	}

	//Get tag set as array, base64 encoded
	toArray(){

		let tagArray = [];
		let base64Tags = this._toBase64(this._tags);

		for (var key in base64Tags){
			tagArray.push({
				Key: key,
				Value: base64Tags[key]
			})
		}

		return tagArray;
	}

	//Get tag set as query string, base64 encoded
	toQueryString(){
		return this._queryStringEncode(this._toBase64(this._tags));
	}

	log(){
		console.log("--------------------------------------------------");
		console.log("KEY: " + this._key);
		console.log("--------------------------------------------------");
		
		console.log("**** Synced Devices **** ")
		for (let i = 0; i < this._tags['_JSON_deviceList'].length; i++){
			console.log(this._tags['_JSON_deviceList'][i]);
		}

		console.log("\n");

		console.log("**** MD5 History **** ")
		for (let i = 0; i < this._tags['_JSON_md5History'].length; i++){
			console.log(this._tags['_JSON_md5History'][i]);
		}

		console.log("\n");
	}
	
}

module.exports = TagSet;