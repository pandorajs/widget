define(function (require, exports, module) {

'use strict';

/**
 * DAParser
 * --------
 * data api 解析器，提供对单个 element 的解析，可用来初始化页面中的所有 Widget 组件。
 *
 * @module DAParser
 * @class DAParser
 * @static
 */

var $ = require('$');

var DATA_ATTR_PREFIX = 'data-widget-';
var DATA_ATTR_PREFIX_LENGTH = 12;
var DATASET_PREFIX = 'widget';
var DATASET_PREFIX_LENGTH = 6;
var RE_DASH_WORD = /-([a-z])/g;
var JSON_LITERAL_PATTERN = /^\s*[\[{].*[\]}]\s*$/;

var parseJSON = window.JSON ? JSON.parse : $.parseJSON;

// 仅处理字母开头的，其他情况转换为小写："data-x-y-123-_A" --> xY-123-_a
function camelCase (str) {
  return str.toLowerCase().replace(RE_DASH_WORD, function (all, letter) {
    return (letter + '').toUpperCase();
  });
}

function lcFirst (str) {
  return str.replace(/^[A-Z]/, function (letter) {
    return letter.toLowerCase();
  });
}

// 解析并归一化配置中的值
function normalizeValues (data) {
  var key, val;

  for (key in data) {
    if (data.hasOwnProperty(key)) {

      val = data[key];
      if (typeof val !== 'string') {
        continue;
      }

      if (JSON_LITERAL_PATTERN.test(val)) {
        val = val.replace(/'/g, '"');
        data[key] = normalizeValues(parseJSON(val));
      } else {
        data[key] = normalizeValue(val);
      }
    }
  }

  return data;
}

// 将 'false' 转换为 false
// 'true' 转换为 true
// '3253.34' 转换为 3253.34
function normalizeValue (val) {
  if (val.toLowerCase() === 'false') {
    val = false;
  } else if (val.toLowerCase() === 'true') {
    val = true;
  } else if (/\d/.test(val) && /[^a-z]/i.test(val)) {
    var number = parseFloat(val);
    if (number + '' === val) {
      val = number;
    }
  }

  return val;
}

function parseDatas (dataset) {
  var da = {},
    name;

  for (name in dataset) {
    if (name.indexOf(DATASET_PREFIX) === 0) {
      da[lcFirst(name.substring(DATASET_PREFIX_LENGTH))] = dataset[name];
    }
  }

  return da;
}

function parseAttrs (element) {
  var da = {},
    attrs = element.attributes,
    i, len = attrs.length,
    attr, name;

  for (i = 0; i < len; i++) {
    attr = attrs[i];
    name = attr.name;

    if (name.indexOf(DATA_ATTR_PREFIX) === 0) {
      name = camelCase(name.substring(DATA_ATTR_PREFIX_LENGTH));
      da[name] = attr.value;
    }
  }

  return da;
}

/**
 * 得到某个 DOM 元素的 dataset
 *
 * @method parseElement
 * @param element
 * @param raw
 * @returns {{}}
 */
module.exports = function (element, raw) {
  var da = {};

  // ref: https://developer.mozilla.org/en/DOM/element.dataset
  if (element.dataset) {
    da = parseDatas(element.dataset);
  } else {
    da = parseAttrs(element);
  }

  return raw ? da : normalizeValues(da);
};

});
