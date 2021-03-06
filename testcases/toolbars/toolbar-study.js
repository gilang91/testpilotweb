BaseClasses = require("study_base_classes.js");

const ToolbarWidget = {
  // Customization ids:
  UNKNOWN: -1,
  UNIFIED_BACK_FWD: 0,
  RELOAD: 1,
  STOP: 2,
  HOME: 3,
  URLBAR: 4,
  SPACER: 5, // also covers splitters, flex, etc
  SEARCH: 6,
  PERSONAL_BOOKMARKS: 7,
  MENU_BAR: 8,

  // These are things that aren't normally in the toolbar but can be added:
  THROBBER: 9,
  DOWNLOADS_BUTTON: 10,
  PRINT_BUTTON: 11,
  BOOKMARKS_BUTTON: 12,
  HISTORY_BUTTON: 13,
  NEW_TAB_BUTTON: 14, // not to be confused with TABBAR_NEW_BTN below
  NEW_WINDOW_BUTTON: 15,
  CUT_BUTTON: 16,
  COPY_BUTTON: 17,
  PASTE_BUTTON: 18,
  FULLSCREEN_BUTTON: 19,

  // Stuff that can't be individually customized but still takes events:
  BACK: 20,
  FORWARD: 21,
  DROP_DOWN_RECENT_PAGE: 22,
  TOP_LEFT_ICON: 23, // Windows Only
  SITE_ID_BUTTON: 24,
  SITE_ID_MORE_INFO: 25,
  RSS_ICON: 26,
  BOOKMARK_STAR: 27,
  GO_BUTTON: 28,
  DROP_DOWN_MOST_VISITED: 29,
  SEARCH_ENGINE_DROP_DOWN: 30,
  SEARCH_GO_BUTTON: 31,
  EDIT_BOOKMARK_PANEL: 32,
  TABBAR_SCROLL: 33,
  TABBAR_NEW_BTN: 34, // not to be confused with NEW_TAB_BUTTON under customize
  TABBAR_DROP_DOWN: 36,
  VERTICAL_SCROLLBAR: 37,
  HORIZONTAL_SCROLLBAR: 38,
  STATUS_BAR: 41,
  STATUS_BAR_LOCK: 42,
  CUSTOMIZE_TOOLBAR_MENU: 43

};

// Use for interaction_type field
const ToolbarAction = {
  // for customize events -- what toolbar is the item in?
  CUST_IN_NAVBAR: 0,
  CUST_IN_CUSTOM_TOOLBAR: 1,
  CUST_IN_PERSONAL: 2,
  CUST_IN_MENUBAR: 3,

  // for interaction events -- what did you do to the item?
  CLICK: 4,
  MENU_PICK: 5,
  ENTER_KEY: 6,

  // For search bar:
  REPEATED_SEARCH_SAME_ENGINE: 7,
  REPEATED_SEARCH_DIFF_ENGINE: 8,

  // For status bar hidden/shown and bookmark toolbar count:
  PRESENT: 9,
  ABSENT: 10,

  // For clicks on site id:
  SITE_ID_SSL: 12,
  SITE_ID_EV: 13,
  SITE_ID_NONE: 14,

  // For scroll bars:
  SCROLL_BTN_UP: 15, // or left
  SCROLL_BTN_DOWN: 16, // or right
  SCROLL_SLIDER: 17,
  SCROLL_TRACK: 18,

  // For URL bar:
  MOUSE_DOWN: 19,
  MOUSE_UP: 20,
  MOUSE_DRAG: 21,
  URL_SELECT: 22,
  URL_CHANGE: 23,
  SEARCH_TERM_IN_URL_BAR: 24,

  // For bookmark edit panel:
  PANEL_OPEN: 25,
  REMOVE_BKMK: 26,

  // For reload button:
  RELOAD_WHILE_LOADING: 27
};

// Use for event field
const ToolbarEvent = {
  ACTION: 0,
  CUSTOMIZE: 1,
  STUDY: 2
};

