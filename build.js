const fs = require('fs')
const matter = require('gray-matter')
const path = require('path')
const assert = require('assert');

const articleInfoMatterFactory = filename => {
    const filePath = path.resolve('./src/' + filename + '.md')

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
            tags: tagArr,
            filename,
        }
    }

    return {
        parse,
    }
}


function groupBy (arr, key) {
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

let openCounts = 3
const hasOpenCounts = () => openCounts >= 0
const withDetails = (title, content, open = false) => {
    if (open === undefined) {
        open = openCounts >= 0
        openCounts --;
    }
    return `<details ${open ? 'open' : ''}>
    <summary>${title}</summary>
    <ul>
        ${content}
    </ul>
</details>`
}
const getLinkByFileName = name => `https://github.com/shaomingquan/articles/blob/master/src/${encodeURIComponent(name)}.md`
const withUl = content => `<ul>${content}</ul>`
const makeBlogItemLi = name => `<li><a href="${getLinkByFileName(name)}">${name}</a></li>`

const _files = fs.readdirSync('./src')
const header = fs.readFileSync('./_README.md').toString()

;(async function () {
    let body = ''
    let appendBody = content => (body = body + content)
    appendBody(header)
    
    const files = _files
        .filter(filename => filename.indexOf('.md') > -1 && !filename.startsWith('_draft_'))
        .map(filename => filename.substring(0, filename.length - 3))
    
    const contentInfos = (await Promise.all(
        files
            .map(articleInfoMatterFactory)
            .map(item => item.parse())
        )).filter(Boolean)
    
    //////////////////////////////  gen years  ////////////////////////////////

    const yearAllTitle = 'articles by time'
    const byYears = groupBy(contentInfos, 'year')
    const yearKeys = sortNumber(Object.keys(byYears))
    let yearChunkAll = ''
    const appednYearChunkAll = content => (yearChunkAll = yearChunkAll + content)


    for (const year of yearKeys) {
        const yearTitle = year + '年'
        const byMonths = groupBy(byYears[year], 'month')
        let yearChunk = ''
        const appednYearChunk = content => (yearChunk = yearChunk + content)
        
        const shouldCurYearOpen = hasOpenCounts()
        monthKeys = sortNumber(Object.keys(byMonths))
        for (const month of monthKeys) {
            const monthTitle = month + '月'
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

    fs.writeFileSync('./README.md', body)
})()


