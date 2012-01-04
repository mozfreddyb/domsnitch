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

DOMSnitch.UI.Config.Page = function() {
}

DOMSnitch.UI.Config.Page.prototype = {
  get title() {
    return this._title;
  },
  
  _createDialog: function(document, title, contents) {
    var dialog = document.createElement("div");
    dialog.className = "dialog-block";
    
    var dialogTitle = document.createElement("div");
    dialogTitle.className = "dialog-title";
    dialogTitle.textContent = title;
    
    
    var dialogContent = document.createElement("div");
    dialogContent.className = "dialog-content";
    
    for(var i = 0; i < contents.length; i++) {
      var elemDesc = contents[i];
      
      if(!elemDesc.tag) {
        continue;
      }
      
      var elem = this._createElement(document, elemDesc);      
      dialogContent.appendChild(elem);
    }
    
    dialog.appendChild(dialogTitle);
    dialog.appendChild(dialogContent);
    
    return dialog;
  },
  
  _createSection: function(document, title, contents) {
    var section = document.createElement("div");
    section.className = "section-block";
    
    var sectionTitle = document.createElement("div");
    sectionTitle.className = "section-title";
    sectionTitle.textContent = title;
    
    
    var sectionContent = document.createElement("div");
    sectionContent.className = "section-content";
    
    for(var i = 0; i < contents.length; i++) {
      var elemDesc = contents[i];
      
      if(!elemDesc.tag) {
        continue;
      }
      
      var elem = this._createElement(document, elemDesc);      
      sectionContent.appendChild(elem);
    }
    
    section.appendChild(sectionTitle);
    section.appendChild(sectionContent);
    
    return section;
  },
  
  _createElement: function(document, elemDesc) {
    var elem = document.createElement(elemDesc.tag);

    for(var i = 0; elemDesc.attr && i < elemDesc.attr.length; i++) {
      var attr = elemDesc.attr[i];
      var idx = attr.indexOf("=");
      var name = attr.substring(0, idx);
      var value = attr.substring(idx + 1);
      if(name == "checked") {
        elem.checked = value == "true";
      } else {
        elem.setAttribute(name, value.trim());
      }
    }
    
    if(elemDesc.text) {
      elem.textContent = elemDesc.text;
    }
    
    if(elemDesc.click) {
      elem.addEventListener("click", elemDesc.click, true);
    }
    
    for(var i = 0; elemDesc.children && i < elemDesc.children.length; i++) {
      elem.appendChild(this._createElement(document, elemDesc.children[i]));
    }

    return elem;
  },
  
  render: function() {
    throw Error("render() is not implemented.");
  }
}