const TOOLBAR_EXPERIMENT_FILE = "testpilot_toolbar_study_results.sqlite";
const TOOLBAR_TABLE_NAME = "testpilot_toolbar_study";

/* On expeirment startup, if the user has customized their toolbars,
 * then we'll record a CUSTOMIZE event for each item the have in their
 * toolbar.
 */

function widgetIdToString(id) {
  for (let x in ToolbarWidget) {
    if (ToolbarWidget[x] == id) {
      return x;
    }
  }
  return id;
}

function actionIdToString(id) {
  for (let x in ToolbarAction) {
    if (ToolbarAction[x] == id) {
      return x;
    }
  }
  return id;
}

var TOOLBAR_EXPERIMENT_COLUMNS =  [
  {property: "event", type: BaseClasses.TYPE_INT_32, displayName: "Event",
   displayValue: ["Action", "Customization", "Study Metadata"]},
  {property: "item_id", type: BaseClasses.TYPE_INT_32, displayName: "Widget",
   displayValue: widgetIdToString},
  {property: "interaction_type", type: BaseClasses.TYPE_INT_32,
   displayName: "Interaction", displayValue: actionIdToString},
  {property: "timestamp", type: BaseClasses.TYPE_DOUBLE, displayName: "Time",
   displayValue: function(value) {return new Date(value).toLocaleString();}}
];

exports.experimentInfo = {
  startDate: null, // Null start date means we can start immediately.
  duration: 5, // Days
  testName: "Toolbar Widgets",
  testId: 6,
  testInfoUrl: "https://testpilot.mozillalabs.com/testcases/toolbar",
  summary: "We would like to have a better understanding of how Firefox's \
current toolbar is commonly used. How often do people click on the Back \
button, how often do people switch search engines? The study data will be \
directly used to improve the toolbar design for Firefox 4.",
  thumbnail: "https://testpilot.mozillalabs.com/testcases/toolbars/toolbar-study-thumbnail.png",
  optInRequired: false,
  recursAutomatically: false,
  recurrenceInterval: 0,
  versionNumber: 7,
  minTPVersion: "1.0a1"
};

exports.dataStoreInfo = {
  fileName: TOOLBAR_EXPERIMENT_FILE,
  tableName: TOOLBAR_TABLE_NAME,
  columns: TOOLBAR_EXPERIMENT_COLUMNS
};

