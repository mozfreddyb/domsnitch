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

function importConfig() {
  var params = window.location.hash;
  if(/^#data=/.test(params)) {
    window.localStorage["ds-config-data"] = params.substring(6);
  } else if(/^#url=/.test(params)) {
    var configUrl = params.substring(5);
    window.localStorage["ds-config-url"] = configUrl;
    delete window.localStorage["ds-config-data"];
    
    var backgroundPage = chrome.extension.getBackgroundPage();
    availOptions = backgroundPage.base.configManager.applyConfig();
  }
}

window.parent && window.parent.postMessage("installed.", "*");

document.addEventListener("DOMContentLoaded", importConfig, true);
window.addEventListener("hashchange", importConfig, true);