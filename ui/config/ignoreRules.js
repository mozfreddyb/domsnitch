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

function init() {
  hideRuleDialog();
  initHint();
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  
  document.getElementById("rules-addRule").addEventListener("click", showRuleDialog.bind(this, null));
  document.getElementById("rule-cancel").addEventListener("click", hideRuleDialog);
  document.getElementById("rule-heuristic").addEventListener("change", changeHint, true);

  listRules(ignoreRules);
  console.debug(ignoreRules);
}

function addRule() {
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  var rule = {
    url: document.getElementById("rule-url").value,
    heuristic: document.getElementById("rule-heuristic").value,
    conditions: document.getElementById("rule-conditions").value
  };
  
  ignoreRules.push(rule);
  window.localStorage["ds-ignoreRules"] = JSON.stringify(ignoreRules);
 
  
  hideRuleDialog();
  listRules(ignoreRules);
  console.debug(rule);
}

function deleteRule(ruleId) {
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  ignoreRules.splice(ruleId, 1);
  window.localStorage["ds-ignoreRules"] = JSON.stringify(ignoreRules);
  
  listRules(ignoreRules);
}

function editRule(ruleId) {
  var ignoreRules = JSON.parse(window.localStorage["ds-ignoreRules"]);
  var rule = {
    url: document.getElementById("rule-url").value,
    heuristic: document.getElementById("rule-heuristic").value,
    conditions: document.getElementById("rule-conditions").value
  };
  
  console.debug(ruleId);
  
  if(ruleId < ignoreRules.length) {
    ignoreRules[ruleId] = rule;
  } else {
    ignoreRules.push(rule);
  }
  window.localStorage["ds-ignoreRules"] = JSON.stringify(ignoreRules);
  
  hideRuleDialog();
  listRules(ignoreRules);
}

function listRules(ignoreRules) {
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
    row.appendChild(mgmtCell);
    
    var edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.addEventListener("click", showRuleDialog.bind(this, rule, i));
    mgmtCell.appendChild(edit);
    
    var del = document.createElement("button");
    del.textContent = "Delete";
    del.addEventListener("click", deleteRule.bind(this, i));
    mgmtCell.appendChild(del);
    
    table.appendChild(row);
  }
}

/** Helper functions for the dialog box. */
function initHint() {
  var select = document.getElementById("rule-heuristic");
  var hint = select.options[0].getAttribute("hint");
  
  document.getElementById("rule-hint").textContent = hint;
}

function changeHint(event) {
  console.debug(event);
  var select = event.target;
  var hint = select.options[select.selectedIndex].getAttribute("hint");
  
  document.getElementById("rule-hint").textContent = hint;
}

function hideRuleDialog() {
  document.getElementById("rule-dialog").style.visibility = "hidden";
}

function showRuleDialog(rule, ruleId) {
  var ruleDialog = document.getElementById("rule-dialog");
  var leftOffset = document.width / 2 - ruleDialog.offsetWidth / 2;
  var topOffset = document.height / 2 - ruleDialog.offsetHeight / 2;
  ruleDialog.style.visibility = "visible";
  ruleDialog.style.left = leftOffset + "px";
  ruleDialog.style.top = topOffset + "px";

  if(rule) {
    var select = document.getElementById("rule-heuristic");
    select.value = rule.heuristic;
    var hint = select.options[select.selectedIndex].getAttribute("hint");
    
    document.getElementById("rule-hint").textContent = hint;
    document.getElementById("rule-url").value = rule.url;
    document.getElementById("rule-conditions").value = rule.conditions;
    document.getElementById("rule-save").onclick = editRule.bind(this, ruleId);
  } else {
    document.getElementById("rule-url").value = "";
    document.getElementById("rule-heuristic").value = "";
    document.getElementById("rule-conditions").value = "";
    document.getElementById("rule-save").onclick = addRule;
  }
}

document.addEventListener("DOMContentLoaded", init);