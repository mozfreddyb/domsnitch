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
 
DOMSnitch.GlobalIdManager = function() {
  document.addEventListener("DOMContentLoaded", this._handleNewNodes.bind(this), true);
  document.addEventListener("DOMNodeInsertedIntoDocument", this._handleNewNodes.bind(this), true);
}

DOMSnitch.GlobalIdManager.prototype = {
  _assignGlobalId: function(elem) {
    if(!elem.gid) {
      elem.gid = this._createGlobalId(elem);
    }
    
    for(var i = 0; elem instanceof HTMLElement && i < elem.children.length; i++) {
      this._assignGlobalId(elem.children[i]);
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
  
  _handleNewNodes: function(event) {
    this._assignGlobalId(event.target);
  }
}

globalId = new DOMSnitch.GlobalIdManager();