// The per-window observer class:
function ToolbarWindowObserver(window) {
  ToolbarWindowObserver.baseConstructor.call(this, window);
};
BaseClasses.extend(ToolbarWindowObserver, BaseClasses.GenericWindowObserver);
ToolbarWindowObserver.prototype.urlLooksMoreLikeSearch = function(url) {
  // How to tell when a URL looks more like a search?  First approximation:
  // if there are spaces in it.  Second approximation: No periods.
  return ( (url.indexOf(" ") > -1) || (url.indexOf(".") == -1) );
};
ToolbarWindowObserver.prototype.compareSearchTerms = function(searchTerm, searchEngine) {
  if (searchTerm == this._lastSearchTerm) {
    if (searchEngine == this._lastSearchEngine) {
      exports.handlers.record(ToolbarEvent.ACTION,
                              ToolbarWidget.SEARCH,
                              ToolbarAction.REPEATED_SEARCH_SAME_ENGINE);
    } else {
      exports.handlers.record(ToolbarEvent.ACTION,
                              ToolbarWidget.SEARCH,
                              ToolbarAction.REPEATED_SEARCH_DIFF_ENGINE);
    }
  }
  this._lastSearchTerm = searchTerm;
  this._lastSearchEngine = searchEngine;
};
ToolbarWindowObserver.prototype.install = function() {
  // Here are the IDs of objects to listen on:

  console.info("Starting to install listeners for toolbar window observer.");
  let record = function( widget, interaction ) {
    exports.handlers.record(ToolbarEvent.ACTION, widget, interaction);
  };

  let buttonIds = ["back-button", "forward-button", "reload-button", "stop-button",
                   "home-button", "feed-button", "star-button",
                   "identity-popup-more-info-button",
                   "back-forward-dropmarker", "security-button",
                   "downloads-button", "print-button", "bookmarks-button",
                   "history-button", "new-tab-button", "new-window-button",
                   "cut-button", "copy-button", "paste-button", "fullscreen-button"];

  for (let i = 0; i < buttonIds.length; i++) {
    let id = buttonIds[i];
    let elem = this.window.document.getElementById(id);
    if (!elem) {
      console.warn("Can't install listener: no element with id " + id);
      continue;
    }
    this._listen(elem, "mouseup",
                 function(evt) {
                   // only count left button clicks and only on the element itself:
                     // (evt.button = 2 for right-click)
                   if (evt.target == elem && evt.button == 0) {
                     let code = exports.handlers._getNumberCodeForWidget(evt.target);
                     record( code, ToolbarAction.CLICK );
                   }
                 }, false);
    // Problem with just listening for "mouseup" is that it triggers even
    // if you clicked a greyed-out button... we really want something more
    // like "button clicked".  Try listening for "command"?
  }


  // TODO Look out for problems where multiple windows are open and events
  // get recorded multiple times?  May be a problem with the underlying window
  // open/close / experiment startup/shutdown handling logic??

  // Yeah, opening an "inspect chrome" window certainly seems to double up
  // my handlers for the regular window - and this persists even after I close
  // the "inspect chrome" window.

  let self = this;
  let register = function(elemId, event, widgetCode, actionCode) {
    self._listen( self.window.document.getElementById(elemId), event, function() {
                    record(widgetCode, actionCode);}, false);
  };

  // Listen on reload button, see if page is currently loading when reload
  // button is clicked:
  this._listen(this.window.document.getElementById("reload-button"),
               "mouseup",
               function(evt) {
                 let browser = this.window.gBrowser;
                 let tab = browser.getBrowserForTab(browser.selectedTab);
                 if (tab.webProgress.isLoadingDocument) {
                   record(ToolbarWidget.RELOAD, ToolbarAction.RELOAD_WHILE_LOADING);
                 } else {
                 }
               }, false);

  // Listen on site ID button, see if page is SSL, or extended validation,
  // or nothing.  (TODO this triggers again if you click to close; should
  // trigger on popupshown or something.
  let idBox = this.window.document.getElementById("identity-box");
  this._listen(idBox, "mouseup", function(evt) {
                 let idBoxClass = idBox.getAttribute("class");
                 if (idBoxClass.indexOf("verifiedIdentity") > -1) {
                   record( ToolbarWidget.SITE_ID_BUTTON,
                           ToolbarAction.SITE_ID_EV);
                 } else if (idBoxClass.indexOf("verifiedDomain") > -1) {
                   record( ToolbarWidget.SITE_ID_BUTTON,
                   ToolbarAction.SITE_ID_SSL);
                 } else {
                   record( ToolbarWidget.SITE_ID_BUTTON,
                   ToolbarAction.SITE_ID_NONE);
                 }
               }, false);

  register( "feed-menu", "command", ToolbarWidget.RSS_ICON, ToolbarAction.MENU_PICK);

  let bkFwdMenu = this.window.document.getElementById("back-forward-dropmarker").getElementsByTagName("menupopup").item(0);
  this._listen( bkFwdMenu, "command", function() {
                  record(ToolbarWidget.DROP_DOWN_RECENT_PAGE, ToolbarAction.MENU_PICK);
                }, false);

  register( "search-container", "popupshown", ToolbarWidget.SEARCH_ENGINE_DROP_DOWN,
            ToolbarAction.CLICK);
  register( "search-container", "command", ToolbarWidget.SEARCH_ENGINE_DROP_DOWN,
            ToolbarAction.MENU_PICK);

  this._listen(this.window.document.getElementById("back-button"),
               "mouseup", function(evt) {
                 if (evt.originalTarget.tagName == "menuitem") {
                   record(ToolbarWidget.BACK, ToolbarAction.MENU_PICK);
                 }
               }, false);
  this._listen(this.window.document.getElementById("forward-button"),
               "mouseup", function(evt) {
                 if (evt.originalTarget.tagName == "menuitem") {
                   record(ToolbarWidget.FORWARD, ToolbarAction.MENU_PICK);
                 }
               }, false);

  let bkmkToolbar = this.window.document.getElementById("bookmarksBarContent");
  this._listen(bkmkToolbar, "mouseup", function(evt) {
                 if (evt.button == 0 && evt.target.tagName == "toolbarbutton") {
                   record(ToolbarWidget.PERSONAL_BOOKMARKS, ToolbarAction.CLICK);
                 }}, false);

  let searchBar = this.window.document.getElementById("searchbar");
  this._listen(searchBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   record(ToolbarWidget.SEARCH, ToolbarAction.ENTER_KEY);
                   self.compareSearchTerms(searchBar.value,
                                          searchBar.searchService.currentEngine.name);
                 }
               }, false);


  this._listen(searchBar, "mouseup", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "search-go-button") {
                   record(ToolbarWidget.SEARCH_GO_BUTTON, ToolbarAction.CLICK);
                   self.compareSearchTerms(searchBar.value,
                                          searchBar.searchService.currentEngine.name);
                 }
               }, false);

  /* click in search box results in a focus event followed by a select event.
   * If you edit, then when you do a search OR unfocus the box, you get a "changed" event.
   * If you search without editing, you don't get a "changed" event.  We may
   * need to track what input is focused and listen for the enter key to be hit
   * or the search button to be clicked. */

  let urlBar = this.window.document.getElementById("urlbar");
  this._listen(urlBar, "keydown", function(evt) {
                 if (evt.keyCode == 13) { // Enter key
                   record(ToolbarWidget.URLBAR, ToolbarAction.ENTER_KEY);
                   if (self.urlLooksMoreLikeSearch(evt.originalTarget.value)) {
                     record(ToolbarWidget.URLBAR, ToolbarAction.SEARCH_TERM_IN_URL_BAR);
                   }
                 }
               }, false);

  let urlGoButton = this.window.document.getElementById("go-button");
  this._listen(urlGoButton, "mouseup", function(evt) {
                 record(ToolbarWidget.GO_BUTTON, ToolbarAction.CLICK);
                 if (self.urlLooksMoreLikeSearch(urlBar.value)) {
                   record(ToolbarWidget.URLBAR, ToolbarAction.SEARCH_TERM_IN_URL_BAR);
                 }
               }, false);

  self._urlBarMouseState = false;
  this._listen(urlBar, "mouseup", function(evt) {
                 if (self._urlBarMouseState) {
                   record(ToolbarWidget.URLBAR, ToolbarAction.MOUSE_UP);
                   self._urlBarMouseState = false;
                 }
               }, false);
  this._listen(urlBar, "mousedown", function(evt) {
                 if (evt.originalTarget.tagName == "div") {
                   record(ToolbarWidget.URLBAR, ToolbarAction.MOUSE_DOWN);
                   self._urlBarMouseState = true;
                 }
               }, false);
  this._listen(urlBar, "mousemove", function(evt) {
                 if (self._urlBarMouseState) {
                   record(ToolbarWidget.URLBAR, ToolbarAction.MOUSE_DRAG);
                 }
               }, false);

  this._listen(urlBar, "change", function(evt) {
                 record(ToolbarWidget.URLBAR, ToolbarAction.URL_CHANGE);
               }, false);
  this._listen(urlBar, "select", function(evt) {
                 record(ToolbarWidget.URLBAR, ToolbarAction.URL_SELECT);
               }, false);
  // A single click (select all) followed by edit will look like:
  // mouse down, mouse up, selected, changed.
  //
  // Click twice to insert and then edit looks like:
  // mouse down mouse up select, mouse down mouse up change.
  //
  // Click drag and to select and then edit looks like:
  // mouse down mouse move move move move move mouse up select changed.


  // TODO Get clicks on items in URL bar drop-down (or whether an awesomebar
  // suggestion was hilighted when you hit enter?)

  this._listen(urlBar, "popupshown", function(evt) {
                 // TODO this doesn't seem to work.
                 dump("A popup was shown from the url bar...\n");
                 dump("tagname " + evt.originalTarget.tagName + "\n");
                 dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
               }, false);
  this._listen(urlBar, "command", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") == "historydropmarker") {
                   record(ToolbarWidget.DROP_DOWN_MOST_VISITED, ToolbarAction.CLICK);
                 } else {
                   // TODO how do we get the clicks on the actual items in it though?
                   dump("A command came from the url bar...\n");
                   dump("tagname " + evt.originalTarget.tagName + "\n");
                   dump("anonid " + evt.originalTarget.getAttribute("anonid") + "\n");
                 }
               }, false);

  // tabbrowser id="content" contains XBL children anonid="scrollbutton-up"
  // and "scrollbutton-down-stack" and anonid="newtab-button"

  let tabBar = this.window.document.getElementById("content");
  this._listen(tabBar, "mouseup", function(evt) {
                 if (evt.button == 0) {
                   switch (evt.originalTarget.getAttribute("anonid")) {
                   case "scrollbutton-up":
                     record(ToolbarWidget.TABBAR_SCROLL, ToolbarAction.SCROLL_BTN_UP);
                     break;
                   case "scrollbutton-down":
                     record(ToolbarWidget.TABBAR_SCROLL, ToolbarAction.SCROLL_BTN_DOWN);
                     break;
                   case "newtab-button":
                     record(ToolbarWidget.TABBAR_NEW_BTN, ToolbarAction.CLICK);
                     break;
                   default:
                     let parent = evt.originalTarget.parentNode;
                     if (parent.tagName == "scrollbar") {
                       if (parent.parentNode.tagName == "HTML") {
                         let widget;
                         let orientation = parent.getAttribute("orient");
                         if (orientation == "horizontal") { // vs "vertical"
                           widget = ToolbarWidget.HORIZONTAL_SCROLLBAR;
                         } else {
                           widget = ToolbarWidget.VERTICAL_SCROLLBAR;
                         }
                         let part = evt.originalTarget.tagName;
                         if (part == "xul:slider") {
                           // TODO can't distinguish slider from track...
                           record(widget, ToolbarAction.SCROLL_SLIDER);
                         } else if (part == "xul:scrollbarbutton") {
                           let upOrDown = evt.originalTarget.getAttribute("type");
                           if (upOrDown == "increment") { // vs. "decrement"
                             record(widget, ToolbarAction.SCROLL_BTN_UP);
                           } else {
                             record(widget, ToolbarAction.SCROLL_BTN_DOWN);
                           }
                         }
                       }
                     }
                   }
                 }
               }, false);

   this._listen(tabBar, "popupshown", function(evt) {
                 if (evt.originalTarget.getAttribute("anonid") =="alltabs-popup") {
                   record( ToolbarWidget.TABBAR_DROP_DOWN, ToolbarAction.CLICK);
                 }
               }, false);
    this._listen(tabBar, "command", function(evt) {
                   if (evt.originalTarget.tagName == "menuitem") {
                     record( ToolbarWidget.TABBAR_DROP_DOWN, ToolbarAction.MENU_PICK);
                   }
               }, false);
  /* Note we also get command events when you hit the tab scroll bars and
   * they actually scroll (the tagName will be "xul:toolbarbutton") -- as
   * opposed to moseup which triggers even if there's nowhere to scroll, this
   * might be a more precise way to get that event.  In fact look at using
   * more command events on all the toolbar buttons...*/


  let bkmkPanel = this.window.document.getElementById("editBookmarkPanel");
  this._listen(bkmkPanel, "popupshown", function(evt) {
                 record( ToolbarWidget.EDIT_BOOKMARK_PANEL, ToolbarAction.PANEL_OPEN);
               }, false);

  this._listen(bkmkPanel, "command", function(evt) {
                 switch (evt.originalTarget.getAttribute("id")) {
                 case "editBookmarkPanelRemoveButton":
                   record( ToolbarWidget.EDIT_BOOKMARK_PANEL,
                           ToolbarAction.REMOVE_BKMK);
                   break;
                 }
                 // Other buttons we can get here:
                 //editBMPanel_foldersExpander
                 //editBMPanel_tagsSelectorExpander
                 //editBookmarkPanelDeleteButton
                 //editBookmarkPanelDoneButton
               }, false);

  let viewMenu = this.window.document.getElementById("viewToolbarsMenu");
  let customizeToolbarPopup = viewMenu.getElementsByTagName("menupopup")[0];
  this._listen(customizeToolbarPopup, "mouseup", function(evt) {
                 dump("Customize Toolbar Popup was clicked on.\n");
               }, false);

  console.info("Done registering toolbar listeners for window.");
  // also look at id="FindToolbar" and whether it has hidden = true or not.
};

