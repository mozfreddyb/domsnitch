/**
 * Copyright 2011 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

DOMSnitch.Scanner.IgnoreList = function() {
}

DOMSnitch.Scanner.IgnoreList.prototype = {
  _checkHttpHeaders: function(rule, record) {
    if(!rule.conditions || rule.conditions.length == 0) {
      return false;
    }

    var headers = rule.conditions.split(",");
    for(var i = 0; i < headers.length; i++) {
      var needle = headers[i];
      if(needle == "charset") {
        needle = "character set";
      }
      
      var regex = new RegExp("\\b" + needle + "\\b", "i");
      if(regex.test(record.scanInfo.notes)) {
        return true;
      }
    }
    
    return false;
  },
  
  _checkReflectedInput: function(rule, record) {
    if(!rule.conditions || rule.conditions.length == 0) {
      return false;
    }
    
    var term = rule.conditions.match(/term=([\w\\\(\)\+|?^$!\*\{\}\.,]+)/);
    term = term ? term[1] : term;
    var source = rule.conditions.match(/source=([\w,]+)/);
    source = source ? source[1] : source;
    var sink = rule.conditions.match(/sink=([\w,]+)/);
    sink = sink ? sink[1] : sink;
    
    var foundTerm = term ? false : true;
    if(term) {
      var haystack = record.scanInfo.notes.match(/[\w\s,]+\]\n$/);
      var terms = term.split(",");
      for(var i = 0; i < terms.length; i++) {
        var regex = new RegExp("\\b" + terms[i] + "\\b", "i");
        if(regex.test(haystack[0])) {
          foundTerm = true;
          break;
        }
      }
    }

    var foundSource = source ? false : true;
    if(source) {
      var sources = source.split(",");
      for(var i = 0; i < sources.length; i++) {
        var regex = new RegExp("^" + sources[i], "i");
        if(regex.test(record.scanInfo.notes)) {
          foundSource = true;
          break;
        }
      }
    }
    
    var foundSink = sink ? false : true;
    if(sink) {
      var sinks = sink.split(",");
      for(var i = 0; i < sinks.length; i++) {
        var regex = new RegExp("displayed " + sinks[i] + "\\s\\[", "i");
        if(regex.test(record.scanInfo.notes)) {
          foundSink = true;
          break;
        }
      }
    }
    
    return foundTerm & foundSource & foundSink;
  },
  
  _checkUrl: function(rule, url) {
    var urlStr = rule.url;
    urlStr = urlStr.replace(/\./g, "\\.");
    urlStr = urlStr.replace(/\*/g, ".*");
    var regex = new RegExp(urlStr, "i");
    
    return regex.test(url);
  },

  check: function(record) {
    var rules = JSON.parse(window.localStorage["ds-ignoreRules"]);
    
    var ignore = false;
    for(var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      
      if(record.type == rule.heuristic &&
            this._checkUrl(rule, record.documentUrl)) {
        if(record.type == "Reflected input") {
          ignore = ignore | this._checkReflectedInput(rule, record);
        } else if(record.type == "HTTP headers") {
          ignore = ignore | this._checkHttpHeaders(rule, record);
        }
      }
    }
    
    return ignore;
  }
}