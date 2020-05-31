### 解析合并参数
* 从命令行读取参数及配置文件合并到webpack默认的配置文件
* WebpackOptionDefaulter并优化

### 编译（compilation）
* 从入口编译，将所有模块及依赖都放到的modules:[NormalModule]
    * NormalModule主要有name（划分chunk依据）和_source

* NormalModule编译
    * resolve&resolveLoader
        * 找到模块绝对路径
        * 找到loader的绝对路径，过滤及调整loaders的顺序
    * 源文件 = 读取源文件 -> run-loaders，目标是js,webpack可识别
    * 转AST、处理require和import
    * 生成新code

### seal生成chunk（compilation）
* 根据modules和name划分chunk
* 生成assets
    * 根据chunks和template生成资源
    * files['main.js'], assets:{'main.js':source}

### emit(compiler)
*  根据compilation.assets来往磁盘写文件, outputPath

## 动态导入