function GlobalToolbarObserver()  {
  GlobalToolbarObserver.baseConstructor.call(this, ToolbarWindowObserver);
}
BaseClasses.extend(GlobalToolbarObserver, BaseClasses.GenericGlobalObserver);
GlobalToolbarObserver.prototype.onExperimentStartup = function(store) {
  GlobalToolbarObserver.superClass.onExperimentStartup.call(this, store);
  // Record study version on startup:
  this.record(ToolbarEvent.STUDY, 0, exports.experimentInfo.versionNumber);

  // Look at the front window and see if its toolbars have been customized;
  // if they have, then record all toolbar customization.
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"]
                        .getService(Ci.nsIWindowMediator);
  let frontWindow = wm.getMostRecentWindow("navigator:browser");
  if (this.toolbarsAreCustomized(frontWindow)) {
    this.recordToolbarCustomizations(frontWindow);
  }

  // How many bookmarks in the bookmark toolbar, and is status bar shown?
  let bkmkToolbar = frontWindow.document.getElementById("bookmarksBarContent");
  let bkmks = bkmkToolbar.getElementsByClassName("bookmark-item");
  for (let b = 0; b < bkmks.length; b++) {
    this.record(ToolbarEvent.CUSTOMIZE, ToolbarWidget.PERSONAL_BOOKMARKS, ToolbarAction.PRESENT);
  }

  let statusBar = frontWindow.document.getElementById("status-bar");
  if (statusBar.getAttribute("hidden") == "true") {
    this.record(ToolbarEvent.CUSTOMIZE, ToolbarWidget.STATUS_BAR, ToolbarAction.ABSENT);
  } else {
    this.record(ToolbarEvent.CUSTOMIZE, ToolbarWidget.STATUS_BAR, ToolbarAction.PRESENT);
  }
};

