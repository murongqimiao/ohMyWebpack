/**
 * parse 用来把目标代码转成abstrack syntax tree
 */
const fs = require('fs')
const path = require('path')
const babelParser = require("@babel/parser")
const traverse = require("@babel/traverse").default
const babel = require('@babel/core')
const root = process.cwd()

module.exports = {
  genAST (filename, config) {
    const sourceCode = fs.readFileSync(filename, 'utf8')
    const ast = babelParser.parse(sourceCode, {
      sourceType: 'module'   //'import' and 'export' may appear only with 'sourceType: "module"'
    })
    return ast.program
  },
  parse (filename, config) {
    // console.log(filename)
    const ast = this.genAST(filename, config)
    // console.log("ast->", ast)
    /** 符合 Esprima规范的ast
     *`Node {
      type: 'Program',
      start: 0,
      end: 140,
      loc:
       SourceLocation {
         start: Position { line: 1, column: 0 },
         end: Position { line: 4, column: 37 },
         filename: undefined,
         identifierName: undefined },
      range: undefined,
      leadingComments: undefined,
      trailingComments: undefined,
      innerComments: undefined,
      extra: undefined,
      sourceType: 'module',
      interpreter: null,
      body:
       [ Node {
           type: 'ImportDeclaration',
           start: 0,
           end: 39,
           loc: [SourceLocation],
           range: undefined,
           leadingComments: undefined,
           trailingComments: undefined,
           innerComments: undefined,
           extra: undefined,
           specifiers: [Array],
           source: [Node] },
         Node {
           type: 'VariableDeclaration',
           start: 40,
           end: 77,
           loc: [SourceLocation],
           range: undefined,
           leadingComments: undefined,
           trailingComments: undefined,
           innerComments: undefined,
           extra: undefined,
           declarations: [Array],
           kind: 'const' },
         Node {
           type: 'ExpressionStatement',
           start: 78,
           end: 102,
           loc: [SourceLocation],
           range: undefined,
           leadingComments: undefined,
           trailingComments: undefined,
           innerComments: undefined,
           extra: undefined,
           expression: [Node] },
         Node {
           type: 'ExpressionStatement',
           start: 103,
           end: 140,
           loc: [SourceLocation],
           range: undefined,
           leadingComments: undefined,
           trailingComments: undefined,
           innerComments: undefined,
           extra: undefined,
           expression: [Node] } ],
      directives: [] }`
     */

    const dependencies = []
    const dirname = path.dirname(filename)
    traverse(ast, {
      CallExpression ({ node }) {
        if (node.callee.name === 'require') { // 如果是require的依赖
          let moduleFile = path.resolve(dirname, node.arguments[0].value)
          moduleFile = path.relative(root, moduleFile)
          moduleFile = './' + moduleFile.replace(/\\/g, '/')
          node.arguments[0].value = moduleFile
          dependencies.push(moduleFile) // 遍历依赖文件 在modules中追加
        }
      },
      ImportDeclaration ({ node }) { // 如果是import的依赖
        let moduleFile = path.resolve(dirname, node.source.value)
        moduleFile = path.relative(root, moduleFile)
        moduleFile = './' + moduleFile.replace(/\\/g, '/')
        node.source.value = moduleFile
        dependencies.push(moduleFile) // 遍历依赖文件, 在modules中追加
      }
    })
    const { code } = babel.transformFromAst(ast, null, { // 转es5
      presets: ["@babel/preset-env"]
    })
    return {
      code,
      dependencies
    }
  }
}