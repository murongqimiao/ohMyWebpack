const path = require("path")
const Compiler = require("./Compiler")

let configPath = path.resolve(process.cwd(), './webpack.config.js')

const config = require(configPath)

const compiler = new Compiler(config)

compiler.run()