GlobalToolbarObserver.prototype.record = function(event, itemId,
                                                  interactionType) {
  if (!this.privateMode) {
    this._store.storeEvent({
      event: event,
      item_id: itemId,
      interaction_type: interactionType,
      timestamp: Date.now()
    });
    // storeEvent can also take a callback, which we're not using here.
  }
};

GlobalToolbarObserver.prototype._getNumberCodeForWidget = function(elem) {
  let id = elem.getAttribute("id");
  let tagName = elem.tagName;
  switch (tagName) {
  case "toolbarspacer": case "toolbarspring": case "toolbarseparator":
  case "splitter": case "hbox":
    return ToolbarWidget.SPACER;
    break;
  case "toolbaritem":
    switch(id) {
    case "unified-back-forward-button": return ToolbarWidget.UNIFIED_BACK_FWD;
    case "urlbar-container": return ToolbarWidget.URLBAR;
    case "search-container": return ToolbarWidget.SEARCH;
    case "navigator-throbber": return ToolbarWidget.THROBBER;
    case "personal-bookmarks": return ToolbarWidget.PERSONAL_BOOKMARKS;
    case "menubar-items": return ToolbarWidget.MENU_BAR;
    }
    break;
  case "toolbarbutton":
    switch (id) {
    case "downloads-button": return ToolbarWidget.DOWNLOADS_BUTTON;
    case "print-button": return ToolbarWidget.PRINT_BUTTON;
    case "bookmarks-button": return ToolbarWidget.BOOKMARKS_BUTTON;
    case "history-button": return ToolbarWidget.HISTORY_BUTTON;
    case "new-tab-button": return ToolbarWidget.NEW_TAB_BUTTON;
    case "new-window-button":return ToolbarWidget.NEW_WINDOW_BUTTON;
    case "cut-button":return ToolbarWidget.CUT_BUTTON;
    case "copy-button":return ToolbarWidget.COPY_BUTTON;
    case "paste-button":return ToolbarWidget.PASTE_BUTTON;
    case "fullscreen-button":return ToolbarWidget.FULLSCREEN_BUTTON;
    case "reload-button":return ToolbarWidget.RELOAD;
    case "stop-button":return ToolbarWidget.STOP;
    case "home-button":return ToolbarWidget.HOME;
    case "back-button":return ToolbarWidget.BACK;
    case "forward-button":return ToolbarWidget.FORWARD;
    case "back-forward-dropmarker":return ToolbarWidget.DROP_DOWN_RECENT_PAGE;
    }
    break;
  case "box":
    switch (id) {
    case "identity-box": return ToolbarWidget.SITE_ID_BUTTON;
    }
    break;
  case "image":
    switch (id) {
    case "star-button": return ToolbarWidget.BOOKMARK_STAR;
    case "go-button": return ToolbarWidget.GO_BUTTON;
    }
    break;
  case "statusbarpanel":
    switch (id) {
    case "security-button": return ToolbarWidget.STATUS_BAR_LOCK;
    }
    break;
  case "button":
    switch (id) {
    case "feed-button": return ToolbarWidget.RSS_ICON;
    case "identity-popup-more-info-button": return ToolbarWidget.SITE_ID_MORE_INFO;
    }
    break;
  }
  console.warn("Unknown Widget: " + tagName + " id = " + id + "\n");
  return ToolbarWidget.UNKNOWN; // should never happen.
};

