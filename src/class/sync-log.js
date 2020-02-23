const fs = require('fs');
const path = require('path');
const hidefile = require('hidefile');

class SyncLog {
    constructor(root, logJSON){
        this._root = root;
        this._log = logJSON;
    }

}