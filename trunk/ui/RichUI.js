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

DOMSnitch.UI.RichUI = function() {
  this._htmlFile = "/ui/richViewer.html";
  this._windowName = "";
}

DOMSnitch.UI.RichUI.prototype = new DOMSnitch.UI.Base;

DOMSnitch.UI.RichUI.prototype._build = function() {
  this._setTitle(this._title);
  this._setTopMenu(this._menuItems);
  this._setTitleRow(this._columnTitles);
}
  
DOMSnitch.UI.RichUI.prototype._createDataSectionClickHandler = function(data) {
  return function() {
    while(/%\w{2}/.test(data)) {
      data = window.unescape(data);
    }
    
    this.innerText = data.replace(/(.{100})/g, "$1\n");
    this.onmouseover = null;
    this.onmouseout = null;
    this.onclick = null;
    this.title = null;
  };
}
  
DOMSnitch.UI.RichUI.prototype._handleHistoryLinkClick = function(recordGid) {
  var recordViewer = new DOMSnitch.UI.RecordView(this._parent, recordGid);
}

DOMSnitch.UI.RichUI.prototype._createExportLinkClickHandler = function(viewer, recordId) {
  return function(event) {
    if(!this._exportCursor) {
      var cursorOptions = [
        {
          title: "Export record as text",
          click: viewer.exportRecordAsText.bind(viewer, recordId)
        },
        {
          title: "Export record to Google Docs",
          click: viewer.exportRecordToGDocs.bind(viewer, recordId)
        }
      ];
      
      this._exportCursor = new DOMSnitch.UI.Cursor(viewer, cursorOptions);
    }
    
    this._exportCursor.toggleAt(event.pageY - event.offsetY + 20);
  };
}

DOMSnitch.UI.RichUI.prototype._createRecordBody = function(record, useNesting) {
  var document = this.document;
  var recordBody = document.getElementById("[fr]" + record.gid);
  
  if(!recordBody || !useNesting) {
    recordBody = document.createElement("tr");
    recordBody.id = "[fr]" + record.gid;
  } else {
    recordBody.textContent = "";
  }
  
  var bodyContent = this._createHtmlElement("td", "recordInvisible", "");
  bodyContent.colSpan = this._columnTitles.length;
  recordBody.content = bodyContent;
  recordBody.appendChild(bodyContent);
  
  var recordMenu = this._createHtmlElement("div", "recordMenu", "");
  bodyContent.appendChild(recordMenu);
  if(useNesting) {
    recordMenu.appendChild(
      this._createRecordMenu(
        "Show similar records", 
        "Click to show similar records", 
        this._handleHistoryLinkClick.bind(this, record.gid)
      )
    );
    recordMenu.appendChild(document.createTextNode(" | "));
  }
  recordMenu.appendChild(
    this._createRecordMenu(
      "Export record", 
      "Click to export record", 
      this._createExportLinkClickHandler(this, record.id)
    )
  );
  
  var exportLink = this._createHtmlElement("div");
  
  bodyContent.appendChild(this._createSection("Global ID:", record.gid));
  bodyContent.appendChild(this._createSection("Document URL:", record.documentUrl));
  
  var dataContent = record.data.length > 0 ? record.data : "[no data was used in this call]";
  var dataSection = undefined;
  
  if(/%\w{2}/.test(dataContent)) {
    dataSection = this._createSection(
      "Data used:", 
      dataContent, 
      "Click to decode", 
      this._createDataSectionClickHandler(dataContent)
    );
  } else {
    dataSection = this._createSection("Data used:", dataContent);
  }
  bodyContent.appendChild(dataSection);
  
  bodyContent.appendChild(
    this._createSection("Stack trace:", record.callStack, "", null, true));
  
  return recordBody;
}
  
DOMSnitch.UI.RichUI.prototype._createRecordHeader = function(record, useNesting) {
  var document = this.document;
  var recordId = record.id;
  var recordHeader = document.getElementById("[rr]" + record.gid);
  var scanResult = this._scanner.check(record);
  var cssClass = this._getCssForScanResult(scanResult.code);
  
  if(!recordHeader || !useNesting) {
    recordHeader = document.createElement("tr");
    recordHeader.id = "[rr]" + record.gid;
    recordHeader.className = cssClass;
    recordHeader.code = scanResult.code;
    recordHeader.notes = scanResult.notes;
    recordHeader.expanded = false;
    recordHeader.onmouseover = this._handleMouseOver.bind(this);
    recordHeader.onmouseout = this._handleMouseOut.bind(this);
    recordHeader.onclick = this._createRowClickHandler(cssClass);
  } else {
    if(scanResult.code > recordHeader.code) {
      recordHeader.className = cssClass;
      recordHeader.code = scanResult.code;
      recordHeader.notes = scanResult.notes;
      recordHeader.onclick = this._createRowClickHandler(cssClass);
    } else if(recordHeader.code == DOMSnitch.Scanner.STATUS.NONE) {
      recordHeader.className = "recordUpdated";
      recordHeader.onclick = this._createRowClickHandler("recordUpdated");
    }
    
    recordId += "+";
    recordHeader.textContent = "";
  }
  
  var idCell = this._createHtmlElement("td", "recordId", recordId);
  var tagElem = document.createElement("a");
  tagElem.name = "record-" + record.id;
  idCell.appendChild(tagElem);
  recordHeader.appendChild(idCell);
  
  var urlCell = this._createHtmlElement("td", "", record.topLevelUrl.replace(/(.{150})/g, "$1\n"));
  urlCell.title = recordHeader.notes ? recordHeader.notes + "\n" : "";
  urlCell.title += "Document URL:\n";
  urlCell.title += record.documentUrl;
  urlCell.title += "\n\nData used:\n";
  urlCell.title += record.data.length > 300 ? record.data.substring(0, 300) : record.data;
  recordHeader.appendChild(urlCell);
  
  var typeCell = this._createHtmlElement("td", "", record.type);
  recordHeader.appendChild(typeCell);
  
  return recordHeader;
}

