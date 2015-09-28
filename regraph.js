// =============================================================================
// REGraph.js v1.2
// http://www.wh2.fiberbit.net/yttrium88_23/
// =============================================================================
(function(global) {"use strict"; if (global["REGraph"]) return;

if (typeof exports === "object")
	module["exports"] = REGraph;
else
	global["REGraph"] = REGraph;

// =============================================================================
// Class
// =============================================================================

function REGraph() {
	//without new
	if (!(this instanceof REGraph))
		return new REGraph();
	this._graph = {};
	this._action = {};
	this._string = "";
	this._position = 0;
	this._stack = [];
	this._labelStack = [];
	this._locked = false;
	Object.seal(this);
}

REGraph["START"] = ["START"];
REGraph["END"] = ["END"];

REGraph["prototype"] =
{
	"constructor" : REGraph,
	"setGraph"    : REGraph_setGraph,
	"setAction"   : REGraph_setAction,
	"parse"       : REGraph_parse
};

// =============================================================================
// Prototype
// =============================================================================

function REGraph_setGraph(/*string*/ name, /*Object*/ node, /*Array*/ edge)
{
	this._graph[name] = {
		node : node,
		edge : edge
	};
}

function REGraph_setAction(/*string*/ name, /*Function*/ fn)
{
	this._action[name] = fn;
}

function parseGraph(/*string*/ graphName)
{
//;;;if(!global.echo) {global.echo = function(x) {console.log(x);};Array.prototype.toString = function(){return "[" + this.join(",") + "]"};}
	this._stack.push([]);
	this._labelStack.push([]);
	var graph = this._graph[graphName];
	var depth = this._stack.length - 1;
	var cur_label = REGraph["START"];
	var /*boolean*/ is_terminal;
	var /*RegExp.exec[]*/ reg_matched;
//;;;echo(depth + "/" + graphName + ": push " + this._labelStack);
	while (true) {
		is_terminal = false;
		//現在ノードからのエッジ列挙
		for (var i=-1; ++i<graph.edge.length;) {
			if (graph.edge[i][0] !== cur_label)
				continue;
			if (graph.edge[i][1] === REGraph["END"])
				is_terminal = true;
			else if (typeof graph.node[graph.edge[i][1]] === "string") {
				//非終端
				if (parseGraph.call(this, graph.node[graph.edge[i][1]])) {
					this._stack[depth].push(this._stack.pop());
					this._labelStack[depth].push(graph.edge[i][1]);
//;;;echo(depth + "/" + graphName + ": reduce " + this._labelStack);
					break;
				}
			}else {
				//終端
				reg_matched = graph.node[graph.edge[i][1]].exec(this._string);
				if (reg_matched && reg_matched.index === 0) {
					this._string = this._string.slice(reg_matched[0].length);
					this._stack[depth].push(reg_matched[0]);
					this._labelStack[depth].push(graph.edge[i][1]);
					this._position += reg_matched[0].length;
//;;;echo(depth + "/" + graphName + ": accept " + reg_matched[0]);
					break;
				}
			}
		}
		if (i === graph.edge.length) {
			//全エッジ探索完了→マッチしなかった
			if (is_terminal) {
				//終点ノード→終了
//;;;echo(depth + "/" + graphName + ": call " + this._labelStack[depth]);
				this._stack.push(this._action[graphName](this._stack.pop(), this._labelStack.pop()));
				return true;
			}else {
				//失敗→バックトラック
				this._string = this._stack.pop().join("") + this._string;
				this._labelStack.pop();
//;;;echo(depth + "/" + graphName + ": failed");
				return false;
			}
		}else
			//次のノードへ
			cur_label = graph.edge[i][1];
	}
}

function REGraph_parse(/*string*/ root, /*string*/ str)
{
	if (this._locked)
		return;
	if (str.length === 0)
		throw new TypeError("empty string");
	this._string = str;
	this._position = 0;
	this._stack = [];
	this._labelStack = [];
	this._locked = true;
	parseGraph.call(this, root);
	this._locked = false;
	if (this._string.length === 0)
		return this._stack[0];
	throw new Error("unparseable string: " + str.slice(this._position));
}

})(("global", eval)("this"));
