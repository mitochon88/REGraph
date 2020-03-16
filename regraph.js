// =============================================================================
// REGraph.js v1.5.20180909
// https://github.com/yttrium88/REGraph
// Copyright (c) 2018 yttrium88
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
// =============================================================================
"use strict";

export default REGraph;

//;;;const global = ("global", eval)("this");
//;;;global.echo = global.echo || console.log.bind(console);

// =============================================================================
// Class
// =============================================================================

function REGraph()
{
	//without new
	if (!(this instanceof REGraph))
		return new REGraph();
	this._graph = {};
	this._action = {};
}

REGraph["START"] = Symbol("REGraph.START");
REGraph["END"] = Symbol("REGraph.END");
REGraph["IGNORE"] = Symbol("REGraph.IGNORE");

REGraph["prototype"] =
{
	"constructor" : REGraph,
	"define"      : REGraph_define,
	"setGraph"    : REGraph_setGraph, //obsolate
	"setAction"   : REGraph_setAction, //obsolate
	"parse"       : REGraph_parse
};

// =============================================================================
// Prototype
// =============================================================================

function REGraph_define(/*Object*/ defObj)
{
	this._graph[defObj["name"]] = {
		node : defObj["node"],
		edge : defObj["edge"]
	};
	this._action[defObj["name"]] = defObj["action"];
}

function REGraph_setGraph(/*string*/ name, /*Object*/ node, /*Object*/ edge)
{
	this._graph[name] = {
		node,
		edge
	};
}

function REGraph_setAction(/*string*/ name, /*function*/ fn)
{
	this._action[name] = fn;
}

function /*boolean*/ parseGraph(/*string*/ graphName)
{
	//存在しないグラフ
	if (!this._graph.hasOwnProperty(graphName)) {
		this._locked = false;
		throw new Error(`Graph <${graphName}> is not exist!`);
	}
	this._stack.push([]);
	this._labelStack.push([]);
	const graph = this._graph[graphName];
	const depth = this._stack.length - 1;
	let cur_node = REGraph["START"];

	//グラフの直近通過位置の記録
	if (this._passedAt[graphName]) {
		//左再帰の検出
		if (this._passedAt[graphName].slice(-1) === this._position)
			throw new Error(`Left recursion detected at graph <${graphName}>!`);
		this._passedAt[graphName].push(this._position);
	}else
		this._passedAt[graphName] = [this._position];

	//走査開始
//;;;echo((">").repeat(depth+1), "開始:", graphName);
	while (true) {

		//無視
		if (graph.node.hasOwnProperty(REGraph["IGNORE"])) {
			let /*RegExp.exec[]*/ reg_ignore = graph.node[REGraph["IGNORE"]].exec(this._string);
			if (reg_ignore && reg_ignore.index === 0) {
//;;;echo((">").repeat(depth+1), "無視:", graphName, reg_ignore[0]);
				this._string = this._string.slice(reg_ignore[0].length);
				this._stack[depth].push(reg_ignore[0]);
				this._labelStack[depth].push(REGraph["IGNORE"]);
				this._position += reg_ignore[0].length;
			}
		}

		//探索：次ノード候補を走査(見つけ次第BREAK)
		let /*boolean*/ is_terminal = false;
		for (var nodeIndex=-1; ++nodeIndex<graph.edge[cur_node].length;) {
			var nextNode = graph.edge[cur_node][nodeIndex];

			//次のノードが終点シンボル
			if (nextNode === REGraph["END"])
				is_terminal = true;

			//次のノードが非終端記号
			else if (typeof graph.node[nextNode] === "string") {
				if (parseGraph.call(this, graph.node[nextNode])) {
//;;;echo((">").repeat(depth+1), "受理:", graphName, this._stack[depth+1]);
					this._stack[depth].push(this._stack.pop());
					this._labelStack[depth].push(nextNode);
					break;
				}

			//次のノードが終端記号
			}else {
				let /*RegExp.exec[]*/ reg_matched = graph.node[nextNode].exec(this._string);
				if (reg_matched && reg_matched.index === 0) {
//;;;echo((">").repeat(depth+1), "受理:", graphName, reg_matched[0]);
					this._string = this._string.slice(reg_matched[0].length);
					this._stack[depth].push(reg_matched[0]);
					this._labelStack[depth].push(nextNode);
					this._position += reg_matched[0].length;
					break;
				}
			}
		}

		//全エッジ探索完了(BREAKしなかった場合)
		if (nodeIndex === graph.edge[cur_node].length) {

			//終点可ノード→文字列確定
			if (is_terminal) {
//;;;echo((">").repeat(depth+1), "確定:", graphName, this._stack[depth].filter((e, i) => this._labelStack[depth][i] !== REGraph["IGNORE"]));
				let tmp = this._action[graphName].call(this,
					this._stack.pop().filter((e, i) => this._labelStack[depth][i] !== REGraph["IGNORE"]),
					this._labelStack.pop().filter(e => e!==REGraph["IGNORE"])
				);
//;;;echo((">").repeat(depth+1), "解決:", graphName, "=>" , tmp);
				this._stack.push(tmp);
				return true;

			//終点不可ノード→バックトラック
			}else {
				this._labelStack.pop();
				let recovery = this._stack.pop().join("");
//;;;echo((">").repeat(depth+1), "失敗:", graphName, recovery);
				this._passedAt[graphName].pop();
				this._position -= recovery.length;
				this._string = recovery + this._string;
				return false;
			}

		//次のノードへ移動
		}else
			cur_node = nextNode;
	}
}

function REGraph_parse(/*string*/ root, /*string*/ str)
{
	if (this._locked)
		throw new Error("parser has been already running");
	if (str.length === 0)
		throw new TypeError("empty string");
	this._string = str;
	this._position = 0;
	this._passedAt = {};
	this._stack = [];
	this._labelStack = [];
	this._locked = true;
	parseGraph.call(this, root);
	this._locked = false;
	if (this._string.length === 0)
		return this._stack[0];
	throw new Error(`parsing stopped at ${this._position} => ${str.slice(this._position)}`);
}
