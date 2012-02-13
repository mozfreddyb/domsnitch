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
 * XpcMonitor watches the cross-domain communications on a page. This includes 
 * message passing through location.hash and postMessage.
 */

DOMSnitch.Heuristics.XpcMonitor = function() {
  window.addEventListener("message", this._reportPostMsg.bind(this), true);
  window.addEventListener(
      "hashchange", this._reportHashChange.bind(this), true);
  document.addEventListener(
      "DocumentDomain", this._reportDocDomainChange.bind(this), true);
  
  this._reportInitHash();
}

DOMSnitch.Heuristics.XpcMonitor.prototype = {
  _reportDocDomainChange: function(event) {
    //TODO
    var elem = event.target.documentElement;
    var domainData = JSON.parse(elem.getAttribute("docDomain"));
    elem.removeAttribute("docDomain");
    
    var data = "Old document.domain value:\n" + document.domain;
    data += "\n\n-----\n\n";
    data += "New document.domain value:\n" + domainData;
    
    var code = 3; // High
    var notes = "An attempt to overwrite document.domain to " + domainData + ".\n";
    
    this._report(data, code, notes);
  },
  
  _reportHashChange: function(event) {
    if(window.top && window.top.location == window.location) {
      return;
    }
    
    var data = "";
    var code = 1; // Low
    var oldData = event.oldURL.match(/#.*$/);
    data += "Old hash data:\n" + (oldData ? oldData[0] : "(blank)");
    data += "\n\n-----\n\n";
    
    data += "New hash data:\n" + window.location.hash;
    
    var notes = "Location.hash has changed to \""
        + window.location.hash + "\"\n";
    
    this._report(data, code, notes);
  },
  
  _reportInitHash: function() {
    if(window.top && window.top.location == window.location) {
      return;
    }
    
    if(window.location.hash.length > 0) {
      var data = "Initial hash data:\n" + window.location.hash;
      var code = 1; // Low
      var notes = "Initial location.hash set to \""
          + window.location.hash + "\"\n";
      
      this._report(data, code, notes);
    }
  },
  
  _reportPostMsg: function(event) {
    var data = "Post message data:\n" + event.data;
    data += "\n\n-----\n\n";
    data += "Post message origin:\n" + event.origin;

    var code = 1; // Low
    var notes = "Incoming post message from " + event.origin + "\n";
    this._report(data, code, notes);
  },
  
  _report: function(data, code, notes) {
    var record = {
      documentUrl: document.location.href,
      type: "XPC monitor",
      data: data,
      callStack: [],
      gid: document.location.href + "#xpcMonitor",
      env: {},
      scanInfo: {
        code: code,
        notes: notes
      }
    };
    chrome.extension.sendRequest({type: "log", record: record});
  }
}