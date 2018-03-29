const SyncObject = require('./sync-object');

class UnmatchedFile extends SyncObject {
    constructor(params, key){
        super(params, key);
    }

    async sync(){
        this._syncState = SyncObject.States.SYNCING;

        let syncType = SyncObject.Types.UPLOAD;
        try {

            //Get init tag set
            let tags = await this._tags.getInitTags(this._path);
        
            this._events.emit('syncStart', this._getCallbackParams(syncType));
            await this._initUploadFile(this._s3, this._bucket, this._key, this._path, tags);

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

module.exports = UnmatchedFile;