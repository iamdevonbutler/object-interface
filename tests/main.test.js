const applyInterface = require('../lib');
const isEqual = require('js-isequal');

const should = require('chai').should();
const expect = require('chai').expect;
const assert = require('chai').assert;

// @todos
// nested filter, does it work right. nested map and forEach too.

var $obj, obj;

describe('js-object-interface tests', () => {
  beforeEach(() => {
    obj = {
      a: 1,
      b: {
        c: 2,
        d: 3,
      },
      e: [4, 5],
    };
    $obj = applyInterface(obj);
  });
  describe('cloning src', () => {
    it('should clone the src obj by default', () => {
      var obj1 = {a: 1};
      var $obj = applyInterface(obj1);
      $obj.set('b', 2);
      expect(isEqual(obj1, {a: 1})).to.be.true;
    });
    it ('should NOT clone the src obj when passing param2 as false', () => {
      var obj1 = {a: 1};
      var $obj1 = applyInterface(obj1, false);
      $obj1.set('b', 2);
      expect(isEqual(obj1, {a: 1})).to.be.false;
      expect(isEqual(obj1, {a: 1, b: 2})).to.be.true;
    });
  });

  describe('.src', () => {
    it('should return the original object', () => {
      expect(isEqual($obj.src, obj)).to.be.true;
    });
  });

  describe('.get()', () => {
    it ('should return "undefined" given no params', () => {
      expect($obj.get() === undefined).to.be.true;
    });
    it ('should return "undefined" given invalid keys', () => {
      expect($obj.get('z') === undefined).to.be.true;
      expect($obj.get('a', 'z') === undefined).to.be.true;
      expect($obj.get('b', 'z') === undefined).to.be.true;
    });
    it ('should get a property', () => {
      expect($obj.get('a') === 1).to.be.true;
    });
    it ('should get a nested property', () => {
      expect($obj.get('b', 'c') === 2).to.be.true;
    });
  });

  describe('.set()', () => {
    it ('should update .src given a single param', () => {
      $obj.set({a: 1});
      expect(isEqual($obj.src, {a: 1})).to.be.true;
    });
    it ('should set a new property', () => {
      $obj.set('f', 1);
      expect($obj.src.f === 1).to.be.true;
    });
    it ('should updated a top-level property', () => {
      $obj.set('a', 2);
      expect($obj.src.a === 2).to.be.true;
    });
    it ('should set a new nested property and create bridge properties', () => {
      $obj.set('f', 'g', 1);
      expect($obj.src.f.g === 1).to.be.true;
    });
    it ('should update an existing nested property', () => {
      $obj.set('b', 'c', 3);
      expect($obj.src.b.c === 3).to.be.true;
    });
  });

  describe('.remove()', () => {
    it ('should remove a property', () => {
      $obj.remove('f');
      expect($obj.src.f === undefined).to.be.true;
    });
    it ('should remove a nested property', () => {
      $obj.remove('b', 'c');
      expect($obj.src.b).to.be.ok;
      expect($obj.src.b.c === undefined).to.be.true;
    });
    it ('should not Error when removing a key that DNE', () => {
      $obj.remove('k');
    });
  });

  describe('.forEach()', () => {
    it ('should iterate over each value', () => {
      $obj.forEach((value, key, $value) => {
        switch (key) {
          case 'a':
            expect(value === 1).to.be.true;
            break;
          case 'b':
            expect(isEqual(value, {c: 2, d: 3})).to.be.true;
            break;
          case 'e':
            expect(isEqual(value, [4,5])).to.be.true;
            break;
          default:
            throw 'unknown key';
        }
      });
    });
    it ('should wrap child objects w/ the interface', () => {
      $obj.forEach((value, key, $value) => {
        if (key === 'b') {
          $value.forEach((value1, key1) => {
            switch (key1) {
              case 'c':
                expect(value1 === 2).to.be.true;
                break;
              case 'd':
                expect(value1 === 3).to.be.true;
                break;
              default:
                throw 'wrong key';
            }
          });
        }
      });
    });
    it ('should handle async', async () => {
      var dummy = 0, asyncFunc = new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
       await $obj.forEach(async (value, key, $value) => {
         await asyncFunc;
         dummy++;
      });
      expect(dummy === 3).to.be.true;
    });
  });

  describe('.map()', () => {
    it ('should iterate over each value w/o modifying src', () => {
      var result = $obj.map((value, key, $value) => {
        return 9;
      });
      expect(isEqual(result, {a: 9, b: 9, e: 9})).to.be.true;
      expect(isEqual($obj.src, obj)).to.be.true;
    });
    it ('should wrap child objects w/ the interface', () => {
      var result = $obj.map((value, key, $value) => {
        if (key === 'b') {
          return $value.map((value1, key1) => {
            switch (key1) {
              case 'c':
                return 9;
              case 'd':
                return 9;
              default:
                throw 'wrong key';
            }
          });
        }
        else {
          return value;
        }
      });
      expect(isEqual(result, {a: 1, b: {c: 9, d: 9}, e: [4, 5]})).to.be.true;
    });
    it ('should handle async', async () => {
      var dummy = 0, asyncFunc = new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
       var result = await $obj.map(async (value, key, $value) => {
         await asyncFunc;
         return 9;
      });
      expect(isEqual(result, {a: 9, b: 9, e: 9})).to.be.true;
    });
  });

  describe('.filter()', () => {
    it ('should iterate over each value and filter w/o modifying src', () => {
      var result = $obj.filter((value, key, $value) => {
        if (key === 'a') return true;
      });
      expect(isEqual(result, {a: 1})).to.be.true;
      expect(isEqual($obj.src, obj)).to.be.true;
    });
    it ('should handle async', async () => {
      var dummy = 0, asyncFunc = new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
       var result = await $obj.filter(async (value, key, $value) => {
         await asyncFunc;
         return key === 'a' ? true : false;
      });
      expect(isEqual(result, {a: 1})).to.be.true;
    });
  });

  describe('.every()', () => {

  });

  describe('.find()', () => {

  });

  describe('.some()', () => {

  });

  describe('.clone()', () => {
    it ('should clone .src', () => {
      var obj1 = $obj.clone();
      obj1.a = 9;
      expect(isEqual($obj.src, obj)).to.be.true;
    });
  });

  describe('.assign()', () => {
    it ('should return the src obj given no params', () => {
      var obj1 = $obj.assign();
      expect(isEqual(obj1, $obj.src)).to.be.true;
    });
    it ('should assign new values', () => {
      var obj1 = $obj.assign({b: {c: 9}}, {b: {d: 9}});
      expect(isEqual(obj1, {
        a: 1,
        b: {
          c: 9,
          d: 9,
        },
        e: [4, 5],
      })).to.be.true;
    });
  });

});
