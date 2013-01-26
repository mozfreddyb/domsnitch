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
 * Checks whether rendered UI elements come from a trusted origin. 
 */
DOMSnitch.Heuristics.ExternalUI = function() {
  this._dbg = DOMSnitch.Heuristics.LightDbg.getInstance();
  document.addEventListener("beforeload", this._checkIFrameSource.bind(this), true);
}

DOMSnitch.Heuristics.ExternalUI.prototype = {
  _checkIFrameSource: function(event) {
    var elem = event.target;
    if(!elem.nodeName.match(/^iframe$/i)) {
      return;
    }
    
    var regex = new RegExp("^((http|https):){0,1}\\/\\/[\\w\\.-]*" +
      this._getOwnTld(location.hostname).replace(".", "\\."), "i");
    
    if(!elem.src.match(regex)) {
      var data = "URL:\n" + event.url;
      data += "\n\n-----\n\n";
      data += "HTML:\n" + elem.outerHTML;
      data += "\n\n-----\n\n";
      data += "Raw stack trace:\n" + this._dbg.collectStackTrace();

      var record = {
        documentUrl: document.location.href,
        type: "External UI",
        data: data,
        callStack: [],
        gid: elem.gid ? elem.gid : this._createGlobalId(elem),
        env: {}
      };
      
      this._report(record);
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
  
  _getOwnTld: function(hostname) {
    var match = hostname.match(/[\w-]+\.\w{2,4}$/);
    return match ? match[0] : hostname;
  },
  
  _report: function(obj) {
    chrome.extension.sendRequest({type: "log", record: obj});
  }  
}