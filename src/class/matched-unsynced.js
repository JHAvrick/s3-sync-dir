const DIR = require('../dir/dir-tools');
const SyncObject = require('./sync-object');

class MatchedUnsynced extends SyncObject {
    constructor(params, key, s3Object){
        super(params, key);

        /*
         * Metadata for the unmatched S3 object. Fetched using listObjects
         * or headObject.
         */
        this._s3Object = s3Object;

    }

    async sync(){
        this._syncState = SyncObject.States.SYNCING;

        let syncType = SyncObject.Types.UNKNOWN;
        try {

			//Get tags for any possibly out-of-sync objects
			let mdate = this._s3Object.LastModified;
			let localIsCurrent = await this._isLocalCurrent(this._path, mdate);
			let md5 = await md5File(this._path);
			await this._tags.fetch();

			//Compare md5 to most recent tag md5
			//If there is a match, this file IS synced, but is probably larger than 5mb
			if (!this._tags.isMD5Match(md5)){

				//In either case, we want to know that this device was synced
				this._tags.updateDeviceHistory();

				if (localIsCurrent){
                    syncType = SyncObject.Types.UPLOAD;
                    this._events.emit('syncStart', this._getCallbackParams(syncType));

					//If uploading, add the newest md5 to the history stack
                    this._tags.addToMD5History(md5);
                
                    let tags = this._tags.toQueryString();
                    await this._syncUp(this._s3, this._bucket, this._key, tags);
                    
				} else {
                    syncType = SyncObject.Types.DOWNLOAD;
                    this._events.emit('syncStart', this._getCallbackParams(syncType));
					
                    let params = { Bucket: this._bucket, Key: this._key }
                    let tags = this._tags.toArray();

                    //Build the path if it doesn't exist, then download the file
                    //Upload a new set of tags so we know the object was synced here
                    await DIR.buildPath(this._root, PATH.relative(this._root, this._path));
                    await this._download(this._s3, params, PATH.join(this._root, this._path));
                    await this._uploadTags(this._s3, this._bucket, this._key, tags); 

				}

			}            

        } catch (err){

            this._syncState = SyncObject.States.FAILED;
            this._events.emit('syncError', err, this._getCallbackParams(syncType));
            return false;

        }

        this._syncState = SyncObject.States.COMPLETE;
        this._events.emit('syncComplete', this._getCallbackParams(syncType));
        return true;
        
    }

}

module.exports = MatchedUnsynced;