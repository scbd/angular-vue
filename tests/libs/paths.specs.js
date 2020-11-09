import test from  'tape';
import paths from '../../src/libs/paths';

test('Test paths.parent()', (t) => {
  t.equals(paths.parent('level0'),                      '');
  t.equals(paths.parent('level0.level1'),               'level0');
  t.equals(paths.parent('level0.level1.level2'),        'level0.level1');
  t.equals(paths.parent('level0.level1.level2.level3'), 'level0.level1.level2');

  t.throws(() => paths.parent());
  t.throws(() => paths.parent(null));
  t.throws(() => paths.parent(''));
  t.throws(() => paths.parent({}));
  t.throws(() => paths.parent(new Date()));
  t.throws(() => paths.parent([]));
  t.throws(() => paths.parent("bad .path with space"));
  t.throws(() => paths.parent("bad[0].abc"));
  t.throws(() => paths.parent("bad[0]"));
  t.end();
});

test('Test paths.parents()', (t) => {
  t.deepEquals(paths.parents('level0'),                      []);
  t.deepEquals(paths.parents('level0.level1'),               [ 'level0' ]);
  t.deepEquals(paths.parents('level0.level1.level2'),        [ 'level0.level1', 'level0' ]);
  t.deepEquals(paths.parents('level0.level1.level2.level3'), [ 'level0.level1.level2', 'level0.level1', 'level0' ]);

  t.throws(() => paths.parents());
  t.throws(() => paths.parents(null));
  t.throws(() => paths.parents(''));
  t.throws(() => paths.parents({}));
  t.throws(() => paths.parents(new Date()));
  t.end();
});

test('Test paths.leaf()', (t) => {
  t.equals(paths.leaf('level0'),                      'level0');
  t.equals(paths.leaf('level0.level1'),               'level1');
  t.equals(paths.leaf('level0.level1.level2'),        'level2');
  t.equals(paths.leaf('level0.level1.level2.level3'), 'level3');

  t.throws(() => paths.leaf());
  t.throws(() => paths.leaf(null));
  t.throws(() => paths.leaf(''));
  t.throws(() => paths.leaf({}));
  t.throws(() => paths.leaf(new Date()));
  t.end();
});

test('Test paths.root()', (t) => {
  t.equals(paths.root('level0'),                      'level0');
  t.equals(paths.root('level0.level1'),               'level0');
  t.equals(paths.root('level0.level1.level2'),        'level0');
  t.equals(paths.root('level0.level1.level2.level3'), 'level0');

  t.throws(() => paths.root());
  t.throws(() => paths.root(null));
  t.throws(() => paths.root(''));
  t.throws(() => paths.root({}));
  t.throws(() => paths.root(new Date()));
  t.end();
});

test('Test paths.isRoot()', (t) => {
  t.equals(paths.isRoot('level0'),                      true);
  t.equals(paths.isRoot('level0.level1'),               false);
  t.equals(paths.isRoot('level0.level1.level2'),        false);
  t.equals(paths.isRoot('level0.level1.level2.level3'), false);

  t.throws(() => paths.isRoot());
  t.throws(() => paths.isRoot(null));
  t.throws(() => paths.isRoot(''));
  t.throws(() => paths.isRoot({}));
  t.throws(() => paths.isRoot(new Date()));
  t.end();
});
