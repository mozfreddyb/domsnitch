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
    "scope": "https://docs.google.com/feeds/ https://spreadsheets.google.com/feeds/ https://docs.googleusercontent.com/",
    "app_name": parent.appName
  });
  
  // A hack to counter a bug in the ChromeExOAuth constructor
  this._oauth.callback_page = "/third_party/chrome_ex_oauth.html";  
}

DOMSnitch.Export.GoogleDocs.prototype = {
  _createXhrStateChangeHandler: function(callback) {
    return function() {
      if(this.readyState == 4) {
        callback(this);
      }
    };
  },
  
  _csvEscape: function(data) {
    return data ? data.replace(/"/g, "\"\"") : "";
  },
  
  _displayPrompt: function(responseXHR) {
    var url = "https://docs.google.com/spreadsheet/ccc?key=";
    var spreadsheetId = responseXHR.getResponseHeader("Location");
    var idx = spreadsheetId.indexOf("%3A") + 3;
    spreadsheetId = spreadsheetId.substring(idx);

    this._statusBar.hide();
    var promptMsg = "Exporting to Google Docs has finished. " +
        "Would you like to open the exported spreadsheet?"; 
    if(confirm(promptMsg)) {
      chrome.tabs.create({url: url + spreadsheetId});
    }
  },
  
  _getCsvFilename: function(date, verbosity) {
    var hours = date.getUTCHours();
    var mins = date.getUTCMinutes()
    if(verbosity.length > 0) {
      verbosity = " of " + verbosity.toLowerCase() + " ranked records";
    }
    
    hours = (hours < 10 ? "0" : "") + hours;
    mins = (mins < 10 ? "0" : "") + mins;

    return this._populateString(
      "{2} Export{1} at {0}", 
      [
        "" + hours + mins + "GMT",
        verbosity,
        this._parent.appName.replace(" ", "")
      ]
    );
  },

  _getRecordCount: function(count) {
    this._recordCount += count;
  },

  _handleExportError: function() {
    //TODO: Add clean-up code
    
    this._statusBar.hide();
    alert("An error while exporting has occured. Please try again in a few moments.");
  },

  _makeRequest: function(method, url, body, callback, headers) {
    var authz = this._oauth.getAuthorizationHeader(url, method, {});

    var xhr = new XMLHttpRequest();
    xhr.open(method, url, callback ? true : false);
    xhr.onreadystatechange = callback;
    if(headers) {
      for(var i = 0; i < headers.length; i++) {
        console.debug(headers[i].key + ": " + headers[i].value);
        xhr.setRequestHeader(headers[i].key, headers[i].value);
      }
    }
    xhr.setRequestHeader("Authorization", authz);
    xhr.setRequestHeader("GData-Version", "3.0");
    
    try {
      xhr.send(body);
    } catch(e) {
      this._handleExportError();
      throw e;
    }
    
    return callback ? "" : xhr.responseText;
  },

  _onAuthorized: function() {
    this._searchFunction(this.exportRecord.bind(this));
  },
  
  _populateString: function(string, params) {
    for(var i = 0; params && i < params.length; i++) {
      string = string.replace(new RegExp("\\{" + i + "\\}", "g"), params[i]);
    }
    
    return string;
  },
  
  _sendRecords: function() {
    var url = "https://docs.google.com/feeds/upload/create-session/default/private/full";
    var verbosity = this._scanner.stringifyStatusCode(this._scanVerbosity);
    var title = this._getCsvFilename(new Date, verbosity);
    var body = "\"{0}\",\"{1}\",\"{2}\",\"{3}\",\"{4}\",\"{5}\",\"{6}\",\"{7}\"\n";
    body = this._populateString(
      body,
      [
        this._csvEscape("Global ID"),
        this._csvEscape("Type"),
        this._csvEscape("Page"),
        this._csvEscape("Document URL"),
        this._csvEscape("Data used"),
        this._csvEscape("Environment variables"),
        this._csvEscape("Raw call stack"),
        this._csvEscape("Scan results")
      ]
    );
    
    for(var i = 0; i < this._recordBuff.length; i++) {
      var record = this._recordBuff[i];
      if(record.env && record.env.cookie) {
        record.env.cookie = "";
      }
      var entry = "\"{0}\",\"{1}\",\"{2}\"," +
          "\"{3}\",\"{4}\",\"{5}\",\"{6}\",\"{7}\"\n";
      
      body += this._populateString(
        entry, 
        [
          this._csvEscape(record.gid),
          this._csvEscape(record.type),
          this._csvEscape(record.topLevelUrl),
          this._csvEscape(record.documentUrl),
          this._csvEscape(record.data),
          this._csvEscape(JSON.stringify(record.env)),
          this._csvEscape(JSON.stringify(record.callStack)),
          this._csvEscape(record.code + "\n\n" + record.notes)
        ]
      );
    }

    var headers = [
      {key: "Content-Type", value: "text/csv"},
      {key: "Slug", value: escape(title)},
      {key: "X-Upload-Content-Type", value: "text/csv"},
      {key: "X-Upload-Content-Length", value: body.length}
    ];
    
    this._makeRequest(
      "post", 
      url, 
      "", 
      this._createXhrStateChangeHandler(this._uploadCsvData.bind(this, body)),
      headers
    );
  },
  
  _uploadCsvData: function(body, responseXHR) {
    var locationURI = responseXHR.getResponseHeader("Location");
    var range = body.length - 1;
    var headers = [
      {key: "Content-Type", value: "text/csv"}
    ];
    
    this._makeRequest(
      "put", 
      locationURI, 
      body, 
      this._createXhrStateChangeHandler(this._displayPrompt.bind(this)),
      headers
    );
  },

  _startExport: function() {
    this._statusBar.setText("Exporting to Google Docs");
    this._oauth.authorize(this._onAuthorized.bind(this));
  },
  
  bulkExport: function() {
    this._parent.storage.getRecordCount(this._getRecordCount.bind(this));
    this._searchFunction = this._parent.storage.selectAll.bind(this._parent.storage, "id", "asc");
    this._startExport();
  },
  
  exportRecord: function(record) {
    var scanResult = this._scanner.checkOnDisplay(record);
    if(scanResult.code == DOMSnitch.Scanner.STATUS.IGNORED) {
      return;
    }
    
    if(this._scanVerbosity == DOMSnitch.Scanner.STATUS.NONE || scanResult.code == this._scanVerbosity) {
      record.code = this._scanner.stringifyStatusCode(scanResult.code);
      record.notes = scanResult.notes;
      this._recordBuff.push(record);
    }

    if(0 >= --this._recordCount) {
      this._sendRecords();
    }
  },
  
  singleExport: function(recordId) {
    this._recordCount = 1;
    this._searchFunction = this._parent.storage.selectBy.bind(this._parent.storage, "id", recordId);
    this._startExport()
  }
}