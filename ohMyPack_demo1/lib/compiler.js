const fs = require('fs')
const path = require('path')
const { SyncHook } = require('tapable')
const parser = require('./parser')

class Compiler {
  constructor(config) {
    // 获取配置
    this.config = config
    // 获取入口路径
    this.entry = config.entry
    // 获取出口
    this.output = config.output
    // 获取当前位置
    this.execPath = process.cwd()

    this.modules = Object.create(null)
  }

  run () {
    // 构建依赖图
    this.buildModule(path.resolve(this.execPath, this.entry))
    // 生成打包文件
    this.emitFile()
  }

  /**
   * 读取文件
   * 处理code
   * 生成module
   * return code 和他依赖的文件路径
   * {
   *  code: `balabala`,
   *  dependence: ['']
   * }
   * @param {} filename 
   * @returns 
   */
  buildModule (filename) {
    // 获取文件基于项目根目录的相对路径，作为它在module集合的key
    let key = path.relative(this.execPath, filename)
    key = './' + key.replace(/\\/g, '/')
    if (this.modules[key]) return // 不重复

    // 编译解析文件，得到转换成es5的文件源码和它的依赖数组
    /**
     * "./src/index.js": {
     *  code: "balabla",
     *  dependecies: ["./src/xinfang.js"]
     * }
     */
    const { dependencies, code } = parser.parse(filename, this.config)
    this.modules[key] = { // 生成module
      code: code,
      dependencies: dependencies
    }
    // 递归 把所有依赖拍平 生成module
    dependencies.forEach((dependency) => {
      const absPath = path.resolve(this.execPath, dependency)
      this.buildModule(absPath)
    })
  }

  /**
   *  结果参考 {
    './src/index.js':
     { code:
        '"use strict";\n\nvar _list = require("./src/list.js");\n\nvar ershou = require("./src/ershou.js");\n\nconsole.log(_list.listContain);\nconsole.log(ershou.houseName + "美滋滋");',
       dependencies: [ './src/list.js', './src/ershou.js' ] },
    './src/list.js':
     { code:
        '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.listContain = void 0;\n\nvar _ershou = require("./src/ershou.js");\n\nvar listContain = "".concat(_ershou.houseName, "\\u6253\\u5305\\u51FA\\u552E , \\u53EA\\u898150\\u5757, \\u53EA\\u898150\\u5757");\nexports.listContain = listContain;',
       dependencies: [ './src/ershou.js' ] },
    './src/ershou.js':
     { code:
        '"use strict";\n\nObject.defineProperty(exports, "__esModule", {\n  value: true\n});\nexports.houseName = void 0;\nvar houseName = \'银河湾大house\';\nexports.houseName = houseName;',
       dependencies: [] } }
   */


  emitFile () {
    const output = path.resolve(this.output.path, this.output.filename) // 输出文件路径
    let modules = ''
    Object.keys(this.modules).forEach((key) => {
      modules += `'${key}': function(require, module, exports){
        ${this.modules[key].code}
      },`

    })
    const bundle = `(function(modules){
      var installedModules = {}
      function require(filename){
        if(installedModules[filename]) {
			    return installedModules[filename].exports;		
        }

        var module = installedModules[filename] = {
          exports: {} 
        };

        var fn = modules[filename]

        fn(require, module, module.exports)
        return module.exports
      }
      require('${this.entry}')
    })({
      ${modules}
    })`
    console.log("output", output)
    fs.writeFileSync(output, bundle, 'utf-8') // 写入文件
  }
}

module.exports = Compiler