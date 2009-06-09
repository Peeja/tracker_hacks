// ==UserScript==
// @name           Tracker Lighthouse Panel
// @namespace      http://peeja.com/
// @include        http://www.pivotaltracker.com/projects/*
// ==/UserScript==

var trackerCode = function() {
  
}

var settingsCode = function() {
  var section = <html><![CDATA[
    <div id="lighthouse_settings" class="content_section">
      <h2>Lighthouse</h2>
      <table class="form_table">
        <tr><td class="label_column"><label for="project_lighthouse_account">Lighthouse Account</label></td><td class="field_column"><input id="project_lighthouse_account" name="project[lighthouse_account]" type="input" />.lighthouseapp.com</td></tr>
        <tr><td class="label_column"><label for="project_lighthouse_project_id">Project ID</label></td><td class="field_column"><input id="project_lighthouse_project_id" class="short_field" name="project[lighthouse_project_id]" type="input" size="3" /></td></tr>
        <tr><td class="label_column"><label for="project_lighthouse_api_token">Lighthouse API Token</label></td><td class="field_column"><input id="project_lighthouse_api_token" name="project[lighthouse_api_token]" type="input" /></td></tr>
      </table>
    </div>
  ]]></html>.toString();
  
  $$(".content_section")[2].insert({after: section});
  
  // On submit, save the Lighthouse settings in a cookie, then remove the
  // fields and resubmit so that we don't send the info to Tracker.
  $("settings_form").observe("submit", function(e) {
    if (this.down("#lighthouse_settings")) {
      e.stop();
    
      var settings = this.serialize(true);
      createCookie("lighthouseSettings", [settings["project[lighthouse_account]"],
                                          settings["project[lighthouse_project_id]"],
                                          settings["project[lighthouse_api_token]"]].join("|"));
    
      $("lighthouse_settings").remove();
    
      this.submit();
    }
  });
  
  
  
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
}

// Run code in page context (not priveliged GM context).
var script = document.createElement("script");
script.type = "application/javascript";

if (/\/projects\/\d+\/settings\/?$/.test(window.location.href))
  script.innerHTML = "(" + settingsCode + ")();";
else if (/\/projects\/\d+\/?$/.test(window.location.href))
  script.innerHTML = "(" + trackerCode + ")();";

document.body.appendChild(script);
