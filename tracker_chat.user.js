// ==UserScript==
// @name           Tracker Chat
// @namespace      http://peeja.com/
// @include        http://www.pivotaltracker.com/projects/*
// ==/UserScript==


var code = function() {
  function onAppLoad() {
    Panel.CHAT = "chat";
    
    app.layout.registerPanel(Panel.CHAT, function() { return new ChatWidget(); }, {
      // storyHomeFunctor: function() {console.log("storyHomeFunctor(",arguments,")");},
      // openPanelFunctor: function() {console.log("openPanelFunctor(",arguments,")");},
      startSortNumber: 10000
    });

    ChatWidget = Class.create(Widget, {
      initialize: function() {},
      getTitle: function() {
        return "Chat"
      },
      fillInWidgets: function() {},
      render: function() {
        this.contents = Element.newDiv("Foo!", {id: "foo"});
        this.contents.style.backgroundColor = "red";
        return this.contents;
      },
      needsRenderDelay: function() {
        false;
      },
      open: function() {},
      onResize: function(widthPercent, heightPixels) {
        this.contents.style.height = heightPixels + "px";
      }
    });
    
    app.layout.openPanel(Panel.CHAT);
  }
  
  (function() {
    if (typeof App != "undefined" && App.isLoaded())
      onAppLoad();
    else {
      setTimeout(arguments.callee, 10);
    }
  })()
};

// Run code in page context (not priveliged GM context).
var script = document.createElement("script");
script.type = "application/javascript";
script.innerHTML = "(" + code + ")();";

document.body.appendChild(script);
