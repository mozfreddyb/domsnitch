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
 
DOMSnitch.ScriptSource = function() {
  document.addEventListener("beforeload", this._checkScriptSource.bind(this), true);
  document.addEventListener("beforeload", this._checkEmbedSource.bind(this), true);
}

DOMSnitch.ScriptSource.prototype = {
  _checkEmbedSource: function(event) {
    if(event.target.nodeName != "EMBED" || event.url == "") {
      return;
    }
    
    var safeOrigins = [
      location.hostname
    ];

    // Add the safe origins from crossdomain.xml
    var xhr = new XMLHttpRequest;
    xhr.open("GET", location.origin + "/crossdomain.xml", false);
    xhr.send();
    
    var allowAccessDirectives = xhr.responseText.match(/<allow-access-from.*/g);
    for(var i = 0; allowAccessDirectives && i < allowAccessDirectives.length; i++) {
      var directive = allowAccessDirectives[i];
      var origin = /domain=['"]([\w\.\*-]+)['"]/.exec(directive);
      
      if(origin) {
        console.debug("safe origin per crossdomain.xml: " + origin[1].replace(/^\*\./, ""));
        safeOrigins.push(origin[1].replace(/^\*\./, ""));
      }
    }
    
    var elem = event.target;
    var regex = new RegExp("^((http|https):){0,1}\\/\\/[\\w\\.-]*" +
      location.hostname.replace(".", "\\."), "i");

    var isTrustedSource = false;
    for(var i = 0; i < safeOrigins.length; i++) {
      var regex = new RegExp("^((http|https):){0,1}\\/\\/[\\w\\.-]*" +
        safeOrigins[i].replace(".", "\\."), "i");
      if(elem.src.match(regex)) {
        isTrustedSource = true;
        break;
      }
    }

    if(!isTrustedSource) {
      console.debug(event.url);
      var data = "URL:\n" + event.url;
      data += "\n\n-----\n\n";
      data += "HTML:\n" + elem.outerHTML;

      var record = {
        documentUrl: document.location.href,
        type: "Untrusted code",
        data: data,
        callStack: [],
        gid: event.target.gid ? event.target.gid : this._createGlobalId(event.target),
        env: {
          location: document.location.href,
          referrer: document.referrer
        }
      };

      this._report(record);
    }
  },
  
  _checkScriptSource: function(event) {
    var elem = event.target;
    var src = null;
    if(elem.nodeName == "SCRIPT") {
      src = elem.src;
    } else if(elem.nodeName == "LINK" && event.url.match(/\.css$/)) {      
      src = elem.href;
    } else {
      return;
    }
    
    var regex = new RegExp("^((http|https):){0,1}\\/\\/[\\w\\.-]*" +
      this._getOwnTld().replace(".", "\\."), "i");
    
    if(!src.match(regex)) {
      var data = "URL:\n" + event.url;
      data += "\n\n-----\n\n";
      data += "HTML:\n" + elem.outerHTML;

      var record = {
        documentUrl: document.location.href,
        type: "Untrusted code",
        data: data,
        callStack: [],
        gid: event.target.gid ? event.target.gid : this._createGlobalId(event.target),
        env: {
          location: document.location.href,
          referrer: document.referrer
        }
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
  
  _getOwnTld: function() {
    if(/^(\d+\.){4}$/.test(location.hostname)) {
      return location.hostname;
    } else {
      var match = location.hostname.match(/[\w-]+\.\w+$/);
      return match ? match[0] : location.hostname;
    }
  },
  
  _report: function(obj) {
    chrome.extension.sendRequest({type: "log", record: obj});
  }  
}

var scriptSource = new DOMSnitch.ScriptSource();