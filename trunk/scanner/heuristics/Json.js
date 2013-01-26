/**
 * Copyright 2012 Google Inc. All Rights Reserved.
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
 
DOMSnitch.Heuristics.Json = function() {
  /*
  this._dbg = DOMSnitch.Heuristics.LightDbg.getInstance();
  document.addEventListener("Eval", this._handleEval.bind(this), true);
  */
  
  // Workaround for eval().
  // More info at http://radi.r-n-d.org/2011/02/evil-magic-of-eval.html
  var collector = DOMSnitch.Heuristics.XhrCollector.getInstance();
  collector.addListener(this._checkXhr.bind(this));
  
  window.addEventListener("message", this._checkPostMsg.bind(this), true);
}

DOMSnitch.Heuristics.Json.prototype = {
  _checkJsonValidity: function(recordInfo) {
    if(!recordInfo.jsData) {
      return;
    }
    
    var code = 0; // None
    var notes = "";
   
    var jsData = recordInfo.jsData;
    var canParse = true;
    var hasCode = false;
    
    if(jsData[0] == "(" && jsData[jsData.length - 1] == ")") {
      jsData = jsData.substring(1, jsData.length - 1);
    }

    if(this._isJson(jsData)) {
      try {
        JSON.parse(jsData);
      } catch (e) {
        canParse = false;
      }
      
      jsData = jsData.replace(/,\]/g, ",null]");
      jsData = jsData.replace(/\[,/g, "[null,");
      jsData = jsData.replace(/,,/g, ",null,");
      jsData = jsData.replace(/,,/g, ",null,");
      jsData = jsData.replace(/{([\w_]+):/g, "{\"$1\":");
      jsData = jsData.replace(/,([\w_]+):/g, ",\"$1\":");
      jsData = jsData.replace(/'(\w+)'/g, "\"$1\"");
      
      try {
        JSON.parse(jsData);
      } catch (e) {
        hasCode = true;
      }

      if(!canParse) {
        code = 2; // Medium
        notes += "Malformed JSON object.\n";
      }
      
      if(!canParse && hasCode) {
        code = 2; // Medium
        notes += "Found code in JSON object.\n";
      }
    }
    
    if(code > 1) {
      var data = "JSON object:\n" + recordInfo.jsData;
      if(!!recordInfo.debugInfo) {
        data += "\n\n-----\n\n";
        data += "Raw stack trace:\n" + recordInfo.debugInfo;        
      }

      var record = {
        documentUrl: location.href,
        type: recordInfo.type,
        data: data,
        callStack: [],
        gid: recordInfo.globalId,
        env: {},
        scanInfo: {code: code, notes: notes}
      };
                        
      this._report(record);
    }    
  },
  
  _checkPostMsg: function(event) {
    var code = this._stripBreakers(event.data);
    var globalId = event.origin + "#InvalidJson";
    window.setTimeout(
      this._checkJsonValidity.bind(
        this, 
        {
          jsData: code, 
          globalId: globalId, 
          type: "Invalid JSON" 
        }
      ),
      10
    );
  },
  
  _checkXhr: function(event) {
    var xhr = event.xhr;
    var code = this._stripBreakers(xhr.responseBody);
    var globalId = xhr.requestUrl + "#InvalidJson";
    window.setTimeout(
      this._checkJsonValidity.bind(
        this, 
        {
          jsData: code, 
          globalId: globalId, 
          type: "Invalid JSON" 
        }
      ),
      10
    );
  },
  
  _handleEval: function(event) {
    var elem = event.target.documentElement;
    var args = JSON.parse(elem.getAttribute("evalArgs"));
    var code = args[0];
    var globalId = elem.getAttribute("evalGid");
    var debugInfo = this._dbg.collectStackTrace();
    
    elem.removeAttribute("evalArgs");
    elem.removeAttribute("evalGid");
    
    window.setTimeout(
      this._checkJsonValidity.bind(
        this, 
        {
          jsData: code, 
          globalId: globalId, 
          type: "Invalid JSON", 
          debugInfo: debugInfo
        }
      ),
      10
    );
  },
  
  _isJson: function(jsData) {
    var seemsJson = /\{.+\}/.test(jsData);
    seemsJson = seemsJson || /\[.+\]/.test(jsData);
    seemsJson = seemsJson && !(/(function|while|if)[\s\w]*\(/.test(jsData));
    seemsJson = seemsJson && !(/(try|else)\s*\{/.test(jsData));
    
    return seemsJson;
  },
  
  _report: function(obj) {
    chrome.extension.sendRequest({type: "log", record: obj});
  },
  
  _stripBreakers: function(jsData) {
    var cIdx = jsData.indexOf("{");
    var aIdx = jsData.indexOf("[");
    var cfIdx = jsData.lastIndexOf("}");
    var afIdx = jsData.lastIndexOf("]");
    
    var idx = 0;
    var fidx = 0;
    if(cIdx > -1 && aIdx > -1) {
      idx = cIdx > aIdx ? aIdx : cIdx;
    } else if(cIdx > -1) {
      idx = cIdx;
    } else if(aIdx > -1) {
      idx = aIdx;
    }
    
    return jsData.substring(idx);
  }
}