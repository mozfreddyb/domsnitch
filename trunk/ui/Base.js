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

DOMSnitch.UI.Base = function() {
  this._window = undefined;
  this._scanner = new DOMSnitch.Scanner();
}

DOMSnitch.UI.Base.prototype = {
  get document() {
    if(!this._window || this._window.closed) {
      return undefined;
    }
    
    return this._window.document;
  },
  
  _build: function() {
    throw new Error("_build() is not implemented.");
  },
  
  _clear: function() {
    var document = this.document;
    var contentTable = document.getElementById("contentTable");
    var titleRow = document.getElementById("titleRow");
    
    contentTable.textContent = "";
    contentTable.appendChild(titleRow);
  },
  
  _createHtmlElement: function(type, className, content) {
    var document = this.document;
    var elem = document.createElement(type);
    
    if(className) {
      elem.className = className;
    }
    
    if(content) {
      elem.innerText = content;
    }
    
    return elem;
  },
  
  _setTitle: function(title) {
    this.document.title = title;
  },
  
  _setTitleRow: function(columnTitles) {
    var document = this.document;
    var titleRow = document.getElementById("titleRow");
    titleRow.textContent = "";
    
    for(var i = 0; i < columnTitles.length; i++) {
      var title = document.createElement("td");
      title.innerText = columnTitles[i].title;
      if(columnTitles[i].click) {
        title.addEventListener("click", columnTitles[i].click);
        title.addEventListener("mouseover", this._handleMouseOver.bind(this));
        title.addEventListener("mouseout", this._handleMouseOut.bind(this));
      }
      titleRow.appendChild(title);
    }
  },
  
  _setTopMenu: function(menuItems) {
    var document = this.document;
    var menuStrip = document.getElementById("topMenu");
    menuStrip.textContent = "";
    
    for(var i = 0; i < menuItems.length; i++) {
      if(i > 0) {
        menuStrip.appendChild(document.createTextNode(" | "));
      }
      
      var item = document.createElement("a");
      item.innerText = menuItems[i].title;
      if(menuItems[i].caption) {
        item.title = menuItems[i].caption;
      }
      item.addEventListener("click", menuItems[i].click);
      item.addEventListener("mouseover", this._handleMouseOver.bind(this));
      item.addEventListener("mouseout", this._handleMouseOut.bind(this));
      menuStrip.appendChild(item);
    }
  },
    
  displayRecord: function(record) {
    throw new Error("displayRecord() is not implemented.");
  },
  
  hideViewer: function() {
    if(!this._window.closed) {
      this._window.close();
    }
  },
  
  showViewer: function() {
    this._window = window.open(this._htmlFile, this._windowName);
    this._window.addEventListener("load", this._build.bind(this));
  }
}