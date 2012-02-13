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

/** 
 * Load these heuristics anyway as they are harmless to the page. 
 */

if(!window.LOADED) {
  loader= new DOMSnitch.Loader();
  loader.loadModule("DOMSnitch", "glue/DOMSnitch.js", false);
  loader.loadModule("DOMSnitch.Modules.Base", "modules/Base.js", false);
  loader.loadModule("DOMSnitch.Modules.XmlHttpRequest", "modules/XmlHttpRequest.js", false);
  loader.load();


  /*
   * Create a list of the heuristics that we would want to always run. These
   * heuristics must be completely harmless and must not impact the page's
   * performance.
   */
  if(!window.hList) {
    hList = [];
  }
  hList.push("Json");
  hList.push("MixedContent");
  hList.push("ReflectedInput");
  hList.push("ScriptSource");
  hList.push("ScriptInclusion");
  hList.push("Plugins");
  
  for(var i = 0 ; i < hList.length; i++) {
    var hClass = DOMSnitch.Heuristics[hList[i]];
    
    if(!!hClass) {
      hObj = new hClass();
      hClass.loaded = true;
    }
  }
  
  window.LOADED = true;
}

/** 
 * Only apply these heuristics if page is in scope. 
 */
if(!!window.IN_SCOPE) {
  window.USE_DEBUG &= !!window.IN_SCOPE;

  loader.loadModule("DOMSnitch.Modules.Document", "modules/Document.js", false);
  loader.loadModule("DOMSnitch.Modules.Window", "modules/Window.js", false);
  loader.load();
  
  var hList = Object.getOwnPropertyNames(DOMSnitch.Heuristics);
  for(var i = 0; i < hList.length; i++) {
    var hClass = DOMSnitch.Heuristics[hList[i]];
    
    if(!!hClass && !hClass.loaded && !hClass.EXPERIMENTAL) {
      hObj = new hClass();
      hClass.loaded = true;
    }
  }
}