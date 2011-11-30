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

DOMSnitch.Heuristics.LightDbg = function() {
  //TODO
  this._scripts = {};
  var collector = DOMSnitch.Heuristics.XhrCollector.getInstance();
  collector.addListener(this._refreshScript.bind(this));
}

DOMSnitch.Heuristics.LightDbg.getInstance = function() {
  if(!this._lightDbg) {
    this._lightDbg = new DOMSnitch.Heuristics.LightDbg();
  }
  
  return this._lightDbg;
}

DOMSnitch.Heuristics.LightDbg.prototype = {
  dummy: function() {
    return 0;
  },
  
  _getLastLine: function(stack) {
    var stackArray = stack.split("    at ");
    //console.debug(stackArray);
    
    for(var i = 1; i < stackArray.length; i++) {
      var url = stackArray[i].match(/([\w-]+:\/\/.*):(\d+):(\d+)/);
      //console.debug(url);
      if(url) {
        var line = url[2];
        var char = url[3];
        url = url[1];
        
        if(!url.match(/^chrome-extension:/i)) {
          //console.debug(url);
          return {url: url, line: line, char: char};
        }
      }
    }
  },
  
  _getOwnUrl: function() {
    var url = location.href;
    url = url.replace(location.hash, "");
    return url;
  },
  
  _getScript: function(url) {
    var script = this._scripts[url];
    
    if(!script) {
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, false);
      xhr.send();
      
      script = "" + xhr.responseText;
      this._scripts[url] = script;
    }
    
    return script;
  },
  
  _refreshScript: function(event) {
    this._scripts[this._getOwnUrl()] = "" + event.documentData;
  },
  
  collectStackTrace: function(filter) {
    if(!window.USE_DEBUG) {
      return "";
    }
    
    var stack = "";
    try {
      this._dummyCallThatDoesNotExist();
    } catch (e) {
      stack += e.stack;
    }
    
    var filterResult = filter ? filter(stack) : false;
    //console.debug(filterResult);
    return !filterResult && stack;
  },
  
  getSink: function(stack) {
    var url = this._getLastLine(stack);
    if(!url || !window.USE_DEBUG) {
      return false;
    }
    
    var script = this._getScript(url.url);
    
    var lines = script.split("\n");
    var currentLine = lines[url.line - 1];
    //console.debug(currentLine);
    
    var sink = currentLine && currentLine.substring(0, url.char);
    //console.debug(sink);
    sink = !!sink && sink.match(/(\w+)\s*=$/);
    //console.debug(!!sink && sink[1]);
    
    return !!sink && sink[1];
  },
  
  getStackTrace: function(stack, callback) {
    
  },
  
  sourceExists: function(stack, source, callback) {
    
  }
}
