const { Tapable, SyncHook, SyncBailHook, AsyncParallelHook } = require('tapable');


class Compiler extends Tapable {
    constructor(context) {
        super(context);
        this.options = {};
        this.context = context;
        this.hooks = {
            entryOption: new SyncBailHook(["context", "entry"]),
            make: new AsyncParallelHook(["compilation"]),
            environment: new SyncHook([]),
            /** @type {SyncHook} */
            afterEnvironment: new SyncHook([]),
        }
    }
    run() {

    }
}

module.exports = Compiler;