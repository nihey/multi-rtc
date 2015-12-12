import MRTC from 'mrtc';

module.exports = class Peers {
  constructor(options={}) {
    this.events = [];
    this.peers = {};

    // Shortcuts
    options.dataChannel = options.channel || options.dataChannel;

    this.options = options;
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
      this.peers[id].on('add-stream', this.onSignal.bind(this, id));
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
    data = JSON.stringify(data);
    if (id !== undefined) {
      return this.peers[id].send(data);
    }

    Object.keys(this.peers).forEach(function(key) {
      this.peers[key].send(data);
    }, this);
  }

  /*
   * MRTC Hooks
   */

  onSignal(id, signal) {
    this.trigger('signal', [id, signal]);
  }

  onOpen(id) {
    this.trigger('connect', [id]);
  }

  onData(id, event) {
    this.trigger('data', [id, JSON.parse(event.data)]);
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
