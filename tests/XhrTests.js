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

var configData = {"innerHTML": false};

var snitch = new DOMSnitch(configData);

// Test 1
try {
  var div = document.createElement("div");
  if(!div) {
    console.error("Test 1: FAILED! Unable to create new HTML element: " + div);
  } else {
    console.debug("Test 1: PASSED.");
  }
} catch (e) {
  console.error("Test 1: FAILED! " + e.toString());
}


// Test 2
try {
  document.body.appendChild(div);
  div.innerHTML = "<b>te<i>st</i></b>";
  
  console.debug("Test 2: PASSED.");
} catch (e) {
  console.error("Test 2: FAILED! " + e.toString());
}