/**
 * 读取配置 执行compiler
 */
const path = require("path")
const Compiler = require("./Compiler")

//默认用项目根目录下的`webpack.config.js`
let configPath = path.resolve(process.cwd(), './webpack.config.js')

const config = require(configPath)
const compiler = new Compiler(config)

compiler.run()
