module.exports = function buildStringCollector(increment) {
  return {
    ElementNode(node) {
      increment(node.tag);
    },
    TextNode(node) {
      increment(node.chars);
    },
    PathExpression(node) {
      for (let part of node.parts) {
        increment(part);
      }
    },
    AttrNode(node) {
      increment(node.name);
    },
    HashPair(node) {
      increment(node.key);
    },
  };
};
