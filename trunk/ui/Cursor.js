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

DOMSnitch.UI.Cursor = function(parentViewer, options) {
  this._parentViewer = parentViewer;
  this._isVisible = false;
  this._build(options);
}

DOMSnitch.UI.Cursor.prototype = {
  _build: function(options) {
    var document = this._parentViewer.document;
    
    this._cursor = document.createElement("div");
    this._cursor.id = "cursor";
    
    for(var i = 0; i < options.length; i++) {
      var option = options[i];
      this._cursor.appendChild(this._createOption(option.title, option.click));
    }
  },
  
  _createOption: function(title, clickHandler) {
    var document = this._parentViewer.document;
    
    var option = document.createElement("div");
    option.textContent = title;
    option.addEventListener("click", clickHandler);
    option.addEventListener("click", this.hide.bind(this))
    option.addEventListener("mouseover", this._handleMouseOver.bind(this));
    option.addEventListener("mouseout", this._handleMouseOut.bind(this));
    
    return option;
  },
  
  _handleMouseOver: function(evt) {
    evt.target.className = "highlighted";
    this._parentViewer.document.body.style.cursor = "pointer";
  },
  
  _handleMouseOut: function(evt) {
    evt.target.className = "normal";
    this._parentViewer.document.body.style.cursor = "auto";
  },
  
  hide: function() {
    var document = this._parentViewer.document;
    document.body.removeChild(this._cursor);
    this._isVisible = false;
  },
  
  toggle: function() {
    if(!this._isVisible) {
      var document = this._parentViewer.document;
      document.body.appendChild(this._cursor);
      this._isVisible = true;
    } else {
      this.hide();
    }
  },
  
  toggleAt: function(top) {
    this._cursor.style.setProperty("top", top + "px");
    this.toggle();
  }
}