GlobalToolbarObserver.prototype._getNumberCodeForToolbarId = function(id) {
  switch(id) {
  case "nav-bar":
    return ToolbarAction.CUST_IN_NAVBAR;
  case "PersonalToolbar":
    return ToolbarAction.CUST_IN_PERSONAL;
  case "toolbar-menubar":
    return ToolbarAction.CUST_IN_MENUBAR;
  default:
    return ToolbarAction.CUST_IN_CUSTOM_TOOLBAR;
  }
};

GlobalToolbarObserver.prototype.toolbarsAreCustomized = function(win) {

  // TODO figure out how to tell if toolbars are set to "icons",
  // "Icons and text", or "text" and whether "small icons" is on or not.

  let navBar = win.document.getElementById("nav-bar");
  let expectedChildren = ["unified-back-forward-button", "reload-button",
                          "stop-button", "home-button", "urlbar-container",
                          "urlbar-search-splitter", "search-container",
                          "fullscreenflex", "window-controls"];
  if (navBar.childNodes.length != expectedChildren.length) {
    return true;
  } else {
    for (let i = 0; i < expectedChildren.length; i++) {
      if (navBar.childNodes[i].getAttribute("id") != expectedChildren[i]) {
        return true;
      }
    }
  }

  let expectedBars = ["toolbar-menubar", "nav-bar", "customToolbars",
                      "PersonalToolbar"];
  let toolbox = win.document.getElementById("navigator-toolbox");
  if (toolbox.childNodes.length != expectedChildren.length) {
    return true;
  } else {
    for (let i = 0; i < expectedBars.length; i++) {
      if (toolbox.childNodes[i].getAttribute("id") != expectedBars[i]) {
        return true;
      }
    }
  }

  // Expect PersonalToolbar to contain personal-bookmarks and nothing else
  let personalToolbar = win.document.getElementById("PersonalToolbar");
  if (personalToolbar.childNodes.length != 1 ||
      personalToolbar.childNodes[0].getAttribute("id") != "personal-bookmarks") {
    return true;
  }

  return false;
};

