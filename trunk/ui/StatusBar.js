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

DOMSnitch.UI.StatusBar = function(parentViewer) {
  this._parentViewer = parentViewer;
  this._text = "";
  this._count = 0;
  this._statusBar = undefined;
  this._marquee = undefined;
}

DOMSnitch.UI.StatusBar.prototype = {
  _build: function() {
    var document = this._parentViewer.document;
    
    this._statusBar = document.createElement("div");
    this._statusBar.id = "statusBar";
    document.body.appendChild(this._statusBar);
  },
  
  _playMarquee: function() {
    this._statusBar.textContent = this._text + " (" + ++this._count + "s)";
  },
  
  hide: function() {
    if(this._marquee) {
      window.clearInterval(this._marquee);
      this._marquee = undefined;
    }
    
    var document = this._parentViewer.document;
    document.body.removeChild(this._statusBar);
  },
  
  setText: function(text) {
    if(this._statusBar) {
      this.hide();
    }

    this._build();
    this._text = text;
    this._statusBar.textContent = this._text;
    
    this._count = 0;
    this._marquee = window.setInterval(this._playMarquee.bind(this), 1000);
  }
}