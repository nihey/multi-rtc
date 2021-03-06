import MRTC from 'mrtc';

module.exports = class MultiRTC {
  constructor(options={}) {
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
    this.atob = window.atob.bind(window);
    this.btoa = window.btoa.bind(window);
  }

  /*
   * Private API
   */

  _sendChunk(chunk, blobId, id, size) {
    let message = {
      type: '__multi-rtc-blob-chunk__',
      id: blobId,
      content: this.btoa(chunk),
    };

    if (size) {
      message.size = size;
    }

    this.send(message, id);
  }

  _sendBlob(blob, id, offset) {
    let chunk = blob.content.slice(offset, offset + this.CHUNK_SIZE);
    this._sendChunk(chunk, blob.id, id, offset === 0 ? blob.content.length : false);
  }

  _sendFile(blob, id, offset) {
    let reader = new FileReader();
    reader.onload = () => {
      this._sendChunk(reader.result, blob.id, id, offset === 0 ? blob.content.size : false);
    };

    let chunk = blob.content.slice(offset, offset + this.CHUNK_SIZE);
    reader.readAsBinaryString(chunk);
  }

  /*
   * Public API
   */

  add(id, signal=null) {
    if (!this.peers[id]) {
      // When we have no instance from the given peer, add him/her.
      this.peers[id] = new MRTC({offerer: signal === null, ...this.options});
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
      this.peers[id].send = data => {
        let channel = this.peers[id].channel;
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

  send(data, id) {
    // Define ids to deliver this data
    let ids = id ? [id] : Object.keys(this.peers);

    data = JSON.stringify(data);

    ids.forEach(function(key) {
      this.peers[key].send(data);
    }, this);
  }

  requireBlob(peerId, blobId, offset=0) {
    return this.send({
      type: '__multi-rtc-blob-chunk__',
      offset: offset,
      id: blobId,
    }, peerId);
  }

  addBlob(data) {
    // The unique id of this given Blob
    let blobId = Math.random().toString(32).split('.')[1];
    this.blobs[blobId] = {id: blobId};

    // if sending a File, use the FileReader API
    if (data instanceof (this.File || MultiRTC)) {
      this.blobs[blobId].content = data;
      this.blobs[blobId].send = (key, offset) => {
        this._sendFile(this.blobs[blobId], key, offset);
      };
      return this.blobs[blobId];
    }

    // if sending anything other than a string, stringify it first
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    this.blobs[blobId].content = data;
    this.blobs[blobId].send = (key, offset) => {
      this._sendBlob(this.blobs[blobId], key, offset);
    };

    return this.blobs[blobId];
  }

  sendBlob(data, id) {
    let blob = this.addBlob(data);

    // Define ids to deliver this data
    let ids = id ? [id] : Object.keys(this.peers);
    return ids.forEach(function(key) {
      blob.send(key, 0);
    }, this);
  }

  /*
   * MRTC Hooks
   */

  onSignal(id, signal) {
    this.trigger('signal', [id, signal]);
  }

  onAddStream(id, stream) {
    this.trigger('stream', [id, stream]);
  }

  onOpen(id) {
    this.trigger('connect', [id]);
  }

  onData(id, event) {
    let data = JSON.parse(event.data);
    // Common case, data is returned to the user directly
    if (data.type !== '__multi-rtc-blob-chunk__') {
      return this.trigger('data', [id, data]);
    } else if (data.offset !== undefined) {
      return this.blobs[data.id].send(id, data.offset);
    }

    let buffer = this.buffers[data.id];
    if (!buffer) {
      buffer = this.buffers[data.id] = {
        id: data.id,
        size: data.size,
        content: '',
      };
    }

    let content = this.atob(data.content || '');
    buffer.content += content;
    this.trigger('partial-blob', [id, buffer, content]);

    // If there's more content to be brought, request it
    if (buffer.size > buffer.content.length) {
      return this.requireBlob(id, data.id, buffer.content.length);
    }

    // Else trigger the 'data' event to the user with his blob.
    this.trigger('data', [id, buffer]);
    delete this.buffers[data.id];
  }

  onClose(id) {
    delete this.peers[id];
    this.trigger('disconnect', [id]);
  }

  onError(...args) {
    this.trigger('error', args);
  }

  onBufferedAmountLow(...args) {
    this.trigger('buffered-amount-low', args);
  }

  /*
   * Event System
   */

  on(action, callback) {
    this.events[action] = this.events[action] || [];
    this.events[action].push(callback);
  }

  off(action, callback) {
    this.events[action] = this.events[action] || [];

    if (callback) {
      // If a callback has been specified delete it specifically
      var index = this.events[action].indexOf(callback);
      (index !== -1) && this.events[action].splice(index, 1);
      return index !== -1;
    }

    // Else just erase all callbacks
    this.events[action] = [];
  }

  trigger(action, args=[]) {
    this.events[action] = this.events[action] || [];

    // Fire all events with the given callback
    this.events[action].forEach(function(callback) {
      callback.apply(null, args);
    });
  }
};
