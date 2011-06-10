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

var scanner = new DOMSnitch.Scanner;
var testCount = 0;
function buildRecord() {
  return {type: "", data: "", env: {location: "", referrer: "", cookie: ""}};
}

function runTest(record, expCode) {
  testCount++;
  try {
    var check = scanner.check(record);

    if(check.code == expCode) {
      console.debug("Test " + testCount + ": PASSED.");
    } else {
      console.error("Test " + testCount + ": FAILED!");
      console.error(check)
    } 
  } catch(e) {
    console.error("Test " + testCount + ": FAILED! " + e.toString());
  }
}

// Test 1
var record = buildRecord();
record.type = "doc.write";
record.data = "val1... val4";
record.env.location = "http://www.example.com/?param1=val1#param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.MED);

//Test 2
var record = buildRecord();
record.type = "doc.write";
record.data = "val1... val4";
record.env.referrer = "http://www.example.com/?param1=val1#param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.MED);

//Test 3
var record = buildRecord();
record.type = "doc.write";
record.data = "val1... val4";
record.env.cookie = "param1=val1; param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.MED);

//Test 4
var record = buildRecord();
record.type = "doc.domain";
record.data = "foo.example.com";
record.env.location = "http://www.example.com/"; 
runTest(record, DOMSnitch.Scanner.STATUS.MED);

//Test 5
var record = buildRecord();
record.type = "script.src";
record.data = "http://www.r-n-d.org/foo.js";
record.env.location = "http://www.example.com/"; 
runTest(record, DOMSnitch.Scanner.STATUS.HIGH);

//Test 6
var record = buildRecord();
record.type = "script.src";
record.data = "about:blank";
record.env.location = "http://www.example.com/"; 
runTest(record, DOMSnitch.Scanner.STATUS.NONE);

//Test 7
var record = buildRecord();
record.type = "script.src";
record.data = "chrome-extension://abc/foo.js";
record.env.location = "http://www.example.com/"; 
runTest(record, DOMSnitch.Scanner.STATUS.LOW);

//Test 8
var record = buildRecord();
record.type = "script.src";
record.data = "http://www.example.com/foo.js";
record.env.location = "https://www.example.com/"; 
runTest(record, DOMSnitch.Scanner.STATUS.HIGH);

//Test 9
var record = buildRecord();
record.type = "win.eval";
record.data = "{foo: \"test\"}";
runTest(record, DOMSnitch.Scanner.STATUS.NONE);

//Test 10
var record = buildRecord();
record.type = "win.eval";
record.data = "({foo: \"test\"})";
runTest(record, DOMSnitch.Scanner.STATUS.NONE);


//Test 11
var record = buildRecord();
record.type = "win.eval";
record.data = "{this.foo = 2}";
runTest(record, DOMSnitch.Scanner.STATUS.NONE);

//Test 12
var record = buildRecord();
record.type = "win.eval";
record.data = "({foo: 'test'})";
runTest(record, DOMSnitch.Scanner.STATUS.MED);

//Test 13
var record = buildRecord();
record.type = "win.eval";
record.data = "({foo: alert(123)})";
runTest(record, DOMSnitch.Scanner.STATUS.HIGH);

//Test 14
var record = buildRecord();
record.type = "doc.write";
record.data = "val1<script>alert(123)</script>... val4";
record.env.cookie = "param1=val1<script>alert(123)</script>; param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.HIGH);

//Test 15
var record = buildRecord();
record.type = "anchor.href";
record.data = "val1...//whatever else the URL is";
record.env.location = "http://www.example.com/?param1=val1#param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.MED);

//Test 16
var record = buildRecord();
record.type = "anchor.href";
record.data = "http://www.example.com/?param1=val1";
record.env.location = "http://www.example.com/?param1=val1#param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.NONE);

//Test 17
var record = buildRecord();
record.type = "iframe.src";
record.data = "val1...//whatever else the URL is";
record.env.location = "http://www.example.com/?param1=val1#param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.MED);


var record = buildRecord();
record.type = "script.src";
record.data = "//ssl.example.com/example.js";
record.env.location = "http://www.example.com/?param1=val1#param2=val2"; 
runTest(record, DOMSnitch.Scanner.STATUS.NONE);
