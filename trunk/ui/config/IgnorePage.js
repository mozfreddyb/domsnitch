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

DOMSnitch.UI.Config.IgnorePage = function() {
  this._title = "Ignore Rules";
}

DOMSnitch.UI.Config.IgnorePage.prototype = new DOMSnitch.UI.Config.Page;

DOMSnitch.UI.Config.IgnorePage.prototype._buildTable = function(document) {
  // This is simplified HTML of the section.
  var contents = [
    {
      tag: "table", 
      attr: ["id=rules-table"], 
      children: [
        {
          tag: "tr", 
          attr: ["id=rules-headerRow"],
          children: [
            {tag: "td", text: "URL pattern"},
            {tag: "td", text: "Heuristic"},
            {tag: "td", attr: ["colspan=2"], text: "Ignore condition"}
          ]
        }
      ]
    },
    {
      tag: "button", 
      text: "Add new rule", 
      click: this._showDialog.bind(this, null)
    }
  ];

  return this._createSection(document, "Rules", contents);
}

DOMSnitch.UI.Config.IgnorePage.prototype._buildDialog = function(document) {
  var changeHint = function(event) {
    var select = event.target;
    var hint = select.options[select.selectedIndex].getAttribute("hint");
    
    document.getElementById("rule-hint").textContent = hint;
  };
  
  // This is simplified HTML of the section.
  var contents = [
    {
      tag: "table",
      children: [
        {
          tag: "tr",
          children: [
            {tag: "td", text: "Heuristic:"},
            {
              tag: "td", 
              children: [{
                tag: "select", 
                attr: ["id=rule-heuristic"],
                click: changeHint,
                children:[
                  {
                    tag: "option", 
                    attr: [
                      "value=Reflected input",
                      "hint=E.g.: term=foo;source=hash;sink=attribute"
                    ],
                    text: "Reflected input"
                  },
                  {
                    tag: "option",
                    attr: [
                      "value=HTTP headers",
                      "hint=E.g.: x-frame-options,charset"
                    ],
                    text: "HTTP headers"
                  },
                  {
                    tag: "option",
                    attr: [
                      "value=XPC monitor",
                      "hint=E.g.: sameorigin,www.example.com,http://example.com"
                    ],
                    text: "XPC monitor"
                  }
                ]
              }]
            }
          ]
        },
        {
          tag: "tr",
          children: [
            {tag: "td", text: "URL pattern:"},
            {
              tag: "td", 
              children: [
                {tag: "input", attr: ["id=rule-url", "type=text", "size=50"]},
                {
                  tag: "div", 
                  text: "Wildcards are allowed when describing the URL pattern."
                }
              ]
            }
          ]
        },
        {
          tag: "tr",
          children: [
            {tag: "td", text: "Ignore conditions:"},
            {
              tag: "td", 
              children: [
                {
                  tag: "input", 
                  attr: ["id=rule-conditions", "type=text", "size=50"]
                },
                {tag: "div", attr: ["id=rule-hint"]}
              ]
            }
          ]
        }
      ],
    },
    {tag: "button", attr: ["id=rule-save"], text: "Save"},
    {tag: "button", text: "Cancel", click: this._hideDialog}
  ];

  
  var dialog = this._createDialog(document, "Add/edit rule", contents);
  dialog.id = "rule-dialog";
  
  return dialog;
}

/** Dialog visibility */
DOMSnitch.UI.Config.IgnorePage.prototype._hideDialog = function() {
  document.getElementById("rule-dialog").style.display = "none";
}

