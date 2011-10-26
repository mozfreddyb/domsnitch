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
 
DOMSnitch.HttpHeaders = function() {
  window.setTimeout(this._checkOwnHeaders.bind(this), 10);
}

DOMSnitch.HttpHeaders.prototype = {
  _checkCharacterSet: function(responseHeaders) {
    for(var i = 0; i < responseHeaders.length; i++) {
      if(/^content-type:\s.*charset=/i.test(responseHeaders[i]) ||
         /^content-type: image\//i.test(responseHeaders[i]) ||
         /^content-length: 0$/i.test(responseHeaders[i])) {
        return;
      }
    }
    
    var metaElems = document.getElementsByTagName("meta");
    var metaElemsAsStr = [];
    for(var i = 0; i < metaElems.length; i++) {
      var elem = metaElems[i];
      metaElemsAsStr.push(elem.outerHTML);
      if(elem.getAttribute("http-equiv").match(/^content-type$/i) &&
         /charset=/i.test(elem.getAttribute("content"))) {
        return;
      }
    }
    
    var reportData = "Response headers:\n" + responseHeaders.join("\n");
    reportData += "\n\n-----\n\nHTML document meta:\n";
    reportData += metaElems.length > 0 ? metaElemsAsStr.join("\n") : "(none)";
    
    var code = 2; // Medium
    var notes = "No character set is defined.\n";
    this._report(reportData, code, notes);
  },
  
  _checkFrameOptions: function(responseHeaders) {
    for(var i = 0; i < responseHeaders.length; i++) {
      if(/^x-frame-options:\s(sameorigin|deny)/i.test(responseHeaders[i])) {
        return;
      }
    }

    var reportData = "Response headers:\n" + responseHeaders.join("\n");
    
    var code = 2; // Medium
    var notes = "The X-Frame-Options header is missing or not properly set.\n";
    this._report(reportData, code, notes);
  },
  
  _checkOwnHeaders: function() {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", location.href, false);
    xhr.send();
    
    var responseHeaders = xhr.getAllResponseHeaders().split("\n");
    window.setTimeout(this._checkCharacterSet.bind(this, responseHeaders), 10);
    window.setTimeout(this._checkFrameOptions.bind(this, responseHeaders), 10);
  },
  
  _report: function(reportData, code, notes) {
    var record = {
      documentUrl: location.href,
      type: "HTTP headers",
      data: reportData,
      callStack: [],
      gid: location.href + "#HTTPHeaders",
      env: {
        location: document.location.href,
        referrer: document.referrer
      },
      scanInfo: {code: code, notes: notes}
    };
          
    chrome.extension.sendRequest({type: "log", record: record});
  },
  
  _stringifyResponseHeaders: function(xhr) {
    var response = xhr.responseHeaders;

    return "Response headers:\n" + response;
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

var httpHeaders = new DOMSnitch.HttpHeaders();