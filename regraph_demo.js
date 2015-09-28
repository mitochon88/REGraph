var parser = new REGraph();

parser.setGraph("sumsub", {
	"sum" : /\+/,
	"sub" : /\-/,
	"mld" : "muldiv"
}, [
	[REGraph.START, "mld"],
	["sum", "mld"],
	["sub", "mld"],
	["mld", REGraph.END], ["mld", "sum"], ["mld", "sub"]
]);

parser.setAction("sumsub", function(stack, label) {
	if (stack.length === 1)
		return stack[0];
	var n = stack[0];
	for (var i=0; i<stack.length;) {
		if (label[++i] === "sum")
			n += stack[++i];
		if (label[i] === "sub")
			n -= stack[++i];
	}
	return n;
});

parser.setGraph("muldiv", {
	"mul" : /\*/,
	"div" : /\//,
	"mod" : /\%/,
	"una" : "unary"
}, [
	[REGraph.START, "una"],
	["mul", "una"],
	["div", "una"],
	["mod", "una"],
	["una", REGraph.END], ["una", "mul"], ["una", "div"], ["una", "mod"]
]);

parser.setAction("muldiv", function(stack, label) {
	if (stack.length === 1)
		return stack[0];
	var n = stack[0];
	for (var i=0; i<stack.length;) {
		if (label[++i] === "mul")
			n *= stack[++i];
		if (label[i] === "div")
			n /= stack[++i];
		if (label[i] === "mod")
			n %= stack[++i];
	}
	return n;
});

parser.setGraph("unary", {
	"pls" : /\+/,
	"mns" : /\-/,
	"prm" : "prime"
}, [
	[REGraph.START, "prm"], [REGraph.START, "mns"], [REGraph.START, "pls"],
	["pls", "prm"],
	["mns", "prm"],
	["prm", REGraph.END],
]);

parser.setAction("unary", function(stack, label) {
	if (stack.length === 1)
		return stack[0];
	if (label[0] === "mns")
		return -stack[1];
	return stack[1];
});

parser.setGraph("prime", {
	"num" : /0|[1-9][0-9]*/,
	"opb" : /\(/,
	"smb" : "sumsub",
	"clb" : /\)/,
}, [
	[REGraph.START, "num"], [REGraph.START, "opb"],
	["num", REGraph.END],
	["opb", "smb"],
	["smb", "clb"],
	["clb", REGraph.END],
]);

parser.setAction("prime", function(stack, label) {
	if (stack.length === 1)
		return +stack[0];
	return stack[1];
});
