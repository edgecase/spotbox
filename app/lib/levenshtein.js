var Matrix = function(defaultValue) {
  this.matrix = {};
  this.defaultValue = defaultValue;
}

Matrix.prototype.set = function(x, y, value) {
  this.matrix[x + ":" + y] = value;
};

Matrix.prototype.get = function(x, y) {
  var result = this.matrix[x + ":" + y];
  if (result === undefined) {
    return this.defaultValue;
  } else {
    return result;
  }
};

var Levenshtein = function() {};
Levenshtein.distance = function(str1, str2) {
  var matrix = new Matrix(0);
  var index;
  var i;
  var j;
  var m = str1.length;
  var n = str2.length;

  for (index = 1; index <= m; index++) {
    matrix.set(index, 0, index);
  }

  for (index = 1; index <= n; index++) {
    matrix.set(0, index, index);
  }

  for (j = 1; j <= n; j++) {
    for (i = 1; i <= m; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix.set(i, j, matrix.get(i-1, j-1));
      } else {
        var values = [];
        values.push(matrix.get(i-1, j) + 1);   // a deletion
        values.push(matrix.get(i, j-1) + 1);   // an insertion
        values.push(matrix.get(i-1, j-1) + 1); // a substitution
        matrix.set(i, j, Math.min.apply(null, values));
      }
    }
  }

  return matrix.get(m, n);
}

module.exports = Levenshtein;
