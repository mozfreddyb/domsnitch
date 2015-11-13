## DOM Snitch - a passive reconnaissance tool inside the DOM ##
  * Written and maintained by [Radoslav Vasilev](http://radi.r-n-d.org) <[radi@google.com](mailto:radi@google.com)>
  * Copyright 2011 Google Inc, rights reserved.
  * Released under terms and conditions of the Apache License, version 2.0.

### What is DOM Snitch? ###
DOM Snitch is an experimental Chrome extension that enables non-security testers identify common bad practices when producing client-side code and security testers gain better understanding of the transformations that occur within the DOM.

DOM Snitch works by injecting a series of interceptors, also referred to as “hooks”, that allow the tool to listen when a page interacts with key (and sometimes dangerous) browser infrastructure such as window.postMessage, window.eval, or document.write (a complete list of the hooks is available [here](DOMSnitchDoc#What_can_DOM_Snitch_intercept?.md)). Once a hook has been triggered, DOM Snitch gathers and stores various debug information from the execution stack (details are available [here](DOMSnitchDoc#What_information_can_I_expect_from_DOM_Snitch?.md)). If configured to modify data on the fly, DOM Snitch will wait for the tester to modify the used data as needed before letting normal execution to proceed.

**Important note:** Although we’d like interception to be as transparent as possible to the web application under test, we have to state that DOM Snitch is still in its alpha days and hick-ups may occur.


### What does DOM Snitch intercept? ###
In order to minimize its footprint on the application under test, DOM Snitch only intercepts the following methods.
| **Name of method/property** | **Capable of recording** |
|:----------------------------|:-------------------------|
| document.write              | Yes                      |
| document.writeln            | Yes                      |
| Message events that have been triggered by the postMessage API | Yes                      |
| window.eval                 | Yes                      |
| XMLHttpRequest.open         | Yes                      |
| XMLHttpRequest.send         | Yes                      |
| XMLHttpRequest.setRequestHeader | Yes                      |


### How does DOM Snitch work under the hood? ###
DOM Snitch uses a couple of strategies to intercept methods and properties within the DOM:
  * **Method overloading.** Methods in JavaScript are overwritten by custom code while preserving pointers to their original implementation. Once DOM Snitch is finished collecting the necessary debug information, it will invoke the original calls as intended.
  * **Prototype hijacking.** Publicly known as prototype hijacking, this technique is identical to the method overloading approach that we use elsewhere. However, the main difference is that the overloading happens at the object’s prototype. This approach is used for the XMLHttpRequest and Storage objects where methods are overloaded at the prototype level.
  * **Defining getters and setters.** Properties in JavaScript are intercepted using the defineGetter() and defineSetter() methods. Because the original pointers for some properties of the HTML elements cannot be preserved, DOM Snitch uses a substitution technique where data is either set as an attribute to the element or passed through an intermediary HTML element that has been left unmodified and thus able to properly render the given data.

In addition, DOM Snitch relies heavily on various events that get triggered when the DOM changes state.


### How do I operate DOM Snitch? ###
To start/stop DOM Snitch, click on the "Run DOM Snitch" item in the context menu of any page where DOM Snitch is present. To configure the extension, simply select "Configure…" from the context menu`*`.

Note that by default DOM Snitch will monitor all new tabs that are opened after the extension has been enabled. All tabs that have been opened prior to that will remain unmonitored.

`*` Starting with version 0.723, DOM Snitch also supports the use of configuration files to ensure consistent deployment across multiple running instances of the extension. Documentation on how to use is available [here](ConfigFiles.md).

### What information can I expect from DOM Snitch? ###
Through the activity log, DOM Snitch provides testers with the visibility of the DOM modifications that pose a security risk. An item in the activity log will provide these details:
  * **Document URL.** The URL of the document where the information was recorded.
  * **Stack trace.** If applicable, a detailed call stack trace containing source URL, arguments, and actual code for each frame.
  * **Data used.** Depending on the heuristic that reported the finding, this field will provide any relevant information (e.g. arguments to a JavaScript call, HTTP headers, HTML snippets, etc.) that can help identify if the reported finding is a security issue.


Items in the activity log may be highlighted with:
  * **Red:** A security bug is spotted.
  * **Yellow:** An issue that may or may not be a security bug is spotted.
  * **Green:** An issue that has minimal impact on security is spotted.
  * **Gray:** Multiple instances of the same modification are spotted.


When hovered over, all modifications colored green, yellow, or red will provide details on why they are highlighted.


### Credits and feedback ###
DOM Snitch is made possible thanks to the contributions of, and valuable feedback from, Google's engineering productivity and information security engineering teams.

If you have any bug reports, questions, suggestions, or concerns regarding the application, the author can be reached at [radi@google.com](mailto:radi@google.com).