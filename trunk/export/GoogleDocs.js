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

DOMSnitch.Export.GoogleDocs = function(parent, statusBar, scanVerbosity) {
  this._parent = parent;
  this._statusBar = statusBar;
  this._searchFunction = undefined;
  this._worksheetFeed = "";
  this._postLink = "";
  this._spreadsheetLink = "";
  this._scanVerbosity = scanVerbosity ? scanVerbosity : DOMSnitch.Scanner.STATUS.NONE;
  this._scanner = new DOMSnitch.Scanner();
  
  this._colTitles = [
    "Global ID",
    "Type",
    "Page",
    "Document URL",
    "Data used",
    "Environment variables",
    "Raw call stack",
    "Scan results"
  ];

  this._recordBuff = [];
  this._recordCount = 0;
  
  this._oauth = ChromeExOAuth.initBackgroundPage({
    "request_url": "https://www.google.com/accounts/OAuthGetRequestToken",
    "authorize_url": "https://www.google.com/accounts/OAuthAuthorizeToken",
    "access_url": "https://www.google.com/accounts/OAuthGetAccessToken",
    "consumer_key": "anonymous",
    "consumer_secret": "anonymous",
    "scope": "https://spreadsheets.google.com/feeds/ https://docs.google.com/feeds/",
    "app_name": "DOM Snitch"
  });
  
  // A hack to counter a bug in the ChromeExOAuth constructor
  this._oauth.callback_page = "third_party/chrome_ex_oauth.html";  
}

