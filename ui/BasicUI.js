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

DOMSnitch.UI.BasicUI = function() {
  this._htmlFile = "/ui/basicViewer.html";
  this._windowName = "";
}

DOMSnitch.UI.BasicUI.prototype = new DOMSnitch.UI.Base;

DOMSnitch.UI.BasicUI.prototype._build = function() {
  this._setTitle(this._title);
  this._setTitleRow(this._columnTitles);
}