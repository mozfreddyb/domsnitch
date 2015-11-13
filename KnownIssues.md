## Known issues ##

### Problem #1: I tried intercepting eval() and my application did not load properly ###

Generally speaking, eval() is not a typical function in the JavaScript world. As part of its magic, eval() is aware of the scope from which it is called. More information on this problem is available [here](http://radi.r-n-d.org/2011/02/evil-magic-of-eval.html).


### Problem #2: My application uses applicationCache... ###

Due to caching issues, it is not recommended to intercept innerHTML while the application is pulling data from applicationCache. A workaround is currently not available, but it is a work in progress.


### Problem #3: DOM Snitch is not catching security issues executing at load time through inline JavaScript ###

In its current implementation, DOM Snitch is set to start running on a page as soon as the DOMWindow object is created, but before the DOM tree is built. This allows the extension to act either as soon as it's instantiated or when any of the DOM modification events get dispatched. Relying on the events, however, comes with a cost and that is the inability to know what caused the event to be dispatched in the first place; therefore resulting in the tool's inability to gather proper debug information.

Disclaimer: Currently DOM Snitch does not use any of the V8 debugging functionality. More on this topic is available [here](http://radi.r-n-d.org/2011/07/on-dom-snitch-internals-and-some-of.html).