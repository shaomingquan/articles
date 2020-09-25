const fs = require('fs')
const matter = require('gray-matter')
const path = require('path')
const assert = require('assert');

const underCmd = dir => path.resolve(process.cwd(), dir)

const REPO_HOST = 'https://github.com'
const REPO = 'shaomingquan/articles'

const FILE_REPO_PATH = underCmd('./src')
const HEADER_FILE_PATH = underCmd('./HEADER.md')
const FOOTER_FILE_PATH = underCmd('./FOOTER.md')
const DRAFT_PREFIX = '_draft_'
const MAIN_PAGE_FILE = underCmd('./README.md')

const ARTICLES_BY_TIME_TITLE = '文章 (按时间)'
const ARTICLES_GROUP_YEAR_SUFFIX = '年'
const ARTICLES_GROUP_MONTH_SUFFIX = '月'

const ARTICLES_BY_TAGS_TITLE = '文章 (按标签)'
const MAX_EXPAND_CONTENT = 3

const GEN_YEAR = true
const GEN_TAGS = true

const articleInfoMatterFactory = filename => {
    const filePath = path.resolve(FILE_REPO_PATH, './' + filename + '.md')

    const parse = async function () {
        const content = await new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err)
                }
                resolve('' + data)
            })
        })
        
        const { data = {} } = matter(content)
        try {
            assert(!!data.date)
            assert(!!data.tags)
        } catch (e) {
            return
        }

        const {
            date,
            tags,
        } = data

        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        
        const tagArr = tags.split(',')
        return {
            year, month, day,
            dateStr: [year, month, day].join('-'),
            tags: tagArr,
            filename,
        }
    }

    return {
        parse,
    }
}


const groupBy = (arr, key) => {
    const ret = {}
    for (const item of arr) {
        const groupKeys = Array.isArray(item[key]) ? item[key] : [ item[key] ]
        for (const groupKey of groupKeys) {
            const arr = ret[groupKey] = ret[groupKey] || []
            arr.push(item)
        }
    }
    return ret
}

const sortNumber = (arr) => {
    return arr.sort((a, b) => {
        return - Number(a) + Number(b)
    })
}

let openCounts = MAX_EXPAND_CONTENT
const hasOpenCounts = () => openCounts >= 0
const withDetails = (title, content, open) => {
    if (open === undefined) {
        openCounts --;
        open = openCounts >= 0
    }
    return `<details ${open ? 'open' : ''}>
    <summary>${title}</summary>
    <ul>
        ${content}
    </ul>
</details>`
}
const getLinkByFileName = name => `${REPO_HOST}/${REPO}/blob/master/src/${encodeURIComponent(name)}.md`
const withUl = content => `<ul>${content}</ul>`
const makeBlogItemLi = (name, dateStr = '') => `<li><a href="${getLinkByFileName(name)}">${name}</a><span>&nbsp;${dateStr ? '[' + dateStr + ']' : ''}</span></li>`

module.exports = gen
;(require.main === module) && gen()
;async function gen () {
    const _files = fs.readdirSync(FILE_REPO_PATH)
    const header = fs.readFileSync(HEADER_FILE_PATH).toString()
    const footer = fs.readFileSync(FOOTER_FILE_PATH).toString()

    let body = ''
    let appendBody = content => (body = body + content)
    appendBody(header)
    
    const files = _files
        .filter(filename => filename.indexOf('.md') > -1 && !filename.startsWith(DRAFT_PREFIX))
        .map(filename => filename.substring(0, filename.length - 3))
    
    const contentInfos = (await Promise.all(
        files
            .map(articleInfoMatterFactory)
            .map(item => item.parse())
        )).filter(Boolean)
    
    const genYear = async () => {
        const yearAllTitle = ARTICLES_BY_TIME_TITLE
        const byYears = groupBy(contentInfos, 'year')
        const yearKeys = sortNumber(Object.keys(byYears))
        let yearChunkAll = ''
        const appednYearChunkAll = content => (yearChunkAll = yearChunkAll + content)
    
        for (const year of yearKeys) {
            const yearTitle = year + ARTICLES_GROUP_YEAR_SUFFIX
            const byMonths = groupBy(byYears[year], 'month')
            let yearChunk = ''
            const appednYearChunk = content => (yearChunk = yearChunk + content)
            
            const shouldCurYearOpen = hasOpenCounts()
            monthKeys = sortNumber(Object.keys(byMonths))
            for (const month of monthKeys) {
                const monthTitle = month + ARTICLES_GROUP_MONTH_SUFFIX
                let monthChunk = ''
                const appednMonthChunk = content => (monthChunk = monthChunk + content)
                
                const curMonthInfos = byMonths[month]
                curMonthInfos.sort((a, b) => {
                    return - Number(a.day) + Number(b.day)
                })
                
                for (const articleInfo of curMonthInfos) {
                    appednMonthChunk(makeBlogItemLi(articleInfo.filename))
                }
                
                monthChunk = withUl(monthChunk)
                monthChunk = withDetails(monthTitle, monthChunk)
                appednYearChunk(monthChunk)
            }
    
            yearChunk = withDetails(yearTitle, yearChunk, shouldCurYearOpen)
            appednYearChunkAll(yearChunk)
        }
        yearChunkAll = withDetails(yearAllTitle, yearChunkAll, true)
        appendBody(yearChunkAll)

    }

    const genTags = async () => {
        const tagsAllTitle = ARTICLES_BY_TAGS_TITLE 
        const byTags = groupBy(contentInfos, 'tags')
        let tagsAllChunk = ''
        const appendTagsAllChunk = content => (tagsAllChunk = tagsAllChunk + content)
        
        const tagKeys = sortNumber(Object.keys(byTags))
        const shouldTagOpen = hasOpenCounts()
        for (const tagKey of tagKeys) {
            const curTagTitle = tagKey
            const curTagArticles = byTags[tagKey]
            const append0 = x => x < 10 ? '0' + x : '' + x
            curTagArticles.sort((a, b) => {
                return - Number((a.year + '') + append0(a.month) + append0(a.day)) + 
                Number((b.year + '') + append0(b.month) + append0(b.day))
            })
    
            let curTagChunk = ''
            const appendCurTagChunk = content => (curTagChunk = curTagChunk + content)
            
            for (const articleInfo of curTagArticles) {
                appendCurTagChunk(makeBlogItemLi(articleInfo.filename, articleInfo.dateStr))
            }
    
            curTagChunk = withUl(curTagChunk)
            curTagChunk = withDetails(curTagTitle, curTagChunk)
            appendTagsAllChunk(curTagChunk)
        }
    
        tagsAllChunk = withDetails(tagsAllTitle, tagsAllChunk)
        appendBody(tagsAllChunk)
    }

    GEN_YEAR && genYear()
    GEN_TAGS && genTags()

    appendBody(footer)
    fs.writeFileSync(MAIN_PAGE_FILE, body)
}

