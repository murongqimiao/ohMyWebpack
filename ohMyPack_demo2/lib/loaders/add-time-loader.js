function loader (source) {
  return source + `/** murongqimiao ${new Date().toLocaleDateString()} **/`
}
module.exports = loader