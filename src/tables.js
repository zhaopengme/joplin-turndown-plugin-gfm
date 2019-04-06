var indexOf = Array.prototype.indexOf
var every = Array.prototype.every
var rules = {}

rules.tableCell = {
  filter: ['th', 'td'],
  replacement: function (content, node) {
    if (tableShouldBeSkipped(nodeParentTable(node))) { return content }
    return cell(content, node)
  }
}

rules.tableRow = {
  filter: 'tr',
  replacement: function (content, node) {
    const parentTable = nodeParentTable(node)
    if (tableShouldBeSkipped(parentTable)) return content

    var borderCells = ''
    var alignMap = { left: ':--', right: '--:', center: ':-:' }

    if (isHeadingRow(node)) {
      const colCount = tableColCount(parentTable)
      for (var i = 0; i < colCount; i++) {
        const childNode = colCount >= node.childNodes.length ? null : node.childNodes[i]
        var border = '---'
        var align = childNode ? (childNode.getAttribute('align') || '').toLowerCase() : ''

        if (align) border = alignMap[align] || border

        if (childNode) {
          borderCells += cell(border, node.childNodes[i])
        } else {
          borderCells += cell(border, null, i)
        }
      }
    }
    return '\n' + content + (borderCells ? '\n' + borderCells : '')
  }
}

rules.table = {
  // Only convert tables with a heading row.
  // Tables with no heading row are kept using `keep` (see below).
  filter: function (node) {
    return node.nodeName === 'TABLE'
  },

  replacement: function (content, node) {
    if (tableShouldBeSkipped(node)) return content

    // If table has no heading, add an empty one so as to get a valid Markdown table
    var firstRow = node.rows.length ? node.rows[0] : null
    var columnCount = tableColCount(node) // firstRow ? firstRow.childNodes.length : 0
    var emptyHeader = ''
    if (columnCount && !isHeadingRow(firstRow)) {
      emptyHeader = '|' + '     |'.repeat(columnCount) + '\n' + '|' + ' --- |'.repeat(columnCount)
    }

    // Ensure there are no blank lines
    content = content.replace(/\n+/g, '\n')
    return '\n\n' + emptyHeader + content + '\n\n'
  }
}

rules.tableSection = {
  filter: ['thead', 'tbody', 'tfoot'],
  replacement: function (content) {
    return content
  }
}

// A tr is a heading row if:
// - the parent is a THEAD
// - or if its the first child of the TABLE or the first TBODY (possibly
//   following a blank THEAD)
// - and every cell is a TH
function isHeadingRow (tr) {
  var parentNode = tr.parentNode
  return (
    parentNode.nodeName === 'THEAD' ||
    (
      parentNode.firstChild === tr &&
      (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
      every.call(tr.childNodes, function (n) { return n.nodeName === 'TH' })
    )
  )
}

function isFirstTbody (element) {
  var previousSibling = element.previousSibling
  return (
    element.nodeName === 'TBODY' && (
      !previousSibling ||
      (
        previousSibling.nodeName === 'THEAD' &&
        /^\s*$/i.test(previousSibling.textContent)
      )
    )
  )
}

function cell (content, node = null, index = null) {
  if (index === null) index = indexOf.call(node.parentNode.childNodes, node)
  var prefix = ' '
  if (index === 0) prefix = '| '
  let filteredContent = content.trim().replace(/\n\r/g, '<br>').replace(/\n/g, '<br>')
  while (filteredContent.length < 3) filteredContent += ' '
  if (node) filteredContent = handleColSpan(filteredContent, node, ' ')
  return prefix + filteredContent + ' |'
}

function nodeContainsTable (node) {
  if (!node.childNodes) return false

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i]
    if (child.nodeName === 'TABLE') return true
    if (nodeContainsTable(child)) return true
  }
  return false
}

// Various conditions under which a table should be skipped - i.e. each cell
// will be rendered one after the other as if they were paragraphs.
function tableShouldBeSkipped (tableNode) {
  if (!tableNode) return true
  if (!tableNode.rows) return true
  if (tableNode.rows.length <= 1 && tableNode.rows[0].childNodes.length <= 1) return true // Table with only one cell
  if (nodeContainsTable(tableNode)) return true
  return false
}

function nodeParentTable (node) {
  let parent = node.parentNode
  while (parent.nodeName !== 'TABLE') {
    parent = parent.parentNode
    if (!parent) return null
  }
  return parent
}

function handleColSpan (content, node, emptyChar) {
  const colspan = node.getAttribute('colspan') || 1
  for (let i = 1; i < colspan; i++) {
    content += ' | ' + emptyChar.repeat(3)
  }
  return content
}

function tableColCount (node) {
  let maxColCount = 0
  for (let i = 0; i < node.rows.length; i++) {
    const row = node.rows[i]
    const colCount = row.childNodes.length
    if (colCount > maxColCount) maxColCount = colCount
  }
  return maxColCount
}

export default function tables (turndownService) {
  turndownService.keep(function (node) {
    return node.nodeName === 'TABLE'
  })
  for (var key in rules) turndownService.addRule(key, rules[key])
}
