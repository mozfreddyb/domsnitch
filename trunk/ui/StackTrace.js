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
 * Provides a page for showing a complete and detailed stack trace.
 */
DOMSnitch.UI.StackTrace = function(parent, trace) {
  this._parent = parent;
  this._title = parent.appName + ": Stack trace viewer";
  this._trace = trace;
  
  this.showViewer();
}

DOMSnitch.UI.StackTrace.prototype = new DOMSnitch.UI.BasicUI;

DOMSnitch.UI.StackTrace.prototype._build = function() {
  this._setTitle(this._title);

  var document = this.document;
  document.body.textContent = "";
  document.body.style.margin = "0px 0px 0px 0px";
  
  var stackArray = this._trace.split("    at ");
  
  var opened = false;
  var first = true;
  for(var i = 1; i < stackArray.length; i++) {
    var url = stackArray[i].match(/([\w-]+:\/\/.*):(\d+):(\d+)/);
    if(url) {
      url = url[0];
      if(!url.match(/^chrome-extension:/i)) {
        if(first) {
          url += " (most recent)";
          first = false;
        }
        this._displayCode(url);
        opened = true;
      }
    }
  }
  
  if(!opened) {
    window.alert("There is no code to display.");
    this.hideViewer();
  }

}

DOMSnitch.UI.StackTrace.prototype._displayCode = function(rawUrl) {
  var document = this.document;
  var divUrl = document.createElement("div");
  divUrl.textContent = rawUrl;
  divUrl.style.padding = "10px 10px 10px 25px";
  divUrl.style.weight = "bold";
  divUrl.style.borderTop = "1px solid #ccc";
  divUrl.title = "Click to see JavaScript code";
  divUrl.addEventListener("click", this._handleClick.bind(this), true);
  divUrl.addEventListener("mouseover", this._handleMouseOver.bind(this), true);
  divUrl.addEventListener("mouseout", this._handleMouseOut.bind(this), true);
  document.body.appendChild(divUrl);
  
  var divSource = document.createElement("iframe");
  divSource.src = "basicViewer.html";
  divSource.style.width = "100%";
  divSource.style.height = "700px";
  divSource.style.display = "none";
  document.body.appendChild(divSource);
  new DOMSnitch.UI.CodeView(this._parent, rawUrl, divSource.contentWindow);
}

DOMSnitch.UI.StackTrace.prototype._handleClick = function(event) {
  var elem = event.target;
  var sibling = elem.nextElementSibling;
  
  if(sibling.style.display == "block") {
    sibling.style.display = "none";
    elem.title = "Click to see JavaScript code";
  } else {
    sibling.style.display = "block";
    elem.title = "Click to hide JavaScript code";
  }
}

DOMSnitch.UI.StackTrace.prototype._handleMouseOver = function(event) {
  this.document.body.style.cursor = "pointer";
}
  
DOMSnitch.UI.StackTrace.prototype._handleMouseOut = function(event) {
  this.document.body.style.cursor = "auto";
}
