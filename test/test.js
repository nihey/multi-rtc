var assert = require('assert'),
    wrtc = require('wrtc'),
    MultiRTC = require('../dist/multi-rtc.min.js');

describe('MultiRTC', function() {
  var Peers = {};
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(function(key) {
    Peers[key] = new MultiRTC({wrtc: wrtc, channel: true});
  });

  var sum = function(number) {
    if (number === 0) {
      return 0;
    }
    return number + sum(number - 1);
  };

  it('number function should be working', function() {
    assert.equal(sum(1), 1);
    assert.equal(sum(2), 2 + 1);
    assert.equal(sum(3), 3 + 2 + 1);
    assert.equal(sum(4), 4 + 3 + 2 + 1);
    assert.equal(sum(5), 5 + 4 + 3 + 2 + 1);
    assert.equal(sum(6), 6 + 5 + 4 + 3 + 2 + 1);
    assert.equal(sum(7), 7 + 6 + 5 + 4 + 3 + 2 + 1);
  });

  it('should be able to connect to everyone', function(done) {
    var calls = 0;
    var tryDone = function() {
      calls += 1;
      if (calls === sum(Object.keys(Peers).length - 1)) {
        done();
      }
    };

    var keys = Object.keys(Peers);
    keys.forEach(function(key, index) {
      Peers[key].on('signal', function(id, signal) {
        Peers[id].add(key, signal);
      });

      Peers[key].on('connect', function() {
        tryDone();
      });

      keys.slice(index + 1).forEach(function(other) {
        Peers[key].add(other);
      });
    });
  });
});
