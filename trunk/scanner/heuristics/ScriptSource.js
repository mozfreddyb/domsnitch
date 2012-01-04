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
 * Checks whether executable content, in the form of JavaScript, cascading
 * style sheets, and Flash movies, is loaded from a trusted origin. 
 */
DOMSnitch.Heuristics.ScriptSource = function() {
  this._dbg = DOMSnitch.Heuristics.LightDbg.getInstance();
  document.addEventListener("beforeload", this._checkScriptSource.bind(this), true);
  document.addEventListener("beforeload", this._getEmbedSource.bind(this), true);
}

DOMSnitch.Heuristics.ScriptSource.prototype = {
  _checkEmbedAttributes: function(elem, debugInfo) {
    // Only checking Flash movies that are loaded over <embed/>.
    // TODO(radi): Check Flash movies that are loaded over <object/>.
    if(!elem.src.match(/\.swf$/i)) {
      return;
    }
    
    var code = 0;
    var notes = "";
    
    var scriptAccess = elem.getAttribute("allowScriptAccess");
    if(scriptAccess && !!scriptAccess.match(/^always$/i)) {
      code = 2; // Medium
      notes += "Loading Flash movie with allowScriptAccess set to \"always\".\n";
    }

    // Check content-type
    var type = elem.getAttribute("type");
    if(!type || !type.match(/^application\/x-shockwave-flash$/i)) {
      code = 3; // High
      notes += "Loading Flash movie using wrong content type.\n";
    }
    
    if(code > 0) {
      var data = "HTML:\n" + elem.outerHTML;
      data += "\n\n-----\n\n";
      data += "Raw stack trace:\n" + debugInfo;

      var record = {
        documentUrl: document.location.href,
        type: "Untrusted code",
        data: data,
        callStack: [],
        gid: elem.gid ? elem.gid : this._createGlobalId(elem),
        env: {},
        scanInfo: {
          code: code,
          notes: notes
        }
      };

      this._report(record);
    }
  },
  
  _checkEmbedSource: function(elem, url, debugInfo, event) {
    var xhr = event.target;
    var safeOrigins = [location.hostname];
    
    var allowAccessDirectives = xhr.responseText.match(/<allow-access-from.*/g);
    for(var i = 0; allowAccessDirectives && i < allowAccessDirectives.length; i++) {
      var directive = allowAccessDirectives[i];
      var origin = /domain=['"]([\w\.\*-]+)['"]/.exec(directive);
      
      if(origin) {
        console.debug("safe origin per crossdomain.xml: " + origin[1].replace(/^\*\./, ""));
        safeOrigins.push(origin[1].replace(/^\*\./, ""));
      }
    }
    
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
      var data = "URL:\n" + url;
      data += "\n\n-----\n\n";
      data += "HTML:\n" + elem.outerHTML;
      data += "\n\n-----\n\n";
      data += "Raw stack trace:\n" + debugInfo;

      var record = {
        documentUrl: document.location.href,
        type: "Untrusted code",
        data: data,
        callStack: [],
        gid: elem.gid ? elem.gid : this._createGlobalId(elem),
        env: {}
      };

      this._report(record);
    }
  },
  
  _checkScriptSource: function(event) {
    var elem = event.target;
    var src = null;
    if(elem.nodeName == "SCRIPT") {
      src = elem.src;
    } else if(!!elem.nodeName.match(/^link$/i) && event.url.match(/\.css$/)) {      
      src = elem.href;
    } else {
      return;
    }
    
    var regex = new RegExp("^((http|https):){0,1}\\/\\/[\\w\\.-]*" +
      this._getOwnTld(location.hostname).replace(".", "\\."), "i");
    
    if(!src.match(regex)) {
      var data = "URL:\n" + event.url;
      data += "\n\n-----\n\n";
      data += "HTML:\n" + elem.outerHTML;
      data += "\n\n-----\n\n";
      data += "Raw stack trace:\n" + this._dbg.collectStackTrace();

      var record = {
        documentUrl: document.location.href,
        type: "Untrusted code",
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
  
  _getEmbedSource: function(event) {
    //TODO
    var elem = event.target;
    if(!elem.nodeName.match(/^embed$/i) || event.url == "") {
      return;
    }
    
    var debugInfo = this._dbg.collectStackTrace();
    window.setTimeout(
        this._checkEmbedAttributes.bind(this, elem, debugInfo), 10);
    
    // Add the safe origins from crossdomain.xml
    var timestamp = new Date(0);
    var xhr = new XMLHttpRequest;
    xhr.open("GET", location.origin + "/crossdomain.xml", false);
    xhr.setRequestHeader("If-Modified-Since", timestamp.toUTCString());
    xhr.addEventListener(
      "readystatechange",
      this._checkEmbedSource.bind(this, elem, event.url, debugInfo),
      true
    );
    xhr.send();
  },
  
  _getOwnTld: function(hostname) {
    var match = hostname.match(/[\w-]+\.\w{2,4}$/);
    return match ? match[0] : hostname;
  },
  
  _report: function(obj) {
    chrome.extension.sendRequest({type: "log", record: obj});
  }  
}