// ==UserScript==
// @name           Tracker Lighthouse Panel
// @namespace      http://peeja.com/
// @include        http://www.pivotaltracker.com/projects/*
// ==/UserScript==

// Adds the contents of the given function to the page.
function insertScript(code) {
  // Run code in page context (not priveliged GM context).
  var script = document.createElement("script");
  script.type = "application/javascript";
  script.innerHTML = "(" + code + ")();";
  document.body.appendChild(script);
}


// Add Lighthouse API.

insertScript(function() {
  String.evalJSON = function(json, sanitize) {
    return json.evalJSON(sanitize);
  };
  
  // Cookies - from http://www.quirksmode.org/js/cookies.html
  
  function createCookie(name,value,days) {
  	if (days) {
  		var date = new Date();
  		date.setTime(date.getTime()+(days*24*60*60*1000));
  		var expires = "; expires="+date.toGMTString();
  	}
  	else var expires = "";
  	document.cookie = name+"="+value+expires+"; path=/";
  }

  function readCookie(name) {
  	var nameEQ = name + "=";
  	var ca = document.cookie.split(';');
  	for(var i=0;i < ca.length;i++) {
  		var c = ca[i];
  		while (c.charAt(0)==' ') c = c.substring(1,c.length);
  		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  	}
  	return null;
  }

  function eraseCookie(name) {
  	createCookie(name,"",-1);
  }
  
  Lighthouse = window.Lighthouse || {}
  Lighthouse.settings = function(s) {
    if (s)
      createCookie("lighthouseSettings", $H(s).toJSON());
    else
      return readCookie("lighthouseSettings").evalJSON(true);
  };
  
  Lighthouse.Ticket = Class.create({
    initialize: function(json_ticket) {
      Object.extend(this, json_ticket);
    },
    id: function() {
      return this.number;
    }
  });
  
  Object.extend(Lighthouse.Ticket, {
    _tickets: {},
    query: function(query, handler) {
      this._raw_query(query, function(json_tickets) {
        handler(json_tickets.map(function(json_ticket) {
          var ticket = new Lighthouse.Ticket(json_ticket.ticket);
          Lighthouse.Ticket._tickets[ticket.id()] = ticket;
          return ticket;
        }));
      });
    }
  });
});

unsafeWindow.Lighthouse.Ticket._raw_query = function(query, handler) {
  var settings = unsafeWindow.Lighthouse.settings();
  var queryString = unsafeWindow.Object.toQueryString({q: query});
  
  setTimeout(GM_xmlhttpRequest, 0, {
    method: "GET",
    url: "http://"+settings.lighthouse_account+".lighthouseapp.com/projects/"+settings.lighthouse_project_id+"/tickets?"+queryString,
    headers: {
      "User-Agent": navigator.userAgent,
      "Accept": "application/json",
      "X-LighthouseToken": settings.lighthouse_api_token
    },
    onload: function(response) {
      handler(unsafeWindow.String.evalJSON(response.responseText, true).tickets);
    }
  });
};


var trackerCode = function() {
  function onAppLoad() {
    Panel.LIGHTHOUSE = "lighthouse";
    Panel.UNCLONEABLE_PANELS += [Panel.LIGHTHOUSE];
    
    app.layout.registerPanel(Panel.LIGHTHOUSE, function() {
      // Preload some tickets.  TODO: Remove this shim.
      Lighthouse.Ticket.query("", function() {});
      return new ItemListWidget("Lighthouse", "TODO", new LighthouseWidgetSource(app.project));
    },{
      startSortNumber: 9000
    });
    
    LighthouseWidgetSource = Class.create(AbstractWidgetSource, {
      initialize: function(project) {
        this.super_init(project, "lighthouse");
      },
      myDomainObjects: function() {
        // TODO: remove this shim.
        return $H(Lighthouse.Ticket._tickets).values();
      },
      createWidgets: function(itemListWidget) {
        return this.myDomainObjects().map(function(ticket) {
          return this._createWidget(ticket, itemListWidget);
        }.bind(this));
      },
      createWidgetForId: function(id, itemListWidget) {
        return this._createWidget(Lighthouse.Ticket._tickets[id], itemListWidget);
      },
      _createWidget: function(ticket, itemListWidget) {
        return new ItemWidget("ticket", new LighthouseTicketWidget(ticket), itemListWidget);
      },
      getMyIterations: function() {
        return [];
      }
    });
    
    LighthouseTicketWidget = Class.create(Widget, {
      initialize: function(ticket) {
        this.super_init("LighthouseTicket", "ticket");
        this.ticket = ticket;
      },
      render: function() {
        this.renderedElement = Element.newDiv('Ticket!', {
            id: this.htmlId()
        });
        return this.renderedElement;
      },
      htmlId: function() {
        return "ticket_" + this.ticket.id();
      },
      id: function() {
        return this.ticket.id();
      }
    });
    
    view_menu.insertItem({text: "Lighthouse", onclick: {fn: function() {app.layout.togglePanel(Panel.LIGHTHOUSE);}}}, 5);
    app.layout.togglePanel(Panel.LIGHTHOUSE);
  }
  
  (function() {
    if (typeof App != "undefined" && App.isLoaded())
      onAppLoad();
    else {
      setTimeout(arguments.callee, 10);
    }
  })();
};

var settingsCode = function() {
  $$(".content_section")[2].insert({after: <html><![CDATA[
    <div id="lighthouse_settings" class="content_section">
      <h2>Lighthouse</h2>
      <table class="form_table">
        <tr>
          <td class="label_column"><label for="project_lighthouse_account">Lighthouse Account</label></td>
          <td class="field_column"><input id="project_lighthouse_account" name="project[lighthouse_account]" type="input" />.lighthouseapp.com</td>
        </tr>
        <tr>
          <td class="label_column"><label for="project_lighthouse_project_id">Project ID</label></td>
          <td class="field_column"><input id="project_lighthouse_project_id" class="short_field" name="project[lighthouse_project_id]" type="input" size="3" /></td>
        </tr>
        <tr>
          <td class="label_column"><label for="project_lighthouse_api_token">Lighthouse API Token</label></td>
          <td class="field_column"><input id="project_lighthouse_api_token" name="project[lighthouse_api_token]" type="input" /></td>
        </tr>
      </table>
    </div>
  ]]></html>.toString()});
  
  $H(Lighthouse.settings()).each(function(pair) {
    $("project_"+pair.key).value = pair.value;
  });
  
  // On submit, save the Lighthouse settings in a cookie, then remove the
  // fields and resubmit so that we don't send the info to Tracker.
  $("settings_form").observe("submit", function(e) {
    if (this.down("#lighthouse_settings")) {
      e.stop();
    
      var settings = this.serialize(true);
      
      $H(Lighthouse.settings($w("lighthouse_account lighthouse_project_id lighthouse_api_token")).inject({}, function(h, setting) {
        h[setting] = settings["project["+setting+"]"];
        return h;
      }));
      
      $("lighthouse_settings").remove();
    
      this.submit();
    }
  });
};

if (/\/projects\/\d+\/settings\/?$/.test(window.location.pathname))
  insertScript(settingsCode);
else if (/\/projects\/\d+\/?$/.test(window.location.pathname))
  insertScript(trackerCode);

