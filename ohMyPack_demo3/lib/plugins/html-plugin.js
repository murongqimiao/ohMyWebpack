/**
 * 按照webpack官方约定
 * webpack 插件是一个具有 apply 方法的 JavaScript 对象
 * apply 方法会被 webpack compiler 调用
 * 并且在 整个 编译生命周期都可以访问 compiler 对象
 */
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
class HtmlPlugin {
  constructor(options) {
    this.template = options.template
    this.filename = options.filename
  }

  apply (compiler) {
    compiler.hooks.afterEmit.tap('afterEmit', () => {
      /**
       * 读取模板内容
       */
      const template = fs.readFileSync(path.resolve(process.cwd(), this.template), 'utf-8')
      /**
       * 解析字符串
       */
      const $ = cheerio.load(template)

      //cheerio的api类似于jquery，这里我们生成一个script标签，并插入到body中
      const script = $(`<script src='./${compiler.output.filename}'></script>`)
      $('body').append(script)

      //基于修改后的dom重新生成字符串
      const htmlFile = $.html()
      const output = path.resolve(compiler.output.path, this.filename)
      //将字符串写入到bundle.js所在的目录
      fs.writeFileSync(output, htmlFile, 'utf-8')
    })
  }
}

module.exports = HtmlPlugin
