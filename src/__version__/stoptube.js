'use strict;'
var EXPORTED_SYMBOLS = ['stopTube'];
var stopTube = {
	_video_parent_tag_id: 'movie_player',

	init: function() {},

	bind: function (window) {
	
		// Reference: https://developer.mozilla.org/en/Code_snippets/Interaction_between_privileged_and_non-privileged_pages
		// The last value is a Mozilla-specific value to indicate untrusted content is allowed to trigger the event.  
		window.addEventListener('stopTube_PlayRequested', stopTube.handlePlayRequested, false, true); 

		var gBrowser = window.document.getElementById('content');
		gBrowser.addEventListener('DOMContentLoaded', stopTube.handleDOMContentLoaded, false);
	},
	
	unbind : function (window) {
		window.removeEventListener('stopTube_PlayRequested', stopTube.handlePlayRequested); 
		
		var gBrowser = window.document.getElementById('content');
		gBrowser.removeEventListener('DOMContentLoaded', stopTube.handleDOMContentLoaded);
	
		// Check each tab of this browser instance
		var numTabs = gBrowser.browsers.length;
		for (var index = 0; index < numTabs; index++) {
			var currentBrowser = gBrowser.getBrowserAtIndex(index);
			var doc = currentBrowser.contentDocument;
			
			if (!stopTube.isYouTubeVideoPage(doc)) continue;
			
			var v = stopTube.getVideoTag(doc);
			
			if (v) {
				var a = doc.getElementById('kashiif-stop-tube');
				a.parentNode.removeChild(a);
				var src = v.getAttribute('src');
				
				if (!src) {
					stopTube.playVideo(v);
				}
			}
		}
	
	},

	getVideoTag: function(doc) {
		//stopTube.debug('querySelector: '  + doc.querySelector('#movie_player-html5 video'));
		//return doc.querySelector('#movie_player-html5 video');
		return doc.querySelector('#' + stopTube._video_parent_tag_id + ' video');
	},
	
	isYouTubeVideoPage: function(page) {
		if (page.location.protocol == 'http:' || page.location.protocol == 'https:'){
			const isYoutube = /(\w*\.)?youtube\.(com|com\.br|fr|jp|nl|pl|ie|co\.uk|es|it)$/i;

			return isYoutube.test(page.location.host);
		}

		return false;
	},

	
	handleDOMContentLoaded : function (event) {
		stopTube.debug('DOMContentLoaded: ' + event.target.location.href);
		
		stopTube._processPage(event.target);
	},
	
	_processPage: function(page) {
		//stopTube.debug('stopTube.isYouTubeVideoPage(page): ' + stopTube.isYouTubeVideoPage(page));
		if (!stopTube.isYouTubeVideoPage(page)) return;
		
		var v = stopTube.getVideoTag(page);
		
		stopTube.debug('videoTag on page: ' + v);
		
		if (v) {
			stopTube._processVideoTag(v);
		}
		else {
			// Youtube change on 2012-12-07 

			// create an observer instance
			var observer = new page.defaultView.MutationObserver(function(mutations, obs) {
				stopTube._handleMutation(mutations, obs);
			});
		 
			// configuration of the observer:
			var config = { childList: true};
			 
			// pass in the target node, as well as the observer options
			observer.observe(page.body, config);		 

			page.addEventListener('unload', function(evt) {
				// later, you can stop observing
				observer.disconnect();

			});
		}
	},
	
	_handleMutation: function(mutRecords, theObserver) {
		var page = mutRecords[0].target.ownerDocument,
			v = stopTube.getVideoTag(page);
		stopTube.debug('videoTag on page Mutation: ' + v);
		if (v) {

			/*
			for (var i = 0; i < mutRecords.length; ++i) {
				var mutRecord = mutRecords[i]; 
				for (var j = 0; j < mutRecord.addedNodes.length; ++j) {
					var node = mutRecord.addedNodes[j]; 
					stopTube.debug(node.tagName + ' ' + node.id  );
				}			
			}
			*/			

			theObserver.disconnect();

			stopTube._processVideoTag(v);
		}
	},
	
	_processVideoTag: function(v) {
		try {

			if (v.getAttribute('data-user-clicked')) return;

			stopTube.debug('found video: ' + v.tagName);
			v.addEventListener('loadedmetadata', stopTube.videoLoadStarted, false);
			var a = stopTube.putAnchor(v.ownerDocument, v.ownerDocument.getElementById(stopTube._video_parent_tag_id));
			a.addEventListener('click', function(evt) { 
					var newEvt = this.ownerDocument.createEvent('Events');  
					newEvt.initEvent('stopTube_PlayRequested', true, true);  
					this.dispatchEvent(newEvt);
					evt.stopPropagation();
				}, true );
		}
		catch(ex) {
			stopTube.log(ex);
		}
	},
	
	stylize: function(a, props) {
		for (var p in props) {
			a.style[p] = props[p];
		}
	},
	
	putAnchor: function(page, divToOverlay) {
		var a = page.createElement('a');

		var normalBackground = '#eee',
			pos = stopTube.findPosition(divToOverlay);

		a.setAttribute('id', 'kashiif-stop-tube');
		a.setAttribute('href', 'javascript:void(0);');
		a.addEventListener('mouseover', function () { this.style.backgroundColor = '#fff'; }, false);
		a.addEventListener('mouseout', function () { this.style.backgroundColor = normalBackground; }, false);
	
		stopTube.stylize(a, {
		    display: 'block',
		    fontSize: '14pt',
		    textAlign: 'center',
		    border: '1px dotted gray',
		    background: 'url(resource://stop-tube/icon.png) no-repeat scroll 54% 42% ' + normalBackground,
		    zIndex: '20000',
		    mozBoxSizing: 'border-box',
		    transition: 'background-color 1s',
		    border: '2px dotted #b3b3b3',
		    mozTransition: 'background-color 1s',
		    position: 'absolute',
		    top: pos.topPos,
		    left: pos.leftPos
		  });

		var s = page.createElement('span');
		stopTube.stylize(s, {
		    position: 'absolute';
		    top: '52%';
		    left: '48%';
		  });
		s.textContent = 'Click To Play.';
		a.appendChild(s);

		divToOverlay.appendChild(a);
		
		var style = page.defaultView.getComputedStyle(divToOverlay, null);
		a.style.width = (parseInt(style.width)-4) + 'px'; // borderwidth (2) * 2
		a.style.height = (parseInt(style.height)-4) + 'px';

		return a;
	},

	videoLoadStarted: function(evt) {
		var v = evt.target;

		stopTube.debug('videoLoadStarted: ' + v.tagName);

		if (!v.stopTubeProcessing) {
			v.stopTubeProcessing = true;
			stopTube.debug('videoLoadStarted Processing: ' + v.tagName);
			v.removeEventListener('loadedmetadata', stopTube.videoLoadStarted);
			v.pause(); 
			var src = v.getAttribute('src');
			v.setAttribute('src', '');
			v.setAttribute('data-original-src', src);
			
			v.stopTubeProcessing = false;
		}
	},

	findPosition: function( obj ) {
		var leftPos, topPos;
		leftPos = topPos = 0;
		
		do {
			leftPos += obj.offsetLeft;
			topPos += obj.offsetTop;
		}
		while (obj = obj.offsetParent);
		stopTube.debug('findPosition: ' + leftPos + ',' + topPos);
		return { 'leftPos': leftPos, 'topPos': topPos };
	},

	handlePlayRequested: function(evt) {
		var a = evt.target,
			doc = evt.target.ownerDocument,
			v = stopTube.getVideoTag(doc);
		
		stopTube.playVideo(v);
		
		a.style.visibility = 'hidden';
		
	},
	
	playVideo: function(v) {
		var src = v.getAttribute('data-original-src');
		v.setAttribute('src', src);
		v.removeAttribute('data-original-src');
		v.setAttribute('data-user-clicked', 'true');
		v.play();
	},
	
	
	log : function (message) {
		var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage('stopTube: ' + message);
	}

	// <build:remove> 
	debug : function (message) {
		var consoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage('stopTube: ' + message);
	}
	// </build:remove> 
};

