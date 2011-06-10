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

DOMSnitch.UI.StorageExport = function(parent) {
  this._parent = parent;
  this._title = "DOM Snitch: Storage Export";
  this._columnTitles = [
    {title: "Global ID"},
    {title: "Type"},
    {title: "Page"},
    {title: "Document URL"},
    {title: "Data used"},
    {title: "Environment variables"},
    {title: "Raw call stack"},
    {title: "Scan results"}
  ];
  
  this.showViewer();
  this._parent.storage.selectAll("id", "asc", this.displayRecord.bind(this));
}

DOMSnitch.UI.StorageExport.prototype = new DOMSnitch.UI.BasicUI;

DOMSnitch.UI.StorageExport.prototype.displayRecord = function(record) {
  if(this._window.closed) {
    return;
  }
  
  if(record.type.indexOf("doc.cookie") == 0) {
    // A conscious decision to never export document.cookie findings
    return;
  }
  
  var document = this.document;
  var contentTable = document.getElementById("contentTable");
  var recordRow = document.createElement("tr");
  
  var scanResults = this._scanner.check(record);
  scanResults.code = this._scanner.stringifyStatusCode(scanResults.code);
  record.env.cookie = "";
  
  recordRow.appendChild(this._createHtmlElement("td", "", record.gid));
  recordRow.appendChild(this._createHtmlElement("td", "", record.type));
  recordRow.appendChild(this._createHtmlElement("td", "", record.topLevelUrl));
  recordRow.appendChild(this._createHtmlElement("td", "", record.documentUrl));
  recordRow.appendChild(this._createHtmlElement("td", "", record.data));
  recordRow.appendChild(this._createHtmlElement("td", "", JSON.stringify(record.env)));
  recordRow.appendChild(this._createHtmlElement("td", "", JSON.stringify(record.callStack)));
  recordRow.appendChild(this._createHtmlElement("td", "", JSON.stringify(scanResults)));
  contentTable.appendChild(recordRow);
}