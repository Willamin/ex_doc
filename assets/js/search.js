/* globals sidebarNodes */

// Search
// ======

// Dependencies
// ------------

import $ from 'jquery'
import * as helpers from './helpers'
import resultsTemplate from './templates/search-results.handlebars'

// Local Variables
// ---------------

const $search = $('#search')
const $input = $('.sidebar-search input')

// Local Methods
// -------------

function highlight (match) {
  var start = match.index
  var end = match.index + match[0].length
  var input = match.input
  var highlighted = '<em>' + match[0] + '</em>'

  return input.slice(0, start) + highlighted + input.slice(end)
}

function cleaner (element) {
  return !!element
}

function findNested (elements, parentId, matcher, acc) {
  return (elements || []).reduce((acc, element) => {
    // Match things like module.func
    var parentMatch = (parentId + '.' + element.id).match(matcher)
    var match = element.id && element.id.match(matcher)

    if ((parentMatch || match) && !acc[element.id]) {
      var result = JSON.parse(JSON.stringify(element))
      result.match = match ? highlight(match) : element.id
      acc[result.id] = result
    }

    return acc
  }, acc || {})
}

function pushLevel (levels, searchEntity, name) {
  if (searchEntity.length > 0) {
    levels.push({name: name, results: searchEntity})
  }
}

export function findIn (elements, matcher) {
  return elements.map(function (element) {
    let title = element.title
    let titleMatch = title && title.match(matcher)
    let result = {
      id: element.id,
      match: titleMatch ? highlight(titleMatch) : element.title
    }
    let hasMatch = !!titleMatch

    if (element.nodeGroups) {
      for (let {key, nodes} of element.nodeGroups) {
        let matches = findNested(nodes, title, matcher, result[key])
        if (Object.keys(matches).length > 0) {
          hasMatch = true
          if (key === 'types' || key === 'callbacks') {
            result[key] = matches
          } else {
            result.functions = matches
          }
        }
      }
    }

    if (hasMatch) {
      for (let key in result) {
        if (key !== 'id' && key !== 'match') {
          result[key] = Object.values(result[key]).sort((a, b) => a.id.localeCompare(b.id))
        }
      }

      return result
    }
  }).filter(cleaner)
}

export function search (value) {
  var nodes = sidebarNodes

  if (value.replace(/\s/, '') !== '') {
    var safeVal = new RegExp(helpers.escapeText(value), 'i')
    var levels = []

    var modules = findIn(nodes.modules, safeVal)
    var exceptions = findIn(nodes.exceptions, safeVal)
    var tasks = findIn(nodes.tasks, safeVal)

    // add to the results
    pushLevel(levels, modules, 'Modules')
    pushLevel(levels, exceptions, 'Exceptions')
    pushLevel(levels, tasks, 'Mix Tasks')

    var results = resultsTemplate({
      value: value,
      levels: levels,
      empty: levels.length === 0
    })

    $input.val(value)
    $search.html(results)
  }
}
