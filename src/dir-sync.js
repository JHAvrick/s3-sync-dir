const PATH = require('path');
const EVENTS = require('events');
const SYNC = require('./sync/sync-tools');
const DIR = require('./dir/dir-tools');

class DirectorySync {
    constructor(config){
        this._s3 = config.s3;
        this._bucket = config.bucket;
        this._root = config.root;
        this._prefix = config.prefix || '';
        this._ignore = config.ignore || [];
        this._events = new EVENTS.EventEmitter();
        
        this._isPaused = false;
        this._isStopped = false;

        this.unsynced = [];
        this.synced = [];
        this.failed = [];
    }

    _emitSyncStart(params){
        this._events.emit('objectSyncStart', params);
    }

    _emitSyncError(err, params){
        this._events.emit('objectSyncError', err, params);
    }

    _emitSyncComplete(params){
        this._events.emit('objectSyncComplete', params);
    }

    /*
     * Pre-sync function, determines possible differences between the given 
     * bucket/prefix and directoy. This must be called before beginning a sync.
     * For internal use only - relies on this classes state.
     */
    async _prepareSync(){
		//Fetch objects and scan root directory
        let rootId = await SYNC.getRootId(this._root);
        //let files = await DIR.listFilesDeep(PATH.join(this._root), this._ignore);
        let dir = await DIR.listAllDeep(PATH.join(this._root), this._ignore);
        let objects = (await SYNC.listBucket(this._s3, this._bucket, this._prefix)).Contents;
        
        let params = {
            s3: this._s3,
            bucket: this._bucket,
            prefix: this._prefix,
            root: this._root,
            rootId: rootId
        }

        this.unsynced = await SYNC.sortMatches(params, dir.tree, dir.files, objects);
    }

    /*
     * The actual syncing function, which will always attempt to sync any objects
     * remaining in the "unsynced" array. This should only be called internally
     * and relies on this classes state.
     */
    async _reconcile(){
        let queued = this.unsynced.splice(0);

        for (let i = 0; i < queued.length; i++){

            if (this._isStopped){ this._clearSync(); return; } 
            if (this._isPaused){ this._holdSync(); return; } 

            //Subscribe to current SyncObject's events
            queued[i].on('syncStart', this._emitSyncStart.bind(this));
            queued[i].on('syncError', this._emitSyncError.bind(this));
            queued[i].on('syncComplete', this._emitSyncComplete.bind(this));

            try {

                let synced = await queued[i].sync();
                if (synced) this.synced.push(queued[i]);
                else this.failed.push(queued[i]);
                
            } catch (err) {
                console.log(err);
            }

            //Remove object from list so we don't try to sync it again
            this.unsynced.splice(this.unsynced.indexOf(queued[i]), 1);
        }
    }

    /*
     * Resets sync state. Used internally when stopSync() is called.
     */
    _clearSync(){
        this._isPaused = false;
        this._isStopped = false;
        this.progess = 0;
        this.synced = [];
        this.unsynced = [];
        this.failed = [];

        this._events.emit('syncStopped');  
    }

    /*
     * Simply emits the syncPaused event after the ongoing operation is complete.
     */
    _holdSync(){
        this._events.emit('syncPaused', this.unsynced, this.synced); 
    }

    /*
     * Wrapper function for event emitter.
     */
    on(event, listener){
        this._events.on(event, listener);
    }

    async startSync(){
        await this._prepareSync();
        await this._reconcile();
    }

    resumeSync(){
        this._isPaused = false;
        this._isStopped = false;

        this._reconcile();
        this._events.emit('syncResumed', this.unsynced, this.synced);       
    }

    pauseSync(){ this._isPaused = true; }
    stopSync(){ this._isStopped = true; }

}

//unmatched deleted dir object (ignore)
//unmatched local dir (upload)
//matched deleted dir (delete or create)
//unmatched dir object (delete or create)

module.exports = DirectorySync;