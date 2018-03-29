const PATH = require('path');
const EVENTS = require('events');
const SYNC = require('../sync/sync-tools');
const TagSet = require('./tag-set');

/*
 * The SyncObject creates, deletes, or updates a local file or S3 object to 
 * bring their states into harmony. The SyncObject should usually not be created
 * directly - use one of it's more specifically-purposed descendants instead.
 */ 
class SyncObject {
    constructor(params, key){
        /*
         * Authenticated S3 instance.
         */
        this._s3 = params.s3;

        /*
         * The S3 bucket this object will sync to.
         */
        this._bucket = params.bucket;

        /*
         * The bucket prefix. Useful if the bucket is organized into sections
         * and you want to sync two directories to the same bucket.
         */
        this._prefix = params.prefix;

        /*
         * Absolute path to the local sync directoy
         */
        this._root = params.root;

        /*
         * The unique ID for the root sync directoy.
         */
        this._rootId = params.rootId;

        /*
         * The object key.
         */
        this._key = key;

        /*
         * The filepath (whether the file exists or not), extrapolated from key.
         */
        this._path = this._keyToPath(this._root, this._prefix, this._key);

        /*
         * TagSet object, must call fetchTags() to get actual tags
         */
        this._tags = new TagSet(this._s3, this._bucket, this._key, this._rootId);
        
        /*
         * Event emitter, to be accessed through on() method.
         */
        this._events = new EVENTS.EventEmitter();

        /*
         * Sync state flag
         */
        this._syncState = SyncObject.States.UNSYNCED;

        /*
         * These functions are for internal use and are defined and documented 
         * in seperate files. Each is a pure function and does not rely on the
         * SyncObject's state.
         */
        this._syncUp = require('../sync/sync-up').bind(this);
        this._uploadTags = require('../sync/upload-tags').bind(this);
        this._initUploadFile = require('../sync/init-upload-file').bind(this);
        this._softDeleteObject = require('../sync/soft-delete-object').bind(this);
        this._isLocalCurrent = require('../sync/is-local-current').bind(this);
        this._download = require('../sync/download').bind(this);

    }

    /*
     * Extrapolates filepath from key by splitting key, replacing prefix with
     * root and joining the array. For internal use.
     */
    _keyToPath(root, prefix, key){
        let splitKey = key.split('/');
            splitKey[0] = root;
        return PATH.join(...splitKey);
    }

    /*
     * Get object for event callbacks. For internal use.
     */
    _getCallbackParams(syncType){

        return {
            bucket: this._bucket,
            root: this._root,
            prefix: this._prefix,
            key: this._key,
            name: PATH.basename(this._path),
            type: SyncObject.Types[syncType]
        }
    }

    /*
     * Wrapper function for event emitter.
     */
    on(event, listener){
        this._events.on(event, listener);
    }


}

SyncObject.States = {
    FAILED: 'FAILED',
    COMPLETE: 'COMPLETE',
    UNSYNCED: 'UNSYNCED',
    SYNCING: 'SYNCING'
}

SyncObject.Types = {
    DOWNLOAD: 'DOWNLOAD',
    UPLOAD: 'UPLOAD',
    DELETE_FILE: 'DELETE_FILE',
    DELETE_OBJECT: 'DELETE_OBJECT',
    UPDATE_TAGS: 'UPDATE_TAGS',
    NO_ACTION: 'NO_ACTION',
    UNKNOWN: 'UNKNOWN'
}

module.exports = SyncObject;

