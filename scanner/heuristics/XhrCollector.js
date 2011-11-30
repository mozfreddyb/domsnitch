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
 
DOMSnitch.Heuristics.XhrCollector = function() {
  this._htmlElem = document.documentElement;
  document.addEventListener("XMLHttpRequest", this._dispatch.bind(this), true);

  this._eventDiv = document.createElement("div");
  this._listeners = {};
  this._nextId = 0;
}

DOMSnitch.Heuristics.XhrCollector.prototype = {
  _dispatch: function() {
    var xhr = JSON.parse(this._htmlElem.getAttribute("xhrData"));
    this._htmlElem.removeAttribute("xhrData");
    
    var event = document.createEvent("Event");
    event.initEvent("xhrCollector", true, true);
    event.xhr = xhr;
    this._eventDiv.dispatchEvent(event);
  },
  
  addListener: function(listener) {
    var id = this._nextId++;
    this._eventDiv.addEventListener("xhrCollector", listener, true);
    this._listeners[id] = listener;
    
    return id;
  },
  
  removeListener: function(id) {
    var listener = this._listeners[id];
    
    if(listener) {
      this._eventDiv.removeEventListener("xhrCollector", listener, true);
      delete this._listeners[id];
    }
  }
}

DOMSnitch.Heuristics.XhrCollector.getInstance = function() {
  if(!this._instance) {
    this._instance = new DOMSnitch.Heuristics.XhrCollector();
  }
  
  return this._instance;
}
