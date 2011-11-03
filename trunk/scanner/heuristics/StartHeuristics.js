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

loader= new DOMSnitch.Loader();
loader.loadModule("DOMSnitch", "glue/DOMSnitch.js", false);
loader.loadModule("DOMSnitch.Modules.Base", "modules/Base.js", false);
loader.loadModule("DOMSnitch.Modules.Document", "modules/Document.js", false);
loader.loadModule("DOMSnitch.Modules.Window", "modules/Window.js", false);
loader.loadModule("DOMSnitch.Modules.XmlHttpRequest", "modules/XmlHttpRequest.js", false);
loader.load();

var globalId = new DOMSnitch.Heuristics.GlobalIdManager();
var httpHeaders = new DOMSnitch.Heuristics.HttpHeaders();
var json = new DOMSnitch.Heuristics.Json();
var mixedContent = new DOMSnitch.Heuristics.MixedContent();
var reflectedInput = new DOMSnitch.Heuristics.ReflectedInput();
var scriptSource = new DOMSnitch.Heuristics.ScriptSource();
var scriptInclusion = new DOMSnitch.Heuristics.ScriptInclusion();