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
 
DOMSnitch.ScriptInclusion = function() {
  this._htmlElem = document.childNodes[document.childNodes.length - 1];
  document.addEventListener("XMLHttpRequest", this._checkXhr.bind(this), true);
}

DOMSnitch.ScriptInclusion.prototype = {
  _checkBreakers: function(xhr) {
    if(xhr.responseBody.match(/^['\]\}\)]{4}\n/) || xhr.responseBody.match(/^&&&/)) {
      // Proper JavaScript interpreter breakers have been spotted
      return true;
    }
    
    if(xhr.responseBody.match(/^(while\s*\((\d+|true)\)|\/\/)/i)) {
      var code = xhr.method == "GET" ? 3 : 2; // High if over GET
      var notes = "Detected use of weak prefixes for breaking JavaScript parsing.\n";
      window.setTimeout(this._report.bind(this, xhr, code, notes), 10);
    }
    
    return false;
  },
  
  _checkCallback: function(xhr) {
    //TODO(radi): Iron out regex as to eliminate suspicions of false positives
    var match = xhr.responseBody.match(/\w+/g);
    if(match) {
      var url = xhr.requestUrl.toLowerCase();
      var callback = match[0].toLowerCase();
      
      if(url.indexOf("=" + callback) > -1) {
        var code = 2; // Medium
        var notes = "JSON served using a user-controlled callback function.\n";
        window.setTimeout(this._report.bind(this, xhr, code, notes), 10);
      }
    }
  },
  
  _checkHeaders: function(xhr) {
    var code = 0;
    var notes = "";
    var headers = xhr.responseHeaders.split("\n");
    
    var contentType = "";
    var contentDisposition = "";
    
    for(var i = 0; i < headers.length; i++) {
      var header = headers[i].match(/^([\w-]+):\s(.*)/i);
      
      if(!header) {
        continue;
      }
      
      if(header[1].match(/^content-type$/i)) {
        contentType = header[2];
      } else if(header[1].match(/^content-disposition$/i)) {
        contentDisposition = header[2];
      }
    }
    
    if(!/^application\/x-javascript; charset=utf-8$/i.test(contentType) &&
       !/^application\/json; charset=utf-8$/i.test(contentType) &&
       !/^application\/javascript; charset=utf-8$/i.test(contentType)) {
      code = 2; // Medium
      notes = "JSON served with wrong Content-Type header [value: " + contentType + "].\n";
      window.setTimeout(this._report.bind(this, xhr, code, notes), 10);
    }
    
    if(!contentDisposition.match(/^attachment/)) {
      code = 2; // Medium
      
      if(contentDisposition.length == 0) {
        notes = "JSON served with missing Content-Disposition header.\n";
      } else {
        notes = "JSON served with wrong Content-Disposition header [value: " + contentDisposition + "].\n";
      }

      window.setTimeout(this._report.bind(this, xhr, code, notes), 10);
    }
  },
  
  _checkMethod: function(xhr) {
    // If we see strong prefixes that are known to reliably break parsing,
    // then we're OK if GET is used.
    if(this._checkBreakers(xhr)) {
      return;
    }
    
    // If JSON is requested over GET, then the dev team might be adhering to a 
    // design decision. If JSON is forcefully requested over GET, then we have
    // a bug as the dev team might have not anticipated GET requests.
    var method = xhr.requestMethod.toUpperCase();
    
    if(method == "GET") {
      code = 2; // Medium
      notes = "JSON served over GET.\n";
      window.setTimeout(this._report.bind(this, xhr, code, notes), 10);
/*
    } else if(method == "POST" && !(xhr.requestUrl.match(/delete|remove/))) {
      var shadowXhr = new XMLHttpRequest;
      shadowXhr.open("GET", xhr.requestUrl, false);
      shadowXhr.send();
      
      if(shadowXhr.responseText == xhr.responseBody) {
        code = 3; // High
        notes = "Successfully forced JSON to be served over GET.\n";
        window.setTimeout(this._report.bind(this, xhr, code, notes), 10);
      }
*/
    }
  },
  
  _checkXhr: function() {
    var xhr = JSON.parse(this._htmlElem.getAttribute("xhrData"));
    this._htmlElem.removeAttribute("xhrData");
    var seemsJson = this._isJson(xhr.responseBody);

    if(seemsJson) {
      // Check for callbacks
      window.setTimeout(this._checkCallback.bind(this, xhr), 10);
      
      // Check HTTP headers
      window.setTimeout(this._checkHeaders.bind(this, xhr), 10);
      
      // Check method
      window.setTimeout(this._checkMethod.bind(this, xhr), 10);
    }
  },
  
  _isJson: function(xhrResponse) {
    var seemsJson = /\{.+\}/.test(xhrResponse);
    seemsJson = seemsJson || /\[.+\]/.test(xhrResponse);
    seemsJson = seemsJson && !(/(function|while|if)[\s\w]*\(/.test(xhrResponse));
    seemsJson = seemsJson && !(/(try|else)\s*\{/.test(xhrResponse));
    
    return seemsJson;
  },
  
  _report: function(xhr, code, notes) {
    var record = {
      documentUrl: location.href,
      type: "Script inclusion",
      data: this._stringifyXhr(xhr),
      callStack: [],
      gid: xhr.globalId,
      env: {
        location: document.location.href,
        referrer: document.referrer
      },
      scanInfo: {code: code, notes: notes}
    };
    
    chrome.extension.sendRequest({type: "log", record: record});
  },
  
  _stringifyXhr: function(xhr) {
    var request = xhr.requestMethod + " " + xhr.requestUrl + "\n";
    request += xhr.requestHeaders + "\n\n" + xhr.requestBody;
    
    var response = xhr.responseStatus + "\n";
    response += xhr.responseHeaders + "\n\n";
    response += xhr.responseBody;
    
    return "Request:\n" + request + "\n\n-----\n\nResponse:\n" + response;
  }
}