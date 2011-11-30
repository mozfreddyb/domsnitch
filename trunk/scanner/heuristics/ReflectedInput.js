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
 
DOMSnitch.Heuristics.ReflectedInput = function() {
  this._dbg = DOMSnitch.Heuristics.LightDbg.getInstance();
  
  document.addEventListener("DOMNodeInsertedIntoDocument", this._checkHtml.bind(this), true);
  document.addEventListener("DOMSubtreeModified", this._checkText.bind(this), true);
  
  this._htmlElem = document.documentElement;
  document.addEventListener("BeforeDocumentWrite", this._persistPostMsgIndex.bind(this), true);
  document.addEventListener("DocumentWrite", this._checkDocWrite.bind(this), true);
  
  this._type = "Reflected input";
  
  this._postMsgCount = 0;
  this._globalPostMsgIndex = [];
  this._globalPostMsgDict = {};
  window.addEventListener("message", this._captureMessageEvents.bind(this), true);
  
  this._unescapedSearchData = unescape(location.search);
  this._unescapedReferrerData = unescape(document.referrer).replace(location.hostname, "");
  this._tokenizedSearchData = this._tokenizeHaystack(location.search);
  this._tokenizedReferrerData = this._tokenizeHaystack(document.referrer.replace(location.hostname, ""));
}

