const fs = require('fs')

const getLinkByFileName = name => `https://github.com/shaomingquan/articles/blob/master/src/${encodeURIComponent(name)}.md`

const makeBlogItem = name => `- [${name}](${getLinkByFileName(name)})
`

const _files = fs.readdirSync('./src')

const header = fs.readFileSync('./_README.md').toString()

const divider = `

---------------------------articles----------------------------

`

let body = ''

const files = _files
.filter(filename => filename.indexOf('.md') > -1 && !filename.startsWith('_draft_'))
.map(filename => filename.substring(0, filename.length - 3))

files.forEach(filename => (body += makeBlogItem(filename)))

fs.writeFileSync('./README.md', header + divider + body)