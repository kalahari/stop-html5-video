const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

var WindowListener = {
  setupBrowserUI: function(window) {
    stopTube.bind(window);
  },

  tearDownBrowserUI: function(window) {
    stopTube.unbind(window);
  },

  // nsIWindowMediatorListener functions
  onOpenWindow: function(xulWindow) {
    // A new window has opened
    let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindow);

    // Wait for it to finish loading
    domWindow.addEventListener('load', function listener() {
      domWindow.removeEventListener('load', listener, false);

      // If this is a browser window then setup its UI
      if (domWindow.document.documentElement.getAttribute('windowtype') == 'navigator:browser')
        WindowListener.setupBrowserUI(domWindow);
    }, false);
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
};

function install(data, reason) {
}

function uninstall(data, reason) {
}

function startup(data, reason) {

  let resource = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler);
  let alias = Services.io.newFileURI(data.installPath);
  if (!data.installPath.isDirectory())
    alias = Services.io.newURI('jar:' + alias.spec + '!/', null, null);
  resource.setSubstitution('stop-tube', alias);

  Cu.import('resource://stop-tube/__version__/stoptube.js');

  stopTube.init();

  let wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

  // Get the list of browser windows already open
  let windows = wm.getEnumerator('navigator:browser');
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

    WindowListener.setupBrowserUI(domWindow);
  }

  // Wait for any new browser windows to open
  wm.addListener(WindowListener);
}

function shutdown(data, reason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (reason == APP_SHUTDOWN)
    return;

  let resource = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler);
  resource.setSubstitution('stop-tube', null);

  let wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

  // Get the list of browser windows already open
  let windows = wm.getEnumerator('navigator:browser');
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

    WindowListener.tearDownBrowserUI(domWindow);
  }

  // Stop listening for any new browser windows to open
  wm.removeListener(WindowListener);
}