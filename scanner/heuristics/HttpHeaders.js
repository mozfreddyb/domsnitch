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
 
/**
 * Check the page's own HTTP headers and look for irregularities (such as
 * missing charset, missing security headers, etc.) there.
 */
DOMSnitch.Heuristics.HttpHeaders = function() {
  window.setTimeout(this._checkOwnHeaders.bind(this), 10);
}

DOMSnitch.Heuristics.HttpHeaders.pageXhr = undefined;

DOMSnitch.Heuristics.HttpHeaders.prototype = {
  _checkCharacterSet: function(xhr) {
    var contentTypeHeader = xhr.getResponseHeader("content-type");
    var contentLengthHeader = xhr.getResponseHeader("content-length");
    if(/^.*charset=/i.test(contentTypeHeader) ||
       /^image/i.test(contentTypeHeader) || contentLengthHeader == "0" ||
       /^<html><\/html>/i.test(xhr.responseText)) {
      return;
    }
    
    var metaElems = document.getElementsByTagName("meta");
    var metaElemsAsStr = [];
    for(var i = 0; i < metaElems.length; i++) {
      var elem = metaElems[i];
      metaElemsAsStr.push(elem.outerHTML);
      
      var httpEquiv = elem.getAttribute("http-equiv");
      var content = elem.getAttribute("content");
      if((!!httpEquiv && httpEquiv.match(/^content-type$/i)) &&
         (!!content && /charset=/i.test(content))) {
        return;
      }
      
      if(!!elem.getAttribute("charset")) {
        return;
      }
    }
    
    var reportData = "Response headers:\n" + xhr.getAllResponseHeaders();
    reportData += "\n\n-----\n\nHTML document meta:\n";
    reportData += metaElems.length > 0 ? metaElemsAsStr.join("\n") : "(none)";
    
    var code = 2; // Medium
    var notes = "No character set is defined.\n";
    this._report(reportData, code, notes);
  },
  
  _checkContentTypeOptions: function(xhr) {
    var ctHeader = xhr.getResponseHeader("content-type");
    var xctoHeader = xhr.getResponseHeader("x-content-type-options");
    if(/^text\/html/.test(ctHeader) || /^nosniff/i.test(xctoHeader)) {
      return;
    }

    var reportData = "Response headers:\n" + xhr.getAllResponseHeaders();
    
    var code = 2; // Medium
    var notes = "The X-Content-Type-Options header is missing or not properly set.\n";
    this._report(reportData, code, notes);
  },

  _checkFrameOptions: function(xhr) {
    var xfoHeader = xhr.getResponseHeader("x-frame-options");
    if(/^(sameorigin|deny)/i.test(xfoHeader)) {
      return;
    }

    var reportData = "Response headers:\n" + xhr.getAllResponseHeaders();
    
    var code = 2; // Medium
    var notes = "The X-Frame-Options header is missing or not properly set.\n";
    this._report(reportData, code, notes);
  },
  
  _checkOwnHeaders: function() {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", location.href, false);
    xhr.send();

    // Leave a pointer to the XHR object in case other heuristics need to 
    // examine it.
    if(!DOMSnitch.Heuristics.HttpHeaders.pageXhr) {
      DOMSnitch.Heuristics.HttpHeaders.pageXhr = xhr;
    }
    
    // Return if the document is empty.
    if(xhr.responseText.length == 0) {
      return;
    }

    window.setTimeout(this._checkCharacterSet.bind(this, xhr), 10);
    window.setTimeout(this._checkFrameOptions.bind(this, xhr), 10);
    window.setTimeout(this._checkContentTypeOptions.bind(this, xhr), 10);
  },
  
  _report: function(reportData, code, notes) {
    var record = {
      documentUrl: location.href,
      type: "HTTP headers",
      data: reportData,
      callStack: [],
      gid: location.href + "#HTTPHeaders",
      env: {},
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