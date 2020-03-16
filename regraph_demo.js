//全部右結合。

function test(expr) {
	return parser.parse("sumsub", expr);
}

var parser = new REGraph();

parser.define({
name : "sumsub",
node : {
	[REGraph.IGNORE] : /\s+/,
	mld : "muldiv",
	sum : /\+/,
	sub : /\-/,
	smb : "sumsub"
},
edge : {
	[REGraph.START] : ["mld"],
	mld : [REGraph.END, "sum", "sub"],
	sum : ["smb"],
	sub : ["smb"],
	smb : [REGraph.END]
},
action : function(stack, label) {
	if (stack.length === 1)
		return stack[0];
	if (label[1] === "sum")
		return stack[0] + stack[2];
	return stack[0] - stack[2];
}
});

parser.define({
name : "muldiv",
node : {
	[REGraph.IGNORE] : /\s+/,
	una : "unary",
	mul : /\*/,
	div : /\//,
	mod : /\%/,
	mld : "muldiv"
},
edge : {
	[REGraph.START] : ["una"],
	una : [REGraph.END, "mul", "div", "mod"],
	mul : ["mld"],
	div : ["mld"],
	mod : ["mld"],
	mld : [REGraph.END]
},
action : function(stack, label) {
	switch (true) {
	case stack.length === 1 :
		return stack[0];
	case label[1] === "mul" :
		return stack[0] * stack[2];
	case label[1] === "div" :
		return stack[0] / stack[2];
	case label[1] === "mod" :
		return stack[0] % stack[2];
	}
}
});

parser.setGraph("unary", {
	"prm" : "prime",
	"mns" : /\-/,
	"pls" : /\+/
}, {
	[REGraph.START] : ["prm", "mns", "pls"],
	"prm" : [REGraph.END],
	"mns" : ["prm"],
	"pls" : ["prm"]
});

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
}, {
	[REGraph.START] : ["num", "opb"],
	"num" : [REGraph.END],
	"opb" : ["smb"],
	"smb" : ["clb"],
	"clb" : [REGraph.END]
});

parser.setAction("prime", function(stack, label) {
	if (stack.length === 1)
		return +stack[0];
	return stack[1];
});
