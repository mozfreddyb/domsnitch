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

DOMSnitch.UI.RecordView = function(parent, recordGid) {
  this._parent = parent;
  this._title = parent.appName + ": Record View";
  this._columnTitles = [
    {title: "Id", click: null},
    {title: "URL", click: null},
    {title: "Type", click: null}
  ];
  this._menuItems = [
    {title: "collapse all", click: this._handleMenuItemCollapse.bind(this)},
    {title: "expand all", click: this._handleMenuItemExpand.bind(this)}
  ];
  
  this.showViewer();
  this._parent.storage.selectBy("gid", recordGid, this.displayRecord.bind(this));
}

DOMSnitch.UI.RecordView.prototype = new DOMSnitch.UI.RichUI;

DOMSnitch.UI.RecordView.prototype._handleMenuItemCollapse = function() {
  var document = this.document;
  var collapsedItems = document.getElementsByClassName("recordVisible");
  while(collapsedItems.length > 0) {
    collapsedItems[0].className = "recordInvisible";
  }
  
  var clickedItems = document.getElementsByClassName("recordClicked");
  while(clickedItems.length > 0) {
    clickedItems[0].expanded = false;
    clickedItems[0].className = "";
  }
}

DOMSnitch.UI.RecordView.prototype._handleMenuItemExpand = function() {
  var document = this.document;
  var collapsedItems = document.getElementsByClassName("recordInvisible");
  while(collapsedItems.length > 0) {
    collapsedItems[0].className = "recordVisible";
  }
}

DOMSnitch.UI.RecordView.prototype.displayRecord = function(record) {
  var scanResult = this._scanner.checkOnDisplay(record);
  if(this._window.closed || scanResult.code == DOMSnitch.Scanner.STATUS.IGNORED) {
    return;
  }
  this._hideNoIssuesMessage();
  
  var document = this.document;
  var contentTable = document.getElementById("contentTable");

  var recordHeader = this._createRecordHeader(record, false);
  var recordBody = this._createRecordBody(record, false);
  recordHeader.body = recordBody;
  
  contentTable.appendChild(recordHeader);
  contentTable.appendChild(recordBody);
}