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

DOMSnitch.UI.ActivityLog = function(parent) {
  this._parent = parent;
  this._title = "DOM Snitch: Activity Log";
  this._windowName = "activityLog";
  this._columnTitles = [
    {title: "Id", click: this._createSortByHandler("id", "asc", this)},
    {title: "URL", click: this._createSortByHandler("topLevelUrl", "asc", this)},
    {title: "Type", click: this._createSortByHandler("type", "asc", this)}
  ];
  this._menuItems = [
    {title: this._getViewTitle(), click: this._handleMenuItemView.bind(this)},
    {title: "collapse all", click: this._handleMenuItemCollapse.bind(this)},
    {title: "expand all", click: this._handleMenuItemExpand.bind(this)},
    {title: "clear all", click: this._handleMenuItemClear.bind(this)},
    {title: "export all", click: this._handleMenuItemExport.bind(this)}
  ];

  this._exportCursor = undefined;
  
  this.showViewer();
  this._parent.storage.selectAll("id", "asc", this.displayRecord.bind(this));
}

DOMSnitch.UI.ActivityLog.prototype = new DOMSnitch.UI.RichUI;

DOMSnitch.UI.ActivityLog.prototype._createSortByHandler = function(colId, order, viewer) {
  return function() {
    this.colId = this.colId ? this.colId : colId;
    this.order = this.order ? this.order : order;
    this.order = this.order == "asc" ? "desc" : "asc";
    
    viewer.queryStorageBy(this.colId, this.order);
  };
}

DOMSnitch.UI.ActivityLog.prototype._getViewTitle = function() {
  return this._isNestingEnabled() ? "simple view" : "nested view";
}

DOMSnitch.UI.ActivityLog.prototype._handleMenuItemClear = function() {
  this._parent.storage.deleteAll();
  this._clear();
  this._showNoIssuesMessage();
}

DOMSnitch.UI.ActivityLog.prototype._handleMenuItemCollapse = function() {
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

DOMSnitch.UI.ActivityLog.prototype._handleMenuItemExpand = function() {
  var document = this.document;
  var collapsedItems = document.getElementsByClassName("recordInvisible");
  while(collapsedItems.length > 0) {
    collapsedItems[0].className = "recordVisible";
  }
}

DOMSnitch.UI.ActivityLog.prototype._handleMenuItemExport = function() {
  if(!this._exportCursor) {
    var cursorOptions = [
      {
        title: "Export *all* as text", 
        click: this._handleMenuItemExportAsText.bind(this)
      },
      {
        title: "Export *all* to Google Docs", 
        click: this._handleMenuItemExportToGDocs.bind(this, DOMSnitch.Scanner.STATUS.NONE)
      },
      {
        title: "Export high ranked to Google Docs", 
        click: this._handleMenuItemExportToGDocs.bind(this, DOMSnitch.Scanner.STATUS.HIGH)
      },
      {
        title: "Export medium ranked to Google Docs", 
        click: this._handleMenuItemExportToGDocs.bind(this, DOMSnitch.Scanner.STATUS.MED)
      }
    ];
    this._exportCursor = new DOMSnitch.UI.Cursor(this, cursorOptions);
  }
  this._exportCursor.toggle();
}

DOMSnitch.UI.ActivityLog.prototype._handleMenuItemExportAsText = function() {
  var document = this.document;
  var count = document.getElementsByTagName("tr").length;
  count = (count - 1) / 2;

  if(count) {
    var storageExport = new DOMSnitch.UI.StorageExport(this._parent);
  } else {
    alert("There are no records in DOM Snitch to export!");
  }
}

DOMSnitch.UI.ActivityLog.prototype._handleMenuItemExportToGDocs = function(scanVerbosity) {
  var document = this.document;
  var count = document.getElementsByTagName("tr").length;
  count = (count - 1) / 2;
  
  if(count) {
    var statusBar = new DOMSnitch.UI.StatusBar(this);
    var gDocsExport = new DOMSnitch.Export.GoogleDocs(this._parent, statusBar, scanVerbosity);
    gDocsExport.bulkExport();
  } else {
    alert("There are no records in DOM Snitch to export!");
  }
}

DOMSnitch.UI.ActivityLog.prototype._handleMenuItemView = function() {
  if(this._isNestingEnabled()) {
    this._menuItems[0].title = "nested view";
    sessionStorage["useNested"] = false;
  } else {
    this._menuItems[0].title = "simple view";
    sessionStorage["useNested"] = true;
  }
  
  this._clear();
  this._build();
  this._parent.storage.selectAll("id", "asc", this.displayRecord.bind(this));
}

DOMSnitch.UI.ActivityLog.prototype._isNestingEnabled = function() {
  if(sessionStorage["useNested"] == undefined) {
    sessionStorage["useNested"] == true;
    return true;
  }
  
  return sessionStorage["useNested"] == "true";
}

DOMSnitch.UI.ActivityLog.prototype.displayRecord = function(record) {
  var scanResult = this._scanner.checkOnDisplay(record);
  if(this._window.closed || scanResult.code == DOMSnitch.Scanner.STATUS.IGNORED) {
    return;
  }
  this._hideNoIssuesMessage();
  
  var document = this.document;
  var contentTable = document.getElementById("contentTable");

  var recordHeader = this._createRecordHeader(record, this._isNestingEnabled());
  var recordBody = this._createRecordBody(record, this._isNestingEnabled());
  recordHeader.body = recordBody;
  
  contentTable.appendChild(recordHeader);
  contentTable.appendChild(recordBody);
}

DOMSnitch.UI.ActivityLog.prototype.queryStorageBy = function(colId, order) {
  this._clear();
  this._parent.storage.selectAll(colId, order, this.displayRecord.bind(this));
}