GlobalToolbarObserver.prototype.recordToolbarCustomizations = function(win) {
  console.info("Recording toolbar customizations.");
  let toolbox = win.document.getElementById("navigator-toolbox");
  for (let i = 0; i < toolbox.childNodes.length; i++) {
    let toolbar = toolbox.childNodes[i];
    let toolbarId = toolbar.getAttribute("id");
    let toolbarItems = toolbar.childNodes;
    for (let j = 0; j < toolbarItems.length; j++) {
      let itemId = toolbarItems[j].getAttribute("id");
      let widgetCode = this._getNumberCodeForWidget(toolbarItems[j]);
      let toolbarCode = this._getNumberCodeForToolbarId(toolbarId);
      this.record(ToolbarEvent.CUSTOMIZE, widgetCode, toolbarCode);
    }
  }
};


exports.handlers = new GlobalToolbarObserver();

function ToolbarStudyWebContent()  {
  ToolbarStudyWebContent.baseConstructor.call(this, exports.experimentInfo);
}
BaseClasses.extend(ToolbarStudyWebContent, BaseClasses.GenericWebContent);
ToolbarStudyWebContent.prototype.__defineGetter__("dataCanvas",
  function() {
      return '<div class="dataBox"><h3>View Your Data:</h3>' +
      this.dataViewExplanation +
      this.rawDataLink +
      '<div id="data-plot-div" style="width:480x;height:800px"></div>' +
      this.saveButtons + '</div>';
  });