DOMSnitch.UI.RichUI.prototype._createRecordMenu = function(title, caption, clickHandler) {
  var menuItem = this._createHtmlElement("span", "", title);
  menuItem.title = caption;
  menuItem.addEventListener("mouseover", this._handleMouseOver.bind(this));
  menuItem.addEventListener("mouseout", this._handleMouseOut.bind(this));
  menuItem.addEventListener("click", clickHandler);

  return menuItem;
}
  
DOMSnitch.UI.RichUI.prototype._createRowClickHandler = function(className) {
  return function() {
    if(this.expanded) {
      this.body.content.className = "recordInvisible";
      this.className = className;
      this.expanded = false;
    } else {
      this.body.content.className = "recordVisible";
      this.className = "recordClicked";
      this.expanded = true;
    }
  };
}
  
DOMSnitch.UI.RichUI.prototype._createSection = function(title, content, caption, clickHandler, isCode) {
  var document = this.document;
  var section = document.createElement("div");
  var titleElem = this._createHtmlElement("div", "recordSectionSubtitle", title);
  var contentElem = document.createElement("p");

  if(isCode && content instanceof Array) {
    for(var i = 0; i < content.length; i++) {
      contentElem.appendChild(this._createCodeSection(content[i]));
    }
  } else {
    contentElem.innerText = content.replace(/(.{200})/g, "$1\n");
    if(caption) {
      contentElem.title = caption;
    }
  }
  if(clickHandler) {
    contentElem.addEventListener("mouseover", this._handleMouseOver.bind(this));
    contentElem.addEventListener("mouseout", this._handleMouseOut.bind(this));
    contentElem.addEventListener("click", clickHandler);
  }
  
  section.appendChild(titleElem);
  section.appendChild(contentElem);
  
  return section;
}
  
DOMSnitch.UI.RichUI.prototype._createCodeSection = function(frame) {
  var document = this.document;
  var section = document.createElement("div");
  
  section.appendChild(
    this._createHtmlElement("p", "recordCodeLine", frame.src.replace(/(.{150})/g, "$1\n")));
 
  var argList = frame.data.split(" | ");
  var args = "";
  for(var i = 0; i < argList.length; i++) {
    args += (i + 1) + ": " + argList[i].replace(/(.{150})/g, "$1\n") + "\n";
  }
  
  section.appendChild(
    this._createHtmlElement("pre", "recordCodeSnippet", "Arguments:\n" + args));
  
  section.appendChild(
    this._createHtmlElement("pre", "recordCodeSnippet", frame.code.replace(/(.{150})/g, "$1\n")));
  
  return section;
}

DOMSnitch.UI.RichUI.prototype._getCssForScanResult = function(statusCode) {
  switch(statusCode) {
    case DOMSnitch.Scanner.STATUS.HIGH:
      return "riskHigh";
    case DOMSnitch.Scanner.STATUS.MED:
      return "riskMedium";
    case DOMSnitch.Scanner.STATUS.LOW:
      return "riskLow";
    default:
      return "";
  }
}
  
DOMSnitch.UI.RichUI.prototype._handleMouseOver = function(event) {
  this.document.body.style.cursor = "pointer";
}
  
DOMSnitch.UI.RichUI.prototype._handleMouseOut = function(event) {
  this.document.body.style.cursor = "auto";
}

DOMSnitch.UI.RichUI.prototype.exportRecordAsText = function(recordId) {
  var recordExport = new DOMSnitch.UI.RecordExport(this._parent, recordId);
}

DOMSnitch.UI.RichUI.prototype.exportRecordToGDocs = function(recordId) {
  var statusBar = new DOMSnitch.UI.StatusBar(this);
  var scanVerbosity = DOMSnitch.Scanner.STATUS.NONE;
  var gDocsExport = new DOMSnitch.Export.GoogleDocs(this._parent, statusBar, scanVerbosity);
  gDocsExport.singleExport(recordId);
}