DOMSnitch.UI.Config.IgnorePage.prototype._showDialog = function(rule, ruleId) {
  var ruleDialog = document.getElementById("rule-dialog");
  var leftOffset = document.width / 2 - ruleDialog.offsetWidth / 2;
  var topOffset = document.height / 2 - ruleDialog.offsetHeight / 2;
  ruleDialog.style.display = "block";
  ruleDialog.style.left = leftOffset + "px";
  ruleDialog.style.top = topOffset + "px";

  if(rule) {
    var select = document.getElementById("rule-heuristic");
    select.value = rule.heuristic;
    var hint = select.options[select.selectedIndex].getAttribute("hint");
    
    document.getElementById("rule-hint").textContent = hint;
    document.getElementById("rule-url").value = rule.url;
    document.getElementById("rule-conditions").value = rule.conditions;
    document.getElementById("rule-save").onclick = this._editRule.bind(this, ruleId);
  } else {
    document.getElementById("rule-url").value = "";
    document.getElementById("rule-heuristic").value = "";
    document.getElementById("rule-conditions").value = "";
    document.getElementById("rule-save").onclick = this._addRule.bind(this);
  }
}

/** Rule manipulation */
DOMSnitch.UI.Config.IgnorePage.prototype._addRule = function() {
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  var rule = {
    url: document.getElementById("rule-url").value,
    heuristic: document.getElementById("rule-heuristic").value,
    conditions: document.getElementById("rule-conditions").value
  };
  
  ignoreRules.push(rule);
  window.localStorage["ds-ignoreRules"] = JSON.stringify(ignoreRules);
 
  
  this._hideDialog();
  this._listRules(ignoreRules);
}

DOMSnitch.UI.Config.IgnorePage.prototype._deleteRule = function(ruleId) {
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  ignoreRules.splice(ruleId, 1);
  window.localStorage["ds-ignoreRules"] = JSON.stringify(ignoreRules);

  this._listRules(ignoreRules);
}

DOMSnitch.UI.Config.IgnorePage.prototype._editRule = function(ruleId) {
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  var rule = {
    url: document.getElementById("rule-url").value,
    heuristic: document.getElementById("rule-heuristic").value,
    conditions: document.getElementById("rule-conditions").value
  };
  
  if(ruleId < ignoreRules.length) {
    ignoreRules[ruleId] = rule;
  } else {
    ignoreRules.push(rule);
  }
  window.localStorage["ds-ignoreRules"] = JSON.stringify(ignoreRules);
  
  this._hideDialog();
  this._listRules(ignoreRules);
}

DOMSnitch.UI.Config.IgnorePage.prototype._listRules = function(ignoreRules) {
  var table = document.getElementById("rules-table");
  var headerRow = document.getElementById("rules-headerRow");
  
  // Clear the table contents
  table.textContent = "";
  table.appendChild(headerRow);
  
  // Populate the table with ignore rules
  for(var i = 0; i < ignoreRules.length; i++) {
    var rule = ignoreRules[i];
    var row = document.createElement("tr");
    row.id = "rule" + i;
    
    var urlCell = document.createElement("td");
    urlCell.textContent = rule.url;
    row.appendChild(urlCell);
    
    var heuristicCell = document.createElement("td");
    heuristicCell.textContent = rule.heuristic;
    row.appendChild(heuristicCell);
    
    var conditionsCell = document.createElement("td");
    conditionsCell.textContent = rule.conditions;
    row.appendChild(conditionsCell);
    
    var mgmtCell = document.createElement("td");
    mgmtCell.setAttribute("width", "160");
    row.appendChild(mgmtCell);
    
    var edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.addEventListener("click", this._showDialog.bind(this, rule, i));
    mgmtCell.appendChild(edit);
    
    var del = document.createElement("button");
    del.textContent = "Delete";
    del.addEventListener("click", this._deleteRule.bind(this, i));
    mgmtCell.appendChild(del);
    
    table.appendChild(row);
  }
}

/** Page initialization */
DOMSnitch.UI.Config.IgnorePage.prototype._initPage = function() {
  this._hideDialog();
  this._initHint();
  
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  this._listRules(ignoreRules);
}

DOMSnitch.UI.Config.IgnorePage.prototype._initHint = function() {
  var select = document.getElementById("rule-heuristic");
  var hint = select.options[0].getAttribute("hint");
  
  document.getElementById("rule-hint").textContent = hint;
}

/** Render the page */
DOMSnitch.UI.Config.IgnorePage.prototype.render = function(document, canvas) {
  canvas.appendChild(this._buildTable(document));
  canvas.appendChild(this._buildDialog(document));
  
  this._initPage();
}