DOMSnitch.Export.GoogleDocs.prototype = {
  _createSpreadsheet: function() {
    var url = "https://docs.google.com/feeds/documents/private/full";

    var body = "<?xml version='1.0' encoding='UTF-8'?>" +
    		"<entry xmlns=\"http://www.w3.org/2005/Atom\">" +
    		"<category scheme=\"http://schemas.google.com/g/2005#kind\" " +
    		"term=\"http://schemas.google.com/docs/2007#spreadsheet\"/>" +
    		"<title>DOM Snitch: Export {1} @ {0}</title>" +
    		"</entry>";

    var verbosity = this._scanner.stringifyStatusCode(this._scanVerbosity);
    if(verbosity.length > 0) {
      verbosity = "of " + verbosity.toLowerCase() + " ranked records";
    }
    body = this._populateXmlString(body, [(new Date).toISOString(), verbosity]);
    
    this._makeRequest("post", url, body, 
      this._createXhrStateChangeHandler(this._processSpreadsheetInfo.bind(this)));
  },
  
  _createXhrStateChangeHandler: function(callback) {
    return function() {
      if(this.readyState == 4) {
        callback(this.responseText);
      }
    };
  },
  
  _displayPrompt: function() {
    this._statusBar.hide();
    var promptMsg = "Exporting to Google Docs has finished. " +
    		"Would you like to open the exported spreadsheet?"; 
    if(confirm(promptMsg)) {
      this._parent.skipNextInjection();
      chrome.tabs.create({url: this._spreadsheetLink});
    }
  },
  
  _getPostLink: function() {
    var url = this._worksheetFeed.replace("/worksheets/", "/list/");
    url = url.replace("/private/full", "/default/private/full");
    this._makeRequest("get", url, "", 
      this._createXhrStateChangeHandler(this._processPostInfo.bind(this)));
  },
  
  _getRecordCount: function(count) {
    this._recordCount += count;
  },
  
  _handleExportError: function() {
    //TODO: Add clean-up code
    
    this._statusBar.hide();
    alert("An error while exporting has occured. Please try again in a few moments.");
  },
  
  _htmlEncode: function(data) {
    var buff = [];

    for(var i = 0; i < data.length; i++) {
      buff.push("&#" + data.charCodeAt(i) + ";");
    }
    
    return buff.join("");
  },

  _makeRequest: function(method, url, body, callback, etag) {
    var authz = this._oauth.getAuthorizationHeader(url, method, {"alt": "json"});

    var xhr = new XMLHttpRequest();
    xhr.open(method, url + "?alt=json", callback ? true : false);
    xhr.onreadystatechange = callback;
    xhr.setRequestHeader("Content-Type", "application/atom+xml");
    if(etag) {
      xhr.setRequestHeader("If-Match", etag);
    }
    xhr.setRequestHeader("Authorization", authz);
    xhr.setRequestHeader("GData-Version", "2.0");
    xhr.send(body);
    
    return callback ? "" : xhr.responseText;
  },

  _onAuthorized: function() {
    this._createSpreadsheet();
  },
  
  _populateXmlString: function(xmlString, params) {
    for(var i = 0; i < params.length; i++) {
      xmlString = xmlString.replace(new RegExp("\\{" + i + "\\}", "g"), params[i]);
    }
    
    return xmlString;
  },
  
  _processHeaderCell: function(col, responseText) {
    try {
      var responseObject = JSON.parse(responseText);
    } catch (e) {
      this._handleExportError();
      return;
    }

    var etag = responseObject.entry["gd$etag"];
    this._updateHeaderCell(col, etag);
  },
  
  _processPostInfo: function(responseText) {
    try {
      var responseObject = JSON.parse(responseText);
    } catch (e) {
      this._handleExportError();
      return;
    }
    
    for(var i = 0; i < responseObject.feed.link.length; i++) {
      var link = responseObject.feed.link[i];
      if(link.rel.indexOf("#feed") > 0) {
        this._postLink = link.href;
      }
    }
    
    this._queryHeaderCell(1);
  },
  
  _processSpreadsheetInfo: function(responseText) {
    try {
      var responseObject = JSON.parse(responseText);
    } catch (e) {
      this._handleExportError();
      return;
    }

    for(var i = 0; i < responseObject.entry.link.length; i++) {
      var link = responseObject.entry.link[i];
      if(link.rel.indexOf("#worksheetsfeed") > 0) {
        this._worksheetFeed = link.href;
      } else if(link.rel == "alternate") {
        this._spreadsheetLink = link.href;
      }
    }
    
    this._getPostLink();
  },
  
  _queryHeaderCell: function(col) {
    var url = this._worksheetFeed.replace("/worksheets/", "/cells/");
    url = url.replace("/private/full", "/default/private/full/R1C" + col);
    
    this._makeRequest("get", url, "", 
      this._createXhrStateChangeHandler(this._processHeaderCell.bind(this, col)));
  },
  
  _sendRecords: function() {
    if(this._recordBuff.length == 0) {
      this._displayPrompt();
      return;
    }

    var record = this._recordBuff.pop();
    record.env.cookie = "";
    var body = "<entry xmlns=\"http://www.w3.org/2005/Atom\" " +
      "xmlns:gsx=\"http://schemas.google.com/spreadsheets/2006/extended\">" +
      "<gsx:globalid>{0}</gsx:globalid>" +
      "<gsx:type>{1}</gsx:type>" +
      "<gsx:page>{2}</gsx:page>" +
      "<gsx:documenturl>{3}</gsx:documenturl>" +
      "<gsx:dataused>{4}</gsx:dataused>" +
      "<gsx:environmentvariables>{5}</gsx:environmentvariables>" +
      "<gsx:rawcallstack>{6}</gsx:rawcallstack>" +
      "<gsx:scanresults>Code: {7}\n\nNotes: {8}</gsx:scanresults>" +
      "</entry>";
    
    body = this._populateXmlString(
      body, 
      [
        this._htmlEncode(record.gid),
        record.type,
        this._htmlEncode(record.topLevelUrl),
        this._htmlEncode(record.documentUrl),
        this._htmlEncode(record.data),
        this._htmlEncode(JSON.stringify(record.env)),
        this._htmlEncode(JSON.stringify(record.callStack)),
        record.code,
        record.notes
      ]
    );
    
    this._makeRequest("post", this._postLink, body, 
      this._createXhrStateChangeHandler(this._sendRecords.bind(this)));
  },
  
  _startExport: function() {
    this._statusBar.setText("Exporting to Google Docs");
    this._oauth.authorize(this._onAuthorized.bind(this));
  },
  
  _updateHeaderCell: function(col, etag) {
    var url = this._worksheetFeed.replace("/worksheets/", "/cells/");
    url = url.replace("/private/full", "/default/private/full/R1C" + col);

    var body = "<entry xmlns=\"http://www.w3.org/2005/Atom\" " +
      "xmlns:gs=\"http://schemas.google.com/spreadsheets/2006\">" +
      "<id>{0}</id>" +
      "<link rel=\"edit\" type=\"application/atom+xml\" " +
      "href=\"{0}\"/>" +
      "<gs:cell row=\"1\" col=\"{1}\" inputValue=\"{2}\"/>" +
      "</entry>";

    body = this._populateXmlString(body, [url, col, this._colTitles[col - 1]]);
    
    var callback = undefined;
    if(col == this._colTitles.length) {
      callback = this._searchFunction.bind(this, this.exportRecord.bind(this));
    } else {
      callback = this._queryHeaderCell.bind(this, col + 1);
    }
    
    this._makeRequest("put", url, body, 
      this._createXhrStateChangeHandler(callback), etag);
  },
  
  bulkExport: function() {
    this._parent.storage.getRecordCount(this._getRecordCount.bind(this));
    this._searchFunction = this._parent.storage.selectAll.bind(this._parent.storage, "id", "asc");
    this._startExport();
  },
  
  exportRecord: function(record) {
    if(record.type.indexOf("doc.cookie") == 0) {
      // A conscious decision to never export document.cookie findings
      return;
    }
    var scanResult = this._scanner.check(record);
    
    if(this._scanVerbosity == DOMSnitch.Scanner.STATUS.NONE || scanResult.code == this._scanVerbosity) {
      record.code = this._scanner.stringifyStatusCode(scanResult.code);
      record.notes = scanResult.notes;
      this._recordBuff.push(record);
    }

    if(--this._recordCount == 0) {
      this._sendRecords();
    }
  },
  
  singleExport: function(recordId) {
    this._recordCount = 1;
    this._searchFunction = this._parent.storage.selectBy.bind(this._parent.storage, "id", recordId);
    this._startExport()
  }
}