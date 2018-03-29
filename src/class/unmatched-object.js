const DIR = require('../dir/dir-tools');
const SyncObject = require('./sync-object');
const softDeleteConfig = require('../sync/soft-delete-config');

class UnmatchedObject extends SyncObject {
    constructor(params, key, s3Object){
        super(params, key);

        /*
         * Metadata for the unmatched S3 object. Fetched using listObjects
         * or headObject.
         */
        this._s3Object = s3Object;

        /*
         * The S3 objects MD5 hash.
         */
        this._s3ObjectMD5 = s3Object.ETag.replace(/(['"])/g, '');

    }

    async sync(){
        this._syncState = SyncObject.States.SYNCING;

        var syncType = SyncObject.Types.UNKNOWN;
        try {
            //Fetch tags
            await this._tags.fetch();
            
            /*
             * If the object has already been marked as deleted, make sure the tags note
             * this device. No other action is needed.
             */
            if (this._s3ObjectMD5 === softDeleteConfig.md5){
                if (!this._tags.includesThisDevice()){
                    syncType = SyncObject.Types.UPDATE_TAGS;
                    this._events.emit('syncStart', this._getCallbackParams(syncType));

                    this._tags.updateDeviceHistory();
                    let tags = this._tags.toArray();

                    await this._uploadTags(this._s3, this._bucket, this._key, tags);

                    this._syncState = SyncObject.States.COMPLETE;
                    this._events.emit('syncComplete', this._getCallbackParams(syncType));
                }

                //Ignore rest of function
                return true;
            }

            /*
            * If the tags include this device, we assume the file was present but has
            * since been deleted. That state is applied to the object via "soft delete".
            */ 
            if (this._tags.includesThisDevice()){
                syncType = SyncObject.Types.DELETE_OBJECT;
                this._events.emit('syncStart', this._getCallbackParams(syncType));

                let tags = this._tags.toQueryString();

                await this._softDeleteObject(this._s3, this._bucket, this._key, tags);

            } else {
                syncType = SyncObject.SyncTypes.DOWNLOAD;
                this._events.emit('syncStart', this._getCallbackParams(syncType));

               this._tags.updateDeviceHistory();

               let tags = this._tags.toArray();

               await DIR.buildPath(this._root, this._path);
               await this._download(this._s3, this._params, PATH.join(this._root, this._path));
               await this._uploadTags(this._s3, this._bucket, this._key, tags);
               
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

module.exports = UnmatchedObject;