DOMSnitch.Heuristics.ReflectedInput.prototype = {
  _buildReport: function(recordInfo, foundValues) {
    var elem = recordInfo.elem;
    var data = "Rendered content:\n";
    data += elem instanceof HTMLElement ? elem.outerHTML : elem.textContent;
  
    var from = "";
    if(recordInfo.source == "Post message") {
      var postMsg = this._globalPostMsgDict[foundValues[0]];
      from = "from " + postMsg.origin + " ";
      data += "\n\n-----\n\n";
      data += "Post message data:\n" + postMsg.data;
      data += "\n\n-----\n\n";
      data += "Post message origin:\n" + postMsg.origin;
    }
  
    var code = recordInfo.code ? recordInfo.code : 2; // Medium ranking
    var notes = recordInfo.source +" data " + from + "found in displayed " + 
      recordInfo.sink + " [value(s): " + foundValues.join(", ") + "]\n";
    
    var record = {
      documentUrl: location.href,
      type: recordInfo.type,
      data: data,
      callStack: [],
      gid: elem.gid ? elem.gid : this._createGlobalId(elem),
      env: {
        location: document.location.href,
        referrer: document.referrer,
      },
      scanInfo: {code: code, notes: notes}
    };

    this._report(record);
  },
  
  _captureMessageEvents: function(event) {
    window.setTimeout(this._processMessageEvent.bind(this, event.data, event.origin), 10);
  },

  _checkDocWrite: function() {
    //this._dbg.collectStackTrace();
    console.debug("_checkDocWrite() called.");
    
    this._globalPostMsgIndex = JSON.parse(window.localStorage["ds-pm-index"]);
    delete window.localStorage["ds-pm-index"];
    this._globalPostMsgDict = JSON.parse(window.localStorage["ds-pm-raw"]);
    delete window.localStorage["ds-pm-raw"];

    // A hack to preserve the value of document.all
    var allElements = [].concat(document.all);
    for(var i = 0; i < allElements[0].length; i++) {
      this._checkElem(allElements[0][i]);
    }
  },
  
  _checkElem: function(elem, debugInfo) {
    var type = this._type;
    var attributes = [];
    for(var i = 0; i < elem.attributes.length; i++) {
      var attr = elem.attributes[i].nodeValue;
      var name = elem.attributes[i].nodeName;
      if(!name.match(/^(href|src|data|style|(on.+)|value|action|method)$/)) {
        continue;
      }
      if(attr.length > 3 && isNaN(parseInt(attr))) {
        if(name.match(/^on/)) {
          attributes = attributes.concat(attr.match(/\w+/g));          
        } else {
          attributes.push(attr);
        }
      }
    }

    var postMsgIndex = [].concat(this._globalPostMsgIndex);
    if(attributes.length > 0) {
      //TODO(radi): Add check against local/session storage
      var haystacks = [
        {name: "Hash", data: unescape(location.hash)},
        {name: "Search", data: this._unescapedSearchData},
        {name: "Referrer", data: this._unescapedReferrerData},
        {name: "Cookie", data: unescape(document.cookie)},
        {name: "Post message", data: postMsgIndex}
      ];
      
      for(var i = 0; i < haystacks.length; i++) {
        var haystack = haystacks[i];
        window.setTimeout(
          this._checkParams.bind(
            this, 
            {
              source: haystack.name, 
              sink: "attribute", 
              type: type, 
              elem: elem,
              debugInfo: debugInfo
            },
            haystack.data,
            attributes
          ), 
          10
        );
      }
    }

    var inspectHtml = !(elem instanceof HTMLStyleElement);
    inspectHtml = inspectHtml && !(elem instanceof HTMLScriptElement);
    inspectHtml = inspectHtml && elem.children.length == 0; 
    if(inspectHtml) {
      var tokens = elem.innerHTML.match(/\w+/g);

      //TODO(radi): Add check against local/session storage
      var haystacks = [
        {name: "Hash", data: this._tokenizeHaystack(location.hash)},
        {name: "Search", data: this._tokenizedSearchData},
        {name: "Referrer", data: this._tokenizedReferrerData},
        {name: "Cookie", data: this._tokenizeHaystack(document.cookie)},
        {name: "Post message", data: postMsgIndex}
      ];
                     
      for(var i = 0; i < haystacks.length; i++) {
        var haystack = haystacks[i];
        window.setTimeout(
          this._checkParams.bind(
            this, 
            {
              source: haystack.name, 
              sink: "innerHTML", 
              type: type, 
              elem: elem,
              debugInfo: debugInfo
            },
            haystack.data,
            tokens,
            true
          ), 
          10
        );
      }
    }
  },
  
  _checkHtml: function(event) {
    if(event.target instanceof HTMLElement) {
      var stack = this._dbg.collectStackTrace(this._dbgStackFilter);
      if(window.USE_DEBUG && !stack) {
        return;
      }
      
      var elem = event.target;

      window.setTimeout(this._checkElem.bind(this, elem, stack), 10);
    }
  },
  
  _checkParams: function(recordInfo, haystack, params, inTextNode) {
    if(!haystack || !params) {
      return;
    }

    var minSize = inTextNode ? 3 : 1;
    if(window.USE_DEBUG && !!recordInfo.debugInfo) {
      var sink = this._dbg.getSink(recordInfo.debugInfo);
      if(!!sink) {
        minSize = 0;
      } else {
        return;
      }
    }

    var foundValues = [];
    var valuesMap = {};
    var bannedParams = /^(true|false|org|com|http|https)$/i;
    var haystackIsArray = haystack instanceof Array;
    var processedHaystack = haystackIsArray ? haystack.join(" ") : haystack;
    processedHaystack = " " + (inTextNode ? processedHaystack : processedHaystack.toLowerCase()) + " ";
    
    if(inTextNode && haystackIsArray) {
      for(var i = 0; i < params.length; i++) {
        if(bannedParams.test(params[i])) {
          params.splice(i, 1);
          i--;
        }
      }
      foundValues = this._findOverlap(params, haystack, true);
    } else {
      for(var i = 0; i < params.length; i++) {
        var value = params[i];
        
        if(value.length > minSize && isNaN(parseInt(value))) {
          var lcValue = inTextNode ? value : value.toLowerCase();
          if(bannedParams.test(lcValue)) {
            continue;
          }
          var exists = false;
          if(haystackIsArray) {
            exists = processedHaystack.indexOf(" " + lcValue + " ") > -1;
          } else {
            exists = exists || haystack.indexOf("=" + lcValue) > -1;
            exists = exists || haystack.indexOf("='" + lcValue) > -1;
            exists = exists || haystack.indexOf("=\"" + lcValue) > -1;
            exists = exists || haystack.indexOf("=`" + lcValue) > -1;
          }
          
          if(exists && valuesMap[lcValue] != true) {
            foundValues.push(value);
            valuesMap[lcValue] = true;
          }
        }
      }
    }

    if(foundValues.length > 0) {
      //TODO(radi): Invoke debugger and determine if exploitable
      window.setTimeout(this._buildReport.bind(this, recordInfo, foundValues), 10);
    }
  },
  
  _checkText: function(event) {
    if(event.target instanceof Text) {
      var debugInfo = this._dbg.collectStackTrace(this._dbgStackFilter);
      if(!debugInfo) {
        return;
      }
      
      var elem = event.target;
      var tokens = elem.textContent.match(/\w+/g);
      var postMsgIndex = [].concat(this._globalPostMsgIndex);
      
      //TODO(radi): Add check against local/session storage
      var haystacks = [
        {name: "Hash", data: this._tokenizeHaystack(location.hash)},
        {name: "Search", data: this._tokenizedSearchData},
        {name: "Referrer", data: this._tokenizedReferrerData},
        {name: "Cookie", data: this._tokenizeHaystack(document.cookie)},
        {name: "Post message", data: postMsgIndex}
      ];
                     
      for(var i = 0; i < haystacks.length; i++) {
        var haystack = haystacks[i];
        window.setTimeout(
          this._checkParams.bind(
            this, 
            {
              source: haystack.name, 
              sink: "text", 
              type: this._type, 
              elem: elem,
              debugInfo: debugInfo
            },
            haystack.data,
            tokens,
            true
          ), 
          10
        );
      }
    }
  },
  
  _createGlobalId: function(elem) {
    var baseUrl = document.location.origin + document.location.pathname + "#"; 
    var gid = elem.id;
    if(gid && gid.length > 0) {
      return baseUrl + gid;
    }
    
    gid = elem.parentElement ? elem.parentElement.gid : "";
    if(!gid || gid.length == 0) {
      gid = baseUrl;
    } else {
      gid += "/";
    }
    
    if(elem.className && elem.className.length) {
      return gid + elem.className;
    }
    
    return gid + elem.nodeName;
  },
  
  _dbgStackFilter: function(stack) {
    var stackArray = stack.split("    at ");
    var stackFrame = stackArray[3];
    return !!stackFrame && !!stackFrame.match(/^object\._createelement/i);
  },
  
  _findOverlap: function(listA, listB, isSorted) {
    if(!isSorted) {
      listA = this._removeDuplicates(listA.sort());
      listB = this._removeDuplicates(listB.sort());
    }
    
    var overlap = [];
    var listBStr = listB.join(" ");
    for(var i = 0; i < listA.length; i++) {
      if(parseInt(listA[i])) {
        continue;
      }
      var regex = new RegExp("\\b" + listA[i] + "\\b");
      if(regex.test(listBStr)) {
        overlap.push(listA[i]);
      }
    }
       
    return overlap;
  },
  
  _persistPostMsgIndex: function() {
    window.localStorage["ds-pm-index"] = JSON.stringify(this._globalPostMsgIndex);
    window.localStorage["ds-pm-raw"] = JSON.stringify(this._globalPostMsgDict);
  },
  
  _processMessageEvent: function(data, origin) {
    var keywords = data.match(/\w+/g);
    for(var i = 0; i < keywords.length; i++) {
      var keyword = keywords[i];
      if(keyword.length > 1 && isNaN(parseInt(keyword))) {
        this._globalPostMsgIndex.push(keyword);
        this._globalPostMsgDict[keyword] = {data: data, origin: origin}; 

        if(this._globalPostMsgIndex.length > 50) {
          var keywordToDiscard = this._globalPostMsgIndex[0];
          this._globalPostMsgIndex = this._globalPostMsgIndex.slice(1);
        }
      }
    }
  },
  
  _removeDuplicates: function(list) {
    for(var i = 1; i < list.length; i++) {
      if(list[i] == list[i - 1]) {
        list.splice(i, 1);
        i--;
      }
    }
    
    return list;
  },
  
  _report: function(obj) {
    chrome.extension.sendRequest({type: "log", record: obj});
  },
  
  _tokenizeHaystack: function(haystack) {
    return (unescape(haystack)).match(/\w+/g);
  }
}