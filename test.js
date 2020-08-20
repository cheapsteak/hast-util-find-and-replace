'use strict'

var test = require('tape')
var h = require('hastscript')
var findAndReplace = require('.')

test('findAndReplace', function (t) {
  t.throws(
    function () {
      findAndReplace(create(), true)
    },
    /^Error: Expected array or object as schema$/,
    'should throw on invalid search and replaces'
  )

  t.deepEqual(
    findAndReplace(create(), 'emphasis'),
    h('p', [
      'Some ',
      h('em'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should remove without `replace`'
  )

  t.deepEqual(
    findAndReplace(create(), 'emphasis', '!!!'),
    h('p', [
      'Some ',
      h('em', '!!!'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `find` and `replace`'
  )

  t.deepEqual(
    findAndReplace(create(), /em(\w+)is/, function ($0, $1) {
      return '[' + $1 + ']'
    }),
    h('p', [
      'Some ',
      h('em', '[phas]'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `find` as a `RegExp` and `replace` as a `Function`'
  )

  t.deepEqual(
    findAndReplace(create(), 'emphasis', function () {
      return h('a', h('b', 'c'))
    }),
    h('p', [
      'Some ',
      h('em', h('a', h('b', 'c'))),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `replace` returns a node'
  )

  t.deepEqual(
    findAndReplace(create(), [
      ['emphasis', '!!!'],
      ['importance', '???']
    ]),
    h('p', [
      'Some ',
      h('em', '!!!'),
      ', ',
      h('strong', '???'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `search` as an matrix of strings'
  )

  t.deepEqual(
    findAndReplace(create(), {code: 'hacks', ',': '!'}),
    h('p', [
      'Some ',
      h('em', 'emphasis'),
      '!',
      ' ',
      h('strong', 'importance'),
      '!',
      ' and ',
      h('code', 'hacks'),
      '.'
    ]),
    'should work when given `search` as an object of strings'
  )

  t.deepEqual(
    findAndReplace(create(), /\Bmp\B/, '[MP]'),
    h('p', [
      'Some ',
      h('em', ['e', '[MP]', 'hasis']),
      ', ',
      h('strong', ['i', '[MP]', 'ortance']),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work on partial matches'
  )

  t.deepEqual(
    findAndReplace(create(), {
      emphasis: function () {
        return h('a', 'importance')
      },
      importance: 'something else'
    }),
    h('p', [
      'Some ',
      h('em', h('a', 'something else')),
      ', ',
      h('strong', 'something else'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should find-and-replace recursively'
  )

  t.deepEqual(
    findAndReplace(
      h('p', [
        'Some ',
        h('em', 'importance'),
        ', ',
        h('strong', 'importance'),
        ', and ',
        h('code', 'importance'),
        '.'
      ]),
      'importance',
      '!!!',
      {ignore: 'strong'}
    ),
    h('p', [
      'Some ',
      h('em', '!!!'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', '!!!'),
      '.'
    ]),
    'should ignore from options'
  )

  t.deepEqual(
    findAndReplace(
      h('p', [
        h('span', 'visible text'),
        h('span', {
          text: 'hidden text',
          style: 'font-size:1px;display:none;line-height:1px;'
        })
      ]),
      'text',
      'TEXT',
      {
        ignore: function (node) {
          return /display:\s*none/.test(node.properties.style)
        }
      }
    ),
    h('p', [
      h('span', ['visible ', 'TEXT']),
      h('span', {
        text: 'hidden text',
        style: 'font-size:1px;display:none;line-height:1px;'
      })
    ]),
    'should ignore using function'
  )

  t.deepEqual(
    findAndReplace(
      h('p', [h('span', 'text'), h('sup', 'text')]),
      'text',
      'TEXT',
      {
        ignore: {
          tagName: 'sup'
        }
      }
    ),
    h('p', [h('span', 'TEXT'), h('sup', 'text')]),
    'should ignore using objects'
  )

  t.deepEqual(
    findAndReplace(h('p', 'Some emphasis, importance, and code.'), {
      importance: function (match) {
        return h('strong', match)
      },
      code: function (match) {
        return h('code', match)
      },
      emphasis: function (match) {
        return h('em', match)
      }
    }),
    create(),
    'should not be order-sensitive with strings'
  )

  t.deepEqual(
    findAndReplace(h('p', 'Some emphasis, importance, and code.'), [
      [
        /importance/g,
        function (match) {
          return h('strong', match)
        }
      ],
      [
        /code/g,
        function (match) {
          return h('code', match)
        }
      ],
      [
        /emphasis/g,
        function (match) {
          return h('em', match)
        }
      ]
    ]),
    create(),
    'should not be order-sensitive with regexes'
  )

  t.deepEqual(
    findAndReplace(create(), 'and', 'alert(1)'),
    h('p', [
      'Some ',
      h('em', 'emphasis'),
      ', ',
      h('strong', 'importance'),
      ', ',
      'alert(1)',
      ' ',
      h('code', 'code'),
      '.'
    ]),
    'security: replacer as string (safe)'
  )

  t.deepEqual(
    findAndReplace(create(), 'and', function () {
      return h('script', 'alert(1)')
    }),
    h('p', [
      'Some ',
      h('em', 'emphasis'),
      ', ',
      h('strong', 'importance'),
      ', ',
      h('script', 'alert(1)'),
      ' ',
      h('code', 'code'),
      '.'
    ]),
    'security: replacer as function (unsafe)'
  )

  t.end()
})

function create() {
  return h('p', [
    'Some ',
    h('em', 'emphasis'),
    ', ',
    h('strong', 'importance'),
    ', and ',
    h('code', 'code'),
    '.'
  ])
}
