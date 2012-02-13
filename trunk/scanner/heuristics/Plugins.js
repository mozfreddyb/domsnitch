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
 * Check whether plug-in data and resources are loaded in a secure manner. 
 */
DOMSnitch.Heuristics.Plugins = function() {
  document.addEventListener(
      "beforeload", this._checkResourceHeaders.bind(this), true);
}

DOMSnitch.Heuristics.Plugins.prototype = {
  _checkResourceContentType: function(elem, resourceUrl, event) {
    var xhr = event.target;
    if(xhr.readyState != 4) {
      return;
    }
    
    var responseHeaders = xhr.getAllResponseHeaders();
    var xctoHeader = xhr.getResponseHeader("x-content-type-options");
    var contentDisp = xhr.getResponseHeader("content-disposition");
    
    if(/^nosniff/i.test(xctoHeader) || /^attachment/i.test(contentDisp)) {
      return;
    }
    
    var contentType = xhr.getResponseHeader("content-type");
    var expectedType = elem.getAttribute("type");
    var mismatch = !!expectedType && 
        contentType.toLowerCase().indexOf(expectedType.toLowerCase()) < 0;
    
    var found = (elem.nodeName.match(/^(script|link)$/i) &&
        /^content-type:\s+text\/plain/i.test(contentType)) || 
        (elem.nodeName.match(/^(object|embed)$/i) &&
        /^content-type:\s+application\/octet-stream/i.test(contentType));
    
    if(mismatch) {
      var code = 1; // Low
      var notes = "There is a mismatch between the content type that is " +
      		"specified inside the HTML document and the reported content type " +
      		"on the server.\n";

      var reportData = "Resource URL:\n" + resourceUrl;
      reportData += "\n\n-----\n\n";
      reportData += "Response headers:\n" + responseHeaders;
      reportData += "\n\n-----\n\n";
      reportData += "HTML:\n" + elem.outerHTML;
      
      if(found) {
        code = 2; // Medium
        notes = "Resource is loaded with a generic content type that could " +
        "trigger content sniffing.\n";
      }
      this._report(reportData, code, notes);
    }
  },
  
  _checkResourceHeaders: function(event) {
    var elem = event.target;
    var url = elem.data ? elem.data : elem.src;
    if(!url) {
      url = event.url;
    }

    if(!url.match(/^(http:|https:){0,1}\/\//i) || !!elem.visited) {
      return;
    }
    elem.visited = true;
    
    var xhr = new XMLHttpRequest;
    xhr.open("get", event.url, true);
    xhr.addEventListener(
      "readystatechange",
      this._checkResourceContentType.bind(
          this, event.target, event.url),
      true
    );
    xhr.send();
  },
  
  _report: function(reportData, code, notes) {
    var record = {
      documentUrl: location.href,
      type: "Plug-ins",
      data: reportData,
      callStack: [],
      gid: location.href + "#Plug-ins",
      env: {
        location: document.location.href,
        referrer: document.referrer
      },
      scanInfo: {code: code, notes: notes}
    };
          
    chrome.extension.sendRequest({type: "log", record: record});
  }
}