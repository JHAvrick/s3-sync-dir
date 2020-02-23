const DIR = require('../dir/dir-tools');
const md5File = require('md5-file/promise');
const SyncObject = require('./sync-object');

class MatchedDeleted extends SyncObject {
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

             let mdate = this._s3Object.LastModified;
             let fileMD5 = await md5File(this._path);
             let localIsCurrent = await this._isLocalCurrent(this._path, mdate);
             await this._tags.fetch();
 
             /*
              * Three conditions under which a file is considered to be more recent than
              * it's matching object's deletion.
              * 1 - The modified date of the file is more recent than the date of deletion
              * 2 - The deletion state has already been synced to this device, implying that
              *			the file was deleted, synced, and then restored
              * 3 - The file's contents (MD5) match no previous versions of the file, implying
              *			the file is possibly unrelated to the original file (same key, different file)
              */ 
             if (localIsCurrent || this._tags.includesThisDevice() || !this._tags.includesMD5(fileMD5)) {
                syncType =  SyncObject.Types.UPLOAD;
                
                let tags = await this._tags.getInitTags(this._path);
                
                this._events.emit('syncStart', this._getCallbackParams(syncType));
                await this._initUploadFile(this._s3, this._bucket, this._key, this._path, tags);
 
             //If none of these conditions are matched, it is assumed safe to delete the local file
             } else {
                syncType =  SyncObject.Types.DELETE_FILE;
 
                //Update tags so we know this file's deletion state has been synced
                //to this device next time (thereby possibly meeting condition 2 above)
                this._tags.addToMD5History(fileMD5);
                this._tags.updateDeviceHistory();

                let tags = this._tags.toArray();

                this._events.emit('syncStart', this._getCallbackParams(syncType));

                await this._uploadTags(this._s3, this._bucket, this._key, tags);
                await DIR.deleteFile(this._path);

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

module.exports = MatchedDeleted;