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
 
DOMSnitch.Heuristics.MixedContent = function() {
  document.addEventListener("beforeload", this._handleBeforeLoad.bind(this), true);
}

DOMSnitch.Heuristics.MixedContent.prototype = {
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
  
  _handleBeforeLoad: function(event) {
    var nodeName = 
        event.target.nodeName ? event.target.nodeName.toLowerCase() : ""; 
    if(nodeName == "iframe") {
      return;
    }
    
    var code = 3; // High
    if(nodeName == "img") {
      code = 1; // Low
    } else if(nodeName == "audio" || nodeName == "video") {
      code = 2; // Medium
    }
    
    
    if(location.protocol == "https:" && event.url.match(/^http:/i)) {
      var article = nodeName.match(/^[euioa]/) ? "an" : "a";
      
      var attr = "";
      var found = false;
      for(attr in event.target) {
        var attrValue = event.target[attr];

        if(attrValue instanceof DOMStringMap) {
          continue;
        }

        if(event.target[attr] == event.url) {
          found = true;
          break;
        }
      }
      
      var source = found ? "the " + attr.toUpperCase() + " attribute" : "a child element";
      var notes = "Mixed content through the " + source +" of " + article + 
        " " + nodeName.toUpperCase() + " element.\n";
      
      var data = "URL:\n" + event.url;
      data += "\n\n-----\n\n";
      data += "HTML:\n" + event.target.outerHTML;
      
      var record = {
        documentUrl: document.location.href,
        type: "Mixed content",
        data: data,
        callStack: [],
        gid: event.target.gid ? event.target.gid : this._createGlobalId(event.target),
        env: {
          location: document.location.href,
          referrer: document.referrer
        },
        scanInfo: {
          code: code,
          notes: notes 
        }
      };
      
      this._report(record);
    }
  },
  
  _report: function(obj) {
    chrome.extension.sendRequest({type: "log", record: obj});
  }
}