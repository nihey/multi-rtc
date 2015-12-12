var fs = require('fs'),
    assert = require('assert'),
    wrtc = require('wrtc'),
    atob = require('atob'),
    btoa = require('btoa'),
    MultiRTC = require('../dist/multi-rtc.min.js');

this.File = this;

describe('MultiRTC', function() {
  var Peers = {};
  'ABCD'.split('').forEach(function(key) {
    Peers[key] = new MultiRTC({wrtc: wrtc, channel: true, atob: atob, btoa: btoa});
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

  var blob = fs.readFileSync('test/blob.blob');

  it('should be able to send blobs', function(done) {
    Peers.A.on('data', function(id, message) {
      Peers.A.off('data');
      assert.equal(id, 'B');
      assert.equal(message, JSON.stringify(blob));
      done();
    });

    Peers.B.sendBlob(blob, 'A');
  });

  it('should be able to trade private messages', function(done) {
    Peers.A.on('data', function(id, message) {
      assert.equal(id, 'B');
      assert.equal(message, 'Tá an saol iontach');
      Peers.A.off('data');
      done();
    });

    Peers.B.send('Tá an saol iontach', 'A');
  });

  // A little stress test
  it('[STRESS] should be able to trade public messages', function(done) {
    // FIXME: This test can have inconsistent results, but it seems to be a
    // wrtc issue.

    // How much time between each message
    var SPACING = 200;

    var calls = 0;
    var tryDone = function() {
      calls += 1;
      if (calls === (9 * (Object.keys(Peers).length - 1))) {
        done();
      }
    };

    Object.keys(Peers).forEach(function(key) {
      Peers[key].on('data', function(id, data) {
        if (data.type === 0) {
          assert.equal(data.message, 'I have a reservation, name is Cropes');
          return tryDone();
        } else if (data.type === 1) {
          assert.equal(data.message, 'Rua Nascimento Silva 107');
          return tryDone();
        } else if (data.type === 2) {
          assert.equal(data.message, 'Não deixe o samba morrer');
          return tryDone();
        } else if (data.type === 3) {
          assert.equal(data.message, 'ヱヴァンゲリヲン');
          return tryDone();
        } else if (data.type === 4) {
          assert.equal(data.message, 'Se eu perder este trem, só amanhã de manhã');
          return tryDone();
        } else if (data.type === 5) {
          assert.equal(data.message, 'We are born of the blood, made men by the blood, ' +
                                     'undone by the blood');
          return tryDone();
        } else if (data.type === 6) {
          assert.equal(data.message, 'É tanta injustiça que é de partir, ' +
                                     'é... eu parti, não consigo mais acompanhar, ' +
                                     'meu ritmo de vida está no mar, ' +
                                     'vai partir, pra nunca mais voltar, ' +
                                     'felicidade está no ar, Brasil pra sempre ' +
                                     'vou te amar.');
          return tryDone();
        } else if (data.type === 7) {
          assert.equal(data.message, 'Can you feel the love tonight?');
          return tryDone();
        } else if (data.type === 8) {
          assert.equal(data.message, 'The best is yet to come');
          return tryDone();
        }
      });
    });

    var texts = [
      'I have a reservation, name is Cropes',

      'Rua Nascimento Silva 107',

      'Não deixe o samba morrer',

      'ヱヴァンゲリヲン',

      'Se eu perder este trem, só amanhã de manhã',

      'We are born of the blood, made men by the blood, undone by the blood',

      'É tanta injustiça que é de partir, é... eu parti, não consigo mais acompanhar, ' +
      'meu ritmo de vida está no mar, vai partir, pra nunca mais voltar, felicidade está no ar, ' +
      'Brasil pra sempre vou te amar.',

      'Can you feel the love tonight?',

      'The best is yet to come',
    ];

    // Give this test enough time to finish
    this.timeout(SPACING * (texts.length + 2));

    // Round robin the messages and send them to every peer every time.
    var keys = Object.keys(Peers);
    texts.forEach(function(text, index) {
      setTimeout(function() {
        Peers[keys[index % keys.length]].send({
          type: index,
          message: text,
        });
      }, SPACING * index);
    });
  });
});
