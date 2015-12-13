(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["module"] = factory();
	else
		root["module"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var _mrtc = __webpack_require__(1);

	var _mrtc2 = _interopRequireDefault(_mrtc);

	module.exports = (function () {
	  function MultiRTC() {
	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, MultiRTC);

	    this.CHUNK_SIZE = 1024 * 4;

	    this.blobs = {};
	    this.buffers = {};

	    this.events = [];
	    this.peers = {};

	    // Shortcuts
	    options.dataChannel = options.channel || options.dataChannel;

	    this.options = options;

	    if (options.wrtc) {
	      this.File = MultiRTC;
	      this.atob = options.atob;
	      this.btoa = options.btoa;
	      return;
	    }

	    this.File = window.File;
	    this.atob = window.atob;
	    this.btoa = window.btoa;
	  }

	  /*
	   * Private API
	   */

	  _createClass(MultiRTC, [{
	    key: '_sendChunk',
	    value: function _sendChunk(chunk, blobId, id, size) {
	      var message = {
	        type: '__multi-rtc-blob-chunk__',
	        id: blobId,
	        content: this.btoa(chunk)
	      };

	      if (size) {
	        message.size = size;
	      }

	      this.send(message, id);
	    }
	  }, {
	    key: '_sendBlob',
	    value: function _sendBlob(blob, id, offset) {
	      var chunk = blob.content.slice(offset, offset + this.CHUNK_SIZE);
	      this._sendChunk(chunk, blob.id, id, offset === 0 ? blob.content.length : false);
	    }
	  }, {
	    key: '_sendFile',
	    value: function _sendFile(blob, id, offset) {
	      var reader = new FileReader();
	      reader.onload = function () {
	        this._sendChunk(reader.result, blob.id, id, offset === 0 ? blob.content.size : false);
	      };

	      var chunk = blob.content.slice(offset, offset + this.CHUNK_SIZE);
	      reader.readAsBinaryString(chunk);
	    }

	    /*
	     * Public API
	     */

	  }, {
	    key: 'add',
	    value: function add(id) {
	      var _this = this;

	      var signal = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

	      if (!this.peers[id]) {
	        // When we have no instance from the given peer, add him/her.
	        this.peers[id] = new _mrtc2['default'](_extends({ offerer: signal === null }, this.options));
	        // Base
	        this.peers[id].on('signal', this.onSignal.bind(this, id));
	        // MediaStream
	        this.peers[id].on('add-stream', this.onAddStream.bind(this, id));
	        // DataChannel
	        this.peers[id].on('channel-open', this.onOpen.bind(this, id));
	        this.peers[id].on('channel-message', this.onData.bind(this, id));
	        this.peers[id].on('channel-close', this.onClose.bind(this, id));
	        this.peers[id].on('channel-error', this.onError.bind(this, id));
	        this.peers[id].on('channel-buffered-amount-low', this.onBufferedAmountLow.bind(this, id));

	        // Monkey Patch a smoothier send method into MRTC
	        this.peers[id].send = function (data) {
	          var channel = _this.peers[id].channel;
	          if (channel && channel.readyState === 'open') {
	            channel.send(data);
	          }
	        };
	      }

	      // If add function provides a signal, accept it
	      if (signal) {
	        this.peers[id].addSignal(signal);
	      }
	    }
	  }, {
	    key: 'send',
	    value: function send(data, id) {
	      // Define ids to deliver this data
	      var ids = id ? [id] : Object.keys(this.peers);

	      data = JSON.stringify(data);

	      ids.forEach(function (key) {
	        this.peers[key].send(data);
	      }, this);
	    }
	  }, {
	    key: 'requireBlob',
	    value: function requireBlob(peerId, blobId) {
	      var offset = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

	      return this.send({
	        type: '__multi-rtc-blob-chunk__',
	        offset: offset,
	        id: blobId
	      }, peerId);
	    }
	  }, {
	    key: 'addBlob',
	    value: function addBlob(data) {
	      var _this2 = this;

	      // The unique id of this given Blob
	      var blobId = Math.random().toString(32).split('.')[1];
	      this.blobs[blobId] = { id: blobId };

	      // if sending a File, use the FileReader API
	      if (data instanceof (this.File || MultiRTC)) {
	        this.blobs[blobId].content = data;
	        this.blobs[blobId].send = function (key, offset) {
	          _this2._sendFile(_this2.blobs[blobId], key, offset);
	        };
	        return this.blobs[blobId];
	      }

	      // if sending anything other than a string, stringify it first
	      if (typeof data !== 'string') {
	        data = JSON.stringify(data);
	      }

	      this.blobs[blobId].content = data;
	      this.blobs[blobId].send = function (key, offset) {
	        _this2._sendBlob(_this2.blobs[blobId], key, offset);
	      };

	      return this.blobs[blobId];
	    }
	  }, {
	    key: 'sendBlob',
	    value: function sendBlob(data, id) {
	      var blob = this.addBlob(data);

	      // Define ids to deliver this data
	      var ids = id ? [id] : Object.keys(this.peers);
	      return ids.forEach(function (key) {
	        blob.send(key, 0);
	      }, this);
	    }

	    /*
	     * MRTC Hooks
	     */

	  }, {
	    key: 'onSignal',
	    value: function onSignal(id, signal) {
	      this.trigger('signal', [id, signal]);
	    }
	  }, {
	    key: 'onAddStream',
	    value: function onAddStream(id, stream) {
	      this.trigger('stream', [id, stream]);
	    }
	  }, {
	    key: 'onOpen',
	    value: function onOpen(id) {
	      this.trigger('connect', [id]);
	    }
	  }, {
	    key: 'onData',
	    value: function onData(id, event) {
	      var data = JSON.parse(event.data);
	      // Common case, data is returned to the user directly
	      if (data.type !== '__multi-rtc-blob-chunk__') {
	        return this.trigger('data', [id, data]);
	      } else if (data.offset) {
	        this.blobs[data.id].send(id, data.offset);
	      }

	      var buffer = this.buffers[data.id];
	      if (!buffer) {
	        buffer = this.buffers[data.id] = {
	          size: data.size,
	          content: ''
	        };
	      }

	      var content = this.atob(data.content || '');
	      buffer.content += content;
	      this.trigger('partial-blob', [id, buffer, content]);

	      // If there's more content to be brought, request it
	      if (buffer.size > buffer.content.length) {
	        return this.requireBlob(id, data.id, buffer.content.length);
	      }

	      // Else trigger the 'data' event to the user with his blob.
	      this.trigger('data', [id, buffer.content]);
	    }
	  }, {
	    key: 'onClose',
	    value: function onClose(id) {
	      delete this.peers[id];
	      this.trigger('disconnect', [id]);
	    }
	  }, {
	    key: 'onError',
	    value: function onError() {
	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }

	      this.trigger('error', args);
	    }
	  }, {
	    key: 'onBufferedAmountLow',
	    value: function onBufferedAmountLow() {
	      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        args[_key2] = arguments[_key2];
	      }

	      this.trigger('buffered-amount-low', args);
	    }

	    /*
	     * Event System
	     */

	  }, {
	    key: 'on',
	    value: function on(action, callback) {
	      this.events[action] = this.events[action] || [];
	      this.events[action].push(callback);
	    }
	  }, {
	    key: 'off',
	    value: function off(action, callback) {
	      this.events[action] = this.events[action] || [];

	      if (callback) {
	        // If a callback has been specified delete it specifically
	        var index = this.events[action].indexOf(callback);
	        index !== -1 && this.events[action].splice(index, 1);
	        return index !== -1;
	      }

	      // Else just erase all callbacks
	      this.events[action] = [];
	    }
	  }, {
	    key: 'trigger',
	    value: function trigger(action) {
	      var args = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

	      this.events[action] = this.events[action] || [];

	      // Fire all events with the given callback
	      this.events[action].forEach(function (callback) {
	        callback.apply(null, args);
	      });
	    }
	  }]);

	  return MultiRTC;
	})();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	!function(e,n){ true?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.module=n():e.module=n()}(this,function(){return function(e){function n(i){if(t[i])return t[i].exports;var o=t[i]={exports:{},id:i,loaded:!1};return e[i].call(o.exports,o,o.exports,n),o.loaded=!0,o.exports}var t={};return n.m=e,n.c=t,n.p="",n(0)}([function(e,n){"use strict";function t(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(n,"__esModule",{value:!0});var i=function(){function e(e,n){for(var t=0;t<n.length;t++){var i=n[t];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(n,t,i){return t&&e(n.prototype,t),i&&e(n,i),n}}(),o=function(e){var n="abcdefghijklmnopqrstuvwxyz";n+="ABCDEFGHIJKLMNOPQRSTUVWXYZ",n+="0123456789";for(var t="",i=0;e>i;++i)t+=n[Math.floor((n.length-1)*Math.random())];return t},r=function(){return{RTCPeerConnection:window.RTCPeerConnection||window.msRTCPeerConnection||window.mozRTCPeerConnection||window.webkitRTCPeerConnection,RTCIceCandidate:window.RTCIceCandidate||window.msRTCIceCandidate||window.mozRTCIceCandidate||window.webkitRTCIceCandidate,RTCSessionDescription:window.RTCSessionDescription||window.msRTCSessionDescription||window.mozRTCSessionDescription||window.webkitRTCSessionDescription}},s=function(){function e(){var n=this,i=arguments.length<=0||void 0===arguments[0]?{}:arguments[0];return t(this,e),i.options=i.options||{iceServers:[]},i.dataChannel&&"boolean"==typeof i.dataChannel&&(i.dataChannel={}),this.stream=i.stream,this.events={signal:[]},this.events["add-stream"]=[],this.events["channel-open"]=[],this.events["channel-message"]=[],this.events["channel-close"]=[],this.events["channel-error"]=[],this.events["channel-buffered-amount-low"]=[],this._signals=[],this.wrtc=i.wrtc||r(),this.wrtc.RTCPeerConnection?(this.peer=new this.wrtc.RTCPeerConnection(i.options),this.peer.onicecandidate=function(e){return e.candidate?n._onSignal(e.candidate):void 0},this.peer.ondatachannel=function(e){n.channel=e.channel,n._bindChannel()},this.peer.onaddstream=function(e){n.stream=e.stream,n.trigger("add-stream",[n.stream])},this.stream&&this.peer.addStream(i.stream),i.offerer?(i.dataChannel&&(this.channel=this.peer.createDataChannel(o(128),i.dataChannel),this._bindChannel()),void this.peer.createOffer(function(e){n.peer.setLocalDescription(e,function(){return n._onSignal(e)},n.onError)},this.onError)):void 0):console.error("No WebRTC support found")}return i(e,[{key:"_bindChannel",value:function(){["open","close","message","error","buffered-amount-low"].forEach(function(e){var n=this;this.channel["on"+e.replace(/-/g,"")]=function(){for(var t=arguments.length,i=Array(t),o=0;t>o;o++)i[o]=arguments[o];n.trigger("channel-"+e,[].concat(i))}},this)}},{key:"_onSignal",value:function(e){return 0===this.events.signal.length?this._signals.push(e):void this.trigger("signal",[e])}},{key:"addSignal",value:function(e){var n=this;return"offer"===e.type?this.peer.setRemoteDescription(new this.wrtc.RTCSessionDescription(e),function(){n.peer.createAnswer(function(e){n.peer.setLocalDescription(e,function(){n._onSignal(e)},n.onError)},n.onError)},this.onError):"answer"===e.type?this.peer.setRemoteDescription(new this.wrtc.RTCSessionDescription(e),function(){},this.onError):void this.peer.addIceCandidate(new this.wrtc.RTCIceCandidate(e),function(){},this.onError)}},{key:"on",value:function(e,n){return void 0===this.events[e]?console.error("MRTC: No such action '"+e+"'"):(this.events[e].push(n),void("signal"===e&&this._signals.forEach(function(e){this.trigger("signal",[e])},this)))}},{key:"off",value:function(e,n){if(n){var t=this.events[e].indexOf(n);return-1!==t&&this.events[e].splice(t,1),-1!==t}this.events[e]=[]}},{key:"trigger",value:function(e,n){n=n||[],this.events[e].forEach(function(e){e.apply(null,n)})}},{key:"onError",value:function(e){console.error(e)}}]),e}();n["default"]=s,e.exports=n["default"]}])});

/***/ }
/******/ ])
});
;