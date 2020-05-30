const { Tapable, SyncHook } = require('tapable');
const path = require('path');
const Parser = require('./Parser');
const parser = new Parser();
const async = require('neo-async');
class Compilation extends Tapable {
    constructor(compiler) {
        super();
        this.compiler = compiler;
        this.options = compiler.options;
        this.context = compiler.options.context;
        this.inputFileSystem = compiler.inputFileSystem;
        this.outputFileSystem = compiler.outputFileSystem;
        this.entries = [];
        this.chunks = [];
        //本次编译后产出的所有模块
        this.modules = [];
        //模块id ./src/index.js
        //key是模块id,value= 模块的代码
        this._modules = {};
        this.assets = [];
        this.dependencyFactories = new Map();
        this.hooks = {
            buildModule: new SyncHook(["module"]),
            succeedEntry: new SyncHook(["entry", "name", "module"]),
            addEntry: new SyncHook(["entry", "name"]),
            //一个模块成功后
            succeedModule: new SyncHook(["module"]),
        }
    }
    addEntry(context, entry, name, callback) {
        this.hooks.addEntry.call(entry, name);
        this._addModuleChain(
            context,
            entry,
            name,
            (err, module) => {
                this.entries.push(module);
                this.hooks.succeedEntry.call(entry, name, module);
                return callback(null, module);
            })
    }
    _addModuleChain(context, dependency, name, callback) {
        //1.创建模块
        const Dep = dependency.constructor;
        const moduleFactroy = this.dependencyFactories.get(Dep);
        const module = moduleFactroy.create({
            name, //main
            context, //
            rawRequest: dependency.request,
            //入口模块绝对路径,统一为 unix(/)
            resource: path.posix.join(context, dependency.request),
            parser
        });
        //path.posix.sep 永远指向 /
        module.moduleId = '.' + path.posix.sep + path.posix.relative(this.context, module.resource);
        this.modules.push(module);
        const afterBuild = (err) => {
            if (module.dependencies && module.dependencies.length > 0) {
                this.processModuleDependencies(module, (err) => {
                    this.hooks.succeedModule.call(module);
                    callback(err, module);
                });
            } else {
                this.hooks.succeedModule.call(module);
                callback(err, module);
            }
        };
        this.buildModule(module, afterBuild);
        //
        // callback(null, module);

    }
    processModuleDependencies(module, afterProcessModuleDependencies) {
        //处理依赖
        let dependencies = module.dependencies;
        //1要处理的依赖，2 处理依赖的函数，每处理完一个依赖，会调一次done
        //都完成了才会调第3个参数
        async.forEach(dependencies, (dependency, done) => {
            let { name, context, rawRequest, resource, moduleId } = dependency;
            const moduleFactroy = this.dependencyFactories.get(dependency.constructor);
            const module = moduleFactroy.create({
                name, context, rawRequest, moduleId, resource, parser
            });
            this.modules.push(module);
            this._modules[moduleId] = module;
            const afterBuild = () => {
                if (module.dependencies && module.dependencies.length > 0) {
                    this.processModuleDependencies(module, err => {
                        done(null, module);
                    });
                } else {
                    return done(null, module);
                }
            };
            this.buildModule(module, afterBuild);
        }, afterProcessModuleDependencies);
    }
    buildModule(module, afterBuild) {
        this.hooks.buildModule.call(module);
        module.build(this, err => {
            return afterBuild(err);
        });
    }
}

module.exports = Compilation;