ToolbarStudyWebContent.prototype.__defineGetter__("dataViewExplanation",
  function() {
    return "The length of each bar below shows the number of times " +
      "that you interacted with that toolbar widget.";
  });

ToolbarStudyWebContent.prototype.onPageLoad = function(experiment,
                                                       document,
                                                       graphUtils) {
  let plotDiv = document.getElementById("data-plot-div");
  experiment.dataStoreAsJSON(function(rawData) {
    if (rawData.length == 0) {
      return;
    }

    let stats = [];
    let item;
    let lastActionId;
    for each( let row in rawData) {
      if (row.event != ToolbarEvent.ACTION) {
        continue;
      }
      // Only show me one mouse drag in a row...
      if (row.interaction_type == ToolbarAction.MOUSE_DRAG &&
          lastActionId == ToolbarAction.MOUSE_DRAG) {
        continue;
      }
      let match = false;
      for (item in stats) {
        if (stats[item].id == row.item_id) {
          match = true;
          stats[item].quantity ++;
          break;
        }
      }
      if (!match) {
        stats.push( {id: row.item_id, quantity: 1} );
      }
      lastActionId = row.interaction_type;
    }

    let d1 = [];
    for each (item in stats) {
      d1.push([item.quantity, item.id - 0.5 ]);
    }

    let label;
    let yAxisLabels = [];
    for ( label in ToolbarWidget) {
      let labelText = label.toLowerCase().replace("/_/g", " ");
      let y = ToolbarWidget[label];
      yAxisLabels.push([y, labelText]);
    }

    try {
      graphUtils.plot(plotDiv, [{data: d1}],
                      {series: {bars: {show: true, horizontal: true}},
                       yaxis: {ticks: yAxisLabels}});
    } catch(e) {
      console.warn("Problem with graphutils: " + e + "\n");
    }
  });
};
exports.webContent = new ToolbarStudyWebContent();

require("unload").when(
  function myDestructor() {
    console.info("Toolbar study destructor called.");
    exports.handlers.uninstallAll();
  });




/*
TODO:
 any clicks on the items in the URL bar drop-down list?
 right click on the Chrome to see the "customize toolbar"	win/mac	P2	clicks on it	choices on this customization window
Manage Search Engines
Bug - opening of site id panel not recorded?

We get a lot of "Undefined" clicks -- what are they?


// Not doing:

Scroll bar: Track vs. slider?
 only tr track when the focus in in the loca URL bar
 top left icon	win		clicks on it	right/left click on it
 window menu (after left click on the top icon)	win		clicks on each menu item
 menu bar	win/mac	?

drag to resize the window	win/mac

 */



