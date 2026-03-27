import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) {
		__defProp(target, name, {
			get: all[name],
			enumerable: true
		});
	}
	if (!no_symbols) {
		__defProp(target, Symbol.toStringTag, { value: "Module" });
	}
	return target;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* @__PURE__ */ createRequire(import.meta.url);

//#endregion
//#region ../../../../../helpers/dist/common/fn.js
const e$1 = (e) => new Promise((t) => setTimeout(t, e));

//#endregion
//#region ../../../../../../node_modules/.pnpm/process-nextick-args@2.0.1/node_modules/process-nextick-args/index.js
var require_process_nextick_args = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	if (typeof process === "undefined" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0) module.exports = { nextTick };
	else module.exports = process;
	function nextTick(fn, arg1, arg2, arg3) {
		if (typeof fn !== "function") throw new TypeError("\"callback\" argument must be a function");
		var len = arguments.length;
		var args, i;
		switch (len) {
			case 0:
			case 1: return process.nextTick(fn);
			case 2: return process.nextTick(function afterTickOne() {
				fn.call(null, arg1);
			});
			case 3: return process.nextTick(function afterTickTwo() {
				fn.call(null, arg1, arg2);
			});
			case 4: return process.nextTick(function afterTickThree() {
				fn.call(null, arg1, arg2, arg3);
			});
			default:
				args = new Array(len - 1);
				i = 0;
				while (i < args.length) args[i++] = arguments[i];
				return process.nextTick(function afterTick() {
					fn.apply(null, args);
				});
		}
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/isarray@1.0.0/node_modules/isarray/index.js
var require_isarray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var toString = {}.toString;
	module.exports = Array.isArray || function(arr) {
		return toString.call(arr) == "[object Array]";
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/stream.js
var require_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = __require("node:stream");
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/safe-buffer@5.1.2/node_modules/safe-buffer/index.js
var require_safe_buffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var buffer = __require("node:buffer");
	var Buffer = buffer.Buffer;
	function copyProps(src, dst) {
		for (var key in src) dst[key] = src[key];
	}
	if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) module.exports = buffer;
	else {
		copyProps(buffer, exports);
		exports.Buffer = SafeBuffer;
	}
	function SafeBuffer(arg, encodingOrOffset, length) {
		return Buffer(arg, encodingOrOffset, length);
	}
	copyProps(Buffer, SafeBuffer);
	SafeBuffer.from = function(arg, encodingOrOffset, length) {
		if (typeof arg === "number") throw new TypeError("Argument must not be a number");
		return Buffer(arg, encodingOrOffset, length);
	};
	SafeBuffer.alloc = function(size, fill, encoding) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		var buf = Buffer(size);
		if (fill !== void 0) if (typeof encoding === "string") buf.fill(fill, encoding);
		else buf.fill(fill);
		else buf.fill(0);
		return buf;
	};
	SafeBuffer.allocUnsafe = function(size) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		return Buffer(size);
	};
	SafeBuffer.allocUnsafeSlow = function(size) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		return buffer.SlowBuffer(size);
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/core-util-is@1.0.3/node_modules/core-util-is/lib/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
	function isArray(arg) {
		if (Array.isArray) return Array.isArray(arg);
		return objectToString(arg) === "[object Array]";
	}
	exports.isArray = isArray;
	function isBoolean(arg) {
		return typeof arg === "boolean";
	}
	exports.isBoolean = isBoolean;
	function isNull(arg) {
		return arg === null;
	}
	exports.isNull = isNull;
	function isNullOrUndefined(arg) {
		return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;
	function isNumber(arg) {
		return typeof arg === "number";
	}
	exports.isNumber = isNumber;
	function isString(arg) {
		return typeof arg === "string";
	}
	exports.isString = isString;
	function isSymbol(arg) {
		return typeof arg === "symbol";
	}
	exports.isSymbol = isSymbol;
	function isUndefined(arg) {
		return arg === void 0;
	}
	exports.isUndefined = isUndefined;
	function isRegExp(re) {
		return objectToString(re) === "[object RegExp]";
	}
	exports.isRegExp = isRegExp;
	function isObject(arg) {
		return typeof arg === "object" && arg !== null;
	}
	exports.isObject = isObject;
	function isDate(d) {
		return objectToString(d) === "[object Date]";
	}
	exports.isDate = isDate;
	function isError(e) {
		return objectToString(e) === "[object Error]" || e instanceof Error;
	}
	exports.isError = isError;
	function isFunction(arg) {
		return typeof arg === "function";
	}
	exports.isFunction = isFunction;
	function isPrimitive(arg) {
		return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
	}
	exports.isPrimitive = isPrimitive;
	exports.isBuffer = __require("node:buffer").Buffer.isBuffer;
	function objectToString(o) {
		return Object.prototype.toString.call(o);
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits_browser.js
var require_inherits_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	if (typeof Object.create === "function") module.exports = function inherits(ctor, superCtor) {
		if (superCtor) {
			ctor.super_ = superCtor;
			ctor.prototype = Object.create(superCtor.prototype, { constructor: {
				value: ctor,
				enumerable: false,
				writable: true,
				configurable: true
			} });
		}
	};
	else module.exports = function inherits(ctor, superCtor) {
		if (superCtor) {
			ctor.super_ = superCtor;
			var TempCtor = function() {};
			TempCtor.prototype = superCtor.prototype;
			ctor.prototype = new TempCtor();
			ctor.prototype.constructor = ctor;
		}
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/inherits@2.0.4/node_modules/inherits/inherits.js
var require_inherits = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	try {
		var util$1 = __require("node:util");
		/* istanbul ignore next */
		if (typeof util$1.inherits !== "function") throw "";
		module.exports = util$1.inherits;
	} catch (e) {
		/* istanbul ignore next */
		module.exports = require_inherits_browser();
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/BufferList.js
var require_BufferList = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function");
	}
	var Buffer = require_safe_buffer().Buffer;
	var util = __require("node:util");
	function copyBuffer(src, target, offset) {
		src.copy(target, offset);
	}
	module.exports = function() {
		function BufferList() {
			_classCallCheck(this, BufferList);
			this.head = null;
			this.tail = null;
			this.length = 0;
		}
		BufferList.prototype.push = function push(v) {
			var entry = {
				data: v,
				next: null
			};
			if (this.length > 0) this.tail.next = entry;
			else this.head = entry;
			this.tail = entry;
			++this.length;
		};
		BufferList.prototype.unshift = function unshift(v) {
			var entry = {
				data: v,
				next: this.head
			};
			if (this.length === 0) this.tail = entry;
			this.head = entry;
			++this.length;
		};
		BufferList.prototype.shift = function shift() {
			if (this.length === 0) return;
			var ret = this.head.data;
			if (this.length === 1) this.head = this.tail = null;
			else this.head = this.head.next;
			--this.length;
			return ret;
		};
		BufferList.prototype.clear = function clear() {
			this.head = this.tail = null;
			this.length = 0;
		};
		BufferList.prototype.join = function join(s) {
			if (this.length === 0) return "";
			var p = this.head;
			var ret = "" + p.data;
			while (p = p.next) ret += s + p.data;
			return ret;
		};
		BufferList.prototype.concat = function concat(n) {
			if (this.length === 0) return Buffer.alloc(0);
			var ret = Buffer.allocUnsafe(n >>> 0);
			var p = this.head;
			var i = 0;
			while (p) {
				copyBuffer(p.data, ret, i);
				i += p.data.length;
				p = p.next;
			}
			return ret;
		};
		return BufferList;
	}();
	if (util && util.inspect && util.inspect.custom) module.exports.prototype[util.inspect.custom] = function() {
		var obj = util.inspect({ length: this.length });
		return this.constructor.name + " " + obj;
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/internal/streams/destroy.js
var require_destroy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var pna = require_process_nextick_args();
	function destroy(err, cb) {
		var _this = this;
		var readableDestroyed = this._readableState && this._readableState.destroyed;
		var writableDestroyed = this._writableState && this._writableState.destroyed;
		if (readableDestroyed || writableDestroyed) {
			if (cb) cb(err);
			else if (err) {
				if (!this._writableState) pna.nextTick(emitErrorNT, this, err);
				else if (!this._writableState.errorEmitted) {
					this._writableState.errorEmitted = true;
					pna.nextTick(emitErrorNT, this, err);
				}
			}
			return this;
		}
		if (this._readableState) this._readableState.destroyed = true;
		if (this._writableState) this._writableState.destroyed = true;
		this._destroy(err || null, function(err) {
			if (!cb && err) {
				if (!_this._writableState) pna.nextTick(emitErrorNT, _this, err);
				else if (!_this._writableState.errorEmitted) {
					_this._writableState.errorEmitted = true;
					pna.nextTick(emitErrorNT, _this, err);
				}
			} else if (cb) cb(err);
		});
		return this;
	}
	function undestroy() {
		if (this._readableState) {
			this._readableState.destroyed = false;
			this._readableState.reading = false;
			this._readableState.ended = false;
			this._readableState.endEmitted = false;
		}
		if (this._writableState) {
			this._writableState.destroyed = false;
			this._writableState.ended = false;
			this._writableState.ending = false;
			this._writableState.finalCalled = false;
			this._writableState.prefinished = false;
			this._writableState.finished = false;
			this._writableState.errorEmitted = false;
		}
	}
	function emitErrorNT(self, err) {
		self.emit("error", err);
	}
	module.exports = {
		destroy,
		undestroy
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* For Node.js, simply re-export the core `util.deprecate` function.
	*/
	module.exports = __require("node:util").deprecate;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_writable.js
var require__stream_writable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var pna = require_process_nextick_args();
	module.exports = Writable;
	function CorkedRequest(state) {
		var _this = this;
		this.next = null;
		this.entry = null;
		this.finish = function() {
			onCorkedFinish(_this, state);
		};
	}
	var asyncWrite = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
	var Duplex;
	Writable.WritableState = WritableState;
	var util = Object.create(require_util());
	util.inherits = require_inherits();
	var internalUtil = { deprecate: require_node() };
	var Stream = require_stream();
	var Buffer = require_safe_buffer().Buffer;
	var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {};
	function _uint8ArrayToBuffer(chunk) {
		return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
		return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}
	var destroyImpl = require_destroy();
	util.inherits(Writable, Stream);
	function nop() {}
	function WritableState(options, stream) {
		Duplex = Duplex || require__stream_duplex();
		options = options || {};
		var isDuplex = stream instanceof Duplex;
		this.objectMode = !!options.objectMode;
		if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
		var hwm = options.highWaterMark;
		var writableHwm = options.writableHighWaterMark;
		var defaultHwm = this.objectMode ? 16 : 16 * 1024;
		if (hwm || hwm === 0) this.highWaterMark = hwm;
		else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;
		else this.highWaterMark = defaultHwm;
		this.highWaterMark = Math.floor(this.highWaterMark);
		this.finalCalled = false;
		this.needDrain = false;
		this.ending = false;
		this.ended = false;
		this.finished = false;
		this.destroyed = false;
		this.decodeStrings = !(options.decodeStrings === false);
		this.defaultEncoding = options.defaultEncoding || "utf8";
		this.length = 0;
		this.writing = false;
		this.corked = 0;
		this.sync = true;
		this.bufferProcessing = false;
		this.onwrite = function(er) {
			onwrite(stream, er);
		};
		this.writecb = null;
		this.writelen = 0;
		this.bufferedRequest = null;
		this.lastBufferedRequest = null;
		this.pendingcb = 0;
		this.prefinished = false;
		this.errorEmitted = false;
		this.bufferedRequestCount = 0;
		this.corkedRequestsFree = new CorkedRequest(this);
	}
	WritableState.prototype.getBuffer = function getBuffer() {
		var current = this.bufferedRequest;
		var out = [];
		while (current) {
			out.push(current);
			current = current.next;
		}
		return out;
	};
	(function() {
		try {
			Object.defineProperty(WritableState.prototype, "buffer", { get: internalUtil.deprecate(function() {
				return this.getBuffer();
			}, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003") });
		} catch (_) {}
	})();
	var realHasInstance;
	if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
		realHasInstance = Function.prototype[Symbol.hasInstance];
		Object.defineProperty(Writable, Symbol.hasInstance, { value: function(object) {
			if (realHasInstance.call(this, object)) return true;
			if (this !== Writable) return false;
			return object && object._writableState instanceof WritableState;
		} });
	} else realHasInstance = function(object) {
		return object instanceof this;
	};
	function Writable(options) {
		Duplex = Duplex || require__stream_duplex();
		if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) return new Writable(options);
		this._writableState = new WritableState(options, this);
		this.writable = true;
		if (options) {
			if (typeof options.write === "function") this._write = options.write;
			if (typeof options.writev === "function") this._writev = options.writev;
			if (typeof options.destroy === "function") this._destroy = options.destroy;
			if (typeof options.final === "function") this._final = options.final;
		}
		Stream.call(this);
	}
	Writable.prototype.pipe = function() {
		this.emit("error", /* @__PURE__ */ new Error("Cannot pipe, not readable"));
	};
	function writeAfterEnd(stream, cb) {
		var er = /* @__PURE__ */ new Error("write after end");
		stream.emit("error", er);
		pna.nextTick(cb, er);
	}
	function validChunk(stream, state, chunk, cb) {
		var valid = true;
		var er = false;
		if (chunk === null) er = /* @__PURE__ */ new TypeError("May not write null values to stream");
		else if (typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) er = /* @__PURE__ */ new TypeError("Invalid non-string/buffer chunk");
		if (er) {
			stream.emit("error", er);
			pna.nextTick(cb, er);
			valid = false;
		}
		return valid;
	}
	Writable.prototype.write = function(chunk, encoding, cb) {
		var state = this._writableState;
		var ret = false;
		var isBuf = !state.objectMode && _isUint8Array(chunk);
		if (isBuf && !Buffer.isBuffer(chunk)) chunk = _uint8ArrayToBuffer(chunk);
		if (typeof encoding === "function") {
			cb = encoding;
			encoding = null;
		}
		if (isBuf) encoding = "buffer";
		else if (!encoding) encoding = state.defaultEncoding;
		if (typeof cb !== "function") cb = nop;
		if (state.ended) writeAfterEnd(this, cb);
		else if (isBuf || validChunk(this, state, chunk, cb)) {
			state.pendingcb++;
			ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
		}
		return ret;
	};
	Writable.prototype.cork = function() {
		var state = this._writableState;
		state.corked++;
	};
	Writable.prototype.uncork = function() {
		var state = this._writableState;
		if (state.corked) {
			state.corked--;
			if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
		}
	};
	Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
		if (typeof encoding === "string") encoding = encoding.toLowerCase();
		if (!([
			"hex",
			"utf8",
			"utf-8",
			"ascii",
			"binary",
			"base64",
			"ucs2",
			"ucs-2",
			"utf16le",
			"utf-16le",
			"raw"
		].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
		this._writableState.defaultEncoding = encoding;
		return this;
	};
	function decodeChunk(state, chunk, encoding) {
		if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") chunk = Buffer.from(chunk, encoding);
		return chunk;
	}
	Object.defineProperty(Writable.prototype, "writableHighWaterMark", {
		enumerable: false,
		get: function() {
			return this._writableState.highWaterMark;
		}
	});
	function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
		if (!isBuf) {
			var newChunk = decodeChunk(state, chunk, encoding);
			if (chunk !== newChunk) {
				isBuf = true;
				encoding = "buffer";
				chunk = newChunk;
			}
		}
		var len = state.objectMode ? 1 : chunk.length;
		state.length += len;
		var ret = state.length < state.highWaterMark;
		if (!ret) state.needDrain = true;
		if (state.writing || state.corked) {
			var last = state.lastBufferedRequest;
			state.lastBufferedRequest = {
				chunk,
				encoding,
				isBuf,
				callback: cb,
				next: null
			};
			if (last) last.next = state.lastBufferedRequest;
			else state.bufferedRequest = state.lastBufferedRequest;
			state.bufferedRequestCount += 1;
		} else doWrite(stream, state, false, len, chunk, encoding, cb);
		return ret;
	}
	function doWrite(stream, state, writev, len, chunk, encoding, cb) {
		state.writelen = len;
		state.writecb = cb;
		state.writing = true;
		state.sync = true;
		if (writev) stream._writev(chunk, state.onwrite);
		else stream._write(chunk, encoding, state.onwrite);
		state.sync = false;
	}
	function onwriteError(stream, state, sync, er, cb) {
		--state.pendingcb;
		if (sync) {
			pna.nextTick(cb, er);
			pna.nextTick(finishMaybe, stream, state);
			stream._writableState.errorEmitted = true;
			stream.emit("error", er);
		} else {
			cb(er);
			stream._writableState.errorEmitted = true;
			stream.emit("error", er);
			finishMaybe(stream, state);
		}
	}
	function onwriteStateUpdate(state) {
		state.writing = false;
		state.writecb = null;
		state.length -= state.writelen;
		state.writelen = 0;
	}
	function onwrite(stream, er) {
		var state = stream._writableState;
		var sync = state.sync;
		var cb = state.writecb;
		onwriteStateUpdate(state);
		if (er) onwriteError(stream, state, sync, er, cb);
		else {
			var finished = needFinish(state);
			if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(stream, state);
			if (sync) asyncWrite(afterWrite, stream, state, finished, cb);
			else afterWrite(stream, state, finished, cb);
		}
	}
	function afterWrite(stream, state, finished, cb) {
		if (!finished) onwriteDrain(stream, state);
		state.pendingcb--;
		cb();
		finishMaybe(stream, state);
	}
	function onwriteDrain(stream, state) {
		if (state.length === 0 && state.needDrain) {
			state.needDrain = false;
			stream.emit("drain");
		}
	}
	function clearBuffer(stream, state) {
		state.bufferProcessing = true;
		var entry = state.bufferedRequest;
		if (stream._writev && entry && entry.next) {
			var l = state.bufferedRequestCount;
			var buffer = new Array(l);
			var holder = state.corkedRequestsFree;
			holder.entry = entry;
			var count = 0;
			var allBuffers = true;
			while (entry) {
				buffer[count] = entry;
				if (!entry.isBuf) allBuffers = false;
				entry = entry.next;
				count += 1;
			}
			buffer.allBuffers = allBuffers;
			doWrite(stream, state, true, state.length, buffer, "", holder.finish);
			state.pendingcb++;
			state.lastBufferedRequest = null;
			if (holder.next) {
				state.corkedRequestsFree = holder.next;
				holder.next = null;
			} else state.corkedRequestsFree = new CorkedRequest(state);
			state.bufferedRequestCount = 0;
		} else {
			while (entry) {
				var chunk = entry.chunk;
				var encoding = entry.encoding;
				var cb = entry.callback;
				doWrite(stream, state, false, state.objectMode ? 1 : chunk.length, chunk, encoding, cb);
				entry = entry.next;
				state.bufferedRequestCount--;
				if (state.writing) break;
			}
			if (entry === null) state.lastBufferedRequest = null;
		}
		state.bufferedRequest = entry;
		state.bufferProcessing = false;
	}
	Writable.prototype._write = function(chunk, encoding, cb) {
		cb(/* @__PURE__ */ new Error("_write() is not implemented"));
	};
	Writable.prototype._writev = null;
	Writable.prototype.end = function(chunk, encoding, cb) {
		var state = this._writableState;
		if (typeof chunk === "function") {
			cb = chunk;
			chunk = null;
			encoding = null;
		} else if (typeof encoding === "function") {
			cb = encoding;
			encoding = null;
		}
		if (chunk !== null && chunk !== void 0) this.write(chunk, encoding);
		if (state.corked) {
			state.corked = 1;
			this.uncork();
		}
		if (!state.ending) endWritable(this, state, cb);
	};
	function needFinish(state) {
		return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
	}
	function callFinal(stream, state) {
		stream._final(function(err) {
			state.pendingcb--;
			if (err) stream.emit("error", err);
			state.prefinished = true;
			stream.emit("prefinish");
			finishMaybe(stream, state);
		});
	}
	function prefinish(stream, state) {
		if (!state.prefinished && !state.finalCalled) if (typeof stream._final === "function") {
			state.pendingcb++;
			state.finalCalled = true;
			pna.nextTick(callFinal, stream, state);
		} else {
			state.prefinished = true;
			stream.emit("prefinish");
		}
	}
	function finishMaybe(stream, state) {
		var need = needFinish(state);
		if (need) {
			prefinish(stream, state);
			if (state.pendingcb === 0) {
				state.finished = true;
				stream.emit("finish");
			}
		}
		return need;
	}
	function endWritable(stream, state, cb) {
		state.ending = true;
		finishMaybe(stream, state);
		if (cb) if (state.finished) pna.nextTick(cb);
		else stream.once("finish", cb);
		state.ended = true;
		stream.writable = false;
	}
	function onCorkedFinish(corkReq, state, err) {
		var entry = corkReq.entry;
		corkReq.entry = null;
		while (entry) {
			var cb = entry.callback;
			state.pendingcb--;
			cb(err);
			entry = entry.next;
		}
		state.corkedRequestsFree.next = corkReq;
	}
	Object.defineProperty(Writable.prototype, "destroyed", {
		get: function() {
			if (this._writableState === void 0) return false;
			return this._writableState.destroyed;
		},
		set: function(value) {
			if (!this._writableState) return;
			this._writableState.destroyed = value;
		}
	});
	Writable.prototype.destroy = destroyImpl.destroy;
	Writable.prototype._undestroy = destroyImpl.undestroy;
	Writable.prototype._destroy = function(err, cb) {
		this.end();
		cb(err);
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_duplex.js
var require__stream_duplex = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var pna = require_process_nextick_args();
	var objectKeys = Object.keys || function(obj) {
		var keys = [];
		for (var key in obj) keys.push(key);
		return keys;
	};
	module.exports = Duplex;
	var util = Object.create(require_util());
	util.inherits = require_inherits();
	var Readable = require__stream_readable();
	var Writable = require__stream_writable();
	util.inherits(Duplex, Readable);
	var keys = objectKeys(Writable.prototype);
	for (var v = 0; v < keys.length; v++) {
		var method = keys[v];
		if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
	}
	function Duplex(options) {
		if (!(this instanceof Duplex)) return new Duplex(options);
		Readable.call(this, options);
		Writable.call(this, options);
		if (options && options.readable === false) this.readable = false;
		if (options && options.writable === false) this.writable = false;
		this.allowHalfOpen = true;
		if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
		this.once("end", onend);
	}
	Object.defineProperty(Duplex.prototype, "writableHighWaterMark", {
		enumerable: false,
		get: function() {
			return this._writableState.highWaterMark;
		}
	});
	function onend() {
		if (this.allowHalfOpen || this._writableState.ended) return;
		pna.nextTick(onEndNT, this);
	}
	function onEndNT(self) {
		self.end();
	}
	Object.defineProperty(Duplex.prototype, "destroyed", {
		get: function() {
			if (this._readableState === void 0 || this._writableState === void 0) return false;
			return this._readableState.destroyed && this._writableState.destroyed;
		},
		set: function(value) {
			if (this._readableState === void 0 || this._writableState === void 0) return;
			this._readableState.destroyed = value;
			this._writableState.destroyed = value;
		}
	});
	Duplex.prototype._destroy = function(err, cb) {
		this.push(null);
		this.end();
		pna.nextTick(cb, err);
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/string_decoder@1.1.1/node_modules/string_decoder/lib/string_decoder.js
var require_string_decoder = /* @__PURE__ */ __commonJSMin(((exports) => {
	var Buffer = require_safe_buffer().Buffer;
	var isEncoding = Buffer.isEncoding || function(encoding) {
		encoding = "" + encoding;
		switch (encoding && encoding.toLowerCase()) {
			case "hex":
			case "utf8":
			case "utf-8":
			case "ascii":
			case "binary":
			case "base64":
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le":
			case "raw": return true;
			default: return false;
		}
	};
	function _normalizeEncoding(enc) {
		if (!enc) return "utf8";
		var retried;
		while (true) switch (enc) {
			case "utf8":
			case "utf-8": return "utf8";
			case "ucs2":
			case "ucs-2":
			case "utf16le":
			case "utf-16le": return "utf16le";
			case "latin1":
			case "binary": return "latin1";
			case "base64":
			case "ascii":
			case "hex": return enc;
			default:
				if (retried) return;
				enc = ("" + enc).toLowerCase();
				retried = true;
		}
	}
	function normalizeEncoding(enc) {
		var nenc = _normalizeEncoding(enc);
		if (typeof nenc !== "string" && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error("Unknown encoding: " + enc);
		return nenc || enc;
	}
	exports.StringDecoder = StringDecoder;
	function StringDecoder(encoding) {
		this.encoding = normalizeEncoding(encoding);
		var nb;
		switch (this.encoding) {
			case "utf16le":
				this.text = utf16Text;
				this.end = utf16End;
				nb = 4;
				break;
			case "utf8":
				this.fillLast = utf8FillLast;
				nb = 4;
				break;
			case "base64":
				this.text = base64Text;
				this.end = base64End;
				nb = 3;
				break;
			default:
				this.write = simpleWrite;
				this.end = simpleEnd;
				return;
		}
		this.lastNeed = 0;
		this.lastTotal = 0;
		this.lastChar = Buffer.allocUnsafe(nb);
	}
	StringDecoder.prototype.write = function(buf) {
		if (buf.length === 0) return "";
		var r;
		var i;
		if (this.lastNeed) {
			r = this.fillLast(buf);
			if (r === void 0) return "";
			i = this.lastNeed;
			this.lastNeed = 0;
		} else i = 0;
		if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
		return r || "";
	};
	StringDecoder.prototype.end = utf8End;
	StringDecoder.prototype.text = utf8Text;
	StringDecoder.prototype.fillLast = function(buf) {
		if (this.lastNeed <= buf.length) {
			buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
			return this.lastChar.toString(this.encoding, 0, this.lastTotal);
		}
		buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
		this.lastNeed -= buf.length;
	};
	function utf8CheckByte(byte) {
		if (byte <= 127) return 0;
		else if (byte >> 5 === 6) return 2;
		else if (byte >> 4 === 14) return 3;
		else if (byte >> 3 === 30) return 4;
		return byte >> 6 === 2 ? -1 : -2;
	}
	function utf8CheckIncomplete(self, buf, i) {
		var j = buf.length - 1;
		if (j < i) return 0;
		var nb = utf8CheckByte(buf[j]);
		if (nb >= 0) {
			if (nb > 0) self.lastNeed = nb - 1;
			return nb;
		}
		if (--j < i || nb === -2) return 0;
		nb = utf8CheckByte(buf[j]);
		if (nb >= 0) {
			if (nb > 0) self.lastNeed = nb - 2;
			return nb;
		}
		if (--j < i || nb === -2) return 0;
		nb = utf8CheckByte(buf[j]);
		if (nb >= 0) {
			if (nb > 0) if (nb === 2) nb = 0;
			else self.lastNeed = nb - 3;
			return nb;
		}
		return 0;
	}
	function utf8CheckExtraBytes(self, buf, p) {
		if ((buf[0] & 192) !== 128) {
			self.lastNeed = 0;
			return "�";
		}
		if (self.lastNeed > 1 && buf.length > 1) {
			if ((buf[1] & 192) !== 128) {
				self.lastNeed = 1;
				return "�";
			}
			if (self.lastNeed > 2 && buf.length > 2) {
				if ((buf[2] & 192) !== 128) {
					self.lastNeed = 2;
					return "�";
				}
			}
		}
	}
	function utf8FillLast(buf) {
		var p = this.lastTotal - this.lastNeed;
		var r = utf8CheckExtraBytes(this, buf, p);
		if (r !== void 0) return r;
		if (this.lastNeed <= buf.length) {
			buf.copy(this.lastChar, p, 0, this.lastNeed);
			return this.lastChar.toString(this.encoding, 0, this.lastTotal);
		}
		buf.copy(this.lastChar, p, 0, buf.length);
		this.lastNeed -= buf.length;
	}
	function utf8Text(buf, i) {
		var total = utf8CheckIncomplete(this, buf, i);
		if (!this.lastNeed) return buf.toString("utf8", i);
		this.lastTotal = total;
		var end = buf.length - (total - this.lastNeed);
		buf.copy(this.lastChar, 0, end);
		return buf.toString("utf8", i, end);
	}
	function utf8End(buf) {
		var r = buf && buf.length ? this.write(buf) : "";
		if (this.lastNeed) return r + "�";
		return r;
	}
	function utf16Text(buf, i) {
		if ((buf.length - i) % 2 === 0) {
			var r = buf.toString("utf16le", i);
			if (r) {
				var c = r.charCodeAt(r.length - 1);
				if (c >= 55296 && c <= 56319) {
					this.lastNeed = 2;
					this.lastTotal = 4;
					this.lastChar[0] = buf[buf.length - 2];
					this.lastChar[1] = buf[buf.length - 1];
					return r.slice(0, -1);
				}
			}
			return r;
		}
		this.lastNeed = 1;
		this.lastTotal = 2;
		this.lastChar[0] = buf[buf.length - 1];
		return buf.toString("utf16le", i, buf.length - 1);
	}
	function utf16End(buf) {
		var r = buf && buf.length ? this.write(buf) : "";
		if (this.lastNeed) {
			var end = this.lastTotal - this.lastNeed;
			return r + this.lastChar.toString("utf16le", 0, end);
		}
		return r;
	}
	function base64Text(buf, i) {
		var n = (buf.length - i) % 3;
		if (n === 0) return buf.toString("base64", i);
		this.lastNeed = 3 - n;
		this.lastTotal = 3;
		if (n === 1) this.lastChar[0] = buf[buf.length - 1];
		else {
			this.lastChar[0] = buf[buf.length - 2];
			this.lastChar[1] = buf[buf.length - 1];
		}
		return buf.toString("base64", i, buf.length - n);
	}
	function base64End(buf) {
		var r = buf && buf.length ? this.write(buf) : "";
		if (this.lastNeed) return r + this.lastChar.toString("base64", 0, 3 - this.lastNeed);
		return r;
	}
	function simpleWrite(buf) {
		return buf.toString(this.encoding);
	}
	function simpleEnd(buf) {
		return buf && buf.length ? this.write(buf) : "";
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_readable.js
var require__stream_readable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var pna = require_process_nextick_args();
	module.exports = Readable;
	var isArray = require_isarray();
	var Duplex;
	Readable.ReadableState = ReadableState;
	__require("node:events").EventEmitter;
	var EElistenerCount = function(emitter, type) {
		return emitter.listeners(type).length;
	};
	var Stream = require_stream();
	var Buffer = require_safe_buffer().Buffer;
	var OurUint8Array = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {}).Uint8Array || function() {};
	function _uint8ArrayToBuffer(chunk) {
		return Buffer.from(chunk);
	}
	function _isUint8Array(obj) {
		return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
	}
	var util = Object.create(require_util());
	util.inherits = require_inherits();
	var debugUtil = __require("node:util");
	var debug = void 0;
	if (debugUtil && debugUtil.debuglog) debug = debugUtil.debuglog("stream");
	else debug = function() {};
	var BufferList = require_BufferList();
	var destroyImpl = require_destroy();
	var StringDecoder;
	util.inherits(Readable, Stream);
	var kProxyEvents = [
		"error",
		"close",
		"destroy",
		"pause",
		"resume"
	];
	function prependListener(emitter, event, fn) {
		if (typeof emitter.prependListener === "function") return emitter.prependListener(event, fn);
		if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);
		else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);
		else emitter._events[event] = [fn, emitter._events[event]];
	}
	function ReadableState(options, stream) {
		Duplex = Duplex || require__stream_duplex();
		options = options || {};
		var isDuplex = stream instanceof Duplex;
		this.objectMode = !!options.objectMode;
		if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
		var hwm = options.highWaterMark;
		var readableHwm = options.readableHighWaterMark;
		var defaultHwm = this.objectMode ? 16 : 16 * 1024;
		if (hwm || hwm === 0) this.highWaterMark = hwm;
		else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;
		else this.highWaterMark = defaultHwm;
		this.highWaterMark = Math.floor(this.highWaterMark);
		this.buffer = new BufferList();
		this.length = 0;
		this.pipes = null;
		this.pipesCount = 0;
		this.flowing = null;
		this.ended = false;
		this.endEmitted = false;
		this.reading = false;
		this.sync = true;
		this.needReadable = false;
		this.emittedReadable = false;
		this.readableListening = false;
		this.resumeScheduled = false;
		this.destroyed = false;
		this.defaultEncoding = options.defaultEncoding || "utf8";
		this.awaitDrain = 0;
		this.readingMore = false;
		this.decoder = null;
		this.encoding = null;
		if (options.encoding) {
			if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
			this.decoder = new StringDecoder(options.encoding);
			this.encoding = options.encoding;
		}
	}
	function Readable(options) {
		Duplex = Duplex || require__stream_duplex();
		if (!(this instanceof Readable)) return new Readable(options);
		this._readableState = new ReadableState(options, this);
		this.readable = true;
		if (options) {
			if (typeof options.read === "function") this._read = options.read;
			if (typeof options.destroy === "function") this._destroy = options.destroy;
		}
		Stream.call(this);
	}
	Object.defineProperty(Readable.prototype, "destroyed", {
		get: function() {
			if (this._readableState === void 0) return false;
			return this._readableState.destroyed;
		},
		set: function(value) {
			if (!this._readableState) return;
			this._readableState.destroyed = value;
		}
	});
	Readable.prototype.destroy = destroyImpl.destroy;
	Readable.prototype._undestroy = destroyImpl.undestroy;
	Readable.prototype._destroy = function(err, cb) {
		this.push(null);
		cb(err);
	};
	Readable.prototype.push = function(chunk, encoding) {
		var state = this._readableState;
		var skipChunkCheck;
		if (!state.objectMode) {
			if (typeof chunk === "string") {
				encoding = encoding || state.defaultEncoding;
				if (encoding !== state.encoding) {
					chunk = Buffer.from(chunk, encoding);
					encoding = "";
				}
				skipChunkCheck = true;
			}
		} else skipChunkCheck = true;
		return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
	};
	Readable.prototype.unshift = function(chunk) {
		return readableAddChunk(this, chunk, null, true, false);
	};
	function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
		var state = stream._readableState;
		if (chunk === null) {
			state.reading = false;
			onEofChunk(stream, state);
		} else {
			var er;
			if (!skipChunkCheck) er = chunkInvalid(state, chunk);
			if (er) stream.emit("error", er);
			else if (state.objectMode || chunk && chunk.length > 0) {
				if (typeof chunk !== "string" && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) chunk = _uint8ArrayToBuffer(chunk);
				if (addToFront) if (state.endEmitted) stream.emit("error", /* @__PURE__ */ new Error("stream.unshift() after end event"));
				else addChunk(stream, state, chunk, true);
				else if (state.ended) stream.emit("error", /* @__PURE__ */ new Error("stream.push() after EOF"));
				else {
					state.reading = false;
					if (state.decoder && !encoding) {
						chunk = state.decoder.write(chunk);
						if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);
						else maybeReadMore(stream, state);
					} else addChunk(stream, state, chunk, false);
				}
			} else if (!addToFront) state.reading = false;
		}
		return needMoreData(state);
	}
	function addChunk(stream, state, chunk, addToFront) {
		if (state.flowing && state.length === 0 && !state.sync) {
			stream.emit("data", chunk);
			stream.read(0);
		} else {
			state.length += state.objectMode ? 1 : chunk.length;
			if (addToFront) state.buffer.unshift(chunk);
			else state.buffer.push(chunk);
			if (state.needReadable) emitReadable(stream);
		}
		maybeReadMore(stream, state);
	}
	function chunkInvalid(state, chunk) {
		var er;
		if (!_isUint8Array(chunk) && typeof chunk !== "string" && chunk !== void 0 && !state.objectMode) er = /* @__PURE__ */ new TypeError("Invalid non-string/buffer chunk");
		return er;
	}
	function needMoreData(state) {
		return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
	}
	Readable.prototype.isPaused = function() {
		return this._readableState.flowing === false;
	};
	Readable.prototype.setEncoding = function(enc) {
		if (!StringDecoder) StringDecoder = require_string_decoder().StringDecoder;
		this._readableState.decoder = new StringDecoder(enc);
		this._readableState.encoding = enc;
		return this;
	};
	var MAX_HWM = 8388608;
	function computeNewHighWaterMark(n) {
		if (n >= MAX_HWM) n = MAX_HWM;
		else {
			n--;
			n |= n >>> 1;
			n |= n >>> 2;
			n |= n >>> 4;
			n |= n >>> 8;
			n |= n >>> 16;
			n++;
		}
		return n;
	}
	function howMuchToRead(n, state) {
		if (n <= 0 || state.length === 0 && state.ended) return 0;
		if (state.objectMode) return 1;
		if (n !== n) if (state.flowing && state.length) return state.buffer.head.data.length;
		else return state.length;
		if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
		if (n <= state.length) return n;
		if (!state.ended) {
			state.needReadable = true;
			return 0;
		}
		return state.length;
	}
	Readable.prototype.read = function(n) {
		debug("read", n);
		n = parseInt(n, 10);
		var state = this._readableState;
		var nOrig = n;
		if (n !== 0) state.emittedReadable = false;
		if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
			debug("read: emitReadable", state.length, state.ended);
			if (state.length === 0 && state.ended) endReadable(this);
			else emitReadable(this);
			return null;
		}
		n = howMuchToRead(n, state);
		if (n === 0 && state.ended) {
			if (state.length === 0) endReadable(this);
			return null;
		}
		var doRead = state.needReadable;
		debug("need readable", doRead);
		if (state.length === 0 || state.length - n < state.highWaterMark) {
			doRead = true;
			debug("length less than watermark", doRead);
		}
		if (state.ended || state.reading) {
			doRead = false;
			debug("reading or ended", doRead);
		} else if (doRead) {
			debug("do read");
			state.reading = true;
			state.sync = true;
			if (state.length === 0) state.needReadable = true;
			this._read(state.highWaterMark);
			state.sync = false;
			if (!state.reading) n = howMuchToRead(nOrig, state);
		}
		var ret;
		if (n > 0) ret = fromList(n, state);
		else ret = null;
		if (ret === null) {
			state.needReadable = true;
			n = 0;
		} else state.length -= n;
		if (state.length === 0) {
			if (!state.ended) state.needReadable = true;
			if (nOrig !== n && state.ended) endReadable(this);
		}
		if (ret !== null) this.emit("data", ret);
		return ret;
	};
	function onEofChunk(stream, state) {
		if (state.ended) return;
		if (state.decoder) {
			var chunk = state.decoder.end();
			if (chunk && chunk.length) {
				state.buffer.push(chunk);
				state.length += state.objectMode ? 1 : chunk.length;
			}
		}
		state.ended = true;
		emitReadable(stream);
	}
	function emitReadable(stream) {
		var state = stream._readableState;
		state.needReadable = false;
		if (!state.emittedReadable) {
			debug("emitReadable", state.flowing);
			state.emittedReadable = true;
			if (state.sync) pna.nextTick(emitReadable_, stream);
			else emitReadable_(stream);
		}
	}
	function emitReadable_(stream) {
		debug("emit readable");
		stream.emit("readable");
		flow(stream);
	}
	function maybeReadMore(stream, state) {
		if (!state.readingMore) {
			state.readingMore = true;
			pna.nextTick(maybeReadMore_, stream, state);
		}
	}
	function maybeReadMore_(stream, state) {
		var len = state.length;
		while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
			debug("maybeReadMore read 0");
			stream.read(0);
			if (len === state.length) break;
			else len = state.length;
		}
		state.readingMore = false;
	}
	Readable.prototype._read = function(n) {
		this.emit("error", /* @__PURE__ */ new Error("_read() is not implemented"));
	};
	Readable.prototype.pipe = function(dest, pipeOpts) {
		var src = this;
		var state = this._readableState;
		switch (state.pipesCount) {
			case 0:
				state.pipes = dest;
				break;
			case 1:
				state.pipes = [state.pipes, dest];
				break;
			default:
				state.pipes.push(dest);
				break;
		}
		state.pipesCount += 1;
		debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
		var endFn = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr ? onend : unpipe;
		if (state.endEmitted) pna.nextTick(endFn);
		else src.once("end", endFn);
		dest.on("unpipe", onunpipe);
		function onunpipe(readable, unpipeInfo) {
			debug("onunpipe");
			if (readable === src) {
				if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
					unpipeInfo.hasUnpiped = true;
					cleanup();
				}
			}
		}
		function onend() {
			debug("onend");
			dest.end();
		}
		var ondrain = pipeOnDrain(src);
		dest.on("drain", ondrain);
		var cleanedUp = false;
		function cleanup() {
			debug("cleanup");
			dest.removeListener("close", onclose);
			dest.removeListener("finish", onfinish);
			dest.removeListener("drain", ondrain);
			dest.removeListener("error", onerror);
			dest.removeListener("unpipe", onunpipe);
			src.removeListener("end", onend);
			src.removeListener("end", unpipe);
			src.removeListener("data", ondata);
			cleanedUp = true;
			if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
		}
		var increasedAwaitDrain = false;
		src.on("data", ondata);
		function ondata(chunk) {
			debug("ondata");
			increasedAwaitDrain = false;
			if (false === dest.write(chunk) && !increasedAwaitDrain) {
				if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
					debug("false write response, pause", state.awaitDrain);
					state.awaitDrain++;
					increasedAwaitDrain = true;
				}
				src.pause();
			}
		}
		function onerror(er) {
			debug("onerror", er);
			unpipe();
			dest.removeListener("error", onerror);
			if (EElistenerCount(dest, "error") === 0) dest.emit("error", er);
		}
		prependListener(dest, "error", onerror);
		function onclose() {
			dest.removeListener("finish", onfinish);
			unpipe();
		}
		dest.once("close", onclose);
		function onfinish() {
			debug("onfinish");
			dest.removeListener("close", onclose);
			unpipe();
		}
		dest.once("finish", onfinish);
		function unpipe() {
			debug("unpipe");
			src.unpipe(dest);
		}
		dest.emit("pipe", src);
		if (!state.flowing) {
			debug("pipe resume");
			src.resume();
		}
		return dest;
	};
	function pipeOnDrain(src) {
		return function() {
			var state = src._readableState;
			debug("pipeOnDrain", state.awaitDrain);
			if (state.awaitDrain) state.awaitDrain--;
			if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
				state.flowing = true;
				flow(src);
			}
		};
	}
	Readable.prototype.unpipe = function(dest) {
		var state = this._readableState;
		var unpipeInfo = { hasUnpiped: false };
		if (state.pipesCount === 0) return this;
		if (state.pipesCount === 1) {
			if (dest && dest !== state.pipes) return this;
			if (!dest) dest = state.pipes;
			state.pipes = null;
			state.pipesCount = 0;
			state.flowing = false;
			if (dest) dest.emit("unpipe", this, unpipeInfo);
			return this;
		}
		if (!dest) {
			var dests = state.pipes;
			var len = state.pipesCount;
			state.pipes = null;
			state.pipesCount = 0;
			state.flowing = false;
			for (var i = 0; i < len; i++) dests[i].emit("unpipe", this, { hasUnpiped: false });
			return this;
		}
		var index = indexOf(state.pipes, dest);
		if (index === -1) return this;
		state.pipes.splice(index, 1);
		state.pipesCount -= 1;
		if (state.pipesCount === 1) state.pipes = state.pipes[0];
		dest.emit("unpipe", this, unpipeInfo);
		return this;
	};
	Readable.prototype.on = function(ev, fn) {
		var res = Stream.prototype.on.call(this, ev, fn);
		if (ev === "data") {
			if (this._readableState.flowing !== false) this.resume();
		} else if (ev === "readable") {
			var state = this._readableState;
			if (!state.endEmitted && !state.readableListening) {
				state.readableListening = state.needReadable = true;
				state.emittedReadable = false;
				if (!state.reading) pna.nextTick(nReadingNextTick, this);
				else if (state.length) emitReadable(this);
			}
		}
		return res;
	};
	Readable.prototype.addListener = Readable.prototype.on;
	function nReadingNextTick(self) {
		debug("readable nexttick read 0");
		self.read(0);
	}
	Readable.prototype.resume = function() {
		var state = this._readableState;
		if (!state.flowing) {
			debug("resume");
			state.flowing = true;
			resume(this, state);
		}
		return this;
	};
	function resume(stream, state) {
		if (!state.resumeScheduled) {
			state.resumeScheduled = true;
			pna.nextTick(resume_, stream, state);
		}
	}
	function resume_(stream, state) {
		if (!state.reading) {
			debug("resume read 0");
			stream.read(0);
		}
		state.resumeScheduled = false;
		state.awaitDrain = 0;
		stream.emit("resume");
		flow(stream);
		if (state.flowing && !state.reading) stream.read(0);
	}
	Readable.prototype.pause = function() {
		debug("call pause flowing=%j", this._readableState.flowing);
		if (false !== this._readableState.flowing) {
			debug("pause");
			this._readableState.flowing = false;
			this.emit("pause");
		}
		return this;
	};
	function flow(stream) {
		var state = stream._readableState;
		debug("flow", state.flowing);
		while (state.flowing && stream.read() !== null);
	}
	Readable.prototype.wrap = function(stream) {
		var _this = this;
		var state = this._readableState;
		var paused = false;
		stream.on("end", function() {
			debug("wrapped end");
			if (state.decoder && !state.ended) {
				var chunk = state.decoder.end();
				if (chunk && chunk.length) _this.push(chunk);
			}
			_this.push(null);
		});
		stream.on("data", function(chunk) {
			debug("wrapped data");
			if (state.decoder) chunk = state.decoder.write(chunk);
			if (state.objectMode && (chunk === null || chunk === void 0)) return;
			else if (!state.objectMode && (!chunk || !chunk.length)) return;
			if (!_this.push(chunk)) {
				paused = true;
				stream.pause();
			}
		});
		for (var i in stream) if (this[i] === void 0 && typeof stream[i] === "function") this[i] = function(method) {
			return function() {
				return stream[method].apply(stream, arguments);
			};
		}(i);
		for (var n = 0; n < kProxyEvents.length; n++) stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
		this._read = function(n) {
			debug("wrapped _read", n);
			if (paused) {
				paused = false;
				stream.resume();
			}
		};
		return this;
	};
	Object.defineProperty(Readable.prototype, "readableHighWaterMark", {
		enumerable: false,
		get: function() {
			return this._readableState.highWaterMark;
		}
	});
	Readable._fromList = fromList;
	function fromList(n, state) {
		if (state.length === 0) return null;
		var ret;
		if (state.objectMode) ret = state.buffer.shift();
		else if (!n || n >= state.length) {
			if (state.decoder) ret = state.buffer.join("");
			else if (state.buffer.length === 1) ret = state.buffer.head.data;
			else ret = state.buffer.concat(state.length);
			state.buffer.clear();
		} else ret = fromListPartial(n, state.buffer, state.decoder);
		return ret;
	}
	function fromListPartial(n, list, hasStrings) {
		var ret;
		if (n < list.head.data.length) {
			ret = list.head.data.slice(0, n);
			list.head.data = list.head.data.slice(n);
		} else if (n === list.head.data.length) ret = list.shift();
		else ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
		return ret;
	}
	function copyFromBufferString(n, list) {
		var p = list.head;
		var c = 1;
		var ret = p.data;
		n -= ret.length;
		while (p = p.next) {
			var str = p.data;
			var nb = n > str.length ? str.length : n;
			if (nb === str.length) ret += str;
			else ret += str.slice(0, n);
			n -= nb;
			if (n === 0) {
				if (nb === str.length) {
					++c;
					if (p.next) list.head = p.next;
					else list.head = list.tail = null;
				} else {
					list.head = p;
					p.data = str.slice(nb);
				}
				break;
			}
			++c;
		}
		list.length -= c;
		return ret;
	}
	function copyFromBuffer(n, list) {
		var ret = Buffer.allocUnsafe(n);
		var p = list.head;
		var c = 1;
		p.data.copy(ret);
		n -= p.data.length;
		while (p = p.next) {
			var buf = p.data;
			var nb = n > buf.length ? buf.length : n;
			buf.copy(ret, ret.length - n, 0, nb);
			n -= nb;
			if (n === 0) {
				if (nb === buf.length) {
					++c;
					if (p.next) list.head = p.next;
					else list.head = list.tail = null;
				} else {
					list.head = p;
					p.data = buf.slice(nb);
				}
				break;
			}
			++c;
		}
		list.length -= c;
		return ret;
	}
	function endReadable(stream) {
		var state = stream._readableState;
		if (state.length > 0) throw new Error("\"endReadable()\" called on non-empty stream");
		if (!state.endEmitted) {
			state.ended = true;
			pna.nextTick(endReadableNT, state, stream);
		}
	}
	function endReadableNT(state, stream) {
		if (!state.endEmitted && state.length === 0) {
			state.endEmitted = true;
			stream.readable = false;
			stream.emit("end");
		}
	}
	function indexOf(xs, x) {
		for (var i = 0, l = xs.length; i < l; i++) if (xs[i] === x) return i;
		return -1;
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_transform.js
var require__stream_transform = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = Transform;
	var Duplex = require__stream_duplex();
	var util = Object.create(require_util());
	util.inherits = require_inherits();
	util.inherits(Transform, Duplex);
	function afterTransform(er, data) {
		var ts = this._transformState;
		ts.transforming = false;
		var cb = ts.writecb;
		if (!cb) return this.emit("error", /* @__PURE__ */ new Error("write callback called multiple times"));
		ts.writechunk = null;
		ts.writecb = null;
		if (data != null) this.push(data);
		cb(er);
		var rs = this._readableState;
		rs.reading = false;
		if (rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
	}
	function Transform(options) {
		if (!(this instanceof Transform)) return new Transform(options);
		Duplex.call(this, options);
		this._transformState = {
			afterTransform: afterTransform.bind(this),
			needTransform: false,
			transforming: false,
			writecb: null,
			writechunk: null,
			writeencoding: null
		};
		this._readableState.needReadable = true;
		this._readableState.sync = false;
		if (options) {
			if (typeof options.transform === "function") this._transform = options.transform;
			if (typeof options.flush === "function") this._flush = options.flush;
		}
		this.on("prefinish", prefinish);
	}
	function prefinish() {
		var _this = this;
		if (typeof this._flush === "function") this._flush(function(er, data) {
			done(_this, er, data);
		});
		else done(this, null, null);
	}
	Transform.prototype.push = function(chunk, encoding) {
		this._transformState.needTransform = false;
		return Duplex.prototype.push.call(this, chunk, encoding);
	};
	Transform.prototype._transform = function(chunk, encoding, cb) {
		throw new Error("_transform() is not implemented");
	};
	Transform.prototype._write = function(chunk, encoding, cb) {
		var ts = this._transformState;
		ts.writecb = cb;
		ts.writechunk = chunk;
		ts.writeencoding = encoding;
		if (!ts.transforming) {
			var rs = this._readableState;
			if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
		}
	};
	Transform.prototype._read = function(n) {
		var ts = this._transformState;
		if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
			ts.transforming = true;
			this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
		} else ts.needTransform = true;
	};
	Transform.prototype._destroy = function(err, cb) {
		var _this2 = this;
		Duplex.prototype._destroy.call(this, err, function(err2) {
			cb(err2);
			_this2.emit("close");
		});
	};
	function done(stream, er, data) {
		if (er) return stream.emit("error", er);
		if (data != null) stream.push(data);
		if (stream._writableState.length) throw new Error("Calling transform done when ws.length != 0");
		if (stream._transformState.transforming) throw new Error("Calling transform done when still transforming");
		return stream.push(null);
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/lib/_stream_passthrough.js
var require__stream_passthrough = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = PassThrough;
	var Transform = require__stream_transform();
	var util = Object.create(require_util());
	util.inherits = require_inherits();
	util.inherits(PassThrough, Transform);
	function PassThrough(options) {
		if (!(this instanceof PassThrough)) return new PassThrough(options);
		Transform.call(this, options);
	}
	PassThrough.prototype._transform = function(chunk, encoding, cb) {
		cb(null, chunk);
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/readable-stream@2.3.8/node_modules/readable-stream/readable.js
var require_readable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Stream = __require("node:stream");
	if (process.env.READABLE_STREAM === "disable" && Stream) {
		module.exports = Stream;
		exports = module.exports = Stream.Readable;
		exports.Readable = Stream.Readable;
		exports.Writable = Stream.Writable;
		exports.Duplex = Stream.Duplex;
		exports.Transform = Stream.Transform;
		exports.PassThrough = Stream.PassThrough;
		exports.Stream = Stream;
	} else {
		exports = module.exports = require__stream_readable();
		exports.Stream = Stream || exports;
		exports.Readable = exports;
		exports.Writable = require__stream_writable();
		exports.Duplex = require__stream_duplex();
		exports.Transform = require__stream_transform();
		exports.PassThrough = require__stream_passthrough();
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/support.js
var require_support = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.base64 = true;
	exports.array = true;
	exports.string = true;
	exports.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
	exports.nodebuffer = typeof Buffer !== "undefined";
	exports.uint8array = typeof Uint8Array !== "undefined";
	if (typeof ArrayBuffer === "undefined") exports.blob = false;
	else {
		var buffer = /* @__PURE__ */ new ArrayBuffer(0);
		try {
			exports.blob = new Blob([buffer], { type: "application/zip" }).size === 0;
		} catch (e) {
			try {
				var builder = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
				builder.append(buffer);
				exports.blob = builder.getBlob("application/zip").size === 0;
			} catch (e) {
				exports.blob = false;
			}
		}
	}
	try {
		exports.nodestream = !!require_readable().Readable;
	} catch (e) {
		exports.nodestream = false;
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/base64.js
var require_base64 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_utils();
	var support = require_support();
	var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	exports.encode = function(input) {
		var output = [];
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0, len = input.length, remainingBytes = len;
		var isArray = utils.getTypeOf(input) !== "string";
		while (i < input.length) {
			remainingBytes = len - i;
			if (!isArray) {
				chr1 = input.charCodeAt(i++);
				chr2 = i < len ? input.charCodeAt(i++) : 0;
				chr3 = i < len ? input.charCodeAt(i++) : 0;
			} else {
				chr1 = input[i++];
				chr2 = i < len ? input[i++] : 0;
				chr3 = i < len ? input[i++] : 0;
			}
			enc1 = chr1 >> 2;
			enc2 = (chr1 & 3) << 4 | chr2 >> 4;
			enc3 = remainingBytes > 1 ? (chr2 & 15) << 2 | chr3 >> 6 : 64;
			enc4 = remainingBytes > 2 ? chr3 & 63 : 64;
			output.push(_keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4));
		}
		return output.join("");
	};
	exports.decode = function(input) {
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0, resultIndex = 0;
		var dataUrlPrefix = "data:";
		if (input.substr(0, dataUrlPrefix.length) === dataUrlPrefix) throw new Error("Invalid base64 input, it looks like a data url.");
		input = input.replace(/[^A-Za-z0-9+/=]/g, "");
		var totalLength = input.length * 3 / 4;
		if (input.charAt(input.length - 1) === _keyStr.charAt(64)) totalLength--;
		if (input.charAt(input.length - 2) === _keyStr.charAt(64)) totalLength--;
		if (totalLength % 1 !== 0) throw new Error("Invalid base64 input, bad content length.");
		var output;
		if (support.uint8array) output = new Uint8Array(totalLength | 0);
		else output = new Array(totalLength | 0);
		while (i < input.length) {
			enc1 = _keyStr.indexOf(input.charAt(i++));
			enc2 = _keyStr.indexOf(input.charAt(i++));
			enc3 = _keyStr.indexOf(input.charAt(i++));
			enc4 = _keyStr.indexOf(input.charAt(i++));
			chr1 = enc1 << 2 | enc2 >> 4;
			chr2 = (enc2 & 15) << 4 | enc3 >> 2;
			chr3 = (enc3 & 3) << 6 | enc4;
			output[resultIndex++] = chr1;
			if (enc3 !== 64) output[resultIndex++] = chr2;
			if (enc4 !== 64) output[resultIndex++] = chr3;
		}
		return output;
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/nodejsUtils.js
var require_nodejsUtils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		isNode: typeof Buffer !== "undefined",
		newBufferFrom: function(data, encoding) {
			if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(data, encoding);
			else {
				if (typeof data === "number") throw new Error("The \"data\" argument must not be a number");
				return new Buffer(data, encoding);
			}
		},
		allocBuffer: function(size) {
			if (Buffer.alloc) return Buffer.alloc(size);
			else {
				var buf = new Buffer(size);
				buf.fill(0);
				return buf;
			}
		},
		isBuffer: function(b) {
			return Buffer.isBuffer(b);
		},
		isStream: function(obj) {
			return obj && typeof obj.on === "function" && typeof obj.pause === "function" && typeof obj.resume === "function";
		}
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/immediate@3.0.6/node_modules/immediate/lib/index.js
var require_lib$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Mutation = global.MutationObserver || global.WebKitMutationObserver;
	var scheduleDrain;
	if (process.browser) if (Mutation) {
		var called = 0;
		var observer = new Mutation(nextTick);
		var element = global.document.createTextNode("");
		observer.observe(element, { characterData: true });
		scheduleDrain = function() {
			element.data = called = ++called % 2;
		};
	} else if (!global.setImmediate && typeof global.MessageChannel !== "undefined") {
		var channel = new global.MessageChannel();
		channel.port1.onmessage = nextTick;
		scheduleDrain = function() {
			channel.port2.postMessage(0);
		};
	} else if ("document" in global && "onreadystatechange" in global.document.createElement("script")) scheduleDrain = function() {
		var scriptEl = global.document.createElement("script");
		scriptEl.onreadystatechange = function() {
			nextTick();
			scriptEl.onreadystatechange = null;
			scriptEl.parentNode.removeChild(scriptEl);
			scriptEl = null;
		};
		global.document.documentElement.appendChild(scriptEl);
	};
	else scheduleDrain = function() {
		setTimeout(nextTick, 0);
	};
	else scheduleDrain = function() {
		process.nextTick(nextTick);
	};
	var draining;
	var queue = [];
	function nextTick() {
		draining = true;
		var i, oldQueue;
		var len = queue.length;
		while (len) {
			oldQueue = queue;
			queue = [];
			i = -1;
			while (++i < len) oldQueue[i]();
			len = queue.length;
		}
		draining = false;
	}
	module.exports = immediate;
	function immediate(task) {
		if (queue.push(task) === 1 && !draining) scheduleDrain();
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/lie@3.3.0/node_modules/lie/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var immediate = require_lib$2();
	/* istanbul ignore next */
	function INTERNAL() {}
	var handlers = {};
	var REJECTED = ["REJECTED"];
	var FULFILLED = ["FULFILLED"];
	var PENDING = ["PENDING"];
	/* istanbul ignore else */
	if (!process.browser) var UNHANDLED = ["UNHANDLED"];
	module.exports = Promise;
	function Promise(resolver) {
		if (typeof resolver !== "function") throw new TypeError("resolver must be a function");
		this.state = PENDING;
		this.queue = [];
		this.outcome = void 0;
		/* istanbul ignore else */
		if (!process.browser) this.handled = UNHANDLED;
		if (resolver !== INTERNAL) safelyResolveThenable(this, resolver);
	}
	Promise.prototype.finally = function(callback) {
		if (typeof callback !== "function") return this;
		var p = this.constructor;
		return this.then(resolve, reject);
		function resolve(value) {
			function yes() {
				return value;
			}
			return p.resolve(callback()).then(yes);
		}
		function reject(reason) {
			function no() {
				throw reason;
			}
			return p.resolve(callback()).then(no);
		}
	};
	Promise.prototype.catch = function(onRejected) {
		return this.then(null, onRejected);
	};
	Promise.prototype.then = function(onFulfilled, onRejected) {
		if (typeof onFulfilled !== "function" && this.state === FULFILLED || typeof onRejected !== "function" && this.state === REJECTED) return this;
		var promise = new this.constructor(INTERNAL);
		/* istanbul ignore else */
		if (!process.browser) {
			if (this.handled === UNHANDLED) this.handled = null;
		}
		if (this.state !== PENDING) unwrap(promise, this.state === FULFILLED ? onFulfilled : onRejected, this.outcome);
		else this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
		return promise;
	};
	function QueueItem(promise, onFulfilled, onRejected) {
		this.promise = promise;
		if (typeof onFulfilled === "function") {
			this.onFulfilled = onFulfilled;
			this.callFulfilled = this.otherCallFulfilled;
		}
		if (typeof onRejected === "function") {
			this.onRejected = onRejected;
			this.callRejected = this.otherCallRejected;
		}
	}
	QueueItem.prototype.callFulfilled = function(value) {
		handlers.resolve(this.promise, value);
	};
	QueueItem.prototype.otherCallFulfilled = function(value) {
		unwrap(this.promise, this.onFulfilled, value);
	};
	QueueItem.prototype.callRejected = function(value) {
		handlers.reject(this.promise, value);
	};
	QueueItem.prototype.otherCallRejected = function(value) {
		unwrap(this.promise, this.onRejected, value);
	};
	function unwrap(promise, func, value) {
		immediate(function() {
			var returnValue;
			try {
				returnValue = func(value);
			} catch (e) {
				return handlers.reject(promise, e);
			}
			if (returnValue === promise) handlers.reject(promise, /* @__PURE__ */ new TypeError("Cannot resolve promise with itself"));
			else handlers.resolve(promise, returnValue);
		});
	}
	handlers.resolve = function(self, value) {
		var result = tryCatch(getThen, value);
		if (result.status === "error") return handlers.reject(self, result.value);
		var thenable = result.value;
		if (thenable) safelyResolveThenable(self, thenable);
		else {
			self.state = FULFILLED;
			self.outcome = value;
			var i = -1;
			var len = self.queue.length;
			while (++i < len) self.queue[i].callFulfilled(value);
		}
		return self;
	};
	handlers.reject = function(self, error) {
		self.state = REJECTED;
		self.outcome = error;
		/* istanbul ignore else */
		if (!process.browser) {
			if (self.handled === UNHANDLED) immediate(function() {
				if (self.handled === UNHANDLED) process.emit("unhandledRejection", error, self);
			});
		}
		var i = -1;
		var len = self.queue.length;
		while (++i < len) self.queue[i].callRejected(error);
		return self;
	};
	function getThen(obj) {
		var then = obj && obj.then;
		if (obj && (typeof obj === "object" || typeof obj === "function") && typeof then === "function") return function appyThen() {
			then.apply(obj, arguments);
		};
	}
	function safelyResolveThenable(self, thenable) {
		var called = false;
		function onError(value) {
			if (called) return;
			called = true;
			handlers.reject(self, value);
		}
		function onSuccess(value) {
			if (called) return;
			called = true;
			handlers.resolve(self, value);
		}
		function tryToUnwrap() {
			thenable(onSuccess, onError);
		}
		var result = tryCatch(tryToUnwrap);
		if (result.status === "error") onError(result.value);
	}
	function tryCatch(func, value) {
		var out = {};
		try {
			out.value = func(value);
			out.status = "success";
		} catch (e) {
			out.status = "error";
			out.value = e;
		}
		return out;
	}
	Promise.resolve = resolve;
	function resolve(value) {
		if (value instanceof this) return value;
		return handlers.resolve(new this(INTERNAL), value);
	}
	Promise.reject = reject;
	function reject(reason) {
		var promise = new this(INTERNAL);
		return handlers.reject(promise, reason);
	}
	Promise.all = all;
	function all(iterable) {
		var self = this;
		if (Object.prototype.toString.call(iterable) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
		var len = iterable.length;
		var called = false;
		if (!len) return this.resolve([]);
		var values = new Array(len);
		var resolved = 0;
		var i = -1;
		var promise = new this(INTERNAL);
		while (++i < len) allResolver(iterable[i], i);
		return promise;
		function allResolver(value, i) {
			self.resolve(value).then(resolveFromAll, function(error) {
				if (!called) {
					called = true;
					handlers.reject(promise, error);
				}
			});
			function resolveFromAll(outValue) {
				values[i] = outValue;
				if (++resolved === len && !called) {
					called = true;
					handlers.resolve(promise, values);
				}
			}
		}
	}
	Promise.race = race;
	function race(iterable) {
		var self = this;
		if (Object.prototype.toString.call(iterable) !== "[object Array]") return this.reject(/* @__PURE__ */ new TypeError("must be an array"));
		var len = iterable.length;
		var called = false;
		if (!len) return this.resolve([]);
		var i = -1;
		var promise = new this(INTERNAL);
		while (++i < len) resolver(iterable[i]);
		return promise;
		function resolver(value) {
			self.resolve(value).then(function(response) {
				if (!called) {
					called = true;
					handlers.resolve(promise, response);
				}
			}, function(error) {
				if (!called) {
					called = true;
					handlers.reject(promise, error);
				}
			});
		}
	}
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/external.js
var require_external = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ES6Promise = null;
	if (typeof Promise !== "undefined") ES6Promise = Promise;
	else ES6Promise = require_lib$1();
	/**
	* Let the user use/change some implementations.
	*/
	module.exports = { Promise: ES6Promise };
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/setimmediate@1.0.5/node_modules/setimmediate/setImmediate.js
var require_setImmediate = /* @__PURE__ */ __commonJSMin((() => {
	(function(global, undefined) {
		"use strict";
		if (global.setImmediate) return;
		var nextHandle = 1;
		var tasksByHandle = {};
		var currentlyRunningATask = false;
		var doc = global.document;
		var registerImmediate;
		function setImmediate(callback) {
			if (typeof callback !== "function") callback = new Function("" + callback);
			var args = new Array(arguments.length - 1);
			for (var i = 0; i < args.length; i++) args[i] = arguments[i + 1];
			tasksByHandle[nextHandle] = {
				callback,
				args
			};
			registerImmediate(nextHandle);
			return nextHandle++;
		}
		function clearImmediate(handle) {
			delete tasksByHandle[handle];
		}
		function run(task) {
			var callback = task.callback;
			var args = task.args;
			switch (args.length) {
				case 0:
					callback();
					break;
				case 1:
					callback(args[0]);
					break;
				case 2:
					callback(args[0], args[1]);
					break;
				case 3:
					callback(args[0], args[1], args[2]);
					break;
				default:
					callback.apply(undefined, args);
					break;
			}
		}
		function runIfPresent(handle) {
			if (currentlyRunningATask) setTimeout(runIfPresent, 0, handle);
			else {
				var task = tasksByHandle[handle];
				if (task) {
					currentlyRunningATask = true;
					try {
						run(task);
					} finally {
						clearImmediate(handle);
						currentlyRunningATask = false;
					}
				}
			}
		}
		function installNextTickImplementation() {
			registerImmediate = function(handle) {
				process.nextTick(function() {
					runIfPresent(handle);
				});
			};
		}
		function canUsePostMessage() {
			if (global.postMessage && !global.importScripts) {
				var postMessageIsAsynchronous = true;
				var oldOnMessage = global.onmessage;
				global.onmessage = function() {
					postMessageIsAsynchronous = false;
				};
				global.postMessage("", "*");
				global.onmessage = oldOnMessage;
				return postMessageIsAsynchronous;
			}
		}
		function installPostMessageImplementation() {
			var messagePrefix = "setImmediate$" + Math.random() + "$";
			var onGlobalMessage = function(event) {
				if (event.source === global && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) runIfPresent(+event.data.slice(messagePrefix.length));
			};
			if (global.addEventListener) global.addEventListener("message", onGlobalMessage, false);
			else global.attachEvent("onmessage", onGlobalMessage);
			registerImmediate = function(handle) {
				global.postMessage(messagePrefix + handle, "*");
			};
		}
		function installMessageChannelImplementation() {
			var channel = new MessageChannel();
			channel.port1.onmessage = function(event) {
				var handle = event.data;
				runIfPresent(handle);
			};
			registerImmediate = function(handle) {
				channel.port2.postMessage(handle);
			};
		}
		function installReadyStateChangeImplementation() {
			var html = doc.documentElement;
			registerImmediate = function(handle) {
				var script = doc.createElement("script");
				script.onreadystatechange = function() {
					runIfPresent(handle);
					script.onreadystatechange = null;
					html.removeChild(script);
					script = null;
				};
				html.appendChild(script);
			};
		}
		function installSetTimeoutImplementation() {
			registerImmediate = function(handle) {
				setTimeout(runIfPresent, 0, handle);
			};
		}
		var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
		attachTo = attachTo && attachTo.setTimeout ? attachTo : global;
		if ({}.toString.call(global.process) === "[object process]") installNextTickImplementation();
		else if (canUsePostMessage()) installPostMessageImplementation();
		else if (global.MessageChannel) installMessageChannelImplementation();
		else if (doc && "onreadystatechange" in doc.createElement("script")) installReadyStateChangeImplementation();
		else installSetTimeoutImplementation();
		attachTo.setImmediate = setImmediate;
		attachTo.clearImmediate = clearImmediate;
	})(typeof self === "undefined" ? typeof global === "undefined" ? exports : global : self);
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	var support = require_support();
	var base64 = require_base64();
	var nodejsUtils = require_nodejsUtils();
	var external = require_external();
	require_setImmediate();
	/**
	* Convert a string that pass as a "binary string": it should represent a byte
	* array but may have > 255 char codes. Be sure to take only the first byte
	* and returns the byte array.
	* @param {String} str the string to transform.
	* @return {Array|Uint8Array} the string in a binary format.
	*/
	function string2binary(str) {
		var result = null;
		if (support.uint8array) result = new Uint8Array(str.length);
		else result = new Array(str.length);
		return stringToArrayLike(str, result);
	}
	/**
	* Create a new blob with the given content and the given type.
	* @param {String|ArrayBuffer} part the content to put in the blob. DO NOT use
	* an Uint8Array because the stock browser of android 4 won't accept it (it
	* will be silently converted to a string, "[object Uint8Array]").
	*
	* Use only ONE part to build the blob to avoid a memory leak in IE11 / Edge:
	* when a large amount of Array is used to create the Blob, the amount of
	* memory consumed is nearly 100 times the original data amount.
	*
	* @param {String} type the mime type of the blob.
	* @return {Blob} the created blob.
	*/
	exports.newBlob = function(part, type) {
		exports.checkSupport("blob");
		try {
			return new Blob([part], { type });
		} catch (e) {
			try {
				var builder = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
				builder.append(part);
				return builder.getBlob(type);
			} catch (e) {
				throw new Error("Bug : can't construct the Blob.");
			}
		}
	};
	/**
	* The identity function.
	* @param {Object} input the input.
	* @return {Object} the same input.
	*/
	function identity(input) {
		return input;
	}
	/**
	* Fill in an array with a string.
	* @param {String} str the string to use.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
	* @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
	*/
	function stringToArrayLike(str, array) {
		for (var i = 0; i < str.length; ++i) array[i] = str.charCodeAt(i) & 255;
		return array;
	}
	/**
	* An helper for the function arrayLikeToString.
	* This contains static information and functions that
	* can be optimized by the browser JIT compiler.
	*/
	var arrayToStringHelper = {
		stringifyByChunk: function(array, type, chunk) {
			var result = [], k = 0, len = array.length;
			if (len <= chunk) return String.fromCharCode.apply(null, array);
			while (k < len) {
				if (type === "array" || type === "nodebuffer") result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
				else result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
				k += chunk;
			}
			return result.join("");
		},
		stringifyByChar: function(array) {
			var resultStr = "";
			for (var i = 0; i < array.length; i++) resultStr += String.fromCharCode(array[i]);
			return resultStr;
		},
		applyCanBeUsed: {
			uint8array: (function() {
				try {
					return support.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
				} catch (e) {
					return false;
				}
			})(),
			nodebuffer: (function() {
				try {
					return support.nodebuffer && String.fromCharCode.apply(null, nodejsUtils.allocBuffer(1)).length === 1;
				} catch (e) {
					return false;
				}
			})()
		}
	};
	/**
	* Transform an array-like object to a string.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
	* @return {String} the result.
	*/
	function arrayLikeToString(array) {
		var chunk = 65536, type = exports.getTypeOf(array), canUseApply = true;
		if (type === "uint8array") canUseApply = arrayToStringHelper.applyCanBeUsed.uint8array;
		else if (type === "nodebuffer") canUseApply = arrayToStringHelper.applyCanBeUsed.nodebuffer;
		if (canUseApply) while (chunk > 1) try {
			return arrayToStringHelper.stringifyByChunk(array, type, chunk);
		} catch (e) {
			chunk = Math.floor(chunk / 2);
		}
		return arrayToStringHelper.stringifyByChar(array);
	}
	exports.applyFromCharCode = arrayLikeToString;
	/**
	* Copy the data from an array-like to an other array-like.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
	* @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
	* @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
	*/
	function arrayLikeToArrayLike(arrayFrom, arrayTo) {
		for (var i = 0; i < arrayFrom.length; i++) arrayTo[i] = arrayFrom[i];
		return arrayTo;
	}
	var transform = {};
	transform["string"] = {
		"string": identity,
		"array": function(input) {
			return stringToArrayLike(input, new Array(input.length));
		},
		"arraybuffer": function(input) {
			return transform["string"]["uint8array"](input).buffer;
		},
		"uint8array": function(input) {
			return stringToArrayLike(input, new Uint8Array(input.length));
		},
		"nodebuffer": function(input) {
			return stringToArrayLike(input, nodejsUtils.allocBuffer(input.length));
		}
	};
	transform["array"] = {
		"string": arrayLikeToString,
		"array": identity,
		"arraybuffer": function(input) {
			return new Uint8Array(input).buffer;
		},
		"uint8array": function(input) {
			return new Uint8Array(input);
		},
		"nodebuffer": function(input) {
			return nodejsUtils.newBufferFrom(input);
		}
	};
	transform["arraybuffer"] = {
		"string": function(input) {
			return arrayLikeToString(new Uint8Array(input));
		},
		"array": function(input) {
			return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
		},
		"arraybuffer": identity,
		"uint8array": function(input) {
			return new Uint8Array(input);
		},
		"nodebuffer": function(input) {
			return nodejsUtils.newBufferFrom(new Uint8Array(input));
		}
	};
	transform["uint8array"] = {
		"string": arrayLikeToString,
		"array": function(input) {
			return arrayLikeToArrayLike(input, new Array(input.length));
		},
		"arraybuffer": function(input) {
			return input.buffer;
		},
		"uint8array": identity,
		"nodebuffer": function(input) {
			return nodejsUtils.newBufferFrom(input);
		}
	};
	transform["nodebuffer"] = {
		"string": arrayLikeToString,
		"array": function(input) {
			return arrayLikeToArrayLike(input, new Array(input.length));
		},
		"arraybuffer": function(input) {
			return transform["nodebuffer"]["uint8array"](input).buffer;
		},
		"uint8array": function(input) {
			return arrayLikeToArrayLike(input, new Uint8Array(input.length));
		},
		"nodebuffer": identity
	};
	/**
	* Transform an input into any type.
	* The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
	* If no output type is specified, the unmodified input will be returned.
	* @param {String} outputType the output type.
	* @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
	* @throws {Error} an Error if the browser doesn't support the requested output type.
	*/
	exports.transformTo = function(outputType, input) {
		if (!input) input = "";
		if (!outputType) return input;
		exports.checkSupport(outputType);
		return transform[exports.getTypeOf(input)][outputType](input);
	};
	/**
	* Resolve all relative path components, "." and "..", in a path. If these relative components
	* traverse above the root then the resulting path will only contain the final path component.
	*
	* All empty components, e.g. "//", are removed.
	* @param {string} path A path with / or \ separators
	* @returns {string} The path with all relative path components resolved.
	*/
	exports.resolve = function(path) {
		var parts = path.split("/");
		var result = [];
		for (var index = 0; index < parts.length; index++) {
			var part = parts[index];
			if (part === "." || part === "" && index !== 0 && index !== parts.length - 1) continue;
			else if (part === "..") result.pop();
			else result.push(part);
		}
		return result.join("/");
	};
	/**
	* Return the type of the input.
	* The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
	* @param {Object} input the input to identify.
	* @return {String} the (lowercase) type of the input.
	*/
	exports.getTypeOf = function(input) {
		if (typeof input === "string") return "string";
		if (Object.prototype.toString.call(input) === "[object Array]") return "array";
		if (support.nodebuffer && nodejsUtils.isBuffer(input)) return "nodebuffer";
		if (support.uint8array && input instanceof Uint8Array) return "uint8array";
		if (support.arraybuffer && input instanceof ArrayBuffer) return "arraybuffer";
	};
	/**
	* Throw an exception if the type is not supported.
	* @param {String} type the type to check.
	* @throws {Error} an Error if the browser doesn't support the requested type.
	*/
	exports.checkSupport = function(type) {
		if (!support[type.toLowerCase()]) throw new Error(type + " is not supported by this platform");
	};
	exports.MAX_VALUE_16BITS = 65535;
	exports.MAX_VALUE_32BITS = -1;
	/**
	* Prettify a string read as binary.
	* @param {string} str the string to prettify.
	* @return {string} a pretty string.
	*/
	exports.pretty = function(str) {
		var res = "", code, i;
		for (i = 0; i < (str || "").length; i++) {
			code = str.charCodeAt(i);
			res += "\\x" + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
		}
		return res;
	};
	/**
	* Defer the call of a function.
	* @param {Function} callback the function to call asynchronously.
	* @param {Array} args the arguments to give to the callback.
	*/
	exports.delay = function(callback, args, self) {
		setImmediate(function() {
			callback.apply(self || null, args || []);
		});
	};
	/**
	* Extends a prototype with an other, without calling a constructor with
	* side effects. Inspired by nodejs' `utils.inherits`
	* @param {Function} ctor the constructor to augment
	* @param {Function} superCtor the parent constructor to use
	*/
	exports.inherits = function(ctor, superCtor) {
		var Obj = function() {};
		Obj.prototype = superCtor.prototype;
		ctor.prototype = new Obj();
	};
	/**
	* Merge the objects passed as parameters into a new one.
	* @private
	* @param {...Object} var_args All objects to merge.
	* @return {Object} a new object with the data of the others.
	*/
	exports.extend = function() {
		var result = {}, i, attr;
		for (i = 0; i < arguments.length; i++) for (attr in arguments[i]) if (Object.prototype.hasOwnProperty.call(arguments[i], attr) && typeof result[attr] === "undefined") result[attr] = arguments[i][attr];
		return result;
	};
	/**
	* Transform arbitrary content into a Promise.
	* @param {String} name a name for the content being processed.
	* @param {Object} inputData the content to process.
	* @param {Boolean} isBinary true if the content is not an unicode string
	* @param {Boolean} isOptimizedBinaryString true if the string content only has one byte per character.
	* @param {Boolean} isBase64 true if the string content is encoded with base64.
	* @return {Promise} a promise in a format usable by JSZip.
	*/
	exports.prepareContent = function(name, inputData, isBinary, isOptimizedBinaryString, isBase64) {
		return external.Promise.resolve(inputData).then(function(data) {
			if (support.blob && (data instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(data)) !== -1) && typeof FileReader !== "undefined") return new external.Promise(function(resolve, reject) {
				var reader = new FileReader();
				reader.onload = function(e) {
					resolve(e.target.result);
				};
				reader.onerror = function(e) {
					reject(e.target.error);
				};
				reader.readAsArrayBuffer(data);
			});
			else return data;
		}).then(function(data) {
			var dataType = exports.getTypeOf(data);
			if (!dataType) return external.Promise.reject(/* @__PURE__ */ new Error("Can't read the data of '" + name + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
			if (dataType === "arraybuffer") data = exports.transformTo("uint8array", data);
			else if (dataType === "string") {
				if (isBase64) data = base64.decode(data);
				else if (isBinary) {
					if (isOptimizedBinaryString !== true) data = string2binary(data);
				}
			}
			return data;
		});
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/stream/GenericWorker.js
var require_GenericWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* A worker that does nothing but passing chunks to the next one. This is like
	* a nodejs stream but with some differences. On the good side :
	* - it works on IE 6-9 without any issue / polyfill
	* - it weights less than the full dependencies bundled with browserify
	* - it forwards errors (no need to declare an error handler EVERYWHERE)
	*
	* A chunk is an object with 2 attributes : `meta` and `data`. The former is an
	* object containing anything (`percent` for example), see each worker for more
	* details. The latter is the real data (String, Uint8Array, etc).
	*
	* @constructor
	* @param {String} name the name of the stream (mainly used for debugging purposes)
	*/
	function GenericWorker(name) {
		this.name = name || "default";
		this.streamInfo = {};
		this.generatedError = null;
		this.extraStreamInfo = {};
		this.isPaused = true;
		this.isFinished = false;
		this.isLocked = false;
		this._listeners = {
			"data": [],
			"end": [],
			"error": []
		};
		this.previous = null;
	}
	GenericWorker.prototype = {
		push: function(chunk) {
			this.emit("data", chunk);
		},
		end: function() {
			if (this.isFinished) return false;
			this.flush();
			try {
				this.emit("end");
				this.cleanUp();
				this.isFinished = true;
			} catch (e) {
				this.emit("error", e);
			}
			return true;
		},
		error: function(e) {
			if (this.isFinished) return false;
			if (this.isPaused) this.generatedError = e;
			else {
				this.isFinished = true;
				this.emit("error", e);
				if (this.previous) this.previous.error(e);
				this.cleanUp();
			}
			return true;
		},
		on: function(name, listener) {
			this._listeners[name].push(listener);
			return this;
		},
		cleanUp: function() {
			this.streamInfo = this.generatedError = this.extraStreamInfo = null;
			this._listeners = [];
		},
		emit: function(name, arg) {
			if (this._listeners[name]) for (var i = 0; i < this._listeners[name].length; i++) this._listeners[name][i].call(this, arg);
		},
		pipe: function(next) {
			return next.registerPrevious(this);
		},
		registerPrevious: function(previous) {
			if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
			this.streamInfo = previous.streamInfo;
			this.mergeStreamInfo();
			this.previous = previous;
			var self = this;
			previous.on("data", function(chunk) {
				self.processChunk(chunk);
			});
			previous.on("end", function() {
				self.end();
			});
			previous.on("error", function(e) {
				self.error(e);
			});
			return this;
		},
		pause: function() {
			if (this.isPaused || this.isFinished) return false;
			this.isPaused = true;
			if (this.previous) this.previous.pause();
			return true;
		},
		resume: function() {
			if (!this.isPaused || this.isFinished) return false;
			this.isPaused = false;
			var withError = false;
			if (this.generatedError) {
				this.error(this.generatedError);
				withError = true;
			}
			if (this.previous) this.previous.resume();
			return !withError;
		},
		flush: function() {},
		processChunk: function(chunk) {
			this.push(chunk);
		},
		withStreamInfo: function(key, value) {
			this.extraStreamInfo[key] = value;
			this.mergeStreamInfo();
			return this;
		},
		mergeStreamInfo: function() {
			for (var key in this.extraStreamInfo) {
				if (!Object.prototype.hasOwnProperty.call(this.extraStreamInfo, key)) continue;
				this.streamInfo[key] = this.extraStreamInfo[key];
			}
		},
		lock: function() {
			if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
			this.isLocked = true;
			if (this.previous) this.previous.lock();
		},
		toString: function() {
			var me = "Worker " + this.name;
			if (this.previous) return this.previous + " -> " + me;
			else return me;
		}
	};
	module.exports = GenericWorker;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/utf8.js
var require_utf8 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_utils();
	var support = require_support();
	var nodejsUtils = require_nodejsUtils();
	var GenericWorker = require_GenericWorker();
	/**
	* The following functions come from pako, from pako/lib/utils/strings
	* released under the MIT license, see pako https://github.com/nodeca/pako/
	*/
	var _utf8len = new Array(256);
	for (var i = 0; i < 256; i++) _utf8len[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
	_utf8len[254] = _utf8len[254] = 1;
	var string2buf = function(str) {
		var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
		for (m_pos = 0; m_pos < str_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
		}
		if (support.uint8array) buf = new Uint8Array(buf_len);
		else buf = new Array(buf_len);
		for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			if (c < 128) buf[i++] = c;
			else if (c < 2048) {
				buf[i++] = 192 | c >>> 6;
				buf[i++] = 128 | c & 63;
			} else if (c < 65536) {
				buf[i++] = 224 | c >>> 12;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			} else {
				buf[i++] = 240 | c >>> 18;
				buf[i++] = 128 | c >>> 12 & 63;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			}
		}
		return buf;
	};
	var utf8border = function(buf, max) {
		var pos;
		max = max || buf.length;
		if (max > buf.length) max = buf.length;
		pos = max - 1;
		while (pos >= 0 && (buf[pos] & 192) === 128) pos--;
		if (pos < 0) return max;
		if (pos === 0) return max;
		return pos + _utf8len[buf[pos]] > max ? pos : max;
	};
	var buf2string = function(buf) {
		var i, out, c, c_len;
		var len = buf.length;
		var utf16buf = new Array(len * 2);
		for (out = 0, i = 0; i < len;) {
			c = buf[i++];
			if (c < 128) {
				utf16buf[out++] = c;
				continue;
			}
			c_len = _utf8len[c];
			if (c_len > 4) {
				utf16buf[out++] = 65533;
				i += c_len - 1;
				continue;
			}
			c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
			while (c_len > 1 && i < len) {
				c = c << 6 | buf[i++] & 63;
				c_len--;
			}
			if (c_len > 1) {
				utf16buf[out++] = 65533;
				continue;
			}
			if (c < 65536) utf16buf[out++] = c;
			else {
				c -= 65536;
				utf16buf[out++] = 55296 | c >> 10 & 1023;
				utf16buf[out++] = 56320 | c & 1023;
			}
		}
		if (utf16buf.length !== out) if (utf16buf.subarray) utf16buf = utf16buf.subarray(0, out);
		else utf16buf.length = out;
		return utils.applyFromCharCode(utf16buf);
	};
	/**
	* Transform a javascript string into an array (typed if possible) of bytes,
	* UTF-8 encoded.
	* @param {String} str the string to encode
	* @return {Array|Uint8Array|Buffer} the UTF-8 encoded string.
	*/
	exports.utf8encode = function utf8encode(str) {
		if (support.nodebuffer) return nodejsUtils.newBufferFrom(str, "utf-8");
		return string2buf(str);
	};
	/**
	* Transform a bytes array (or a representation) representing an UTF-8 encoded
	* string into a javascript string.
	* @param {Array|Uint8Array|Buffer} buf the data de decode
	* @return {String} the decoded string.
	*/
	exports.utf8decode = function utf8decode(buf) {
		if (support.nodebuffer) return utils.transformTo("nodebuffer", buf).toString("utf-8");
		buf = utils.transformTo(support.uint8array ? "uint8array" : "array", buf);
		return buf2string(buf);
	};
	/**
	* A worker to decode utf8 encoded binary chunks into string chunks.
	* @constructor
	*/
	function Utf8DecodeWorker() {
		GenericWorker.call(this, "utf-8 decode");
		this.leftOver = null;
	}
	utils.inherits(Utf8DecodeWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	Utf8DecodeWorker.prototype.processChunk = function(chunk) {
		var data = utils.transformTo(support.uint8array ? "uint8array" : "array", chunk.data);
		if (this.leftOver && this.leftOver.length) {
			if (support.uint8array) {
				var previousData = data;
				data = new Uint8Array(previousData.length + this.leftOver.length);
				data.set(this.leftOver, 0);
				data.set(previousData, this.leftOver.length);
			} else data = this.leftOver.concat(data);
			this.leftOver = null;
		}
		var nextBoundary = utf8border(data);
		var usableData = data;
		if (nextBoundary !== data.length) if (support.uint8array) {
			usableData = data.subarray(0, nextBoundary);
			this.leftOver = data.subarray(nextBoundary, data.length);
		} else {
			usableData = data.slice(0, nextBoundary);
			this.leftOver = data.slice(nextBoundary, data.length);
		}
		this.push({
			data: exports.utf8decode(usableData),
			meta: chunk.meta
		});
	};
	/**
	* @see GenericWorker.flush
	*/
	Utf8DecodeWorker.prototype.flush = function() {
		if (this.leftOver && this.leftOver.length) {
			this.push({
				data: exports.utf8decode(this.leftOver),
				meta: {}
			});
			this.leftOver = null;
		}
	};
	exports.Utf8DecodeWorker = Utf8DecodeWorker;
	/**
	* A worker to endcode string chunks into utf8 encoded binary chunks.
	* @constructor
	*/
	function Utf8EncodeWorker() {
		GenericWorker.call(this, "utf-8 encode");
	}
	utils.inherits(Utf8EncodeWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	Utf8EncodeWorker.prototype.processChunk = function(chunk) {
		this.push({
			data: exports.utf8encode(chunk.data),
			meta: chunk.meta
		});
	};
	exports.Utf8EncodeWorker = Utf8EncodeWorker;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/stream/ConvertWorker.js
var require_ConvertWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var GenericWorker = require_GenericWorker();
	var utils = require_utils();
	/**
	* A worker which convert chunks to a specified type.
	* @constructor
	* @param {String} destType the destination type.
	*/
	function ConvertWorker(destType) {
		GenericWorker.call(this, "ConvertWorker to " + destType);
		this.destType = destType;
	}
	utils.inherits(ConvertWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	ConvertWorker.prototype.processChunk = function(chunk) {
		this.push({
			data: utils.transformTo(this.destType, chunk.data),
			meta: chunk.meta
		});
	};
	module.exports = ConvertWorker;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/nodejs/NodejsStreamOutputAdapter.js
var require_NodejsStreamOutputAdapter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Readable = require_readable().Readable;
	require_utils().inherits(NodejsStreamOutputAdapter, Readable);
	/**
	* A nodejs stream using a worker as source.
	* @see the SourceWrapper in http://nodejs.org/api/stream.html
	* @constructor
	* @param {StreamHelper} helper the helper wrapping the worker
	* @param {Object} options the nodejs stream options
	* @param {Function} updateCb the update callback.
	*/
	function NodejsStreamOutputAdapter(helper, options, updateCb) {
		Readable.call(this, options);
		this._helper = helper;
		var self = this;
		helper.on("data", function(data, meta) {
			if (!self.push(data)) self._helper.pause();
			if (updateCb) updateCb(meta);
		}).on("error", function(e) {
			self.emit("error", e);
		}).on("end", function() {
			self.push(null);
		});
	}
	NodejsStreamOutputAdapter.prototype._read = function() {
		this._helper.resume();
	};
	module.exports = NodejsStreamOutputAdapter;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/stream/StreamHelper.js
var require_StreamHelper = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var ConvertWorker = require_ConvertWorker();
	var GenericWorker = require_GenericWorker();
	var base64 = require_base64();
	var support = require_support();
	var external = require_external();
	var NodejsStreamOutputAdapter = null;
	if (support.nodestream) try {
		NodejsStreamOutputAdapter = require_NodejsStreamOutputAdapter();
	} catch (e) {}
	/**
	* Apply the final transformation of the data. If the user wants a Blob for
	* example, it's easier to work with an U8intArray and finally do the
	* ArrayBuffer/Blob conversion.
	* @param {String} type the name of the final type
	* @param {String|Uint8Array|Buffer} content the content to transform
	* @param {String} mimeType the mime type of the content, if applicable.
	* @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the content in the right format.
	*/
	function transformZipOutput(type, content, mimeType) {
		switch (type) {
			case "blob": return utils.newBlob(utils.transformTo("arraybuffer", content), mimeType);
			case "base64": return base64.encode(content);
			default: return utils.transformTo(type, content);
		}
	}
	/**
	* Concatenate an array of data of the given type.
	* @param {String} type the type of the data in the given array.
	* @param {Array} dataArray the array containing the data chunks to concatenate
	* @return {String|Uint8Array|Buffer} the concatenated data
	* @throws Error if the asked type is unsupported
	*/
	function concat(type, dataArray) {
		var i, index = 0, res = null, totalLength = 0;
		for (i = 0; i < dataArray.length; i++) totalLength += dataArray[i].length;
		switch (type) {
			case "string": return dataArray.join("");
			case "array": return Array.prototype.concat.apply([], dataArray);
			case "uint8array":
				res = new Uint8Array(totalLength);
				for (i = 0; i < dataArray.length; i++) {
					res.set(dataArray[i], index);
					index += dataArray[i].length;
				}
				return res;
			case "nodebuffer": return Buffer.concat(dataArray);
			default: throw new Error("concat : unsupported type '" + type + "'");
		}
	}
	/**
	* Listen a StreamHelper, accumulate its content and concatenate it into a
	* complete block.
	* @param {StreamHelper} helper the helper to use.
	* @param {Function} updateCallback a callback called on each update. Called
	* with one arg :
	* - the metadata linked to the update received.
	* @return Promise the promise for the accumulation.
	*/
	function accumulate(helper, updateCallback) {
		return new external.Promise(function(resolve, reject) {
			var dataArray = [];
			var chunkType = helper._internalType, resultType = helper._outputType, mimeType = helper._mimeType;
			helper.on("data", function(data, meta) {
				dataArray.push(data);
				if (updateCallback) updateCallback(meta);
			}).on("error", function(err) {
				dataArray = [];
				reject(err);
			}).on("end", function() {
				try {
					resolve(transformZipOutput(resultType, concat(chunkType, dataArray), mimeType));
				} catch (e) {
					reject(e);
				}
				dataArray = [];
			}).resume();
		});
	}
	/**
	* An helper to easily use workers outside of JSZip.
	* @constructor
	* @param {Worker} worker the worker to wrap
	* @param {String} outputType the type of data expected by the use
	* @param {String} mimeType the mime type of the content, if applicable.
	*/
	function StreamHelper(worker, outputType, mimeType) {
		var internalType = outputType;
		switch (outputType) {
			case "blob":
			case "arraybuffer":
				internalType = "uint8array";
				break;
			case "base64":
				internalType = "string";
				break;
		}
		try {
			this._internalType = internalType;
			this._outputType = outputType;
			this._mimeType = mimeType;
			utils.checkSupport(internalType);
			this._worker = worker.pipe(new ConvertWorker(internalType));
			worker.lock();
		} catch (e) {
			this._worker = new GenericWorker("error");
			this._worker.error(e);
		}
	}
	StreamHelper.prototype = {
		accumulate: function(updateCb) {
			return accumulate(this, updateCb);
		},
		on: function(evt, fn) {
			var self = this;
			if (evt === "data") this._worker.on(evt, function(chunk) {
				fn.call(self, chunk.data, chunk.meta);
			});
			else this._worker.on(evt, function() {
				utils.delay(fn, arguments, self);
			});
			return this;
		},
		resume: function() {
			utils.delay(this._worker.resume, [], this._worker);
			return this;
		},
		pause: function() {
			this._worker.pause();
			return this;
		},
		toNodejsStream: function(updateCb) {
			utils.checkSupport("nodestream");
			if (this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
			return new NodejsStreamOutputAdapter(this, { objectMode: this._outputType !== "nodebuffer" }, updateCb);
		}
	};
	module.exports = StreamHelper;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/defaults.js
var require_defaults = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.base64 = false;
	exports.binary = false;
	exports.dir = false;
	exports.createFolders = true;
	exports.date = null;
	exports.compression = null;
	exports.compressionOptions = null;
	exports.comment = null;
	exports.unixPermissions = null;
	exports.dosPermissions = null;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/stream/DataWorker.js
var require_DataWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var DEFAULT_BLOCK_SIZE = 16 * 1024;
	/**
	* A worker that reads a content and emits chunks.
	* @constructor
	* @param {Promise} dataP the promise of the data to split
	*/
	function DataWorker(dataP) {
		GenericWorker.call(this, "DataWorker");
		var self = this;
		this.dataIsReady = false;
		this.index = 0;
		this.max = 0;
		this.data = null;
		this.type = "";
		this._tickScheduled = false;
		dataP.then(function(data) {
			self.dataIsReady = true;
			self.data = data;
			self.max = data && data.length || 0;
			self.type = utils.getTypeOf(data);
			if (!self.isPaused) self._tickAndRepeat();
		}, function(e) {
			self.error(e);
		});
	}
	utils.inherits(DataWorker, GenericWorker);
	/**
	* @see GenericWorker.cleanUp
	*/
	DataWorker.prototype.cleanUp = function() {
		GenericWorker.prototype.cleanUp.call(this);
		this.data = null;
	};
	/**
	* @see GenericWorker.resume
	*/
	DataWorker.prototype.resume = function() {
		if (!GenericWorker.prototype.resume.call(this)) return false;
		if (!this._tickScheduled && this.dataIsReady) {
			this._tickScheduled = true;
			utils.delay(this._tickAndRepeat, [], this);
		}
		return true;
	};
	/**
	* Trigger a tick a schedule an other call to this function.
	*/
	DataWorker.prototype._tickAndRepeat = function() {
		this._tickScheduled = false;
		if (this.isPaused || this.isFinished) return;
		this._tick();
		if (!this.isFinished) {
			utils.delay(this._tickAndRepeat, [], this);
			this._tickScheduled = true;
		}
	};
	/**
	* Read and push a chunk.
	*/
	DataWorker.prototype._tick = function() {
		if (this.isPaused || this.isFinished) return false;
		var size = DEFAULT_BLOCK_SIZE;
		var data = null, nextIndex = Math.min(this.max, this.index + size);
		if (this.index >= this.max) return this.end();
		else {
			switch (this.type) {
				case "string":
					data = this.data.substring(this.index, nextIndex);
					break;
				case "uint8array":
					data = this.data.subarray(this.index, nextIndex);
					break;
				case "array":
				case "nodebuffer":
					data = this.data.slice(this.index, nextIndex);
					break;
			}
			this.index = nextIndex;
			return this.push({
				data,
				meta: { percent: this.max ? this.index / this.max * 100 : 0 }
			});
		}
	};
	module.exports = DataWorker;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/crc32.js
var require_crc32$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	/**
	* The following functions come from pako, from pako/lib/zlib/crc32.js
	* released under the MIT license, see pako https://github.com/nodeca/pako/
	*/
	function makeTable() {
		var c, table = [];
		for (var n = 0; n < 256; n++) {
			c = n;
			for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
			table[n] = c;
		}
		return table;
	}
	var crcTable = makeTable();
	function crc32(crc, buf, len, pos) {
		var t = crcTable, end = pos + len;
		crc = crc ^ -1;
		for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
		return crc ^ -1;
	}
	/**
	* Compute the crc32 of a string.
	* This is almost the same as the function crc32, but for strings. Using the
	* same function for the two use cases leads to horrible performances.
	* @param {Number} crc the starting value of the crc.
	* @param {String} str the string to use.
	* @param {Number} len the length of the string.
	* @param {Number} pos the starting position for the crc32 computation.
	* @return {Number} the computed crc32.
	*/
	function crc32str(crc, str, len, pos) {
		var t = crcTable, end = pos + len;
		crc = crc ^ -1;
		for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ str.charCodeAt(i)) & 255];
		return crc ^ -1;
	}
	module.exports = function crc32wrapper(input, crc) {
		if (typeof input === "undefined" || !input.length) return 0;
		if (utils.getTypeOf(input) !== "string") return crc32(crc | 0, input, input.length, 0);
		else return crc32str(crc | 0, input, input.length, 0);
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/stream/Crc32Probe.js
var require_Crc32Probe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var GenericWorker = require_GenericWorker();
	var crc32 = require_crc32$1();
	var utils = require_utils();
	/**
	* A worker which calculate the crc32 of the data flowing through.
	* @constructor
	*/
	function Crc32Probe() {
		GenericWorker.call(this, "Crc32Probe");
		this.withStreamInfo("crc32", 0);
	}
	utils.inherits(Crc32Probe, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	Crc32Probe.prototype.processChunk = function(chunk) {
		this.streamInfo.crc32 = crc32(chunk.data, this.streamInfo.crc32 || 0);
		this.push(chunk);
	};
	module.exports = Crc32Probe;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/stream/DataLengthProbe.js
var require_DataLengthProbe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	/**
	* A worker which calculate the total length of the data flowing through.
	* @constructor
	* @param {String} propName the name used to expose the length
	*/
	function DataLengthProbe(propName) {
		GenericWorker.call(this, "DataLengthProbe for " + propName);
		this.propName = propName;
		this.withStreamInfo(propName, 0);
	}
	utils.inherits(DataLengthProbe, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	DataLengthProbe.prototype.processChunk = function(chunk) {
		if (chunk) {
			var length = this.streamInfo[this.propName] || 0;
			this.streamInfo[this.propName] = length + chunk.data.length;
		}
		GenericWorker.prototype.processChunk.call(this, chunk);
	};
	module.exports = DataLengthProbe;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/compressedObject.js
var require_compressedObject = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var external = require_external();
	var DataWorker = require_DataWorker();
	var Crc32Probe = require_Crc32Probe();
	var DataLengthProbe = require_DataLengthProbe();
	/**
	* Represent a compressed object, with everything needed to decompress it.
	* @constructor
	* @param {number} compressedSize the size of the data compressed.
	* @param {number} uncompressedSize the size of the data after decompression.
	* @param {number} crc32 the crc32 of the decompressed file.
	* @param {object} compression the type of compression, see lib/compressions.js.
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the compressed data.
	*/
	function CompressedObject(compressedSize, uncompressedSize, crc32, compression, data) {
		this.compressedSize = compressedSize;
		this.uncompressedSize = uncompressedSize;
		this.crc32 = crc32;
		this.compression = compression;
		this.compressedContent = data;
	}
	CompressedObject.prototype = {
		getContentWorker: function() {
			var worker = new DataWorker(external.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new DataLengthProbe("data_length"));
			var that = this;
			worker.on("end", function() {
				if (this.streamInfo["data_length"] !== that.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
			});
			return worker;
		},
		getCompressedWorker: function() {
			return new DataWorker(external.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
		}
	};
	/**
	* Chain the given worker with other workers to compress the content with the
	* given compression.
	* @param {GenericWorker} uncompressedWorker the worker to pipe.
	* @param {Object} compression the compression object.
	* @param {Object} compressionOptions the options to use when compressing.
	* @return {GenericWorker} the new worker compressing the content.
	*/
	CompressedObject.createWorkerFrom = function(uncompressedWorker, compression, compressionOptions) {
		return uncompressedWorker.pipe(new Crc32Probe()).pipe(new DataLengthProbe("uncompressedSize")).pipe(compression.compressWorker(compressionOptions)).pipe(new DataLengthProbe("compressedSize")).withStreamInfo("compression", compression);
	};
	module.exports = CompressedObject;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/zipObject.js
var require_zipObject = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var StreamHelper = require_StreamHelper();
	var DataWorker = require_DataWorker();
	var utf8 = require_utf8();
	var CompressedObject = require_compressedObject();
	var GenericWorker = require_GenericWorker();
	/**
	* A simple object representing a file in the zip file.
	* @constructor
	* @param {string} name the name of the file
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
	* @param {Object} options the options of the file
	*/
	var ZipObject = function(name, data, options) {
		this.name = name;
		this.dir = options.dir;
		this.date = options.date;
		this.comment = options.comment;
		this.unixPermissions = options.unixPermissions;
		this.dosPermissions = options.dosPermissions;
		this._data = data;
		this._dataBinary = options.binary;
		this.options = {
			compression: options.compression,
			compressionOptions: options.compressionOptions
		};
	};
	ZipObject.prototype = {
		internalStream: function(type) {
			var result = null, outputType = "string";
			try {
				if (!type) throw new Error("No output type specified.");
				outputType = type.toLowerCase();
				var askUnicodeString = outputType === "string" || outputType === "text";
				if (outputType === "binarystring" || outputType === "text") outputType = "string";
				result = this._decompressWorker();
				var isUnicodeString = !this._dataBinary;
				if (isUnicodeString && !askUnicodeString) result = result.pipe(new utf8.Utf8EncodeWorker());
				if (!isUnicodeString && askUnicodeString) result = result.pipe(new utf8.Utf8DecodeWorker());
			} catch (e) {
				result = new GenericWorker("error");
				result.error(e);
			}
			return new StreamHelper(result, outputType, "");
		},
		async: function(type, onUpdate) {
			return this.internalStream(type).accumulate(onUpdate);
		},
		nodeStream: function(type, onUpdate) {
			return this.internalStream(type || "nodebuffer").toNodejsStream(onUpdate);
		},
		_compressWorker: function(compression, compressionOptions) {
			if (this._data instanceof CompressedObject && this._data.compression.magic === compression.magic) return this._data.getCompressedWorker();
			else {
				var result = this._decompressWorker();
				if (!this._dataBinary) result = result.pipe(new utf8.Utf8EncodeWorker());
				return CompressedObject.createWorkerFrom(result, compression, compressionOptions);
			}
		},
		_decompressWorker: function() {
			if (this._data instanceof CompressedObject) return this._data.getContentWorker();
			else if (this._data instanceof GenericWorker) return this._data;
			else return new DataWorker(this._data);
		}
	};
	var removedMethods = [
		"asText",
		"asBinary",
		"asNodeBuffer",
		"asUint8Array",
		"asArrayBuffer"
	];
	var removedFn = function() {
		throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
	};
	for (var i = 0; i < removedMethods.length; i++) ZipObject.prototype[removedMethods[i]] = removedFn;
	module.exports = ZipObject;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/utils/common.js
var require_common = /* @__PURE__ */ __commonJSMin(((exports) => {
	var TYPED_OK = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Int32Array !== "undefined";
	function _has(obj, key) {
		return Object.prototype.hasOwnProperty.call(obj, key);
	}
	exports.assign = function(obj) {
		var sources = Array.prototype.slice.call(arguments, 1);
		while (sources.length) {
			var source = sources.shift();
			if (!source) continue;
			if (typeof source !== "object") throw new TypeError(source + "must be non-object");
			for (var p in source) if (_has(source, p)) obj[p] = source[p];
		}
		return obj;
	};
	exports.shrinkBuf = function(buf, size) {
		if (buf.length === size) return buf;
		if (buf.subarray) return buf.subarray(0, size);
		buf.length = size;
		return buf;
	};
	var fnTyped = {
		arraySet: function(dest, src, src_offs, len, dest_offs) {
			if (src.subarray && dest.subarray) {
				dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
				return;
			}
			for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
		},
		flattenChunks: function(chunks) {
			var i, l, len = 0, pos, chunk, result;
			for (i = 0, l = chunks.length; i < l; i++) len += chunks[i].length;
			result = new Uint8Array(len);
			pos = 0;
			for (i = 0, l = chunks.length; i < l; i++) {
				chunk = chunks[i];
				result.set(chunk, pos);
				pos += chunk.length;
			}
			return result;
		}
	};
	var fnUntyped = {
		arraySet: function(dest, src, src_offs, len, dest_offs) {
			for (var i = 0; i < len; i++) dest[dest_offs + i] = src[src_offs + i];
		},
		flattenChunks: function(chunks) {
			return [].concat.apply([], chunks);
		}
	};
	exports.setTyped = function(on) {
		if (on) {
			exports.Buf8 = Uint8Array;
			exports.Buf16 = Uint16Array;
			exports.Buf32 = Int32Array;
			exports.assign(exports, fnTyped);
		} else {
			exports.Buf8 = Array;
			exports.Buf16 = Array;
			exports.Buf32 = Array;
			exports.assign(exports, fnUntyped);
		}
	};
	exports.setTyped(TYPED_OK);
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/trees.js
var require_trees = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var Z_FIXED = 4;
	var Z_BINARY = 0;
	var Z_TEXT = 1;
	var Z_UNKNOWN = 2;
	function zero(buf) {
		var len = buf.length;
		while (--len >= 0) buf[len] = 0;
	}
	var STORED_BLOCK = 0;
	var STATIC_TREES = 1;
	var DYN_TREES = 2;
	var MIN_MATCH = 3;
	var MAX_MATCH = 258;
	var LENGTH_CODES = 29;
	var LITERALS = 256;
	var L_CODES = LITERALS + 1 + LENGTH_CODES;
	var D_CODES = 30;
	var BL_CODES = 19;
	var HEAP_SIZE = 2 * L_CODES + 1;
	var MAX_BITS = 15;
	var Buf_size = 16;
	var MAX_BL_BITS = 7;
	var END_BLOCK = 256;
	var REP_3_6 = 16;
	var REPZ_3_10 = 17;
	var REPZ_11_138 = 18;
	var extra_lbits = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		4,
		4,
		4,
		4,
		5,
		5,
		5,
		5,
		0
	];
	var extra_dbits = [
		0,
		0,
		0,
		0,
		1,
		1,
		2,
		2,
		3,
		3,
		4,
		4,
		5,
		5,
		6,
		6,
		7,
		7,
		8,
		8,
		9,
		9,
		10,
		10,
		11,
		11,
		12,
		12,
		13,
		13
	];
	var extra_blbits = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		2,
		3,
		7
	];
	var bl_order = [
		16,
		17,
		18,
		0,
		8,
		7,
		9,
		6,
		10,
		5,
		11,
		4,
		12,
		3,
		13,
		2,
		14,
		1,
		15
	];
	var DIST_CODE_LEN = 512;
	var static_ltree = new Array((L_CODES + 2) * 2);
	zero(static_ltree);
	var static_dtree = new Array(D_CODES * 2);
	zero(static_dtree);
	var _dist_code = new Array(DIST_CODE_LEN);
	zero(_dist_code);
	var _length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
	zero(_length_code);
	var base_length = new Array(LENGTH_CODES);
	zero(base_length);
	var base_dist = new Array(D_CODES);
	zero(base_dist);
	function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
		this.static_tree = static_tree;
		this.extra_bits = extra_bits;
		this.extra_base = extra_base;
		this.elems = elems;
		this.max_length = max_length;
		this.has_stree = static_tree && static_tree.length;
	}
	var static_l_desc;
	var static_d_desc;
	var static_bl_desc;
	function TreeDesc(dyn_tree, stat_desc) {
		this.dyn_tree = dyn_tree;
		this.max_code = 0;
		this.stat_desc = stat_desc;
	}
	function d_code(dist) {
		return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
	}
	function put_short(s, w) {
		s.pending_buf[s.pending++] = w & 255;
		s.pending_buf[s.pending++] = w >>> 8 & 255;
	}
	function send_bits(s, value, length) {
		if (s.bi_valid > Buf_size - length) {
			s.bi_buf |= value << s.bi_valid & 65535;
			put_short(s, s.bi_buf);
			s.bi_buf = value >> Buf_size - s.bi_valid;
			s.bi_valid += length - Buf_size;
		} else {
			s.bi_buf |= value << s.bi_valid & 65535;
			s.bi_valid += length;
		}
	}
	function send_code(s, c, tree) {
		send_bits(s, tree[c * 2], tree[c * 2 + 1]);
	}
	function bi_reverse(code, len) {
		var res = 0;
		do {
			res |= code & 1;
			code >>>= 1;
			res <<= 1;
		} while (--len > 0);
		return res >>> 1;
	}
	function bi_flush(s) {
		if (s.bi_valid === 16) {
			put_short(s, s.bi_buf);
			s.bi_buf = 0;
			s.bi_valid = 0;
		} else if (s.bi_valid >= 8) {
			s.pending_buf[s.pending++] = s.bi_buf & 255;
			s.bi_buf >>= 8;
			s.bi_valid -= 8;
		}
	}
	function gen_bitlen(s, desc) {
		var tree = desc.dyn_tree;
		var max_code = desc.max_code;
		var stree = desc.stat_desc.static_tree;
		var has_stree = desc.stat_desc.has_stree;
		var extra = desc.stat_desc.extra_bits;
		var base = desc.stat_desc.extra_base;
		var max_length = desc.stat_desc.max_length;
		var h;
		var n, m;
		var bits;
		var xbits;
		var f;
		var overflow = 0;
		for (bits = 0; bits <= MAX_BITS; bits++) s.bl_count[bits] = 0;
		tree[s.heap[s.heap_max] * 2 + 1] = 0;
		for (h = s.heap_max + 1; h < HEAP_SIZE; h++) {
			n = s.heap[h];
			bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
			if (bits > max_length) {
				bits = max_length;
				overflow++;
			}
			tree[n * 2 + 1] = bits;
			if (n > max_code) continue;
			s.bl_count[bits]++;
			xbits = 0;
			if (n >= base) xbits = extra[n - base];
			f = tree[n * 2];
			s.opt_len += f * (bits + xbits);
			if (has_stree) s.static_len += f * (stree[n * 2 + 1] + xbits);
		}
		if (overflow === 0) return;
		do {
			bits = max_length - 1;
			while (s.bl_count[bits] === 0) bits--;
			s.bl_count[bits]--;
			s.bl_count[bits + 1] += 2;
			s.bl_count[max_length]--;
			overflow -= 2;
		} while (overflow > 0);
		for (bits = max_length; bits !== 0; bits--) {
			n = s.bl_count[bits];
			while (n !== 0) {
				m = s.heap[--h];
				if (m > max_code) continue;
				if (tree[m * 2 + 1] !== bits) {
					s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
					tree[m * 2 + 1] = bits;
				}
				n--;
			}
		}
	}
	function gen_codes(tree, max_code, bl_count) {
		var next_code = new Array(MAX_BITS + 1);
		var code = 0;
		var bits;
		var n;
		for (bits = 1; bits <= MAX_BITS; bits++) next_code[bits] = code = code + bl_count[bits - 1] << 1;
		for (n = 0; n <= max_code; n++) {
			var len = tree[n * 2 + 1];
			if (len === 0) continue;
			tree[n * 2] = bi_reverse(next_code[len]++, len);
		}
	}
	function tr_static_init() {
		var n;
		var bits;
		var length;
		var code;
		var dist;
		var bl_count = new Array(MAX_BITS + 1);
		length = 0;
		for (code = 0; code < LENGTH_CODES - 1; code++) {
			base_length[code] = length;
			for (n = 0; n < 1 << extra_lbits[code]; n++) _length_code[length++] = code;
		}
		_length_code[length - 1] = code;
		dist = 0;
		for (code = 0; code < 16; code++) {
			base_dist[code] = dist;
			for (n = 0; n < 1 << extra_dbits[code]; n++) _dist_code[dist++] = code;
		}
		dist >>= 7;
		for (; code < D_CODES; code++) {
			base_dist[code] = dist << 7;
			for (n = 0; n < 1 << extra_dbits[code] - 7; n++) _dist_code[256 + dist++] = code;
		}
		for (bits = 0; bits <= MAX_BITS; bits++) bl_count[bits] = 0;
		n = 0;
		while (n <= 143) {
			static_ltree[n * 2 + 1] = 8;
			n++;
			bl_count[8]++;
		}
		while (n <= 255) {
			static_ltree[n * 2 + 1] = 9;
			n++;
			bl_count[9]++;
		}
		while (n <= 279) {
			static_ltree[n * 2 + 1] = 7;
			n++;
			bl_count[7]++;
		}
		while (n <= 287) {
			static_ltree[n * 2 + 1] = 8;
			n++;
			bl_count[8]++;
		}
		gen_codes(static_ltree, L_CODES + 1, bl_count);
		for (n = 0; n < D_CODES; n++) {
			static_dtree[n * 2 + 1] = 5;
			static_dtree[n * 2] = bi_reverse(n, 5);
		}
		static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);
		static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES, MAX_BITS);
		static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES, MAX_BL_BITS);
	}
	function init_block(s) {
		var n;
		for (n = 0; n < L_CODES; n++) s.dyn_ltree[n * 2] = 0;
		for (n = 0; n < D_CODES; n++) s.dyn_dtree[n * 2] = 0;
		for (n = 0; n < BL_CODES; n++) s.bl_tree[n * 2] = 0;
		s.dyn_ltree[END_BLOCK * 2] = 1;
		s.opt_len = s.static_len = 0;
		s.last_lit = s.matches = 0;
	}
	function bi_windup(s) {
		if (s.bi_valid > 8) put_short(s, s.bi_buf);
		else if (s.bi_valid > 0) s.pending_buf[s.pending++] = s.bi_buf;
		s.bi_buf = 0;
		s.bi_valid = 0;
	}
	function copy_block(s, buf, len, header) {
		bi_windup(s);
		if (header) {
			put_short(s, len);
			put_short(s, ~len);
		}
		utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
		s.pending += len;
	}
	function smaller(tree, n, m, depth) {
		var _n2 = n * 2;
		var _m2 = m * 2;
		return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
	}
	function pqdownheap(s, tree, k) {
		var v = s.heap[k];
		var j = k << 1;
		while (j <= s.heap_len) {
			if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) j++;
			if (smaller(tree, v, s.heap[j], s.depth)) break;
			s.heap[k] = s.heap[j];
			k = j;
			j <<= 1;
		}
		s.heap[k] = v;
	}
	function compress_block(s, ltree, dtree) {
		var dist;
		var lc;
		var lx = 0;
		var code;
		var extra;
		if (s.last_lit !== 0) do {
			dist = s.pending_buf[s.d_buf + lx * 2] << 8 | s.pending_buf[s.d_buf + lx * 2 + 1];
			lc = s.pending_buf[s.l_buf + lx];
			lx++;
			if (dist === 0) send_code(s, lc, ltree);
			else {
				code = _length_code[lc];
				send_code(s, code + LITERALS + 1, ltree);
				extra = extra_lbits[code];
				if (extra !== 0) {
					lc -= base_length[code];
					send_bits(s, lc, extra);
				}
				dist--;
				code = d_code(dist);
				send_code(s, code, dtree);
				extra = extra_dbits[code];
				if (extra !== 0) {
					dist -= base_dist[code];
					send_bits(s, dist, extra);
				}
			}
		} while (lx < s.last_lit);
		send_code(s, END_BLOCK, ltree);
	}
	function build_tree(s, desc) {
		var tree = desc.dyn_tree;
		var stree = desc.stat_desc.static_tree;
		var has_stree = desc.stat_desc.has_stree;
		var elems = desc.stat_desc.elems;
		var n, m;
		var max_code = -1;
		var node;
		s.heap_len = 0;
		s.heap_max = HEAP_SIZE;
		for (n = 0; n < elems; n++) if (tree[n * 2] !== 0) {
			s.heap[++s.heap_len] = max_code = n;
			s.depth[n] = 0;
		} else tree[n * 2 + 1] = 0;
		while (s.heap_len < 2) {
			node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
			tree[node * 2] = 1;
			s.depth[node] = 0;
			s.opt_len--;
			if (has_stree) s.static_len -= stree[node * 2 + 1];
		}
		desc.max_code = max_code;
		for (n = s.heap_len >> 1; n >= 1; n--) pqdownheap(s, tree, n);
		node = elems;
		do {
			/*** pqremove ***/
			n = s.heap[1];
			s.heap[1] = s.heap[s.heap_len--];
			pqdownheap(s, tree, 1);
			m = s.heap[1];
			s.heap[--s.heap_max] = n;
			s.heap[--s.heap_max] = m;
			tree[node * 2] = tree[n * 2] + tree[m * 2];
			s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
			tree[n * 2 + 1] = tree[m * 2 + 1] = node;
			s.heap[1] = node++;
			pqdownheap(s, tree, 1);
		} while (s.heap_len >= 2);
		s.heap[--s.heap_max] = s.heap[1];
		gen_bitlen(s, desc);
		gen_codes(tree, max_code, s.bl_count);
	}
	function scan_tree(s, tree, max_code) {
		var n;
		var prevlen = -1;
		var curlen;
		var nextlen = tree[1];
		var count = 0;
		var max_count = 7;
		var min_count = 4;
		if (nextlen === 0) {
			max_count = 138;
			min_count = 3;
		}
		tree[(max_code + 1) * 2 + 1] = 65535;
		for (n = 0; n <= max_code; n++) {
			curlen = nextlen;
			nextlen = tree[(n + 1) * 2 + 1];
			if (++count < max_count && curlen === nextlen) continue;
			else if (count < min_count) s.bl_tree[curlen * 2] += count;
			else if (curlen !== 0) {
				if (curlen !== prevlen) s.bl_tree[curlen * 2]++;
				s.bl_tree[REP_3_6 * 2]++;
			} else if (count <= 10) s.bl_tree[REPZ_3_10 * 2]++;
			else s.bl_tree[REPZ_11_138 * 2]++;
			count = 0;
			prevlen = curlen;
			if (nextlen === 0) {
				max_count = 138;
				min_count = 3;
			} else if (curlen === nextlen) {
				max_count = 6;
				min_count = 3;
			} else {
				max_count = 7;
				min_count = 4;
			}
		}
	}
	function send_tree(s, tree, max_code) {
		var n;
		var prevlen = -1;
		var curlen;
		var nextlen = tree[1];
		var count = 0;
		var max_count = 7;
		var min_count = 4;
		if (nextlen === 0) {
			max_count = 138;
			min_count = 3;
		}
		for (n = 0; n <= max_code; n++) {
			curlen = nextlen;
			nextlen = tree[(n + 1) * 2 + 1];
			if (++count < max_count && curlen === nextlen) continue;
			else if (count < min_count) do
				send_code(s, curlen, s.bl_tree);
			while (--count !== 0);
			else if (curlen !== 0) {
				if (curlen !== prevlen) {
					send_code(s, curlen, s.bl_tree);
					count--;
				}
				send_code(s, REP_3_6, s.bl_tree);
				send_bits(s, count - 3, 2);
			} else if (count <= 10) {
				send_code(s, REPZ_3_10, s.bl_tree);
				send_bits(s, count - 3, 3);
			} else {
				send_code(s, REPZ_11_138, s.bl_tree);
				send_bits(s, count - 11, 7);
			}
			count = 0;
			prevlen = curlen;
			if (nextlen === 0) {
				max_count = 138;
				min_count = 3;
			} else if (curlen === nextlen) {
				max_count = 6;
				min_count = 3;
			} else {
				max_count = 7;
				min_count = 4;
			}
		}
	}
	function build_bl_tree(s) {
		var max_blindex;
		scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
		scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
		build_tree(s, s.bl_desc);
		for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) break;
		s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
		return max_blindex;
	}
	function send_all_trees(s, lcodes, dcodes, blcodes) {
		var rank;
		send_bits(s, lcodes - 257, 5);
		send_bits(s, dcodes - 1, 5);
		send_bits(s, blcodes - 4, 4);
		for (rank = 0; rank < blcodes; rank++) send_bits(s, s.bl_tree[bl_order[rank] * 2 + 1], 3);
		send_tree(s, s.dyn_ltree, lcodes - 1);
		send_tree(s, s.dyn_dtree, dcodes - 1);
	}
	function detect_data_type(s) {
		var black_mask = 4093624447;
		var n;
		for (n = 0; n <= 31; n++, black_mask >>>= 1) if (black_mask & 1 && s.dyn_ltree[n * 2] !== 0) return Z_BINARY;
		if (s.dyn_ltree[18] !== 0 || s.dyn_ltree[20] !== 0 || s.dyn_ltree[26] !== 0) return Z_TEXT;
		for (n = 32; n < LITERALS; n++) if (s.dyn_ltree[n * 2] !== 0) return Z_TEXT;
		return Z_BINARY;
	}
	var static_init_done = false;
	function _tr_init(s) {
		if (!static_init_done) {
			tr_static_init();
			static_init_done = true;
		}
		s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
		s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
		s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
		s.bi_buf = 0;
		s.bi_valid = 0;
		init_block(s);
	}
	function _tr_stored_block(s, buf, stored_len, last) {
		send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
		copy_block(s, buf, stored_len, true);
	}
	function _tr_align(s) {
		send_bits(s, STATIC_TREES << 1, 3);
		send_code(s, END_BLOCK, static_ltree);
		bi_flush(s);
	}
	function _tr_flush_block(s, buf, stored_len, last) {
		var opt_lenb, static_lenb;
		var max_blindex = 0;
		if (s.level > 0) {
			if (s.strm.data_type === Z_UNKNOWN) s.strm.data_type = detect_data_type(s);
			build_tree(s, s.l_desc);
			build_tree(s, s.d_desc);
			max_blindex = build_bl_tree(s);
			opt_lenb = s.opt_len + 3 + 7 >>> 3;
			static_lenb = s.static_len + 3 + 7 >>> 3;
			if (static_lenb <= opt_lenb) opt_lenb = static_lenb;
		} else opt_lenb = static_lenb = stored_len + 5;
		if (stored_len + 4 <= opt_lenb && buf !== -1) _tr_stored_block(s, buf, stored_len, last);
		else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {
			send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
			compress_block(s, static_ltree, static_dtree);
		} else {
			send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
			send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
			compress_block(s, s.dyn_ltree, s.dyn_dtree);
		}
		init_block(s);
		if (last) bi_windup(s);
	}
	function _tr_tally(s, dist, lc) {
		s.pending_buf[s.d_buf + s.last_lit * 2] = dist >>> 8 & 255;
		s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 255;
		s.pending_buf[s.l_buf + s.last_lit] = lc & 255;
		s.last_lit++;
		if (dist === 0) s.dyn_ltree[lc * 2]++;
		else {
			s.matches++;
			dist--;
			s.dyn_ltree[(_length_code[lc] + LITERALS + 1) * 2]++;
			s.dyn_dtree[d_code(dist) * 2]++;
		}
		return s.last_lit === s.lit_bufsize - 1;
	}
	exports._tr_init = _tr_init;
	exports._tr_stored_block = _tr_stored_block;
	exports._tr_flush_block = _tr_flush_block;
	exports._tr_tally = _tr_tally;
	exports._tr_align = _tr_align;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/adler32.js
var require_adler32 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function adler32(adler, buf, len, pos) {
		var s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
		while (len !== 0) {
			n = len > 2e3 ? 2e3 : len;
			len -= n;
			do {
				s1 = s1 + buf[pos++] | 0;
				s2 = s2 + s1 | 0;
			} while (--n);
			s1 %= 65521;
			s2 %= 65521;
		}
		return s1 | s2 << 16 | 0;
	}
	module.exports = adler32;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/crc32.js
var require_crc32 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function makeTable() {
		var c, table = [];
		for (var n = 0; n < 256; n++) {
			c = n;
			for (var k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
			table[n] = c;
		}
		return table;
	}
	var crcTable = makeTable();
	function crc32(crc, buf, len, pos) {
		var t = crcTable, end = pos + len;
		crc ^= -1;
		for (var i = pos; i < end; i++) crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
		return crc ^ -1;
	}
	module.exports = crc32;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/messages.js
var require_messages = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		2: "need dictionary",
		1: "stream end",
		0: "",
		"-1": "file error",
		"-2": "stream error",
		"-3": "data error",
		"-4": "insufficient memory",
		"-5": "buffer error",
		"-6": "incompatible version"
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/deflate.js
var require_deflate$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var trees = require_trees();
	var adler32 = require_adler32();
	var crc32 = require_crc32();
	var msg = require_messages();
	var Z_NO_FLUSH = 0;
	var Z_PARTIAL_FLUSH = 1;
	var Z_FULL_FLUSH = 3;
	var Z_FINISH = 4;
	var Z_BLOCK = 5;
	var Z_OK = 0;
	var Z_STREAM_END = 1;
	var Z_STREAM_ERROR = -2;
	var Z_DATA_ERROR = -3;
	var Z_BUF_ERROR = -5;
	var Z_DEFAULT_COMPRESSION = -1;
	var Z_FILTERED = 1;
	var Z_HUFFMAN_ONLY = 2;
	var Z_RLE = 3;
	var Z_FIXED = 4;
	var Z_DEFAULT_STRATEGY = 0;
	var Z_UNKNOWN = 2;
	var Z_DEFLATED = 8;
	var MAX_MEM_LEVEL = 9;
	var MAX_WBITS = 15;
	var DEF_MEM_LEVEL = 8;
	var L_CODES = 286;
	var D_CODES = 30;
	var BL_CODES = 19;
	var HEAP_SIZE = 2 * L_CODES + 1;
	var MAX_BITS = 15;
	var MIN_MATCH = 3;
	var MAX_MATCH = 258;
	var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
	var PRESET_DICT = 32;
	var INIT_STATE = 42;
	var EXTRA_STATE = 69;
	var NAME_STATE = 73;
	var COMMENT_STATE = 91;
	var HCRC_STATE = 103;
	var BUSY_STATE = 113;
	var FINISH_STATE = 666;
	var BS_NEED_MORE = 1;
	var BS_BLOCK_DONE = 2;
	var BS_FINISH_STARTED = 3;
	var BS_FINISH_DONE = 4;
	var OS_CODE = 3;
	function err(strm, errorCode) {
		strm.msg = msg[errorCode];
		return errorCode;
	}
	function rank(f) {
		return (f << 1) - (f > 4 ? 9 : 0);
	}
	function zero(buf) {
		var len = buf.length;
		while (--len >= 0) buf[len] = 0;
	}
	function flush_pending(strm) {
		var s = strm.state;
		var len = s.pending;
		if (len > strm.avail_out) len = strm.avail_out;
		if (len === 0) return;
		utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
		strm.next_out += len;
		s.pending_out += len;
		strm.total_out += len;
		strm.avail_out -= len;
		s.pending -= len;
		if (s.pending === 0) s.pending_out = 0;
	}
	function flush_block_only(s, last) {
		trees._tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
		s.block_start = s.strstart;
		flush_pending(s.strm);
	}
	function put_byte(s, b) {
		s.pending_buf[s.pending++] = b;
	}
	function putShortMSB(s, b) {
		s.pending_buf[s.pending++] = b >>> 8 & 255;
		s.pending_buf[s.pending++] = b & 255;
	}
	function read_buf(strm, buf, start, size) {
		var len = strm.avail_in;
		if (len > size) len = size;
		if (len === 0) return 0;
		strm.avail_in -= len;
		utils.arraySet(buf, strm.input, strm.next_in, len, start);
		if (strm.state.wrap === 1) strm.adler = adler32(strm.adler, buf, len, start);
		else if (strm.state.wrap === 2) strm.adler = crc32(strm.adler, buf, len, start);
		strm.next_in += len;
		strm.total_in += len;
		return len;
	}
	function longest_match(s, cur_match) {
		var chain_length = s.max_chain_length;
		var scan = s.strstart;
		var match;
		var len;
		var best_len = s.prev_length;
		var nice_match = s.nice_match;
		var limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
		var _win = s.window;
		var wmask = s.w_mask;
		var prev = s.prev;
		var strend = s.strstart + MAX_MATCH;
		var scan_end1 = _win[scan + best_len - 1];
		var scan_end = _win[scan + best_len];
		if (s.prev_length >= s.good_match) chain_length >>= 2;
		if (nice_match > s.lookahead) nice_match = s.lookahead;
		do {
			match = cur_match;
			if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) continue;
			scan += 2;
			match++;
			do			;
while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
			len = MAX_MATCH - (strend - scan);
			scan = strend - MAX_MATCH;
			if (len > best_len) {
				s.match_start = cur_match;
				best_len = len;
				if (len >= nice_match) break;
				scan_end1 = _win[scan + best_len - 1];
				scan_end = _win[scan + best_len];
			}
		} while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
		if (best_len <= s.lookahead) return best_len;
		return s.lookahead;
	}
	function fill_window(s) {
		var _w_size = s.w_size;
		var p, n, m, more, str;
		do {
			more = s.window_size - s.lookahead - s.strstart;
			if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
				utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
				s.match_start -= _w_size;
				s.strstart -= _w_size;
				s.block_start -= _w_size;
				n = s.hash_size;
				p = n;
				do {
					m = s.head[--p];
					s.head[p] = m >= _w_size ? m - _w_size : 0;
				} while (--n);
				n = _w_size;
				p = n;
				do {
					m = s.prev[--p];
					s.prev[p] = m >= _w_size ? m - _w_size : 0;
				} while (--n);
				more += _w_size;
			}
			if (s.strm.avail_in === 0) break;
			n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
			s.lookahead += n;
			if (s.lookahead + s.insert >= MIN_MATCH) {
				str = s.strstart - s.insert;
				s.ins_h = s.window[str];
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + 1]) & s.hash_mask;
				while (s.insert) {
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
					s.prev[str & s.w_mask] = s.head[s.ins_h];
					s.head[s.ins_h] = str;
					str++;
					s.insert--;
					if (s.lookahead + s.insert < MIN_MATCH) break;
				}
			}
		} while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
	}
	function deflate_stored(s, flush) {
		var max_block_size = 65535;
		if (max_block_size > s.pending_buf_size - 5) max_block_size = s.pending_buf_size - 5;
		for (;;) {
			if (s.lookahead <= 1) {
				fill_window(s);
				if (s.lookahead === 0 && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			s.strstart += s.lookahead;
			s.lookahead = 0;
			var max_start = s.block_start + max_block_size;
			if (s.strstart === 0 || s.strstart >= max_start) {
				s.lookahead = s.strstart - max_start;
				s.strstart = max_start;
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
			if (s.strstart - s.block_start >= s.w_size - MIN_LOOKAHEAD) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = 0;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.strstart > s.block_start) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_NEED_MORE;
	}
	function deflate_fast(s, flush) {
		var hash_head;
		var bflush;
		for (;;) {
			if (s.lookahead < MIN_LOOKAHEAD) {
				fill_window(s);
				if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			hash_head = 0;
			if (s.lookahead >= MIN_MATCH) {
				/*** INSERT_STRING(s, s.strstart, hash_head); ***/
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
				hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
				s.head[s.ins_h] = s.strstart;
			}
			if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) s.match_length = longest_match(s, hash_head);
			if (s.match_length >= MIN_MATCH) {
				/*** _tr_tally_dist(s, s.strstart - s.match_start,
				s.match_length - MIN_MATCH, bflush); ***/
				bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
				s.lookahead -= s.match_length;
				if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
					s.match_length--;
					do {
						s.strstart++;
						/*** INSERT_STRING(s, s.strstart, hash_head); ***/
						s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
						hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
						s.head[s.ins_h] = s.strstart;
					} while (--s.match_length !== 0);
					s.strstart++;
				} else {
					s.strstart += s.match_length;
					s.match_length = 0;
					s.ins_h = s.window[s.strstart];
					s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + 1]) & s.hash_mask;
				}
			} else {
				/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
				bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
				s.lookahead--;
				s.strstart++;
			}
			if (bflush) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function deflate_slow(s, flush) {
		var hash_head;
		var bflush;
		var max_insert;
		for (;;) {
			if (s.lookahead < MIN_LOOKAHEAD) {
				fill_window(s);
				if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			hash_head = 0;
			if (s.lookahead >= MIN_MATCH) {
				/*** INSERT_STRING(s, s.strstart, hash_head); ***/
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
				hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
				s.head[s.ins_h] = s.strstart;
			}
			s.prev_length = s.match_length;
			s.prev_match = s.match_start;
			s.match_length = MIN_MATCH - 1;
			if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
				s.match_length = longest_match(s, hash_head);
				if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) s.match_length = MIN_MATCH - 1;
			}
			if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
				max_insert = s.strstart + s.lookahead - MIN_MATCH;
				/***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
				s.prev_length - MIN_MATCH, bflush);***/
				bflush = trees._tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
				s.lookahead -= s.prev_length - 1;
				s.prev_length -= 2;
				do
					if (++s.strstart <= max_insert) {
						/*** INSERT_STRING(s, s.strstart, hash_head); ***/
						s.ins_h = (s.ins_h << s.hash_shift ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
						hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
						s.head[s.ins_h] = s.strstart;
					}
				while (--s.prev_length !== 0);
				s.match_available = 0;
				s.match_length = MIN_MATCH - 1;
				s.strstart++;
				if (bflush) {
					/*** FLUSH_BLOCK(s, 0); ***/
					flush_block_only(s, false);
					if (s.strm.avail_out === 0) return BS_NEED_MORE;
				}
			} else if (s.match_available) {
				/*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
				bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
				if (bflush)
 /*** FLUSH_BLOCK_ONLY(s, 0) ***/
				flush_block_only(s, false);
				s.strstart++;
				s.lookahead--;
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			} else {
				s.match_available = 1;
				s.strstart++;
				s.lookahead--;
			}
		}
		if (s.match_available) {
			/*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
			bflush = trees._tr_tally(s, 0, s.window[s.strstart - 1]);
			s.match_available = 0;
		}
		s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function deflate_rle(s, flush) {
		var bflush;
		var prev;
		var scan, strend;
		var _win = s.window;
		for (;;) {
			if (s.lookahead <= MAX_MATCH) {
				fill_window(s);
				if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) return BS_NEED_MORE;
				if (s.lookahead === 0) break;
			}
			s.match_length = 0;
			if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
				scan = s.strstart - 1;
				prev = _win[scan];
				if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
					strend = s.strstart + MAX_MATCH;
					do					;
while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
					s.match_length = MAX_MATCH - (strend - scan);
					if (s.match_length > s.lookahead) s.match_length = s.lookahead;
				}
			}
			if (s.match_length >= MIN_MATCH) {
				/*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
				bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);
				s.lookahead -= s.match_length;
				s.strstart += s.match_length;
				s.match_length = 0;
			} else {
				/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
				bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
				s.lookahead--;
				s.strstart++;
			}
			if (bflush) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = 0;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function deflate_huff(s, flush) {
		var bflush;
		for (;;) {
			if (s.lookahead === 0) {
				fill_window(s);
				if (s.lookahead === 0) {
					if (flush === Z_NO_FLUSH) return BS_NEED_MORE;
					break;
				}
			}
			s.match_length = 0;
			/*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
			bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
			s.lookahead--;
			s.strstart++;
			if (bflush) {
				/*** FLUSH_BLOCK(s, 0); ***/
				flush_block_only(s, false);
				if (s.strm.avail_out === 0) return BS_NEED_MORE;
			}
		}
		s.insert = 0;
		if (flush === Z_FINISH) {
			/*** FLUSH_BLOCK(s, 1); ***/
			flush_block_only(s, true);
			if (s.strm.avail_out === 0) return BS_FINISH_STARTED;
			return BS_FINISH_DONE;
		}
		if (s.last_lit) {
			/*** FLUSH_BLOCK(s, 0); ***/
			flush_block_only(s, false);
			if (s.strm.avail_out === 0) return BS_NEED_MORE;
		}
		return BS_BLOCK_DONE;
	}
	function Config(good_length, max_lazy, nice_length, max_chain, func) {
		this.good_length = good_length;
		this.max_lazy = max_lazy;
		this.nice_length = nice_length;
		this.max_chain = max_chain;
		this.func = func;
	}
	var configuration_table = [
		new Config(0, 0, 0, 0, deflate_stored),
		new Config(4, 4, 8, 4, deflate_fast),
		new Config(4, 5, 16, 8, deflate_fast),
		new Config(4, 6, 32, 32, deflate_fast),
		new Config(4, 4, 16, 16, deflate_slow),
		new Config(8, 16, 32, 32, deflate_slow),
		new Config(8, 16, 128, 128, deflate_slow),
		new Config(8, 32, 128, 256, deflate_slow),
		new Config(32, 128, 258, 1024, deflate_slow),
		new Config(32, 258, 258, 4096, deflate_slow)
	];
	function lm_init(s) {
		s.window_size = 2 * s.w_size;
		/*** CLEAR_HASH(s); ***/
		zero(s.head);
		s.max_lazy_match = configuration_table[s.level].max_lazy;
		s.good_match = configuration_table[s.level].good_length;
		s.nice_match = configuration_table[s.level].nice_length;
		s.max_chain_length = configuration_table[s.level].max_chain;
		s.strstart = 0;
		s.block_start = 0;
		s.lookahead = 0;
		s.insert = 0;
		s.match_length = s.prev_length = MIN_MATCH - 1;
		s.match_available = 0;
		s.ins_h = 0;
	}
	function DeflateState() {
		this.strm = null;
		this.status = 0;
		this.pending_buf = null;
		this.pending_buf_size = 0;
		this.pending_out = 0;
		this.pending = 0;
		this.wrap = 0;
		this.gzhead = null;
		this.gzindex = 0;
		this.method = Z_DEFLATED;
		this.last_flush = -1;
		this.w_size = 0;
		this.w_bits = 0;
		this.w_mask = 0;
		this.window = null;
		this.window_size = 0;
		this.prev = null;
		this.head = null;
		this.ins_h = 0;
		this.hash_size = 0;
		this.hash_bits = 0;
		this.hash_mask = 0;
		this.hash_shift = 0;
		this.block_start = 0;
		this.match_length = 0;
		this.prev_match = 0;
		this.match_available = 0;
		this.strstart = 0;
		this.match_start = 0;
		this.lookahead = 0;
		this.prev_length = 0;
		this.max_chain_length = 0;
		this.max_lazy_match = 0;
		this.level = 0;
		this.strategy = 0;
		this.good_match = 0;
		this.nice_match = 0;
		this.dyn_ltree = new utils.Buf16(HEAP_SIZE * 2);
		this.dyn_dtree = new utils.Buf16((2 * D_CODES + 1) * 2);
		this.bl_tree = new utils.Buf16((2 * BL_CODES + 1) * 2);
		zero(this.dyn_ltree);
		zero(this.dyn_dtree);
		zero(this.bl_tree);
		this.l_desc = null;
		this.d_desc = null;
		this.bl_desc = null;
		this.bl_count = new utils.Buf16(MAX_BITS + 1);
		this.heap = new utils.Buf16(2 * L_CODES + 1);
		zero(this.heap);
		this.heap_len = 0;
		this.heap_max = 0;
		this.depth = new utils.Buf16(2 * L_CODES + 1);
		zero(this.depth);
		this.l_buf = 0;
		this.lit_bufsize = 0;
		this.last_lit = 0;
		this.d_buf = 0;
		this.opt_len = 0;
		this.static_len = 0;
		this.matches = 0;
		this.insert = 0;
		this.bi_buf = 0;
		this.bi_valid = 0;
	}
	function deflateResetKeep(strm) {
		var s;
		if (!strm || !strm.state) return err(strm, Z_STREAM_ERROR);
		strm.total_in = strm.total_out = 0;
		strm.data_type = Z_UNKNOWN;
		s = strm.state;
		s.pending = 0;
		s.pending_out = 0;
		if (s.wrap < 0) s.wrap = -s.wrap;
		s.status = s.wrap ? INIT_STATE : BUSY_STATE;
		strm.adler = s.wrap === 2 ? 0 : 1;
		s.last_flush = Z_NO_FLUSH;
		trees._tr_init(s);
		return Z_OK;
	}
	function deflateReset(strm) {
		var ret = deflateResetKeep(strm);
		if (ret === Z_OK) lm_init(strm.state);
		return ret;
	}
	function deflateSetHeader(strm, head) {
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		if (strm.state.wrap !== 2) return Z_STREAM_ERROR;
		strm.state.gzhead = head;
		return Z_OK;
	}
	function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
		if (!strm) return Z_STREAM_ERROR;
		var wrap = 1;
		if (level === Z_DEFAULT_COMPRESSION) level = 6;
		if (windowBits < 0) {
			wrap = 0;
			windowBits = -windowBits;
		} else if (windowBits > 15) {
			wrap = 2;
			windowBits -= 16;
		}
		if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED) return err(strm, Z_STREAM_ERROR);
		if (windowBits === 8) windowBits = 9;
		var s = new DeflateState();
		strm.state = s;
		s.strm = strm;
		s.wrap = wrap;
		s.gzhead = null;
		s.w_bits = windowBits;
		s.w_size = 1 << s.w_bits;
		s.w_mask = s.w_size - 1;
		s.hash_bits = memLevel + 7;
		s.hash_size = 1 << s.hash_bits;
		s.hash_mask = s.hash_size - 1;
		s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
		s.window = new utils.Buf8(s.w_size * 2);
		s.head = new utils.Buf16(s.hash_size);
		s.prev = new utils.Buf16(s.w_size);
		s.lit_bufsize = 1 << memLevel + 6;
		s.pending_buf_size = s.lit_bufsize * 4;
		s.pending_buf = new utils.Buf8(s.pending_buf_size);
		s.d_buf = 1 * s.lit_bufsize;
		s.l_buf = 3 * s.lit_bufsize;
		s.level = level;
		s.strategy = strategy;
		s.method = method;
		return deflateReset(strm);
	}
	function deflateInit(strm, level) {
		return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
	}
	function deflate(strm, flush) {
		var old_flush, s;
		var beg, val;
		if (!strm || !strm.state || flush > Z_BLOCK || flush < 0) return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
		s = strm.state;
		if (!strm.output || !strm.input && strm.avail_in !== 0 || s.status === FINISH_STATE && flush !== Z_FINISH) return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR : Z_STREAM_ERROR);
		s.strm = strm;
		old_flush = s.last_flush;
		s.last_flush = flush;
		if (s.status === INIT_STATE) if (s.wrap === 2) {
			strm.adler = 0;
			put_byte(s, 31);
			put_byte(s, 139);
			put_byte(s, 8);
			if (!s.gzhead) {
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, 0);
				put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
				put_byte(s, OS_CODE);
				s.status = BUSY_STATE;
			} else {
				put_byte(s, (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16));
				put_byte(s, s.gzhead.time & 255);
				put_byte(s, s.gzhead.time >> 8 & 255);
				put_byte(s, s.gzhead.time >> 16 & 255);
				put_byte(s, s.gzhead.time >> 24 & 255);
				put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
				put_byte(s, s.gzhead.os & 255);
				if (s.gzhead.extra && s.gzhead.extra.length) {
					put_byte(s, s.gzhead.extra.length & 255);
					put_byte(s, s.gzhead.extra.length >> 8 & 255);
				}
				if (s.gzhead.hcrc) strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
				s.gzindex = 0;
				s.status = EXTRA_STATE;
			}
		} else {
			var header = Z_DEFLATED + (s.w_bits - 8 << 4) << 8;
			var level_flags = -1;
			if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) level_flags = 0;
			else if (s.level < 6) level_flags = 1;
			else if (s.level === 6) level_flags = 2;
			else level_flags = 3;
			header |= level_flags << 6;
			if (s.strstart !== 0) header |= PRESET_DICT;
			header += 31 - header % 31;
			s.status = BUSY_STATE;
			putShortMSB(s, header);
			if (s.strstart !== 0) {
				putShortMSB(s, strm.adler >>> 16);
				putShortMSB(s, strm.adler & 65535);
			}
			strm.adler = 1;
		}
		if (s.status === EXTRA_STATE) if (s.gzhead.extra) {
			beg = s.pending;
			while (s.gzindex < (s.gzhead.extra.length & 65535)) {
				if (s.pending === s.pending_buf_size) {
					if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
					flush_pending(strm);
					beg = s.pending;
					if (s.pending === s.pending_buf_size) break;
				}
				put_byte(s, s.gzhead.extra[s.gzindex] & 255);
				s.gzindex++;
			}
			if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
			if (s.gzindex === s.gzhead.extra.length) {
				s.gzindex = 0;
				s.status = NAME_STATE;
			}
		} else s.status = NAME_STATE;
		if (s.status === NAME_STATE) if (s.gzhead.name) {
			beg = s.pending;
			do {
				if (s.pending === s.pending_buf_size) {
					if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
					flush_pending(strm);
					beg = s.pending;
					if (s.pending === s.pending_buf_size) {
						val = 1;
						break;
					}
				}
				if (s.gzindex < s.gzhead.name.length) val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
				else val = 0;
				put_byte(s, val);
			} while (val !== 0);
			if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
			if (val === 0) {
				s.gzindex = 0;
				s.status = COMMENT_STATE;
			}
		} else s.status = COMMENT_STATE;
		if (s.status === COMMENT_STATE) if (s.gzhead.comment) {
			beg = s.pending;
			do {
				if (s.pending === s.pending_buf_size) {
					if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
					flush_pending(strm);
					beg = s.pending;
					if (s.pending === s.pending_buf_size) {
						val = 1;
						break;
					}
				}
				if (s.gzindex < s.gzhead.comment.length) val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
				else val = 0;
				put_byte(s, val);
			} while (val !== 0);
			if (s.gzhead.hcrc && s.pending > beg) strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
			if (val === 0) s.status = HCRC_STATE;
		} else s.status = HCRC_STATE;
		if (s.status === HCRC_STATE) if (s.gzhead.hcrc) {
			if (s.pending + 2 > s.pending_buf_size) flush_pending(strm);
			if (s.pending + 2 <= s.pending_buf_size) {
				put_byte(s, strm.adler & 255);
				put_byte(s, strm.adler >> 8 & 255);
				strm.adler = 0;
				s.status = BUSY_STATE;
			}
		} else s.status = BUSY_STATE;
		if (s.pending !== 0) {
			flush_pending(strm);
			if (strm.avail_out === 0) {
				s.last_flush = -1;
				return Z_OK;
			}
		} else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH) return err(strm, Z_BUF_ERROR);
		if (s.status === FINISH_STATE && strm.avail_in !== 0) return err(strm, Z_BUF_ERROR);
		if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH && s.status !== FINISH_STATE) {
			var bstate = s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
			if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) s.status = FINISH_STATE;
			if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
				if (strm.avail_out === 0) s.last_flush = -1;
				return Z_OK;
			}
			if (bstate === BS_BLOCK_DONE) {
				if (flush === Z_PARTIAL_FLUSH) trees._tr_align(s);
				else if (flush !== Z_BLOCK) {
					trees._tr_stored_block(s, 0, 0, false);
					if (flush === Z_FULL_FLUSH) {
						/*** CLEAR_HASH(s); ***/ zero(s.head);
						if (s.lookahead === 0) {
							s.strstart = 0;
							s.block_start = 0;
							s.insert = 0;
						}
					}
				}
				flush_pending(strm);
				if (strm.avail_out === 0) {
					s.last_flush = -1;
					return Z_OK;
				}
			}
		}
		if (flush !== Z_FINISH) return Z_OK;
		if (s.wrap <= 0) return Z_STREAM_END;
		if (s.wrap === 2) {
			put_byte(s, strm.adler & 255);
			put_byte(s, strm.adler >> 8 & 255);
			put_byte(s, strm.adler >> 16 & 255);
			put_byte(s, strm.adler >> 24 & 255);
			put_byte(s, strm.total_in & 255);
			put_byte(s, strm.total_in >> 8 & 255);
			put_byte(s, strm.total_in >> 16 & 255);
			put_byte(s, strm.total_in >> 24 & 255);
		} else {
			putShortMSB(s, strm.adler >>> 16);
			putShortMSB(s, strm.adler & 65535);
		}
		flush_pending(strm);
		if (s.wrap > 0) s.wrap = -s.wrap;
		return s.pending !== 0 ? Z_OK : Z_STREAM_END;
	}
	function deflateEnd(strm) {
		var status;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		status = strm.state.status;
		if (status !== INIT_STATE && status !== EXTRA_STATE && status !== NAME_STATE && status !== COMMENT_STATE && status !== HCRC_STATE && status !== BUSY_STATE && status !== FINISH_STATE) return err(strm, Z_STREAM_ERROR);
		strm.state = null;
		return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
	}
	function deflateSetDictionary(strm, dictionary) {
		var dictLength = dictionary.length;
		var s;
		var str, n;
		var wrap;
		var avail;
		var next;
		var input;
		var tmpDict;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		s = strm.state;
		wrap = s.wrap;
		if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) return Z_STREAM_ERROR;
		if (wrap === 1) strm.adler = adler32(strm.adler, dictionary, dictLength, 0);
		s.wrap = 0;
		if (dictLength >= s.w_size) {
			if (wrap === 0) {
				/*** CLEAR_HASH(s); ***/
				zero(s.head);
				s.strstart = 0;
				s.block_start = 0;
				s.insert = 0;
			}
			tmpDict = new utils.Buf8(s.w_size);
			utils.arraySet(tmpDict, dictionary, dictLength - s.w_size, s.w_size, 0);
			dictionary = tmpDict;
			dictLength = s.w_size;
		}
		avail = strm.avail_in;
		next = strm.next_in;
		input = strm.input;
		strm.avail_in = dictLength;
		strm.next_in = 0;
		strm.input = dictionary;
		fill_window(s);
		while (s.lookahead >= MIN_MATCH) {
			str = s.strstart;
			n = s.lookahead - (MIN_MATCH - 1);
			do {
				s.ins_h = (s.ins_h << s.hash_shift ^ s.window[str + MIN_MATCH - 1]) & s.hash_mask;
				s.prev[str & s.w_mask] = s.head[s.ins_h];
				s.head[s.ins_h] = str;
				str++;
			} while (--n);
			s.strstart = str;
			s.lookahead = MIN_MATCH - 1;
			fill_window(s);
		}
		s.strstart += s.lookahead;
		s.block_start = s.strstart;
		s.insert = s.lookahead;
		s.lookahead = 0;
		s.match_length = s.prev_length = MIN_MATCH - 1;
		s.match_available = 0;
		strm.next_in = next;
		strm.input = input;
		strm.avail_in = avail;
		s.wrap = wrap;
		return Z_OK;
	}
	exports.deflateInit = deflateInit;
	exports.deflateInit2 = deflateInit2;
	exports.deflateReset = deflateReset;
	exports.deflateResetKeep = deflateResetKeep;
	exports.deflateSetHeader = deflateSetHeader;
	exports.deflate = deflate;
	exports.deflateEnd = deflateEnd;
	exports.deflateSetDictionary = deflateSetDictionary;
	exports.deflateInfo = "pako deflate (from Nodeca project)";
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/utils/strings.js
var require_strings = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var STR_APPLY_OK = true;
	var STR_APPLY_UIA_OK = true;
	try {
		String.fromCharCode.apply(null, [0]);
	} catch (__) {
		STR_APPLY_OK = false;
	}
	try {
		String.fromCharCode.apply(null, new Uint8Array(1));
	} catch (__) {
		STR_APPLY_UIA_OK = false;
	}
	var _utf8len = new utils.Buf8(256);
	for (var q = 0; q < 256; q++) _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
	_utf8len[254] = _utf8len[254] = 1;
	exports.string2buf = function(str) {
		var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
		for (m_pos = 0; m_pos < str_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
		}
		buf = new utils.Buf8(buf_len);
		for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
			c = str.charCodeAt(m_pos);
			if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
				c2 = str.charCodeAt(m_pos + 1);
				if ((c2 & 64512) === 56320) {
					c = 65536 + (c - 55296 << 10) + (c2 - 56320);
					m_pos++;
				}
			}
			if (c < 128) buf[i++] = c;
			else if (c < 2048) {
				buf[i++] = 192 | c >>> 6;
				buf[i++] = 128 | c & 63;
			} else if (c < 65536) {
				buf[i++] = 224 | c >>> 12;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			} else {
				buf[i++] = 240 | c >>> 18;
				buf[i++] = 128 | c >>> 12 & 63;
				buf[i++] = 128 | c >>> 6 & 63;
				buf[i++] = 128 | c & 63;
			}
		}
		return buf;
	};
	function buf2binstring(buf, len) {
		if (len < 65534) {
			if (buf.subarray && STR_APPLY_UIA_OK || !buf.subarray && STR_APPLY_OK) return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
		}
		var result = "";
		for (var i = 0; i < len; i++) result += String.fromCharCode(buf[i]);
		return result;
	}
	exports.buf2binstring = function(buf) {
		return buf2binstring(buf, buf.length);
	};
	exports.binstring2buf = function(str) {
		var buf = new utils.Buf8(str.length);
		for (var i = 0, len = buf.length; i < len; i++) buf[i] = str.charCodeAt(i);
		return buf;
	};
	exports.buf2string = function(buf, max) {
		var i, out, c, c_len;
		var len = max || buf.length;
		var utf16buf = new Array(len * 2);
		for (out = 0, i = 0; i < len;) {
			c = buf[i++];
			if (c < 128) {
				utf16buf[out++] = c;
				continue;
			}
			c_len = _utf8len[c];
			if (c_len > 4) {
				utf16buf[out++] = 65533;
				i += c_len - 1;
				continue;
			}
			c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
			while (c_len > 1 && i < len) {
				c = c << 6 | buf[i++] & 63;
				c_len--;
			}
			if (c_len > 1) {
				utf16buf[out++] = 65533;
				continue;
			}
			if (c < 65536) utf16buf[out++] = c;
			else {
				c -= 65536;
				utf16buf[out++] = 55296 | c >> 10 & 1023;
				utf16buf[out++] = 56320 | c & 1023;
			}
		}
		return buf2binstring(utf16buf, out);
	};
	exports.utf8border = function(buf, max) {
		var pos;
		max = max || buf.length;
		if (max > buf.length) max = buf.length;
		pos = max - 1;
		while (pos >= 0 && (buf[pos] & 192) === 128) pos--;
		if (pos < 0) return max;
		if (pos === 0) return max;
		return pos + _utf8len[buf[pos]] > max ? pos : max;
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/zstream.js
var require_zstream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function ZStream() {
		this.input = null;
		this.next_in = 0;
		this.avail_in = 0;
		this.total_in = 0;
		this.output = null;
		this.next_out = 0;
		this.avail_out = 0;
		this.total_out = 0;
		this.msg = "";
		this.state = null;
		this.data_type = 2;
		this.adler = 0;
	}
	module.exports = ZStream;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/deflate.js
var require_deflate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var zlib_deflate = require_deflate$1();
	var utils = require_common();
	var strings = require_strings();
	var msg = require_messages();
	var ZStream = require_zstream();
	var toString = Object.prototype.toString;
	var Z_NO_FLUSH = 0;
	var Z_FINISH = 4;
	var Z_OK = 0;
	var Z_STREAM_END = 1;
	var Z_SYNC_FLUSH = 2;
	var Z_DEFAULT_COMPRESSION = -1;
	var Z_DEFAULT_STRATEGY = 0;
	var Z_DEFLATED = 8;
	/**
	* class Deflate
	*
	* Generic JS-style wrapper for zlib calls. If you don't need
	* streaming behaviour - use more simple functions: [[deflate]],
	* [[deflateRaw]] and [[gzip]].
	**/
	/**
	* Deflate.result -> Uint8Array|Array
	*
	* Compressed result, generated by default [[Deflate#onData]]
	* and [[Deflate#onEnd]] handlers. Filled after you push last chunk
	* (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
	* push a chunk with explicit flush (call [[Deflate#push]] with
	* `Z_SYNC_FLUSH` param).
	**/
	/**
	* Deflate.err -> Number
	*
	* Error code after deflate finished. 0 (Z_OK) on success.
	* You will not need it in real life, because deflate errors
	* are possible only on wrong options or bad `onData` / `onEnd`
	* custom handlers.
	**/
	/**
	* Deflate.msg -> String
	*
	* Error message, if [[Deflate.err]] != 0
	**/
	/**
	* new Deflate(options)
	* - options (Object): zlib deflate options.
	*
	* Creates new deflator instance with specified params. Throws exception
	* on bad params. Supported options:
	*
	* - `level`
	* - `windowBits`
	* - `memLevel`
	* - `strategy`
	* - `dictionary`
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information on these.
	*
	* Additional options, for internal needs:
	*
	* - `chunkSize` - size of generated data chunks (16K by default)
	* - `raw` (Boolean) - do raw deflate
	* - `gzip` (Boolean) - create gzip wrapper
	* - `to` (String) - if equal to 'string', then result will be "binary string"
	*    (each char code [0..255])
	* - `header` (Object) - custom header for gzip
	*   - `text` (Boolean) - true if compressed data believed to be text
	*   - `time` (Number) - modification time, unix timestamp
	*   - `os` (Number) - operation system code
	*   - `extra` (Array) - array of bytes with extra data (max 65536)
	*   - `name` (String) - file name (binary string)
	*   - `comment` (String) - comment (binary string)
	*   - `hcrc` (Boolean) - true if header crc should be added
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
	*   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
	*
	* var deflate = new pako.Deflate({ level: 3});
	*
	* deflate.push(chunk1, false);
	* deflate.push(chunk2, true);  // true -> last chunk
	*
	* if (deflate.err) { throw new Error(deflate.err); }
	*
	* console.log(deflate.result);
	* ```
	**/
	function Deflate(options) {
		if (!(this instanceof Deflate)) return new Deflate(options);
		this.options = utils.assign({
			level: Z_DEFAULT_COMPRESSION,
			method: Z_DEFLATED,
			chunkSize: 16384,
			windowBits: 15,
			memLevel: 8,
			strategy: Z_DEFAULT_STRATEGY,
			to: ""
		}, options || {});
		var opt = this.options;
		if (opt.raw && opt.windowBits > 0) opt.windowBits = -opt.windowBits;
		else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) opt.windowBits += 16;
		this.err = 0;
		this.msg = "";
		this.ended = false;
		this.chunks = [];
		this.strm = new ZStream();
		this.strm.avail_out = 0;
		var status = zlib_deflate.deflateInit2(this.strm, opt.level, opt.method, opt.windowBits, opt.memLevel, opt.strategy);
		if (status !== Z_OK) throw new Error(msg[status]);
		if (opt.header) zlib_deflate.deflateSetHeader(this.strm, opt.header);
		if (opt.dictionary) {
			var dict;
			if (typeof opt.dictionary === "string") dict = strings.string2buf(opt.dictionary);
			else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") dict = new Uint8Array(opt.dictionary);
			else dict = opt.dictionary;
			status = zlib_deflate.deflateSetDictionary(this.strm, dict);
			if (status !== Z_OK) throw new Error(msg[status]);
			this._dict_set = true;
		}
	}
	/**
	* Deflate#push(data[, mode]) -> Boolean
	* - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
	*   converted to utf8 byte sequence.
	* - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
	*   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
	*
	* Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
	* new compressed chunks. Returns `true` on success. The last data block must have
	* mode Z_FINISH (or `true`). That will flush internal pending buffers and call
	* [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
	* can use mode Z_SYNC_FLUSH, keeping the compression context.
	*
	* On fail call [[Deflate#onEnd]] with error code and return false.
	*
	* We strongly recommend to use `Uint8Array` on input for best speed (output
	* array format is detected automatically). Also, don't skip last param and always
	* use the same type in your code (boolean or number). That will improve JS speed.
	*
	* For regular `Array`-s make sure all elements are [0..255].
	*
	* ##### Example
	*
	* ```javascript
	* push(chunk, false); // push one of data chunks
	* ...
	* push(chunk, true);  // push last chunk
	* ```
	**/
	Deflate.prototype.push = function(data, mode) {
		var strm = this.strm;
		var chunkSize = this.options.chunkSize;
		var status, _mode;
		if (this.ended) return false;
		_mode = mode === ~~mode ? mode : mode === true ? Z_FINISH : Z_NO_FLUSH;
		if (typeof data === "string") strm.input = strings.string2buf(data);
		else if (toString.call(data) === "[object ArrayBuffer]") strm.input = new Uint8Array(data);
		else strm.input = data;
		strm.next_in = 0;
		strm.avail_in = strm.input.length;
		do {
			if (strm.avail_out === 0) {
				strm.output = new utils.Buf8(chunkSize);
				strm.next_out = 0;
				strm.avail_out = chunkSize;
			}
			status = zlib_deflate.deflate(strm, _mode);
			if (status !== Z_STREAM_END && status !== Z_OK) {
				this.onEnd(status);
				this.ended = true;
				return false;
			}
			if (strm.avail_out === 0 || strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH)) if (this.options.to === "string") this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
			else this.onData(utils.shrinkBuf(strm.output, strm.next_out));
		} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);
		if (_mode === Z_FINISH) {
			status = zlib_deflate.deflateEnd(this.strm);
			this.onEnd(status);
			this.ended = true;
			return status === Z_OK;
		}
		if (_mode === Z_SYNC_FLUSH) {
			this.onEnd(Z_OK);
			strm.avail_out = 0;
			return true;
		}
		return true;
	};
	/**
	* Deflate#onData(chunk) -> Void
	* - chunk (Uint8Array|Array|String): output data. Type of array depends
	*   on js engine support. When string output requested, each chunk
	*   will be string.
	*
	* By default, stores data blocks in `chunks[]` property and glue
	* those in `onEnd`. Override this handler, if you need another behaviour.
	**/
	Deflate.prototype.onData = function(chunk) {
		this.chunks.push(chunk);
	};
	/**
	* Deflate#onEnd(status) -> Void
	* - status (Number): deflate status. 0 (Z_OK) on success,
	*   other if not.
	*
	* Called once after you tell deflate that the input stream is
	* complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
	* or if an error happened. By default - join collected chunks,
	* free memory and fill `results` / `err` properties.
	**/
	Deflate.prototype.onEnd = function(status) {
		if (status === Z_OK) if (this.options.to === "string") this.result = this.chunks.join("");
		else this.result = utils.flattenChunks(this.chunks);
		this.chunks = [];
		this.err = status;
		this.msg = this.strm.msg;
	};
	/**
	* deflate(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to compress.
	* - options (Object): zlib deflate options.
	*
	* Compress `data` with deflate algorithm and `options`.
	*
	* Supported options are:
	*
	* - level
	* - windowBits
	* - memLevel
	* - strategy
	* - dictionary
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information on these.
	*
	* Sugar (options):
	*
	* - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
	*   negative windowBits implicitly.
	* - `to` (String) - if equal to 'string', then result will be "binary string"
	*    (each char code [0..255])
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
	*
	* console.log(pako.deflate(data));
	* ```
	**/
	function deflate(input, options) {
		var deflator = new Deflate(options);
		deflator.push(input, true);
		if (deflator.err) throw deflator.msg || msg[deflator.err];
		return deflator.result;
	}
	/**
	* deflateRaw(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to compress.
	* - options (Object): zlib deflate options.
	*
	* The same as [[deflate]], but creates raw data, without wrapper
	* (header and adler32 crc).
	**/
	function deflateRaw(input, options) {
		options = options || {};
		options.raw = true;
		return deflate(input, options);
	}
	/**
	* gzip(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to compress.
	* - options (Object): zlib deflate options.
	*
	* The same as [[deflate]], but create gzip wrapper instead of
	* deflate one.
	**/
	function gzip(input, options) {
		options = options || {};
		options.gzip = true;
		return deflate(input, options);
	}
	exports.Deflate = Deflate;
	exports.deflate = deflate;
	exports.deflateRaw = deflateRaw;
	exports.gzip = gzip;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inffast.js
var require_inffast = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BAD = 30;
	var TYPE = 12;
	module.exports = function inflate_fast(strm, start) {
		var state;
		var _in;
		var last;
		var _out;
		var beg;
		var end;
		var dmax;
		var wsize;
		var whave;
		var wnext;
		var s_window;
		var hold;
		var bits;
		var lcode;
		var dcode;
		var lmask;
		var dmask;
		var here;
		var op;
		var len;
		var dist;
		var from;
		var from_source;
		var input, output;
		state = strm.state;
		_in = strm.next_in;
		input = strm.input;
		last = _in + (strm.avail_in - 5);
		_out = strm.next_out;
		output = strm.output;
		beg = _out - (start - strm.avail_out);
		end = _out + (strm.avail_out - 257);
		dmax = state.dmax;
		wsize = state.wsize;
		whave = state.whave;
		wnext = state.wnext;
		s_window = state.window;
		hold = state.hold;
		bits = state.bits;
		lcode = state.lencode;
		dcode = state.distcode;
		lmask = (1 << state.lenbits) - 1;
		dmask = (1 << state.distbits) - 1;
		top: do {
			if (bits < 15) {
				hold += input[_in++] << bits;
				bits += 8;
				hold += input[_in++] << bits;
				bits += 8;
			}
			here = lcode[hold & lmask];
			dolen: for (;;) {
				op = here >>> 24;
				hold >>>= op;
				bits -= op;
				op = here >>> 16 & 255;
				if (op === 0) output[_out++] = here & 65535;
				else if (op & 16) {
					len = here & 65535;
					op &= 15;
					if (op) {
						if (bits < op) {
							hold += input[_in++] << bits;
							bits += 8;
						}
						len += hold & (1 << op) - 1;
						hold >>>= op;
						bits -= op;
					}
					if (bits < 15) {
						hold += input[_in++] << bits;
						bits += 8;
						hold += input[_in++] << bits;
						bits += 8;
					}
					here = dcode[hold & dmask];
					dodist: for (;;) {
						op = here >>> 24;
						hold >>>= op;
						bits -= op;
						op = here >>> 16 & 255;
						if (op & 16) {
							dist = here & 65535;
							op &= 15;
							if (bits < op) {
								hold += input[_in++] << bits;
								bits += 8;
								if (bits < op) {
									hold += input[_in++] << bits;
									bits += 8;
								}
							}
							dist += hold & (1 << op) - 1;
							if (dist > dmax) {
								strm.msg = "invalid distance too far back";
								state.mode = BAD;
								break top;
							}
							hold >>>= op;
							bits -= op;
							op = _out - beg;
							if (dist > op) {
								op = dist - op;
								if (op > whave) {
									if (state.sane) {
										strm.msg = "invalid distance too far back";
										state.mode = BAD;
										break top;
									}
								}
								from = 0;
								from_source = s_window;
								if (wnext === 0) {
									from += wsize - op;
									if (op < len) {
										len -= op;
										do
											output[_out++] = s_window[from++];
										while (--op);
										from = _out - dist;
										from_source = output;
									}
								} else if (wnext < op) {
									from += wsize + wnext - op;
									op -= wnext;
									if (op < len) {
										len -= op;
										do
											output[_out++] = s_window[from++];
										while (--op);
										from = 0;
										if (wnext < len) {
											op = wnext;
											len -= op;
											do
												output[_out++] = s_window[from++];
											while (--op);
											from = _out - dist;
											from_source = output;
										}
									}
								} else {
									from += wnext - op;
									if (op < len) {
										len -= op;
										do
											output[_out++] = s_window[from++];
										while (--op);
										from = _out - dist;
										from_source = output;
									}
								}
								while (len > 2) {
									output[_out++] = from_source[from++];
									output[_out++] = from_source[from++];
									output[_out++] = from_source[from++];
									len -= 3;
								}
								if (len) {
									output[_out++] = from_source[from++];
									if (len > 1) output[_out++] = from_source[from++];
								}
							} else {
								from = _out - dist;
								do {
									output[_out++] = output[from++];
									output[_out++] = output[from++];
									output[_out++] = output[from++];
									len -= 3;
								} while (len > 2);
								if (len) {
									output[_out++] = output[from++];
									if (len > 1) output[_out++] = output[from++];
								}
							}
						} else if ((op & 64) === 0) {
							here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
							continue dodist;
						} else {
							strm.msg = "invalid distance code";
							state.mode = BAD;
							break top;
						}
						break;
					}
				} else if ((op & 64) === 0) {
					here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
					continue dolen;
				} else if (op & 32) {
					state.mode = TYPE;
					break top;
				} else {
					strm.msg = "invalid literal/length code";
					state.mode = BAD;
					break top;
				}
				break;
			}
		} while (_in < last && _out < end);
		len = bits >> 3;
		_in -= len;
		bits -= len << 3;
		hold &= (1 << bits) - 1;
		strm.next_in = _in;
		strm.next_out = _out;
		strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
		strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
		state.hold = hold;
		state.bits = bits;
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inftrees.js
var require_inftrees = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_common();
	var MAXBITS = 15;
	var ENOUGH_LENS = 852;
	var ENOUGH_DISTS = 592;
	var CODES = 0;
	var LENS = 1;
	var DISTS = 2;
	var lbase = [
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11,
		13,
		15,
		17,
		19,
		23,
		27,
		31,
		35,
		43,
		51,
		59,
		67,
		83,
		99,
		115,
		131,
		163,
		195,
		227,
		258,
		0,
		0
	];
	var lext = [
		16,
		16,
		16,
		16,
		16,
		16,
		16,
		16,
		17,
		17,
		17,
		17,
		18,
		18,
		18,
		18,
		19,
		19,
		19,
		19,
		20,
		20,
		20,
		20,
		21,
		21,
		21,
		21,
		16,
		72,
		78
	];
	var dbase = [
		1,
		2,
		3,
		4,
		5,
		7,
		9,
		13,
		17,
		25,
		33,
		49,
		65,
		97,
		129,
		193,
		257,
		385,
		513,
		769,
		1025,
		1537,
		2049,
		3073,
		4097,
		6145,
		8193,
		12289,
		16385,
		24577,
		0,
		0
	];
	var dext = [
		16,
		16,
		16,
		16,
		17,
		17,
		18,
		18,
		19,
		19,
		20,
		20,
		21,
		21,
		22,
		22,
		23,
		23,
		24,
		24,
		25,
		25,
		26,
		26,
		27,
		27,
		28,
		28,
		29,
		29,
		64,
		64
	];
	module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts) {
		var bits = opts.bits;
		var len = 0;
		var sym = 0;
		var min = 0, max = 0;
		var root = 0;
		var curr = 0;
		var drop = 0;
		var left = 0;
		var used = 0;
		var huff = 0;
		var incr;
		var fill;
		var low;
		var mask;
		var next;
		var base = null;
		var base_index = 0;
		var end;
		var count = new utils.Buf16(MAXBITS + 1);
		var offs = new utils.Buf16(MAXBITS + 1);
		var extra = null;
		var extra_index = 0;
		var here_bits, here_op, here_val;
		for (len = 0; len <= MAXBITS; len++) count[len] = 0;
		for (sym = 0; sym < codes; sym++) count[lens[lens_index + sym]]++;
		root = bits;
		for (max = MAXBITS; max >= 1; max--) if (count[max] !== 0) break;
		if (root > max) root = max;
		if (max === 0) {
			table[table_index++] = 20971520;
			table[table_index++] = 20971520;
			opts.bits = 1;
			return 0;
		}
		for (min = 1; min < max; min++) if (count[min] !== 0) break;
		if (root < min) root = min;
		left = 1;
		for (len = 1; len <= MAXBITS; len++) {
			left <<= 1;
			left -= count[len];
			if (left < 0) return -1;
		}
		if (left > 0 && (type === CODES || max !== 1)) return -1;
		offs[1] = 0;
		for (len = 1; len < MAXBITS; len++) offs[len + 1] = offs[len] + count[len];
		for (sym = 0; sym < codes; sym++) if (lens[lens_index + sym] !== 0) work[offs[lens[lens_index + sym]]++] = sym;
		if (type === CODES) {
			base = extra = work;
			end = 19;
		} else if (type === LENS) {
			base = lbase;
			base_index -= 257;
			extra = lext;
			extra_index -= 257;
			end = 256;
		} else {
			base = dbase;
			extra = dext;
			end = -1;
		}
		huff = 0;
		sym = 0;
		len = min;
		next = table_index;
		curr = root;
		drop = 0;
		low = -1;
		used = 1 << root;
		mask = used - 1;
		if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
		for (;;) {
			here_bits = len - drop;
			if (work[sym] < end) {
				here_op = 0;
				here_val = work[sym];
			} else if (work[sym] > end) {
				here_op = extra[extra_index + work[sym]];
				here_val = base[base_index + work[sym]];
			} else {
				here_op = 96;
				here_val = 0;
			}
			incr = 1 << len - drop;
			fill = 1 << curr;
			min = fill;
			do {
				fill -= incr;
				table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
			} while (fill !== 0);
			incr = 1 << len - 1;
			while (huff & incr) incr >>= 1;
			if (incr !== 0) {
				huff &= incr - 1;
				huff += incr;
			} else huff = 0;
			sym++;
			if (--count[len] === 0) {
				if (len === max) break;
				len = lens[lens_index + work[sym]];
			}
			if (len > root && (huff & mask) !== low) {
				if (drop === 0) drop = root;
				next += min;
				curr = len - drop;
				left = 1 << curr;
				while (curr + drop < max) {
					left -= count[curr + drop];
					if (left <= 0) break;
					curr++;
					left <<= 1;
				}
				used += 1 << curr;
				if (type === LENS && used > ENOUGH_LENS || type === DISTS && used > ENOUGH_DISTS) return 1;
				low = huff & mask;
				table[low] = root << 24 | curr << 16 | next - table_index | 0;
			}
		}
		if (huff !== 0) table[next + huff] = len - drop << 24 | 4194304;
		opts.bits = root;
		return 0;
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/inflate.js
var require_inflate$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var utils = require_common();
	var adler32 = require_adler32();
	var crc32 = require_crc32();
	var inflate_fast = require_inffast();
	var inflate_table = require_inftrees();
	var CODES = 0;
	var LENS = 1;
	var DISTS = 2;
	var Z_FINISH = 4;
	var Z_BLOCK = 5;
	var Z_TREES = 6;
	var Z_OK = 0;
	var Z_STREAM_END = 1;
	var Z_NEED_DICT = 2;
	var Z_STREAM_ERROR = -2;
	var Z_DATA_ERROR = -3;
	var Z_MEM_ERROR = -4;
	var Z_BUF_ERROR = -5;
	var Z_DEFLATED = 8;
	var HEAD = 1;
	var FLAGS = 2;
	var TIME = 3;
	var OS = 4;
	var EXLEN = 5;
	var EXTRA = 6;
	var NAME = 7;
	var COMMENT = 8;
	var HCRC = 9;
	var DICTID = 10;
	var DICT = 11;
	var TYPE = 12;
	var TYPEDO = 13;
	var STORED = 14;
	var COPY_ = 15;
	var COPY = 16;
	var TABLE = 17;
	var LENLENS = 18;
	var CODELENS = 19;
	var LEN_ = 20;
	var LEN = 21;
	var LENEXT = 22;
	var DIST = 23;
	var DISTEXT = 24;
	var MATCH = 25;
	var LIT = 26;
	var CHECK = 27;
	var LENGTH = 28;
	var DONE = 29;
	var BAD = 30;
	var MEM = 31;
	var SYNC = 32;
	var ENOUGH_LENS = 852;
	var ENOUGH_DISTS = 592;
	var DEF_WBITS = 15;
	function zswap32(q) {
		return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
	}
	function InflateState() {
		this.mode = 0;
		this.last = false;
		this.wrap = 0;
		this.havedict = false;
		this.flags = 0;
		this.dmax = 0;
		this.check = 0;
		this.total = 0;
		this.head = null;
		this.wbits = 0;
		this.wsize = 0;
		this.whave = 0;
		this.wnext = 0;
		this.window = null;
		this.hold = 0;
		this.bits = 0;
		this.length = 0;
		this.offset = 0;
		this.extra = 0;
		this.lencode = null;
		this.distcode = null;
		this.lenbits = 0;
		this.distbits = 0;
		this.ncode = 0;
		this.nlen = 0;
		this.ndist = 0;
		this.have = 0;
		this.next = null;
		this.lens = new utils.Buf16(320);
		this.work = new utils.Buf16(288);
		this.lendyn = null;
		this.distdyn = null;
		this.sane = 0;
		this.back = 0;
		this.was = 0;
	}
	function inflateResetKeep(strm) {
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		strm.total_in = strm.total_out = state.total = 0;
		strm.msg = "";
		if (state.wrap) strm.adler = state.wrap & 1;
		state.mode = HEAD;
		state.last = 0;
		state.havedict = 0;
		state.dmax = 32768;
		state.head = null;
		state.hold = 0;
		state.bits = 0;
		state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
		state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);
		state.sane = 1;
		state.back = -1;
		return Z_OK;
	}
	function inflateReset(strm) {
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		state.wsize = 0;
		state.whave = 0;
		state.wnext = 0;
		return inflateResetKeep(strm);
	}
	function inflateReset2(strm, windowBits) {
		var wrap;
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		if (windowBits < 0) {
			wrap = 0;
			windowBits = -windowBits;
		} else {
			wrap = (windowBits >> 4) + 1;
			if (windowBits < 48) windowBits &= 15;
		}
		if (windowBits && (windowBits < 8 || windowBits > 15)) return Z_STREAM_ERROR;
		if (state.window !== null && state.wbits !== windowBits) state.window = null;
		state.wrap = wrap;
		state.wbits = windowBits;
		return inflateReset(strm);
	}
	function inflateInit2(strm, windowBits) {
		var ret;
		var state;
		if (!strm) return Z_STREAM_ERROR;
		state = new InflateState();
		strm.state = state;
		state.window = null;
		ret = inflateReset2(strm, windowBits);
		if (ret !== Z_OK) strm.state = null;
		return ret;
	}
	function inflateInit(strm) {
		return inflateInit2(strm, DEF_WBITS);
	}
	var virgin = true;
	var lenfix, distfix;
	function fixedtables(state) {
		if (virgin) {
			var sym;
			lenfix = new utils.Buf32(512);
			distfix = new utils.Buf32(32);
			sym = 0;
			while (sym < 144) state.lens[sym++] = 8;
			while (sym < 256) state.lens[sym++] = 9;
			while (sym < 280) state.lens[sym++] = 7;
			while (sym < 288) state.lens[sym++] = 8;
			inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
			sym = 0;
			while (sym < 32) state.lens[sym++] = 5;
			inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
			virgin = false;
		}
		state.lencode = lenfix;
		state.lenbits = 9;
		state.distcode = distfix;
		state.distbits = 5;
	}
	function updatewindow(strm, src, end, copy) {
		var dist;
		var state = strm.state;
		if (state.window === null) {
			state.wsize = 1 << state.wbits;
			state.wnext = 0;
			state.whave = 0;
			state.window = new utils.Buf8(state.wsize);
		}
		if (copy >= state.wsize) {
			utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
			state.wnext = 0;
			state.whave = state.wsize;
		} else {
			dist = state.wsize - state.wnext;
			if (dist > copy) dist = copy;
			utils.arraySet(state.window, src, end - copy, dist, state.wnext);
			copy -= dist;
			if (copy) {
				utils.arraySet(state.window, src, end - copy, copy, 0);
				state.wnext = copy;
				state.whave = state.wsize;
			} else {
				state.wnext += dist;
				if (state.wnext === state.wsize) state.wnext = 0;
				if (state.whave < state.wsize) state.whave += dist;
			}
		}
		return 0;
	}
	function inflate(strm, flush) {
		var state;
		var input, output;
		var next;
		var put;
		var have, left;
		var hold;
		var bits;
		var _in, _out;
		var copy;
		var from;
		var from_source;
		var here = 0;
		var here_bits, here_op, here_val;
		var last_bits, last_op, last_val;
		var len;
		var ret;
		var hbuf = new utils.Buf8(4);
		var opts;
		var n;
		var order = [
			16,
			17,
			18,
			0,
			8,
			7,
			9,
			6,
			10,
			5,
			11,
			4,
			12,
			3,
			13,
			2,
			14,
			1,
			15
		];
		if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) return Z_STREAM_ERROR;
		state = strm.state;
		if (state.mode === TYPE) state.mode = TYPEDO;
		put = strm.next_out;
		output = strm.output;
		left = strm.avail_out;
		next = strm.next_in;
		input = strm.input;
		have = strm.avail_in;
		hold = state.hold;
		bits = state.bits;
		_in = have;
		_out = left;
		ret = Z_OK;
		inf_leave: for (;;) switch (state.mode) {
			case HEAD:
				if (state.wrap === 0) {
					state.mode = TYPEDO;
					break;
				}
				while (bits < 16) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (state.wrap & 2 && hold === 35615) {
					state.check = 0;
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					state.check = crc32(state.check, hbuf, 2, 0);
					hold = 0;
					bits = 0;
					state.mode = FLAGS;
					break;
				}
				state.flags = 0;
				if (state.head) state.head.done = false;
				if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
					strm.msg = "incorrect header check";
					state.mode = BAD;
					break;
				}
				if ((hold & 15) !== Z_DEFLATED) {
					strm.msg = "unknown compression method";
					state.mode = BAD;
					break;
				}
				hold >>>= 4;
				bits -= 4;
				len = (hold & 15) + 8;
				if (state.wbits === 0) state.wbits = len;
				else if (len > state.wbits) {
					strm.msg = "invalid window size";
					state.mode = BAD;
					break;
				}
				state.dmax = 1 << len;
				strm.adler = state.check = 1;
				state.mode = hold & 512 ? DICTID : TYPE;
				hold = 0;
				bits = 0;
				break;
			case FLAGS:
				while (bits < 16) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				state.flags = hold;
				if ((state.flags & 255) !== Z_DEFLATED) {
					strm.msg = "unknown compression method";
					state.mode = BAD;
					break;
				}
				if (state.flags & 57344) {
					strm.msg = "unknown header flags set";
					state.mode = BAD;
					break;
				}
				if (state.head) state.head.text = hold >> 8 & 1;
				if (state.flags & 512) {
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					state.check = crc32(state.check, hbuf, 2, 0);
				}
				hold = 0;
				bits = 0;
				state.mode = TIME;
			case TIME:
				while (bits < 32) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (state.head) state.head.time = hold;
				if (state.flags & 512) {
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					hbuf[2] = hold >>> 16 & 255;
					hbuf[3] = hold >>> 24 & 255;
					state.check = crc32(state.check, hbuf, 4, 0);
				}
				hold = 0;
				bits = 0;
				state.mode = OS;
			case OS:
				while (bits < 16) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (state.head) {
					state.head.xflags = hold & 255;
					state.head.os = hold >> 8;
				}
				if (state.flags & 512) {
					hbuf[0] = hold & 255;
					hbuf[1] = hold >>> 8 & 255;
					state.check = crc32(state.check, hbuf, 2, 0);
				}
				hold = 0;
				bits = 0;
				state.mode = EXLEN;
			case EXLEN:
				if (state.flags & 1024) {
					while (bits < 16) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.length = hold;
					if (state.head) state.head.extra_len = hold;
					if (state.flags & 512) {
						hbuf[0] = hold & 255;
						hbuf[1] = hold >>> 8 & 255;
						state.check = crc32(state.check, hbuf, 2, 0);
					}
					hold = 0;
					bits = 0;
				} else if (state.head) state.head.extra = null;
				state.mode = EXTRA;
			case EXTRA:
				if (state.flags & 1024) {
					copy = state.length;
					if (copy > have) copy = have;
					if (copy) {
						if (state.head) {
							len = state.head.extra_len - state.length;
							if (!state.head.extra) state.head.extra = new Array(state.head.extra_len);
							utils.arraySet(state.head.extra, input, next, copy, len);
						}
						if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
						have -= copy;
						next += copy;
						state.length -= copy;
					}
					if (state.length) break inf_leave;
				}
				state.length = 0;
				state.mode = NAME;
			case NAME:
				if (state.flags & 2048) {
					if (have === 0) break inf_leave;
					copy = 0;
					do {
						len = input[next + copy++];
						if (state.head && len && state.length < 65536) state.head.name += String.fromCharCode(len);
					} while (len && copy < have);
					if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
					have -= copy;
					next += copy;
					if (len) break inf_leave;
				} else if (state.head) state.head.name = null;
				state.length = 0;
				state.mode = COMMENT;
			case COMMENT:
				if (state.flags & 4096) {
					if (have === 0) break inf_leave;
					copy = 0;
					do {
						len = input[next + copy++];
						if (state.head && len && state.length < 65536) state.head.comment += String.fromCharCode(len);
					} while (len && copy < have);
					if (state.flags & 512) state.check = crc32(state.check, input, copy, next);
					have -= copy;
					next += copy;
					if (len) break inf_leave;
				} else if (state.head) state.head.comment = null;
				state.mode = HCRC;
			case HCRC:
				if (state.flags & 512) {
					while (bits < 16) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (hold !== (state.check & 65535)) {
						strm.msg = "header crc mismatch";
						state.mode = BAD;
						break;
					}
					hold = 0;
					bits = 0;
				}
				if (state.head) {
					state.head.hcrc = state.flags >> 9 & 1;
					state.head.done = true;
				}
				strm.adler = state.check = 0;
				state.mode = TYPE;
				break;
			case DICTID:
				while (bits < 32) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				strm.adler = state.check = zswap32(hold);
				hold = 0;
				bits = 0;
				state.mode = DICT;
			case DICT:
				if (state.havedict === 0) {
					strm.next_out = put;
					strm.avail_out = left;
					strm.next_in = next;
					strm.avail_in = have;
					state.hold = hold;
					state.bits = bits;
					return Z_NEED_DICT;
				}
				strm.adler = state.check = 1;
				state.mode = TYPE;
			case TYPE: if (flush === Z_BLOCK || flush === Z_TREES) break inf_leave;
			case TYPEDO:
				if (state.last) {
					hold >>>= bits & 7;
					bits -= bits & 7;
					state.mode = CHECK;
					break;
				}
				while (bits < 3) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				state.last = hold & 1;
				hold >>>= 1;
				bits -= 1;
				switch (hold & 3) {
					case 0:
						state.mode = STORED;
						break;
					case 1:
						fixedtables(state);
						state.mode = LEN_;
						if (flush === Z_TREES) {
							hold >>>= 2;
							bits -= 2;
							break inf_leave;
						}
						break;
					case 2:
						state.mode = TABLE;
						break;
					case 3:
						strm.msg = "invalid block type";
						state.mode = BAD;
				}
				hold >>>= 2;
				bits -= 2;
				break;
			case STORED:
				hold >>>= bits & 7;
				bits -= bits & 7;
				while (bits < 32) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
					strm.msg = "invalid stored block lengths";
					state.mode = BAD;
					break;
				}
				state.length = hold & 65535;
				hold = 0;
				bits = 0;
				state.mode = COPY_;
				if (flush === Z_TREES) break inf_leave;
			case COPY_: state.mode = COPY;
			case COPY:
				copy = state.length;
				if (copy) {
					if (copy > have) copy = have;
					if (copy > left) copy = left;
					if (copy === 0) break inf_leave;
					utils.arraySet(output, input, next, copy, put);
					have -= copy;
					next += copy;
					left -= copy;
					put += copy;
					state.length -= copy;
					break;
				}
				state.mode = TYPE;
				break;
			case TABLE:
				while (bits < 14) {
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				state.nlen = (hold & 31) + 257;
				hold >>>= 5;
				bits -= 5;
				state.ndist = (hold & 31) + 1;
				hold >>>= 5;
				bits -= 5;
				state.ncode = (hold & 15) + 4;
				hold >>>= 4;
				bits -= 4;
				if (state.nlen > 286 || state.ndist > 30) {
					strm.msg = "too many length or distance symbols";
					state.mode = BAD;
					break;
				}
				state.have = 0;
				state.mode = LENLENS;
			case LENLENS:
				while (state.have < state.ncode) {
					while (bits < 3) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.lens[order[state.have++]] = hold & 7;
					hold >>>= 3;
					bits -= 3;
				}
				while (state.have < 19) state.lens[order[state.have++]] = 0;
				state.lencode = state.lendyn;
				state.lenbits = 7;
				opts = { bits: state.lenbits };
				ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
				state.lenbits = opts.bits;
				if (ret) {
					strm.msg = "invalid code lengths set";
					state.mode = BAD;
					break;
				}
				state.have = 0;
				state.mode = CODELENS;
			case CODELENS:
				while (state.have < state.nlen + state.ndist) {
					for (;;) {
						here = state.lencode[hold & (1 << state.lenbits) - 1];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (here_val < 16) {
						hold >>>= here_bits;
						bits -= here_bits;
						state.lens[state.have++] = here_val;
					} else {
						if (here_val === 16) {
							n = here_bits + 2;
							while (bits < n) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							if (state.have === 0) {
								strm.msg = "invalid bit length repeat";
								state.mode = BAD;
								break;
							}
							len = state.lens[state.have - 1];
							copy = 3 + (hold & 3);
							hold >>>= 2;
							bits -= 2;
						} else if (here_val === 17) {
							n = here_bits + 3;
							while (bits < n) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							len = 0;
							copy = 3 + (hold & 7);
							hold >>>= 3;
							bits -= 3;
						} else {
							n = here_bits + 7;
							while (bits < n) {
								if (have === 0) break inf_leave;
								have--;
								hold += input[next++] << bits;
								bits += 8;
							}
							hold >>>= here_bits;
							bits -= here_bits;
							len = 0;
							copy = 11 + (hold & 127);
							hold >>>= 7;
							bits -= 7;
						}
						if (state.have + copy > state.nlen + state.ndist) {
							strm.msg = "invalid bit length repeat";
							state.mode = BAD;
							break;
						}
						while (copy--) state.lens[state.have++] = len;
					}
				}
				if (state.mode === BAD) break;
				if (state.lens[256] === 0) {
					strm.msg = "invalid code -- missing end-of-block";
					state.mode = BAD;
					break;
				}
				state.lenbits = 9;
				opts = { bits: state.lenbits };
				ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
				state.lenbits = opts.bits;
				if (ret) {
					strm.msg = "invalid literal/lengths set";
					state.mode = BAD;
					break;
				}
				state.distbits = 6;
				state.distcode = state.distdyn;
				opts = { bits: state.distbits };
				ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
				state.distbits = opts.bits;
				if (ret) {
					strm.msg = "invalid distances set";
					state.mode = BAD;
					break;
				}
				state.mode = LEN_;
				if (flush === Z_TREES) break inf_leave;
			case LEN_: state.mode = LEN;
			case LEN:
				if (have >= 6 && left >= 258) {
					strm.next_out = put;
					strm.avail_out = left;
					strm.next_in = next;
					strm.avail_in = have;
					state.hold = hold;
					state.bits = bits;
					inflate_fast(strm, _out);
					put = strm.next_out;
					output = strm.output;
					left = strm.avail_out;
					next = strm.next_in;
					input = strm.input;
					have = strm.avail_in;
					hold = state.hold;
					bits = state.bits;
					if (state.mode === TYPE) state.back = -1;
					break;
				}
				state.back = 0;
				for (;;) {
					here = state.lencode[hold & (1 << state.lenbits) - 1];
					here_bits = here >>> 24;
					here_op = here >>> 16 & 255;
					here_val = here & 65535;
					if (here_bits <= bits) break;
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if (here_op && (here_op & 240) === 0) {
					last_bits = here_bits;
					last_op = here_op;
					last_val = here_val;
					for (;;) {
						here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (last_bits + here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					hold >>>= last_bits;
					bits -= last_bits;
					state.back += last_bits;
				}
				hold >>>= here_bits;
				bits -= here_bits;
				state.back += here_bits;
				state.length = here_val;
				if (here_op === 0) {
					state.mode = LIT;
					break;
				}
				if (here_op & 32) {
					state.back = -1;
					state.mode = TYPE;
					break;
				}
				if (here_op & 64) {
					strm.msg = "invalid literal/length code";
					state.mode = BAD;
					break;
				}
				state.extra = here_op & 15;
				state.mode = LENEXT;
			case LENEXT:
				if (state.extra) {
					n = state.extra;
					while (bits < n) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.length += hold & (1 << state.extra) - 1;
					hold >>>= state.extra;
					bits -= state.extra;
					state.back += state.extra;
				}
				state.was = state.length;
				state.mode = DIST;
			case DIST:
				for (;;) {
					here = state.distcode[hold & (1 << state.distbits) - 1];
					here_bits = here >>> 24;
					here_op = here >>> 16 & 255;
					here_val = here & 65535;
					if (here_bits <= bits) break;
					if (have === 0) break inf_leave;
					have--;
					hold += input[next++] << bits;
					bits += 8;
				}
				if ((here_op & 240) === 0) {
					last_bits = here_bits;
					last_op = here_op;
					last_val = here_val;
					for (;;) {
						here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
						here_bits = here >>> 24;
						here_op = here >>> 16 & 255;
						here_val = here & 65535;
						if (last_bits + here_bits <= bits) break;
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					hold >>>= last_bits;
					bits -= last_bits;
					state.back += last_bits;
				}
				hold >>>= here_bits;
				bits -= here_bits;
				state.back += here_bits;
				if (here_op & 64) {
					strm.msg = "invalid distance code";
					state.mode = BAD;
					break;
				}
				state.offset = here_val;
				state.extra = here_op & 15;
				state.mode = DISTEXT;
			case DISTEXT:
				if (state.extra) {
					n = state.extra;
					while (bits < n) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					state.offset += hold & (1 << state.extra) - 1;
					hold >>>= state.extra;
					bits -= state.extra;
					state.back += state.extra;
				}
				if (state.offset > state.dmax) {
					strm.msg = "invalid distance too far back";
					state.mode = BAD;
					break;
				}
				state.mode = MATCH;
			case MATCH:
				if (left === 0) break inf_leave;
				copy = _out - left;
				if (state.offset > copy) {
					copy = state.offset - copy;
					if (copy > state.whave) {
						if (state.sane) {
							strm.msg = "invalid distance too far back";
							state.mode = BAD;
							break;
						}
					}
					if (copy > state.wnext) {
						copy -= state.wnext;
						from = state.wsize - copy;
					} else from = state.wnext - copy;
					if (copy > state.length) copy = state.length;
					from_source = state.window;
				} else {
					from_source = output;
					from = put - state.offset;
					copy = state.length;
				}
				if (copy > left) copy = left;
				left -= copy;
				state.length -= copy;
				do
					output[put++] = from_source[from++];
				while (--copy);
				if (state.length === 0) state.mode = LEN;
				break;
			case LIT:
				if (left === 0) break inf_leave;
				output[put++] = state.length;
				left--;
				state.mode = LEN;
				break;
			case CHECK:
				if (state.wrap) {
					while (bits < 32) {
						if (have === 0) break inf_leave;
						have--;
						hold |= input[next++] << bits;
						bits += 8;
					}
					_out -= left;
					strm.total_out += _out;
					state.total += _out;
					if (_out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
					_out = left;
					if ((state.flags ? hold : zswap32(hold)) !== state.check) {
						strm.msg = "incorrect data check";
						state.mode = BAD;
						break;
					}
					hold = 0;
					bits = 0;
				}
				state.mode = LENGTH;
			case LENGTH:
				if (state.wrap && state.flags) {
					while (bits < 32) {
						if (have === 0) break inf_leave;
						have--;
						hold += input[next++] << bits;
						bits += 8;
					}
					if (hold !== (state.total & 4294967295)) {
						strm.msg = "incorrect length check";
						state.mode = BAD;
						break;
					}
					hold = 0;
					bits = 0;
				}
				state.mode = DONE;
			case DONE:
				ret = Z_STREAM_END;
				break inf_leave;
			case BAD:
				ret = Z_DATA_ERROR;
				break inf_leave;
			case MEM: return Z_MEM_ERROR;
			case SYNC:
			default: return Z_STREAM_ERROR;
		}
		strm.next_out = put;
		strm.avail_out = left;
		strm.next_in = next;
		strm.avail_in = have;
		state.hold = hold;
		state.bits = bits;
		if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
			if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
				state.mode = MEM;
				return Z_MEM_ERROR;
			}
		}
		_in -= strm.avail_in;
		_out -= strm.avail_out;
		strm.total_in += _in;
		strm.total_out += _out;
		state.total += _out;
		if (state.wrap && _out) strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
		strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
		if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) ret = Z_BUF_ERROR;
		return ret;
	}
	function inflateEnd(strm) {
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		var state = strm.state;
		if (state.window) state.window = null;
		strm.state = null;
		return Z_OK;
	}
	function inflateGetHeader(strm, head) {
		var state;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		if ((state.wrap & 2) === 0) return Z_STREAM_ERROR;
		state.head = head;
		head.done = false;
		return Z_OK;
	}
	function inflateSetDictionary(strm, dictionary) {
		var dictLength = dictionary.length;
		var state;
		var dictid;
		var ret;
		if (!strm || !strm.state) return Z_STREAM_ERROR;
		state = strm.state;
		if (state.wrap !== 0 && state.mode !== DICT) return Z_STREAM_ERROR;
		if (state.mode === DICT) {
			dictid = 1;
			dictid = adler32(dictid, dictionary, dictLength, 0);
			if (dictid !== state.check) return Z_DATA_ERROR;
		}
		ret = updatewindow(strm, dictionary, dictLength, dictLength);
		if (ret) {
			state.mode = MEM;
			return Z_MEM_ERROR;
		}
		state.havedict = 1;
		return Z_OK;
	}
	exports.inflateReset = inflateReset;
	exports.inflateReset2 = inflateReset2;
	exports.inflateResetKeep = inflateResetKeep;
	exports.inflateInit = inflateInit;
	exports.inflateInit2 = inflateInit2;
	exports.inflate = inflate;
	exports.inflateEnd = inflateEnd;
	exports.inflateGetHeader = inflateGetHeader;
	exports.inflateSetDictionary = inflateSetDictionary;
	exports.inflateInfo = "pako inflate (from Nodeca project)";
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		Z_NO_FLUSH: 0,
		Z_PARTIAL_FLUSH: 1,
		Z_SYNC_FLUSH: 2,
		Z_FULL_FLUSH: 3,
		Z_FINISH: 4,
		Z_BLOCK: 5,
		Z_TREES: 6,
		Z_OK: 0,
		Z_STREAM_END: 1,
		Z_NEED_DICT: 2,
		Z_ERRNO: -1,
		Z_STREAM_ERROR: -2,
		Z_DATA_ERROR: -3,
		Z_BUF_ERROR: -5,
		Z_NO_COMPRESSION: 0,
		Z_BEST_SPEED: 1,
		Z_BEST_COMPRESSION: 9,
		Z_DEFAULT_COMPRESSION: -1,
		Z_FILTERED: 1,
		Z_HUFFMAN_ONLY: 2,
		Z_RLE: 3,
		Z_FIXED: 4,
		Z_DEFAULT_STRATEGY: 0,
		Z_BINARY: 0,
		Z_TEXT: 1,
		Z_UNKNOWN: 2,
		Z_DEFLATED: 8
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/zlib/gzheader.js
var require_gzheader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function GZheader() {
		this.text = 0;
		this.time = 0;
		this.xflags = 0;
		this.os = 0;
		this.extra = null;
		this.extra_len = 0;
		this.name = "";
		this.comment = "";
		this.hcrc = 0;
		this.done = false;
	}
	module.exports = GZheader;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/lib/inflate.js
var require_inflate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var zlib_inflate = require_inflate$1();
	var utils = require_common();
	var strings = require_strings();
	var c = require_constants();
	var msg = require_messages();
	var ZStream = require_zstream();
	var GZheader = require_gzheader();
	var toString = Object.prototype.toString;
	/**
	* class Inflate
	*
	* Generic JS-style wrapper for zlib calls. If you don't need
	* streaming behaviour - use more simple functions: [[inflate]]
	* and [[inflateRaw]].
	**/
	/**
	* Inflate.result -> Uint8Array|Array|String
	*
	* Uncompressed result, generated by default [[Inflate#onData]]
	* and [[Inflate#onEnd]] handlers. Filled after you push last chunk
	* (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
	* push a chunk with explicit flush (call [[Inflate#push]] with
	* `Z_SYNC_FLUSH` param).
	**/
	/**
	* Inflate.err -> Number
	*
	* Error code after inflate finished. 0 (Z_OK) on success.
	* Should be checked if broken data possible.
	**/
	/**
	* Inflate.msg -> String
	*
	* Error message, if [[Inflate.err]] != 0
	**/
	/**
	* new Inflate(options)
	* - options (Object): zlib inflate options.
	*
	* Creates new inflator instance with specified params. Throws exception
	* on bad params. Supported options:
	*
	* - `windowBits`
	* - `dictionary`
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information on these.
	*
	* Additional options, for internal needs:
	*
	* - `chunkSize` - size of generated data chunks (16K by default)
	* - `raw` (Boolean) - do raw inflate
	* - `to` (String) - if equal to 'string', then result will be converted
	*   from utf8 to utf16 (javascript) string. When string output requested,
	*   chunk length can differ from `chunkSize`, depending on content.
	*
	* By default, when no options set, autodetect deflate/gzip data format via
	* wrapper header.
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
	*   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
	*
	* var inflate = new pako.Inflate({ level: 3});
	*
	* inflate.push(chunk1, false);
	* inflate.push(chunk2, true);  // true -> last chunk
	*
	* if (inflate.err) { throw new Error(inflate.err); }
	*
	* console.log(inflate.result);
	* ```
	**/
	function Inflate(options) {
		if (!(this instanceof Inflate)) return new Inflate(options);
		this.options = utils.assign({
			chunkSize: 16384,
			windowBits: 0,
			to: ""
		}, options || {});
		var opt = this.options;
		if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
			opt.windowBits = -opt.windowBits;
			if (opt.windowBits === 0) opt.windowBits = -15;
		}
		if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) opt.windowBits += 32;
		if (opt.windowBits > 15 && opt.windowBits < 48) {
			if ((opt.windowBits & 15) === 0) opt.windowBits |= 15;
		}
		this.err = 0;
		this.msg = "";
		this.ended = false;
		this.chunks = [];
		this.strm = new ZStream();
		this.strm.avail_out = 0;
		var status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
		if (status !== c.Z_OK) throw new Error(msg[status]);
		this.header = new GZheader();
		zlib_inflate.inflateGetHeader(this.strm, this.header);
		if (opt.dictionary) {
			if (typeof opt.dictionary === "string") opt.dictionary = strings.string2buf(opt.dictionary);
			else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") opt.dictionary = new Uint8Array(opt.dictionary);
			if (opt.raw) {
				status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
				if (status !== c.Z_OK) throw new Error(msg[status]);
			}
		}
	}
	/**
	* Inflate#push(data[, mode]) -> Boolean
	* - data (Uint8Array|Array|ArrayBuffer|String): input data
	* - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
	*   See constants. Skipped or `false` means Z_NO_FLUSH, `true` means Z_FINISH.
	*
	* Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
	* new output chunks. Returns `true` on success. The last data block must have
	* mode Z_FINISH (or `true`). That will flush internal pending buffers and call
	* [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
	* can use mode Z_SYNC_FLUSH, keeping the decompression context.
	*
	* On fail call [[Inflate#onEnd]] with error code and return false.
	*
	* We strongly recommend to use `Uint8Array` on input for best speed (output
	* format is detected automatically). Also, don't skip last param and always
	* use the same type in your code (boolean or number). That will improve JS speed.
	*
	* For regular `Array`-s make sure all elements are [0..255].
	*
	* ##### Example
	*
	* ```javascript
	* push(chunk, false); // push one of data chunks
	* ...
	* push(chunk, true);  // push last chunk
	* ```
	**/
	Inflate.prototype.push = function(data, mode) {
		var strm = this.strm;
		var chunkSize = this.options.chunkSize;
		var dictionary = this.options.dictionary;
		var status, _mode;
		var next_out_utf8, tail, utf8str;
		var allowBufError = false;
		if (this.ended) return false;
		_mode = mode === ~~mode ? mode : mode === true ? c.Z_FINISH : c.Z_NO_FLUSH;
		if (typeof data === "string") strm.input = strings.binstring2buf(data);
		else if (toString.call(data) === "[object ArrayBuffer]") strm.input = new Uint8Array(data);
		else strm.input = data;
		strm.next_in = 0;
		strm.avail_in = strm.input.length;
		do {
			if (strm.avail_out === 0) {
				strm.output = new utils.Buf8(chunkSize);
				strm.next_out = 0;
				strm.avail_out = chunkSize;
			}
			status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);
			if (status === c.Z_NEED_DICT && dictionary) status = zlib_inflate.inflateSetDictionary(this.strm, dictionary);
			if (status === c.Z_BUF_ERROR && allowBufError === true) {
				status = c.Z_OK;
				allowBufError = false;
			}
			if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
				this.onEnd(status);
				this.ended = true;
				return false;
			}
			if (strm.next_out) {
				if (strm.avail_out === 0 || status === c.Z_STREAM_END || strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH)) if (this.options.to === "string") {
					next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
					tail = strm.next_out - next_out_utf8;
					utf8str = strings.buf2string(strm.output, next_out_utf8);
					strm.next_out = tail;
					strm.avail_out = chunkSize - tail;
					if (tail) utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0);
					this.onData(utf8str);
				} else this.onData(utils.shrinkBuf(strm.output, strm.next_out));
			}
			if (strm.avail_in === 0 && strm.avail_out === 0) allowBufError = true;
		} while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);
		if (status === c.Z_STREAM_END) _mode = c.Z_FINISH;
		if (_mode === c.Z_FINISH) {
			status = zlib_inflate.inflateEnd(this.strm);
			this.onEnd(status);
			this.ended = true;
			return status === c.Z_OK;
		}
		if (_mode === c.Z_SYNC_FLUSH) {
			this.onEnd(c.Z_OK);
			strm.avail_out = 0;
			return true;
		}
		return true;
	};
	/**
	* Inflate#onData(chunk) -> Void
	* - chunk (Uint8Array|Array|String): output data. Type of array depends
	*   on js engine support. When string output requested, each chunk
	*   will be string.
	*
	* By default, stores data blocks in `chunks[]` property and glue
	* those in `onEnd`. Override this handler, if you need another behaviour.
	**/
	Inflate.prototype.onData = function(chunk) {
		this.chunks.push(chunk);
	};
	/**
	* Inflate#onEnd(status) -> Void
	* - status (Number): inflate status. 0 (Z_OK) on success,
	*   other if not.
	*
	* Called either after you tell inflate that the input stream is
	* complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
	* or if an error happened. By default - join collected chunks,
	* free memory and fill `results` / `err` properties.
	**/
	Inflate.prototype.onEnd = function(status) {
		if (status === c.Z_OK) if (this.options.to === "string") this.result = this.chunks.join("");
		else this.result = utils.flattenChunks(this.chunks);
		this.chunks = [];
		this.err = status;
		this.msg = this.strm.msg;
	};
	/**
	* inflate(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to decompress.
	* - options (Object): zlib inflate options.
	*
	* Decompress `data` with inflate/ungzip and `options`. Autodetect
	* format via wrapper header by default. That's why we don't provide
	* separate `ungzip` method.
	*
	* Supported options are:
	*
	* - windowBits
	*
	* [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
	* for more information.
	*
	* Sugar (options):
	*
	* - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
	*   negative windowBits implicitly.
	* - `to` (String) - if equal to 'string', then result will be converted
	*   from utf8 to utf16 (javascript) string. When string output requested,
	*   chunk length can differ from `chunkSize`, depending on content.
	*
	*
	* ##### Example:
	*
	* ```javascript
	* var pako = require('pako')
	*   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
	*   , output;
	*
	* try {
	*   output = pako.inflate(input);
	* } catch (err)
	*   console.log(err);
	* }
	* ```
	**/
	function inflate(input, options) {
		var inflator = new Inflate(options);
		inflator.push(input, true);
		if (inflator.err) throw inflator.msg || msg[inflator.err];
		return inflator.result;
	}
	/**
	* inflateRaw(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to decompress.
	* - options (Object): zlib inflate options.
	*
	* The same as [[inflate]], but creates raw data, without wrapper
	* (header and adler32 crc).
	**/
	function inflateRaw(input, options) {
		options = options || {};
		options.raw = true;
		return inflate(input, options);
	}
	/**
	* ungzip(data[, options]) -> Uint8Array|Array|String
	* - data (Uint8Array|Array|String): input data to decompress.
	* - options (Object): zlib inflate options.
	*
	* Just shortcut to [[inflate]], because it autodetects format
	* by header.content. Done for convenience.
	**/
	exports.Inflate = Inflate;
	exports.inflate = inflate;
	exports.inflateRaw = inflateRaw;
	exports.ungzip = inflate;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/pako@1.0.11/node_modules/pako/index.js
var require_pako = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assign = require_common().assign;
	var deflate = require_deflate();
	var inflate = require_inflate();
	var constants = require_constants();
	var pako = {};
	assign(pako, deflate, inflate, constants);
	module.exports = pako;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/flate.js
var require_flate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var USE_TYPEDARRAY = typeof Uint8Array !== "undefined" && typeof Uint16Array !== "undefined" && typeof Uint32Array !== "undefined";
	var pako = require_pako();
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var ARRAY_TYPE = USE_TYPEDARRAY ? "uint8array" : "array";
	exports.magic = "\b\0";
	/**
	* Create a worker that uses pako to inflate/deflate.
	* @constructor
	* @param {String} action the name of the pako function to call : either "Deflate" or "Inflate".
	* @param {Object} options the options to use when (de)compressing.
	*/
	function FlateWorker(action, options) {
		GenericWorker.call(this, "FlateWorker/" + action);
		this._pako = null;
		this._pakoAction = action;
		this._pakoOptions = options;
		this.meta = {};
	}
	utils.inherits(FlateWorker, GenericWorker);
	/**
	* @see GenericWorker.processChunk
	*/
	FlateWorker.prototype.processChunk = function(chunk) {
		this.meta = chunk.meta;
		if (this._pako === null) this._createPako();
		this._pako.push(utils.transformTo(ARRAY_TYPE, chunk.data), false);
	};
	/**
	* @see GenericWorker.flush
	*/
	FlateWorker.prototype.flush = function() {
		GenericWorker.prototype.flush.call(this);
		if (this._pako === null) this._createPako();
		this._pako.push([], true);
	};
	/**
	* @see GenericWorker.cleanUp
	*/
	FlateWorker.prototype.cleanUp = function() {
		GenericWorker.prototype.cleanUp.call(this);
		this._pako = null;
	};
	/**
	* Create the _pako object.
	* TODO: lazy-loading this object isn't the best solution but it's the
	* quickest. The best solution is to lazy-load the worker list. See also the
	* issue #446.
	*/
	FlateWorker.prototype._createPako = function() {
		this._pako = new pako[this._pakoAction]({
			raw: true,
			level: this._pakoOptions.level || -1
		});
		var self = this;
		this._pako.onData = function(data) {
			self.push({
				data,
				meta: self.meta
			});
		};
	};
	exports.compressWorker = function(compressionOptions) {
		return new FlateWorker("Deflate", compressionOptions);
	};
	exports.uncompressWorker = function() {
		return new FlateWorker("Inflate", {});
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/compressions.js
var require_compressions = /* @__PURE__ */ __commonJSMin(((exports) => {
	var GenericWorker = require_GenericWorker();
	exports.STORE = {
		magic: "\0\0",
		compressWorker: function() {
			return new GenericWorker("STORE compression");
		},
		uncompressWorker: function() {
			return new GenericWorker("STORE decompression");
		}
	};
	exports.DEFLATE = require_flate();
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/signature.js
var require_signature = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.LOCAL_FILE_HEADER = "PK";
	exports.CENTRAL_FILE_HEADER = "PK";
	exports.CENTRAL_DIRECTORY_END = "PK";
	exports.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07";
	exports.ZIP64_CENTRAL_DIRECTORY_END = "PK";
	exports.DATA_DESCRIPTOR = "PK\x07\b";
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/generate/ZipFileWorker.js
var require_ZipFileWorker = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var utf8 = require_utf8();
	var crc32 = require_crc32$1();
	var signature = require_signature();
	/**
	* Transform an integer into a string in hexadecimal.
	* @private
	* @param {number} dec the number to convert.
	* @param {number} bytes the number of bytes to generate.
	* @returns {string} the result.
	*/
	var decToHex = function(dec, bytes) {
		var hex = "", i;
		for (i = 0; i < bytes; i++) {
			hex += String.fromCharCode(dec & 255);
			dec = dec >>> 8;
		}
		return hex;
	};
	/**
	* Generate the UNIX part of the external file attributes.
	* @param {Object} unixPermissions the unix permissions or null.
	* @param {Boolean} isDir true if the entry is a directory, false otherwise.
	* @return {Number} a 32 bit integer.
	*
	* adapted from http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute :
	*
	* TTTTsstrwxrwxrwx0000000000ADVSHR
	* ^^^^____________________________ file type, see zipinfo.c (UNX_*)
	*     ^^^_________________________ setuid, setgid, sticky
	*        ^^^^^^^^^________________ permissions
	*                 ^^^^^^^^^^______ not used ?
	*                           ^^^^^^ DOS attribute bits : Archive, Directory, Volume label, System file, Hidden, Read only
	*/
	var generateUnixExternalFileAttr = function(unixPermissions, isDir) {
		var result = unixPermissions;
		if (!unixPermissions) result = isDir ? 16893 : 33204;
		return (result & 65535) << 16;
	};
	/**
	* Generate the DOS part of the external file attributes.
	* @param {Object} dosPermissions the dos permissions or null.
	* @param {Boolean} isDir true if the entry is a directory, false otherwise.
	* @return {Number} a 32 bit integer.
	*
	* Bit 0     Read-Only
	* Bit 1     Hidden
	* Bit 2     System
	* Bit 3     Volume Label
	* Bit 4     Directory
	* Bit 5     Archive
	*/
	var generateDosExternalFileAttr = function(dosPermissions) {
		return (dosPermissions || 0) & 63;
	};
	/**
	* Generate the various parts used in the construction of the final zip file.
	* @param {Object} streamInfo the hash with information about the compressed file.
	* @param {Boolean} streamedContent is the content streamed ?
	* @param {Boolean} streamingEnded is the stream finished ?
	* @param {number} offset the current offset from the start of the zip file.
	* @param {String} platform let's pretend we are this platform (change platform dependents fields)
	* @param {Function} encodeFileName the function to encode the file name / comment.
	* @return {Object} the zip parts.
	*/
	var generateZipParts = function(streamInfo, streamedContent, streamingEnded, offset, platform, encodeFileName) {
		var file = streamInfo["file"], compression = streamInfo["compression"], useCustomEncoding = encodeFileName !== utf8.utf8encode, encodedFileName = utils.transformTo("string", encodeFileName(file.name)), utfEncodedFileName = utils.transformTo("string", utf8.utf8encode(file.name)), comment = file.comment, encodedComment = utils.transformTo("string", encodeFileName(comment)), utfEncodedComment = utils.transformTo("string", utf8.utf8encode(comment)), useUTF8ForFileName = utfEncodedFileName.length !== file.name.length, useUTF8ForComment = utfEncodedComment.length !== comment.length, dosTime, dosDate, extraFields = "", unicodePathExtraField = "", unicodeCommentExtraField = "", dir = file.dir, date = file.date;
		var dataInfo = {
			crc32: 0,
			compressedSize: 0,
			uncompressedSize: 0
		};
		if (!streamedContent || streamingEnded) {
			dataInfo.crc32 = streamInfo["crc32"];
			dataInfo.compressedSize = streamInfo["compressedSize"];
			dataInfo.uncompressedSize = streamInfo["uncompressedSize"];
		}
		var bitflag = 0;
		if (streamedContent) bitflag |= 8;
		if (!useCustomEncoding && (useUTF8ForFileName || useUTF8ForComment)) bitflag |= 2048;
		var extFileAttr = 0;
		var versionMadeBy = 0;
		if (dir) extFileAttr |= 16;
		if (platform === "UNIX") {
			versionMadeBy = 798;
			extFileAttr |= generateUnixExternalFileAttr(file.unixPermissions, dir);
		} else {
			versionMadeBy = 20;
			extFileAttr |= generateDosExternalFileAttr(file.dosPermissions, dir);
		}
		dosTime = date.getUTCHours();
		dosTime = dosTime << 6;
		dosTime = dosTime | date.getUTCMinutes();
		dosTime = dosTime << 5;
		dosTime = dosTime | date.getUTCSeconds() / 2;
		dosDate = date.getUTCFullYear() - 1980;
		dosDate = dosDate << 4;
		dosDate = dosDate | date.getUTCMonth() + 1;
		dosDate = dosDate << 5;
		dosDate = dosDate | date.getUTCDate();
		if (useUTF8ForFileName) {
			unicodePathExtraField = decToHex(1, 1) + decToHex(crc32(encodedFileName), 4) + utfEncodedFileName;
			extraFields += "up" + decToHex(unicodePathExtraField.length, 2) + unicodePathExtraField;
		}
		if (useUTF8ForComment) {
			unicodeCommentExtraField = decToHex(1, 1) + decToHex(crc32(encodedComment), 4) + utfEncodedComment;
			extraFields += "uc" + decToHex(unicodeCommentExtraField.length, 2) + unicodeCommentExtraField;
		}
		var header = "";
		header += "\n\0";
		header += decToHex(bitflag, 2);
		header += compression.magic;
		header += decToHex(dosTime, 2);
		header += decToHex(dosDate, 2);
		header += decToHex(dataInfo.crc32, 4);
		header += decToHex(dataInfo.compressedSize, 4);
		header += decToHex(dataInfo.uncompressedSize, 4);
		header += decToHex(encodedFileName.length, 2);
		header += decToHex(extraFields.length, 2);
		return {
			fileRecord: signature.LOCAL_FILE_HEADER + header + encodedFileName + extraFields,
			dirRecord: signature.CENTRAL_FILE_HEADER + decToHex(versionMadeBy, 2) + header + decToHex(encodedComment.length, 2) + "\0\0\0\0" + decToHex(extFileAttr, 4) + decToHex(offset, 4) + encodedFileName + extraFields + encodedComment
		};
	};
	/**
	* Generate the EOCD record.
	* @param {Number} entriesCount the number of entries in the zip file.
	* @param {Number} centralDirLength the length (in bytes) of the central dir.
	* @param {Number} localDirLength the length (in bytes) of the local dir.
	* @param {String} comment the zip file comment as a binary string.
	* @param {Function} encodeFileName the function to encode the comment.
	* @return {String} the EOCD record.
	*/
	var generateCentralDirectoryEnd = function(entriesCount, centralDirLength, localDirLength, comment, encodeFileName) {
		var dirEnd = "";
		var encodedComment = utils.transformTo("string", encodeFileName(comment));
		dirEnd = signature.CENTRAL_DIRECTORY_END + "\0\0\0\0" + decToHex(entriesCount, 2) + decToHex(entriesCount, 2) + decToHex(centralDirLength, 4) + decToHex(localDirLength, 4) + decToHex(encodedComment.length, 2) + encodedComment;
		return dirEnd;
	};
	/**
	* Generate data descriptors for a file entry.
	* @param {Object} streamInfo the hash generated by a worker, containing information
	* on the file entry.
	* @return {String} the data descriptors.
	*/
	var generateDataDescriptors = function(streamInfo) {
		var descriptor = "";
		descriptor = signature.DATA_DESCRIPTOR + decToHex(streamInfo["crc32"], 4) + decToHex(streamInfo["compressedSize"], 4) + decToHex(streamInfo["uncompressedSize"], 4);
		return descriptor;
	};
	/**
	* A worker to concatenate other workers to create a zip file.
	* @param {Boolean} streamFiles `true` to stream the content of the files,
	* `false` to accumulate it.
	* @param {String} comment the comment to use.
	* @param {String} platform the platform to use, "UNIX" or "DOS".
	* @param {Function} encodeFileName the function to encode file names and comments.
	*/
	function ZipFileWorker(streamFiles, comment, platform, encodeFileName) {
		GenericWorker.call(this, "ZipFileWorker");
		this.bytesWritten = 0;
		this.zipComment = comment;
		this.zipPlatform = platform;
		this.encodeFileName = encodeFileName;
		this.streamFiles = streamFiles;
		this.accumulate = false;
		this.contentBuffer = [];
		this.dirRecords = [];
		this.currentSourceOffset = 0;
		this.entriesCount = 0;
		this.currentFile = null;
		this._sources = [];
	}
	utils.inherits(ZipFileWorker, GenericWorker);
	/**
	* @see GenericWorker.push
	*/
	ZipFileWorker.prototype.push = function(chunk) {
		var currentFilePercent = chunk.meta.percent || 0;
		var entriesCount = this.entriesCount;
		var remainingFiles = this._sources.length;
		if (this.accumulate) this.contentBuffer.push(chunk);
		else {
			this.bytesWritten += chunk.data.length;
			GenericWorker.prototype.push.call(this, {
				data: chunk.data,
				meta: {
					currentFile: this.currentFile,
					percent: entriesCount ? (currentFilePercent + 100 * (entriesCount - remainingFiles - 1)) / entriesCount : 100
				}
			});
		}
	};
	/**
	* The worker started a new source (an other worker).
	* @param {Object} streamInfo the streamInfo object from the new source.
	*/
	ZipFileWorker.prototype.openedSource = function(streamInfo) {
		this.currentSourceOffset = this.bytesWritten;
		this.currentFile = streamInfo["file"].name;
		var streamedContent = this.streamFiles && !streamInfo["file"].dir;
		if (streamedContent) {
			var record = generateZipParts(streamInfo, streamedContent, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
			this.push({
				data: record.fileRecord,
				meta: { percent: 0 }
			});
		} else this.accumulate = true;
	};
	/**
	* The worker finished a source (an other worker).
	* @param {Object} streamInfo the streamInfo object from the finished source.
	*/
	ZipFileWorker.prototype.closedSource = function(streamInfo) {
		this.accumulate = false;
		var streamedContent = this.streamFiles && !streamInfo["file"].dir;
		var record = generateZipParts(streamInfo, streamedContent, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
		this.dirRecords.push(record.dirRecord);
		if (streamedContent) this.push({
			data: generateDataDescriptors(streamInfo),
			meta: { percent: 100 }
		});
		else {
			this.push({
				data: record.fileRecord,
				meta: { percent: 0 }
			});
			while (this.contentBuffer.length) this.push(this.contentBuffer.shift());
		}
		this.currentFile = null;
	};
	/**
	* @see GenericWorker.flush
	*/
	ZipFileWorker.prototype.flush = function() {
		var localDirLength = this.bytesWritten;
		for (var i = 0; i < this.dirRecords.length; i++) this.push({
			data: this.dirRecords[i],
			meta: { percent: 100 }
		});
		var centralDirLength = this.bytesWritten - localDirLength;
		var dirEnd = generateCentralDirectoryEnd(this.dirRecords.length, centralDirLength, localDirLength, this.zipComment, this.encodeFileName);
		this.push({
			data: dirEnd,
			meta: { percent: 100 }
		});
	};
	/**
	* Prepare the next source to be read.
	*/
	ZipFileWorker.prototype.prepareNextSource = function() {
		this.previous = this._sources.shift();
		this.openedSource(this.previous.streamInfo);
		if (this.isPaused) this.previous.pause();
		else this.previous.resume();
	};
	/**
	* @see GenericWorker.registerPrevious
	*/
	ZipFileWorker.prototype.registerPrevious = function(previous) {
		this._sources.push(previous);
		var self = this;
		previous.on("data", function(chunk) {
			self.processChunk(chunk);
		});
		previous.on("end", function() {
			self.closedSource(self.previous.streamInfo);
			if (self._sources.length) self.prepareNextSource();
			else self.end();
		});
		previous.on("error", function(e) {
			self.error(e);
		});
		return this;
	};
	/**
	* @see GenericWorker.resume
	*/
	ZipFileWorker.prototype.resume = function() {
		if (!GenericWorker.prototype.resume.call(this)) return false;
		if (!this.previous && this._sources.length) {
			this.prepareNextSource();
			return true;
		}
		if (!this.previous && !this._sources.length && !this.generatedError) {
			this.end();
			return true;
		}
	};
	/**
	* @see GenericWorker.error
	*/
	ZipFileWorker.prototype.error = function(e) {
		var sources = this._sources;
		if (!GenericWorker.prototype.error.call(this, e)) return false;
		for (var i = 0; i < sources.length; i++) try {
			sources[i].error(e);
		} catch (e) {}
		return true;
	};
	/**
	* @see GenericWorker.lock
	*/
	ZipFileWorker.prototype.lock = function() {
		GenericWorker.prototype.lock.call(this);
		var sources = this._sources;
		for (var i = 0; i < sources.length; i++) sources[i].lock();
	};
	module.exports = ZipFileWorker;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/generate/index.js
var require_generate = /* @__PURE__ */ __commonJSMin(((exports) => {
	var compressions = require_compressions();
	var ZipFileWorker = require_ZipFileWorker();
	/**
	* Find the compression to use.
	* @param {String} fileCompression the compression defined at the file level, if any.
	* @param {String} zipCompression the compression defined at the load() level.
	* @return {Object} the compression object to use.
	*/
	var getCompression = function(fileCompression, zipCompression) {
		var compressionName = fileCompression || zipCompression;
		var compression = compressions[compressionName];
		if (!compression) throw new Error(compressionName + " is not a valid compression method !");
		return compression;
	};
	/**
	* Create a worker to generate a zip file.
	* @param {JSZip} zip the JSZip instance at the right root level.
	* @param {Object} options to generate the zip file.
	* @param {String} comment the comment to use.
	*/
	exports.generateWorker = function(zip, options, comment) {
		var zipFileWorker = new ZipFileWorker(options.streamFiles, comment, options.platform, options.encodeFileName);
		var entriesCount = 0;
		try {
			zip.forEach(function(relativePath, file) {
				entriesCount++;
				var compression = getCompression(file.options.compression, options.compression);
				var compressionOptions = file.options.compressionOptions || options.compressionOptions || {};
				var dir = file.dir, date = file.date;
				file._compressWorker(compression, compressionOptions).withStreamInfo("file", {
					name: relativePath,
					dir,
					date,
					comment: file.comment || "",
					unixPermissions: file.unixPermissions,
					dosPermissions: file.dosPermissions
				}).pipe(zipFileWorker);
			});
			zipFileWorker.entriesCount = entriesCount;
		} catch (e) {
			zipFileWorker.error(e);
		}
		return zipFileWorker;
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/nodejs/NodejsStreamInputAdapter.js
var require_NodejsStreamInputAdapter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	/**
	* A worker that use a nodejs stream as source.
	* @constructor
	* @param {String} filename the name of the file entry for this stream.
	* @param {Readable} stream the nodejs stream.
	*/
	function NodejsStreamInputAdapter(filename, stream) {
		GenericWorker.call(this, "Nodejs stream input adapter for " + filename);
		this._upstreamEnded = false;
		this._bindStream(stream);
	}
	utils.inherits(NodejsStreamInputAdapter, GenericWorker);
	/**
	* Prepare the stream and bind the callbacks on it.
	* Do this ASAP on node 0.10 ! A lazy binding doesn't always work.
	* @param {Stream} stream the nodejs stream to use.
	*/
	NodejsStreamInputAdapter.prototype._bindStream = function(stream) {
		var self = this;
		this._stream = stream;
		stream.pause();
		stream.on("data", function(chunk) {
			self.push({
				data: chunk,
				meta: { percent: 0 }
			});
		}).on("error", function(e) {
			if (self.isPaused) this.generatedError = e;
			else self.error(e);
		}).on("end", function() {
			if (self.isPaused) self._upstreamEnded = true;
			else self.end();
		});
	};
	NodejsStreamInputAdapter.prototype.pause = function() {
		if (!GenericWorker.prototype.pause.call(this)) return false;
		this._stream.pause();
		return true;
	};
	NodejsStreamInputAdapter.prototype.resume = function() {
		if (!GenericWorker.prototype.resume.call(this)) return false;
		if (this._upstreamEnded) this.end();
		else this._stream.resume();
		return true;
	};
	module.exports = NodejsStreamInputAdapter;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/object.js
var require_object = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utf8 = require_utf8();
	var utils = require_utils();
	var GenericWorker = require_GenericWorker();
	var StreamHelper = require_StreamHelper();
	var defaults = require_defaults();
	var CompressedObject = require_compressedObject();
	var ZipObject = require_zipObject();
	var generate = require_generate();
	var nodejsUtils = require_nodejsUtils();
	var NodejsStreamInputAdapter = require_NodejsStreamInputAdapter();
	/**
	* Add a file in the current folder.
	* @private
	* @param {string} name the name of the file
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
	* @param {Object} originalOptions the options of the file
	* @return {Object} the new file.
	*/
	var fileAdd = function(name, data, originalOptions) {
		var dataType = utils.getTypeOf(data), parent;
		var o = utils.extend(originalOptions || {}, defaults);
		o.date = o.date || /* @__PURE__ */ new Date();
		if (o.compression !== null) o.compression = o.compression.toUpperCase();
		if (typeof o.unixPermissions === "string") o.unixPermissions = parseInt(o.unixPermissions, 8);
		if (o.unixPermissions && o.unixPermissions & 16384) o.dir = true;
		if (o.dosPermissions && o.dosPermissions & 16) o.dir = true;
		if (o.dir) name = forceTrailingSlash(name);
		if (o.createFolders && (parent = parentFolder(name))) folderAdd.call(this, parent, true);
		var isUnicodeString = dataType === "string" && o.binary === false && o.base64 === false;
		if (!originalOptions || typeof originalOptions.binary === "undefined") o.binary = !isUnicodeString;
		if (data instanceof CompressedObject && data.uncompressedSize === 0 || o.dir || !data || data.length === 0) {
			o.base64 = false;
			o.binary = true;
			data = "";
			o.compression = "STORE";
			dataType = "string";
		}
		var zipObjectContent = null;
		if (data instanceof CompressedObject || data instanceof GenericWorker) zipObjectContent = data;
		else if (nodejsUtils.isNode && nodejsUtils.isStream(data)) zipObjectContent = new NodejsStreamInputAdapter(name, data);
		else zipObjectContent = utils.prepareContent(name, data, o.binary, o.optimizedBinaryString, o.base64);
		var object = new ZipObject(name, zipObjectContent, o);
		this.files[name] = object;
	};
	/**
	* Find the parent folder of the path.
	* @private
	* @param {string} path the path to use
	* @return {string} the parent folder, or ""
	*/
	var parentFolder = function(path) {
		if (path.slice(-1) === "/") path = path.substring(0, path.length - 1);
		var lastSlash = path.lastIndexOf("/");
		return lastSlash > 0 ? path.substring(0, lastSlash) : "";
	};
	/**
	* Returns the path with a slash at the end.
	* @private
	* @param {String} path the path to check.
	* @return {String} the path with a trailing slash.
	*/
	var forceTrailingSlash = function(path) {
		if (path.slice(-1) !== "/") path += "/";
		return path;
	};
	/**
	* Add a (sub) folder in the current folder.
	* @private
	* @param {string} name the folder's name
	* @param {boolean=} [createFolders] If true, automatically create sub
	*  folders. Defaults to false.
	* @return {Object} the new folder.
	*/
	var folderAdd = function(name, createFolders) {
		createFolders = typeof createFolders !== "undefined" ? createFolders : defaults.createFolders;
		name = forceTrailingSlash(name);
		if (!this.files[name]) fileAdd.call(this, name, null, {
			dir: true,
			createFolders
		});
		return this.files[name];
	};
	/**
	* Cross-window, cross-Node-context regular expression detection
	* @param  {Object}  object Anything
	* @return {Boolean}        true if the object is a regular expression,
	* false otherwise
	*/
	function isRegExp(object) {
		return Object.prototype.toString.call(object) === "[object RegExp]";
	}
	var out = {
		load: function() {
			throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
		},
		forEach: function(cb) {
			var filename, relativePath, file;
			for (filename in this.files) {
				file = this.files[filename];
				relativePath = filename.slice(this.root.length, filename.length);
				if (relativePath && filename.slice(0, this.root.length) === this.root) cb(relativePath, file);
			}
		},
		filter: function(search) {
			var result = [];
			this.forEach(function(relativePath, entry) {
				if (search(relativePath, entry)) result.push(entry);
			});
			return result;
		},
		file: function(name, data, o) {
			if (arguments.length === 1) if (isRegExp(name)) {
				var regexp = name;
				return this.filter(function(relativePath, file) {
					return !file.dir && regexp.test(relativePath);
				});
			} else {
				var obj = this.files[this.root + name];
				if (obj && !obj.dir) return obj;
				else return null;
			}
			else {
				name = this.root + name;
				fileAdd.call(this, name, data, o);
			}
			return this;
		},
		folder: function(arg) {
			if (!arg) return this;
			if (isRegExp(arg)) return this.filter(function(relativePath, file) {
				return file.dir && arg.test(relativePath);
			});
			var name = this.root + arg;
			var newFolder = folderAdd.call(this, name);
			var ret = this.clone();
			ret.root = newFolder.name;
			return ret;
		},
		remove: function(name) {
			name = this.root + name;
			var file = this.files[name];
			if (!file) {
				if (name.slice(-1) !== "/") name += "/";
				file = this.files[name];
			}
			if (file && !file.dir) delete this.files[name];
			else {
				var kids = this.filter(function(relativePath, file) {
					return file.name.slice(0, name.length) === name;
				});
				for (var i = 0; i < kids.length; i++) delete this.files[kids[i].name];
			}
			return this;
		},
		generate: function() {
			throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
		},
		generateInternalStream: function(options) {
			var worker, opts = {};
			try {
				opts = utils.extend(options || {}, {
					streamFiles: false,
					compression: "STORE",
					compressionOptions: null,
					type: "",
					platform: "DOS",
					comment: null,
					mimeType: "application/zip",
					encodeFileName: utf8.utf8encode
				});
				opts.type = opts.type.toLowerCase();
				opts.compression = opts.compression.toUpperCase();
				if (opts.type === "binarystring") opts.type = "string";
				if (!opts.type) throw new Error("No output type specified.");
				utils.checkSupport(opts.type);
				if (opts.platform === "darwin" || opts.platform === "freebsd" || opts.platform === "linux" || opts.platform === "sunos") opts.platform = "UNIX";
				if (opts.platform === "win32") opts.platform = "DOS";
				var comment = opts.comment || this.comment || "";
				worker = generate.generateWorker(this, opts, comment);
			} catch (e) {
				worker = new GenericWorker("error");
				worker.error(e);
			}
			return new StreamHelper(worker, opts.type || "string", opts.mimeType);
		},
		generateAsync: function(options, onUpdate) {
			return this.generateInternalStream(options).accumulate(onUpdate);
		},
		generateNodeStream: function(options, onUpdate) {
			options = options || {};
			if (!options.type) options.type = "nodebuffer";
			return this.generateInternalStream(options).toNodejsStream(onUpdate);
		}
	};
	module.exports = out;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/reader/DataReader.js
var require_DataReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	function DataReader(data) {
		this.data = data;
		this.length = data.length;
		this.index = 0;
		this.zero = 0;
	}
	DataReader.prototype = {
		checkOffset: function(offset) {
			this.checkIndex(this.index + offset);
		},
		checkIndex: function(newIndex) {
			if (this.length < this.zero + newIndex || newIndex < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + newIndex + "). Corrupted zip ?");
		},
		setIndex: function(newIndex) {
			this.checkIndex(newIndex);
			this.index = newIndex;
		},
		skip: function(n) {
			this.setIndex(this.index + n);
		},
		byteAt: function() {},
		readInt: function(size) {
			var result = 0, i;
			this.checkOffset(size);
			for (i = this.index + size - 1; i >= this.index; i--) result = (result << 8) + this.byteAt(i);
			this.index += size;
			return result;
		},
		readString: function(size) {
			return utils.transformTo("string", this.readData(size));
		},
		readData: function() {},
		lastIndexOfSignature: function() {},
		readAndCheckSignature: function() {},
		readDate: function() {
			var dostime = this.readInt(4);
			return new Date(Date.UTC((dostime >> 25 & 127) + 1980, (dostime >> 21 & 15) - 1, dostime >> 16 & 31, dostime >> 11 & 31, dostime >> 5 & 63, (dostime & 31) << 1));
		}
	};
	module.exports = DataReader;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/reader/ArrayReader.js
var require_ArrayReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DataReader = require_DataReader();
	var utils = require_utils();
	function ArrayReader(data) {
		DataReader.call(this, data);
		for (var i = 0; i < this.data.length; i++) data[i] = data[i] & 255;
	}
	utils.inherits(ArrayReader, DataReader);
	/**
	* @see DataReader.byteAt
	*/
	ArrayReader.prototype.byteAt = function(i) {
		return this.data[this.zero + i];
	};
	/**
	* @see DataReader.lastIndexOfSignature
	*/
	ArrayReader.prototype.lastIndexOfSignature = function(sig) {
		var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3);
		for (var i = this.length - 4; i >= 0; --i) if (this.data[i] === sig0 && this.data[i + 1] === sig1 && this.data[i + 2] === sig2 && this.data[i + 3] === sig3) return i - this.zero;
		return -1;
	};
	/**
	* @see DataReader.readAndCheckSignature
	*/
	ArrayReader.prototype.readAndCheckSignature = function(sig) {
		var sig0 = sig.charCodeAt(0), sig1 = sig.charCodeAt(1), sig2 = sig.charCodeAt(2), sig3 = sig.charCodeAt(3), data = this.readData(4);
		return sig0 === data[0] && sig1 === data[1] && sig2 === data[2] && sig3 === data[3];
	};
	/**
	* @see DataReader.readData
	*/
	ArrayReader.prototype.readData = function(size) {
		this.checkOffset(size);
		if (size === 0) return [];
		var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = ArrayReader;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/reader/StringReader.js
var require_StringReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DataReader = require_DataReader();
	var utils = require_utils();
	function StringReader(data) {
		DataReader.call(this, data);
	}
	utils.inherits(StringReader, DataReader);
	/**
	* @see DataReader.byteAt
	*/
	StringReader.prototype.byteAt = function(i) {
		return this.data.charCodeAt(this.zero + i);
	};
	/**
	* @see DataReader.lastIndexOfSignature
	*/
	StringReader.prototype.lastIndexOfSignature = function(sig) {
		return this.data.lastIndexOf(sig) - this.zero;
	};
	/**
	* @see DataReader.readAndCheckSignature
	*/
	StringReader.prototype.readAndCheckSignature = function(sig) {
		return sig === this.readData(4);
	};
	/**
	* @see DataReader.readData
	*/
	StringReader.prototype.readData = function(size) {
		this.checkOffset(size);
		var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = StringReader;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/reader/Uint8ArrayReader.js
var require_Uint8ArrayReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ArrayReader = require_ArrayReader();
	var utils = require_utils();
	function Uint8ArrayReader(data) {
		ArrayReader.call(this, data);
	}
	utils.inherits(Uint8ArrayReader, ArrayReader);
	/**
	* @see DataReader.readData
	*/
	Uint8ArrayReader.prototype.readData = function(size) {
		this.checkOffset(size);
		if (size === 0) return new Uint8Array(0);
		var result = this.data.subarray(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = Uint8ArrayReader;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/reader/NodeBufferReader.js
var require_NodeBufferReader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Uint8ArrayReader = require_Uint8ArrayReader();
	var utils = require_utils();
	function NodeBufferReader(data) {
		Uint8ArrayReader.call(this, data);
	}
	utils.inherits(NodeBufferReader, Uint8ArrayReader);
	/**
	* @see DataReader.readData
	*/
	NodeBufferReader.prototype.readData = function(size) {
		this.checkOffset(size);
		var result = this.data.slice(this.zero + this.index, this.zero + this.index + size);
		this.index += size;
		return result;
	};
	module.exports = NodeBufferReader;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/reader/readerFor.js
var require_readerFor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var support = require_support();
	var ArrayReader = require_ArrayReader();
	var StringReader = require_StringReader();
	var NodeBufferReader = require_NodeBufferReader();
	var Uint8ArrayReader = require_Uint8ArrayReader();
	/**
	* Create a reader adapted to the data.
	* @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
	* @return {DataReader} the data reader.
	*/
	module.exports = function(data) {
		var type = utils.getTypeOf(data);
		utils.checkSupport(type);
		if (type === "string" && !support.uint8array) return new StringReader(data);
		if (type === "nodebuffer") return new NodeBufferReader(data);
		if (support.uint8array) return new Uint8ArrayReader(utils.transformTo("uint8array", data));
		return new ArrayReader(utils.transformTo("array", data));
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/zipEntry.js
var require_zipEntry = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var readerFor = require_readerFor();
	var utils = require_utils();
	var CompressedObject = require_compressedObject();
	var crc32fn = require_crc32$1();
	var utf8 = require_utf8();
	var compressions = require_compressions();
	var support = require_support();
	var MADE_BY_DOS = 0;
	var MADE_BY_UNIX = 3;
	/**
	* Find a compression registered in JSZip.
	* @param {string} compressionMethod the method magic to find.
	* @return {Object|null} the JSZip compression object, null if none found.
	*/
	var findCompression = function(compressionMethod) {
		for (var method in compressions) {
			if (!Object.prototype.hasOwnProperty.call(compressions, method)) continue;
			if (compressions[method].magic === compressionMethod) return compressions[method];
		}
		return null;
	};
	/**
	* An entry in the zip file.
	* @constructor
	* @param {Object} options Options of the current file.
	* @param {Object} loadOptions Options for loading the stream.
	*/
	function ZipEntry(options, loadOptions) {
		this.options = options;
		this.loadOptions = loadOptions;
	}
	ZipEntry.prototype = {
		isEncrypted: function() {
			return (this.bitFlag & 1) === 1;
		},
		useUTF8: function() {
			return (this.bitFlag & 2048) === 2048;
		},
		readLocalPart: function(reader) {
			var compression, localExtraFieldsLength;
			reader.skip(22);
			this.fileNameLength = reader.readInt(2);
			localExtraFieldsLength = reader.readInt(2);
			this.fileName = reader.readData(this.fileNameLength);
			reader.skip(localExtraFieldsLength);
			if (this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
			compression = findCompression(this.compressionMethod);
			if (compression === null) throw new Error("Corrupted zip : compression " + utils.pretty(this.compressionMethod) + " unknown (inner file : " + utils.transformTo("string", this.fileName) + ")");
			this.decompressed = new CompressedObject(this.compressedSize, this.uncompressedSize, this.crc32, compression, reader.readData(this.compressedSize));
		},
		readCentralPart: function(reader) {
			this.versionMadeBy = reader.readInt(2);
			reader.skip(2);
			this.bitFlag = reader.readInt(2);
			this.compressionMethod = reader.readString(2);
			this.date = reader.readDate();
			this.crc32 = reader.readInt(4);
			this.compressedSize = reader.readInt(4);
			this.uncompressedSize = reader.readInt(4);
			var fileNameLength = reader.readInt(2);
			this.extraFieldsLength = reader.readInt(2);
			this.fileCommentLength = reader.readInt(2);
			this.diskNumberStart = reader.readInt(2);
			this.internalFileAttributes = reader.readInt(2);
			this.externalFileAttributes = reader.readInt(4);
			this.localHeaderOffset = reader.readInt(4);
			if (this.isEncrypted()) throw new Error("Encrypted zip are not supported");
			reader.skip(fileNameLength);
			this.readExtraFields(reader);
			this.parseZIP64ExtraField(reader);
			this.fileComment = reader.readData(this.fileCommentLength);
		},
		processAttributes: function() {
			this.unixPermissions = null;
			this.dosPermissions = null;
			var madeBy = this.versionMadeBy >> 8;
			this.dir = this.externalFileAttributes & 16 ? true : false;
			if (madeBy === MADE_BY_DOS) this.dosPermissions = this.externalFileAttributes & 63;
			if (madeBy === MADE_BY_UNIX) this.unixPermissions = this.externalFileAttributes >> 16 & 65535;
			if (!this.dir && this.fileNameStr.slice(-1) === "/") this.dir = true;
		},
		parseZIP64ExtraField: function() {
			if (!this.extraFields[1]) return;
			var extraReader = readerFor(this.extraFields[1].value);
			if (this.uncompressedSize === utils.MAX_VALUE_32BITS) this.uncompressedSize = extraReader.readInt(8);
			if (this.compressedSize === utils.MAX_VALUE_32BITS) this.compressedSize = extraReader.readInt(8);
			if (this.localHeaderOffset === utils.MAX_VALUE_32BITS) this.localHeaderOffset = extraReader.readInt(8);
			if (this.diskNumberStart === utils.MAX_VALUE_32BITS) this.diskNumberStart = extraReader.readInt(4);
		},
		readExtraFields: function(reader) {
			var end = reader.index + this.extraFieldsLength, extraFieldId, extraFieldLength, extraFieldValue;
			if (!this.extraFields) this.extraFields = {};
			while (reader.index + 4 < end) {
				extraFieldId = reader.readInt(2);
				extraFieldLength = reader.readInt(2);
				extraFieldValue = reader.readData(extraFieldLength);
				this.extraFields[extraFieldId] = {
					id: extraFieldId,
					length: extraFieldLength,
					value: extraFieldValue
				};
			}
			reader.setIndex(end);
		},
		handleUTF8: function() {
			var decodeParamType = support.uint8array ? "uint8array" : "array";
			if (this.useUTF8()) {
				this.fileNameStr = utf8.utf8decode(this.fileName);
				this.fileCommentStr = utf8.utf8decode(this.fileComment);
			} else {
				var upath = this.findExtraFieldUnicodePath();
				if (upath !== null) this.fileNameStr = upath;
				else {
					var fileNameByteArray = utils.transformTo(decodeParamType, this.fileName);
					this.fileNameStr = this.loadOptions.decodeFileName(fileNameByteArray);
				}
				var ucomment = this.findExtraFieldUnicodeComment();
				if (ucomment !== null) this.fileCommentStr = ucomment;
				else {
					var commentByteArray = utils.transformTo(decodeParamType, this.fileComment);
					this.fileCommentStr = this.loadOptions.decodeFileName(commentByteArray);
				}
			}
		},
		findExtraFieldUnicodePath: function() {
			var upathField = this.extraFields[28789];
			if (upathField) {
				var extraReader = readerFor(upathField.value);
				if (extraReader.readInt(1) !== 1) return null;
				if (crc32fn(this.fileName) !== extraReader.readInt(4)) return null;
				return utf8.utf8decode(extraReader.readData(upathField.length - 5));
			}
			return null;
		},
		findExtraFieldUnicodeComment: function() {
			var ucommentField = this.extraFields[25461];
			if (ucommentField) {
				var extraReader = readerFor(ucommentField.value);
				if (extraReader.readInt(1) !== 1) return null;
				if (crc32fn(this.fileComment) !== extraReader.readInt(4)) return null;
				return utf8.utf8decode(extraReader.readData(ucommentField.length - 5));
			}
			return null;
		}
	};
	module.exports = ZipEntry;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/zipEntries.js
var require_zipEntries = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var readerFor = require_readerFor();
	var utils = require_utils();
	var sig = require_signature();
	var ZipEntry = require_zipEntry();
	var support = require_support();
	/**
	* All the entries in the zip file.
	* @constructor
	* @param {Object} loadOptions Options for loading the stream.
	*/
	function ZipEntries(loadOptions) {
		this.files = [];
		this.loadOptions = loadOptions;
	}
	ZipEntries.prototype = {
		checkSignature: function(expectedSignature) {
			if (!this.reader.readAndCheckSignature(expectedSignature)) {
				this.reader.index -= 4;
				var signature = this.reader.readString(4);
				throw new Error("Corrupted zip or bug: unexpected signature (" + utils.pretty(signature) + ", expected " + utils.pretty(expectedSignature) + ")");
			}
		},
		isSignature: function(askedIndex, expectedSignature) {
			var currentIndex = this.reader.index;
			this.reader.setIndex(askedIndex);
			var result = this.reader.readString(4) === expectedSignature;
			this.reader.setIndex(currentIndex);
			return result;
		},
		readBlockEndOfCentral: function() {
			this.diskNumber = this.reader.readInt(2);
			this.diskWithCentralDirStart = this.reader.readInt(2);
			this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
			this.centralDirRecords = this.reader.readInt(2);
			this.centralDirSize = this.reader.readInt(4);
			this.centralDirOffset = this.reader.readInt(4);
			this.zipCommentLength = this.reader.readInt(2);
			var zipComment = this.reader.readData(this.zipCommentLength);
			var decodeParamType = support.uint8array ? "uint8array" : "array";
			var decodeContent = utils.transformTo(decodeParamType, zipComment);
			this.zipComment = this.loadOptions.decodeFileName(decodeContent);
		},
		readBlockZip64EndOfCentral: function() {
			this.zip64EndOfCentralSize = this.reader.readInt(8);
			this.reader.skip(4);
			this.diskNumber = this.reader.readInt(4);
			this.diskWithCentralDirStart = this.reader.readInt(4);
			this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
			this.centralDirRecords = this.reader.readInt(8);
			this.centralDirSize = this.reader.readInt(8);
			this.centralDirOffset = this.reader.readInt(8);
			this.zip64ExtensibleData = {};
			var extraDataSize = this.zip64EndOfCentralSize - 44, index = 0, extraFieldId, extraFieldLength, extraFieldValue;
			while (index < extraDataSize) {
				extraFieldId = this.reader.readInt(2);
				extraFieldLength = this.reader.readInt(4);
				extraFieldValue = this.reader.readData(extraFieldLength);
				this.zip64ExtensibleData[extraFieldId] = {
					id: extraFieldId,
					length: extraFieldLength,
					value: extraFieldValue
				};
			}
		},
		readBlockZip64EndOfCentralLocator: function() {
			this.diskWithZip64CentralDirStart = this.reader.readInt(4);
			this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
			this.disksCount = this.reader.readInt(4);
			if (this.disksCount > 1) throw new Error("Multi-volumes zip are not supported");
		},
		readLocalFiles: function() {
			var i, file;
			for (i = 0; i < this.files.length; i++) {
				file = this.files[i];
				this.reader.setIndex(file.localHeaderOffset);
				this.checkSignature(sig.LOCAL_FILE_HEADER);
				file.readLocalPart(this.reader);
				file.handleUTF8();
				file.processAttributes();
			}
		},
		readCentralDir: function() {
			var file;
			this.reader.setIndex(this.centralDirOffset);
			while (this.reader.readAndCheckSignature(sig.CENTRAL_FILE_HEADER)) {
				file = new ZipEntry({ zip64: this.zip64 }, this.loadOptions);
				file.readCentralPart(this.reader);
				this.files.push(file);
			}
			if (this.centralDirRecords !== this.files.length) {
				if (this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
			}
		},
		readEndOfCentral: function() {
			var offset = this.reader.lastIndexOfSignature(sig.CENTRAL_DIRECTORY_END);
			if (offset < 0) if (!this.isSignature(0, sig.LOCAL_FILE_HEADER)) throw new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
			else throw new Error("Corrupted zip: can't find end of central directory");
			this.reader.setIndex(offset);
			var endOfCentralDirOffset = offset;
			this.checkSignature(sig.CENTRAL_DIRECTORY_END);
			this.readBlockEndOfCentral();
			if (this.diskNumber === utils.MAX_VALUE_16BITS || this.diskWithCentralDirStart === utils.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === utils.MAX_VALUE_16BITS || this.centralDirRecords === utils.MAX_VALUE_16BITS || this.centralDirSize === utils.MAX_VALUE_32BITS || this.centralDirOffset === utils.MAX_VALUE_32BITS) {
				this.zip64 = true;
				offset = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
				if (offset < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
				this.reader.setIndex(offset);
				this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
				this.readBlockZip64EndOfCentralLocator();
				if (!this.isSignature(this.relativeOffsetEndOfZip64CentralDir, sig.ZIP64_CENTRAL_DIRECTORY_END)) {
					this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
					if (this.relativeOffsetEndOfZip64CentralDir < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
				}
				this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
				this.checkSignature(sig.ZIP64_CENTRAL_DIRECTORY_END);
				this.readBlockZip64EndOfCentral();
			}
			var expectedEndOfCentralDirOffset = this.centralDirOffset + this.centralDirSize;
			if (this.zip64) {
				expectedEndOfCentralDirOffset += 20;
				expectedEndOfCentralDirOffset += 12 + this.zip64EndOfCentralSize;
			}
			var extraBytes = endOfCentralDirOffset - expectedEndOfCentralDirOffset;
			if (extraBytes > 0) if (this.isSignature(endOfCentralDirOffset, sig.CENTRAL_FILE_HEADER)) {} else this.reader.zero = extraBytes;
			else if (extraBytes < 0) throw new Error("Corrupted zip: missing " + Math.abs(extraBytes) + " bytes.");
		},
		prepareReader: function(data) {
			this.reader = readerFor(data);
		},
		load: function(data) {
			this.prepareReader(data);
			this.readEndOfCentral();
			this.readCentralDir();
			this.readLocalFiles();
		}
	};
	module.exports = ZipEntries;
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/load.js
var require_load = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var utils = require_utils();
	var external = require_external();
	var utf8 = require_utf8();
	var ZipEntries = require_zipEntries();
	var Crc32Probe = require_Crc32Probe();
	var nodejsUtils = require_nodejsUtils();
	/**
	* Check the CRC32 of an entry.
	* @param {ZipEntry} zipEntry the zip entry to check.
	* @return {Promise} the result.
	*/
	function checkEntryCRC32(zipEntry) {
		return new external.Promise(function(resolve, reject) {
			var worker = zipEntry.decompressed.getContentWorker().pipe(new Crc32Probe());
			worker.on("error", function(e) {
				reject(e);
			}).on("end", function() {
				if (worker.streamInfo.crc32 !== zipEntry.decompressed.crc32) reject(/* @__PURE__ */ new Error("Corrupted zip : CRC32 mismatch"));
				else resolve();
			}).resume();
		});
	}
	module.exports = function(data, options) {
		var zip = this;
		options = utils.extend(options || {}, {
			base64: false,
			checkCRC32: false,
			optimizedBinaryString: false,
			createFolders: false,
			decodeFileName: utf8.utf8decode
		});
		if (nodejsUtils.isNode && nodejsUtils.isStream(data)) return external.Promise.reject(/* @__PURE__ */ new Error("JSZip can't accept a stream when loading a zip file."));
		return utils.prepareContent("the loaded zip file", data, true, options.optimizedBinaryString, options.base64).then(function(data) {
			var zipEntries = new ZipEntries(options);
			zipEntries.load(data);
			return zipEntries;
		}).then(function checkCRC32(zipEntries) {
			var promises = [external.Promise.resolve(zipEntries)];
			var files = zipEntries.files;
			if (options.checkCRC32) for (var i = 0; i < files.length; i++) promises.push(checkEntryCRC32(files[i]));
			return external.Promise.all(promises);
		}).then(function addFiles(results) {
			var zipEntries = results.shift();
			var files = zipEntries.files;
			for (var i = 0; i < files.length; i++) {
				var input = files[i];
				var unsafeName = input.fileNameStr;
				var safeName = utils.resolve(input.fileNameStr);
				zip.file(safeName, input.decompressed, {
					binary: true,
					optimizedBinaryString: true,
					date: input.date,
					dir: input.dir,
					comment: input.fileCommentStr.length ? input.fileCommentStr : null,
					unixPermissions: input.unixPermissions,
					dosPermissions: input.dosPermissions,
					createFolders: options.createFolders
				});
				if (!input.dir) zip.file(safeName).unsafeOriginalName = unsafeName;
			}
			if (zipEntries.zipComment.length) zip.comment = zipEntries.zipComment;
			return zip;
		});
	};
}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/jszip@3.10.1/node_modules/jszip/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Representation a of zip file in js
	* @constructor
	*/
	function JSZip() {
		if (!(this instanceof JSZip)) return new JSZip();
		if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
		this.files = Object.create(null);
		this.comment = null;
		this.root = "";
		this.clone = function() {
			var newObj = new JSZip();
			for (var i in this) if (typeof this[i] !== "function") newObj[i] = this[i];
			return newObj;
		};
	}
	JSZip.prototype = require_object();
	JSZip.prototype.loadAsync = require_load();
	JSZip.support = require_support();
	JSZip.defaults = require_defaults();
	JSZip.version = "3.10.1";
	JSZip.loadAsync = function(content, options) {
		return new JSZip().loadAsync(content, options);
	};
	JSZip.external = require_external();
	module.exports = JSZip;
}));

//#endregion
//#region ../../../../../helpers/dist/common/zip.js
var import_lib = /* @__PURE__ */ __toESM(require_lib(), 1);

//#endregion
//#region ../../../../../helpers/dist/common/router.js
var t$9 = class {
	handlers = /* @__PURE__ */ new Map();
	eventHandlers = /* @__PURE__ */ new Map();
	pending = /* @__PURE__ */ new Map();
	constructor(e) {
		this.transport = e, e.onMessage((e) => this.dispatch(e));
	}
	handle(e, t) {
		this.handlers.set(e, t);
	}
	on(e, t) {
		this.eventHandlers.has(e) || this.eventHandlers.set(e, /* @__PURE__ */ new Set());
		let n = this.eventHandlers.get(e), r = t;
		return n.add(r), () => n.delete(r);
	}
	async request(t, n, r) {
		let i = randomUUID(), a = r?.timeoutMs ?? 3e4;
		return new Promise((e, o) => {
			let s = setTimeout(() => {
				this.pending.delete(i), o(Error(`Request timeout: ${t}`));
			}, a);
			this.pending.set(i, {
				resolve: e,
				reject: o,
				timer: s
			}), this.transport.send({
				id: i,
				messageType: `request`,
				method: t,
				params: n,
				...r?.traceId === void 0 ? {} : { traceId: r.traceId },
				timestamp: Date.now()
			}).catch((e) => {
				clearTimeout(s), this.pending.delete(i), o(e);
			});
		});
	}
	async emit(t, n) {
		await this.transport.send({
			id: randomUUID(),
			messageType: `event`,
			method: t,
			params: n,
			timestamp: Date.now()
		});
	}
	async dispatch(e) {
		let t = {
			...e.traceId === void 0 ? {} : { traceId: e.traceId },
			transportType: this.transport.transportType
		};
		if (e.messageType === `response` || e.messageType === `error`) {
			let t = this.pending.get(e.id);
			if (t) if (clearTimeout(t.timer), this.pending.delete(e.id), e.error) {
				let n = Object.assign(Error(e.error.message), {
					code: e.error.code,
					stack: e.error.stack
				});
				t.reject(n);
			} else t.resolve(e.result);
			return;
		}
		if (e.messageType === `request` && e.method) {
			let n = this.handlers.get(e.method);
			if (!n) {
				await this.transport.send({
					id: e.id,
					messageType: `error`,
					error: {
						code: `METHOD_NOT_FOUND`,
						message: `Method not found: ${e.method}`
					},
					timestamp: Date.now()
				});
				return;
			}
			try {
				let r = await n(e.params, t);
				await this.transport.send({
					id: e.id,
					messageType: `response`,
					result: r,
					...e.traceId === void 0 ? {} : { traceId: e.traceId },
					timestamp: Date.now()
				});
			} catch (t) {
				let n = t instanceof Error ? t : Error(String(t));
				await this.transport.send({
					id: e.id,
					messageType: `error`,
					error: {
						code: n.code ?? `HANDLER_ERROR`,
						message: n.message,
						...n.stack === void 0 ? {} : { stack: n.stack }
					},
					...e.traceId === void 0 ? {} : { traceId: e.traceId },
					timestamp: Date.now()
				});
			}
			return;
		}
		if (e.messageType === `event` && e.method) {
			let n = this.eventHandlers.get(e.method);
			if (n) for (let r of n) r(e.params, t);
		}
	}
};

//#endregion
//#region ../../../../../helpers/dist/common/ipc-transport.js
var t$8 = class {
	transportType = `ipc`;
	async send(e) {
		if (!process.send) throw Error(`process.send is not available (not a child process)`);
		return new Promise((t, n) => {
			process.send(e, (e) => {
				e ? n(e) : t();
			});
		});
	}
	onMessage(e) {
		let t = (t) => {
			t && typeof t == `object` && `messageType` in t && e(t);
		};
		return process.on(`message`, t), () => process.off(`message`, t);
	}
	close() {
		return Promise.resolve();
	}
	sendReady() {
		return this.send({
			id: randomUUID(),
			messageType: `ready`,
			timestamp: Date.now()
		});
	}
};

//#endregion
//#region ../../../../../helpers/dist/common/plugin-factory.js
var r$6 = class {
	router;
	_transport;
	_started = !1;
	constructor() {
		this._transport = new t$8(), this.router = new t$9(this._transport), this.router.handle(`getConfig`, () => this.getConfig()), setImmediate(() => {
			this._started || this._doStart().catch((e) => {
				console.error(`[plugin] start failed:`, e), process.exit(1);
			});
		});
	}
	getConfig() {
		return {};
	}
	async _doStart() {
		this._started || (this._started = !0, process.send && (process.on(`uncaughtException`, (e) => {
			console.error(`[plugin] uncaughtException:`, e), process.exit(1);
		}), process.on(`unhandledRejection`, (e) => {
			console.error(`[plugin] unhandledRejection:`, e), process.exit(1);
		}), process.on(`SIGTERM`, () => process.exit(0)), process.on(`SIGINT`, () => process.exit(0)), await this._transport.send({
			id: randomUUID(),
			messageType: `ready`,
			timestamp: Date.now()
		})));
	}
};

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/core.js
/** A special constant with type `never` */
const NEVER = Object.freeze({ status: "aborted" });
function $constructor(name, initializer, params) {
	function init(inst, def) {
		if (!inst._zod) Object.defineProperty(inst, "_zod", {
			value: {
				def,
				constr: _,
				traits: /* @__PURE__ */ new Set()
			},
			enumerable: false
		});
		if (inst._zod.traits.has(name)) return;
		inst._zod.traits.add(name);
		initializer(inst, def);
		const proto = _.prototype;
		const keys = Object.keys(proto);
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i];
			if (!(k in inst)) inst[k] = proto[k].bind(inst);
		}
	}
	const Parent = params?.Parent ?? Object;
	class Definition extends Parent {}
	Object.defineProperty(Definition, "name", { value: name });
	function _(def) {
		var _a;
		const inst = params?.Parent ? new Definition() : this;
		init(inst, def);
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		for (const fn of inst._zod.deferred) fn();
		return inst;
	}
	Object.defineProperty(_, "init", { value: init });
	Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
		if (params?.Parent && inst instanceof params.Parent) return true;
		return inst?._zod?.traits?.has(name);
	} });
	Object.defineProperty(_, "name", { value: name });
	return _;
}
const $brand = Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
	constructor() {
		super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
	}
};
var $ZodEncodeError = class extends Error {
	constructor(name) {
		super(`Encountered unidirectional transform during encode: ${name}`);
		this.name = "ZodEncodeError";
	}
};
const globalConfig = {};
function config(newConfig) {
	if (newConfig) Object.assign(globalConfig, newConfig);
	return globalConfig;
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/util.js
var util_exports = /* @__PURE__ */ __exportAll({
	BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
	Class: () => Class,
	NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
	aborted: () => aborted,
	allowsEval: () => allowsEval,
	assert: () => assert,
	assertEqual: () => assertEqual,
	assertIs: () => assertIs,
	assertNever: () => assertNever,
	assertNotEqual: () => assertNotEqual,
	assignProp: () => assignProp,
	base64ToUint8Array: () => base64ToUint8Array,
	base64urlToUint8Array: () => base64urlToUint8Array,
	cached: () => cached,
	captureStackTrace: () => captureStackTrace,
	cleanEnum: () => cleanEnum,
	cleanRegex: () => cleanRegex,
	clone: () => clone,
	cloneDef: () => cloneDef,
	createTransparentProxy: () => createTransparentProxy,
	defineLazy: () => defineLazy,
	esc: () => esc,
	escapeRegex: () => escapeRegex,
	extend: () => extend,
	finalizeIssue: () => finalizeIssue,
	floatSafeRemainder: () => floatSafeRemainder,
	getElementAtPath: () => getElementAtPath,
	getEnumValues: () => getEnumValues,
	getLengthableOrigin: () => getLengthableOrigin,
	getParsedType: () => getParsedType,
	getSizableOrigin: () => getSizableOrigin,
	hexToUint8Array: () => hexToUint8Array,
	isObject: () => isObject,
	isPlainObject: () => isPlainObject,
	issue: () => issue,
	joinValues: () => joinValues,
	jsonStringifyReplacer: () => jsonStringifyReplacer,
	merge: () => merge,
	mergeDefs: () => mergeDefs,
	normalizeParams: () => normalizeParams,
	nullish: () => nullish$1,
	numKeys: () => numKeys,
	objectClone: () => objectClone,
	omit: () => omit,
	optionalKeys: () => optionalKeys,
	parsedType: () => parsedType,
	partial: () => partial,
	pick: () => pick,
	prefixIssues: () => prefixIssues,
	primitiveTypes: () => primitiveTypes,
	promiseAllObject: () => promiseAllObject,
	propertyKeyTypes: () => propertyKeyTypes,
	randomString: () => randomString,
	required: () => required,
	safeExtend: () => safeExtend,
	shallowClone: () => shallowClone,
	slugify: () => slugify,
	stringifyPrimitive: () => stringifyPrimitive,
	uint8ArrayToBase64: () => uint8ArrayToBase64,
	uint8ArrayToBase64url: () => uint8ArrayToBase64url,
	uint8ArrayToHex: () => uint8ArrayToHex,
	unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
	return val;
}
function assertNotEqual(val) {
	return val;
}
function assertIs(_arg) {}
function assertNever(_x) {
	throw new Error("Unexpected value in exhaustive check");
}
function assert(_) {}
function getEnumValues(entries) {
	const numericValues = Object.values(entries).filter((v) => typeof v === "number");
	return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
}
function joinValues(array, separator = "|") {
	return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
	if (typeof value === "bigint") return value.toString();
	return value;
}
function cached(getter) {
	return { get value() {
		{
			const value = getter();
			Object.defineProperty(this, "value", { value });
			return value;
		}
		throw new Error("cached value already set");
	} };
}
function nullish$1(input) {
	return input === null || input === void 0;
}
function cleanRegex(source) {
	const start = source.startsWith("^") ? 1 : 0;
	const end = source.endsWith("$") ? source.length - 1 : source.length;
	return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
	const valDecCount = (val.toString().split(".")[1] || "").length;
	const stepString = step.toString();
	let stepDecCount = (stepString.split(".")[1] || "").length;
	if (stepDecCount === 0 && /\d?e-\d?/.test(stepString)) {
		const match = stepString.match(/\d?e-(\d?)/);
		if (match?.[1]) stepDecCount = Number.parseInt(match[1]);
	}
	const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
	return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
}
const EVALUATING = Symbol("evaluating");
function defineLazy(object, key, getter) {
	let value = void 0;
	Object.defineProperty(object, key, {
		get() {
			if (value === EVALUATING) return;
			if (value === void 0) {
				value = EVALUATING;
				value = getter();
			}
			return value;
		},
		set(v) {
			Object.defineProperty(object, key, { value: v });
		},
		configurable: true
	});
}
function objectClone(obj) {
	return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
	Object.defineProperty(target, prop, {
		value,
		writable: true,
		enumerable: true,
		configurable: true
	});
}
function mergeDefs(...defs) {
	const mergedDescriptors = {};
	for (const def of defs) {
		const descriptors = Object.getOwnPropertyDescriptors(def);
		Object.assign(mergedDescriptors, descriptors);
	}
	return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
	return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
	if (!path) return obj;
	return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
	const keys = Object.keys(promisesObj);
	const promises = keys.map((key) => promisesObj[key]);
	return Promise.all(promises).then((results) => {
		const resolvedObj = {};
		for (let i = 0; i < keys.length; i++) resolvedObj[keys[i]] = results[i];
		return resolvedObj;
	});
}
function randomString(length = 10) {
	const chars = "abcdefghijklmnopqrstuvwxyz";
	let str = "";
	for (let i = 0; i < length; i++) str += chars[Math.floor(Math.random() * 26)];
	return str;
}
function esc(str) {
	return JSON.stringify(str);
}
function slugify(input) {
	return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
	return typeof data === "object" && data !== null && !Array.isArray(data);
}
const allowsEval = cached(() => {
	if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
	try {
		new Function("");
		return true;
	} catch (_) {
		return false;
	}
});
function isPlainObject(o) {
	if (isObject(o) === false) return false;
	const ctor = o.constructor;
	if (ctor === void 0) return true;
	if (typeof ctor !== "function") return true;
	const prot = ctor.prototype;
	if (isObject(prot) === false) return false;
	if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
	return true;
}
function shallowClone(o) {
	if (isPlainObject(o)) return { ...o };
	if (Array.isArray(o)) return [...o];
	return o;
}
function numKeys(data) {
	let keyCount = 0;
	for (const key in data) if (Object.prototype.hasOwnProperty.call(data, key)) keyCount++;
	return keyCount;
}
const getParsedType = (data) => {
	const t = typeof data;
	switch (t) {
		case "undefined": return "undefined";
		case "string": return "string";
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "boolean": return "boolean";
		case "function": return "function";
		case "bigint": return "bigint";
		case "symbol": return "symbol";
		case "object":
			if (Array.isArray(data)) return "array";
			if (data === null) return "null";
			if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return "promise";
			if (typeof Map !== "undefined" && data instanceof Map) return "map";
			if (typeof Set !== "undefined" && data instanceof Set) return "set";
			if (typeof Date !== "undefined" && data instanceof Date) return "date";
			if (typeof File !== "undefined" && data instanceof File) return "file";
			return "object";
		default: throw new Error(`Unknown data type: ${t}`);
	}
};
const propertyKeyTypes = new Set([
	"string",
	"number",
	"symbol"
]);
const primitiveTypes = new Set([
	"string",
	"number",
	"bigint",
	"boolean",
	"symbol",
	"undefined"
]);
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
	const cl = new inst._zod.constr(def ?? inst._zod.def);
	if (!def || params?.parent) cl._zod.parent = inst;
	return cl;
}
function normalizeParams(_params) {
	const params = _params;
	if (!params) return {};
	if (typeof params === "string") return { error: () => params };
	if (params?.message !== void 0) {
		if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
		params.error = params.message;
	}
	delete params.message;
	if (typeof params.error === "string") return {
		...params,
		error: () => params.error
	};
	return params;
}
function createTransparentProxy(getter) {
	let target;
	return new Proxy({}, {
		get(_, prop, receiver) {
			target ?? (target = getter());
			return Reflect.get(target, prop, receiver);
		},
		set(_, prop, value, receiver) {
			target ?? (target = getter());
			return Reflect.set(target, prop, value, receiver);
		},
		has(_, prop) {
			target ?? (target = getter());
			return Reflect.has(target, prop);
		},
		deleteProperty(_, prop) {
			target ?? (target = getter());
			return Reflect.deleteProperty(target, prop);
		},
		ownKeys(_) {
			target ?? (target = getter());
			return Reflect.ownKeys(target);
		},
		getOwnPropertyDescriptor(_, prop) {
			target ?? (target = getter());
			return Reflect.getOwnPropertyDescriptor(target, prop);
		},
		defineProperty(_, prop, descriptor) {
			target ?? (target = getter());
			return Reflect.defineProperty(target, prop, descriptor);
		}
	});
}
function stringifyPrimitive(value) {
	if (typeof value === "bigint") return value.toString() + "n";
	if (typeof value === "string") return `"${value}"`;
	return `${value}`;
}
function optionalKeys(shape) {
	return Object.keys(shape).filter((k) => {
		return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
	});
}
const NUMBER_FORMAT_RANGES = {
	safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
	int32: [-2147483648, 2147483647],
	uint32: [0, 4294967295],
	float32: [-34028234663852886e22, 34028234663852886e22],
	float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
const BIGINT_FORMAT_RANGES = {
	int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
	uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = {};
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				newShape[key] = currDef.shape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function omit(schema, mask) {
	const currDef = schema._zod.def;
	const checks = currDef.checks;
	if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const newShape = { ...schema._zod.def.shape };
			for (const key in mask) {
				if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				delete newShape[key];
			}
			assignProp(this, "shape", newShape);
			return newShape;
		},
		checks: []
	}));
}
function extend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) {
		const existingShape = schema._zod.def.shape;
		for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
	}
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function safeExtend(schema, shape) {
	if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const _shape = {
			...schema._zod.def.shape,
			...shape
		};
		assignProp(this, "shape", _shape);
		return _shape;
	} }));
}
function merge(a, b) {
	return clone(a, mergeDefs(a._zod.def, {
		get shape() {
			const _shape = {
				...a._zod.def.shape,
				...b._zod.def.shape
			};
			assignProp(this, "shape", _shape);
			return _shape;
		},
		get catchall() {
			return b._zod.def.catchall;
		},
		checks: []
	}));
}
function partial(Class, schema, mask) {
	const checks = schema._zod.def.checks;
	if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
	return clone(schema, mergeDefs(schema._zod.def, {
		get shape() {
			const oldShape = schema._zod.def.shape;
			const shape = { ...oldShape };
			if (mask) for (const key in mask) {
				if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
				if (!mask[key]) continue;
				shape[key] = Class ? new Class({
					type: "optional",
					innerType: oldShape[key]
				}) : oldShape[key];
			}
			else for (const key in oldShape) shape[key] = Class ? new Class({
				type: "optional",
				innerType: oldShape[key]
			}) : oldShape[key];
			assignProp(this, "shape", shape);
			return shape;
		},
		checks: []
	}));
}
function required(Class, schema, mask) {
	return clone(schema, mergeDefs(schema._zod.def, { get shape() {
		const oldShape = schema._zod.def.shape;
		const shape = { ...oldShape };
		if (mask) for (const key in mask) {
			if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
			if (!mask[key]) continue;
			shape[key] = new Class({
				type: "nonoptional",
				innerType: oldShape[key]
			});
		}
		else for (const key in oldShape) shape[key] = new Class({
			type: "nonoptional",
			innerType: oldShape[key]
		});
		assignProp(this, "shape", shape);
		return shape;
	} }));
}
function aborted(x, startIndex = 0) {
	if (x.aborted === true) return true;
	for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
	return false;
}
function prefixIssues(path, issues) {
	return issues.map((iss) => {
		var _a;
		(_a = iss).path ?? (_a.path = []);
		iss.path.unshift(path);
		return iss;
	});
}
function unwrapMessage(message) {
	return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
	const full = {
		...iss,
		path: iss.path ?? []
	};
	if (!iss.message) full.message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
	delete full.inst;
	delete full.continue;
	if (!ctx?.reportInput) delete full.input;
	return full;
}
function getSizableOrigin(input) {
	if (input instanceof Set) return "set";
	if (input instanceof Map) return "map";
	if (input instanceof File) return "file";
	return "unknown";
}
function getLengthableOrigin(input) {
	if (Array.isArray(input)) return "array";
	if (typeof input === "string") return "string";
	return "unknown";
}
function parsedType(data) {
	const t = typeof data;
	switch (t) {
		case "number": return Number.isNaN(data) ? "nan" : "number";
		case "object": {
			if (data === null) return "null";
			if (Array.isArray(data)) return "array";
			const obj = data;
			if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
		}
	}
	return t;
}
function issue(...args) {
	const [iss, input, inst] = args;
	if (typeof iss === "string") return {
		message: iss,
		code: "custom",
		input,
		inst
	};
	return { ...iss };
}
function cleanEnum(obj) {
	return Object.entries(obj).filter(([k, _]) => {
		return Number.isNaN(Number.parseInt(k, 10));
	}).map((el) => el[1]);
}
function base64ToUint8Array(base64) {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
	return bytes;
}
function uint8ArrayToBase64(bytes) {
	let binaryString = "";
	for (let i = 0; i < bytes.length; i++) binaryString += String.fromCharCode(bytes[i]);
	return btoa(binaryString);
}
function base64urlToUint8Array(base64url) {
	const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
	return base64ToUint8Array(base64 + "=".repeat((4 - base64.length % 4) % 4));
}
function uint8ArrayToBase64url(bytes) {
	return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex) {
	const cleanHex = hex.replace(/^0x/, "");
	if (cleanHex.length % 2 !== 0) throw new Error("Invalid hex string length");
	const bytes = new Uint8Array(cleanHex.length / 2);
	for (let i = 0; i < cleanHex.length; i += 2) bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
	return bytes;
}
function uint8ArrayToHex(bytes) {
	return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
	constructor(..._args) {}
};

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/errors.js
const initializer$1 = (inst, def) => {
	inst.name = "$ZodError";
	Object.defineProperty(inst, "_zod", {
		value: inst._zod,
		enumerable: false
	});
	Object.defineProperty(inst, "issues", {
		value: def,
		enumerable: false
	});
	inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
	Object.defineProperty(inst, "toString", {
		value: () => inst.message,
		enumerable: false
	});
};
const $ZodError = $constructor("$ZodError", initializer$1);
const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
	const fieldErrors = {};
	const formErrors = [];
	for (const sub of error.issues) if (sub.path.length > 0) {
		fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
		fieldErrors[sub.path[0]].push(mapper(sub));
	} else formErrors.push(mapper(sub));
	return {
		formErrors,
		fieldErrors
	};
}
function formatError(error, mapper = (issue) => issue.message) {
	const fieldErrors = { _errors: [] };
	const processError = (error) => {
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues });
		else if (issue.code === "invalid_element") processError({ issues: issue.issues });
		else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
		else {
			let curr = fieldErrors;
			let i = 0;
			while (i < issue.path.length) {
				const el = issue.path[i];
				if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
				else {
					curr[el] = curr[el] || { _errors: [] };
					curr[el]._errors.push(mapper(issue));
				}
				curr = curr[el];
				i++;
			}
		}
	};
	processError(error);
	return fieldErrors;
}
function treeifyError(error, mapper = (issue) => issue.message) {
	const result = { errors: [] };
	const processError = (error, path = []) => {
		var _a, _b;
		for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, issue.path));
		else if (issue.code === "invalid_key") processError({ issues: issue.issues }, issue.path);
		else if (issue.code === "invalid_element") processError({ issues: issue.issues }, issue.path);
		else {
			const fullpath = [...path, ...issue.path];
			if (fullpath.length === 0) {
				result.errors.push(mapper(issue));
				continue;
			}
			let curr = result;
			let i = 0;
			while (i < fullpath.length) {
				const el = fullpath[i];
				const terminal = i === fullpath.length - 1;
				if (typeof el === "string") {
					curr.properties ?? (curr.properties = {});
					(_a = curr.properties)[el] ?? (_a[el] = { errors: [] });
					curr = curr.properties[el];
				} else {
					curr.items ?? (curr.items = []);
					(_b = curr.items)[el] ?? (_b[el] = { errors: [] });
					curr = curr.items[el];
				}
				if (terminal) curr.errors.push(mapper(issue));
				i++;
			}
		}
	};
	processError(error);
	return result;
}
/** Format a ZodError as a human-readable string in the following form.
*
* From
*
* ```ts
* ZodError {
*   issues: [
*     {
*       expected: 'string',
*       code: 'invalid_type',
*       path: [ 'username' ],
*       message: 'Invalid input: expected string'
*     },
*     {
*       expected: 'number',
*       code: 'invalid_type',
*       path: [ 'favoriteNumbers', 1 ],
*       message: 'Invalid input: expected number'
*     }
*   ];
* }
* ```
*
* to
*
* ```
* username
*   ✖ Expected number, received string at "username
* favoriteNumbers[0]
*   ✖ Invalid input: expected number
* ```
*/
function toDotPath(_path) {
	const segs = [];
	const path = _path.map((seg) => typeof seg === "object" ? seg.key : seg);
	for (const seg of path) if (typeof seg === "number") segs.push(`[${seg}]`);
	else if (typeof seg === "symbol") segs.push(`[${JSON.stringify(String(seg))}]`);
	else if (/[^\w$]/.test(seg)) segs.push(`[${JSON.stringify(seg)}]`);
	else {
		if (segs.length) segs.push(".");
		segs.push(seg);
	}
	return segs.join("");
}
function prettifyError(error) {
	const lines = [];
	const issues = [...error.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
	for (const issue of issues) {
		lines.push(`✖ ${issue.message}`);
		if (issue.path?.length) lines.push(`  → at ${toDotPath(issue.path)}`);
	}
	return lines.join("\n");
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/parse.js
const _parse = (_Err) => (schema, value, _ctx, _params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	if (result.issues.length) {
		const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, _params?.callee);
		throw e;
	}
	return result.value;
};
const parse$1 = /* @__PURE__ */ _parse($ZodRealError);
const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	if (result.issues.length) {
		const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
		captureStackTrace(e, params?.callee);
		throw e;
	}
	return result.value;
};
const parseAsync$1 = /* @__PURE__ */ _parseAsync($ZodRealError);
const _safeParse = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? {
		..._ctx,
		async: false
	} : { async: false };
	const result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) throw new $ZodAsyncError();
	return result.issues.length ? {
		success: false,
		error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParse$1 = /* @__PURE__ */ _safeParse($ZodRealError);
const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
	let result = schema._zod.run({
		value,
		issues: []
	}, ctx);
	if (result instanceof Promise) result = await result;
	return result.issues.length ? {
		success: false,
		error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	} : {
		success: true,
		data: result.value
	};
};
const safeParseAsync$1 = /* @__PURE__ */ _safeParseAsync($ZodRealError);
const _encode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _parse(_Err)(schema, value, ctx);
};
const encode$1 = /* @__PURE__ */ _encode($ZodRealError);
const _decode = (_Err) => (schema, value, _ctx) => {
	return _parse(_Err)(schema, value, _ctx);
};
const decode$1 = /* @__PURE__ */ _decode($ZodRealError);
const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _parseAsync(_Err)(schema, value, ctx);
};
const encodeAsync$1 = /* @__PURE__ */ _encodeAsync($ZodRealError);
const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _parseAsync(_Err)(schema, value, _ctx);
};
const decodeAsync$1 = /* @__PURE__ */ _decodeAsync($ZodRealError);
const _safeEncode = (_Err) => (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _safeParse(_Err)(schema, value, ctx);
};
const safeEncode$1 = /* @__PURE__ */ _safeEncode($ZodRealError);
const _safeDecode = (_Err) => (schema, value, _ctx) => {
	return _safeParse(_Err)(schema, value, _ctx);
};
const safeDecode$1 = /* @__PURE__ */ _safeDecode($ZodRealError);
const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
	const ctx = _ctx ? Object.assign(_ctx, { direction: "backward" }) : { direction: "backward" };
	return _safeParseAsync(_Err)(schema, value, ctx);
};
const safeEncodeAsync$1 = /* @__PURE__ */ _safeEncodeAsync($ZodRealError);
const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
	return _safeParseAsync(_Err)(schema, value, _ctx);
};
const safeDecodeAsync$1 = /* @__PURE__ */ _safeDecodeAsync($ZodRealError);

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/regexes.js
var regexes_exports = /* @__PURE__ */ __exportAll({
	base64: () => base64$1,
	base64url: () => base64url$1,
	bigint: () => bigint$2,
	boolean: () => boolean$2,
	browserEmail: () => browserEmail,
	cidrv4: () => cidrv4$1,
	cidrv6: () => cidrv6$1,
	cuid: () => cuid$1,
	cuid2: () => cuid2$1,
	date: () => date$3,
	datetime: () => datetime$1,
	domain: () => domain,
	duration: () => duration$1,
	e164: () => e164$1,
	email: () => email$1,
	emoji: () => emoji$1,
	extendedDuration: () => extendedDuration,
	guid: () => guid$1,
	hex: () => hex$1,
	hostname: () => hostname$1,
	html5Email: () => html5Email,
	idnEmail: () => idnEmail,
	integer: () => integer,
	ipv4: () => ipv4$1,
	ipv6: () => ipv6$1,
	ksuid: () => ksuid$1,
	lowercase: () => lowercase,
	mac: () => mac$1,
	md5_base64: () => md5_base64,
	md5_base64url: () => md5_base64url,
	md5_hex: () => md5_hex,
	nanoid: () => nanoid$1,
	null: () => _null$2,
	number: () => number$2,
	rfc5322Email: () => rfc5322Email,
	sha1_base64: () => sha1_base64,
	sha1_base64url: () => sha1_base64url,
	sha1_hex: () => sha1_hex,
	sha256_base64: () => sha256_base64,
	sha256_base64url: () => sha256_base64url,
	sha256_hex: () => sha256_hex,
	sha384_base64: () => sha384_base64,
	sha384_base64url: () => sha384_base64url,
	sha384_hex: () => sha384_hex,
	sha512_base64: () => sha512_base64,
	sha512_base64url: () => sha512_base64url,
	sha512_hex: () => sha512_hex,
	string: () => string$2,
	time: () => time$1,
	ulid: () => ulid$1,
	undefined: () => _undefined$2,
	unicodeEmail: () => unicodeEmail,
	uppercase: () => uppercase,
	uuid: () => uuid$1,
	uuid4: () => uuid4,
	uuid6: () => uuid6,
	uuid7: () => uuid7,
	xid: () => xid$1
});
const cuid$1 = /^[cC][^\s-]{8,}$/;
const cuid2$1 = /^[0-9a-z]+$/;
const ulid$1 = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
const xid$1 = /^[0-9a-vA-V]{20}$/;
const ksuid$1 = /^[A-Za-z0-9]{27}$/;
const nanoid$1 = /^[a-zA-Z0-9_-]{21}$/;
/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
/** Implements ISO 8601-2 extensions like explicit +- prefixes, mixing weeks with other units, and fractional/negative components. */
const extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
const guid$1 = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
/** Returns a regex for validating an RFC 9562/4122 UUID.
*
* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
const uuid$1 = (version) => {
	if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
	return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
const uuid4 = /* @__PURE__ */ uuid$1(4);
const uuid6 = /* @__PURE__ */ uuid$1(6);
const uuid7 = /* @__PURE__ */ uuid$1(7);
/** Practical email validation */
const email$1 = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
/** Equivalent to the HTML5 input[type=email] validation implemented by browsers. Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email */
const html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
/** The classic emailregex.com regex for RFC 5322-compliant emails */
const rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
/** A loose regex that allows Unicode characters, enforces length limits, and that's about it. */
const unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
const idnEmail = unicodeEmail;
const browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji$1() {
	return new RegExp(_emoji$1, "u");
}
const ipv4$1 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6$1 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
const mac$1 = (delimiter) => {
	const escapedDelim = escapeRegex(delimiter ?? ":");
	return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
};
const cidrv4$1 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
const cidrv6$1 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64$1 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
const base64url$1 = /^[A-Za-z0-9_-]*$/;
const hostname$1 = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
const domain = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
const e164$1 = /^\+[1-9]\d{6,14}$/;
const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
const date$3 = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
	const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
	return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function time$1(args) {
	return new RegExp(`^${timeSource(args)}$`);
}
function datetime$1(args) {
	const time = timeSource({ precision: args.precision });
	const opts = ["Z"];
	if (args.local) opts.push("");
	if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
	const timeRegex = `${time}(?:${opts.join("|")})`;
	return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
const string$2 = (params) => {
	const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
	return new RegExp(`^${regex}$`);
};
const bigint$2 = /^-?\d+n?$/;
const integer = /^-?\d+$/;
const number$2 = /^-?\d+(?:\.\d+)?$/;
const boolean$2 = /^(?:true|false)$/i;
const _null$2 = /^null$/i;
const _undefined$2 = /^undefined$/i;
const lowercase = /^[^A-Z]*$/;
const uppercase = /^[^a-z]*$/;
const hex$1 = /^[0-9a-fA-F]*$/;
function fixedBase64(bodyLength, padding) {
	return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}
function fixedBase64url(length) {
	return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}
const md5_hex = /^[0-9a-fA-F]{32}$/;
const md5_base64 = /* @__PURE__ */ fixedBase64(22, "==");
const md5_base64url = /* @__PURE__ */ fixedBase64url(22);
const sha1_hex = /^[0-9a-fA-F]{40}$/;
const sha1_base64 = /* @__PURE__ */ fixedBase64(27, "=");
const sha1_base64url = /* @__PURE__ */ fixedBase64url(27);
const sha256_hex = /^[0-9a-fA-F]{64}$/;
const sha256_base64 = /* @__PURE__ */ fixedBase64(43, "=");
const sha256_base64url = /* @__PURE__ */ fixedBase64url(43);
const sha384_hex = /^[0-9a-fA-F]{96}$/;
const sha384_base64 = /* @__PURE__ */ fixedBase64(64, "");
const sha384_base64url = /* @__PURE__ */ fixedBase64url(64);
const sha512_hex = /^[0-9a-fA-F]{128}$/;
const sha512_base64 = /* @__PURE__ */ fixedBase64(86, "==");
const sha512_base64url = /* @__PURE__ */ fixedBase64url(86);

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/checks.js
const $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
	var _a;
	inst._zod ?? (inst._zod = {});
	inst._zod.def = def;
	(_a = inst._zod).onattach ?? (_a.onattach = []);
});
const numericOriginMap = {
	number: "number",
	bigint: "bigint",
	object: "date"
};
const $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
		if (def.value < curr) if (def.inclusive) bag.maximum = def.value;
		else bag.exclusiveMaximum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
	$ZodCheck.init(inst, def);
	const origin = numericOriginMap[typeof def.value];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
		if (def.value > curr) if (def.inclusive) bag.minimum = def.value;
		else bag.exclusiveMinimum = def.value;
	});
	inst._zod.check = (payload) => {
		if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
			input: payload.value,
			inclusive: def.inclusive,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		var _a;
		(_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
	});
	inst._zod.check = (payload) => {
		if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
		if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
		payload.issues.push({
			origin: typeof payload.value,
			code: "not_multiple_of",
			divisor: def.value,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	def.format = def.format || "float64";
	const isInt = def.format?.includes("int");
	const origin = isInt ? "int" : "number";
	const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		bag.minimum = minimum;
		bag.maximum = maximum;
		if (isInt) bag.pattern = integer;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (isInt) {
			if (!Number.isInteger(input)) {
				payload.issues.push({
					expected: origin,
					format: def.format,
					code: "invalid_type",
					continue: false,
					input,
					inst
				});
				return;
			}
			if (!Number.isSafeInteger(input)) {
				if (input > 0) payload.issues.push({
					input,
					code: "too_big",
					maximum: Number.MAX_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				else payload.issues.push({
					input,
					code: "too_small",
					minimum: Number.MIN_SAFE_INTEGER,
					note: "Integers must be within the safe integer range.",
					inst,
					origin,
					inclusive: true,
					continue: !def.abort
				});
				return;
			}
		}
		if (input < minimum) payload.issues.push({
			origin: "number",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "number",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckBigIntFormat = /* @__PURE__ */ $constructor("$ZodCheckBigIntFormat", (inst, def) => {
	$ZodCheck.init(inst, def);
	const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		bag.minimum = minimum;
		bag.maximum = maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input < minimum) payload.issues.push({
			origin: "bigint",
			input,
			code: "too_small",
			minimum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
		if (input > maximum) payload.issues.push({
			origin: "bigint",
			input,
			code: "too_big",
			maximum,
			inclusive: true,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxSize = /* @__PURE__ */ $constructor("$ZodCheckMaxSize", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish$1(val) && val.size !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
		if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.size <= def.maximum) return;
		payload.issues.push({
			origin: getSizableOrigin(input),
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinSize = /* @__PURE__ */ $constructor("$ZodCheckMinSize", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish$1(val) && val.size !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
		if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.size >= def.minimum) return;
		payload.issues.push({
			origin: getSizableOrigin(input),
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckSizeEquals = /* @__PURE__ */ $constructor("$ZodCheckSizeEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish$1(val) && val.size !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.minimum = def.size;
		bag.maximum = def.size;
		bag.size = def.size;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const size = input.size;
		if (size === def.size) return;
		const tooBig = size > def.size;
		payload.issues.push({
			origin: getSizableOrigin(input),
			...tooBig ? {
				code: "too_big",
				maximum: def.size
			} : {
				code: "too_small",
				minimum: def.size
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish$1(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
		if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length <= def.maximum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_big",
			maximum: def.maximum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish$1(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
		if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		if (input.length >= def.minimum) return;
		const origin = getLengthableOrigin(input);
		payload.issues.push({
			origin,
			code: "too_small",
			minimum: def.minimum,
			inclusive: true,
			input,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
	var _a;
	$ZodCheck.init(inst, def);
	(_a = inst._zod.def).when ?? (_a.when = (payload) => {
		const val = payload.value;
		return !nullish$1(val) && val.length !== void 0;
	});
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.minimum = def.length;
		bag.maximum = def.length;
		bag.length = def.length;
	});
	inst._zod.check = (payload) => {
		const input = payload.value;
		const length = input.length;
		if (length === def.length) return;
		const origin = getLengthableOrigin(input);
		const tooBig = length > def.length;
		payload.issues.push({
			origin,
			...tooBig ? {
				code: "too_big",
				maximum: def.length
			} : {
				code: "too_small",
				minimum: def.length
			},
			inclusive: true,
			exact: true,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
	var _a, _b;
	$ZodCheck.init(inst, def);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.format = def.format;
		if (def.pattern) {
			bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
			bag.patterns.add(def.pattern);
		}
	});
	if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			...def.pattern ? { pattern: def.pattern.toString() } : {},
			inst,
			continue: !def.abort
		});
	});
	else (_b = inst._zod).check ?? (_b.check = () => {});
});
const $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		def.pattern.lastIndex = 0;
		if (def.pattern.test(payload.value)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "regex",
			input: payload.value,
			pattern: def.pattern.toString(),
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
	def.pattern ?? (def.pattern = lowercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
	def.pattern ?? (def.pattern = uppercase);
	$ZodCheckStringFormat.init(inst, def);
});
const $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
	$ZodCheck.init(inst, def);
	const escapedRegex = escapeRegex(def.includes);
	const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
	def.pattern = pattern;
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.includes(def.includes, def.position)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "includes",
			includes: def.includes,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.startsWith(def.prefix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "starts_with",
			prefix: def.prefix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
	$ZodCheck.init(inst, def);
	const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
	def.pattern ?? (def.pattern = pattern);
	inst._zod.onattach.push((inst) => {
		const bag = inst._zod.bag;
		bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
		bag.patterns.add(pattern);
	});
	inst._zod.check = (payload) => {
		if (payload.value.endsWith(def.suffix)) return;
		payload.issues.push({
			origin: "string",
			code: "invalid_format",
			format: "ends_with",
			suffix: def.suffix,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function handleCheckPropertyResult(result, payload, property) {
	if (result.issues.length) payload.issues.push(...prefixIssues(property, result.issues));
}
const $ZodCheckProperty = /* @__PURE__ */ $constructor("$ZodCheckProperty", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		const result = def.schema._zod.run({
			value: payload.value[def.property],
			issues: []
		}, {});
		if (result instanceof Promise) return result.then((result) => handleCheckPropertyResult(result, payload, def.property));
		handleCheckPropertyResult(result, payload, def.property);
	};
});
const $ZodCheckMimeType = /* @__PURE__ */ $constructor("$ZodCheckMimeType", (inst, def) => {
	$ZodCheck.init(inst, def);
	const mimeSet = new Set(def.mime);
	inst._zod.onattach.push((inst) => {
		inst._zod.bag.mime = def.mime;
	});
	inst._zod.check = (payload) => {
		if (mimeSet.has(payload.value.type)) return;
		payload.issues.push({
			code: "invalid_value",
			values: def.mime,
			input: payload.value.type,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
	$ZodCheck.init(inst, def);
	inst._zod.check = (payload) => {
		payload.value = def.tx(payload.value);
	};
});

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/doc.js
var Doc = class {
	constructor(args = []) {
		this.content = [];
		this.indent = 0;
		if (this) this.args = args;
	}
	indented(fn) {
		this.indent += 1;
		fn(this);
		this.indent -= 1;
	}
	write(arg) {
		if (typeof arg === "function") {
			arg(this, { execution: "sync" });
			arg(this, { execution: "async" });
			return;
		}
		const lines = arg.split("\n").filter((x) => x);
		const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
		const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
		for (const line of dedented) this.content.push(line);
	}
	compile() {
		const F = Function;
		const args = this?.args;
		const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
		return new F(...args, lines.join("\n"));
	}
};

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/versions.js
const version = {
	major: 4,
	minor: 3,
	patch: 6
};

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/schemas.js
const $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
	var _a;
	inst ?? (inst = {});
	inst._zod.def = def;
	inst._zod.bag = inst._zod.bag || {};
	inst._zod.version = version;
	const checks = [...inst._zod.def.checks ?? []];
	if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
	for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
	if (checks.length === 0) {
		(_a = inst._zod).deferred ?? (_a.deferred = []);
		inst._zod.deferred?.push(() => {
			inst._zod.run = inst._zod.parse;
		});
	} else {
		const runChecks = (payload, checks, ctx) => {
			let isAborted = aborted(payload);
			let asyncResult;
			for (const ch of checks) {
				if (ch._zod.def.when) {
					if (!ch._zod.def.when(payload)) continue;
				} else if (isAborted) continue;
				const currLen = payload.issues.length;
				const _ = ch._zod.check(payload);
				if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
				if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
					await _;
					if (payload.issues.length === currLen) return;
					if (!isAborted) isAborted = aborted(payload, currLen);
				});
				else {
					if (payload.issues.length === currLen) continue;
					if (!isAborted) isAborted = aborted(payload, currLen);
				}
			}
			if (asyncResult) return asyncResult.then(() => {
				return payload;
			});
			return payload;
		};
		const handleCanaryResult = (canary, payload, ctx) => {
			if (aborted(canary)) {
				canary.aborted = true;
				return canary;
			}
			const checkResult = runChecks(payload, checks, ctx);
			if (checkResult instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
			}
			return inst._zod.parse(checkResult, ctx);
		};
		inst._zod.run = (payload, ctx) => {
			if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
			if (ctx.direction === "backward") {
				const canary = inst._zod.parse({
					value: payload.value,
					issues: []
				}, {
					...ctx,
					skipChecks: true
				});
				if (canary instanceof Promise) return canary.then((canary) => {
					return handleCanaryResult(canary, payload, ctx);
				});
				return handleCanaryResult(canary, payload, ctx);
			}
			const result = inst._zod.parse(payload, ctx);
			if (result instanceof Promise) {
				if (ctx.async === false) throw new $ZodAsyncError();
				return result.then((result) => runChecks(result, checks, ctx));
			}
			return runChecks(result, checks, ctx);
		};
	}
	defineLazy(inst, "~standard", () => ({
		validate: (value) => {
			try {
				const r = safeParse$1(inst, value);
				return r.success ? { value: r.data } : { issues: r.error?.issues };
			} catch (_) {
				return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
			}
		},
		vendor: "zod",
		version: 1
	}));
});
const $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$2(inst._zod.bag);
	inst._zod.parse = (payload, _) => {
		if (def.coerce) try {
			payload.value = String(payload.value);
		} catch (_) {}
		if (typeof payload.value === "string") return payload;
		payload.issues.push({
			expected: "string",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
	$ZodCheckStringFormat.init(inst, def);
	$ZodString.init(inst, def);
});
const $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
	def.pattern ?? (def.pattern = guid$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
	if (def.version) {
		const v = {
			v1: 1,
			v2: 2,
			v3: 3,
			v4: 4,
			v5: 5,
			v6: 6,
			v7: 7,
			v8: 8
		}[def.version];
		if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
		def.pattern ?? (def.pattern = uuid$1(v));
	} else def.pattern ?? (def.pattern = uuid$1());
	$ZodStringFormat.init(inst, def);
});
const $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
	def.pattern ?? (def.pattern = email$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		try {
			const trimmed = payload.value.trim();
			const url = new URL(trimmed);
			if (def.hostname) {
				def.hostname.lastIndex = 0;
				if (!def.hostname.test(url.hostname)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid hostname",
					pattern: def.hostname.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.protocol) {
				def.protocol.lastIndex = 0;
				if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
					code: "invalid_format",
					format: "url",
					note: "Invalid protocol",
					pattern: def.protocol.source,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			}
			if (def.normalize) payload.value = url.href;
			else payload.value = trimmed;
			return;
		} catch (_) {
			payload.issues.push({
				code: "invalid_format",
				format: "url",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
	def.pattern ?? (def.pattern = emoji$1());
	$ZodStringFormat.init(inst, def);
});
const $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
	def.pattern ?? (def.pattern = nanoid$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
	def.pattern ?? (def.pattern = cuid$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
	def.pattern ?? (def.pattern = cuid2$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
	def.pattern ?? (def.pattern = ulid$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
	def.pattern ?? (def.pattern = xid$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
	def.pattern ?? (def.pattern = ksuid$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
	def.pattern ?? (def.pattern = datetime$1(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
	def.pattern ?? (def.pattern = date$3);
	$ZodStringFormat.init(inst, def);
});
const $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
	def.pattern ?? (def.pattern = time$1(def));
	$ZodStringFormat.init(inst, def);
});
const $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
	def.pattern ?? (def.pattern = duration$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
	def.pattern ?? (def.pattern = ipv4$1);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv4`;
});
const $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
	def.pattern ?? (def.pattern = ipv6$1);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `ipv6`;
	inst._zod.check = (payload) => {
		try {
			new URL(`http://[${payload.value}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "ipv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
const $ZodMAC = /* @__PURE__ */ $constructor("$ZodMAC", (inst, def) => {
	def.pattern ?? (def.pattern = mac$1(def.delimiter));
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.format = `mac`;
});
const $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv4$1);
	$ZodStringFormat.init(inst, def);
});
const $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
	def.pattern ?? (def.pattern = cidrv6$1);
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		const parts = payload.value.split("/");
		try {
			if (parts.length !== 2) throw new Error();
			const [address, prefix] = parts;
			if (!prefix) throw new Error();
			const prefixNum = Number(prefix);
			if (`${prefixNum}` !== prefix) throw new Error();
			if (prefixNum < 0 || prefixNum > 128) throw new Error();
			new URL(`http://[${address}]`);
		} catch {
			payload.issues.push({
				code: "invalid_format",
				format: "cidrv6",
				input: payload.value,
				inst,
				continue: !def.abort
			});
		}
	};
});
function isValidBase64(data) {
	if (data === "") return true;
	if (data.length % 4 !== 0) return false;
	try {
		atob(data);
		return true;
	} catch {
		return false;
	}
}
const $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
	def.pattern ?? (def.pattern = base64$1);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64";
	inst._zod.check = (payload) => {
		if (isValidBase64(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
function isValidBase64URL(data) {
	if (!base64url$1.test(data)) return false;
	const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
	return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
}
const $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
	def.pattern ?? (def.pattern = base64url$1);
	$ZodStringFormat.init(inst, def);
	inst._zod.bag.contentEncoding = "base64url";
	inst._zod.check = (payload) => {
		if (isValidBase64URL(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "base64url",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
	def.pattern ?? (def.pattern = e164$1);
	$ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
	try {
		const tokensParts = token.split(".");
		if (tokensParts.length !== 3) return false;
		const [header] = tokensParts;
		if (!header) return false;
		const parsedHeader = JSON.parse(atob(header));
		if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
		if (!parsedHeader.alg) return false;
		if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
		return true;
	} catch {
		return false;
	}
}
const $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (isValidJWT(payload.value, def.alg)) return;
		payload.issues.push({
			code: "invalid_format",
			format: "jwt",
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodCustomStringFormat = /* @__PURE__ */ $constructor("$ZodCustomStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	inst._zod.check = (payload) => {
		if (def.fn(payload.value)) return;
		payload.issues.push({
			code: "invalid_format",
			format: def.format,
			input: payload.value,
			inst,
			continue: !def.abort
		});
	};
});
const $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = inst._zod.bag.pattern ?? number$2;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Number(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
		const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
		payload.issues.push({
			expected: "number",
			code: "invalid_type",
			input,
			inst,
			...received ? { received } : {}
		});
		return payload;
	};
});
const $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
	$ZodCheckNumberFormat.init(inst, def);
	$ZodNumber.init(inst, def);
});
const $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = boolean$2;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = Boolean(payload.value);
		} catch (_) {}
		const input = payload.value;
		if (typeof input === "boolean") return payload;
		payload.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = bigint$2;
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = BigInt(payload.value);
		} catch (_) {}
		if (typeof payload.value === "bigint") return payload;
		payload.issues.push({
			expected: "bigint",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodBigIntFormat = /* @__PURE__ */ $constructor("$ZodBigIntFormat", (inst, def) => {
	$ZodCheckBigIntFormat.init(inst, def);
	$ZodBigInt.init(inst, def);
});
const $ZodSymbol = /* @__PURE__ */ $constructor("$ZodSymbol", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (typeof input === "symbol") return payload;
		payload.issues.push({
			expected: "symbol",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = _undefined$2;
	inst._zod.values = new Set([void 0]);
	inst._zod.optin = "optional";
	inst._zod.optout = "optional";
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (typeof input === "undefined") return payload;
		payload.issues.push({
			expected: "undefined",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.pattern = _null$2;
	inst._zod.values = new Set([null]);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (input === null) return payload;
		payload.issues.push({
			expected: "null",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload) => payload;
});
const $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		payload.issues.push({
			expected: "never",
			code: "invalid_type",
			input: payload.value,
			inst
		});
		return payload;
	};
});
const $ZodVoid = /* @__PURE__ */ $constructor("$ZodVoid", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (typeof input === "undefined") return payload;
		payload.issues.push({
			expected: "void",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		if (def.coerce) try {
			payload.value = new Date(payload.value);
		} catch (_err) {}
		const input = payload.value;
		const isDate = input instanceof Date;
		if (isDate && !Number.isNaN(input.getTime())) return payload;
		payload.issues.push({
			expected: "date",
			code: "invalid_type",
			input,
			...isDate ? { received: "Invalid Date" } : {},
			inst
		});
		return payload;
	};
});
function handleArrayResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				expected: "array",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = Array(input.length);
		const proms = [];
		for (let i = 0; i < input.length; i++) {
			const item = input[i];
			const result = def.element._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
			else handleArrayResult(result, payload, i);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handlePropertyResult(result, final, key, input, isOptionalOut) {
	if (result.issues.length) {
		if (isOptionalOut && !(key in input)) return;
		final.issues.push(...prefixIssues(key, result.issues));
	}
	if (result.value === void 0) {
		if (key in input) final.value[key] = void 0;
	} else final.value[key] = result.value;
}
function normalizeDef(def) {
	const keys = Object.keys(def.shape);
	for (const k of keys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
	const okeys = optionalKeys(def.shape);
	return {
		...def,
		keys,
		keySet: new Set(keys),
		numKeys: keys.length,
		optionalKeys: new Set(okeys)
	};
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
	const unrecognized = [];
	const keySet = def.keySet;
	const _catchall = def.catchall._zod;
	const t = _catchall.def.type;
	const isOptionalOut = _catchall.optout === "optional";
	for (const key in input) {
		if (keySet.has(key)) continue;
		if (t === "never") {
			unrecognized.push(key);
			continue;
		}
		const r = _catchall.run({
			value: input[key],
			issues: []
		}, ctx);
		if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalOut)));
		else handlePropertyResult(r, payload, key, input, isOptionalOut);
	}
	if (unrecognized.length) payload.issues.push({
		code: "unrecognized_keys",
		keys: unrecognized,
		input,
		inst
	});
	if (!proms.length) return payload;
	return Promise.all(proms).then(() => {
		return payload;
	});
}
const $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
	$ZodType.init(inst, def);
	if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
		const sh = def.shape;
		Object.defineProperty(def, "shape", { get: () => {
			const newSh = { ...sh };
			Object.defineProperty(def, "shape", { value: newSh });
			return newSh;
		} });
	}
	const _normalized = cached(() => normalizeDef(def));
	defineLazy(inst._zod, "propValues", () => {
		const shape = def.shape;
		const propValues = {};
		for (const key in shape) {
			const field = shape[key]._zod;
			if (field.values) {
				propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
				for (const v of field.values) propValues[key].add(v);
			}
		}
		return propValues;
	});
	const isObject$2 = isObject;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$2(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		payload.value = {};
		const proms = [];
		const shape = value.shape;
		for (const key of value.keys) {
			const el = shape[key];
			const isOptionalOut = el._zod.optout === "optional";
			const r = el._zod.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalOut)));
			else handlePropertyResult(r, payload, key, input, isOptionalOut);
		}
		if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
		return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
	};
});
const $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
	$ZodObject.init(inst, def);
	const superParse = inst._zod.parse;
	const _normalized = cached(() => normalizeDef(def));
	const generateFastpass = (shape) => {
		const doc = new Doc([
			"shape",
			"payload",
			"ctx"
		]);
		const normalized = _normalized.value;
		const parseStr = (key) => {
			const k = esc(key);
			return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
		};
		doc.write(`const input = payload.value;`);
		const ids = Object.create(null);
		let counter = 0;
		for (const key of normalized.keys) ids[key] = `key_${counter++}`;
		doc.write(`const newResult = {};`);
		for (const key of normalized.keys) {
			const id = ids[key];
			const k = esc(key);
			const isOptionalOut = shape[key]?._zod?.optout === "optional";
			doc.write(`const ${id} = ${parseStr(key)};`);
			if (isOptionalOut) doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }

        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }

      `);
			else doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }

        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }

      `);
		}
		doc.write(`payload.value = newResult;`);
		doc.write(`return payload;`);
		const fn = doc.compile();
		return (payload, ctx) => fn(shape, payload, ctx);
	};
	let fastpass;
	const isObject$1 = isObject;
	const jit = !globalConfig.jitless;
	const allowsEval$1 = allowsEval;
	const fastEnabled = jit && allowsEval$1.value;
	const catchall = def.catchall;
	let value;
	inst._zod.parse = (payload, ctx) => {
		value ?? (value = _normalized.value);
		const input = payload.value;
		if (!isObject$1(input)) {
			payload.issues.push({
				expected: "object",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
			if (!fastpass) fastpass = generateFastpass(def.shape);
			payload = fastpass(payload, ctx);
			if (!catchall) return payload;
			return handleCatchall([], input, payload, ctx, value, inst);
		}
		return superParse(payload, ctx);
	};
});
function handleUnionResults(results, final, inst, ctx) {
	for (const result of results) if (result.issues.length === 0) {
		final.value = result.value;
		return final;
	}
	const nonaborted = results.filter((r) => !aborted(r));
	if (nonaborted.length === 1) {
		final.value = nonaborted[0].value;
		return nonaborted[0];
	}
	final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	return final;
}
const $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
	defineLazy(inst._zod, "values", () => {
		if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
	});
	defineLazy(inst._zod, "pattern", () => {
		if (def.options.every((o) => o._zod.pattern)) {
			const patterns = def.options.map((o) => o._zod.pattern);
			return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
		}
	});
	const single = def.options.length === 1;
	const first = def.options[0]._zod.run;
	inst._zod.parse = (payload, ctx) => {
		if (single) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else {
				if (result.issues.length === 0) return result;
				results.push(result);
			}
		}
		if (!async) return handleUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleUnionResults(results, payload, inst, ctx);
		});
	};
});
function handleExclusiveUnionResults(results, final, inst, ctx) {
	const successes = results.filter((r) => r.issues.length === 0);
	if (successes.length === 1) {
		final.value = successes[0].value;
		return final;
	}
	if (successes.length === 0) final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
	});
	else final.issues.push({
		code: "invalid_union",
		input: final.value,
		inst,
		errors: [],
		inclusive: false
	});
	return final;
}
const $ZodXor = /* @__PURE__ */ $constructor("$ZodXor", (inst, def) => {
	$ZodUnion.init(inst, def);
	def.inclusive = false;
	const single = def.options.length === 1;
	const first = def.options[0]._zod.run;
	inst._zod.parse = (payload, ctx) => {
		if (single) return first(payload, ctx);
		let async = false;
		const results = [];
		for (const option of def.options) {
			const result = option._zod.run({
				value: payload.value,
				issues: []
			}, ctx);
			if (result instanceof Promise) {
				results.push(result);
				async = true;
			} else results.push(result);
		}
		if (!async) return handleExclusiveUnionResults(results, payload, inst, ctx);
		return Promise.all(results).then((results) => {
			return handleExclusiveUnionResults(results, payload, inst, ctx);
		});
	};
});
const $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
	def.inclusive = false;
	$ZodUnion.init(inst, def);
	const _super = inst._zod.parse;
	defineLazy(inst._zod, "propValues", () => {
		const propValues = {};
		for (const option of def.options) {
			const pv = option._zod.propValues;
			if (!pv || Object.keys(pv).length === 0) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
			for (const [k, v] of Object.entries(pv)) {
				if (!propValues[k]) propValues[k] = /* @__PURE__ */ new Set();
				for (const val of v) propValues[k].add(val);
			}
		}
		return propValues;
	});
	const disc = cached(() => {
		const opts = def.options;
		const map = /* @__PURE__ */ new Map();
		for (const o of opts) {
			const values = o._zod.propValues?.[def.discriminator];
			if (!values || values.size === 0) throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
			for (const v of values) {
				if (map.has(v)) throw new Error(`Duplicate discriminator value "${String(v)}"`);
				map.set(v, o);
			}
		}
		return map;
	});
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isObject(input)) {
			payload.issues.push({
				code: "invalid_type",
				expected: "object",
				input,
				inst
			});
			return payload;
		}
		const opt = disc.value.get(input?.[def.discriminator]);
		if (opt) return opt._zod.run(payload, ctx);
		if (def.unionFallback) return _super(payload, ctx);
		payload.issues.push({
			code: "invalid_union",
			errors: [],
			note: "No matching discriminator",
			discriminator: def.discriminator,
			input,
			path: [def.discriminator],
			inst
		});
		return payload;
	};
});
const $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		const left = def.left._zod.run({
			value: input,
			issues: []
		}, ctx);
		const right = def.right._zod.run({
			value: input,
			issues: []
		}, ctx);
		if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
			return handleIntersectionResults(payload, left, right);
		});
		return handleIntersectionResults(payload, left, right);
	};
});
function mergeValues(a, b) {
	if (a === b) return {
		valid: true,
		data: a
	};
	if (a instanceof Date && b instanceof Date && +a === +b) return {
		valid: true,
		data: a
	};
	if (isPlainObject(a) && isPlainObject(b)) {
		const bKeys = Object.keys(b);
		const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
		const newObj = {
			...a,
			...b
		};
		for (const key of sharedKeys) {
			const sharedValue = mergeValues(a[key], b[key]);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
			};
			newObj[key] = sharedValue.data;
		}
		return {
			valid: true,
			data: newObj
		};
	}
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return {
			valid: false,
			mergeErrorPath: []
		};
		const newArray = [];
		for (let index = 0; index < a.length; index++) {
			const itemA = a[index];
			const itemB = b[index];
			const sharedValue = mergeValues(itemA, itemB);
			if (!sharedValue.valid) return {
				valid: false,
				mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
			};
			newArray.push(sharedValue.data);
		}
		return {
			valid: true,
			data: newArray
		};
	}
	return {
		valid: false,
		mergeErrorPath: []
	};
}
function handleIntersectionResults(result, left, right) {
	const unrecKeys = /* @__PURE__ */ new Map();
	let unrecIssue;
	for (const iss of left.issues) if (iss.code === "unrecognized_keys") {
		unrecIssue ?? (unrecIssue = iss);
		for (const k of iss.keys) {
			if (!unrecKeys.has(k)) unrecKeys.set(k, {});
			unrecKeys.get(k).l = true;
		}
	} else result.issues.push(iss);
	for (const iss of right.issues) if (iss.code === "unrecognized_keys") for (const k of iss.keys) {
		if (!unrecKeys.has(k)) unrecKeys.set(k, {});
		unrecKeys.get(k).r = true;
	}
	else result.issues.push(iss);
	const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
	if (bothKeys.length && unrecIssue) result.issues.push({
		...unrecIssue,
		keys: bothKeys
	});
	if (aborted(result)) return result;
	const merged = mergeValues(left.value, right.value);
	if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
	result.value = merged.data;
	return result;
}
const $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
	$ZodType.init(inst, def);
	const items = def.items;
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!Array.isArray(input)) {
			payload.issues.push({
				input,
				inst,
				expected: "tuple",
				code: "invalid_type"
			});
			return payload;
		}
		payload.value = [];
		const proms = [];
		const reversedIndex = [...items].reverse().findIndex((item) => item._zod.optin !== "optional");
		const optStart = reversedIndex === -1 ? 0 : items.length - reversedIndex;
		if (!def.rest) {
			const tooBig = input.length > items.length;
			const tooSmall = input.length < optStart - 1;
			if (tooBig || tooSmall) {
				payload.issues.push({
					...tooBig ? {
						code: "too_big",
						maximum: items.length,
						inclusive: true
					} : {
						code: "too_small",
						minimum: items.length
					},
					input,
					inst,
					origin: "array"
				});
				return payload;
			}
		}
		let i = -1;
		for (const item of items) {
			i++;
			if (i >= input.length) {
				if (i >= optStart) continue;
			}
			const result = item._zod.run({
				value: input[i],
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleTupleResult(result, payload, i)));
			else handleTupleResult(result, payload, i);
		}
		if (def.rest) {
			const rest = input.slice(items.length);
			for (const el of rest) {
				i++;
				const result = def.rest._zod.run({
					value: el,
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => handleTupleResult(result, payload, i)));
				else handleTupleResult(result, payload, i);
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handleTupleResult(result, final, index) {
	if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
	final.value[index] = result.value;
}
const $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!isPlainObject(input)) {
			payload.issues.push({
				expected: "record",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		const values = def.keyType._zod.values;
		if (values) {
			payload.value = {};
			const recordKeys = /* @__PURE__ */ new Set();
			for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
				recordKeys.add(typeof key === "number" ? key.toString() : key);
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[key] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[key] = result.value;
				}
			}
			let unrecognized;
			for (const key in input) if (!recordKeys.has(key)) {
				unrecognized = unrecognized ?? [];
				unrecognized.push(key);
			}
			if (unrecognized && unrecognized.length > 0) payload.issues.push({
				code: "unrecognized_keys",
				input,
				inst,
				keys: unrecognized
			});
		} else {
			payload.value = {};
			for (const key of Reflect.ownKeys(input)) {
				if (key === "__proto__") continue;
				let keyResult = def.keyType._zod.run({
					value: key,
					issues: []
				}, ctx);
				if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
				if (typeof key === "string" && number$2.test(key) && keyResult.issues.length) {
					const retryResult = def.keyType._zod.run({
						value: Number(key),
						issues: []
					}, ctx);
					if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (retryResult.issues.length === 0) keyResult = retryResult;
				}
				if (keyResult.issues.length) {
					if (def.mode === "loose") payload.value[key] = input[key];
					else payload.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
						input: key,
						path: [key],
						inst
					});
					continue;
				}
				const result = def.valueType._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[keyResult.value] = result.value;
				}));
				else {
					if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
					payload.value[keyResult.value] = result.value;
				}
			}
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
const $ZodMap = /* @__PURE__ */ $constructor("$ZodMap", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!(input instanceof Map)) {
			payload.issues.push({
				expected: "map",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		}
		const proms = [];
		payload.value = /* @__PURE__ */ new Map();
		for (const [key, value] of input) {
			const keyResult = def.keyType._zod.run({
				value: key,
				issues: []
			}, ctx);
			const valueResult = def.valueType._zod.run({
				value,
				issues: []
			}, ctx);
			if (keyResult instanceof Promise || valueResult instanceof Promise) proms.push(Promise.all([keyResult, valueResult]).then(([keyResult, valueResult]) => {
				handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
			}));
			else handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
	if (keyResult.issues.length) if (propertyKeyTypes.has(typeof key)) final.issues.push(...prefixIssues(key, keyResult.issues));
	else final.issues.push({
		code: "invalid_key",
		origin: "map",
		input,
		inst,
		issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
	});
	if (valueResult.issues.length) if (propertyKeyTypes.has(typeof key)) final.issues.push(...prefixIssues(key, valueResult.issues));
	else final.issues.push({
		origin: "map",
		code: "invalid_element",
		input,
		inst,
		key,
		issues: valueResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
	});
	final.value.set(keyResult.value, valueResult.value);
}
const $ZodSet = /* @__PURE__ */ $constructor("$ZodSet", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		const input = payload.value;
		if (!(input instanceof Set)) {
			payload.issues.push({
				input,
				inst,
				expected: "set",
				code: "invalid_type"
			});
			return payload;
		}
		const proms = [];
		payload.value = /* @__PURE__ */ new Set();
		for (const item of input) {
			const result = def.valueType._zod.run({
				value: item,
				issues: []
			}, ctx);
			if (result instanceof Promise) proms.push(result.then((result) => handleSetResult(result, payload)));
			else handleSetResult(result, payload);
		}
		if (proms.length) return Promise.all(proms).then(() => payload);
		return payload;
	};
});
function handleSetResult(result, final) {
	if (result.issues.length) final.issues.push(...result.issues);
	final.value.add(result.value);
}
const $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
	$ZodType.init(inst, def);
	const values = getEnumValues(def.entries);
	const valuesSet = new Set(values);
	inst._zod.values = valuesSet;
	inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (valuesSet.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	if (def.values.length === 0) throw new Error("Cannot create literal schema with no valid values");
	const values = new Set(def.values);
	inst._zod.values = values;
	inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (values.has(input)) return payload;
		payload.issues.push({
			code: "invalid_value",
			values: def.values,
			input,
			inst
		});
		return payload;
	};
});
const $ZodFile = /* @__PURE__ */ $constructor("$ZodFile", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		const input = payload.value;
		if (input instanceof File) return payload;
		payload.issues.push({
			expected: "file",
			code: "invalid_type",
			input,
			inst
		});
		return payload;
	};
});
const $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		const _out = def.transform(payload.value, payload);
		if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
			payload.value = output;
			return payload;
		});
		if (_out instanceof Promise) throw new $ZodAsyncError();
		payload.value = _out;
		return payload;
	};
});
function handleOptionalResult(result, input) {
	if (result.issues.length && input === void 0) return {
		issues: [],
		value: void 0
	};
	return result;
}
const $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	inst._zod.optout = "optional";
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, void 0]) : void 0;
	});
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (def.innerType._zod.optin === "optional") {
			const result = def.innerType._zod.run(payload, ctx);
			if (result instanceof Promise) return result.then((r) => handleOptionalResult(r, payload.value));
			return handleOptionalResult(result, payload.value);
		}
		if (payload.value === void 0) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
	inst._zod.parse = (payload, ctx) => {
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "pattern", () => {
		const pattern = def.innerType._zod.pattern;
		return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
	});
	defineLazy(inst._zod, "values", () => {
		return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		if (payload.value === null) return payload;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) {
			payload.value = def.defaultValue;
			/**
			* $ZodDefault returns the default value immediately in forward direction.
			* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
			return payload;
		}
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
		return handleDefaultResult(result, def);
	};
});
function handleDefaultResult(payload, def) {
	if (payload.value === void 0) payload.value = def.defaultValue;
	return payload;
}
const $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.optin = "optional";
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		if (payload.value === void 0) payload.value = def.defaultValue;
		return def.innerType._zod.run(payload, ctx);
	};
});
const $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => {
		const v = def.innerType._zod.values;
		return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
	});
	inst._zod.parse = (payload, ctx) => {
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
		return handleNonOptionalResult(result, inst);
	};
});
function handleNonOptionalResult(payload, inst) {
	if (!payload.issues.length && payload.value === void 0) payload.issues.push({
		code: "invalid_type",
		expected: "nonoptional",
		input: payload.value,
		inst
	});
	return payload;
}
const $ZodSuccess = /* @__PURE__ */ $constructor("$ZodSuccess", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") throw new $ZodEncodeError("ZodSuccess");
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => {
			payload.value = result.issues.length === 0;
			return payload;
		});
		payload.value = result.issues.length === 0;
		return payload;
	};
});
const $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
	defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then((result) => {
			payload.value = result.value;
			if (result.issues.length) {
				payload.value = def.catchValue({
					...payload,
					error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
					input: payload.value
				});
				payload.issues = [];
			}
			return payload;
		});
		payload.value = result.value;
		if (result.issues.length) {
			payload.value = def.catchValue({
				...payload,
				error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
				input: payload.value
			});
			payload.issues = [];
		}
		return payload;
	};
});
const $ZodNaN = /* @__PURE__ */ $constructor("$ZodNaN", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _ctx) => {
		if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
			payload.issues.push({
				input: payload.value,
				inst,
				expected: "nan",
				code: "invalid_type"
			});
			return payload;
		}
		return payload;
	};
});
const $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => def.in._zod.values);
	defineLazy(inst._zod, "optin", () => def.in._zod.optin);
	defineLazy(inst._zod, "optout", () => def.out._zod.optout);
	defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
			return handlePipeResult(right, def.in, ctx);
		}
		const left = def.in._zod.run(payload, ctx);
		if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
		return handlePipeResult(left, def.out, ctx);
	};
});
function handlePipeResult(left, next, ctx) {
	if (left.issues.length) {
		left.aborted = true;
		return left;
	}
	return next._zod.run({
		value: left.value,
		issues: left.issues
	}, ctx);
}
const $ZodCodec = /* @__PURE__ */ $constructor("$ZodCodec", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "values", () => def.in._zod.values);
	defineLazy(inst._zod, "optin", () => def.in._zod.optin);
	defineLazy(inst._zod, "optout", () => def.out._zod.optout);
	defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
	inst._zod.parse = (payload, ctx) => {
		if ((ctx.direction || "forward") === "forward") {
			const left = def.in._zod.run(payload, ctx);
			if (left instanceof Promise) return left.then((left) => handleCodecAResult(left, def, ctx));
			return handleCodecAResult(left, def, ctx);
		} else {
			const right = def.out._zod.run(payload, ctx);
			if (right instanceof Promise) return right.then((right) => handleCodecAResult(right, def, ctx));
			return handleCodecAResult(right, def, ctx);
		}
	};
});
function handleCodecAResult(result, def, ctx) {
	if (result.issues.length) {
		result.aborted = true;
		return result;
	}
	if ((ctx.direction || "forward") === "forward") {
		const transformed = def.transform(result.value, result);
		if (transformed instanceof Promise) return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
		return handleCodecTxResult(result, transformed, def.out, ctx);
	} else {
		const transformed = def.reverseTransform(result.value, result);
		if (transformed instanceof Promise) return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
		return handleCodecTxResult(result, transformed, def.in, ctx);
	}
}
function handleCodecTxResult(left, value, nextSchema, ctx) {
	if (left.issues.length) {
		left.aborted = true;
		return left;
	}
	return nextSchema._zod.run({
		value,
		issues: left.issues
	}, ctx);
}
const $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
	defineLazy(inst._zod, "values", () => def.innerType._zod.values);
	defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
	defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
	inst._zod.parse = (payload, ctx) => {
		if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
		const result = def.innerType._zod.run(payload, ctx);
		if (result instanceof Promise) return result.then(handleReadonlyResult);
		return handleReadonlyResult(result);
	};
});
function handleReadonlyResult(payload) {
	payload.value = Object.freeze(payload.value);
	return payload;
}
const $ZodTemplateLiteral = /* @__PURE__ */ $constructor("$ZodTemplateLiteral", (inst, def) => {
	$ZodType.init(inst, def);
	const regexParts = [];
	for (const part of def.parts) if (typeof part === "object" && part !== null) {
		if (!part._zod.pattern) throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
		const source = part._zod.pattern instanceof RegExp ? part._zod.pattern.source : part._zod.pattern;
		if (!source) throw new Error(`Invalid template literal part: ${part._zod.traits}`);
		const start = source.startsWith("^") ? 1 : 0;
		const end = source.endsWith("$") ? source.length - 1 : source.length;
		regexParts.push(source.slice(start, end));
	} else if (part === null || primitiveTypes.has(typeof part)) regexParts.push(escapeRegex(`${part}`));
	else throw new Error(`Invalid template literal part: ${part}`);
	inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
	inst._zod.parse = (payload, _ctx) => {
		if (typeof payload.value !== "string") {
			payload.issues.push({
				input: payload.value,
				inst,
				expected: "string",
				code: "invalid_type"
			});
			return payload;
		}
		inst._zod.pattern.lastIndex = 0;
		if (!inst._zod.pattern.test(payload.value)) {
			payload.issues.push({
				input: payload.value,
				inst,
				code: "invalid_format",
				format: def.format ?? "template_literal",
				pattern: inst._zod.pattern.source
			});
			return payload;
		}
		return payload;
	};
});
const $ZodFunction = /* @__PURE__ */ $constructor("$ZodFunction", (inst, def) => {
	$ZodType.init(inst, def);
	inst._def = def;
	inst._zod.def = def;
	inst.implement = (func) => {
		if (typeof func !== "function") throw new Error("implement() must be called with a function");
		return function(...args) {
			const parsedArgs = inst._def.input ? parse$1(inst._def.input, args) : args;
			const result = Reflect.apply(func, this, parsedArgs);
			if (inst._def.output) return parse$1(inst._def.output, result);
			return result;
		};
	};
	inst.implementAsync = (func) => {
		if (typeof func !== "function") throw new Error("implementAsync() must be called with a function");
		return async function(...args) {
			const parsedArgs = inst._def.input ? await parseAsync$1(inst._def.input, args) : args;
			const result = await Reflect.apply(func, this, parsedArgs);
			if (inst._def.output) return await parseAsync$1(inst._def.output, result);
			return result;
		};
	};
	inst._zod.parse = (payload, _ctx) => {
		if (typeof payload.value !== "function") {
			payload.issues.push({
				code: "invalid_type",
				expected: "function",
				input: payload.value,
				inst
			});
			return payload;
		}
		if (inst._def.output && inst._def.output._zod.def.type === "promise") payload.value = inst.implementAsync(payload.value);
		else payload.value = inst.implement(payload.value);
		return payload;
	};
	inst.input = (...args) => {
		const F = inst.constructor;
		if (Array.isArray(args[0])) return new F({
			type: "function",
			input: new $ZodTuple({
				type: "tuple",
				items: args[0],
				rest: args[1]
			}),
			output: inst._def.output
		});
		return new F({
			type: "function",
			input: args[0],
			output: inst._def.output
		});
	};
	inst.output = (output) => {
		const F = inst.constructor;
		return new F({
			type: "function",
			input: inst._def.input,
			output
		});
	};
	return inst;
});
const $ZodPromise = /* @__PURE__ */ $constructor("$ZodPromise", (inst, def) => {
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, ctx) => {
		return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({
			value: inner,
			issues: []
		}, ctx));
	};
});
const $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
	$ZodType.init(inst, def);
	defineLazy(inst._zod, "innerType", () => def.getter());
	defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
	defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
	defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? void 0);
	defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? void 0);
	inst._zod.parse = (payload, ctx) => {
		return inst._zod.innerType._zod.run(payload, ctx);
	};
});
const $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
	$ZodCheck.init(inst, def);
	$ZodType.init(inst, def);
	inst._zod.parse = (payload, _) => {
		return payload;
	};
	inst._zod.check = (payload) => {
		const input = payload.value;
		const r = def.fn(input);
		if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
		handleRefineResult(r, payload, input, inst);
	};
});
function handleRefineResult(result, payload, input, inst) {
	if (!result) {
		const _iss = {
			code: "custom",
			input,
			inst,
			path: [...inst._zod.def.path ?? []],
			continue: !inst._zod.def.abort
		};
		if (inst._zod.def.params) _iss.params = inst._zod.def.params;
		payload.issues.push(issue(_iss));
	}
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ar.js
const error$46 = () => {
	const Sizable = {
		string: {
			unit: "حرف",
			verb: "أن يحوي"
		},
		file: {
			unit: "بايت",
			verb: "أن يحوي"
		},
		array: {
			unit: "عنصر",
			verb: "أن يحوي"
		},
		set: {
			unit: "عنصر",
			verb: "أن يحوي"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "مدخل",
		email: "بريد إلكتروني",
		url: "رابط",
		emoji: "إيموجي",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "تاريخ ووقت بمعيار ISO",
		date: "تاريخ بمعيار ISO",
		time: "وقت بمعيار ISO",
		duration: "مدة بمعيار ISO",
		ipv4: "عنوان IPv4",
		ipv6: "عنوان IPv6",
		cidrv4: "مدى عناوين بصيغة IPv4",
		cidrv6: "مدى عناوين بصيغة IPv6",
		base64: "نَص بترميز base64-encoded",
		base64url: "نَص بترميز base64url-encoded",
		json_string: "نَص على هيئة JSON",
		e164: "رقم هاتف بمعيار E.164",
		jwt: "JWT",
		template_literal: "مدخل"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `مدخلات غير مقبولة: يفترض إدخال instanceof ${issue.expected}، ولكن تم إدخال ${received}`;
				return `مدخلات غير مقبولة: يفترض إدخال ${expected}، ولكن تم إدخال ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `مدخلات غير مقبولة: يفترض إدخال ${stringifyPrimitive(issue.values[0])}`;
				return `اختيار غير مقبول: يتوقع انتقاء أحد هذه الخيارات: ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return ` أكبر من اللازم: يفترض أن تكون ${issue.origin ?? "القيمة"} ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "عنصر"}`;
				return `أكبر من اللازم: يفترض أن تكون ${issue.origin ?? "القيمة"} ${adj} ${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `أصغر من اللازم: يفترض لـ ${issue.origin} أن يكون ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
				return `أصغر من اللازم: يفترض لـ ${issue.origin} أن يكون ${adj} ${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `نَص غير مقبول: يجب أن يبدأ بـ "${issue.prefix}"`;
				if (_issue.format === "ends_with") return `نَص غير مقبول: يجب أن ينتهي بـ "${_issue.suffix}"`;
				if (_issue.format === "includes") return `نَص غير مقبول: يجب أن يتضمَّن "${_issue.includes}"`;
				if (_issue.format === "regex") return `نَص غير مقبول: يجب أن يطابق النمط ${_issue.pattern}`;
				return `${FormatDictionary[_issue.format] ?? issue.format} غير مقبول`;
			}
			case "not_multiple_of": return `رقم غير مقبول: يجب أن يكون من مضاعفات ${issue.divisor}`;
			case "unrecognized_keys": return `معرف${issue.keys.length > 1 ? "ات" : ""} غريب${issue.keys.length > 1 ? "ة" : ""}: ${joinValues(issue.keys, "، ")}`;
			case "invalid_key": return `معرف غير مقبول في ${issue.origin}`;
			case "invalid_union": return "مدخل غير مقبول";
			case "invalid_element": return `مدخل غير مقبول في ${issue.origin}`;
			default: return "مدخل غير مقبول";
		}
	};
};
function ar_default() {
	return { localeError: error$46() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/az.js
const error$45 = () => {
	const Sizable = {
		string: {
			unit: "simvol",
			verb: "olmalıdır"
		},
		file: {
			unit: "bayt",
			verb: "olmalıdır"
		},
		array: {
			unit: "element",
			verb: "olmalıdır"
		},
		set: {
			unit: "element",
			verb: "olmalıdır"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Yanlış dəyər: gözlənilən instanceof ${issue.expected}, daxil olan ${received}`;
				return `Yanlış dəyər: gözlənilən ${expected}, daxil olan ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Yanlış dəyər: gözlənilən ${stringifyPrimitive(issue.values[0])}`;
				return `Yanlış seçim: aşağıdakılardan biri olmalıdır: ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Çox böyük: gözlənilən ${issue.origin ?? "dəyər"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "element"}`;
				return `Çox böyük: gözlənilən ${issue.origin ?? "dəyər"} ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Çox kiçik: gözlənilən ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Çox kiçik: gözlənilən ${issue.origin} ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Yanlış mətn: "${_issue.prefix}" ilə başlamalıdır`;
				if (_issue.format === "ends_with") return `Yanlış mətn: "${_issue.suffix}" ilə bitməlidir`;
				if (_issue.format === "includes") return `Yanlış mətn: "${_issue.includes}" daxil olmalıdır`;
				if (_issue.format === "regex") return `Yanlış mətn: ${_issue.pattern} şablonuna uyğun olmalıdır`;
				return `Yanlış ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Yanlış ədəd: ${issue.divisor} ilə bölünə bilən olmalıdır`;
			case "unrecognized_keys": return `Tanınmayan açar${issue.keys.length > 1 ? "lar" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `${issue.origin} daxilində yanlış açar`;
			case "invalid_union": return "Yanlış dəyər";
			case "invalid_element": return `${issue.origin} daxilində yanlış dəyər`;
			default: return `Yanlış dəyər`;
		}
	};
};
function az_default() {
	return { localeError: error$45() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/be.js
function getBelarusianPlural(count, one, few, many) {
	const absCount = Math.abs(count);
	const lastDigit = absCount % 10;
	const lastTwoDigits = absCount % 100;
	if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return many;
	if (lastDigit === 1) return one;
	if (lastDigit >= 2 && lastDigit <= 4) return few;
	return many;
}
const error$44 = () => {
	const Sizable = {
		string: {
			unit: {
				one: "сімвал",
				few: "сімвалы",
				many: "сімвалаў"
			},
			verb: "мець"
		},
		array: {
			unit: {
				one: "элемент",
				few: "элементы",
				many: "элементаў"
			},
			verb: "мець"
		},
		set: {
			unit: {
				one: "элемент",
				few: "элементы",
				many: "элементаў"
			},
			verb: "мець"
		},
		file: {
			unit: {
				one: "байт",
				few: "байты",
				many: "байтаў"
			},
			verb: "мець"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "увод",
		email: "email адрас",
		url: "URL",
		emoji: "эмодзі",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO дата і час",
		date: "ISO дата",
		time: "ISO час",
		duration: "ISO працягласць",
		ipv4: "IPv4 адрас",
		ipv6: "IPv6 адрас",
		cidrv4: "IPv4 дыяпазон",
		cidrv6: "IPv6 дыяпазон",
		base64: "радок у фармаце base64",
		base64url: "радок у фармаце base64url",
		json_string: "JSON радок",
		e164: "нумар E.164",
		jwt: "JWT",
		template_literal: "увод"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "лік",
		array: "масіў"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Няправільны ўвод: чакаўся instanceof ${issue.expected}, атрымана ${received}`;
				return `Няправільны ўвод: чакаўся ${expected}, атрымана ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Няправільны ўвод: чакалася ${stringifyPrimitive(issue.values[0])}`;
				return `Няправільны варыянт: чакаўся адзін з ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) {
					const unit = getBelarusianPlural(Number(issue.maximum), sizing.unit.one, sizing.unit.few, sizing.unit.many);
					return `Занадта вялікі: чакалася, што ${issue.origin ?? "значэнне"} павінна ${sizing.verb} ${adj}${issue.maximum.toString()} ${unit}`;
				}
				return `Занадта вялікі: чакалася, што ${issue.origin ?? "значэнне"} павінна быць ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) {
					const unit = getBelarusianPlural(Number(issue.minimum), sizing.unit.one, sizing.unit.few, sizing.unit.many);
					return `Занадта малы: чакалася, што ${issue.origin} павінна ${sizing.verb} ${adj}${issue.minimum.toString()} ${unit}`;
				}
				return `Занадта малы: чакалася, што ${issue.origin} павінна быць ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Няправільны радок: павінен пачынацца з "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Няправільны радок: павінен заканчвацца на "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Няправільны радок: павінен змяшчаць "${_issue.includes}"`;
				if (_issue.format === "regex") return `Няправільны радок: павінен адпавядаць шаблону ${_issue.pattern}`;
				return `Няправільны ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Няправільны лік: павінен быць кратным ${issue.divisor}`;
			case "unrecognized_keys": return `Нераспазнаны ${issue.keys.length > 1 ? "ключы" : "ключ"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Няправільны ключ у ${issue.origin}`;
			case "invalid_union": return "Няправільны ўвод";
			case "invalid_element": return `Няправільнае значэнне ў ${issue.origin}`;
			default: return `Няправільны ўвод`;
		}
	};
};
function be_default() {
	return { localeError: error$44() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/bg.js
const error$43 = () => {
	const Sizable = {
		string: {
			unit: "символа",
			verb: "да съдържа"
		},
		file: {
			unit: "байта",
			verb: "да съдържа"
		},
		array: {
			unit: "елемента",
			verb: "да съдържа"
		},
		set: {
			unit: "елемента",
			verb: "да съдържа"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "вход",
		email: "имейл адрес",
		url: "URL",
		emoji: "емоджи",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO време",
		date: "ISO дата",
		time: "ISO време",
		duration: "ISO продължителност",
		ipv4: "IPv4 адрес",
		ipv6: "IPv6 адрес",
		cidrv4: "IPv4 диапазон",
		cidrv6: "IPv6 диапазон",
		base64: "base64-кодиран низ",
		base64url: "base64url-кодиран низ",
		json_string: "JSON низ",
		e164: "E.164 номер",
		jwt: "JWT",
		template_literal: "вход"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "число",
		array: "масив"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Невалиден вход: очакван instanceof ${issue.expected}, получен ${received}`;
				return `Невалиден вход: очакван ${expected}, получен ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Невалиден вход: очакван ${stringifyPrimitive(issue.values[0])}`;
				return `Невалидна опция: очаквано едно от ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Твърде голямо: очаква се ${issue.origin ?? "стойност"} да съдържа ${adj}${issue.maximum.toString()} ${sizing.unit ?? "елемента"}`;
				return `Твърде голямо: очаква се ${issue.origin ?? "стойност"} да бъде ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Твърде малко: очаква се ${issue.origin} да съдържа ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Твърде малко: очаква се ${issue.origin} да бъде ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Невалиден низ: трябва да започва с "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Невалиден низ: трябва да завършва с "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Невалиден низ: трябва да включва "${_issue.includes}"`;
				if (_issue.format === "regex") return `Невалиден низ: трябва да съвпада с ${_issue.pattern}`;
				let invalid_adj = "Невалиден";
				if (_issue.format === "emoji") invalid_adj = "Невалидно";
				if (_issue.format === "datetime") invalid_adj = "Невалидно";
				if (_issue.format === "date") invalid_adj = "Невалидна";
				if (_issue.format === "time") invalid_adj = "Невалидно";
				if (_issue.format === "duration") invalid_adj = "Невалидна";
				return `${invalid_adj} ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Невалидно число: трябва да бъде кратно на ${issue.divisor}`;
			case "unrecognized_keys": return `Неразпознат${issue.keys.length > 1 ? "и" : ""} ключ${issue.keys.length > 1 ? "ове" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Невалиден ключ в ${issue.origin}`;
			case "invalid_union": return "Невалиден вход";
			case "invalid_element": return `Невалидна стойност в ${issue.origin}`;
			default: return `Невалиден вход`;
		}
	};
};
function bg_default() {
	return { localeError: error$43() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ca.js
const error$42 = () => {
	const Sizable = {
		string: {
			unit: "caràcters",
			verb: "contenir"
		},
		file: {
			unit: "bytes",
			verb: "contenir"
		},
		array: {
			unit: "elements",
			verb: "contenir"
		},
		set: {
			unit: "elements",
			verb: "contenir"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "entrada",
		email: "adreça electrònica",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "data i hora ISO",
		date: "data ISO",
		time: "hora ISO",
		duration: "durada ISO",
		ipv4: "adreça IPv4",
		ipv6: "adreça IPv6",
		cidrv4: "rang IPv4",
		cidrv6: "rang IPv6",
		base64: "cadena codificada en base64",
		base64url: "cadena codificada en base64url",
		json_string: "cadena JSON",
		e164: "número E.164",
		jwt: "JWT",
		template_literal: "entrada"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Tipus invàlid: s'esperava instanceof ${issue.expected}, s'ha rebut ${received}`;
				return `Tipus invàlid: s'esperava ${expected}, s'ha rebut ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Valor invàlid: s'esperava ${stringifyPrimitive(issue.values[0])}`;
				return `Opció invàlida: s'esperava una de ${joinValues(issue.values, " o ")}`;
			case "too_big": {
				const adj = issue.inclusive ? "com a màxim" : "menys de";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Massa gran: s'esperava que ${issue.origin ?? "el valor"} contingués ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Massa gran: s'esperava que ${issue.origin ?? "el valor"} fos ${adj} ${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? "com a mínim" : "més de";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Massa petit: s'esperava que ${issue.origin} contingués ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
				return `Massa petit: s'esperava que ${issue.origin} fos ${adj} ${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Format invàlid: ha de començar amb "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Format invàlid: ha d'acabar amb "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Format invàlid: ha d'incloure "${_issue.includes}"`;
				if (_issue.format === "regex") return `Format invàlid: ha de coincidir amb el patró ${_issue.pattern}`;
				return `Format invàlid per a ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Número invàlid: ha de ser múltiple de ${issue.divisor}`;
			case "unrecognized_keys": return `Clau${issue.keys.length > 1 ? "s" : ""} no reconeguda${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Clau invàlida a ${issue.origin}`;
			case "invalid_union": return "Entrada invàlida";
			case "invalid_element": return `Element invàlid a ${issue.origin}`;
			default: return `Entrada invàlida`;
		}
	};
};
function ca_default() {
	return { localeError: error$42() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/cs.js
const error$41 = () => {
	const Sizable = {
		string: {
			unit: "znaků",
			verb: "mít"
		},
		file: {
			unit: "bajtů",
			verb: "mít"
		},
		array: {
			unit: "prvků",
			verb: "mít"
		},
		set: {
			unit: "prvků",
			verb: "mít"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "regulární výraz",
		email: "e-mailová adresa",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "datum a čas ve formátu ISO",
		date: "datum ve formátu ISO",
		time: "čas ve formátu ISO",
		duration: "doba trvání ISO",
		ipv4: "IPv4 adresa",
		ipv6: "IPv6 adresa",
		cidrv4: "rozsah IPv4",
		cidrv6: "rozsah IPv6",
		base64: "řetězec zakódovaný ve formátu base64",
		base64url: "řetězec zakódovaný ve formátu base64url",
		json_string: "řetězec ve formátu JSON",
		e164: "číslo E.164",
		jwt: "JWT",
		template_literal: "vstup"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "číslo",
		string: "řetězec",
		function: "funkce",
		array: "pole"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Neplatný vstup: očekáváno instanceof ${issue.expected}, obdrženo ${received}`;
				return `Neplatný vstup: očekáváno ${expected}, obdrženo ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Neplatný vstup: očekáváno ${stringifyPrimitive(issue.values[0])}`;
				return `Neplatná možnost: očekávána jedna z hodnot ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Hodnota je příliš velká: ${issue.origin ?? "hodnota"} musí mít ${adj}${issue.maximum.toString()} ${sizing.unit ?? "prvků"}`;
				return `Hodnota je příliš velká: ${issue.origin ?? "hodnota"} musí být ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Hodnota je příliš malá: ${issue.origin ?? "hodnota"} musí mít ${adj}${issue.minimum.toString()} ${sizing.unit ?? "prvků"}`;
				return `Hodnota je příliš malá: ${issue.origin ?? "hodnota"} musí být ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Neplatný řetězec: musí začínat na "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Neplatný řetězec: musí končit na "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Neplatný řetězec: musí obsahovat "${_issue.includes}"`;
				if (_issue.format === "regex") return `Neplatný řetězec: musí odpovídat vzoru ${_issue.pattern}`;
				return `Neplatný formát ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Neplatné číslo: musí být násobkem ${issue.divisor}`;
			case "unrecognized_keys": return `Neznámé klíče: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Neplatný klíč v ${issue.origin}`;
			case "invalid_union": return "Neplatný vstup";
			case "invalid_element": return `Neplatná hodnota v ${issue.origin}`;
			default: return `Neplatný vstup`;
		}
	};
};
function cs_default() {
	return { localeError: error$41() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/da.js
const error$40 = () => {
	const Sizable = {
		string: {
			unit: "tegn",
			verb: "havde"
		},
		file: {
			unit: "bytes",
			verb: "havde"
		},
		array: {
			unit: "elementer",
			verb: "indeholdt"
		},
		set: {
			unit: "elementer",
			verb: "indeholdt"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "e-mailadresse",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO dato- og klokkeslæt",
		date: "ISO-dato",
		time: "ISO-klokkeslæt",
		duration: "ISO-varighed",
		ipv4: "IPv4-område",
		ipv6: "IPv6-område",
		cidrv4: "IPv4-spektrum",
		cidrv6: "IPv6-spektrum",
		base64: "base64-kodet streng",
		base64url: "base64url-kodet streng",
		json_string: "JSON-streng",
		e164: "E.164-nummer",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = {
		nan: "NaN",
		string: "streng",
		number: "tal",
		boolean: "boolean",
		array: "liste",
		object: "objekt",
		set: "sæt",
		file: "fil"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Ugyldigt input: forventede instanceof ${issue.expected}, fik ${received}`;
				return `Ugyldigt input: forventede ${expected}, fik ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Ugyldig værdi: forventede ${stringifyPrimitive(issue.values[0])}`;
				return `Ugyldigt valg: forventede en af følgende ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				const origin = TypeDictionary[issue.origin] ?? issue.origin;
				if (sizing) return `For stor: forventede ${origin ?? "value"} ${sizing.verb} ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "elementer"}`;
				return `For stor: forventede ${origin ?? "value"} havde ${adj} ${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				const origin = TypeDictionary[issue.origin] ?? issue.origin;
				if (sizing) return `For lille: forventede ${origin} ${sizing.verb} ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
				return `For lille: forventede ${origin} havde ${adj} ${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Ugyldig streng: skal starte med "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Ugyldig streng: skal ende med "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Ugyldig streng: skal indeholde "${_issue.includes}"`;
				if (_issue.format === "regex") return `Ugyldig streng: skal matche mønsteret ${_issue.pattern}`;
				return `Ugyldig ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Ugyldigt tal: skal være deleligt med ${issue.divisor}`;
			case "unrecognized_keys": return `${issue.keys.length > 1 ? "Ukendte nøgler" : "Ukendt nøgle"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Ugyldig nøgle i ${issue.origin}`;
			case "invalid_union": return "Ugyldigt input: matcher ingen af de tilladte typer";
			case "invalid_element": return `Ugyldig værdi i ${issue.origin}`;
			default: return `Ugyldigt input`;
		}
	};
};
function da_default() {
	return { localeError: error$40() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/de.js
const error$39 = () => {
	const Sizable = {
		string: {
			unit: "Zeichen",
			verb: "zu haben"
		},
		file: {
			unit: "Bytes",
			verb: "zu haben"
		},
		array: {
			unit: "Elemente",
			verb: "zu haben"
		},
		set: {
			unit: "Elemente",
			verb: "zu haben"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "Eingabe",
		email: "E-Mail-Adresse",
		url: "URL",
		emoji: "Emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO-Datum und -Uhrzeit",
		date: "ISO-Datum",
		time: "ISO-Uhrzeit",
		duration: "ISO-Dauer",
		ipv4: "IPv4-Adresse",
		ipv6: "IPv6-Adresse",
		cidrv4: "IPv4-Bereich",
		cidrv6: "IPv6-Bereich",
		base64: "Base64-codierter String",
		base64url: "Base64-URL-codierter String",
		json_string: "JSON-String",
		e164: "E.164-Nummer",
		jwt: "JWT",
		template_literal: "Eingabe"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "Zahl",
		array: "Array"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Ungültige Eingabe: erwartet instanceof ${issue.expected}, erhalten ${received}`;
				return `Ungültige Eingabe: erwartet ${expected}, erhalten ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Ungültige Eingabe: erwartet ${stringifyPrimitive(issue.values[0])}`;
				return `Ungültige Option: erwartet eine von ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Zu groß: erwartet, dass ${issue.origin ?? "Wert"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "Elemente"} hat`;
				return `Zu groß: erwartet, dass ${issue.origin ?? "Wert"} ${adj}${issue.maximum.toString()} ist`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Zu klein: erwartet, dass ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} hat`;
				return `Zu klein: erwartet, dass ${issue.origin} ${adj}${issue.minimum.toString()} ist`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Ungültiger String: muss mit "${_issue.prefix}" beginnen`;
				if (_issue.format === "ends_with") return `Ungültiger String: muss mit "${_issue.suffix}" enden`;
				if (_issue.format === "includes") return `Ungültiger String: muss "${_issue.includes}" enthalten`;
				if (_issue.format === "regex") return `Ungültiger String: muss dem Muster ${_issue.pattern} entsprechen`;
				return `Ungültig: ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Ungültige Zahl: muss ein Vielfaches von ${issue.divisor} sein`;
			case "unrecognized_keys": return `${issue.keys.length > 1 ? "Unbekannte Schlüssel" : "Unbekannter Schlüssel"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Ungültiger Schlüssel in ${issue.origin}`;
			case "invalid_union": return "Ungültige Eingabe";
			case "invalid_element": return `Ungültiger Wert in ${issue.origin}`;
			default: return `Ungültige Eingabe`;
		}
	};
};
function de_default() {
	return { localeError: error$39() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/en.js
const error$38 = () => {
	const Sizable = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				return `Invalid input: expected ${expected}, received ${TypeDictionary[receivedType] ?? receivedType}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
				return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Invalid string: must start with "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Invalid string: must end with "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Invalid string: must include "${_issue.includes}"`;
				if (_issue.format === "regex") return `Invalid string: must match pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${issue.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${issue.origin}`;
			case "invalid_union": return "Invalid input";
			case "invalid_element": return `Invalid value in ${issue.origin}`;
			default: return `Invalid input`;
		}
	};
};
function en_default() {
	return { localeError: error$38() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/eo.js
const error$37 = () => {
	const Sizable = {
		string: {
			unit: "karaktrojn",
			verb: "havi"
		},
		file: {
			unit: "bajtojn",
			verb: "havi"
		},
		array: {
			unit: "elementojn",
			verb: "havi"
		},
		set: {
			unit: "elementojn",
			verb: "havi"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "enigo",
		email: "retadreso",
		url: "URL",
		emoji: "emoĝio",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO-datotempo",
		date: "ISO-dato",
		time: "ISO-tempo",
		duration: "ISO-daŭro",
		ipv4: "IPv4-adreso",
		ipv6: "IPv6-adreso",
		cidrv4: "IPv4-rango",
		cidrv6: "IPv6-rango",
		base64: "64-ume kodita karaktraro",
		base64url: "URL-64-ume kodita karaktraro",
		json_string: "JSON-karaktraro",
		e164: "E.164-nombro",
		jwt: "JWT",
		template_literal: "enigo"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "nombro",
		array: "tabelo",
		null: "senvalora"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Nevalida enigo: atendiĝis instanceof ${issue.expected}, riceviĝis ${received}`;
				return `Nevalida enigo: atendiĝis ${expected}, riceviĝis ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Nevalida enigo: atendiĝis ${stringifyPrimitive(issue.values[0])}`;
				return `Nevalida opcio: atendiĝis unu el ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Tro granda: atendiĝis ke ${issue.origin ?? "valoro"} havu ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementojn"}`;
				return `Tro granda: atendiĝis ke ${issue.origin ?? "valoro"} havu ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Tro malgranda: atendiĝis ke ${issue.origin} havu ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Tro malgranda: atendiĝis ke ${issue.origin} estu ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Nevalida karaktraro: devas komenciĝi per "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Nevalida karaktraro: devas finiĝi per "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Nevalida karaktraro: devas inkluzivi "${_issue.includes}"`;
				if (_issue.format === "regex") return `Nevalida karaktraro: devas kongrui kun la modelo ${_issue.pattern}`;
				return `Nevalida ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Nevalida nombro: devas esti oblo de ${issue.divisor}`;
			case "unrecognized_keys": return `Nekonata${issue.keys.length > 1 ? "j" : ""} ŝlosilo${issue.keys.length > 1 ? "j" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Nevalida ŝlosilo en ${issue.origin}`;
			case "invalid_union": return "Nevalida enigo";
			case "invalid_element": return `Nevalida valoro en ${issue.origin}`;
			default: return `Nevalida enigo`;
		}
	};
};
function eo_default() {
	return { localeError: error$37() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/es.js
const error$36 = () => {
	const Sizable = {
		string: {
			unit: "caracteres",
			verb: "tener"
		},
		file: {
			unit: "bytes",
			verb: "tener"
		},
		array: {
			unit: "elementos",
			verb: "tener"
		},
		set: {
			unit: "elementos",
			verb: "tener"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "entrada",
		email: "dirección de correo electrónico",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "fecha y hora ISO",
		date: "fecha ISO",
		time: "hora ISO",
		duration: "duración ISO",
		ipv4: "dirección IPv4",
		ipv6: "dirección IPv6",
		cidrv4: "rango IPv4",
		cidrv6: "rango IPv6",
		base64: "cadena codificada en base64",
		base64url: "URL codificada en base64",
		json_string: "cadena JSON",
		e164: "número E.164",
		jwt: "JWT",
		template_literal: "entrada"
	};
	const TypeDictionary = {
		nan: "NaN",
		string: "texto",
		number: "número",
		boolean: "booleano",
		array: "arreglo",
		object: "objeto",
		set: "conjunto",
		file: "archivo",
		date: "fecha",
		bigint: "número grande",
		symbol: "símbolo",
		undefined: "indefinido",
		null: "nulo",
		function: "función",
		map: "mapa",
		record: "registro",
		tuple: "tupla",
		enum: "enumeración",
		union: "unión",
		literal: "literal",
		promise: "promesa",
		void: "vacío",
		never: "nunca",
		unknown: "desconocido",
		any: "cualquiera"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Entrada inválida: se esperaba instanceof ${issue.expected}, recibido ${received}`;
				return `Entrada inválida: se esperaba ${expected}, recibido ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Entrada inválida: se esperaba ${stringifyPrimitive(issue.values[0])}`;
				return `Opción inválida: se esperaba una de ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				const origin = TypeDictionary[issue.origin] ?? issue.origin;
				if (sizing) return `Demasiado grande: se esperaba que ${origin ?? "valor"} tuviera ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementos"}`;
				return `Demasiado grande: se esperaba que ${origin ?? "valor"} fuera ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				const origin = TypeDictionary[issue.origin] ?? issue.origin;
				if (sizing) return `Demasiado pequeño: se esperaba que ${origin} tuviera ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Demasiado pequeño: se esperaba que ${origin} fuera ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Cadena inválida: debe comenzar con "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Cadena inválida: debe terminar en "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Cadena inválida: debe incluir "${_issue.includes}"`;
				if (_issue.format === "regex") return `Cadena inválida: debe coincidir con el patrón ${_issue.pattern}`;
				return `Inválido ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Número inválido: debe ser múltiplo de ${issue.divisor}`;
			case "unrecognized_keys": return `Llave${issue.keys.length > 1 ? "s" : ""} desconocida${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Llave inválida en ${TypeDictionary[issue.origin] ?? issue.origin}`;
			case "invalid_union": return "Entrada inválida";
			case "invalid_element": return `Valor inválido en ${TypeDictionary[issue.origin] ?? issue.origin}`;
			default: return `Entrada inválida`;
		}
	};
};
function es_default() {
	return { localeError: error$36() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/fa.js
const error$35 = () => {
	const Sizable = {
		string: {
			unit: "کاراکتر",
			verb: "داشته باشد"
		},
		file: {
			unit: "بایت",
			verb: "داشته باشد"
		},
		array: {
			unit: "آیتم",
			verb: "داشته باشد"
		},
		set: {
			unit: "آیتم",
			verb: "داشته باشد"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "ورودی",
		email: "آدرس ایمیل",
		url: "URL",
		emoji: "ایموجی",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "تاریخ و زمان ایزو",
		date: "تاریخ ایزو",
		time: "زمان ایزو",
		duration: "مدت زمان ایزو",
		ipv4: "IPv4 آدرس",
		ipv6: "IPv6 آدرس",
		cidrv4: "IPv4 دامنه",
		cidrv6: "IPv6 دامنه",
		base64: "base64-encoded رشته",
		base64url: "base64url-encoded رشته",
		json_string: "JSON رشته",
		e164: "E.164 عدد",
		jwt: "JWT",
		template_literal: "ورودی"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "عدد",
		array: "آرایه"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `ورودی نامعتبر: می‌بایست instanceof ${issue.expected} می‌بود، ${received} دریافت شد`;
				return `ورودی نامعتبر: می‌بایست ${expected} می‌بود، ${received} دریافت شد`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `ورودی نامعتبر: می‌بایست ${stringifyPrimitive(issue.values[0])} می‌بود`;
				return `گزینه نامعتبر: می‌بایست یکی از ${joinValues(issue.values, "|")} می‌بود`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `خیلی بزرگ: ${issue.origin ?? "مقدار"} باید ${adj}${issue.maximum.toString()} ${sizing.unit ?? "عنصر"} باشد`;
				return `خیلی بزرگ: ${issue.origin ?? "مقدار"} باید ${adj}${issue.maximum.toString()} باشد`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `خیلی کوچک: ${issue.origin} باید ${adj}${issue.minimum.toString()} ${sizing.unit} باشد`;
				return `خیلی کوچک: ${issue.origin} باید ${adj}${issue.minimum.toString()} باشد`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `رشته نامعتبر: باید با "${_issue.prefix}" شروع شود`;
				if (_issue.format === "ends_with") return `رشته نامعتبر: باید با "${_issue.suffix}" تمام شود`;
				if (_issue.format === "includes") return `رشته نامعتبر: باید شامل "${_issue.includes}" باشد`;
				if (_issue.format === "regex") return `رشته نامعتبر: باید با الگوی ${_issue.pattern} مطابقت داشته باشد`;
				return `${FormatDictionary[_issue.format] ?? issue.format} نامعتبر`;
			}
			case "not_multiple_of": return `عدد نامعتبر: باید مضرب ${issue.divisor} باشد`;
			case "unrecognized_keys": return `کلید${issue.keys.length > 1 ? "های" : ""} ناشناس: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `کلید ناشناس در ${issue.origin}`;
			case "invalid_union": return `ورودی نامعتبر`;
			case "invalid_element": return `مقدار نامعتبر در ${issue.origin}`;
			default: return `ورودی نامعتبر`;
		}
	};
};
function fa_default() {
	return { localeError: error$35() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/fi.js
const error$34 = () => {
	const Sizable = {
		string: {
			unit: "merkkiä",
			subject: "merkkijonon"
		},
		file: {
			unit: "tavua",
			subject: "tiedoston"
		},
		array: {
			unit: "alkiota",
			subject: "listan"
		},
		set: {
			unit: "alkiota",
			subject: "joukon"
		},
		number: {
			unit: "",
			subject: "luvun"
		},
		bigint: {
			unit: "",
			subject: "suuren kokonaisluvun"
		},
		int: {
			unit: "",
			subject: "kokonaisluvun"
		},
		date: {
			unit: "",
			subject: "päivämäärän"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "säännöllinen lauseke",
		email: "sähköpostiosoite",
		url: "URL-osoite",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO-aikaleima",
		date: "ISO-päivämäärä",
		time: "ISO-aika",
		duration: "ISO-kesto",
		ipv4: "IPv4-osoite",
		ipv6: "IPv6-osoite",
		cidrv4: "IPv4-alue",
		cidrv6: "IPv6-alue",
		base64: "base64-koodattu merkkijono",
		base64url: "base64url-koodattu merkkijono",
		json_string: "JSON-merkkijono",
		e164: "E.164-luku",
		jwt: "JWT",
		template_literal: "templaattimerkkijono"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Virheellinen tyyppi: odotettiin instanceof ${issue.expected}, oli ${received}`;
				return `Virheellinen tyyppi: odotettiin ${expected}, oli ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Virheellinen syöte: täytyy olla ${stringifyPrimitive(issue.values[0])}`;
				return `Virheellinen valinta: täytyy olla yksi seuraavista: ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Liian suuri: ${sizing.subject} täytyy olla ${adj}${issue.maximum.toString()} ${sizing.unit}`.trim();
				return `Liian suuri: arvon täytyy olla ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Liian pieni: ${sizing.subject} täytyy olla ${adj}${issue.minimum.toString()} ${sizing.unit}`.trim();
				return `Liian pieni: arvon täytyy olla ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Virheellinen syöte: täytyy alkaa "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Virheellinen syöte: täytyy loppua "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Virheellinen syöte: täytyy sisältää "${_issue.includes}"`;
				if (_issue.format === "regex") return `Virheellinen syöte: täytyy vastata säännöllistä lauseketta ${_issue.pattern}`;
				return `Virheellinen ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Virheellinen luku: täytyy olla luvun ${issue.divisor} monikerta`;
			case "unrecognized_keys": return `${issue.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return "Virheellinen avain tietueessa";
			case "invalid_union": return "Virheellinen unioni";
			case "invalid_element": return "Virheellinen arvo joukossa";
			default: return `Virheellinen syöte`;
		}
	};
};
function fi_default() {
	return { localeError: error$34() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/fr.js
const error$33 = () => {
	const Sizable = {
		string: {
			unit: "caractères",
			verb: "avoir"
		},
		file: {
			unit: "octets",
			verb: "avoir"
		},
		array: {
			unit: "éléments",
			verb: "avoir"
		},
		set: {
			unit: "éléments",
			verb: "avoir"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "entrée",
		email: "adresse e-mail",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "date et heure ISO",
		date: "date ISO",
		time: "heure ISO",
		duration: "durée ISO",
		ipv4: "adresse IPv4",
		ipv6: "adresse IPv6",
		cidrv4: "plage IPv4",
		cidrv6: "plage IPv6",
		base64: "chaîne encodée en base64",
		base64url: "chaîne encodée en base64url",
		json_string: "chaîne JSON",
		e164: "numéro E.164",
		jwt: "JWT",
		template_literal: "entrée"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "nombre",
		array: "tableau"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Entrée invalide : instanceof ${issue.expected} attendu, ${received} reçu`;
				return `Entrée invalide : ${expected} attendu, ${received} reçu`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Entrée invalide : ${stringifyPrimitive(issue.values[0])} attendu`;
				return `Option invalide : une valeur parmi ${joinValues(issue.values, "|")} attendue`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Trop grand : ${issue.origin ?? "valeur"} doit ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "élément(s)"}`;
				return `Trop grand : ${issue.origin ?? "valeur"} doit être ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Trop petit : ${issue.origin} doit ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Trop petit : ${issue.origin} doit être ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Chaîne invalide : doit commencer par "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Chaîne invalide : doit se terminer par "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Chaîne invalide : doit inclure "${_issue.includes}"`;
				if (_issue.format === "regex") return `Chaîne invalide : doit correspondre au modèle ${_issue.pattern}`;
				return `${FormatDictionary[_issue.format] ?? issue.format} invalide`;
			}
			case "not_multiple_of": return `Nombre invalide : doit être un multiple de ${issue.divisor}`;
			case "unrecognized_keys": return `Clé${issue.keys.length > 1 ? "s" : ""} non reconnue${issue.keys.length > 1 ? "s" : ""} : ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Clé invalide dans ${issue.origin}`;
			case "invalid_union": return "Entrée invalide";
			case "invalid_element": return `Valeur invalide dans ${issue.origin}`;
			default: return `Entrée invalide`;
		}
	};
};
function fr_default() {
	return { localeError: error$33() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/fr-CA.js
const error$32 = () => {
	const Sizable = {
		string: {
			unit: "caractères",
			verb: "avoir"
		},
		file: {
			unit: "octets",
			verb: "avoir"
		},
		array: {
			unit: "éléments",
			verb: "avoir"
		},
		set: {
			unit: "éléments",
			verb: "avoir"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "entrée",
		email: "adresse courriel",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "date-heure ISO",
		date: "date ISO",
		time: "heure ISO",
		duration: "durée ISO",
		ipv4: "adresse IPv4",
		ipv6: "adresse IPv6",
		cidrv4: "plage IPv4",
		cidrv6: "plage IPv6",
		base64: "chaîne encodée en base64",
		base64url: "chaîne encodée en base64url",
		json_string: "chaîne JSON",
		e164: "numéro E.164",
		jwt: "JWT",
		template_literal: "entrée"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Entrée invalide : attendu instanceof ${issue.expected}, reçu ${received}`;
				return `Entrée invalide : attendu ${expected}, reçu ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Entrée invalide : attendu ${stringifyPrimitive(issue.values[0])}`;
				return `Option invalide : attendu l'une des valeurs suivantes ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "≤" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Trop grand : attendu que ${issue.origin ?? "la valeur"} ait ${adj}${issue.maximum.toString()} ${sizing.unit}`;
				return `Trop grand : attendu que ${issue.origin ?? "la valeur"} soit ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? "≥" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Trop petit : attendu que ${issue.origin} ait ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Trop petit : attendu que ${issue.origin} soit ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Chaîne invalide : doit commencer par "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Chaîne invalide : doit se terminer par "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Chaîne invalide : doit inclure "${_issue.includes}"`;
				if (_issue.format === "regex") return `Chaîne invalide : doit correspondre au motif ${_issue.pattern}`;
				return `${FormatDictionary[_issue.format] ?? issue.format} invalide`;
			}
			case "not_multiple_of": return `Nombre invalide : doit être un multiple de ${issue.divisor}`;
			case "unrecognized_keys": return `Clé${issue.keys.length > 1 ? "s" : ""} non reconnue${issue.keys.length > 1 ? "s" : ""} : ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Clé invalide dans ${issue.origin}`;
			case "invalid_union": return "Entrée invalide";
			case "invalid_element": return `Valeur invalide dans ${issue.origin}`;
			default: return `Entrée invalide`;
		}
	};
};
function fr_CA_default() {
	return { localeError: error$32() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/he.js
const error$31 = () => {
	const TypeNames = {
		string: {
			label: "מחרוזת",
			gender: "f"
		},
		number: {
			label: "מספר",
			gender: "m"
		},
		boolean: {
			label: "ערך בוליאני",
			gender: "m"
		},
		bigint: {
			label: "BigInt",
			gender: "m"
		},
		date: {
			label: "תאריך",
			gender: "m"
		},
		array: {
			label: "מערך",
			gender: "m"
		},
		object: {
			label: "אובייקט",
			gender: "m"
		},
		null: {
			label: "ערך ריק (null)",
			gender: "m"
		},
		undefined: {
			label: "ערך לא מוגדר (undefined)",
			gender: "m"
		},
		symbol: {
			label: "סימבול (Symbol)",
			gender: "m"
		},
		function: {
			label: "פונקציה",
			gender: "f"
		},
		map: {
			label: "מפה (Map)",
			gender: "f"
		},
		set: {
			label: "קבוצה (Set)",
			gender: "f"
		},
		file: {
			label: "קובץ",
			gender: "m"
		},
		promise: {
			label: "Promise",
			gender: "m"
		},
		NaN: {
			label: "NaN",
			gender: "m"
		},
		unknown: {
			label: "ערך לא ידוע",
			gender: "m"
		},
		value: {
			label: "ערך",
			gender: "m"
		}
	};
	const Sizable = {
		string: {
			unit: "תווים",
			shortLabel: "קצר",
			longLabel: "ארוך"
		},
		file: {
			unit: "בייטים",
			shortLabel: "קטן",
			longLabel: "גדול"
		},
		array: {
			unit: "פריטים",
			shortLabel: "קטן",
			longLabel: "גדול"
		},
		set: {
			unit: "פריטים",
			shortLabel: "קטן",
			longLabel: "גדול"
		},
		number: {
			unit: "",
			shortLabel: "קטן",
			longLabel: "גדול"
		}
	};
	const typeEntry = (t) => t ? TypeNames[t] : void 0;
	const typeLabel = (t) => {
		const e = typeEntry(t);
		if (e) return e.label;
		return t ?? TypeNames.unknown.label;
	};
	const withDefinite = (t) => `ה${typeLabel(t)}`;
	const verbFor = (t) => {
		return (typeEntry(t)?.gender ?? "m") === "f" ? "צריכה להיות" : "צריך להיות";
	};
	const getSizing = (origin) => {
		if (!origin) return null;
		return Sizable[origin] ?? null;
	};
	const FormatDictionary = {
		regex: {
			label: "קלט",
			gender: "m"
		},
		email: {
			label: "כתובת אימייל",
			gender: "f"
		},
		url: {
			label: "כתובת רשת",
			gender: "f"
		},
		emoji: {
			label: "אימוג'י",
			gender: "m"
		},
		uuid: {
			label: "UUID",
			gender: "m"
		},
		nanoid: {
			label: "nanoid",
			gender: "m"
		},
		guid: {
			label: "GUID",
			gender: "m"
		},
		cuid: {
			label: "cuid",
			gender: "m"
		},
		cuid2: {
			label: "cuid2",
			gender: "m"
		},
		ulid: {
			label: "ULID",
			gender: "m"
		},
		xid: {
			label: "XID",
			gender: "m"
		},
		ksuid: {
			label: "KSUID",
			gender: "m"
		},
		datetime: {
			label: "תאריך וזמן ISO",
			gender: "m"
		},
		date: {
			label: "תאריך ISO",
			gender: "m"
		},
		time: {
			label: "זמן ISO",
			gender: "m"
		},
		duration: {
			label: "משך זמן ISO",
			gender: "m"
		},
		ipv4: {
			label: "כתובת IPv4",
			gender: "f"
		},
		ipv6: {
			label: "כתובת IPv6",
			gender: "f"
		},
		cidrv4: {
			label: "טווח IPv4",
			gender: "m"
		},
		cidrv6: {
			label: "טווח IPv6",
			gender: "m"
		},
		base64: {
			label: "מחרוזת בבסיס 64",
			gender: "f"
		},
		base64url: {
			label: "מחרוזת בבסיס 64 לכתובות רשת",
			gender: "f"
		},
		json_string: {
			label: "מחרוזת JSON",
			gender: "f"
		},
		e164: {
			label: "מספר E.164",
			gender: "m"
		},
		jwt: {
			label: "JWT",
			gender: "m"
		},
		ends_with: {
			label: "קלט",
			gender: "m"
		},
		includes: {
			label: "קלט",
			gender: "m"
		},
		lowercase: {
			label: "קלט",
			gender: "m"
		},
		starts_with: {
			label: "קלט",
			gender: "m"
		},
		uppercase: {
			label: "קלט",
			gender: "m"
		}
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expectedKey = issue.expected;
				const expected = TypeDictionary[expectedKey ?? ""] ?? typeLabel(expectedKey);
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? TypeNames[receivedType]?.label ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `קלט לא תקין: צריך להיות instanceof ${issue.expected}, התקבל ${received}`;
				return `קלט לא תקין: צריך להיות ${expected}, התקבל ${received}`;
			}
			case "invalid_value": {
				if (issue.values.length === 1) return `ערך לא תקין: הערך חייב להיות ${stringifyPrimitive(issue.values[0])}`;
				const stringified = issue.values.map((v) => stringifyPrimitive(v));
				if (issue.values.length === 2) return `ערך לא תקין: האפשרויות המתאימות הן ${stringified[0]} או ${stringified[1]}`;
				const lastValue = stringified[stringified.length - 1];
				return `ערך לא תקין: האפשרויות המתאימות הן ${stringified.slice(0, -1).join(", ")} או ${lastValue}`;
			}
			case "too_big": {
				const sizing = getSizing(issue.origin);
				const subject = withDefinite(issue.origin ?? "value");
				if (issue.origin === "string") return `${sizing?.longLabel ?? "ארוך"} מדי: ${subject} צריכה להכיל ${issue.maximum.toString()} ${sizing?.unit ?? ""} ${issue.inclusive ? "או פחות" : "לכל היותר"}`.trim();
				if (issue.origin === "number") return `גדול מדי: ${subject} צריך להיות ${issue.inclusive ? `קטן או שווה ל-${issue.maximum}` : `קטן מ-${issue.maximum}`}`;
				if (issue.origin === "array" || issue.origin === "set") return `גדול מדי: ${subject} ${issue.origin === "set" ? "צריכה" : "צריך"} להכיל ${issue.inclusive ? `${issue.maximum} ${sizing?.unit ?? ""} או פחות` : `פחות מ-${issue.maximum} ${sizing?.unit ?? ""}`}`.trim();
				const adj = issue.inclusive ? "<=" : "<";
				const be = verbFor(issue.origin ?? "value");
				if (sizing?.unit) return `${sizing.longLabel} מדי: ${subject} ${be} ${adj}${issue.maximum.toString()} ${sizing.unit}`;
				return `${sizing?.longLabel ?? "גדול"} מדי: ${subject} ${be} ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const sizing = getSizing(issue.origin);
				const subject = withDefinite(issue.origin ?? "value");
				if (issue.origin === "string") return `${sizing?.shortLabel ?? "קצר"} מדי: ${subject} צריכה להכיל ${issue.minimum.toString()} ${sizing?.unit ?? ""} ${issue.inclusive ? "או יותר" : "לפחות"}`.trim();
				if (issue.origin === "number") return `קטן מדי: ${subject} צריך להיות ${issue.inclusive ? `גדול או שווה ל-${issue.minimum}` : `גדול מ-${issue.minimum}`}`;
				if (issue.origin === "array" || issue.origin === "set") {
					const verb = issue.origin === "set" ? "צריכה" : "צריך";
					if (issue.minimum === 1 && issue.inclusive) return `קטן מדי: ${subject} ${verb} להכיל ${issue.origin === "set" ? "לפחות פריט אחד" : "לפחות פריט אחד"}`;
					return `קטן מדי: ${subject} ${verb} להכיל ${issue.inclusive ? `${issue.minimum} ${sizing?.unit ?? ""} או יותר` : `יותר מ-${issue.minimum} ${sizing?.unit ?? ""}`}`.trim();
				}
				const adj = issue.inclusive ? ">=" : ">";
				const be = verbFor(issue.origin ?? "value");
				if (sizing?.unit) return `${sizing.shortLabel} מדי: ${subject} ${be} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `${sizing?.shortLabel ?? "קטן"} מדי: ${subject} ${be} ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `המחרוזת חייבת להתחיל ב "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `המחרוזת חייבת להסתיים ב "${_issue.suffix}"`;
				if (_issue.format === "includes") return `המחרוזת חייבת לכלול "${_issue.includes}"`;
				if (_issue.format === "regex") return `המחרוזת חייבת להתאים לתבנית ${_issue.pattern}`;
				const nounEntry = FormatDictionary[_issue.format];
				return `${nounEntry?.label ?? _issue.format} לא ${(nounEntry?.gender ?? "m") === "f" ? "תקינה" : "תקין"}`;
			}
			case "not_multiple_of": return `מספר לא תקין: חייב להיות מכפלה של ${issue.divisor}`;
			case "unrecognized_keys": return `מפתח${issue.keys.length > 1 ? "ות" : ""} לא מזוה${issue.keys.length > 1 ? "ים" : "ה"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `שדה לא תקין באובייקט`;
			case "invalid_union": return "קלט לא תקין";
			case "invalid_element": return `ערך לא תקין ב${withDefinite(issue.origin ?? "array")}`;
			default: return `קלט לא תקין`;
		}
	};
};
function he_default() {
	return { localeError: error$31() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/hu.js
const error$30 = () => {
	const Sizable = {
		string: {
			unit: "karakter",
			verb: "legyen"
		},
		file: {
			unit: "byte",
			verb: "legyen"
		},
		array: {
			unit: "elem",
			verb: "legyen"
		},
		set: {
			unit: "elem",
			verb: "legyen"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "bemenet",
		email: "email cím",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO időbélyeg",
		date: "ISO dátum",
		time: "ISO idő",
		duration: "ISO időintervallum",
		ipv4: "IPv4 cím",
		ipv6: "IPv6 cím",
		cidrv4: "IPv4 tartomány",
		cidrv6: "IPv6 tartomány",
		base64: "base64-kódolt string",
		base64url: "base64url-kódolt string",
		json_string: "JSON string",
		e164: "E.164 szám",
		jwt: "JWT",
		template_literal: "bemenet"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "szám",
		array: "tömb"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Érvénytelen bemenet: a várt érték instanceof ${issue.expected}, a kapott érték ${received}`;
				return `Érvénytelen bemenet: a várt érték ${expected}, a kapott érték ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Érvénytelen bemenet: a várt érték ${stringifyPrimitive(issue.values[0])}`;
				return `Érvénytelen opció: valamelyik érték várt ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Túl nagy: ${issue.origin ?? "érték"} mérete túl nagy ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elem"}`;
				return `Túl nagy: a bemeneti érték ${issue.origin ?? "érték"} túl nagy: ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Túl kicsi: a bemeneti érték ${issue.origin} mérete túl kicsi ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Túl kicsi: a bemeneti érték ${issue.origin} túl kicsi ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Érvénytelen string: "${_issue.prefix}" értékkel kell kezdődnie`;
				if (_issue.format === "ends_with") return `Érvénytelen string: "${_issue.suffix}" értékkel kell végződnie`;
				if (_issue.format === "includes") return `Érvénytelen string: "${_issue.includes}" értéket kell tartalmaznia`;
				if (_issue.format === "regex") return `Érvénytelen string: ${_issue.pattern} mintának kell megfelelnie`;
				return `Érvénytelen ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Érvénytelen szám: ${issue.divisor} többszörösének kell lennie`;
			case "unrecognized_keys": return `Ismeretlen kulcs${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Érvénytelen kulcs ${issue.origin}`;
			case "invalid_union": return "Érvénytelen bemenet";
			case "invalid_element": return `Érvénytelen érték: ${issue.origin}`;
			default: return `Érvénytelen bemenet`;
		}
	};
};
function hu_default() {
	return { localeError: error$30() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/hy.js
function getArmenianPlural(count, one, many) {
	return Math.abs(count) === 1 ? one : many;
}
function withDefiniteArticle(word) {
	if (!word) return "";
	const vowels = [
		"ա",
		"ե",
		"ը",
		"ի",
		"ո",
		"ու",
		"օ"
	];
	const lastChar = word[word.length - 1];
	return word + (vowels.includes(lastChar) ? "ն" : "ը");
}
const error$29 = () => {
	const Sizable = {
		string: {
			unit: {
				one: "նշան",
				many: "նշաններ"
			},
			verb: "ունենալ"
		},
		file: {
			unit: {
				one: "բայթ",
				many: "բայթեր"
			},
			verb: "ունենալ"
		},
		array: {
			unit: {
				one: "տարր",
				many: "տարրեր"
			},
			verb: "ունենալ"
		},
		set: {
			unit: {
				one: "տարր",
				many: "տարրեր"
			},
			verb: "ունենալ"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "մուտք",
		email: "էլ. հասցե",
		url: "URL",
		emoji: "էմոջի",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO ամսաթիվ և ժամ",
		date: "ISO ամսաթիվ",
		time: "ISO ժամ",
		duration: "ISO տևողություն",
		ipv4: "IPv4 հասցե",
		ipv6: "IPv6 հասցե",
		cidrv4: "IPv4 միջակայք",
		cidrv6: "IPv6 միջակայք",
		base64: "base64 ձևաչափով տող",
		base64url: "base64url ձևաչափով տող",
		json_string: "JSON տող",
		e164: "E.164 համար",
		jwt: "JWT",
		template_literal: "մուտք"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "թիվ",
		array: "զանգված"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Սխալ մուտքագրում․ սպասվում էր instanceof ${issue.expected}, ստացվել է ${received}`;
				return `Սխալ մուտքագրում․ սպասվում էր ${expected}, ստացվել է ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Սխալ մուտքագրում․ սպասվում էր ${stringifyPrimitive(issue.values[1])}`;
				return `Սխալ տարբերակ․ սպասվում էր հետևյալներից մեկը՝ ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) {
					const unit = getArmenianPlural(Number(issue.maximum), sizing.unit.one, sizing.unit.many);
					return `Չափազանց մեծ արժեք․ սպասվում է, որ ${withDefiniteArticle(issue.origin ?? "արժեք")} կունենա ${adj}${issue.maximum.toString()} ${unit}`;
				}
				return `Չափազանց մեծ արժեք․ սպասվում է, որ ${withDefiniteArticle(issue.origin ?? "արժեք")} լինի ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) {
					const unit = getArmenianPlural(Number(issue.minimum), sizing.unit.one, sizing.unit.many);
					return `Չափազանց փոքր արժեք․ սպասվում է, որ ${withDefiniteArticle(issue.origin)} կունենա ${adj}${issue.minimum.toString()} ${unit}`;
				}
				return `Չափազանց փոքր արժեք․ սպասվում է, որ ${withDefiniteArticle(issue.origin)} լինի ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Սխալ տող․ պետք է սկսվի "${_issue.prefix}"-ով`;
				if (_issue.format === "ends_with") return `Սխալ տող․ պետք է ավարտվի "${_issue.suffix}"-ով`;
				if (_issue.format === "includes") return `Սխալ տող․ պետք է պարունակի "${_issue.includes}"`;
				if (_issue.format === "regex") return `Սխալ տող․ պետք է համապատասխանի ${_issue.pattern} ձևաչափին`;
				return `Սխալ ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Սխալ թիվ․ պետք է բազմապատիկ լինի ${issue.divisor}-ի`;
			case "unrecognized_keys": return `Չճանաչված բանալի${issue.keys.length > 1 ? "ներ" : ""}. ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Սխալ բանալի ${withDefiniteArticle(issue.origin)}-ում`;
			case "invalid_union": return "Սխալ մուտքագրում";
			case "invalid_element": return `Սխալ արժեք ${withDefiniteArticle(issue.origin)}-ում`;
			default: return `Սխալ մուտքագրում`;
		}
	};
};
function hy_default() {
	return { localeError: error$29() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/id.js
const error$28 = () => {
	const Sizable = {
		string: {
			unit: "karakter",
			verb: "memiliki"
		},
		file: {
			unit: "byte",
			verb: "memiliki"
		},
		array: {
			unit: "item",
			verb: "memiliki"
		},
		set: {
			unit: "item",
			verb: "memiliki"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "alamat email",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "tanggal dan waktu format ISO",
		date: "tanggal format ISO",
		time: "jam format ISO",
		duration: "durasi format ISO",
		ipv4: "alamat IPv4",
		ipv6: "alamat IPv6",
		cidrv4: "rentang alamat IPv4",
		cidrv6: "rentang alamat IPv6",
		base64: "string dengan enkode base64",
		base64url: "string dengan enkode base64url",
		json_string: "string JSON",
		e164: "angka E.164",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Input tidak valid: diharapkan instanceof ${issue.expected}, diterima ${received}`;
				return `Input tidak valid: diharapkan ${expected}, diterima ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Input tidak valid: diharapkan ${stringifyPrimitive(issue.values[0])}`;
				return `Pilihan tidak valid: diharapkan salah satu dari ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Terlalu besar: diharapkan ${issue.origin ?? "value"} memiliki ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elemen"}`;
				return `Terlalu besar: diharapkan ${issue.origin ?? "value"} menjadi ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Terlalu kecil: diharapkan ${issue.origin} memiliki ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Terlalu kecil: diharapkan ${issue.origin} menjadi ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `String tidak valid: harus dimulai dengan "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `String tidak valid: harus berakhir dengan "${_issue.suffix}"`;
				if (_issue.format === "includes") return `String tidak valid: harus menyertakan "${_issue.includes}"`;
				if (_issue.format === "regex") return `String tidak valid: harus sesuai pola ${_issue.pattern}`;
				return `${FormatDictionary[_issue.format] ?? issue.format} tidak valid`;
			}
			case "not_multiple_of": return `Angka tidak valid: harus kelipatan dari ${issue.divisor}`;
			case "unrecognized_keys": return `Kunci tidak dikenali ${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Kunci tidak valid di ${issue.origin}`;
			case "invalid_union": return "Input tidak valid";
			case "invalid_element": return `Nilai tidak valid di ${issue.origin}`;
			default: return `Input tidak valid`;
		}
	};
};
function id_default() {
	return { localeError: error$28() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/is.js
const error$27 = () => {
	const Sizable = {
		string: {
			unit: "stafi",
			verb: "að hafa"
		},
		file: {
			unit: "bæti",
			verb: "að hafa"
		},
		array: {
			unit: "hluti",
			verb: "að hafa"
		},
		set: {
			unit: "hluti",
			verb: "að hafa"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "gildi",
		email: "netfang",
		url: "vefslóð",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO dagsetning og tími",
		date: "ISO dagsetning",
		time: "ISO tími",
		duration: "ISO tímalengd",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded strengur",
		base64url: "base64url-encoded strengur",
		json_string: "JSON strengur",
		e164: "E.164 tölugildi",
		jwt: "JWT",
		template_literal: "gildi"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "númer",
		array: "fylki"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Rangt gildi: Þú slóst inn ${received} þar sem á að vera instanceof ${issue.expected}`;
				return `Rangt gildi: Þú slóst inn ${received} þar sem á að vera ${expected}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Rangt gildi: gert ráð fyrir ${stringifyPrimitive(issue.values[0])}`;
				return `Ógilt val: má vera eitt af eftirfarandi ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Of stórt: gert er ráð fyrir að ${issue.origin ?? "gildi"} hafi ${adj}${issue.maximum.toString()} ${sizing.unit ?? "hluti"}`;
				return `Of stórt: gert er ráð fyrir að ${issue.origin ?? "gildi"} sé ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Of lítið: gert er ráð fyrir að ${issue.origin} hafi ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Of lítið: gert er ráð fyrir að ${issue.origin} sé ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Ógildur strengur: verður að byrja á "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Ógildur strengur: verður að enda á "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Ógildur strengur: verður að innihalda "${_issue.includes}"`;
				if (_issue.format === "regex") return `Ógildur strengur: verður að fylgja mynstri ${_issue.pattern}`;
				return `Rangt ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Röng tala: verður að vera margfeldi af ${issue.divisor}`;
			case "unrecognized_keys": return `Óþekkt ${issue.keys.length > 1 ? "ir lyklar" : "ur lykill"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Rangur lykill í ${issue.origin}`;
			case "invalid_union": return "Rangt gildi";
			case "invalid_element": return `Rangt gildi í ${issue.origin}`;
			default: return `Rangt gildi`;
		}
	};
};
function is_default() {
	return { localeError: error$27() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/it.js
const error$26 = () => {
	const Sizable = {
		string: {
			unit: "caratteri",
			verb: "avere"
		},
		file: {
			unit: "byte",
			verb: "avere"
		},
		array: {
			unit: "elementi",
			verb: "avere"
		},
		set: {
			unit: "elementi",
			verb: "avere"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "indirizzo email",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "data e ora ISO",
		date: "data ISO",
		time: "ora ISO",
		duration: "durata ISO",
		ipv4: "indirizzo IPv4",
		ipv6: "indirizzo IPv6",
		cidrv4: "intervallo IPv4",
		cidrv6: "intervallo IPv6",
		base64: "stringa codificata in base64",
		base64url: "URL codificata in base64",
		json_string: "stringa JSON",
		e164: "numero E.164",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "numero",
		array: "vettore"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Input non valido: atteso instanceof ${issue.expected}, ricevuto ${received}`;
				return `Input non valido: atteso ${expected}, ricevuto ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Input non valido: atteso ${stringifyPrimitive(issue.values[0])}`;
				return `Opzione non valida: atteso uno tra ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Troppo grande: ${issue.origin ?? "valore"} deve avere ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementi"}`;
				return `Troppo grande: ${issue.origin ?? "valore"} deve essere ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Troppo piccolo: ${issue.origin} deve avere ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Troppo piccolo: ${issue.origin} deve essere ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Stringa non valida: deve iniziare con "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Stringa non valida: deve terminare con "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Stringa non valida: deve includere "${_issue.includes}"`;
				if (_issue.format === "regex") return `Stringa non valida: deve corrispondere al pattern ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Numero non valido: deve essere un multiplo di ${issue.divisor}`;
			case "unrecognized_keys": return `Chiav${issue.keys.length > 1 ? "i" : "e"} non riconosciut${issue.keys.length > 1 ? "e" : "a"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Chiave non valida in ${issue.origin}`;
			case "invalid_union": return "Input non valido";
			case "invalid_element": return `Valore non valido in ${issue.origin}`;
			default: return `Input non valido`;
		}
	};
};
function it_default() {
	return { localeError: error$26() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ja.js
const error$25 = () => {
	const Sizable = {
		string: {
			unit: "文字",
			verb: "である"
		},
		file: {
			unit: "バイト",
			verb: "である"
		},
		array: {
			unit: "要素",
			verb: "である"
		},
		set: {
			unit: "要素",
			verb: "である"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "入力値",
		email: "メールアドレス",
		url: "URL",
		emoji: "絵文字",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO日時",
		date: "ISO日付",
		time: "ISO時刻",
		duration: "ISO期間",
		ipv4: "IPv4アドレス",
		ipv6: "IPv6アドレス",
		cidrv4: "IPv4範囲",
		cidrv6: "IPv6範囲",
		base64: "base64エンコード文字列",
		base64url: "base64urlエンコード文字列",
		json_string: "JSON文字列",
		e164: "E.164番号",
		jwt: "JWT",
		template_literal: "入力値"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "数値",
		array: "配列"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `無効な入力: instanceof ${issue.expected}が期待されましたが、${received}が入力されました`;
				return `無効な入力: ${expected}が期待されましたが、${received}が入力されました`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `無効な入力: ${stringifyPrimitive(issue.values[0])}が期待されました`;
				return `無効な選択: ${joinValues(issue.values, "、")}のいずれかである必要があります`;
			case "too_big": {
				const adj = issue.inclusive ? "以下である" : "より小さい";
				const sizing = getSizing(issue.origin);
				if (sizing) return `大きすぎる値: ${issue.origin ?? "値"}は${issue.maximum.toString()}${sizing.unit ?? "要素"}${adj}必要があります`;
				return `大きすぎる値: ${issue.origin ?? "値"}は${issue.maximum.toString()}${adj}必要があります`;
			}
			case "too_small": {
				const adj = issue.inclusive ? "以上である" : "より大きい";
				const sizing = getSizing(issue.origin);
				if (sizing) return `小さすぎる値: ${issue.origin}は${issue.minimum.toString()}${sizing.unit}${adj}必要があります`;
				return `小さすぎる値: ${issue.origin}は${issue.minimum.toString()}${adj}必要があります`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `無効な文字列: "${_issue.prefix}"で始まる必要があります`;
				if (_issue.format === "ends_with") return `無効な文字列: "${_issue.suffix}"で終わる必要があります`;
				if (_issue.format === "includes") return `無効な文字列: "${_issue.includes}"を含む必要があります`;
				if (_issue.format === "regex") return `無効な文字列: パターン${_issue.pattern}に一致する必要があります`;
				return `無効な${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `無効な数値: ${issue.divisor}の倍数である必要があります`;
			case "unrecognized_keys": return `認識されていないキー${issue.keys.length > 1 ? "群" : ""}: ${joinValues(issue.keys, "、")}`;
			case "invalid_key": return `${issue.origin}内の無効なキー`;
			case "invalid_union": return "無効な入力";
			case "invalid_element": return `${issue.origin}内の無効な値`;
			default: return `無効な入力`;
		}
	};
};
function ja_default() {
	return { localeError: error$25() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ka.js
const error$24 = () => {
	const Sizable = {
		string: {
			unit: "სიმბოლო",
			verb: "უნდა შეიცავდეს"
		},
		file: {
			unit: "ბაიტი",
			verb: "უნდა შეიცავდეს"
		},
		array: {
			unit: "ელემენტი",
			verb: "უნდა შეიცავდეს"
		},
		set: {
			unit: "ელემენტი",
			verb: "უნდა შეიცავდეს"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "შეყვანა",
		email: "ელ-ფოსტის მისამართი",
		url: "URL",
		emoji: "ემოჯი",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "თარიღი-დრო",
		date: "თარიღი",
		time: "დრო",
		duration: "ხანგრძლივობა",
		ipv4: "IPv4 მისამართი",
		ipv6: "IPv6 მისამართი",
		cidrv4: "IPv4 დიაპაზონი",
		cidrv6: "IPv6 დიაპაზონი",
		base64: "base64-კოდირებული სტრინგი",
		base64url: "base64url-კოდირებული სტრინგი",
		json_string: "JSON სტრინგი",
		e164: "E.164 ნომერი",
		jwt: "JWT",
		template_literal: "შეყვანა"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "რიცხვი",
		string: "სტრინგი",
		boolean: "ბულეანი",
		function: "ფუნქცია",
		array: "მასივი"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `არასწორი შეყვანა: მოსალოდნელი instanceof ${issue.expected}, მიღებული ${received}`;
				return `არასწორი შეყვანა: მოსალოდნელი ${expected}, მიღებული ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `არასწორი შეყვანა: მოსალოდნელი ${stringifyPrimitive(issue.values[0])}`;
				return `არასწორი ვარიანტი: მოსალოდნელია ერთ-ერთი ${joinValues(issue.values, "|")}-დან`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `ზედმეტად დიდი: მოსალოდნელი ${issue.origin ?? "მნიშვნელობა"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit}`;
				return `ზედმეტად დიდი: მოსალოდნელი ${issue.origin ?? "მნიშვნელობა"} იყოს ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `ზედმეტად პატარა: მოსალოდნელი ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `ზედმეტად პატარა: მოსალოდნელი ${issue.origin} იყოს ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `არასწორი სტრინგი: უნდა იწყებოდეს "${_issue.prefix}"-ით`;
				if (_issue.format === "ends_with") return `არასწორი სტრინგი: უნდა მთავრდებოდეს "${_issue.suffix}"-ით`;
				if (_issue.format === "includes") return `არასწორი სტრინგი: უნდა შეიცავდეს "${_issue.includes}"-ს`;
				if (_issue.format === "regex") return `არასწორი სტრინგი: უნდა შეესაბამებოდეს შაბლონს ${_issue.pattern}`;
				return `არასწორი ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `არასწორი რიცხვი: უნდა იყოს ${issue.divisor}-ის ჯერადი`;
			case "unrecognized_keys": return `უცნობი გასაღებ${issue.keys.length > 1 ? "ები" : "ი"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `არასწორი გასაღები ${issue.origin}-ში`;
			case "invalid_union": return "არასწორი შეყვანა";
			case "invalid_element": return `არასწორი მნიშვნელობა ${issue.origin}-ში`;
			default: return `არასწორი შეყვანა`;
		}
	};
};
function ka_default() {
	return { localeError: error$24() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/km.js
const error$23 = () => {
	const Sizable = {
		string: {
			unit: "តួអក្សរ",
			verb: "គួរមាន"
		},
		file: {
			unit: "បៃ",
			verb: "គួរមាន"
		},
		array: {
			unit: "ធាតុ",
			verb: "គួរមាន"
		},
		set: {
			unit: "ធាតុ",
			verb: "គួរមាន"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "ទិន្នន័យបញ្ចូល",
		email: "អាសយដ្ឋានអ៊ីមែល",
		url: "URL",
		emoji: "សញ្ញាអារម្មណ៍",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "កាលបរិច្ឆេទ និងម៉ោង ISO",
		date: "កាលបរិច្ឆេទ ISO",
		time: "ម៉ោង ISO",
		duration: "រយៈពេល ISO",
		ipv4: "អាសយដ្ឋាន IPv4",
		ipv6: "អាសយដ្ឋាន IPv6",
		cidrv4: "ដែនអាសយដ្ឋាន IPv4",
		cidrv6: "ដែនអាសយដ្ឋាន IPv6",
		base64: "ខ្សែអក្សរអ៊ិកូដ base64",
		base64url: "ខ្សែអក្សរអ៊ិកូដ base64url",
		json_string: "ខ្សែអក្សរ JSON",
		e164: "លេខ E.164",
		jwt: "JWT",
		template_literal: "ទិន្នន័យបញ្ចូល"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "លេខ",
		array: "អារេ (Array)",
		null: "គ្មានតម្លៃ (null)"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `ទិន្នន័យបញ្ចូលមិនត្រឹមត្រូវ៖ ត្រូវការ instanceof ${issue.expected} ប៉ុន្តែទទួលបាន ${received}`;
				return `ទិន្នន័យបញ្ចូលមិនត្រឹមត្រូវ៖ ត្រូវការ ${expected} ប៉ុន្តែទទួលបាន ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `ទិន្នន័យបញ្ចូលមិនត្រឹមត្រូវ៖ ត្រូវការ ${stringifyPrimitive(issue.values[0])}`;
				return `ជម្រើសមិនត្រឹមត្រូវ៖ ត្រូវជាមួយក្នុងចំណោម ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `ធំពេក៖ ត្រូវការ ${issue.origin ?? "តម្លៃ"} ${adj} ${issue.maximum.toString()} ${sizing.unit ?? "ធាតុ"}`;
				return `ធំពេក៖ ត្រូវការ ${issue.origin ?? "តម្លៃ"} ${adj} ${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `តូចពេក៖ ត្រូវការ ${issue.origin} ${adj} ${issue.minimum.toString()} ${sizing.unit}`;
				return `តូចពេក៖ ត្រូវការ ${issue.origin} ${adj} ${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវចាប់ផ្តើមដោយ "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវបញ្ចប់ដោយ "${_issue.suffix}"`;
				if (_issue.format === "includes") return `ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវមាន "${_issue.includes}"`;
				if (_issue.format === "regex") return `ខ្សែអក្សរមិនត្រឹមត្រូវ៖ ត្រូវតែផ្គូផ្គងនឹងទម្រង់ដែលបានកំណត់ ${_issue.pattern}`;
				return `មិនត្រឹមត្រូវ៖ ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `លេខមិនត្រឹមត្រូវ៖ ត្រូវតែជាពហុគុណនៃ ${issue.divisor}`;
			case "unrecognized_keys": return `រកឃើញសោមិនស្គាល់៖ ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `សោមិនត្រឹមត្រូវនៅក្នុង ${issue.origin}`;
			case "invalid_union": return `ទិន្នន័យមិនត្រឹមត្រូវ`;
			case "invalid_element": return `ទិន្នន័យមិនត្រឹមត្រូវនៅក្នុង ${issue.origin}`;
			default: return `ទិន្នន័យមិនត្រឹមត្រូវ`;
		}
	};
};
function km_default() {
	return { localeError: error$23() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/kh.js
/** @deprecated Use `km` instead. */
function kh_default() {
	return km_default();
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ko.js
const error$22 = () => {
	const Sizable = {
		string: {
			unit: "문자",
			verb: "to have"
		},
		file: {
			unit: "바이트",
			verb: "to have"
		},
		array: {
			unit: "개",
			verb: "to have"
		},
		set: {
			unit: "개",
			verb: "to have"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "입력",
		email: "이메일 주소",
		url: "URL",
		emoji: "이모지",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO 날짜시간",
		date: "ISO 날짜",
		time: "ISO 시간",
		duration: "ISO 기간",
		ipv4: "IPv4 주소",
		ipv6: "IPv6 주소",
		cidrv4: "IPv4 범위",
		cidrv6: "IPv6 범위",
		base64: "base64 인코딩 문자열",
		base64url: "base64url 인코딩 문자열",
		json_string: "JSON 문자열",
		e164: "E.164 번호",
		jwt: "JWT",
		template_literal: "입력"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `잘못된 입력: 예상 타입은 instanceof ${issue.expected}, 받은 타입은 ${received}입니다`;
				return `잘못된 입력: 예상 타입은 ${expected}, 받은 타입은 ${received}입니다`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `잘못된 입력: 값은 ${stringifyPrimitive(issue.values[0])} 이어야 합니다`;
				return `잘못된 옵션: ${joinValues(issue.values, "또는 ")} 중 하나여야 합니다`;
			case "too_big": {
				const adj = issue.inclusive ? "이하" : "미만";
				const suffix = adj === "미만" ? "이어야 합니다" : "여야 합니다";
				const sizing = getSizing(issue.origin);
				const unit = sizing?.unit ?? "요소";
				if (sizing) return `${issue.origin ?? "값"}이 너무 큽니다: ${issue.maximum.toString()}${unit} ${adj}${suffix}`;
				return `${issue.origin ?? "값"}이 너무 큽니다: ${issue.maximum.toString()} ${adj}${suffix}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? "이상" : "초과";
				const suffix = adj === "이상" ? "이어야 합니다" : "여야 합니다";
				const sizing = getSizing(issue.origin);
				const unit = sizing?.unit ?? "요소";
				if (sizing) return `${issue.origin ?? "값"}이 너무 작습니다: ${issue.minimum.toString()}${unit} ${adj}${suffix}`;
				return `${issue.origin ?? "값"}이 너무 작습니다: ${issue.minimum.toString()} ${adj}${suffix}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `잘못된 문자열: "${_issue.prefix}"(으)로 시작해야 합니다`;
				if (_issue.format === "ends_with") return `잘못된 문자열: "${_issue.suffix}"(으)로 끝나야 합니다`;
				if (_issue.format === "includes") return `잘못된 문자열: "${_issue.includes}"을(를) 포함해야 합니다`;
				if (_issue.format === "regex") return `잘못된 문자열: 정규식 ${_issue.pattern} 패턴과 일치해야 합니다`;
				return `잘못된 ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `잘못된 숫자: ${issue.divisor}의 배수여야 합니다`;
			case "unrecognized_keys": return `인식할 수 없는 키: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `잘못된 키: ${issue.origin}`;
			case "invalid_union": return `잘못된 입력`;
			case "invalid_element": return `잘못된 값: ${issue.origin}`;
			default: return `잘못된 입력`;
		}
	};
};
function ko_default() {
	return { localeError: error$22() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/lt.js
const capitalizeFirstCharacter = (text) => {
	return text.charAt(0).toUpperCase() + text.slice(1);
};
function getUnitTypeFromNumber(number) {
	const abs = Math.abs(number);
	const last = abs % 10;
	const last2 = abs % 100;
	if (last2 >= 11 && last2 <= 19 || last === 0) return "many";
	if (last === 1) return "one";
	return "few";
}
const error$21 = () => {
	const Sizable = {
		string: {
			unit: {
				one: "simbolis",
				few: "simboliai",
				many: "simbolių"
			},
			verb: {
				smaller: {
					inclusive: "turi būti ne ilgesnė kaip",
					notInclusive: "turi būti trumpesnė kaip"
				},
				bigger: {
					inclusive: "turi būti ne trumpesnė kaip",
					notInclusive: "turi būti ilgesnė kaip"
				}
			}
		},
		file: {
			unit: {
				one: "baitas",
				few: "baitai",
				many: "baitų"
			},
			verb: {
				smaller: {
					inclusive: "turi būti ne didesnis kaip",
					notInclusive: "turi būti mažesnis kaip"
				},
				bigger: {
					inclusive: "turi būti ne mažesnis kaip",
					notInclusive: "turi būti didesnis kaip"
				}
			}
		},
		array: {
			unit: {
				one: "elementą",
				few: "elementus",
				many: "elementų"
			},
			verb: {
				smaller: {
					inclusive: "turi turėti ne daugiau kaip",
					notInclusive: "turi turėti mažiau kaip"
				},
				bigger: {
					inclusive: "turi turėti ne mažiau kaip",
					notInclusive: "turi turėti daugiau kaip"
				}
			}
		},
		set: {
			unit: {
				one: "elementą",
				few: "elementus",
				many: "elementų"
			},
			verb: {
				smaller: {
					inclusive: "turi turėti ne daugiau kaip",
					notInclusive: "turi turėti mažiau kaip"
				},
				bigger: {
					inclusive: "turi turėti ne mažiau kaip",
					notInclusive: "turi turėti daugiau kaip"
				}
			}
		}
	};
	function getSizing(origin, unitType, inclusive, targetShouldBe) {
		const result = Sizable[origin] ?? null;
		if (result === null) return result;
		return {
			unit: result.unit[unitType],
			verb: result.verb[targetShouldBe][inclusive ? "inclusive" : "notInclusive"]
		};
	}
	const FormatDictionary = {
		regex: "įvestis",
		email: "el. pašto adresas",
		url: "URL",
		emoji: "jaustukas",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO data ir laikas",
		date: "ISO data",
		time: "ISO laikas",
		duration: "ISO trukmė",
		ipv4: "IPv4 adresas",
		ipv6: "IPv6 adresas",
		cidrv4: "IPv4 tinklo prefiksas (CIDR)",
		cidrv6: "IPv6 tinklo prefiksas (CIDR)",
		base64: "base64 užkoduota eilutė",
		base64url: "base64url užkoduota eilutė",
		json_string: "JSON eilutė",
		e164: "E.164 numeris",
		jwt: "JWT",
		template_literal: "įvestis"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "skaičius",
		bigint: "sveikasis skaičius",
		string: "eilutė",
		boolean: "loginė reikšmė",
		undefined: "neapibrėžta reikšmė",
		function: "funkcija",
		symbol: "simbolis",
		array: "masyvas",
		object: "objektas",
		null: "nulinė reikšmė"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Gautas tipas ${received}, o tikėtasi - instanceof ${issue.expected}`;
				return `Gautas tipas ${received}, o tikėtasi - ${expected}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Privalo būti ${stringifyPrimitive(issue.values[0])}`;
				return `Privalo būti vienas iš ${joinValues(issue.values, "|")} pasirinkimų`;
			case "too_big": {
				const origin = TypeDictionary[issue.origin] ?? issue.origin;
				const sizing = getSizing(issue.origin, getUnitTypeFromNumber(Number(issue.maximum)), issue.inclusive ?? false, "smaller");
				if (sizing?.verb) return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reikšmė")} ${sizing.verb} ${issue.maximum.toString()} ${sizing.unit ?? "elementų"}`;
				const adj = issue.inclusive ? "ne didesnis kaip" : "mažesnis kaip";
				return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reikšmė")} turi būti ${adj} ${issue.maximum.toString()} ${sizing?.unit}`;
			}
			case "too_small": {
				const origin = TypeDictionary[issue.origin] ?? issue.origin;
				const sizing = getSizing(issue.origin, getUnitTypeFromNumber(Number(issue.minimum)), issue.inclusive ?? false, "bigger");
				if (sizing?.verb) return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reikšmė")} ${sizing.verb} ${issue.minimum.toString()} ${sizing.unit ?? "elementų"}`;
				const adj = issue.inclusive ? "ne mažesnis kaip" : "didesnis kaip";
				return `${capitalizeFirstCharacter(origin ?? issue.origin ?? "reikšmė")} turi būti ${adj} ${issue.minimum.toString()} ${sizing?.unit}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Eilutė privalo prasidėti "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Eilutė privalo pasibaigti "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Eilutė privalo įtraukti "${_issue.includes}"`;
				if (_issue.format === "regex") return `Eilutė privalo atitikti ${_issue.pattern}`;
				return `Neteisingas ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Skaičius privalo būti ${issue.divisor} kartotinis.`;
			case "unrecognized_keys": return `Neatpažint${issue.keys.length > 1 ? "i" : "as"} rakt${issue.keys.length > 1 ? "ai" : "as"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return "Rastas klaidingas raktas";
			case "invalid_union": return "Klaidinga įvestis";
			case "invalid_element": return `${capitalizeFirstCharacter(TypeDictionary[issue.origin] ?? issue.origin ?? issue.origin ?? "reikšmė")} turi klaidingą įvestį`;
			default: return "Klaidinga įvestis";
		}
	};
};
function lt_default() {
	return { localeError: error$21() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/mk.js
const error$20 = () => {
	const Sizable = {
		string: {
			unit: "знаци",
			verb: "да имаат"
		},
		file: {
			unit: "бајти",
			verb: "да имаат"
		},
		array: {
			unit: "ставки",
			verb: "да имаат"
		},
		set: {
			unit: "ставки",
			verb: "да имаат"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "внес",
		email: "адреса на е-пошта",
		url: "URL",
		emoji: "емоџи",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO датум и време",
		date: "ISO датум",
		time: "ISO време",
		duration: "ISO времетраење",
		ipv4: "IPv4 адреса",
		ipv6: "IPv6 адреса",
		cidrv4: "IPv4 опсег",
		cidrv6: "IPv6 опсег",
		base64: "base64-енкодирана низа",
		base64url: "base64url-енкодирана низа",
		json_string: "JSON низа",
		e164: "E.164 број",
		jwt: "JWT",
		template_literal: "внес"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "број",
		array: "низа"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Грешен внес: се очекува instanceof ${issue.expected}, примено ${received}`;
				return `Грешен внес: се очекува ${expected}, примено ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
				return `Грешана опција: се очекува една ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Премногу голем: се очекува ${issue.origin ?? "вредноста"} да има ${adj}${issue.maximum.toString()} ${sizing.unit ?? "елементи"}`;
				return `Премногу голем: се очекува ${issue.origin ?? "вредноста"} да биде ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Премногу мал: се очекува ${issue.origin} да има ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Премногу мал: се очекува ${issue.origin} да биде ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Неважечка низа: мора да започнува со "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Неважечка низа: мора да завршува со "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Неважечка низа: мора да вклучува "${_issue.includes}"`;
				if (_issue.format === "regex") return `Неважечка низа: мора да одгоара на патернот ${_issue.pattern}`;
				return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Грешен број: мора да биде делив со ${issue.divisor}`;
			case "unrecognized_keys": return `${issue.keys.length > 1 ? "Непрепознаени клучеви" : "Непрепознаен клуч"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Грешен клуч во ${issue.origin}`;
			case "invalid_union": return "Грешен внес";
			case "invalid_element": return `Грешна вредност во ${issue.origin}`;
			default: return `Грешен внес`;
		}
	};
};
function mk_default() {
	return { localeError: error$20() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ms.js
const error$19 = () => {
	const Sizable = {
		string: {
			unit: "aksara",
			verb: "mempunyai"
		},
		file: {
			unit: "bait",
			verb: "mempunyai"
		},
		array: {
			unit: "elemen",
			verb: "mempunyai"
		},
		set: {
			unit: "elemen",
			verb: "mempunyai"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "alamat e-mel",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "tarikh masa ISO",
		date: "tarikh ISO",
		time: "masa ISO",
		duration: "tempoh ISO",
		ipv4: "alamat IPv4",
		ipv6: "alamat IPv6",
		cidrv4: "julat IPv4",
		cidrv6: "julat IPv6",
		base64: "string dikodkan base64",
		base64url: "string dikodkan base64url",
		json_string: "string JSON",
		e164: "nombor E.164",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "nombor"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Input tidak sah: dijangka instanceof ${issue.expected}, diterima ${received}`;
				return `Input tidak sah: dijangka ${expected}, diterima ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Input tidak sah: dijangka ${stringifyPrimitive(issue.values[0])}`;
				return `Pilihan tidak sah: dijangka salah satu daripada ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Terlalu besar: dijangka ${issue.origin ?? "nilai"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elemen"}`;
				return `Terlalu besar: dijangka ${issue.origin ?? "nilai"} adalah ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Terlalu kecil: dijangka ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Terlalu kecil: dijangka ${issue.origin} adalah ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `String tidak sah: mesti bermula dengan "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `String tidak sah: mesti berakhir dengan "${_issue.suffix}"`;
				if (_issue.format === "includes") return `String tidak sah: mesti mengandungi "${_issue.includes}"`;
				if (_issue.format === "regex") return `String tidak sah: mesti sepadan dengan corak ${_issue.pattern}`;
				return `${FormatDictionary[_issue.format] ?? issue.format} tidak sah`;
			}
			case "not_multiple_of": return `Nombor tidak sah: perlu gandaan ${issue.divisor}`;
			case "unrecognized_keys": return `Kunci tidak dikenali: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Kunci tidak sah dalam ${issue.origin}`;
			case "invalid_union": return "Input tidak sah";
			case "invalid_element": return `Nilai tidak sah dalam ${issue.origin}`;
			default: return `Input tidak sah`;
		}
	};
};
function ms_default() {
	return { localeError: error$19() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/nl.js
const error$18 = () => {
	const Sizable = {
		string: {
			unit: "tekens",
			verb: "heeft"
		},
		file: {
			unit: "bytes",
			verb: "heeft"
		},
		array: {
			unit: "elementen",
			verb: "heeft"
		},
		set: {
			unit: "elementen",
			verb: "heeft"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "invoer",
		email: "emailadres",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datum en tijd",
		date: "ISO datum",
		time: "ISO tijd",
		duration: "ISO duur",
		ipv4: "IPv4-adres",
		ipv6: "IPv6-adres",
		cidrv4: "IPv4-bereik",
		cidrv6: "IPv6-bereik",
		base64: "base64-gecodeerde tekst",
		base64url: "base64 URL-gecodeerde tekst",
		json_string: "JSON string",
		e164: "E.164-nummer",
		jwt: "JWT",
		template_literal: "invoer"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "getal"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Ongeldige invoer: verwacht instanceof ${issue.expected}, ontving ${received}`;
				return `Ongeldige invoer: verwacht ${expected}, ontving ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Ongeldige invoer: verwacht ${stringifyPrimitive(issue.values[0])}`;
				return `Ongeldige optie: verwacht één van ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				const longName = issue.origin === "date" ? "laat" : issue.origin === "string" ? "lang" : "groot";
				if (sizing) return `Te ${longName}: verwacht dat ${issue.origin ?? "waarde"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementen"} ${sizing.verb}`;
				return `Te ${longName}: verwacht dat ${issue.origin ?? "waarde"} ${adj}${issue.maximum.toString()} is`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				const shortName = issue.origin === "date" ? "vroeg" : issue.origin === "string" ? "kort" : "klein";
				if (sizing) return `Te ${shortName}: verwacht dat ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
				return `Te ${shortName}: verwacht dat ${issue.origin} ${adj}${issue.minimum.toString()} is`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Ongeldige tekst: moet met "${_issue.prefix}" beginnen`;
				if (_issue.format === "ends_with") return `Ongeldige tekst: moet op "${_issue.suffix}" eindigen`;
				if (_issue.format === "includes") return `Ongeldige tekst: moet "${_issue.includes}" bevatten`;
				if (_issue.format === "regex") return `Ongeldige tekst: moet overeenkomen met patroon ${_issue.pattern}`;
				return `Ongeldig: ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Ongeldig getal: moet een veelvoud van ${issue.divisor} zijn`;
			case "unrecognized_keys": return `Onbekende key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Ongeldige key in ${issue.origin}`;
			case "invalid_union": return "Ongeldige invoer";
			case "invalid_element": return `Ongeldige waarde in ${issue.origin}`;
			default: return `Ongeldige invoer`;
		}
	};
};
function nl_default() {
	return { localeError: error$18() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/no.js
const error$17 = () => {
	const Sizable = {
		string: {
			unit: "tegn",
			verb: "å ha"
		},
		file: {
			unit: "bytes",
			verb: "å ha"
		},
		array: {
			unit: "elementer",
			verb: "å inneholde"
		},
		set: {
			unit: "elementer",
			verb: "å inneholde"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "input",
		email: "e-postadresse",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO dato- og klokkeslett",
		date: "ISO-dato",
		time: "ISO-klokkeslett",
		duration: "ISO-varighet",
		ipv4: "IPv4-område",
		ipv6: "IPv6-område",
		cidrv4: "IPv4-spekter",
		cidrv6: "IPv6-spekter",
		base64: "base64-enkodet streng",
		base64url: "base64url-enkodet streng",
		json_string: "JSON-streng",
		e164: "E.164-nummer",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "tall",
		array: "liste"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Ugyldig input: forventet instanceof ${issue.expected}, fikk ${received}`;
				return `Ugyldig input: forventet ${expected}, fikk ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Ugyldig verdi: forventet ${stringifyPrimitive(issue.values[0])}`;
				return `Ugyldig valg: forventet en av ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `For stor(t): forventet ${issue.origin ?? "value"} til å ha ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementer"}`;
				return `For stor(t): forventet ${issue.origin ?? "value"} til å ha ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `For lite(n): forventet ${issue.origin} til å ha ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `For lite(n): forventet ${issue.origin} til å ha ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Ugyldig streng: må starte med "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Ugyldig streng: må ende med "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Ugyldig streng: må inneholde "${_issue.includes}"`;
				if (_issue.format === "regex") return `Ugyldig streng: må matche mønsteret ${_issue.pattern}`;
				return `Ugyldig ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Ugyldig tall: må være et multiplum av ${issue.divisor}`;
			case "unrecognized_keys": return `${issue.keys.length > 1 ? "Ukjente nøkler" : "Ukjent nøkkel"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Ugyldig nøkkel i ${issue.origin}`;
			case "invalid_union": return "Ugyldig input";
			case "invalid_element": return `Ugyldig verdi i ${issue.origin}`;
			default: return `Ugyldig input`;
		}
	};
};
function no_default() {
	return { localeError: error$17() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ota.js
const error$16 = () => {
	const Sizable = {
		string: {
			unit: "harf",
			verb: "olmalıdır"
		},
		file: {
			unit: "bayt",
			verb: "olmalıdır"
		},
		array: {
			unit: "unsur",
			verb: "olmalıdır"
		},
		set: {
			unit: "unsur",
			verb: "olmalıdır"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "giren",
		email: "epostagâh",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO hengâmı",
		date: "ISO tarihi",
		time: "ISO zamanı",
		duration: "ISO müddeti",
		ipv4: "IPv4 nişânı",
		ipv6: "IPv6 nişânı",
		cidrv4: "IPv4 menzili",
		cidrv6: "IPv6 menzili",
		base64: "base64-şifreli metin",
		base64url: "base64url-şifreli metin",
		json_string: "JSON metin",
		e164: "E.164 sayısı",
		jwt: "JWT",
		template_literal: "giren"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "numara",
		array: "saf",
		null: "gayb"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Fâsit giren: umulan instanceof ${issue.expected}, alınan ${received}`;
				return `Fâsit giren: umulan ${expected}, alınan ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Fâsit giren: umulan ${stringifyPrimitive(issue.values[0])}`;
				return `Fâsit tercih: mûteberler ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Fazla büyük: ${issue.origin ?? "value"}, ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"} sahip olmalıydı.`;
				return `Fazla büyük: ${issue.origin ?? "value"}, ${adj}${issue.maximum.toString()} olmalıydı.`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Fazla küçük: ${issue.origin}, ${adj}${issue.minimum.toString()} ${sizing.unit} sahip olmalıydı.`;
				return `Fazla küçük: ${issue.origin}, ${adj}${issue.minimum.toString()} olmalıydı.`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Fâsit metin: "${_issue.prefix}" ile başlamalı.`;
				if (_issue.format === "ends_with") return `Fâsit metin: "${_issue.suffix}" ile bitmeli.`;
				if (_issue.format === "includes") return `Fâsit metin: "${_issue.includes}" ihtivâ etmeli.`;
				if (_issue.format === "regex") return `Fâsit metin: ${_issue.pattern} nakşına uymalı.`;
				return `Fâsit ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Fâsit sayı: ${issue.divisor} katı olmalıydı.`;
			case "unrecognized_keys": return `Tanınmayan anahtar ${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `${issue.origin} için tanınmayan anahtar var.`;
			case "invalid_union": return "Giren tanınamadı.";
			case "invalid_element": return `${issue.origin} için tanınmayan kıymet var.`;
			default: return `Kıymet tanınamadı.`;
		}
	};
};
function ota_default() {
	return { localeError: error$16() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ps.js
const error$15 = () => {
	const Sizable = {
		string: {
			unit: "توکي",
			verb: "ولري"
		},
		file: {
			unit: "بایټس",
			verb: "ولري"
		},
		array: {
			unit: "توکي",
			verb: "ولري"
		},
		set: {
			unit: "توکي",
			verb: "ولري"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "ورودي",
		email: "بریښنالیک",
		url: "یو آر ال",
		emoji: "ایموجي",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "نیټه او وخت",
		date: "نېټه",
		time: "وخت",
		duration: "موده",
		ipv4: "د IPv4 پته",
		ipv6: "د IPv6 پته",
		cidrv4: "د IPv4 ساحه",
		cidrv6: "د IPv6 ساحه",
		base64: "base64-encoded متن",
		base64url: "base64url-encoded متن",
		json_string: "JSON متن",
		e164: "د E.164 شمېره",
		jwt: "JWT",
		template_literal: "ورودي"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "عدد",
		array: "ارې"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `ناسم ورودي: باید instanceof ${issue.expected} وای, مګر ${received} ترلاسه شو`;
				return `ناسم ورودي: باید ${expected} وای, مګر ${received} ترلاسه شو`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `ناسم ورودي: باید ${stringifyPrimitive(issue.values[0])} وای`;
				return `ناسم انتخاب: باید یو له ${joinValues(issue.values, "|")} څخه وای`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `ډیر لوی: ${issue.origin ?? "ارزښت"} باید ${adj}${issue.maximum.toString()} ${sizing.unit ?? "عنصرونه"} ولري`;
				return `ډیر لوی: ${issue.origin ?? "ارزښت"} باید ${adj}${issue.maximum.toString()} وي`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `ډیر کوچنی: ${issue.origin} باید ${adj}${issue.minimum.toString()} ${sizing.unit} ولري`;
				return `ډیر کوچنی: ${issue.origin} باید ${adj}${issue.minimum.toString()} وي`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `ناسم متن: باید د "${_issue.prefix}" سره پیل شي`;
				if (_issue.format === "ends_with") return `ناسم متن: باید د "${_issue.suffix}" سره پای ته ورسيږي`;
				if (_issue.format === "includes") return `ناسم متن: باید "${_issue.includes}" ولري`;
				if (_issue.format === "regex") return `ناسم متن: باید د ${_issue.pattern} سره مطابقت ولري`;
				return `${FormatDictionary[_issue.format] ?? issue.format} ناسم دی`;
			}
			case "not_multiple_of": return `ناسم عدد: باید د ${issue.divisor} مضرب وي`;
			case "unrecognized_keys": return `ناسم ${issue.keys.length > 1 ? "کلیډونه" : "کلیډ"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `ناسم کلیډ په ${issue.origin} کې`;
			case "invalid_union": return `ناسمه ورودي`;
			case "invalid_element": return `ناسم عنصر په ${issue.origin} کې`;
			default: return `ناسمه ورودي`;
		}
	};
};
function ps_default() {
	return { localeError: error$15() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/pl.js
const error$14 = () => {
	const Sizable = {
		string: {
			unit: "znaków",
			verb: "mieć"
		},
		file: {
			unit: "bajtów",
			verb: "mieć"
		},
		array: {
			unit: "elementów",
			verb: "mieć"
		},
		set: {
			unit: "elementów",
			verb: "mieć"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "wyrażenie",
		email: "adres email",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "data i godzina w formacie ISO",
		date: "data w formacie ISO",
		time: "godzina w formacie ISO",
		duration: "czas trwania ISO",
		ipv4: "adres IPv4",
		ipv6: "adres IPv6",
		cidrv4: "zakres IPv4",
		cidrv6: "zakres IPv6",
		base64: "ciąg znaków zakodowany w formacie base64",
		base64url: "ciąg znaków zakodowany w formacie base64url",
		json_string: "ciąg znaków w formacie JSON",
		e164: "liczba E.164",
		jwt: "JWT",
		template_literal: "wejście"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "liczba",
		array: "tablica"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Nieprawidłowe dane wejściowe: oczekiwano instanceof ${issue.expected}, otrzymano ${received}`;
				return `Nieprawidłowe dane wejściowe: oczekiwano ${expected}, otrzymano ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Nieprawidłowe dane wejściowe: oczekiwano ${stringifyPrimitive(issue.values[0])}`;
				return `Nieprawidłowa opcja: oczekiwano jednej z wartości ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Za duża wartość: oczekiwano, że ${issue.origin ?? "wartość"} będzie mieć ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementów"}`;
				return `Zbyt duż(y/a/e): oczekiwano, że ${issue.origin ?? "wartość"} będzie wynosić ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Za mała wartość: oczekiwano, że ${issue.origin ?? "wartość"} będzie mieć ${adj}${issue.minimum.toString()} ${sizing.unit ?? "elementów"}`;
				return `Zbyt mał(y/a/e): oczekiwano, że ${issue.origin ?? "wartość"} będzie wynosić ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Nieprawidłowy ciąg znaków: musi zaczynać się od "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Nieprawidłowy ciąg znaków: musi kończyć się na "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Nieprawidłowy ciąg znaków: musi zawierać "${_issue.includes}"`;
				if (_issue.format === "regex") return `Nieprawidłowy ciąg znaków: musi odpowiadać wzorcowi ${_issue.pattern}`;
				return `Nieprawidłow(y/a/e) ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Nieprawidłowa liczba: musi być wielokrotnością ${issue.divisor}`;
			case "unrecognized_keys": return `Nierozpoznane klucze${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Nieprawidłowy klucz w ${issue.origin}`;
			case "invalid_union": return "Nieprawidłowe dane wejściowe";
			case "invalid_element": return `Nieprawidłowa wartość w ${issue.origin}`;
			default: return `Nieprawidłowe dane wejściowe`;
		}
	};
};
function pl_default() {
	return { localeError: error$14() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/pt.js
const error$13 = () => {
	const Sizable = {
		string: {
			unit: "caracteres",
			verb: "ter"
		},
		file: {
			unit: "bytes",
			verb: "ter"
		},
		array: {
			unit: "itens",
			verb: "ter"
		},
		set: {
			unit: "itens",
			verb: "ter"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "padrão",
		email: "endereço de e-mail",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "data e hora ISO",
		date: "data ISO",
		time: "hora ISO",
		duration: "duração ISO",
		ipv4: "endereço IPv4",
		ipv6: "endereço IPv6",
		cidrv4: "faixa de IPv4",
		cidrv6: "faixa de IPv6",
		base64: "texto codificado em base64",
		base64url: "URL codificada em base64",
		json_string: "texto JSON",
		e164: "número E.164",
		jwt: "JWT",
		template_literal: "entrada"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "número",
		null: "nulo"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Tipo inválido: esperado instanceof ${issue.expected}, recebido ${received}`;
				return `Tipo inválido: esperado ${expected}, recebido ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Entrada inválida: esperado ${stringifyPrimitive(issue.values[0])}`;
				return `Opção inválida: esperada uma das ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Muito grande: esperado que ${issue.origin ?? "valor"} tivesse ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementos"}`;
				return `Muito grande: esperado que ${issue.origin ?? "valor"} fosse ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Muito pequeno: esperado que ${issue.origin} tivesse ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Muito pequeno: esperado que ${issue.origin} fosse ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Texto inválido: deve começar com "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Texto inválido: deve terminar com "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Texto inválido: deve incluir "${_issue.includes}"`;
				if (_issue.format === "regex") return `Texto inválido: deve corresponder ao padrão ${_issue.pattern}`;
				return `${FormatDictionary[_issue.format] ?? issue.format} inválido`;
			}
			case "not_multiple_of": return `Número inválido: deve ser múltiplo de ${issue.divisor}`;
			case "unrecognized_keys": return `Chave${issue.keys.length > 1 ? "s" : ""} desconhecida${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Chave inválida em ${issue.origin}`;
			case "invalid_union": return "Entrada inválida";
			case "invalid_element": return `Valor inválido em ${issue.origin}`;
			default: return `Campo inválido`;
		}
	};
};
function pt_default() {
	return { localeError: error$13() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ru.js
function getRussianPlural(count, one, few, many) {
	const absCount = Math.abs(count);
	const lastDigit = absCount % 10;
	const lastTwoDigits = absCount % 100;
	if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return many;
	if (lastDigit === 1) return one;
	if (lastDigit >= 2 && lastDigit <= 4) return few;
	return many;
}
const error$12 = () => {
	const Sizable = {
		string: {
			unit: {
				one: "символ",
				few: "символа",
				many: "символов"
			},
			verb: "иметь"
		},
		file: {
			unit: {
				one: "байт",
				few: "байта",
				many: "байт"
			},
			verb: "иметь"
		},
		array: {
			unit: {
				one: "элемент",
				few: "элемента",
				many: "элементов"
			},
			verb: "иметь"
		},
		set: {
			unit: {
				one: "элемент",
				few: "элемента",
				many: "элементов"
			},
			verb: "иметь"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "ввод",
		email: "email адрес",
		url: "URL",
		emoji: "эмодзи",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO дата и время",
		date: "ISO дата",
		time: "ISO время",
		duration: "ISO длительность",
		ipv4: "IPv4 адрес",
		ipv6: "IPv6 адрес",
		cidrv4: "IPv4 диапазон",
		cidrv6: "IPv6 диапазон",
		base64: "строка в формате base64",
		base64url: "строка в формате base64url",
		json_string: "JSON строка",
		e164: "номер E.164",
		jwt: "JWT",
		template_literal: "ввод"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "число",
		array: "массив"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Неверный ввод: ожидалось instanceof ${issue.expected}, получено ${received}`;
				return `Неверный ввод: ожидалось ${expected}, получено ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Неверный ввод: ожидалось ${stringifyPrimitive(issue.values[0])}`;
				return `Неверный вариант: ожидалось одно из ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) {
					const unit = getRussianPlural(Number(issue.maximum), sizing.unit.one, sizing.unit.few, sizing.unit.many);
					return `Слишком большое значение: ожидалось, что ${issue.origin ?? "значение"} будет иметь ${adj}${issue.maximum.toString()} ${unit}`;
				}
				return `Слишком большое значение: ожидалось, что ${issue.origin ?? "значение"} будет ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) {
					const unit = getRussianPlural(Number(issue.minimum), sizing.unit.one, sizing.unit.few, sizing.unit.many);
					return `Слишком маленькое значение: ожидалось, что ${issue.origin} будет иметь ${adj}${issue.minimum.toString()} ${unit}`;
				}
				return `Слишком маленькое значение: ожидалось, что ${issue.origin} будет ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Неверная строка: должна начинаться с "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Неверная строка: должна заканчиваться на "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Неверная строка: должна содержать "${_issue.includes}"`;
				if (_issue.format === "regex") return `Неверная строка: должна соответствовать шаблону ${_issue.pattern}`;
				return `Неверный ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Неверное число: должно быть кратным ${issue.divisor}`;
			case "unrecognized_keys": return `Нераспознанн${issue.keys.length > 1 ? "ые" : "ый"} ключ${issue.keys.length > 1 ? "и" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Неверный ключ в ${issue.origin}`;
			case "invalid_union": return "Неверные входные данные";
			case "invalid_element": return `Неверное значение в ${issue.origin}`;
			default: return `Неверные входные данные`;
		}
	};
};
function ru_default() {
	return { localeError: error$12() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/sl.js
const error$11 = () => {
	const Sizable = {
		string: {
			unit: "znakov",
			verb: "imeti"
		},
		file: {
			unit: "bajtov",
			verb: "imeti"
		},
		array: {
			unit: "elementov",
			verb: "imeti"
		},
		set: {
			unit: "elementov",
			verb: "imeti"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "vnos",
		email: "e-poštni naslov",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datum in čas",
		date: "ISO datum",
		time: "ISO čas",
		duration: "ISO trajanje",
		ipv4: "IPv4 naslov",
		ipv6: "IPv6 naslov",
		cidrv4: "obseg IPv4",
		cidrv6: "obseg IPv6",
		base64: "base64 kodiran niz",
		base64url: "base64url kodiran niz",
		json_string: "JSON niz",
		e164: "E.164 številka",
		jwt: "JWT",
		template_literal: "vnos"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "število",
		array: "tabela"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Neveljaven vnos: pričakovano instanceof ${issue.expected}, prejeto ${received}`;
				return `Neveljaven vnos: pričakovano ${expected}, prejeto ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Neveljaven vnos: pričakovano ${stringifyPrimitive(issue.values[0])}`;
				return `Neveljavna možnost: pričakovano eno izmed ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Preveliko: pričakovano, da bo ${issue.origin ?? "vrednost"} imelo ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elementov"}`;
				return `Preveliko: pričakovano, da bo ${issue.origin ?? "vrednost"} ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Premajhno: pričakovano, da bo ${issue.origin} imelo ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Premajhno: pričakovano, da bo ${issue.origin} ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Neveljaven niz: mora se začeti z "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Neveljaven niz: mora se končati z "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Neveljaven niz: mora vsebovati "${_issue.includes}"`;
				if (_issue.format === "regex") return `Neveljaven niz: mora ustrezati vzorcu ${_issue.pattern}`;
				return `Neveljaven ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Neveljavno število: mora biti večkratnik ${issue.divisor}`;
			case "unrecognized_keys": return `Neprepoznan${issue.keys.length > 1 ? "i ključi" : " ključ"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Neveljaven ključ v ${issue.origin}`;
			case "invalid_union": return "Neveljaven vnos";
			case "invalid_element": return `Neveljavna vrednost v ${issue.origin}`;
			default: return "Neveljaven vnos";
		}
	};
};
function sl_default() {
	return { localeError: error$11() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/sv.js
const error$10 = () => {
	const Sizable = {
		string: {
			unit: "tecken",
			verb: "att ha"
		},
		file: {
			unit: "bytes",
			verb: "att ha"
		},
		array: {
			unit: "objekt",
			verb: "att innehålla"
		},
		set: {
			unit: "objekt",
			verb: "att innehålla"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "reguljärt uttryck",
		email: "e-postadress",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO-datum och tid",
		date: "ISO-datum",
		time: "ISO-tid",
		duration: "ISO-varaktighet",
		ipv4: "IPv4-intervall",
		ipv6: "IPv6-intervall",
		cidrv4: "IPv4-spektrum",
		cidrv6: "IPv6-spektrum",
		base64: "base64-kodad sträng",
		base64url: "base64url-kodad sträng",
		json_string: "JSON-sträng",
		e164: "E.164-nummer",
		jwt: "JWT",
		template_literal: "mall-literal"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "antal",
		array: "lista"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Ogiltig inmatning: förväntat instanceof ${issue.expected}, fick ${received}`;
				return `Ogiltig inmatning: förväntat ${expected}, fick ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Ogiltig inmatning: förväntat ${stringifyPrimitive(issue.values[0])}`;
				return `Ogiltigt val: förväntade en av ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `För stor(t): förväntade ${issue.origin ?? "värdet"} att ha ${adj}${issue.maximum.toString()} ${sizing.unit ?? "element"}`;
				return `För stor(t): förväntat ${issue.origin ?? "värdet"} att ha ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `För lite(t): förväntade ${issue.origin ?? "värdet"} att ha ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `För lite(t): förväntade ${issue.origin ?? "värdet"} att ha ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Ogiltig sträng: måste börja med "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Ogiltig sträng: måste sluta med "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Ogiltig sträng: måste innehålla "${_issue.includes}"`;
				if (_issue.format === "regex") return `Ogiltig sträng: måste matcha mönstret "${_issue.pattern}"`;
				return `Ogiltig(t) ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Ogiltigt tal: måste vara en multipel av ${issue.divisor}`;
			case "unrecognized_keys": return `${issue.keys.length > 1 ? "Okända nycklar" : "Okänd nyckel"}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Ogiltig nyckel i ${issue.origin ?? "värdet"}`;
			case "invalid_union": return "Ogiltig input";
			case "invalid_element": return `Ogiltigt värde i ${issue.origin ?? "värdet"}`;
			default: return `Ogiltig input`;
		}
	};
};
function sv_default() {
	return { localeError: error$10() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ta.js
const error$9 = () => {
	const Sizable = {
		string: {
			unit: "எழுத்துக்கள்",
			verb: "கொண்டிருக்க வேண்டும்"
		},
		file: {
			unit: "பைட்டுகள்",
			verb: "கொண்டிருக்க வேண்டும்"
		},
		array: {
			unit: "உறுப்புகள்",
			verb: "கொண்டிருக்க வேண்டும்"
		},
		set: {
			unit: "உறுப்புகள்",
			verb: "கொண்டிருக்க வேண்டும்"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "உள்ளீடு",
		email: "மின்னஞ்சல் முகவரி",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO தேதி நேரம்",
		date: "ISO தேதி",
		time: "ISO நேரம்",
		duration: "ISO கால அளவு",
		ipv4: "IPv4 முகவரி",
		ipv6: "IPv6 முகவரி",
		cidrv4: "IPv4 வரம்பு",
		cidrv6: "IPv6 வரம்பு",
		base64: "base64-encoded சரம்",
		base64url: "base64url-encoded சரம்",
		json_string: "JSON சரம்",
		e164: "E.164 எண்",
		jwt: "JWT",
		template_literal: "input"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "எண்",
		array: "அணி",
		null: "வெறுமை"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `தவறான உள்ளீடு: எதிர்பார்க்கப்பட்டது instanceof ${issue.expected}, பெறப்பட்டது ${received}`;
				return `தவறான உள்ளீடு: எதிர்பார்க்கப்பட்டது ${expected}, பெறப்பட்டது ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `தவறான உள்ளீடு: எதிர்பார்க்கப்பட்டது ${stringifyPrimitive(issue.values[0])}`;
				return `தவறான விருப்பம்: எதிர்பார்க்கப்பட்டது ${joinValues(issue.values, "|")} இல் ஒன்று`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `மிக பெரியது: எதிர்பார்க்கப்பட்டது ${issue.origin ?? "மதிப்பு"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "உறுப்புகள்"} ஆக இருக்க வேண்டும்`;
				return `மிக பெரியது: எதிர்பார்க்கப்பட்டது ${issue.origin ?? "மதிப்பு"} ${adj}${issue.maximum.toString()} ஆக இருக்க வேண்டும்`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `மிகச் சிறியது: எதிர்பார்க்கப்பட்டது ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} ஆக இருக்க வேண்டும்`;
				return `மிகச் சிறியது: எதிர்பார்க்கப்பட்டது ${issue.origin} ${adj}${issue.minimum.toString()} ஆக இருக்க வேண்டும்`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `தவறான சரம்: "${_issue.prefix}" இல் தொடங்க வேண்டும்`;
				if (_issue.format === "ends_with") return `தவறான சரம்: "${_issue.suffix}" இல் முடிவடைய வேண்டும்`;
				if (_issue.format === "includes") return `தவறான சரம்: "${_issue.includes}" ஐ உள்ளடக்க வேண்டும்`;
				if (_issue.format === "regex") return `தவறான சரம்: ${_issue.pattern} முறைபாட்டுடன் பொருந்த வேண்டும்`;
				return `தவறான ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `தவறான எண்: ${issue.divisor} இன் பலமாக இருக்க வேண்டும்`;
			case "unrecognized_keys": return `அடையாளம் தெரியாத விசை${issue.keys.length > 1 ? "கள்" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `${issue.origin} இல் தவறான விசை`;
			case "invalid_union": return "தவறான உள்ளீடு";
			case "invalid_element": return `${issue.origin} இல் தவறான மதிப்பு`;
			default: return `தவறான உள்ளீடு`;
		}
	};
};
function ta_default() {
	return { localeError: error$9() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/th.js
const error$8 = () => {
	const Sizable = {
		string: {
			unit: "ตัวอักษร",
			verb: "ควรมี"
		},
		file: {
			unit: "ไบต์",
			verb: "ควรมี"
		},
		array: {
			unit: "รายการ",
			verb: "ควรมี"
		},
		set: {
			unit: "รายการ",
			verb: "ควรมี"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "ข้อมูลที่ป้อน",
		email: "ที่อยู่อีเมล",
		url: "URL",
		emoji: "อิโมจิ",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "วันที่เวลาแบบ ISO",
		date: "วันที่แบบ ISO",
		time: "เวลาแบบ ISO",
		duration: "ช่วงเวลาแบบ ISO",
		ipv4: "ที่อยู่ IPv4",
		ipv6: "ที่อยู่ IPv6",
		cidrv4: "ช่วง IP แบบ IPv4",
		cidrv6: "ช่วง IP แบบ IPv6",
		base64: "ข้อความแบบ Base64",
		base64url: "ข้อความแบบ Base64 สำหรับ URL",
		json_string: "ข้อความแบบ JSON",
		e164: "เบอร์โทรศัพท์ระหว่างประเทศ (E.164)",
		jwt: "โทเคน JWT",
		template_literal: "ข้อมูลที่ป้อน"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "ตัวเลข",
		array: "อาร์เรย์ (Array)",
		null: "ไม่มีค่า (null)"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น instanceof ${issue.expected} แต่ได้รับ ${received}`;
				return `ประเภทข้อมูลไม่ถูกต้อง: ควรเป็น ${expected} แต่ได้รับ ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `ค่าไม่ถูกต้อง: ควรเป็น ${stringifyPrimitive(issue.values[0])}`;
				return `ตัวเลือกไม่ถูกต้อง: ควรเป็นหนึ่งใน ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "ไม่เกิน" : "น้อยกว่า";
				const sizing = getSizing(issue.origin);
				if (sizing) return `เกินกำหนด: ${issue.origin ?? "ค่า"} ควรมี${adj} ${issue.maximum.toString()} ${sizing.unit ?? "รายการ"}`;
				return `เกินกำหนด: ${issue.origin ?? "ค่า"} ควรมี${adj} ${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? "อย่างน้อย" : "มากกว่า";
				const sizing = getSizing(issue.origin);
				if (sizing) return `น้อยกว่ากำหนด: ${issue.origin} ควรมี${adj} ${issue.minimum.toString()} ${sizing.unit}`;
				return `น้อยกว่ากำหนด: ${issue.origin} ควรมี${adj} ${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `รูปแบบไม่ถูกต้อง: ข้อความต้องขึ้นต้นด้วย "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `รูปแบบไม่ถูกต้อง: ข้อความต้องลงท้ายด้วย "${_issue.suffix}"`;
				if (_issue.format === "includes") return `รูปแบบไม่ถูกต้อง: ข้อความต้องมี "${_issue.includes}" อยู่ในข้อความ`;
				if (_issue.format === "regex") return `รูปแบบไม่ถูกต้อง: ต้องตรงกับรูปแบบที่กำหนด ${_issue.pattern}`;
				return `รูปแบบไม่ถูกต้อง: ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `ตัวเลขไม่ถูกต้อง: ต้องเป็นจำนวนที่หารด้วย ${issue.divisor} ได้ลงตัว`;
			case "unrecognized_keys": return `พบคีย์ที่ไม่รู้จัก: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `คีย์ไม่ถูกต้องใน ${issue.origin}`;
			case "invalid_union": return "ข้อมูลไม่ถูกต้อง: ไม่ตรงกับรูปแบบยูเนียนที่กำหนดไว้";
			case "invalid_element": return `ข้อมูลไม่ถูกต้องใน ${issue.origin}`;
			default: return `ข้อมูลไม่ถูกต้อง`;
		}
	};
};
function th_default() {
	return { localeError: error$8() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/tr.js
const error$7 = () => {
	const Sizable = {
		string: {
			unit: "karakter",
			verb: "olmalı"
		},
		file: {
			unit: "bayt",
			verb: "olmalı"
		},
		array: {
			unit: "öğe",
			verb: "olmalı"
		},
		set: {
			unit: "öğe",
			verb: "olmalı"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "girdi",
		email: "e-posta adresi",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO tarih ve saat",
		date: "ISO tarih",
		time: "ISO saat",
		duration: "ISO süre",
		ipv4: "IPv4 adresi",
		ipv6: "IPv6 adresi",
		cidrv4: "IPv4 aralığı",
		cidrv6: "IPv6 aralığı",
		base64: "base64 ile şifrelenmiş metin",
		base64url: "base64url ile şifrelenmiş metin",
		json_string: "JSON dizesi",
		e164: "E.164 sayısı",
		jwt: "JWT",
		template_literal: "Şablon dizesi"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Geçersiz değer: beklenen instanceof ${issue.expected}, alınan ${received}`;
				return `Geçersiz değer: beklenen ${expected}, alınan ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Geçersiz değer: beklenen ${stringifyPrimitive(issue.values[0])}`;
				return `Geçersiz seçenek: aşağıdakilerden biri olmalı: ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Çok büyük: beklenen ${issue.origin ?? "değer"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "öğe"}`;
				return `Çok büyük: beklenen ${issue.origin ?? "değer"} ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Çok küçük: beklenen ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Çok küçük: beklenen ${issue.origin} ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Geçersiz metin: "${_issue.prefix}" ile başlamalı`;
				if (_issue.format === "ends_with") return `Geçersiz metin: "${_issue.suffix}" ile bitmeli`;
				if (_issue.format === "includes") return `Geçersiz metin: "${_issue.includes}" içermeli`;
				if (_issue.format === "regex") return `Geçersiz metin: ${_issue.pattern} desenine uymalı`;
				return `Geçersiz ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Geçersiz sayı: ${issue.divisor} ile tam bölünebilmeli`;
			case "unrecognized_keys": return `Tanınmayan anahtar${issue.keys.length > 1 ? "lar" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `${issue.origin} içinde geçersiz anahtar`;
			case "invalid_union": return "Geçersiz değer";
			case "invalid_element": return `${issue.origin} içinde geçersiz değer`;
			default: return `Geçersiz değer`;
		}
	};
};
function tr_default() {
	return { localeError: error$7() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/uk.js
const error$6 = () => {
	const Sizable = {
		string: {
			unit: "символів",
			verb: "матиме"
		},
		file: {
			unit: "байтів",
			verb: "матиме"
		},
		array: {
			unit: "елементів",
			verb: "матиме"
		},
		set: {
			unit: "елементів",
			verb: "матиме"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "вхідні дані",
		email: "адреса електронної пошти",
		url: "URL",
		emoji: "емодзі",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "дата та час ISO",
		date: "дата ISO",
		time: "час ISO",
		duration: "тривалість ISO",
		ipv4: "адреса IPv4",
		ipv6: "адреса IPv6",
		cidrv4: "діапазон IPv4",
		cidrv6: "діапазон IPv6",
		base64: "рядок у кодуванні base64",
		base64url: "рядок у кодуванні base64url",
		json_string: "рядок JSON",
		e164: "номер E.164",
		jwt: "JWT",
		template_literal: "вхідні дані"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "число",
		array: "масив"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Неправильні вхідні дані: очікується instanceof ${issue.expected}, отримано ${received}`;
				return `Неправильні вхідні дані: очікується ${expected}, отримано ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Неправильні вхідні дані: очікується ${stringifyPrimitive(issue.values[0])}`;
				return `Неправильна опція: очікується одне з ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Занадто велике: очікується, що ${issue.origin ?? "значення"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "елементів"}`;
				return `Занадто велике: очікується, що ${issue.origin ?? "значення"} буде ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Занадто мале: очікується, що ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Занадто мале: очікується, що ${issue.origin} буде ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Неправильний рядок: повинен починатися з "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Неправильний рядок: повинен закінчуватися на "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Неправильний рядок: повинен містити "${_issue.includes}"`;
				if (_issue.format === "regex") return `Неправильний рядок: повинен відповідати шаблону ${_issue.pattern}`;
				return `Неправильний ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Неправильне число: повинно бути кратним ${issue.divisor}`;
			case "unrecognized_keys": return `Нерозпізнаний ключ${issue.keys.length > 1 ? "і" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Неправильний ключ у ${issue.origin}`;
			case "invalid_union": return "Неправильні вхідні дані";
			case "invalid_element": return `Неправильне значення у ${issue.origin}`;
			default: return `Неправильні вхідні дані`;
		}
	};
};
function uk_default() {
	return { localeError: error$6() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ua.js
/** @deprecated Use `uk` instead. */
function ua_default() {
	return uk_default();
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/ur.js
const error$5 = () => {
	const Sizable = {
		string: {
			unit: "حروف",
			verb: "ہونا"
		},
		file: {
			unit: "بائٹس",
			verb: "ہونا"
		},
		array: {
			unit: "آئٹمز",
			verb: "ہونا"
		},
		set: {
			unit: "آئٹمز",
			verb: "ہونا"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "ان پٹ",
		email: "ای میل ایڈریس",
		url: "یو آر ایل",
		emoji: "ایموجی",
		uuid: "یو یو آئی ڈی",
		uuidv4: "یو یو آئی ڈی وی 4",
		uuidv6: "یو یو آئی ڈی وی 6",
		nanoid: "نینو آئی ڈی",
		guid: "جی یو آئی ڈی",
		cuid: "سی یو آئی ڈی",
		cuid2: "سی یو آئی ڈی 2",
		ulid: "یو ایل آئی ڈی",
		xid: "ایکس آئی ڈی",
		ksuid: "کے ایس یو آئی ڈی",
		datetime: "آئی ایس او ڈیٹ ٹائم",
		date: "آئی ایس او تاریخ",
		time: "آئی ایس او وقت",
		duration: "آئی ایس او مدت",
		ipv4: "آئی پی وی 4 ایڈریس",
		ipv6: "آئی پی وی 6 ایڈریس",
		cidrv4: "آئی پی وی 4 رینج",
		cidrv6: "آئی پی وی 6 رینج",
		base64: "بیس 64 ان کوڈڈ سٹرنگ",
		base64url: "بیس 64 یو آر ایل ان کوڈڈ سٹرنگ",
		json_string: "جے ایس او این سٹرنگ",
		e164: "ای 164 نمبر",
		jwt: "جے ڈبلیو ٹی",
		template_literal: "ان پٹ"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "نمبر",
		array: "آرے",
		null: "نل"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `غلط ان پٹ: instanceof ${issue.expected} متوقع تھا، ${received} موصول ہوا`;
				return `غلط ان پٹ: ${expected} متوقع تھا، ${received} موصول ہوا`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `غلط ان پٹ: ${stringifyPrimitive(issue.values[0])} متوقع تھا`;
				return `غلط آپشن: ${joinValues(issue.values, "|")} میں سے ایک متوقع تھا`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `بہت بڑا: ${issue.origin ?? "ویلیو"} کے ${adj}${issue.maximum.toString()} ${sizing.unit ?? "عناصر"} ہونے متوقع تھے`;
				return `بہت بڑا: ${issue.origin ?? "ویلیو"} کا ${adj}${issue.maximum.toString()} ہونا متوقع تھا`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `بہت چھوٹا: ${issue.origin} کے ${adj}${issue.minimum.toString()} ${sizing.unit} ہونے متوقع تھے`;
				return `بہت چھوٹا: ${issue.origin} کا ${adj}${issue.minimum.toString()} ہونا متوقع تھا`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `غلط سٹرنگ: "${_issue.prefix}" سے شروع ہونا چاہیے`;
				if (_issue.format === "ends_with") return `غلط سٹرنگ: "${_issue.suffix}" پر ختم ہونا چاہیے`;
				if (_issue.format === "includes") return `غلط سٹرنگ: "${_issue.includes}" شامل ہونا چاہیے`;
				if (_issue.format === "regex") return `غلط سٹرنگ: پیٹرن ${_issue.pattern} سے میچ ہونا چاہیے`;
				return `غلط ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `غلط نمبر: ${issue.divisor} کا مضاعف ہونا چاہیے`;
			case "unrecognized_keys": return `غیر تسلیم شدہ کی${issue.keys.length > 1 ? "ز" : ""}: ${joinValues(issue.keys, "، ")}`;
			case "invalid_key": return `${issue.origin} میں غلط کی`;
			case "invalid_union": return "غلط ان پٹ";
			case "invalid_element": return `${issue.origin} میں غلط ویلیو`;
			default: return `غلط ان پٹ`;
		}
	};
};
function ur_default() {
	return { localeError: error$5() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/uz.js
const error$4 = () => {
	const Sizable = {
		string: {
			unit: "belgi",
			verb: "bo‘lishi kerak"
		},
		file: {
			unit: "bayt",
			verb: "bo‘lishi kerak"
		},
		array: {
			unit: "element",
			verb: "bo‘lishi kerak"
		},
		set: {
			unit: "element",
			verb: "bo‘lishi kerak"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "kirish",
		email: "elektron pochta manzili",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO sana va vaqti",
		date: "ISO sana",
		time: "ISO vaqt",
		duration: "ISO davomiylik",
		ipv4: "IPv4 manzil",
		ipv6: "IPv6 manzil",
		mac: "MAC manzil",
		cidrv4: "IPv4 diapazon",
		cidrv6: "IPv6 diapazon",
		base64: "base64 kodlangan satr",
		base64url: "base64url kodlangan satr",
		json_string: "JSON satr",
		e164: "E.164 raqam",
		jwt: "JWT",
		template_literal: "kirish"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "raqam",
		array: "massiv"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Noto‘g‘ri kirish: kutilgan instanceof ${issue.expected}, qabul qilingan ${received}`;
				return `Noto‘g‘ri kirish: kutilgan ${expected}, qabul qilingan ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Noto‘g‘ri kirish: kutilgan ${stringifyPrimitive(issue.values[0])}`;
				return `Noto‘g‘ri variant: quyidagilardan biri kutilgan ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Juda katta: kutilgan ${issue.origin ?? "qiymat"} ${adj}${issue.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
				return `Juda katta: kutilgan ${issue.origin ?? "qiymat"} ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Juda kichik: kutilgan ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
				return `Juda kichik: kutilgan ${issue.origin} ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Noto‘g‘ri satr: "${_issue.prefix}" bilan boshlanishi kerak`;
				if (_issue.format === "ends_with") return `Noto‘g‘ri satr: "${_issue.suffix}" bilan tugashi kerak`;
				if (_issue.format === "includes") return `Noto‘g‘ri satr: "${_issue.includes}" ni o‘z ichiga olishi kerak`;
				if (_issue.format === "regex") return `Noto‘g‘ri satr: ${_issue.pattern} shabloniga mos kelishi kerak`;
				return `Noto‘g‘ri ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Noto‘g‘ri raqam: ${issue.divisor} ning karralisi bo‘lishi kerak`;
			case "unrecognized_keys": return `Noma’lum kalit${issue.keys.length > 1 ? "lar" : ""}: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `${issue.origin} dagi kalit noto‘g‘ri`;
			case "invalid_union": return "Noto‘g‘ri kirish";
			case "invalid_element": return `${issue.origin} da noto‘g‘ri qiymat`;
			default: return `Noto‘g‘ri kirish`;
		}
	};
};
function uz_default() {
	return { localeError: error$4() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/vi.js
const error$3 = () => {
	const Sizable = {
		string: {
			unit: "ký tự",
			verb: "có"
		},
		file: {
			unit: "byte",
			verb: "có"
		},
		array: {
			unit: "phần tử",
			verb: "có"
		},
		set: {
			unit: "phần tử",
			verb: "có"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "đầu vào",
		email: "địa chỉ email",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ngày giờ ISO",
		date: "ngày ISO",
		time: "giờ ISO",
		duration: "khoảng thời gian ISO",
		ipv4: "địa chỉ IPv4",
		ipv6: "địa chỉ IPv6",
		cidrv4: "dải IPv4",
		cidrv6: "dải IPv6",
		base64: "chuỗi mã hóa base64",
		base64url: "chuỗi mã hóa base64url",
		json_string: "chuỗi JSON",
		e164: "số E.164",
		jwt: "JWT",
		template_literal: "đầu vào"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "số",
		array: "mảng"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Đầu vào không hợp lệ: mong đợi instanceof ${issue.expected}, nhận được ${received}`;
				return `Đầu vào không hợp lệ: mong đợi ${expected}, nhận được ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Đầu vào không hợp lệ: mong đợi ${stringifyPrimitive(issue.values[0])}`;
				return `Tùy chọn không hợp lệ: mong đợi một trong các giá trị ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Quá lớn: mong đợi ${issue.origin ?? "giá trị"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "phần tử"}`;
				return `Quá lớn: mong đợi ${issue.origin ?? "giá trị"} ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Quá nhỏ: mong đợi ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `Quá nhỏ: mong đợi ${issue.origin} ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Chuỗi không hợp lệ: phải bắt đầu bằng "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Chuỗi không hợp lệ: phải kết thúc bằng "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Chuỗi không hợp lệ: phải bao gồm "${_issue.includes}"`;
				if (_issue.format === "regex") return `Chuỗi không hợp lệ: phải khớp với mẫu ${_issue.pattern}`;
				return `${FormatDictionary[_issue.format] ?? issue.format} không hợp lệ`;
			}
			case "not_multiple_of": return `Số không hợp lệ: phải là bội số của ${issue.divisor}`;
			case "unrecognized_keys": return `Khóa không được nhận dạng: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Khóa không hợp lệ trong ${issue.origin}`;
			case "invalid_union": return "Đầu vào không hợp lệ";
			case "invalid_element": return `Giá trị không hợp lệ trong ${issue.origin}`;
			default: return `Đầu vào không hợp lệ`;
		}
	};
};
function vi_default() {
	return { localeError: error$3() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/zh-CN.js
const error$2 = () => {
	const Sizable = {
		string: {
			unit: "字符",
			verb: "包含"
		},
		file: {
			unit: "字节",
			verb: "包含"
		},
		array: {
			unit: "项",
			verb: "包含"
		},
		set: {
			unit: "项",
			verb: "包含"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "输入",
		email: "电子邮件",
		url: "URL",
		emoji: "表情符号",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO日期时间",
		date: "ISO日期",
		time: "ISO时间",
		duration: "ISO时长",
		ipv4: "IPv4地址",
		ipv6: "IPv6地址",
		cidrv4: "IPv4网段",
		cidrv6: "IPv6网段",
		base64: "base64编码字符串",
		base64url: "base64url编码字符串",
		json_string: "JSON字符串",
		e164: "E.164号码",
		jwt: "JWT",
		template_literal: "输入"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "数字",
		array: "数组",
		null: "空值(null)"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `无效输入：期望 instanceof ${issue.expected}，实际接收 ${received}`;
				return `无效输入：期望 ${expected}，实际接收 ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `无效输入：期望 ${stringifyPrimitive(issue.values[0])}`;
				return `无效选项：期望以下之一 ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `数值过大：期望 ${issue.origin ?? "值"} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "个元素"}`;
				return `数值过大：期望 ${issue.origin ?? "值"} ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `数值过小：期望 ${issue.origin} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `数值过小：期望 ${issue.origin} ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `无效字符串：必须以 "${_issue.prefix}" 开头`;
				if (_issue.format === "ends_with") return `无效字符串：必须以 "${_issue.suffix}" 结尾`;
				if (_issue.format === "includes") return `无效字符串：必须包含 "${_issue.includes}"`;
				if (_issue.format === "regex") return `无效字符串：必须满足正则表达式 ${_issue.pattern}`;
				return `无效${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `无效数字：必须是 ${issue.divisor} 的倍数`;
			case "unrecognized_keys": return `出现未知的键(key): ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `${issue.origin} 中的键(key)无效`;
			case "invalid_union": return "无效输入";
			case "invalid_element": return `${issue.origin} 中包含无效值(value)`;
			default: return `无效输入`;
		}
	};
};
function zh_CN_default() {
	return { localeError: error$2() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/zh-TW.js
const error$1 = () => {
	const Sizable = {
		string: {
			unit: "字元",
			verb: "擁有"
		},
		file: {
			unit: "位元組",
			verb: "擁有"
		},
		array: {
			unit: "項目",
			verb: "擁有"
		},
		set: {
			unit: "項目",
			verb: "擁有"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "輸入",
		email: "郵件地址",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO 日期時間",
		date: "ISO 日期",
		time: "ISO 時間",
		duration: "ISO 期間",
		ipv4: "IPv4 位址",
		ipv6: "IPv6 位址",
		cidrv4: "IPv4 範圍",
		cidrv6: "IPv6 範圍",
		base64: "base64 編碼字串",
		base64url: "base64url 編碼字串",
		json_string: "JSON 字串",
		e164: "E.164 數值",
		jwt: "JWT",
		template_literal: "輸入"
	};
	const TypeDictionary = { nan: "NaN" };
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `無效的輸入值：預期為 instanceof ${issue.expected}，但收到 ${received}`;
				return `無效的輸入值：預期為 ${expected}，但收到 ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `無效的輸入值：預期為 ${stringifyPrimitive(issue.values[0])}`;
				return `無效的選項：預期為以下其中之一 ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `數值過大：預期 ${issue.origin ?? "值"} 應為 ${adj}${issue.maximum.toString()} ${sizing.unit ?? "個元素"}`;
				return `數值過大：預期 ${issue.origin ?? "值"} 應為 ${adj}${issue.maximum.toString()}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `數值過小：預期 ${issue.origin} 應為 ${adj}${issue.minimum.toString()} ${sizing.unit}`;
				return `數值過小：預期 ${issue.origin} 應為 ${adj}${issue.minimum.toString()}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `無效的字串：必須以 "${_issue.prefix}" 開頭`;
				if (_issue.format === "ends_with") return `無效的字串：必須以 "${_issue.suffix}" 結尾`;
				if (_issue.format === "includes") return `無效的字串：必須包含 "${_issue.includes}"`;
				if (_issue.format === "regex") return `無效的字串：必須符合格式 ${_issue.pattern}`;
				return `無效的 ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `無效的數字：必須為 ${issue.divisor} 的倍數`;
			case "unrecognized_keys": return `無法識別的鍵值${issue.keys.length > 1 ? "們" : ""}：${joinValues(issue.keys, "、")}`;
			case "invalid_key": return `${issue.origin} 中有無效的鍵值`;
			case "invalid_union": return "無效的輸入值";
			case "invalid_element": return `${issue.origin} 中有無效的值`;
			default: return `無效的輸入值`;
		}
	};
};
function zh_TW_default() {
	return { localeError: error$1() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/yo.js
const error = () => {
	const Sizable = {
		string: {
			unit: "àmi",
			verb: "ní"
		},
		file: {
			unit: "bytes",
			verb: "ní"
		},
		array: {
			unit: "nkan",
			verb: "ní"
		},
		set: {
			unit: "nkan",
			verb: "ní"
		}
	};
	function getSizing(origin) {
		return Sizable[origin] ?? null;
	}
	const FormatDictionary = {
		regex: "ẹ̀rọ ìbáwọlé",
		email: "àdírẹ́sì ìmẹ́lì",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "àkókò ISO",
		date: "ọjọ́ ISO",
		time: "àkókò ISO",
		duration: "àkókò tó pé ISO",
		ipv4: "àdírẹ́sì IPv4",
		ipv6: "àdírẹ́sì IPv6",
		cidrv4: "àgbègbè IPv4",
		cidrv6: "àgbègbè IPv6",
		base64: "ọ̀rọ̀ tí a kọ́ ní base64",
		base64url: "ọ̀rọ̀ base64url",
		json_string: "ọ̀rọ̀ JSON",
		e164: "nọ́mbà E.164",
		jwt: "JWT",
		template_literal: "ẹ̀rọ ìbáwọlé"
	};
	const TypeDictionary = {
		nan: "NaN",
		number: "nọ́mbà",
		array: "akopọ"
	};
	return (issue) => {
		switch (issue.code) {
			case "invalid_type": {
				const expected = TypeDictionary[issue.expected] ?? issue.expected;
				const receivedType = parsedType(issue.input);
				const received = TypeDictionary[receivedType] ?? receivedType;
				if (/^[A-Z]/.test(issue.expected)) return `Ìbáwọlé aṣìṣe: a ní láti fi instanceof ${issue.expected}, àmọ̀ a rí ${received}`;
				return `Ìbáwọlé aṣìṣe: a ní láti fi ${expected}, àmọ̀ a rí ${received}`;
			}
			case "invalid_value":
				if (issue.values.length === 1) return `Ìbáwọlé aṣìṣe: a ní láti fi ${stringifyPrimitive(issue.values[0])}`;
				return `Àṣàyàn aṣìṣe: yan ọ̀kan lára ${joinValues(issue.values, "|")}`;
			case "too_big": {
				const adj = issue.inclusive ? "<=" : "<";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Tó pọ̀ jù: a ní láti jẹ́ pé ${issue.origin ?? "iye"} ${sizing.verb} ${adj}${issue.maximum} ${sizing.unit}`;
				return `Tó pọ̀ jù: a ní láti jẹ́ ${adj}${issue.maximum}`;
			}
			case "too_small": {
				const adj = issue.inclusive ? ">=" : ">";
				const sizing = getSizing(issue.origin);
				if (sizing) return `Kéré ju: a ní láti jẹ́ pé ${issue.origin} ${sizing.verb} ${adj}${issue.minimum} ${sizing.unit}`;
				return `Kéré ju: a ní láti jẹ́ ${adj}${issue.minimum}`;
			}
			case "invalid_format": {
				const _issue = issue;
				if (_issue.format === "starts_with") return `Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ bẹ̀rẹ̀ pẹ̀lú "${_issue.prefix}"`;
				if (_issue.format === "ends_with") return `Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ parí pẹ̀lú "${_issue.suffix}"`;
				if (_issue.format === "includes") return `Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ ní "${_issue.includes}"`;
				if (_issue.format === "regex") return `Ọ̀rọ̀ aṣìṣe: gbọ́dọ̀ bá àpẹẹrẹ mu ${_issue.pattern}`;
				return `Aṣìṣe: ${FormatDictionary[_issue.format] ?? issue.format}`;
			}
			case "not_multiple_of": return `Nọ́mbà aṣìṣe: gbọ́dọ̀ jẹ́ èyà pípín ti ${issue.divisor}`;
			case "unrecognized_keys": return `Bọtìnì àìmọ̀: ${joinValues(issue.keys, ", ")}`;
			case "invalid_key": return `Bọtìnì aṣìṣe nínú ${issue.origin}`;
			case "invalid_union": return "Ìbáwọlé aṣìṣe";
			case "invalid_element": return `Iye aṣìṣe nínú ${issue.origin}`;
			default: return "Ìbáwọlé aṣìṣe";
		}
	};
};
function yo_default() {
	return { localeError: error() };
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/locales/index.js
var locales_exports = /* @__PURE__ */ __exportAll({
	ar: () => ar_default,
	az: () => az_default,
	be: () => be_default,
	bg: () => bg_default,
	ca: () => ca_default,
	cs: () => cs_default,
	da: () => da_default,
	de: () => de_default,
	en: () => en_default,
	eo: () => eo_default,
	es: () => es_default,
	fa: () => fa_default,
	fi: () => fi_default,
	fr: () => fr_default,
	frCA: () => fr_CA_default,
	he: () => he_default,
	hu: () => hu_default,
	hy: () => hy_default,
	id: () => id_default,
	is: () => is_default,
	it: () => it_default,
	ja: () => ja_default,
	ka: () => ka_default,
	kh: () => kh_default,
	km: () => km_default,
	ko: () => ko_default,
	lt: () => lt_default,
	mk: () => mk_default,
	ms: () => ms_default,
	nl: () => nl_default,
	no: () => no_default,
	ota: () => ota_default,
	pl: () => pl_default,
	ps: () => ps_default,
	pt: () => pt_default,
	ru: () => ru_default,
	sl: () => sl_default,
	sv: () => sv_default,
	ta: () => ta_default,
	th: () => th_default,
	tr: () => tr_default,
	ua: () => ua_default,
	uk: () => uk_default,
	ur: () => ur_default,
	uz: () => uz_default,
	vi: () => vi_default,
	yo: () => yo_default,
	zhCN: () => zh_CN_default,
	zhTW: () => zh_TW_default
});

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/registries.js
var _a;
const $output = Symbol("ZodOutput");
const $input = Symbol("ZodInput");
var $ZodRegistry = class {
	constructor() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
	}
	add(schema, ..._meta) {
		const meta = _meta[0];
		this._map.set(schema, meta);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
		return this;
	}
	clear() {
		this._map = /* @__PURE__ */ new WeakMap();
		this._idmap = /* @__PURE__ */ new Map();
		return this;
	}
	remove(schema) {
		const meta = this._map.get(schema);
		if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
		this._map.delete(schema);
		return this;
	}
	get(schema) {
		const p = schema._zod.parent;
		if (p) {
			const pm = { ...this.get(p) ?? {} };
			delete pm.id;
			const f = {
				...pm,
				...this._map.get(schema)
			};
			return Object.keys(f).length ? f : void 0;
		}
		return this._map.get(schema);
	}
	has(schema) {
		return this._map.has(schema);
	}
};
function registry() {
	return new $ZodRegistry();
}
(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
const globalRegistry = globalThis.__zod_globalRegistry;

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/api.js
/* @__NO_SIDE_EFFECTS__ */
function _string(Class, params) {
	return new Class({
		type: "string",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _coercedString(Class, params) {
	return new Class({
		type: "string",
		coerce: true,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _email(Class, params) {
	return new Class({
		type: "string",
		format: "email",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _guid(Class, params) {
	return new Class({
		type: "string",
		format: "guid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuid(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv4(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v4",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv6(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v6",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uuidv7(Class, params) {
	return new Class({
		type: "string",
		format: "uuid",
		check: "string_format",
		abort: false,
		version: "v7",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _url(Class, params) {
	return new Class({
		type: "string",
		format: "url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _emoji(Class, params) {
	return new Class({
		type: "string",
		format: "emoji",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _nanoid(Class, params) {
	return new Class({
		type: "string",
		format: "nanoid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid(Class, params) {
	return new Class({
		type: "string",
		format: "cuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cuid2(Class, params) {
	return new Class({
		type: "string",
		format: "cuid2",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ulid(Class, params) {
	return new Class({
		type: "string",
		format: "ulid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _xid(Class, params) {
	return new Class({
		type: "string",
		format: "xid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ksuid(Class, params) {
	return new Class({
		type: "string",
		format: "ksuid",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv4(Class, params) {
	return new Class({
		type: "string",
		format: "ipv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _ipv6(Class, params) {
	return new Class({
		type: "string",
		format: "ipv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _mac(Class, params) {
	return new Class({
		type: "string",
		format: "mac",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv4(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv4",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _cidrv6(Class, params) {
	return new Class({
		type: "string",
		format: "cidrv6",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64(Class, params) {
	return new Class({
		type: "string",
		format: "base64",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _base64url(Class, params) {
	return new Class({
		type: "string",
		format: "base64url",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _e164(Class, params) {
	return new Class({
		type: "string",
		format: "e164",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _jwt(Class, params) {
	return new Class({
		type: "string",
		format: "jwt",
		check: "string_format",
		abort: false,
		...normalizeParams(params)
	});
}
const TimePrecision = {
	Any: null,
	Minute: -1,
	Second: 0,
	Millisecond: 3,
	Microsecond: 6
};
/* @__NO_SIDE_EFFECTS__ */
function _isoDateTime(Class, params) {
	return new Class({
		type: "string",
		format: "datetime",
		check: "string_format",
		offset: false,
		local: false,
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDate(Class, params) {
	return new Class({
		type: "string",
		format: "date",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoTime(Class, params) {
	return new Class({
		type: "string",
		format: "time",
		check: "string_format",
		precision: null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _isoDuration(Class, params) {
	return new Class({
		type: "string",
		format: "duration",
		check: "string_format",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _number(Class, params) {
	return new Class({
		type: "number",
		checks: [],
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _coercedNumber(Class, params) {
	return new Class({
		type: "number",
		coerce: true,
		checks: [],
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _int(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "safeint",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _float32(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "float32",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _float64(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "float64",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _int32(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "int32",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uint32(Class, params) {
	return new Class({
		type: "number",
		check: "number_format",
		abort: false,
		format: "uint32",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _boolean(Class, params) {
	return new Class({
		type: "boolean",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _coercedBoolean(Class, params) {
	return new Class({
		type: "boolean",
		coerce: true,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _bigint(Class, params) {
	return new Class({
		type: "bigint",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _coercedBigint(Class, params) {
	return new Class({
		type: "bigint",
		coerce: true,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _int64(Class, params) {
	return new Class({
		type: "bigint",
		check: "bigint_format",
		abort: false,
		format: "int64",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uint64(Class, params) {
	return new Class({
		type: "bigint",
		check: "bigint_format",
		abort: false,
		format: "uint64",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _symbol(Class, params) {
	return new Class({
		type: "symbol",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _undefined$1(Class, params) {
	return new Class({
		type: "undefined",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _null$1(Class, params) {
	return new Class({
		type: "null",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _any(Class) {
	return new Class({ type: "any" });
}
/* @__NO_SIDE_EFFECTS__ */
function _unknown(Class) {
	return new Class({ type: "unknown" });
}
/* @__NO_SIDE_EFFECTS__ */
function _never(Class, params) {
	return new Class({
		type: "never",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _void$1(Class, params) {
	return new Class({
		type: "void",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _date(Class, params) {
	return new Class({
		type: "date",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _coercedDate(Class, params) {
	return new Class({
		type: "date",
		coerce: true,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _nan(Class, params) {
	return new Class({
		type: "nan",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lt(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lte(value, params) {
	return new $ZodCheckLessThan({
		check: "less_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gt(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: false
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _gte(value, params) {
	return new $ZodCheckGreaterThan({
		check: "greater_than",
		...normalizeParams(params),
		value,
		inclusive: true
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _positive(params) {
	return /* @__PURE__ */ _gt(0, params);
}
/* @__NO_SIDE_EFFECTS__ */
function _negative(params) {
	return /* @__PURE__ */ _lt(0, params);
}
/* @__NO_SIDE_EFFECTS__ */
function _nonpositive(params) {
	return /* @__PURE__ */ _lte(0, params);
}
/* @__NO_SIDE_EFFECTS__ */
function _nonnegative(params) {
	return /* @__PURE__ */ _gte(0, params);
}
/* @__NO_SIDE_EFFECTS__ */
function _multipleOf(value, params) {
	return new $ZodCheckMultipleOf({
		check: "multiple_of",
		...normalizeParams(params),
		value
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _maxSize(maximum, params) {
	return new $ZodCheckMaxSize({
		check: "max_size",
		...normalizeParams(params),
		maximum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _minSize(minimum, params) {
	return new $ZodCheckMinSize({
		check: "min_size",
		...normalizeParams(params),
		minimum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _size(size, params) {
	return new $ZodCheckSizeEquals({
		check: "size_equals",
		...normalizeParams(params),
		size
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _maxLength(maximum, params) {
	return new $ZodCheckMaxLength({
		check: "max_length",
		...normalizeParams(params),
		maximum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _minLength(minimum, params) {
	return new $ZodCheckMinLength({
		check: "min_length",
		...normalizeParams(params),
		minimum
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _length(length, params) {
	return new $ZodCheckLengthEquals({
		check: "length_equals",
		...normalizeParams(params),
		length
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _regex(pattern, params) {
	return new $ZodCheckRegex({
		check: "string_format",
		format: "regex",
		...normalizeParams(params),
		pattern
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lowercase(params) {
	return new $ZodCheckLowerCase({
		check: "string_format",
		format: "lowercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _uppercase(params) {
	return new $ZodCheckUpperCase({
		check: "string_format",
		format: "uppercase",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _includes(includes, params) {
	return new $ZodCheckIncludes({
		check: "string_format",
		format: "includes",
		...normalizeParams(params),
		includes
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _startsWith(prefix, params) {
	return new $ZodCheckStartsWith({
		check: "string_format",
		format: "starts_with",
		...normalizeParams(params),
		prefix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _endsWith(suffix, params) {
	return new $ZodCheckEndsWith({
		check: "string_format",
		format: "ends_with",
		...normalizeParams(params),
		suffix
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _property(property, schema, params) {
	return new $ZodCheckProperty({
		check: "property",
		property,
		schema,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _mime(types, params) {
	return new $ZodCheckMimeType({
		check: "mime_type",
		mime: types,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _overwrite(tx) {
	return new $ZodCheckOverwrite({
		check: "overwrite",
		tx
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _normalize(form) {
	return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
/* @__NO_SIDE_EFFECTS__ */
function _trim() {
	return /* @__PURE__ */ _overwrite((input) => input.trim());
}
/* @__NO_SIDE_EFFECTS__ */
function _toLowerCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _toUpperCase() {
	return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
/* @__NO_SIDE_EFFECTS__ */
function _slugify() {
	return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
/* @__NO_SIDE_EFFECTS__ */
function _array(Class, element, params) {
	return new Class({
		type: "array",
		element,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _union(Class, options, params) {
	return new Class({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
function _xor(Class, options, params) {
	return new Class({
		type: "union",
		options,
		inclusive: false,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _discriminatedUnion(Class, discriminator, options, params) {
	return new Class({
		type: "union",
		options,
		discriminator,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _intersection(Class, left, right) {
	return new Class({
		type: "intersection",
		left,
		right
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _tuple(Class, items, _paramsOrRest, _params) {
	const hasRest = _paramsOrRest instanceof $ZodType;
	const params = hasRest ? _params : _paramsOrRest;
	return new Class({
		type: "tuple",
		items,
		rest: hasRest ? _paramsOrRest : null,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _record(Class, keyType, valueType, params) {
	return new Class({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _map(Class, keyType, valueType, params) {
	return new Class({
		type: "map",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _set(Class, valueType, params) {
	return new Class({
		type: "set",
		valueType,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _enum$1(Class, values, params) {
	return new Class({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
/** @deprecated This API has been merged into `z.enum()`. Use `z.enum()` instead.
*
* ```ts
* enum Colors { red, green, blue }
* z.enum(Colors);
* ```
*/
/* @__NO_SIDE_EFFECTS__ */
function _nativeEnum(Class, entries, params) {
	return new Class({
		type: "enum",
		entries,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _literal(Class, value, params) {
	return new Class({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _file(Class, params) {
	return new Class({
		type: "file",
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _transform(Class, fn) {
	return new Class({
		type: "transform",
		transform: fn
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _optional(Class, innerType) {
	return new Class({
		type: "optional",
		innerType
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _nullable(Class, innerType) {
	return new Class({
		type: "nullable",
		innerType
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _default$1(Class, innerType, defaultValue) {
	return new Class({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _nonoptional(Class, innerType, params) {
	return new Class({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _success(Class, innerType) {
	return new Class({
		type: "success",
		innerType
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _catch$1(Class, innerType, catchValue) {
	return new Class({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _pipe(Class, in_, out) {
	return new Class({
		type: "pipe",
		in: in_,
		out
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _readonly(Class, innerType) {
	return new Class({
		type: "readonly",
		innerType
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _templateLiteral(Class, parts, params) {
	return new Class({
		type: "template_literal",
		parts,
		...normalizeParams(params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _lazy(Class, getter) {
	return new Class({
		type: "lazy",
		getter
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _promise(Class, innerType) {
	return new Class({
		type: "promise",
		innerType
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _custom(Class, fn, _params) {
	const norm = normalizeParams(_params);
	norm.abort ?? (norm.abort = true);
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...norm
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _refine(Class, fn, _params) {
	return new Class({
		type: "custom",
		check: "custom",
		fn,
		...normalizeParams(_params)
	});
}
/* @__NO_SIDE_EFFECTS__ */
function _superRefine(fn) {
	const ch = /* @__PURE__ */ _check((payload) => {
		payload.addIssue = (issue$2) => {
			if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
			else {
				const _issue = issue$2;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = ch);
				_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
				payload.issues.push(issue(_issue));
			}
		};
		return fn(payload.value, payload);
	});
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function _check(fn, params) {
	const ch = new $ZodCheck({
		check: "custom",
		...normalizeParams(params)
	});
	ch._zod.check = fn;
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function describe$1(description) {
	const ch = new $ZodCheck({ check: "describe" });
	ch._zod.onattach = [(inst) => {
		const existing = globalRegistry.get(inst) ?? {};
		globalRegistry.add(inst, {
			...existing,
			description
		});
	}];
	ch._zod.check = () => {};
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function meta$1(metadata) {
	const ch = new $ZodCheck({ check: "meta" });
	ch._zod.onattach = [(inst) => {
		const existing = globalRegistry.get(inst) ?? {};
		globalRegistry.add(inst, {
			...existing,
			...metadata
		});
	}];
	ch._zod.check = () => {};
	return ch;
}
/* @__NO_SIDE_EFFECTS__ */
function _stringbool(Classes, _params) {
	const params = normalizeParams(_params);
	let truthyArray = params.truthy ?? [
		"true",
		"1",
		"yes",
		"on",
		"y",
		"enabled"
	];
	let falsyArray = params.falsy ?? [
		"false",
		"0",
		"no",
		"off",
		"n",
		"disabled"
	];
	if (params.case !== "sensitive") {
		truthyArray = truthyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
		falsyArray = falsyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
	}
	const truthySet = new Set(truthyArray);
	const falsySet = new Set(falsyArray);
	const _Codec = Classes.Codec ?? $ZodCodec;
	const _Boolean = Classes.Boolean ?? $ZodBoolean;
	const codec = new _Codec({
		type: "pipe",
		in: new (Classes.String ?? $ZodString)({
			type: "string",
			error: params.error
		}),
		out: new _Boolean({
			type: "boolean",
			error: params.error
		}),
		transform: ((input, payload) => {
			let data = input;
			if (params.case !== "sensitive") data = data.toLowerCase();
			if (truthySet.has(data)) return true;
			else if (falsySet.has(data)) return false;
			else {
				payload.issues.push({
					code: "invalid_value",
					expected: "stringbool",
					values: [...truthySet, ...falsySet],
					input: payload.value,
					inst: codec,
					continue: false
				});
				return {};
			}
		}),
		reverseTransform: ((input, _payload) => {
			if (input === true) return truthyArray[0] || "true";
			else return falsyArray[0] || "false";
		}),
		error: params.error
	});
	return codec;
}
/* @__NO_SIDE_EFFECTS__ */
function _stringFormat(Class, format, fnOrRegex, _params = {}) {
	const params = normalizeParams(_params);
	const def = {
		...normalizeParams(_params),
		check: "string_format",
		type: "string",
		format,
		fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
		...params
	};
	if (fnOrRegex instanceof RegExp) def.pattern = fnOrRegex;
	return new Class(def);
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
	let target = params?.target ?? "draft-2020-12";
	if (target === "draft-4") target = "draft-04";
	if (target === "draft-7") target = "draft-07";
	return {
		processors: params.processors ?? {},
		metadataRegistry: params?.metadata ?? globalRegistry,
		target,
		unrepresentable: params?.unrepresentable ?? "throw",
		override: params?.override ?? (() => {}),
		io: params?.io ?? "output",
		counter: 0,
		seen: /* @__PURE__ */ new Map(),
		cycles: params?.cycles ?? "ref",
		reused: params?.reused ?? "inline",
		external: params?.external ?? void 0
	};
}
function process$1(schema, ctx, _params = {
	path: [],
	schemaPath: []
}) {
	var _a;
	const def = schema._zod.def;
	const seen = ctx.seen.get(schema);
	if (seen) {
		seen.count++;
		if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
		return seen.schema;
	}
	const result = {
		schema: {},
		count: 1,
		cycle: void 0,
		path: _params.path
	};
	ctx.seen.set(schema, result);
	const overrideSchema = schema._zod.toJSONSchema?.();
	if (overrideSchema) result.schema = overrideSchema;
	else {
		const params = {
			..._params,
			schemaPath: [..._params.schemaPath, schema],
			path: _params.path
		};
		if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
		else {
			const _json = result.schema;
			const processor = ctx.processors[def.type];
			if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
			processor(schema, ctx, _json, params);
		}
		const parent = schema._zod.parent;
		if (parent) {
			if (!result.ref) result.ref = parent;
			process$1(parent, ctx, params);
			ctx.seen.get(parent).isParent = true;
		}
	}
	const meta = ctx.metadataRegistry.get(schema);
	if (meta) Object.assign(result.schema, meta);
	if (ctx.io === "input" && isTransforming(schema)) {
		delete result.schema.examples;
		delete result.schema.default;
	}
	if (ctx.io === "input" && result.schema._prefault) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
	delete result.schema._prefault;
	return ctx.seen.get(schema).schema;
}
function extractDefs(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const idToSchema = /* @__PURE__ */ new Map();
	for (const entry of ctx.seen.entries()) {
		const id = ctx.metadataRegistry.get(entry[0])?.id;
		if (id) {
			const existing = idToSchema.get(id);
			if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
			idToSchema.set(id, entry[0]);
		}
	}
	const makeURI = (entry) => {
		const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
		if (ctx.external) {
			const externalId = ctx.external.registry.get(entry[0])?.id;
			const uriGenerator = ctx.external.uri ?? ((id) => id);
			if (externalId) return { ref: uriGenerator(externalId) };
			const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
			entry[1].defId = id;
			return {
				defId: id,
				ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
			};
		}
		if (entry[1] === root) return { ref: "#" };
		const defUriPrefix = `#/${defsSegment}/`;
		const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
		return {
			defId,
			ref: defUriPrefix + defId
		};
	};
	const extractToDef = (entry) => {
		if (entry[1].schema.$ref) return;
		const seen = entry[1];
		const { ref, defId } = makeURI(entry);
		seen.def = { ...seen.schema };
		if (defId) seen.defId = defId;
		const schema = seen.schema;
		for (const key in schema) delete schema[key];
		schema.$ref = ref;
	};
	if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
	}
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (schema === entry[0]) {
			extractToDef(entry);
			continue;
		}
		if (ctx.external) {
			const ext = ctx.external.registry.get(entry[0])?.id;
			if (schema !== entry[0] && ext) {
				extractToDef(entry);
				continue;
			}
		}
		if (ctx.metadataRegistry.get(entry[0])?.id) {
			extractToDef(entry);
			continue;
		}
		if (seen.cycle) {
			extractToDef(entry);
			continue;
		}
		if (seen.count > 1) {
			if (ctx.reused === "ref") {
				extractToDef(entry);
				continue;
			}
		}
	}
}
function finalize(ctx, schema) {
	const root = ctx.seen.get(schema);
	if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
	const flattenRef = (zodSchema) => {
		const seen = ctx.seen.get(zodSchema);
		if (seen.ref === null) return;
		const schema = seen.def ?? seen.schema;
		const _cached = { ...schema };
		const ref = seen.ref;
		seen.ref = null;
		if (ref) {
			flattenRef(ref);
			const refSeen = ctx.seen.get(ref);
			const refSchema = refSeen.schema;
			if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
				schema.allOf = schema.allOf ?? [];
				schema.allOf.push(refSchema);
			} else Object.assign(schema, refSchema);
			Object.assign(schema, _cached);
			if (zodSchema._zod.parent === ref) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (!(key in _cached)) delete schema[key];
			}
			if (refSchema.$ref && refSeen.def) for (const key in schema) {
				if (key === "$ref" || key === "allOf") continue;
				if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
			}
		}
		const parent = zodSchema._zod.parent;
		if (parent && parent !== ref) {
			flattenRef(parent);
			const parentSeen = ctx.seen.get(parent);
			if (parentSeen?.schema.$ref) {
				schema.$ref = parentSeen.schema.$ref;
				if (parentSeen.def) for (const key in schema) {
					if (key === "$ref" || key === "allOf") continue;
					if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
				}
			}
		}
		ctx.override({
			zodSchema,
			jsonSchema: schema,
			path: seen.path ?? []
		});
	};
	for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
	const result = {};
	if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
	else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
	else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
	else if (ctx.target === "openapi-3.0") {}
	if (ctx.external?.uri) {
		const id = ctx.external.registry.get(schema)?.id;
		if (!id) throw new Error("Schema is missing an `id` property");
		result.$id = ctx.external.uri(id);
	}
	Object.assign(result, root.def ?? root.schema);
	const defs = ctx.external?.defs ?? {};
	for (const entry of ctx.seen.entries()) {
		const seen = entry[1];
		if (seen.def && seen.defId) defs[seen.defId] = seen.def;
	}
	if (ctx.external) {} else if (Object.keys(defs).length > 0) if (ctx.target === "draft-2020-12") result.$defs = defs;
	else result.definitions = defs;
	try {
		const finalized = JSON.parse(JSON.stringify(result));
		Object.defineProperty(finalized, "~standard", {
			value: {
				...schema["~standard"],
				jsonSchema: {
					input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
					output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
				}
			},
			enumerable: false,
			writable: false
		});
		return finalized;
	} catch (_err) {
		throw new Error("Error converting schema to JSON.");
	}
}
function isTransforming(_schema, _ctx) {
	const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
	if (ctx.seen.has(_schema)) return false;
	ctx.seen.add(_schema);
	const def = _schema._zod.def;
	if (def.type === "transform") return true;
	if (def.type === "array") return isTransforming(def.element, ctx);
	if (def.type === "set") return isTransforming(def.valueType, ctx);
	if (def.type === "lazy") return isTransforming(def.getter(), ctx);
	if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") return isTransforming(def.innerType, ctx);
	if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
	if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
	if (def.type === "pipe") return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
	if (def.type === "object") {
		for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
		return false;
	}
	if (def.type === "union") {
		for (const option of def.options) if (isTransforming(option, ctx)) return true;
		return false;
	}
	if (def.type === "tuple") {
		for (const item of def.items) if (isTransforming(item, ctx)) return true;
		if (def.rest && isTransforming(def.rest, ctx)) return true;
		return false;
	}
	return false;
}
/**
* Creates a toJSONSchema method for a schema instance.
* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
*/
const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
	const ctx = initializeContext({
		...params,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};
const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
	const { libraryOptions, target } = params ?? {};
	const ctx = initializeContext({
		...libraryOptions ?? {},
		target,
		io,
		processors
	});
	process$1(schema, ctx);
	extractDefs(ctx, schema);
	return finalize(ctx, schema);
};

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/json-schema-processors.js
const formatMap = {
	guid: "uuid",
	url: "uri",
	datetime: "date-time",
	json_string: "json-string",
	regex: ""
};
const stringProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	json.type = "string";
	const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
	if (typeof minimum === "number") json.minLength = minimum;
	if (typeof maximum === "number") json.maxLength = maximum;
	if (format) {
		json.format = formatMap[format] ?? format;
		if (json.format === "") delete json.format;
		if (format === "time") delete json.format;
	}
	if (contentEncoding) json.contentEncoding = contentEncoding;
	if (patterns && patterns.size > 0) {
		const regexes = [...patterns];
		if (regexes.length === 1) json.pattern = regexes[0].source;
		else if (regexes.length > 1) json.allOf = [...regexes.map((regex) => ({
			...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
			pattern: regex.source
		}))];
	}
};
const numberProcessor = (schema, ctx, _json, _params) => {
	const json = _json;
	const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
	if (typeof format === "string" && format.includes("int")) json.type = "integer";
	else json.type = "number";
	if (typeof exclusiveMinimum === "number") if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
		json.minimum = exclusiveMinimum;
		json.exclusiveMinimum = true;
	} else json.exclusiveMinimum = exclusiveMinimum;
	if (typeof minimum === "number") {
		json.minimum = minimum;
		if (typeof exclusiveMinimum === "number" && ctx.target !== "draft-04") if (exclusiveMinimum >= minimum) delete json.minimum;
		else delete json.exclusiveMinimum;
	}
	if (typeof exclusiveMaximum === "number") if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
		json.maximum = exclusiveMaximum;
		json.exclusiveMaximum = true;
	} else json.exclusiveMaximum = exclusiveMaximum;
	if (typeof maximum === "number") {
		json.maximum = maximum;
		if (typeof exclusiveMaximum === "number" && ctx.target !== "draft-04") if (exclusiveMaximum <= maximum) delete json.maximum;
		else delete json.exclusiveMaximum;
	}
	if (typeof multipleOf === "number") json.multipleOf = multipleOf;
};
const booleanProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
const bigintProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("BigInt cannot be represented in JSON Schema");
};
const symbolProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Symbols cannot be represented in JSON Schema");
};
const nullProcessor = (_schema, ctx, json, _params) => {
	if (ctx.target === "openapi-3.0") {
		json.type = "string";
		json.nullable = true;
		json.enum = [null];
	} else json.type = "null";
};
const undefinedProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Undefined cannot be represented in JSON Schema");
};
const voidProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Void cannot be represented in JSON Schema");
};
const neverProcessor = (_schema, _ctx, json, _params) => {
	json.not = {};
};
const anyProcessor = (_schema, _ctx, _json, _params) => {};
const unknownProcessor = (_schema, _ctx, _json, _params) => {};
const dateProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Date cannot be represented in JSON Schema");
};
const enumProcessor = (schema, _ctx, json, _params) => {
	const def = schema._zod.def;
	const values = getEnumValues(def.entries);
	if (values.every((v) => typeof v === "number")) json.type = "number";
	if (values.every((v) => typeof v === "string")) json.type = "string";
	json.enum = values;
};
const literalProcessor = (schema, ctx, json, _params) => {
	const def = schema._zod.def;
	const vals = [];
	for (const val of def.values) if (val === void 0) {
		if (ctx.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
	} else if (typeof val === "bigint") if (ctx.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
	else vals.push(Number(val));
	else vals.push(val);
	if (vals.length === 0) {} else if (vals.length === 1) {
		const val = vals[0];
		json.type = val === null ? "null" : typeof val;
		if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
		else json.const = val;
	} else {
		if (vals.every((v) => typeof v === "number")) json.type = "number";
		if (vals.every((v) => typeof v === "string")) json.type = "string";
		if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
		if (vals.every((v) => v === null)) json.type = "null";
		json.enum = vals;
	}
};
const nanProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("NaN cannot be represented in JSON Schema");
};
const templateLiteralProcessor = (schema, _ctx, json, _params) => {
	const _json = json;
	const pattern = schema._zod.pattern;
	if (!pattern) throw new Error("Pattern not found in template literal");
	_json.type = "string";
	_json.pattern = pattern.source;
};
const fileProcessor = (schema, _ctx, json, _params) => {
	const _json = json;
	const file = {
		type: "string",
		format: "binary",
		contentEncoding: "binary"
	};
	const { minimum, maximum, mime } = schema._zod.bag;
	if (minimum !== void 0) file.minLength = minimum;
	if (maximum !== void 0) file.maxLength = maximum;
	if (mime) if (mime.length === 1) {
		file.contentMediaType = mime[0];
		Object.assign(_json, file);
	} else {
		Object.assign(_json, file);
		_json.anyOf = mime.map((m) => ({ contentMediaType: m }));
	}
	else Object.assign(_json, file);
};
const successProcessor = (_schema, _ctx, json, _params) => {
	json.type = "boolean";
};
const customProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
};
const functionProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Function types cannot be represented in JSON Schema");
};
const transformProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
};
const mapProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Map cannot be represented in JSON Schema");
};
const setProcessor = (_schema, ctx, _json, _params) => {
	if (ctx.unrepresentable === "throw") throw new Error("Set cannot be represented in JSON Schema");
};
const arrayProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
	json.type = "array";
	json.items = process$1(def.element, ctx, {
		...params,
		path: [...params.path, "items"]
	});
};
const objectProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	json.properties = {};
	const shape = def.shape;
	for (const key in shape) json.properties[key] = process$1(shape[key], ctx, {
		...params,
		path: [
			...params.path,
			"properties",
			key
		]
	});
	const allKeys = new Set(Object.keys(shape));
	const requiredKeys = new Set([...allKeys].filter((key) => {
		const v = def.shape[key]._zod;
		if (ctx.io === "input") return v.optin === void 0;
		else return v.optout === void 0;
	}));
	if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
	if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
	else if (!def.catchall) {
		if (ctx.io === "output") json.additionalProperties = false;
	} else if (def.catchall) json.additionalProperties = process$1(def.catchall, ctx, {
		...params,
		path: [...params.path, "additionalProperties"]
	});
};
const unionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const isExclusive = def.inclusive === false;
	const options = def.options.map((x, i) => process$1(x, ctx, {
		...params,
		path: [
			...params.path,
			isExclusive ? "oneOf" : "anyOf",
			i
		]
	}));
	if (isExclusive) json.oneOf = options;
	else json.anyOf = options;
};
const intersectionProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const a = process$1(def.left, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			0
		]
	});
	const b = process$1(def.right, ctx, {
		...params,
		path: [
			...params.path,
			"allOf",
			1
		]
	});
	const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
	json.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
};
const tupleProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "array";
	const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
	const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
	const prefixItems = def.items.map((x, i) => process$1(x, ctx, {
		...params,
		path: [
			...params.path,
			prefixPath,
			i
		]
	}));
	const rest = def.rest ? process$1(def.rest, ctx, {
		...params,
		path: [
			...params.path,
			restPath,
			...ctx.target === "openapi-3.0" ? [def.items.length] : []
		]
	}) : null;
	if (ctx.target === "draft-2020-12") {
		json.prefixItems = prefixItems;
		if (rest) json.items = rest;
	} else if (ctx.target === "openapi-3.0") {
		json.items = { anyOf: prefixItems };
		if (rest) json.items.anyOf.push(rest);
		json.minItems = prefixItems.length;
		if (!rest) json.maxItems = prefixItems.length;
	} else {
		json.items = prefixItems;
		if (rest) json.additionalItems = rest;
	}
	const { minimum, maximum } = schema._zod.bag;
	if (typeof minimum === "number") json.minItems = minimum;
	if (typeof maximum === "number") json.maxItems = maximum;
};
const recordProcessor = (schema, ctx, _json, params) => {
	const json = _json;
	const def = schema._zod.def;
	json.type = "object";
	const keyType = def.keyType;
	const patterns = keyType._zod.bag?.patterns;
	if (def.mode === "loose" && patterns && patterns.size > 0) {
		const valueSchema = process$1(def.valueType, ctx, {
			...params,
			path: [
				...params.path,
				"patternProperties",
				"*"
			]
		});
		json.patternProperties = {};
		for (const pattern of patterns) json.patternProperties[pattern.source] = valueSchema;
	} else {
		if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") json.propertyNames = process$1(def.keyType, ctx, {
			...params,
			path: [...params.path, "propertyNames"]
		});
		json.additionalProperties = process$1(def.valueType, ctx, {
			...params,
			path: [...params.path, "additionalProperties"]
		});
	}
	const keyValues = keyType._zod.values;
	if (keyValues) {
		const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
		if (validKeyValues.length > 0) json.required = validKeyValues;
	}
};
const nullableProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	const inner = process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	if (ctx.target === "openapi-3.0") {
		seen.ref = def.innerType;
		json.nullable = true;
	} else json.anyOf = [inner, { type: "null" }];
};
const nonoptionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
const defaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
const prefaultProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	if (ctx.io === "input") json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
const catchProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	let catchValue;
	try {
		catchValue = def.catchValue(void 0);
	} catch {
		throw new Error("Dynamic catch values are not supported in JSON Schema");
	}
	json.default = catchValue;
};
const pipeProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	const innerType = ctx.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
	process$1(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const readonlyProcessor = (schema, ctx, json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
	json.readOnly = true;
};
const promiseProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
const optionalProcessor = (schema, ctx, _json, params) => {
	const def = schema._zod.def;
	process$1(def.innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = def.innerType;
};
const lazyProcessor = (schema, ctx, _json, params) => {
	const innerType = schema._zod.innerType;
	process$1(innerType, ctx, params);
	const seen = ctx.seen.get(schema);
	seen.ref = innerType;
};
const allProcessors = {
	string: stringProcessor,
	number: numberProcessor,
	boolean: booleanProcessor,
	bigint: bigintProcessor,
	symbol: symbolProcessor,
	null: nullProcessor,
	undefined: undefinedProcessor,
	void: voidProcessor,
	never: neverProcessor,
	any: anyProcessor,
	unknown: unknownProcessor,
	date: dateProcessor,
	enum: enumProcessor,
	literal: literalProcessor,
	nan: nanProcessor,
	template_literal: templateLiteralProcessor,
	file: fileProcessor,
	success: successProcessor,
	custom: customProcessor,
	function: functionProcessor,
	transform: transformProcessor,
	map: mapProcessor,
	set: setProcessor,
	array: arrayProcessor,
	object: objectProcessor,
	union: unionProcessor,
	intersection: intersectionProcessor,
	tuple: tupleProcessor,
	record: recordProcessor,
	nullable: nullableProcessor,
	nonoptional: nonoptionalProcessor,
	default: defaultProcessor,
	prefault: prefaultProcessor,
	catch: catchProcessor,
	pipe: pipeProcessor,
	readonly: readonlyProcessor,
	promise: promiseProcessor,
	optional: optionalProcessor,
	lazy: lazyProcessor
};
function toJSONSchema(input, params) {
	if ("_idmap" in input) {
		const registry = input;
		const ctx = initializeContext({
			...params,
			processors: allProcessors
		});
		const defs = {};
		for (const entry of registry._idmap.entries()) {
			const [_, schema] = entry;
			process$1(schema, ctx);
		}
		const schemas = {};
		ctx.external = {
			registry,
			uri: params?.uri,
			defs
		};
		for (const entry of registry._idmap.entries()) {
			const [key, schema] = entry;
			extractDefs(ctx, schema);
			schemas[key] = finalize(ctx, schema);
		}
		if (Object.keys(defs).length > 0) schemas.__shared = { [ctx.target === "draft-2020-12" ? "$defs" : "definitions"]: defs };
		return { schemas };
	}
	const ctx = initializeContext({
		...params,
		processors: allProcessors
	});
	process$1(input, ctx);
	extractDefs(ctx, input);
	return finalize(ctx, input);
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/json-schema-generator.js
/**
* Legacy class-based interface for JSON Schema generation.
* This class wraps the new functional implementation to provide backward compatibility.
*
* @deprecated Use the `toJSONSchema` function instead for new code.
*
* @example
* ```typescript
* // Legacy usage (still supported)
* const gen = new JSONSchemaGenerator({ target: "draft-07" });
* gen.process(schema);
* const result = gen.emit(schema);
*
* // Preferred modern usage
* const result = toJSONSchema(schema, { target: "draft-07" });
* ```
*/
var JSONSchemaGenerator = class {
	/** @deprecated Access via ctx instead */
	get metadataRegistry() {
		return this.ctx.metadataRegistry;
	}
	/** @deprecated Access via ctx instead */
	get target() {
		return this.ctx.target;
	}
	/** @deprecated Access via ctx instead */
	get unrepresentable() {
		return this.ctx.unrepresentable;
	}
	/** @deprecated Access via ctx instead */
	get override() {
		return this.ctx.override;
	}
	/** @deprecated Access via ctx instead */
	get io() {
		return this.ctx.io;
	}
	/** @deprecated Access via ctx instead */
	get counter() {
		return this.ctx.counter;
	}
	set counter(value) {
		this.ctx.counter = value;
	}
	/** @deprecated Access via ctx instead */
	get seen() {
		return this.ctx.seen;
	}
	constructor(params) {
		let normalizedTarget = params?.target ?? "draft-2020-12";
		if (normalizedTarget === "draft-4") normalizedTarget = "draft-04";
		if (normalizedTarget === "draft-7") normalizedTarget = "draft-07";
		this.ctx = initializeContext({
			processors: allProcessors,
			target: normalizedTarget,
			...params?.metadata && { metadata: params.metadata },
			...params?.unrepresentable && { unrepresentable: params.unrepresentable },
			...params?.override && { override: params.override },
			...params?.io && { io: params.io }
		});
	}
	/**
	* Process a schema to prepare it for JSON Schema generation.
	* This must be called before emit().
	*/
	process(schema, _params = {
		path: [],
		schemaPath: []
	}) {
		return process$1(schema, this.ctx, _params);
	}
	/**
	* Emit the final JSON Schema after processing.
	* Must call process() first.
	*/
	emit(schema, _params) {
		if (_params) {
			if (_params.cycles) this.ctx.cycles = _params.cycles;
			if (_params.reused) this.ctx.reused = _params.reused;
			if (_params.external) this.ctx.external = _params.external;
		}
		extractDefs(this.ctx, schema);
		const { "~standard": _, ...plainResult } = finalize(this.ctx, schema);
		return plainResult;
	}
};

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/json-schema.js
var json_schema_exports = /* @__PURE__ */ __exportAll({});

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/core/index.js
var core_exports = /* @__PURE__ */ __exportAll({
	$ZodAny: () => $ZodAny,
	$ZodArray: () => $ZodArray,
	$ZodAsyncError: () => $ZodAsyncError,
	$ZodBase64: () => $ZodBase64,
	$ZodBase64URL: () => $ZodBase64URL,
	$ZodBigInt: () => $ZodBigInt,
	$ZodBigIntFormat: () => $ZodBigIntFormat,
	$ZodBoolean: () => $ZodBoolean,
	$ZodCIDRv4: () => $ZodCIDRv4,
	$ZodCIDRv6: () => $ZodCIDRv6,
	$ZodCUID: () => $ZodCUID,
	$ZodCUID2: () => $ZodCUID2,
	$ZodCatch: () => $ZodCatch,
	$ZodCheck: () => $ZodCheck,
	$ZodCheckBigIntFormat: () => $ZodCheckBigIntFormat,
	$ZodCheckEndsWith: () => $ZodCheckEndsWith,
	$ZodCheckGreaterThan: () => $ZodCheckGreaterThan,
	$ZodCheckIncludes: () => $ZodCheckIncludes,
	$ZodCheckLengthEquals: () => $ZodCheckLengthEquals,
	$ZodCheckLessThan: () => $ZodCheckLessThan,
	$ZodCheckLowerCase: () => $ZodCheckLowerCase,
	$ZodCheckMaxLength: () => $ZodCheckMaxLength,
	$ZodCheckMaxSize: () => $ZodCheckMaxSize,
	$ZodCheckMimeType: () => $ZodCheckMimeType,
	$ZodCheckMinLength: () => $ZodCheckMinLength,
	$ZodCheckMinSize: () => $ZodCheckMinSize,
	$ZodCheckMultipleOf: () => $ZodCheckMultipleOf,
	$ZodCheckNumberFormat: () => $ZodCheckNumberFormat,
	$ZodCheckOverwrite: () => $ZodCheckOverwrite,
	$ZodCheckProperty: () => $ZodCheckProperty,
	$ZodCheckRegex: () => $ZodCheckRegex,
	$ZodCheckSizeEquals: () => $ZodCheckSizeEquals,
	$ZodCheckStartsWith: () => $ZodCheckStartsWith,
	$ZodCheckStringFormat: () => $ZodCheckStringFormat,
	$ZodCheckUpperCase: () => $ZodCheckUpperCase,
	$ZodCodec: () => $ZodCodec,
	$ZodCustom: () => $ZodCustom,
	$ZodCustomStringFormat: () => $ZodCustomStringFormat,
	$ZodDate: () => $ZodDate,
	$ZodDefault: () => $ZodDefault,
	$ZodDiscriminatedUnion: () => $ZodDiscriminatedUnion,
	$ZodE164: () => $ZodE164,
	$ZodEmail: () => $ZodEmail,
	$ZodEmoji: () => $ZodEmoji,
	$ZodEncodeError: () => $ZodEncodeError,
	$ZodEnum: () => $ZodEnum,
	$ZodError: () => $ZodError,
	$ZodExactOptional: () => $ZodExactOptional,
	$ZodFile: () => $ZodFile,
	$ZodFunction: () => $ZodFunction,
	$ZodGUID: () => $ZodGUID,
	$ZodIPv4: () => $ZodIPv4,
	$ZodIPv6: () => $ZodIPv6,
	$ZodISODate: () => $ZodISODate,
	$ZodISODateTime: () => $ZodISODateTime,
	$ZodISODuration: () => $ZodISODuration,
	$ZodISOTime: () => $ZodISOTime,
	$ZodIntersection: () => $ZodIntersection,
	$ZodJWT: () => $ZodJWT,
	$ZodKSUID: () => $ZodKSUID,
	$ZodLazy: () => $ZodLazy,
	$ZodLiteral: () => $ZodLiteral,
	$ZodMAC: () => $ZodMAC,
	$ZodMap: () => $ZodMap,
	$ZodNaN: () => $ZodNaN,
	$ZodNanoID: () => $ZodNanoID,
	$ZodNever: () => $ZodNever,
	$ZodNonOptional: () => $ZodNonOptional,
	$ZodNull: () => $ZodNull,
	$ZodNullable: () => $ZodNullable,
	$ZodNumber: () => $ZodNumber,
	$ZodNumberFormat: () => $ZodNumberFormat,
	$ZodObject: () => $ZodObject,
	$ZodObjectJIT: () => $ZodObjectJIT,
	$ZodOptional: () => $ZodOptional,
	$ZodPipe: () => $ZodPipe,
	$ZodPrefault: () => $ZodPrefault,
	$ZodPromise: () => $ZodPromise,
	$ZodReadonly: () => $ZodReadonly,
	$ZodRealError: () => $ZodRealError,
	$ZodRecord: () => $ZodRecord,
	$ZodRegistry: () => $ZodRegistry,
	$ZodSet: () => $ZodSet,
	$ZodString: () => $ZodString,
	$ZodStringFormat: () => $ZodStringFormat,
	$ZodSuccess: () => $ZodSuccess,
	$ZodSymbol: () => $ZodSymbol,
	$ZodTemplateLiteral: () => $ZodTemplateLiteral,
	$ZodTransform: () => $ZodTransform,
	$ZodTuple: () => $ZodTuple,
	$ZodType: () => $ZodType,
	$ZodULID: () => $ZodULID,
	$ZodURL: () => $ZodURL,
	$ZodUUID: () => $ZodUUID,
	$ZodUndefined: () => $ZodUndefined,
	$ZodUnion: () => $ZodUnion,
	$ZodUnknown: () => $ZodUnknown,
	$ZodVoid: () => $ZodVoid,
	$ZodXID: () => $ZodXID,
	$ZodXor: () => $ZodXor,
	$brand: () => $brand,
	$constructor: () => $constructor,
	$input: () => $input,
	$output: () => $output,
	Doc: () => Doc,
	JSONSchema: () => json_schema_exports,
	JSONSchemaGenerator: () => JSONSchemaGenerator,
	NEVER: () => NEVER,
	TimePrecision: () => TimePrecision,
	_any: () => _any,
	_array: () => _array,
	_base64: () => _base64,
	_base64url: () => _base64url,
	_bigint: () => _bigint,
	_boolean: () => _boolean,
	_catch: () => _catch$1,
	_check: () => _check,
	_cidrv4: () => _cidrv4,
	_cidrv6: () => _cidrv6,
	_coercedBigint: () => _coercedBigint,
	_coercedBoolean: () => _coercedBoolean,
	_coercedDate: () => _coercedDate,
	_coercedNumber: () => _coercedNumber,
	_coercedString: () => _coercedString,
	_cuid: () => _cuid,
	_cuid2: () => _cuid2,
	_custom: () => _custom,
	_date: () => _date,
	_decode: () => _decode,
	_decodeAsync: () => _decodeAsync,
	_default: () => _default$1,
	_discriminatedUnion: () => _discriminatedUnion,
	_e164: () => _e164,
	_email: () => _email,
	_emoji: () => _emoji,
	_encode: () => _encode,
	_encodeAsync: () => _encodeAsync,
	_endsWith: () => _endsWith,
	_enum: () => _enum$1,
	_file: () => _file,
	_float32: () => _float32,
	_float64: () => _float64,
	_gt: () => _gt,
	_gte: () => _gte,
	_guid: () => _guid,
	_includes: () => _includes,
	_int: () => _int,
	_int32: () => _int32,
	_int64: () => _int64,
	_intersection: () => _intersection,
	_ipv4: () => _ipv4,
	_ipv6: () => _ipv6,
	_isoDate: () => _isoDate,
	_isoDateTime: () => _isoDateTime,
	_isoDuration: () => _isoDuration,
	_isoTime: () => _isoTime,
	_jwt: () => _jwt,
	_ksuid: () => _ksuid,
	_lazy: () => _lazy,
	_length: () => _length,
	_literal: () => _literal,
	_lowercase: () => _lowercase,
	_lt: () => _lt,
	_lte: () => _lte,
	_mac: () => _mac,
	_map: () => _map,
	_max: () => _lte,
	_maxLength: () => _maxLength,
	_maxSize: () => _maxSize,
	_mime: () => _mime,
	_min: () => _gte,
	_minLength: () => _minLength,
	_minSize: () => _minSize,
	_multipleOf: () => _multipleOf,
	_nan: () => _nan,
	_nanoid: () => _nanoid,
	_nativeEnum: () => _nativeEnum,
	_negative: () => _negative,
	_never: () => _never,
	_nonnegative: () => _nonnegative,
	_nonoptional: () => _nonoptional,
	_nonpositive: () => _nonpositive,
	_normalize: () => _normalize,
	_null: () => _null$1,
	_nullable: () => _nullable,
	_number: () => _number,
	_optional: () => _optional,
	_overwrite: () => _overwrite,
	_parse: () => _parse,
	_parseAsync: () => _parseAsync,
	_pipe: () => _pipe,
	_positive: () => _positive,
	_promise: () => _promise,
	_property: () => _property,
	_readonly: () => _readonly,
	_record: () => _record,
	_refine: () => _refine,
	_regex: () => _regex,
	_safeDecode: () => _safeDecode,
	_safeDecodeAsync: () => _safeDecodeAsync,
	_safeEncode: () => _safeEncode,
	_safeEncodeAsync: () => _safeEncodeAsync,
	_safeParse: () => _safeParse,
	_safeParseAsync: () => _safeParseAsync,
	_set: () => _set,
	_size: () => _size,
	_slugify: () => _slugify,
	_startsWith: () => _startsWith,
	_string: () => _string,
	_stringFormat: () => _stringFormat,
	_stringbool: () => _stringbool,
	_success: () => _success,
	_superRefine: () => _superRefine,
	_symbol: () => _symbol,
	_templateLiteral: () => _templateLiteral,
	_toLowerCase: () => _toLowerCase,
	_toUpperCase: () => _toUpperCase,
	_transform: () => _transform,
	_trim: () => _trim,
	_tuple: () => _tuple,
	_uint32: () => _uint32,
	_uint64: () => _uint64,
	_ulid: () => _ulid,
	_undefined: () => _undefined$1,
	_union: () => _union,
	_unknown: () => _unknown,
	_uppercase: () => _uppercase,
	_url: () => _url,
	_uuid: () => _uuid,
	_uuidv4: () => _uuidv4,
	_uuidv6: () => _uuidv6,
	_uuidv7: () => _uuidv7,
	_void: () => _void$1,
	_xid: () => _xid,
	_xor: () => _xor,
	clone: () => clone,
	config: () => config,
	createStandardJSONSchemaMethod: () => createStandardJSONSchemaMethod,
	createToJSONSchemaMethod: () => createToJSONSchemaMethod,
	decode: () => decode$1,
	decodeAsync: () => decodeAsync$1,
	describe: () => describe$1,
	encode: () => encode$1,
	encodeAsync: () => encodeAsync$1,
	extractDefs: () => extractDefs,
	finalize: () => finalize,
	flattenError: () => flattenError,
	formatError: () => formatError,
	globalConfig: () => globalConfig,
	globalRegistry: () => globalRegistry,
	initializeContext: () => initializeContext,
	isValidBase64: () => isValidBase64,
	isValidBase64URL: () => isValidBase64URL,
	isValidJWT: () => isValidJWT,
	locales: () => locales_exports,
	meta: () => meta$1,
	parse: () => parse$1,
	parseAsync: () => parseAsync$1,
	prettifyError: () => prettifyError,
	process: () => process$1,
	regexes: () => regexes_exports,
	registry: () => registry,
	safeDecode: () => safeDecode$1,
	safeDecodeAsync: () => safeDecodeAsync$1,
	safeEncode: () => safeEncode$1,
	safeEncodeAsync: () => safeEncodeAsync$1,
	safeParse: () => safeParse$1,
	safeParseAsync: () => safeParseAsync$1,
	toDotPath: () => toDotPath,
	toJSONSchema: () => toJSONSchema,
	treeifyError: () => treeifyError,
	util: () => util_exports,
	version: () => version
});

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/checks.js
var checks_exports = /* @__PURE__ */ __exportAll({
	endsWith: () => _endsWith,
	gt: () => _gt,
	gte: () => _gte,
	includes: () => _includes,
	length: () => _length,
	lowercase: () => _lowercase,
	lt: () => _lt,
	lte: () => _lte,
	maxLength: () => _maxLength,
	maxSize: () => _maxSize,
	mime: () => _mime,
	minLength: () => _minLength,
	minSize: () => _minSize,
	multipleOf: () => _multipleOf,
	negative: () => _negative,
	nonnegative: () => _nonnegative,
	nonpositive: () => _nonpositive,
	normalize: () => _normalize,
	overwrite: () => _overwrite,
	positive: () => _positive,
	property: () => _property,
	regex: () => _regex,
	size: () => _size,
	slugify: () => _slugify,
	startsWith: () => _startsWith,
	toLowerCase: () => _toLowerCase,
	toUpperCase: () => _toUpperCase,
	trim: () => _trim,
	uppercase: () => _uppercase
});

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/iso.js
var iso_exports = /* @__PURE__ */ __exportAll({
	ZodISODate: () => ZodISODate,
	ZodISODateTime: () => ZodISODateTime,
	ZodISODuration: () => ZodISODuration,
	ZodISOTime: () => ZodISOTime,
	date: () => date$2,
	datetime: () => datetime,
	duration: () => duration,
	time: () => time
});
const ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
	$ZodISODateTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function datetime(params) {
	return _isoDateTime(ZodISODateTime, params);
}
const ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
	$ZodISODate.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function date$2(params) {
	return _isoDate(ZodISODate, params);
}
const ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
	$ZodISOTime.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function time(params) {
	return _isoTime(ZodISOTime, params);
}
const ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
	$ZodISODuration.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function duration(params) {
	return _isoDuration(ZodISODuration, params);
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/errors.js
const initializer = (inst, issues) => {
	$ZodError.init(inst, issues);
	inst.name = "ZodError";
	Object.defineProperties(inst, {
		format: { value: (mapper) => formatError(inst, mapper) },
		flatten: { value: (mapper) => flattenError(inst, mapper) },
		addIssue: { value: (issue) => {
			inst.issues.push(issue);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		addIssues: { value: (issues) => {
			inst.issues.push(...issues);
			inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
		} },
		isEmpty: { get() {
			return inst.issues.length === 0;
		} }
	});
};
const ZodError = $constructor("ZodError", initializer);
const ZodRealError = $constructor("ZodError", initializer, { Parent: Error });

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/parse.js
const parse = /* @__PURE__ */ _parse(ZodRealError);
const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
const encode = /* @__PURE__ */ _encode(ZodRealError);
const decode = /* @__PURE__ */ _decode(ZodRealError);
const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/schemas.js
var schemas_exports = /* @__PURE__ */ __exportAll({
	ZodAny: () => ZodAny,
	ZodArray: () => ZodArray,
	ZodBase64: () => ZodBase64,
	ZodBase64URL: () => ZodBase64URL,
	ZodBigInt: () => ZodBigInt,
	ZodBigIntFormat: () => ZodBigIntFormat,
	ZodBoolean: () => ZodBoolean,
	ZodCIDRv4: () => ZodCIDRv4,
	ZodCIDRv6: () => ZodCIDRv6,
	ZodCUID: () => ZodCUID,
	ZodCUID2: () => ZodCUID2,
	ZodCatch: () => ZodCatch,
	ZodCodec: () => ZodCodec,
	ZodCustom: () => ZodCustom,
	ZodCustomStringFormat: () => ZodCustomStringFormat,
	ZodDate: () => ZodDate,
	ZodDefault: () => ZodDefault,
	ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
	ZodE164: () => ZodE164,
	ZodEmail: () => ZodEmail,
	ZodEmoji: () => ZodEmoji,
	ZodEnum: () => ZodEnum,
	ZodExactOptional: () => ZodExactOptional,
	ZodFile: () => ZodFile,
	ZodFunction: () => ZodFunction,
	ZodGUID: () => ZodGUID,
	ZodIPv4: () => ZodIPv4,
	ZodIPv6: () => ZodIPv6,
	ZodIntersection: () => ZodIntersection,
	ZodJWT: () => ZodJWT,
	ZodKSUID: () => ZodKSUID,
	ZodLazy: () => ZodLazy,
	ZodLiteral: () => ZodLiteral,
	ZodMAC: () => ZodMAC,
	ZodMap: () => ZodMap,
	ZodNaN: () => ZodNaN,
	ZodNanoID: () => ZodNanoID,
	ZodNever: () => ZodNever,
	ZodNonOptional: () => ZodNonOptional,
	ZodNull: () => ZodNull,
	ZodNullable: () => ZodNullable,
	ZodNumber: () => ZodNumber,
	ZodNumberFormat: () => ZodNumberFormat,
	ZodObject: () => ZodObject,
	ZodOptional: () => ZodOptional,
	ZodPipe: () => ZodPipe,
	ZodPrefault: () => ZodPrefault,
	ZodPromise: () => ZodPromise,
	ZodReadonly: () => ZodReadonly,
	ZodRecord: () => ZodRecord,
	ZodSet: () => ZodSet,
	ZodString: () => ZodString,
	ZodStringFormat: () => ZodStringFormat,
	ZodSuccess: () => ZodSuccess,
	ZodSymbol: () => ZodSymbol,
	ZodTemplateLiteral: () => ZodTemplateLiteral,
	ZodTransform: () => ZodTransform,
	ZodTuple: () => ZodTuple,
	ZodType: () => ZodType,
	ZodULID: () => ZodULID,
	ZodURL: () => ZodURL,
	ZodUUID: () => ZodUUID,
	ZodUndefined: () => ZodUndefined,
	ZodUnion: () => ZodUnion,
	ZodUnknown: () => ZodUnknown,
	ZodVoid: () => ZodVoid,
	ZodXID: () => ZodXID,
	ZodXor: () => ZodXor,
	_ZodString: () => _ZodString,
	_default: () => _default,
	_function: () => _function,
	any: () => any,
	array: () => array,
	base64: () => base64,
	base64url: () => base64url,
	bigint: () => bigint$1,
	boolean: () => boolean$1,
	catch: () => _catch,
	check: () => check,
	cidrv4: () => cidrv4,
	cidrv6: () => cidrv6,
	codec: () => codec,
	cuid: () => cuid,
	cuid2: () => cuid2,
	custom: () => custom,
	date: () => date$1,
	describe: () => describe,
	discriminatedUnion: () => discriminatedUnion,
	e164: () => e164,
	email: () => email,
	emoji: () => emoji,
	enum: () => _enum,
	exactOptional: () => exactOptional,
	file: () => file,
	float32: () => float32,
	float64: () => float64,
	function: () => _function,
	guid: () => guid,
	hash: () => hash,
	hex: () => hex,
	hostname: () => hostname,
	httpUrl: () => httpUrl,
	instanceof: () => _instanceof,
	int: () => int,
	int32: () => int32,
	int64: () => int64,
	intersection: () => intersection,
	ipv4: () => ipv4,
	ipv6: () => ipv6,
	json: () => json,
	jwt: () => jwt,
	keyof: () => keyof,
	ksuid: () => ksuid,
	lazy: () => lazy,
	literal: () => literal,
	looseObject: () => looseObject,
	looseRecord: () => looseRecord,
	mac: () => mac,
	map: () => map,
	meta: () => meta,
	nan: () => nan,
	nanoid: () => nanoid,
	nativeEnum: () => nativeEnum,
	never: () => never,
	nonoptional: () => nonoptional,
	null: () => _null,
	nullable: () => nullable,
	nullish: () => nullish,
	number: () => number$1,
	object: () => object,
	optional: () => optional,
	partialRecord: () => partialRecord,
	pipe: () => pipe,
	prefault: () => prefault,
	preprocess: () => preprocess,
	promise: () => promise,
	readonly: () => readonly,
	record: () => record,
	refine: () => refine,
	set: () => set,
	strictObject: () => strictObject,
	string: () => string$1,
	stringFormat: () => stringFormat,
	stringbool: () => stringbool,
	success: () => success,
	superRefine: () => superRefine,
	symbol: () => symbol,
	templateLiteral: () => templateLiteral,
	transform: () => transform,
	tuple: () => tuple,
	uint32: () => uint32,
	uint64: () => uint64,
	ulid: () => ulid,
	undefined: () => _undefined,
	union: () => union,
	unknown: () => unknown,
	url: () => url,
	uuid: () => uuid,
	uuidv4: () => uuidv4,
	uuidv6: () => uuidv6,
	uuidv7: () => uuidv7,
	void: () => _void,
	xid: () => xid,
	xor: () => xor
});
const ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
	$ZodType.init(inst, def);
	Object.assign(inst["~standard"], { jsonSchema: {
		input: createStandardJSONSchemaMethod(inst, "input"),
		output: createStandardJSONSchemaMethod(inst, "output")
	} });
	inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
	inst.def = def;
	inst.type = def.type;
	Object.defineProperty(inst, "_def", { value: def });
	inst.check = (...checks) => {
		return inst.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...checks.map((ch) => typeof ch === "function" ? { _zod: {
			check: ch,
			def: { check: "custom" },
			onattach: []
		} } : ch)] }), { parent: true });
	};
	inst.with = inst.check;
	inst.clone = (def, params) => clone(inst, def, params);
	inst.brand = () => inst;
	inst.register = ((reg, meta) => {
		reg.add(inst, meta);
		return inst;
	});
	inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
	inst.safeParse = (data, params) => safeParse(inst, data, params);
	inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
	inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
	inst.spa = inst.safeParseAsync;
	inst.encode = (data, params) => encode(inst, data, params);
	inst.decode = (data, params) => decode(inst, data, params);
	inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
	inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
	inst.safeEncode = (data, params) => safeEncode(inst, data, params);
	inst.safeDecode = (data, params) => safeDecode(inst, data, params);
	inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
	inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
	inst.refine = (check, params) => inst.check(refine(check, params));
	inst.superRefine = (refinement) => inst.check(superRefine(refinement));
	inst.overwrite = (fn) => inst.check(_overwrite(fn));
	inst.optional = () => optional(inst);
	inst.exactOptional = () => exactOptional(inst);
	inst.nullable = () => nullable(inst);
	inst.nullish = () => optional(nullable(inst));
	inst.nonoptional = (params) => nonoptional(inst, params);
	inst.array = () => array(inst);
	inst.or = (arg) => union([inst, arg]);
	inst.and = (arg) => intersection(inst, arg);
	inst.transform = (tx) => pipe(inst, transform(tx));
	inst.default = (def) => _default(inst, def);
	inst.prefault = (def) => prefault(inst, def);
	inst.catch = (params) => _catch(inst, params);
	inst.pipe = (target) => pipe(inst, target);
	inst.readonly = () => readonly(inst);
	inst.describe = (description) => {
		const cl = inst.clone();
		globalRegistry.add(cl, { description });
		return cl;
	};
	Object.defineProperty(inst, "description", {
		get() {
			return globalRegistry.get(inst)?.description;
		},
		configurable: true
	});
	inst.meta = (...args) => {
		if (args.length === 0) return globalRegistry.get(inst);
		const cl = inst.clone();
		globalRegistry.add(cl, args[0]);
		return cl;
	};
	inst.isOptional = () => inst.safeParse(void 0).success;
	inst.isNullable = () => inst.safeParse(null).success;
	inst.apply = (fn) => fn(inst);
	return inst;
});
/** @internal */
const _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
	const bag = inst._zod.bag;
	inst.format = bag.format ?? null;
	inst.minLength = bag.minimum ?? null;
	inst.maxLength = bag.maximum ?? null;
	inst.regex = (...args) => inst.check(_regex(...args));
	inst.includes = (...args) => inst.check(_includes(...args));
	inst.startsWith = (...args) => inst.check(_startsWith(...args));
	inst.endsWith = (...args) => inst.check(_endsWith(...args));
	inst.min = (...args) => inst.check(_minLength(...args));
	inst.max = (...args) => inst.check(_maxLength(...args));
	inst.length = (...args) => inst.check(_length(...args));
	inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
	inst.lowercase = (params) => inst.check(_lowercase(params));
	inst.uppercase = (params) => inst.check(_uppercase(params));
	inst.trim = () => inst.check(_trim());
	inst.normalize = (...args) => inst.check(_normalize(...args));
	inst.toLowerCase = () => inst.check(_toLowerCase());
	inst.toUpperCase = () => inst.check(_toUpperCase());
	inst.slugify = () => inst.check(_slugify());
});
const ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
	$ZodString.init(inst, def);
	_ZodString.init(inst, def);
	inst.email = (params) => inst.check(_email(ZodEmail, params));
	inst.url = (params) => inst.check(_url(ZodURL, params));
	inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
	inst.emoji = (params) => inst.check(_emoji(ZodEmoji, params));
	inst.guid = (params) => inst.check(_guid(ZodGUID, params));
	inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
	inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
	inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
	inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
	inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
	inst.guid = (params) => inst.check(_guid(ZodGUID, params));
	inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
	inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
	inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
	inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
	inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
	inst.xid = (params) => inst.check(_xid(ZodXID, params));
	inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
	inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
	inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
	inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
	inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
	inst.e164 = (params) => inst.check(_e164(ZodE164, params));
	inst.datetime = (params) => inst.check(datetime(params));
	inst.date = (params) => inst.check(date$2(params));
	inst.time = (params) => inst.check(time(params));
	inst.duration = (params) => inst.check(duration(params));
});
function string$1(params) {
	return _string(ZodString, params);
}
const ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
	$ZodStringFormat.init(inst, def);
	_ZodString.init(inst, def);
});
const ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
	$ZodEmail.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function email(params) {
	return _email(ZodEmail, params);
}
const ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
	$ZodGUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function guid(params) {
	return _guid(ZodGUID, params);
}
const ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
	$ZodUUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function uuid(params) {
	return _uuid(ZodUUID, params);
}
function uuidv4(params) {
	return _uuidv4(ZodUUID, params);
}
function uuidv6(params) {
	return _uuidv6(ZodUUID, params);
}
function uuidv7(params) {
	return _uuidv7(ZodUUID, params);
}
const ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
	$ZodURL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function url(params) {
	return _url(ZodURL, params);
}
function httpUrl(params) {
	return _url(ZodURL, {
		protocol: /^https?$/,
		hostname: domain,
		...normalizeParams(params)
	});
}
const ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
	$ZodEmoji.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function emoji(params) {
	return _emoji(ZodEmoji, params);
}
const ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
	$ZodNanoID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function nanoid(params) {
	return _nanoid(ZodNanoID, params);
}
const ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
	$ZodCUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function cuid(params) {
	return _cuid(ZodCUID, params);
}
const ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
	$ZodCUID2.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function cuid2(params) {
	return _cuid2(ZodCUID2, params);
}
const ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
	$ZodULID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function ulid(params) {
	return _ulid(ZodULID, params);
}
const ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
	$ZodXID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function xid(params) {
	return _xid(ZodXID, params);
}
const ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
	$ZodKSUID.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function ksuid(params) {
	return _ksuid(ZodKSUID, params);
}
const ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
	$ZodIPv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function ipv4(params) {
	return _ipv4(ZodIPv4, params);
}
const ZodMAC = /* @__PURE__ */ $constructor("ZodMAC", (inst, def) => {
	$ZodMAC.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function mac(params) {
	return _mac(ZodMAC, params);
}
const ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
	$ZodIPv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function ipv6(params) {
	return _ipv6(ZodIPv6, params);
}
const ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
	$ZodCIDRv4.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function cidrv4(params) {
	return _cidrv4(ZodCIDRv4, params);
}
const ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
	$ZodCIDRv6.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function cidrv6(params) {
	return _cidrv6(ZodCIDRv6, params);
}
const ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
	$ZodBase64.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function base64(params) {
	return _base64(ZodBase64, params);
}
const ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
	$ZodBase64URL.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function base64url(params) {
	return _base64url(ZodBase64URL, params);
}
const ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
	$ZodE164.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function e164(params) {
	return _e164(ZodE164, params);
}
const ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
	$ZodJWT.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function jwt(params) {
	return _jwt(ZodJWT, params);
}
const ZodCustomStringFormat = /* @__PURE__ */ $constructor("ZodCustomStringFormat", (inst, def) => {
	$ZodCustomStringFormat.init(inst, def);
	ZodStringFormat.init(inst, def);
});
function stringFormat(format, fnOrRegex, _params = {}) {
	return _stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
function hostname(_params) {
	return _stringFormat(ZodCustomStringFormat, "hostname", hostname$1, _params);
}
function hex(_params) {
	return _stringFormat(ZodCustomStringFormat, "hex", hex$1, _params);
}
function hash(alg, params) {
	const format = `${alg}_${params?.enc ?? "hex"}`;
	const regex = regexes_exports[format];
	if (!regex) throw new Error(`Unrecognized hash format: ${format}`);
	return _stringFormat(ZodCustomStringFormat, format, regex, params);
}
const ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
	$ZodNumber.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
	inst.gt = (value, params) => inst.check(_gt(value, params));
	inst.gte = (value, params) => inst.check(_gte(value, params));
	inst.min = (value, params) => inst.check(_gte(value, params));
	inst.lt = (value, params) => inst.check(_lt(value, params));
	inst.lte = (value, params) => inst.check(_lte(value, params));
	inst.max = (value, params) => inst.check(_lte(value, params));
	inst.int = (params) => inst.check(int(params));
	inst.safe = (params) => inst.check(int(params));
	inst.positive = (params) => inst.check(_gt(0, params));
	inst.nonnegative = (params) => inst.check(_gte(0, params));
	inst.negative = (params) => inst.check(_lt(0, params));
	inst.nonpositive = (params) => inst.check(_lte(0, params));
	inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
	inst.step = (value, params) => inst.check(_multipleOf(value, params));
	inst.finite = () => inst;
	const bag = inst._zod.bag;
	inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
	inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
	inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
	inst.isFinite = true;
	inst.format = bag.format ?? null;
});
function number$1(params) {
	return _number(ZodNumber, params);
}
const ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
	$ZodNumberFormat.init(inst, def);
	ZodNumber.init(inst, def);
});
function int(params) {
	return _int(ZodNumberFormat, params);
}
function float32(params) {
	return _float32(ZodNumberFormat, params);
}
function float64(params) {
	return _float64(ZodNumberFormat, params);
}
function int32(params) {
	return _int32(ZodNumberFormat, params);
}
function uint32(params) {
	return _uint32(ZodNumberFormat, params);
}
const ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
	$ZodBoolean.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean$1(params) {
	return _boolean(ZodBoolean, params);
}
const ZodBigInt = /* @__PURE__ */ $constructor("ZodBigInt", (inst, def) => {
	$ZodBigInt.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => bigintProcessor(inst, ctx, json, params);
	inst.gte = (value, params) => inst.check(_gte(value, params));
	inst.min = (value, params) => inst.check(_gte(value, params));
	inst.gt = (value, params) => inst.check(_gt(value, params));
	inst.gte = (value, params) => inst.check(_gte(value, params));
	inst.min = (value, params) => inst.check(_gte(value, params));
	inst.lt = (value, params) => inst.check(_lt(value, params));
	inst.lte = (value, params) => inst.check(_lte(value, params));
	inst.max = (value, params) => inst.check(_lte(value, params));
	inst.positive = (params) => inst.check(_gt(BigInt(0), params));
	inst.negative = (params) => inst.check(_lt(BigInt(0), params));
	inst.nonpositive = (params) => inst.check(_lte(BigInt(0), params));
	inst.nonnegative = (params) => inst.check(_gte(BigInt(0), params));
	inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
	const bag = inst._zod.bag;
	inst.minValue = bag.minimum ?? null;
	inst.maxValue = bag.maximum ?? null;
	inst.format = bag.format ?? null;
});
function bigint$1(params) {
	return _bigint(ZodBigInt, params);
}
const ZodBigIntFormat = /* @__PURE__ */ $constructor("ZodBigIntFormat", (inst, def) => {
	$ZodBigIntFormat.init(inst, def);
	ZodBigInt.init(inst, def);
});
function int64(params) {
	return _int64(ZodBigIntFormat, params);
}
function uint64(params) {
	return _uint64(ZodBigIntFormat, params);
}
const ZodSymbol = /* @__PURE__ */ $constructor("ZodSymbol", (inst, def) => {
	$ZodSymbol.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => symbolProcessor(inst, ctx, json, params);
});
function symbol(params) {
	return _symbol(ZodSymbol, params);
}
const ZodUndefined = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
	$ZodUndefined.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => undefinedProcessor(inst, ctx, json, params);
});
function _undefined(params) {
	return _undefined$1(ZodUndefined, params);
}
const ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
	$ZodNull.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullProcessor(inst, ctx, json, params);
});
function _null(params) {
	return _null$1(ZodNull, params);
}
const ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
	$ZodAny.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => anyProcessor(inst, ctx, json, params);
});
function any() {
	return _any(ZodAny);
}
const ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
	$ZodUnknown.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
	return _unknown(ZodUnknown);
}
const ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
	$ZodNever.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
	return _never(ZodNever, params);
}
const ZodVoid = /* @__PURE__ */ $constructor("ZodVoid", (inst, def) => {
	$ZodVoid.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => voidProcessor(inst, ctx, json, params);
});
function _void(params) {
	return _void$1(ZodVoid, params);
}
const ZodDate = /* @__PURE__ */ $constructor("ZodDate", (inst, def) => {
	$ZodDate.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => dateProcessor(inst, ctx, json, params);
	inst.min = (value, params) => inst.check(_gte(value, params));
	inst.max = (value, params) => inst.check(_lte(value, params));
	const c = inst._zod.bag;
	inst.minDate = c.minimum ? new Date(c.minimum) : null;
	inst.maxDate = c.maximum ? new Date(c.maximum) : null;
});
function date$1(params) {
	return _date(ZodDate, params);
}
const ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
	$ZodArray.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
	inst.element = def.element;
	inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
	inst.nonempty = (params) => inst.check(_minLength(1, params));
	inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
	inst.length = (len, params) => inst.check(_length(len, params));
	inst.unwrap = () => inst.element;
});
function array(element, params) {
	return _array(ZodArray, element, params);
}
function keyof(schema) {
	const shape = schema._zod.def.shape;
	return _enum(Object.keys(shape));
}
const ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
	$ZodObjectJIT.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
	defineLazy(inst, "shape", () => {
		return def.shape;
	});
	inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
	inst.catchall = (catchall) => inst.clone({
		...inst._zod.def,
		catchall
	});
	inst.passthrough = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.loose = () => inst.clone({
		...inst._zod.def,
		catchall: unknown()
	});
	inst.strict = () => inst.clone({
		...inst._zod.def,
		catchall: never()
	});
	inst.strip = () => inst.clone({
		...inst._zod.def,
		catchall: void 0
	});
	inst.extend = (incoming) => {
		return extend(inst, incoming);
	};
	inst.safeExtend = (incoming) => {
		return safeExtend(inst, incoming);
	};
	inst.merge = (other) => merge(inst, other);
	inst.pick = (mask) => pick(inst, mask);
	inst.omit = (mask) => omit(inst, mask);
	inst.partial = (...args) => partial(ZodOptional, inst, args[0]);
	inst.required = (...args) => required(ZodNonOptional, inst, args[0]);
});
function object(shape, params) {
	return new ZodObject({
		type: "object",
		shape: shape ?? {},
		...normalizeParams(params)
	});
}
function strictObject(shape, params) {
	return new ZodObject({
		type: "object",
		shape,
		catchall: never(),
		...normalizeParams(params)
	});
}
function looseObject(shape, params) {
	return new ZodObject({
		type: "object",
		shape,
		catchall: unknown(),
		...normalizeParams(params)
	});
}
const ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
	$ZodUnion.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
function union(options, params) {
	return new ZodUnion({
		type: "union",
		options,
		...normalizeParams(params)
	});
}
const ZodXor = /* @__PURE__ */ $constructor("ZodXor", (inst, def) => {
	ZodUnion.init(inst, def);
	$ZodXor.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
	inst.options = def.options;
});
/** Creates an exclusive union (XOR) where exactly one option must match.
* Unlike regular unions that succeed when any option matches, xor fails if
* zero or more than one option matches the input. */
function xor(options, params) {
	return new ZodXor({
		type: "union",
		options,
		inclusive: false,
		...normalizeParams(params)
	});
}
const ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
	ZodUnion.init(inst, def);
	$ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
	return new ZodDiscriminatedUnion({
		type: "union",
		options,
		discriminator,
		...normalizeParams(params)
	});
}
const ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
	$ZodIntersection.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
	return new ZodIntersection({
		type: "intersection",
		left,
		right
	});
}
const ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
	$ZodTuple.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => tupleProcessor(inst, ctx, json, params);
	inst.rest = (rest) => inst.clone({
		...inst._zod.def,
		rest
	});
});
function tuple(items, _paramsOrRest, _params) {
	const hasRest = _paramsOrRest instanceof $ZodType;
	const params = hasRest ? _params : _paramsOrRest;
	return new ZodTuple({
		type: "tuple",
		items,
		rest: hasRest ? _paramsOrRest : null,
		...normalizeParams(params)
	});
}
const ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
	$ZodRecord.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
	inst.keyType = def.keyType;
	inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
	return new ZodRecord({
		type: "record",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
function partialRecord(keyType, valueType, params) {
	const k = clone(keyType);
	k._zod.values = void 0;
	return new ZodRecord({
		type: "record",
		keyType: k,
		valueType,
		...normalizeParams(params)
	});
}
function looseRecord(keyType, valueType, params) {
	return new ZodRecord({
		type: "record",
		keyType,
		valueType,
		mode: "loose",
		...normalizeParams(params)
	});
}
const ZodMap = /* @__PURE__ */ $constructor("ZodMap", (inst, def) => {
	$ZodMap.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => mapProcessor(inst, ctx, json, params);
	inst.keyType = def.keyType;
	inst.valueType = def.valueType;
	inst.min = (...args) => inst.check(_minSize(...args));
	inst.nonempty = (params) => inst.check(_minSize(1, params));
	inst.max = (...args) => inst.check(_maxSize(...args));
	inst.size = (...args) => inst.check(_size(...args));
});
function map(keyType, valueType, params) {
	return new ZodMap({
		type: "map",
		keyType,
		valueType,
		...normalizeParams(params)
	});
}
const ZodSet = /* @__PURE__ */ $constructor("ZodSet", (inst, def) => {
	$ZodSet.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => setProcessor(inst, ctx, json, params);
	inst.min = (...args) => inst.check(_minSize(...args));
	inst.nonempty = (params) => inst.check(_minSize(1, params));
	inst.max = (...args) => inst.check(_maxSize(...args));
	inst.size = (...args) => inst.check(_size(...args));
});
function set(valueType, params) {
	return new ZodSet({
		type: "set",
		valueType,
		...normalizeParams(params)
	});
}
const ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
	$ZodEnum.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
	inst.enum = def.entries;
	inst.options = Object.values(def.entries);
	const keys = new Set(Object.keys(def.entries));
	inst.extract = (values, params) => {
		const newEntries = {};
		for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
	inst.exclude = (values, params) => {
		const newEntries = { ...def.entries };
		for (const value of values) if (keys.has(value)) delete newEntries[value];
		else throw new Error(`Key ${value} not found in enum`);
		return new ZodEnum({
			...def,
			checks: [],
			...normalizeParams(params),
			entries: newEntries
		});
	};
});
function _enum(values, params) {
	return new ZodEnum({
		type: "enum",
		entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
		...normalizeParams(params)
	});
}
/** @deprecated This API has been merged into `z.enum()`. Use `z.enum()` instead.
*
* ```ts
* enum Colors { red, green, blue }
* z.enum(Colors);
* ```
*/
function nativeEnum(entries, params) {
	return new ZodEnum({
		type: "enum",
		entries,
		...normalizeParams(params)
	});
}
const ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
	$ZodLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
	inst.values = new Set(def.values);
	Object.defineProperty(inst, "value", { get() {
		if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
		return def.values[0];
	} });
});
function literal(value, params) {
	return new ZodLiteral({
		type: "literal",
		values: Array.isArray(value) ? value : [value],
		...normalizeParams(params)
	});
}
const ZodFile = /* @__PURE__ */ $constructor("ZodFile", (inst, def) => {
	$ZodFile.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => fileProcessor(inst, ctx, json, params);
	inst.min = (size, params) => inst.check(_minSize(size, params));
	inst.max = (size, params) => inst.check(_maxSize(size, params));
	inst.mime = (types, params) => inst.check(_mime(Array.isArray(types) ? types : [types], params));
});
function file(params) {
	return _file(ZodFile, params);
}
const ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
	$ZodTransform.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
	inst._zod.parse = (payload, _ctx) => {
		if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
		payload.addIssue = (issue$1) => {
			if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
			else {
				const _issue = issue$1;
				if (_issue.fatal) _issue.continue = false;
				_issue.code ?? (_issue.code = "custom");
				_issue.input ?? (_issue.input = payload.value);
				_issue.inst ?? (_issue.inst = inst);
				payload.issues.push(issue(_issue));
			}
		};
		const output = def.transform(payload.value, payload);
		if (output instanceof Promise) return output.then((output) => {
			payload.value = output;
			return payload;
		});
		payload.value = output;
		return payload;
	};
});
function transform(fn) {
	return new ZodTransform({
		type: "transform",
		transform: fn
	});
}
const ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
	$ZodOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
	return new ZodOptional({
		type: "optional",
		innerType
	});
}
const ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
	$ZodExactOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
	return new ZodExactOptional({
		type: "optional",
		innerType
	});
}
const ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
	$ZodNullable.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
	return new ZodNullable({
		type: "nullable",
		innerType
	});
}
function nullish(innerType) {
	return optional(nullable(innerType));
}
const ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
	$ZodDefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
	return new ZodDefault({
		type: "default",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
	$ZodPrefault.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
	return new ZodPrefault({
		type: "prefault",
		innerType,
		get defaultValue() {
			return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
		}
	});
}
const ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
	$ZodNonOptional.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
	return new ZodNonOptional({
		type: "nonoptional",
		innerType,
		...normalizeParams(params)
	});
}
const ZodSuccess = /* @__PURE__ */ $constructor("ZodSuccess", (inst, def) => {
	$ZodSuccess.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => successProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function success(innerType) {
	return new ZodSuccess({
		type: "success",
		innerType
	});
}
const ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
	$ZodCatch.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
	inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
	return new ZodCatch({
		type: "catch",
		innerType,
		catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
	});
}
const ZodNaN = /* @__PURE__ */ $constructor("ZodNaN", (inst, def) => {
	$ZodNaN.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => nanProcessor(inst, ctx, json, params);
});
function nan(params) {
	return _nan(ZodNaN, params);
}
const ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
	$ZodPipe.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
	inst.in = def.in;
	inst.out = def.out;
});
function pipe(in_, out) {
	return new ZodPipe({
		type: "pipe",
		in: in_,
		out
	});
}
const ZodCodec = /* @__PURE__ */ $constructor("ZodCodec", (inst, def) => {
	ZodPipe.init(inst, def);
	$ZodCodec.init(inst, def);
});
function codec(in_, out, params) {
	return new ZodCodec({
		type: "pipe",
		in: in_,
		out,
		transform: params.decode,
		reverseTransform: params.encode
	});
}
const ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
	$ZodReadonly.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
	return new ZodReadonly({
		type: "readonly",
		innerType
	});
}
const ZodTemplateLiteral = /* @__PURE__ */ $constructor("ZodTemplateLiteral", (inst, def) => {
	$ZodTemplateLiteral.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => templateLiteralProcessor(inst, ctx, json, params);
});
function templateLiteral(parts, params) {
	return new ZodTemplateLiteral({
		type: "template_literal",
		parts,
		...normalizeParams(params)
	});
}
const ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
	$ZodLazy.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => lazyProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
	return new ZodLazy({
		type: "lazy",
		getter
	});
}
const ZodPromise = /* @__PURE__ */ $constructor("ZodPromise", (inst, def) => {
	$ZodPromise.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => promiseProcessor(inst, ctx, json, params);
	inst.unwrap = () => inst._zod.def.innerType;
});
function promise(innerType) {
	return new ZodPromise({
		type: "promise",
		innerType
	});
}
const ZodFunction = /* @__PURE__ */ $constructor("ZodFunction", (inst, def) => {
	$ZodFunction.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => functionProcessor(inst, ctx, json, params);
});
function _function(params) {
	return new ZodFunction({
		type: "function",
		input: Array.isArray(params?.input) ? tuple(params?.input) : params?.input ?? array(unknown()),
		output: params?.output ?? unknown()
	});
}
const ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
	$ZodCustom.init(inst, def);
	ZodType.init(inst, def);
	inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function check(fn) {
	const ch = new $ZodCheck({ check: "custom" });
	ch._zod.check = fn;
	return ch;
}
function custom(fn, _params) {
	return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
	return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
	return _superRefine(fn);
}
const describe = describe$1;
const meta = meta$1;
function _instanceof(cls, params = {}) {
	const inst = new ZodCustom({
		type: "custom",
		check: "custom",
		fn: (data) => data instanceof cls,
		abort: true,
		...normalizeParams(params)
	});
	inst._zod.bag.Class = cls;
	inst._zod.check = (payload) => {
		if (!(payload.value instanceof cls)) payload.issues.push({
			code: "invalid_type",
			expected: cls.name,
			input: payload.value,
			inst,
			path: [...inst._zod.def.path ?? []]
		});
	};
	return inst;
}
const stringbool = (...args) => _stringbool({
	Codec: ZodCodec,
	Boolean: ZodBoolean,
	String: ZodString
}, ...args);
function json(params) {
	const jsonSchema = lazy(() => {
		return union([
			string$1(params),
			number$1(),
			boolean$1(),
			_null(),
			array(jsonSchema),
			record(string$1(), jsonSchema)
		]);
	});
	return jsonSchema;
}
function preprocess(fn, schema) {
	return pipe(transform(fn), schema);
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/compat.js
/** @deprecated Use the raw string literal codes instead, e.g. "invalid_type". */
const ZodIssueCode = {
	invalid_type: "invalid_type",
	too_big: "too_big",
	too_small: "too_small",
	invalid_format: "invalid_format",
	not_multiple_of: "not_multiple_of",
	unrecognized_keys: "unrecognized_keys",
	invalid_union: "invalid_union",
	invalid_key: "invalid_key",
	invalid_element: "invalid_element",
	invalid_value: "invalid_value",
	custom: "custom"
};
/** @deprecated Use `z.config(params)` instead. */
function setErrorMap(map) {
	config({ customError: map });
}
/** @deprecated Use `z.config()` instead. */
function getErrorMap() {
	return config().customError;
}
/** @deprecated Do not use. Stub definition, only included for zod-to-json-schema compatibility. */
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind) {})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/from-json-schema.js
const z = {
	...schemas_exports,
	...checks_exports,
	iso: iso_exports
};
const RECOGNIZED_KEYS = new Set([
	"$schema",
	"$ref",
	"$defs",
	"definitions",
	"$id",
	"id",
	"$comment",
	"$anchor",
	"$vocabulary",
	"$dynamicRef",
	"$dynamicAnchor",
	"type",
	"enum",
	"const",
	"anyOf",
	"oneOf",
	"allOf",
	"not",
	"properties",
	"required",
	"additionalProperties",
	"patternProperties",
	"propertyNames",
	"minProperties",
	"maxProperties",
	"items",
	"prefixItems",
	"additionalItems",
	"minItems",
	"maxItems",
	"uniqueItems",
	"contains",
	"minContains",
	"maxContains",
	"minLength",
	"maxLength",
	"pattern",
	"format",
	"minimum",
	"maximum",
	"exclusiveMinimum",
	"exclusiveMaximum",
	"multipleOf",
	"description",
	"default",
	"contentEncoding",
	"contentMediaType",
	"contentSchema",
	"unevaluatedItems",
	"unevaluatedProperties",
	"if",
	"then",
	"else",
	"dependentSchemas",
	"dependentRequired",
	"nullable",
	"readOnly"
]);
function detectVersion(schema, defaultTarget) {
	const $schema = schema.$schema;
	if ($schema === "https://json-schema.org/draft/2020-12/schema") return "draft-2020-12";
	if ($schema === "http://json-schema.org/draft-07/schema#") return "draft-7";
	if ($schema === "http://json-schema.org/draft-04/schema#") return "draft-4";
	return defaultTarget ?? "draft-2020-12";
}
function resolveRef(ref, ctx) {
	if (!ref.startsWith("#")) throw new Error("External $ref is not supported, only local refs (#/...) are allowed");
	const path = ref.slice(1).split("/").filter(Boolean);
	if (path.length === 0) return ctx.rootSchema;
	const defsKey = ctx.version === "draft-2020-12" ? "$defs" : "definitions";
	if (path[0] === defsKey) {
		const key = path[1];
		if (!key || !ctx.defs[key]) throw new Error(`Reference not found: ${ref}`);
		return ctx.defs[key];
	}
	throw new Error(`Reference not found: ${ref}`);
}
function convertBaseSchema(schema, ctx) {
	if (schema.not !== void 0) {
		if (typeof schema.not === "object" && Object.keys(schema.not).length === 0) return z.never();
		throw new Error("not is not supported in Zod (except { not: {} } for never)");
	}
	if (schema.unevaluatedItems !== void 0) throw new Error("unevaluatedItems is not supported");
	if (schema.unevaluatedProperties !== void 0) throw new Error("unevaluatedProperties is not supported");
	if (schema.if !== void 0 || schema.then !== void 0 || schema.else !== void 0) throw new Error("Conditional schemas (if/then/else) are not supported");
	if (schema.dependentSchemas !== void 0 || schema.dependentRequired !== void 0) throw new Error("dependentSchemas and dependentRequired are not supported");
	if (schema.$ref) {
		const refPath = schema.$ref;
		if (ctx.refs.has(refPath)) return ctx.refs.get(refPath);
		if (ctx.processing.has(refPath)) return z.lazy(() => {
			if (!ctx.refs.has(refPath)) throw new Error(`Circular reference not resolved: ${refPath}`);
			return ctx.refs.get(refPath);
		});
		ctx.processing.add(refPath);
		const zodSchema = convertSchema(resolveRef(refPath, ctx), ctx);
		ctx.refs.set(refPath, zodSchema);
		ctx.processing.delete(refPath);
		return zodSchema;
	}
	if (schema.enum !== void 0) {
		const enumValues = schema.enum;
		if (ctx.version === "openapi-3.0" && schema.nullable === true && enumValues.length === 1 && enumValues[0] === null) return z.null();
		if (enumValues.length === 0) return z.never();
		if (enumValues.length === 1) return z.literal(enumValues[0]);
		if (enumValues.every((v) => typeof v === "string")) return z.enum(enumValues);
		const literalSchemas = enumValues.map((v) => z.literal(v));
		if (literalSchemas.length < 2) return literalSchemas[0];
		return z.union([
			literalSchemas[0],
			literalSchemas[1],
			...literalSchemas.slice(2)
		]);
	}
	if (schema.const !== void 0) return z.literal(schema.const);
	const type = schema.type;
	if (Array.isArray(type)) {
		const typeSchemas = type.map((t) => {
			return convertBaseSchema({
				...schema,
				type: t
			}, ctx);
		});
		if (typeSchemas.length === 0) return z.never();
		if (typeSchemas.length === 1) return typeSchemas[0];
		return z.union(typeSchemas);
	}
	if (!type) return z.any();
	let zodSchema;
	switch (type) {
		case "string": {
			let stringSchema = z.string();
			if (schema.format) {
				const format = schema.format;
				if (format === "email") stringSchema = stringSchema.check(z.email());
				else if (format === "uri" || format === "uri-reference") stringSchema = stringSchema.check(z.url());
				else if (format === "uuid" || format === "guid") stringSchema = stringSchema.check(z.uuid());
				else if (format === "date-time") stringSchema = stringSchema.check(z.iso.datetime());
				else if (format === "date") stringSchema = stringSchema.check(z.iso.date());
				else if (format === "time") stringSchema = stringSchema.check(z.iso.time());
				else if (format === "duration") stringSchema = stringSchema.check(z.iso.duration());
				else if (format === "ipv4") stringSchema = stringSchema.check(z.ipv4());
				else if (format === "ipv6") stringSchema = stringSchema.check(z.ipv6());
				else if (format === "mac") stringSchema = stringSchema.check(z.mac());
				else if (format === "cidr") stringSchema = stringSchema.check(z.cidrv4());
				else if (format === "cidr-v6") stringSchema = stringSchema.check(z.cidrv6());
				else if (format === "base64") stringSchema = stringSchema.check(z.base64());
				else if (format === "base64url") stringSchema = stringSchema.check(z.base64url());
				else if (format === "e164") stringSchema = stringSchema.check(z.e164());
				else if (format === "jwt") stringSchema = stringSchema.check(z.jwt());
				else if (format === "emoji") stringSchema = stringSchema.check(z.emoji());
				else if (format === "nanoid") stringSchema = stringSchema.check(z.nanoid());
				else if (format === "cuid") stringSchema = stringSchema.check(z.cuid());
				else if (format === "cuid2") stringSchema = stringSchema.check(z.cuid2());
				else if (format === "ulid") stringSchema = stringSchema.check(z.ulid());
				else if (format === "xid") stringSchema = stringSchema.check(z.xid());
				else if (format === "ksuid") stringSchema = stringSchema.check(z.ksuid());
			}
			if (typeof schema.minLength === "number") stringSchema = stringSchema.min(schema.minLength);
			if (typeof schema.maxLength === "number") stringSchema = stringSchema.max(schema.maxLength);
			if (schema.pattern) stringSchema = stringSchema.regex(new RegExp(schema.pattern));
			zodSchema = stringSchema;
			break;
		}
		case "number":
		case "integer": {
			let numberSchema = type === "integer" ? z.number().int() : z.number();
			if (typeof schema.minimum === "number") numberSchema = numberSchema.min(schema.minimum);
			if (typeof schema.maximum === "number") numberSchema = numberSchema.max(schema.maximum);
			if (typeof schema.exclusiveMinimum === "number") numberSchema = numberSchema.gt(schema.exclusiveMinimum);
			else if (schema.exclusiveMinimum === true && typeof schema.minimum === "number") numberSchema = numberSchema.gt(schema.minimum);
			if (typeof schema.exclusiveMaximum === "number") numberSchema = numberSchema.lt(schema.exclusiveMaximum);
			else if (schema.exclusiveMaximum === true && typeof schema.maximum === "number") numberSchema = numberSchema.lt(schema.maximum);
			if (typeof schema.multipleOf === "number") numberSchema = numberSchema.multipleOf(schema.multipleOf);
			zodSchema = numberSchema;
			break;
		}
		case "boolean":
			zodSchema = z.boolean();
			break;
		case "null":
			zodSchema = z.null();
			break;
		case "object": {
			const shape = {};
			const properties = schema.properties || {};
			const requiredSet = new Set(schema.required || []);
			for (const [key, propSchema] of Object.entries(properties)) {
				const propZodSchema = convertSchema(propSchema, ctx);
				shape[key] = requiredSet.has(key) ? propZodSchema : propZodSchema.optional();
			}
			if (schema.propertyNames) {
				const keySchema = convertSchema(schema.propertyNames, ctx);
				const valueSchema = schema.additionalProperties && typeof schema.additionalProperties === "object" ? convertSchema(schema.additionalProperties, ctx) : z.any();
				if (Object.keys(shape).length === 0) {
					zodSchema = z.record(keySchema, valueSchema);
					break;
				}
				const objectSchema = z.object(shape).passthrough();
				const recordSchema = z.looseRecord(keySchema, valueSchema);
				zodSchema = z.intersection(objectSchema, recordSchema);
				break;
			}
			if (schema.patternProperties) {
				const patternProps = schema.patternProperties;
				const patternKeys = Object.keys(patternProps);
				const looseRecords = [];
				for (const pattern of patternKeys) {
					const patternValue = convertSchema(patternProps[pattern], ctx);
					const keySchema = z.string().regex(new RegExp(pattern));
					looseRecords.push(z.looseRecord(keySchema, patternValue));
				}
				const schemasToIntersect = [];
				if (Object.keys(shape).length > 0) schemasToIntersect.push(z.object(shape).passthrough());
				schemasToIntersect.push(...looseRecords);
				if (schemasToIntersect.length === 0) zodSchema = z.object({}).passthrough();
				else if (schemasToIntersect.length === 1) zodSchema = schemasToIntersect[0];
				else {
					let result = z.intersection(schemasToIntersect[0], schemasToIntersect[1]);
					for (let i = 2; i < schemasToIntersect.length; i++) result = z.intersection(result, schemasToIntersect[i]);
					zodSchema = result;
				}
				break;
			}
			const objectSchema = z.object(shape);
			if (schema.additionalProperties === false) zodSchema = objectSchema.strict();
			else if (typeof schema.additionalProperties === "object") zodSchema = objectSchema.catchall(convertSchema(schema.additionalProperties, ctx));
			else zodSchema = objectSchema.passthrough();
			break;
		}
		case "array": {
			const prefixItems = schema.prefixItems;
			const items = schema.items;
			if (prefixItems && Array.isArray(prefixItems)) {
				const tupleItems = prefixItems.map((item) => convertSchema(item, ctx));
				const rest = items && typeof items === "object" && !Array.isArray(items) ? convertSchema(items, ctx) : void 0;
				if (rest) zodSchema = z.tuple(tupleItems).rest(rest);
				else zodSchema = z.tuple(tupleItems);
				if (typeof schema.minItems === "number") zodSchema = zodSchema.check(z.minLength(schema.minItems));
				if (typeof schema.maxItems === "number") zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
			} else if (Array.isArray(items)) {
				const tupleItems = items.map((item) => convertSchema(item, ctx));
				const rest = schema.additionalItems && typeof schema.additionalItems === "object" ? convertSchema(schema.additionalItems, ctx) : void 0;
				if (rest) zodSchema = z.tuple(tupleItems).rest(rest);
				else zodSchema = z.tuple(tupleItems);
				if (typeof schema.minItems === "number") zodSchema = zodSchema.check(z.minLength(schema.minItems));
				if (typeof schema.maxItems === "number") zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
			} else if (items !== void 0) {
				const element = convertSchema(items, ctx);
				let arraySchema = z.array(element);
				if (typeof schema.minItems === "number") arraySchema = arraySchema.min(schema.minItems);
				if (typeof schema.maxItems === "number") arraySchema = arraySchema.max(schema.maxItems);
				zodSchema = arraySchema;
			} else zodSchema = z.array(z.any());
			break;
		}
		default: throw new Error(`Unsupported type: ${type}`);
	}
	if (schema.description) zodSchema = zodSchema.describe(schema.description);
	if (schema.default !== void 0) zodSchema = zodSchema.default(schema.default);
	return zodSchema;
}
function convertSchema(schema, ctx) {
	if (typeof schema === "boolean") return schema ? z.any() : z.never();
	let baseSchema = convertBaseSchema(schema, ctx);
	const hasExplicitType = schema.type || schema.enum !== void 0 || schema.const !== void 0;
	if (schema.anyOf && Array.isArray(schema.anyOf)) {
		const options = schema.anyOf.map((s) => convertSchema(s, ctx));
		const anyOfUnion = z.union(options);
		baseSchema = hasExplicitType ? z.intersection(baseSchema, anyOfUnion) : anyOfUnion;
	}
	if (schema.oneOf && Array.isArray(schema.oneOf)) {
		const options = schema.oneOf.map((s) => convertSchema(s, ctx));
		const oneOfUnion = z.xor(options);
		baseSchema = hasExplicitType ? z.intersection(baseSchema, oneOfUnion) : oneOfUnion;
	}
	if (schema.allOf && Array.isArray(schema.allOf)) if (schema.allOf.length === 0) baseSchema = hasExplicitType ? baseSchema : z.any();
	else {
		let result = hasExplicitType ? baseSchema : convertSchema(schema.allOf[0], ctx);
		const startIdx = hasExplicitType ? 0 : 1;
		for (let i = startIdx; i < schema.allOf.length; i++) result = z.intersection(result, convertSchema(schema.allOf[i], ctx));
		baseSchema = result;
	}
	if (schema.nullable === true && ctx.version === "openapi-3.0") baseSchema = z.nullable(baseSchema);
	if (schema.readOnly === true) baseSchema = z.readonly(baseSchema);
	const extraMeta = {};
	for (const key of [
		"$id",
		"id",
		"$comment",
		"$anchor",
		"$vocabulary",
		"$dynamicRef",
		"$dynamicAnchor"
	]) if (key in schema) extraMeta[key] = schema[key];
	for (const key of [
		"contentEncoding",
		"contentMediaType",
		"contentSchema"
	]) if (key in schema) extraMeta[key] = schema[key];
	for (const key of Object.keys(schema)) if (!RECOGNIZED_KEYS.has(key)) extraMeta[key] = schema[key];
	if (Object.keys(extraMeta).length > 0) ctx.registry.add(baseSchema, extraMeta);
	return baseSchema;
}
/**
* Converts a JSON Schema to a Zod schema. This function should be considered semi-experimental. It's behavior is liable to change. */
function fromJSONSchema(schema, params) {
	if (typeof schema === "boolean") return schema ? z.any() : z.never();
	return convertSchema(schema, {
		version: detectVersion(schema, params?.defaultTarget),
		defs: schema.$defs || schema.definitions || {},
		refs: /* @__PURE__ */ new Map(),
		processing: /* @__PURE__ */ new Set(),
		rootSchema: schema,
		registry: params?.registry ?? globalRegistry
	});
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/coerce.js
var coerce_exports = /* @__PURE__ */ __exportAll({
	bigint: () => bigint,
	boolean: () => boolean,
	date: () => date,
	number: () => number,
	string: () => string
});
function string(params) {
	return _coercedString(ZodString, params);
}
function number(params) {
	return _coercedNumber(ZodNumber, params);
}
function boolean(params) {
	return _coercedBoolean(ZodBoolean, params);
}
function bigint(params) {
	return _coercedBigint(ZodBigInt, params);
}
function date(params) {
	return _coercedDate(ZodDate, params);
}

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/v4/classic/external.js
var external_exports = /* @__PURE__ */ __exportAll({
	$brand: () => $brand,
	$input: () => $input,
	$output: () => $output,
	NEVER: () => NEVER,
	TimePrecision: () => TimePrecision,
	ZodAny: () => ZodAny,
	ZodArray: () => ZodArray,
	ZodBase64: () => ZodBase64,
	ZodBase64URL: () => ZodBase64URL,
	ZodBigInt: () => ZodBigInt,
	ZodBigIntFormat: () => ZodBigIntFormat,
	ZodBoolean: () => ZodBoolean,
	ZodCIDRv4: () => ZodCIDRv4,
	ZodCIDRv6: () => ZodCIDRv6,
	ZodCUID: () => ZodCUID,
	ZodCUID2: () => ZodCUID2,
	ZodCatch: () => ZodCatch,
	ZodCodec: () => ZodCodec,
	ZodCustom: () => ZodCustom,
	ZodCustomStringFormat: () => ZodCustomStringFormat,
	ZodDate: () => ZodDate,
	ZodDefault: () => ZodDefault,
	ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
	ZodE164: () => ZodE164,
	ZodEmail: () => ZodEmail,
	ZodEmoji: () => ZodEmoji,
	ZodEnum: () => ZodEnum,
	ZodError: () => ZodError,
	ZodExactOptional: () => ZodExactOptional,
	ZodFile: () => ZodFile,
	ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
	ZodFunction: () => ZodFunction,
	ZodGUID: () => ZodGUID,
	ZodIPv4: () => ZodIPv4,
	ZodIPv6: () => ZodIPv6,
	ZodISODate: () => ZodISODate,
	ZodISODateTime: () => ZodISODateTime,
	ZodISODuration: () => ZodISODuration,
	ZodISOTime: () => ZodISOTime,
	ZodIntersection: () => ZodIntersection,
	ZodIssueCode: () => ZodIssueCode,
	ZodJWT: () => ZodJWT,
	ZodKSUID: () => ZodKSUID,
	ZodLazy: () => ZodLazy,
	ZodLiteral: () => ZodLiteral,
	ZodMAC: () => ZodMAC,
	ZodMap: () => ZodMap,
	ZodNaN: () => ZodNaN,
	ZodNanoID: () => ZodNanoID,
	ZodNever: () => ZodNever,
	ZodNonOptional: () => ZodNonOptional,
	ZodNull: () => ZodNull,
	ZodNullable: () => ZodNullable,
	ZodNumber: () => ZodNumber,
	ZodNumberFormat: () => ZodNumberFormat,
	ZodObject: () => ZodObject,
	ZodOptional: () => ZodOptional,
	ZodPipe: () => ZodPipe,
	ZodPrefault: () => ZodPrefault,
	ZodPromise: () => ZodPromise,
	ZodReadonly: () => ZodReadonly,
	ZodRealError: () => ZodRealError,
	ZodRecord: () => ZodRecord,
	ZodSet: () => ZodSet,
	ZodString: () => ZodString,
	ZodStringFormat: () => ZodStringFormat,
	ZodSuccess: () => ZodSuccess,
	ZodSymbol: () => ZodSymbol,
	ZodTemplateLiteral: () => ZodTemplateLiteral,
	ZodTransform: () => ZodTransform,
	ZodTuple: () => ZodTuple,
	ZodType: () => ZodType,
	ZodULID: () => ZodULID,
	ZodURL: () => ZodURL,
	ZodUUID: () => ZodUUID,
	ZodUndefined: () => ZodUndefined,
	ZodUnion: () => ZodUnion,
	ZodUnknown: () => ZodUnknown,
	ZodVoid: () => ZodVoid,
	ZodXID: () => ZodXID,
	ZodXor: () => ZodXor,
	_ZodString: () => _ZodString,
	_default: () => _default,
	_function: () => _function,
	any: () => any,
	array: () => array,
	base64: () => base64,
	base64url: () => base64url,
	bigint: () => bigint$1,
	boolean: () => boolean$1,
	catch: () => _catch,
	check: () => check,
	cidrv4: () => cidrv4,
	cidrv6: () => cidrv6,
	clone: () => clone,
	codec: () => codec,
	coerce: () => coerce_exports,
	config: () => config,
	core: () => core_exports,
	cuid: () => cuid,
	cuid2: () => cuid2,
	custom: () => custom,
	date: () => date$1,
	decode: () => decode,
	decodeAsync: () => decodeAsync,
	describe: () => describe,
	discriminatedUnion: () => discriminatedUnion,
	e164: () => e164,
	email: () => email,
	emoji: () => emoji,
	encode: () => encode,
	encodeAsync: () => encodeAsync,
	endsWith: () => _endsWith,
	enum: () => _enum,
	exactOptional: () => exactOptional,
	file: () => file,
	flattenError: () => flattenError,
	float32: () => float32,
	float64: () => float64,
	formatError: () => formatError,
	fromJSONSchema: () => fromJSONSchema,
	function: () => _function,
	getErrorMap: () => getErrorMap,
	globalRegistry: () => globalRegistry,
	gt: () => _gt,
	gte: () => _gte,
	guid: () => guid,
	hash: () => hash,
	hex: () => hex,
	hostname: () => hostname,
	httpUrl: () => httpUrl,
	includes: () => _includes,
	instanceof: () => _instanceof,
	int: () => int,
	int32: () => int32,
	int64: () => int64,
	intersection: () => intersection,
	ipv4: () => ipv4,
	ipv6: () => ipv6,
	iso: () => iso_exports,
	json: () => json,
	jwt: () => jwt,
	keyof: () => keyof,
	ksuid: () => ksuid,
	lazy: () => lazy,
	length: () => _length,
	literal: () => literal,
	locales: () => locales_exports,
	looseObject: () => looseObject,
	looseRecord: () => looseRecord,
	lowercase: () => _lowercase,
	lt: () => _lt,
	lte: () => _lte,
	mac: () => mac,
	map: () => map,
	maxLength: () => _maxLength,
	maxSize: () => _maxSize,
	meta: () => meta,
	mime: () => _mime,
	minLength: () => _minLength,
	minSize: () => _minSize,
	multipleOf: () => _multipleOf,
	nan: () => nan,
	nanoid: () => nanoid,
	nativeEnum: () => nativeEnum,
	negative: () => _negative,
	never: () => never,
	nonnegative: () => _nonnegative,
	nonoptional: () => nonoptional,
	nonpositive: () => _nonpositive,
	normalize: () => _normalize,
	null: () => _null,
	nullable: () => nullable,
	nullish: () => nullish,
	number: () => number$1,
	object: () => object,
	optional: () => optional,
	overwrite: () => _overwrite,
	parse: () => parse,
	parseAsync: () => parseAsync,
	partialRecord: () => partialRecord,
	pipe: () => pipe,
	positive: () => _positive,
	prefault: () => prefault,
	preprocess: () => preprocess,
	prettifyError: () => prettifyError,
	promise: () => promise,
	property: () => _property,
	readonly: () => readonly,
	record: () => record,
	refine: () => refine,
	regex: () => _regex,
	regexes: () => regexes_exports,
	registry: () => registry,
	safeDecode: () => safeDecode,
	safeDecodeAsync: () => safeDecodeAsync,
	safeEncode: () => safeEncode,
	safeEncodeAsync: () => safeEncodeAsync,
	safeParse: () => safeParse,
	safeParseAsync: () => safeParseAsync,
	set: () => set,
	setErrorMap: () => setErrorMap,
	size: () => _size,
	slugify: () => _slugify,
	startsWith: () => _startsWith,
	strictObject: () => strictObject,
	string: () => string$1,
	stringFormat: () => stringFormat,
	stringbool: () => stringbool,
	success: () => success,
	superRefine: () => superRefine,
	symbol: () => symbol,
	templateLiteral: () => templateLiteral,
	toJSONSchema: () => toJSONSchema,
	toLowerCase: () => _toLowerCase,
	toUpperCase: () => _toUpperCase,
	transform: () => transform,
	treeifyError: () => treeifyError,
	trim: () => _trim,
	tuple: () => tuple,
	uint32: () => uint32,
	uint64: () => uint64,
	ulid: () => ulid,
	undefined: () => _undefined,
	union: () => union,
	unknown: () => unknown,
	uppercase: () => _uppercase,
	url: () => url,
	util: () => util_exports,
	uuid: () => uuid,
	uuidv4: () => uuidv4,
	uuidv6: () => uuidv6,
	uuidv7: () => uuidv7,
	void: () => _void,
	xid: () => xid,
	xor: () => xor
});
config(en_default());

//#endregion
//#region ../../../../../../node_modules/.pnpm/zod@4.3.6/node_modules/zod/index.js
var zod_default = external_exports;

//#endregion
//#region ../../../../../helpers/dist/plugins/tool.js
function n$9(e, t, n) {
	return {
		inputSchema: e,
		outputSchema: t,
		handler: n
	};
}
var r$5 = class extends r$6 {
	_tools = /* @__PURE__ */ new Map();
	constructor() {
		super(), this.router.handle(`execute`, async (e) => {
			let { toolName: t, inputs: n, systemVar: r } = e, i = this._resolveTool(t), a = i.inputSchema.safeParse(n);
			if (!a.success) return { error: a.error.message };
			try {
				return { output: await i.handler(a.data, { systemVar: r }) };
			} catch (e) {
				return { error: e instanceof Error ? e.message : String(e) };
			}
		});
	}
	registerTool(e, t) {
		return typeof e == `string` ? this._tools.set(e, t) : this._tools.set(``, e), this;
	}
	getConfig() {
		let e = (e) => ({
			inputSchema: toJSONSchema(e.inputSchema),
			outputSchema: toJSONSchema(e.outputSchema)
		});
		if (this._tools.size === 1 && this._tools.has(``)) return e(this._tools.get(``));
		let n = {};
		for (let [t, r] of this._tools) n[t] = e(r);
		return n;
	}
	_resolveTool(e) {
		if (e !== void 0) {
			let t = this._tools.get(e);
			if (!t) throw Error(`Tool not found: ${e}`);
			return t;
		}
		if (this._tools.size === 1) {
			let e = [...this._tools.values()][0];
			if (!e) throw Error(`No tool registered`);
			return e;
		}
		throw Error(`toolName is required for toolsets`);
	}
};

//#endregion
//#region ../../../../../helpers/dist/models/schemas.js
const t$7 = _enum([
	`llm`,
	`embedding`,
	`rerank`,
	`tts`,
	`stt`
]), n$8 = t$7.enum, r$4 = object({
	charsPointsPrice: number$1().optional(),
	inputPrice: number$1().optional(),
	outputPrice: number$1().optional()
}), i$4 = object({
	provider: string$1(),
	model: string$1(),
	name: string$1()
}), a$4 = r$4.extend(i$4.shape).extend({
	type: literal(n$8.llm),
	maxContext: number$1(),
	maxTokens: number$1(),
	quoteMaxToken: number$1(),
	maxTemperature: union([number$1(), _null()]),
	showTopP: boolean$1().optional(),
	responseFormatList: array(string$1()).optional(),
	showStopSign: boolean$1().optional(),
	censor: boolean$1().optional(),
	vision: boolean$1(),
	reasoning: boolean$1(),
	toolChoice: boolean$1(),
	datasetProcess: boolean$1().optional(),
	usedInClassify: boolean$1().optional(),
	usedInExtractFields: boolean$1().optional(),
	usedInToolCall: boolean$1().optional(),
	useInEvaluation: boolean$1().optional(),
	defaultSystemChatPrompt: string$1().optional(),
	defaultConfig: record(string$1(), any()).optional(),
	fieldMap: record(string$1(), string$1()).optional()
}), o$4 = r$4.extend(i$4.shape).extend({
	type: literal(n$8.embedding),
	defaultToken: number$1(),
	maxToken: number$1(),
	weight: number$1().optional(),
	hidden: boolean$1().optional(),
	normalization: boolean$1().optional(),
	defaultConfig: record(string$1(), any()).optional(),
	dbConfig: record(string$1(), any()).optional(),
	queryConfig: record(string$1(), any()).optional()
}), s$4 = r$4.extend(i$4.shape).extend({ type: literal(n$8.rerank) }), c$4 = r$4.extend(i$4.shape).extend({
	type: literal(n$8.tts),
	voices: array(object({
		label: string$1(),
		value: string$1()
	}))
}), l$3 = r$4.extend(i$4.shape).extend({ type: literal(n$8.stt) }), u$2 = discriminatedUnion(`type`, [
	a$4,
	o$4,
	s$4,
	c$4,
	l$3
]), d$2 = array(u$2);

//#endregion
//#region ../../../../../helpers/dist/models/constants.js
const e = {
	OpenAI: {
		en: `OpenAI`,
		"zh-CN": `OpenAI`,
		"zh-Hant": `OpenAI`
	},
	Claude: {
		en: `Claude`,
		"zh-CN": `Claude`,
		"zh-Hant": `Claude`
	},
	Gemini: {
		en: `Gemini`,
		"zh-CN": `Gemini`,
		"zh-Hant": `Gemini`
	},
	Meta: {
		en: `Meta`,
		"zh-CN": `Meta`,
		"zh-Hant": `Meta`
	},
	MistralAI: {
		en: `MistralAI`,
		"zh-CN": `MistralAI`,
		"zh-Hant": `MistralAI`
	},
	Grok: {
		en: `Grok`,
		"zh-CN": `Grok`,
		"zh-Hant": `Grok`
	},
	Groq: {
		en: `Groq`,
		"zh-CN": `Groq`,
		"zh-Hant": `Groq`
	},
	Jina: {
		en: `Jina`,
		"zh-CN": `Jina`,
		"zh-Hant": `Jina`
	},
	Qwen: {
		en: `Qwen`,
		"zh-CN": `通义千问`,
		"zh-Hant": `通義千問`
	},
	Doubao: {
		en: `Doubao`,
		"zh-CN": `豆包`,
		"zh-Hant": `豆包`
	},
	DeepSeek: {
		en: `DeepSeek`,
		"zh-CN": `深度求索`,
		"zh-Hant": `深度求索`
	},
	ChatGLM: {
		en: `ChatGLM`,
		"zh-CN": `ChatGLM`,
		"zh-Hant": `ChatGLM`
	},
	MiniMax: {
		en: `MiniMax`,
		"zh-CN": `MiniMax`,
		"zh-Hant": `MiniMax`
	},
	Moonshot: {
		en: `Moonshot`,
		"zh-CN": `月之暗面`,
		"zh-Hant": `月之暗面`
	},
	Ernie: {
		en: `Ernie`,
		"zh-CN": `文心一言`,
		"zh-Hant": `文心一言`
	},
	SparkDesk: {
		en: `SparkDesk`,
		"zh-CN": `讯飞星火`,
		"zh-Hant": `訊飛星火`
	},
	Hunyuan: {
		en: `Hunyuan`,
		"zh-CN": `混元`,
		"zh-Hant": `混元`
	},
	Baichuan: {
		en: `Baichuan`,
		"zh-CN": `百川智能`,
		"zh-Hant": `百川智能`
	},
	StepFun: {
		en: `StepFun`,
		"zh-CN": `阶跃星辰`,
		"zh-Hant": `階躍星辰`
	},
	ai360: {
		en: `ai360`,
		"zh-CN": `ai360`,
		"zh-Hant": `ai360`
	},
	Yi: {
		en: `Yi`,
		"zh-CN": `零一万物`,
		"zh-Hant": `零一萬物`
	},
	BAAI: {
		en: `BAAI`,
		"zh-CN": `北京智源`,
		"zh-Hant": `北京智源`
	},
	FishAudio: {
		en: `FishAudio`,
		"zh-CN": `FishAudio`,
		"zh-Hant": `FishAudio`
	},
	InternLM: {
		en: `InternLM`,
		"zh-CN": `书生大模型`,
		"zh-Hant": `書生大模型`
	},
	Moka: {
		en: `Moka`,
		"zh-CN": `Moka`,
		"zh-Hant": `Moka`
	},
	Ollama: {
		en: `Ollama`,
		"zh-CN": `Ollama`,
		"zh-Hant": `Ollama`
	},
	OpenRouter: {
		en: `OpenRouter`,
		"zh-CN": `OpenRouter`,
		"zh-Hant": `OpenRouter`
	},
	vertexai: {
		en: `vertexai`,
		"zh-CN": `vertexai`,
		"zh-Hant": `vertexai`
	},
	novita: {
		en: `novita`,
		"zh-CN": `novita`,
		"zh-Hant": `novita`
	},
	AliCloud: {
		en: `AliCloud`,
		"zh-CN": `阿里云`,
		"zh-Hant": `阿里雲`
	},
	Siliconflow: {
		en: `Siliconflow`,
		"zh-CN": `硅基流动`,
		"zh-Hant": `矽基流動`
	},
	PPIO: {
		en: `PPIO`,
		"zh-CN": `PPIO`,
		"zh-Hant": `PPIO`
	},
	Sangfor: {
		en: `Sangfor`,
		"zh-CN": `深信服`,
		"zh-Hant": `深信服`
	},
	Other: {
		en: `Other`,
		"zh-CN": `其他`,
		"zh-Hant": `其他`
	}
}, t$6 = Object.entries(e).map(([e, t]) => ({
	provider: e,
	value: t
})), n$7 = {
	1: {
		name: `OpenAI`,
		provider: `OpenAI`
	},
	3: {
		name: {
			en: `微软 Azure`,
			"zh-CN": `Azure`,
			"zh-Hant": `Azure`
		},
		avatar: `model/azure`,
		provider: `OpenAI`
	},
	4: {
		name: `azure (弃用)`,
		avatar: `model/azure`,
		provider: `Other`
	},
	14: {
		name: `Anthropic`,
		provider: `Claude`
	},
	12: {
		name: `Google Gemini(OpenAI)`,
		provider: `Gemini`
	},
	24: {
		name: `Google Gemini`,
		provider: `Gemini`
	},
	28: {
		name: `Mistral AI`,
		provider: `MistralAI`
	},
	29: {
		name: `Groq`,
		provider: `Groq`
	},
	17: {
		name: {
			en: `Qwen`,
			"zh-CN": `阿里百炼`,
			"zh-Hant": `阿里百煉`
		},
		provider: `Qwen`
	},
	40: {
		name: {
			en: `Doubao`,
			"zh-CN": `火山引擎（豆包）`,
			"zh-Hant": `火山引擎（豆包）`
		},
		provider: `Doubao`
	},
	36: {
		name: `DeepSeek`,
		provider: `DeepSeek`
	},
	13: {
		name: {
			en: `Ernie V2`,
			"zh-CN": `百度智能云 V2`,
			"zh-Hant": `百度智能云 V2`
		},
		provider: `Ernie`
	},
	15: {
		name: {
			en: `Ernie`,
			"zh-CN": `百度智能云`,
			"zh-Hant": `百度智能云`
		},
		provider: `Ernie`
	},
	16: {
		name: {
			en: `ChatGLM`,
			"zh-CN": `智谱清言`,
			"zh-Hant": `智譜清言`
		},
		provider: `ChatGLM`
	},
	18: {
		name: {
			en: `SparkDesk`,
			"zh-CN": `讯飞星火`,
			"zh-Hant": `訊飛星火`
		},
		provider: `SparkDesk`
	},
	25: {
		name: {
			en: `Moonshot`,
			"zh-CN": `月之暗面`,
			"zh-Hant": `月之暗面`
		},
		provider: `Moonshot`
	},
	26: {
		name: {
			en: `Baichuan`,
			"zh-CN": `百川智能`,
			"zh-Hant": `百川智能`
		},
		provider: `Baichuan`
	},
	27: {
		name: `MiniMax`,
		provider: `MiniMax`
	},
	31: {
		name: {
			en: `Yi`,
			"zh-CN": `零一万物`,
			"zh-Hant": `零一萬物`
		},
		provider: `Yi`
	},
	32: {
		name: {
			en: `StepFun`,
			"zh-CN": `阶跃星辰`,
			"zh-Hant": `階躍星辰`
		},
		provider: `StepFun`
	},
	43: {
		name: {
			en: `Siliconflow`,
			"zh-CN": `硅基流动`,
			"zh-Hant": `矽基流動`
		},
		provider: `Siliconflow`
	},
	30: {
		name: `Ollama`,
		provider: `Ollama`
	},
	23: {
		name: {
			en: `Hunyuan`,
			"zh-CN": `腾讯混元`,
			"zh-Hant": `騰訊混元`
		},
		provider: `Hunyuan`
	},
	44: {
		name: {
			en: `Doubao Audio`,
			"zh-CN": `火山引擎（豆包音频）`,
			"zh-Hant": `火山引擎（豆包音频）`
		},
		provider: `Doubao`
	},
	33: {
		name: `AWS`,
		provider: `Other`,
		avatar: `model/aws`
	},
	35: {
		name: `Cohere`,
		provider: `Other`,
		avatar: `model/cohere`
	},
	37: {
		name: `Cloudflare`,
		provider: `Other`,
		avatar: `model/cloudflare`
	},
	20: {
		name: `OpenRouter`,
		provider: `OpenRouter`
	},
	47: {
		name: `JinaAI`,
		provider: `Jina`
	},
	19: {
		name: `ai360`,
		provider: `ai360`
	},
	42: {
		name: `vertexai`,
		provider: `vertexai`
	},
	41: {
		name: `novita`,
		provider: `novita`
	},
	45: {
		name: `Grok`,
		provider: `Grok`
	},
	46: {
		name: `Doc2X`,
		provider: `Other`,
		avatar: `plugins/doc2x`
	},
	34: {
		name: `Coze`,
		provider: `Other`,
		avatar: `model/coze`
	},
	48: {
		name: `Sangfor`,
		provider: `Sangfor`
	}
};

//#endregion
//#region ../../../../../helpers/dist/workflows/schemas.js
const t$5 = object({
	templateId: string$1().describe(`The unique id of the template`),
	name: string$1().describe(`The name of the template`),
	intro: string$1().describe(`The introduction of the template`),
	avatar: string$1().describe(`The icon of the template`),
	tags: array(string$1()).describe(`The tags of the template`),
	type: string$1().describe(`The type of the template`),
	author: string$1().optional().describe(`The author of the template`),
	isActive: boolean$1().optional().describe(`Whether it is active`),
	userGuide: string$1().optional().describe(`The user guide of the template`),
	isQuickTemplate: boolean$1().optional().describe(`Whether it is a quick template`),
	order: number$1().optional().describe(`The order of the template`),
	weight: number$1().optional().describe(`The weight of the template`),
	workflow: object({
		nodes: array(any()).describe(`The nodes of the template`),
		edges: array(any()).describe(`The edges of the template`),
		chatConfig: any().optional().describe(`The chat config of the template`)
	})
}), n$6 = array(t$5);

//#endregion
//#region ../../../../../helpers/dist/common/schemas/i18n.js
const t$4 = object({
	en: string$1(),
	"zh-CN": string$1().optional(),
	"zh-Hant": string$1().optional()
}), n$5 = object({
	en: string$1(),
	"zh-CN": string$1(),
	"zh-Hant": string$1()
});

//#endregion
//#region ../../../../../helpers/dist/tools/schemas/fastgpt.js
const t$3 = zod_default.enum([
	`reference`,
	`input`,
	`textarea`,
	`numberInput`,
	`switch`,
	`select`,
	`multipleSelect`,
	`JSONEditor`,
	`addInputParam`,
	`selectApp`,
	`customVariable`,
	`selectLLMModel`,
	`settingLLMModel`,
	`selectDataset`,
	`selectDatasetParamsModal`,
	`settingDatasetQuotePrompt`,
	`hidden`,
	`custom`,
	`fileSelect`
]), n$4 = t$3.enum, r$3 = zod_default.enum([
	`string`,
	`number`,
	`boolean`,
	`object`,
	`arrayString`,
	`arrayNumber`,
	`arrayBoolean`,
	`arrayObject`,
	`arrayAny`,
	`any`,
	`chatHistory`,
	`datasetQuote`,
	`dynamic`,
	`selectDataset`,
	`selectApp`
]), i$3 = r$3.enum, a$3 = zod_default.enum([
	`all`,
	`classify`,
	`extractFields`,
	`toolCall`
]), o$3 = a$3.enum, s$3 = zod_default.enum([
	`hidden`,
	`source`,
	`static`,
	`dynamic`,
	`error`
]), c$3 = s$3.enum, l$2 = zod_default.object({
	key: zod_default.string(),
	label: zod_default.string(),
	description: zod_default.string().optional(),
	required: zod_default.boolean().optional(),
	inputType: zod_default.enum([
		`input`,
		`numberInput`,
		`secret`,
		`switch`,
		`select`
	]),
	defaultValue: zod_default.any().optional(),
	list: zod_default.array(zod_default.object({
		label: zod_default.string(),
		value: zod_default.string()
	})).optional()
}), u$1 = zod_default.object({
	key: zod_default.string(),
	label: zod_default.string(),
	referencePlaceholder: zod_default.string().optional(),
	placeholder: zod_default.string().optional(),
	defaultValue: zod_default.any().optional(),
	selectedTypeIndex: zod_default.number().optional(),
	renderTypeList: zod_default.array(t$3),
	valueType: r$3,
	valueDesc: zod_default.string().optional(),
	value: zod_default.unknown().optional(),
	description: zod_default.string().optional(),
	required: zod_default.boolean().optional(),
	toolDescription: zod_default.string().optional(),
	canEdit: zod_default.boolean().optional(),
	isPro: zod_default.boolean().optional(),
	maxLength: zod_default.number().optional(),
	canSelectFile: zod_default.boolean().optional(),
	canSelectImg: zod_default.boolean().optional(),
	maxFiles: zod_default.number().optional(),
	inputList: zod_default.array(l$2).optional(),
	llmModelType: a$3.optional(),
	list: zod_default.array(zod_default.object({
		label: zod_default.string(),
		value: zod_default.string()
	})).optional(),
	markList: zod_default.array(zod_default.object({
		label: zod_default.string(),
		value: zod_default.number()
	})).optional(),
	step: zod_default.number().optional(),
	max: zod_default.number().optional(),
	min: zod_default.number().optional(),
	precision: zod_default.number().optional()
}), d$1 = zod_default.object({
	id: zod_default.string().optional(),
	type: s$3.optional(),
	key: zod_default.string(),
	valueType: r$3,
	valueDesc: zod_default.string().optional(),
	value: zod_default.unknown().optional(),
	label: zod_default.string().optional(),
	description: zod_default.string().optional(),
	defaultValue: zod_default.any().optional(),
	required: zod_default.boolean().optional()
});

//#endregion
//#region ../../../../../helpers/dist/tools/schemas/permission.js
const t$2 = _enum([
	`userInfo:read`,
	`teamInfo:read`,
	`model:read`,
	`dataset:read`
]), n$3 = t$2.enum;

//#endregion
//#region ../../../../../helpers/dist/tools/schemas/tool.js
const i$2 = _enum([
	`tools`,
	`search`,
	`multimodal`,
	`communication`,
	`finance`,
	`design`,
	`productivity`,
	`news`,
	`entertainment`,
	`social`,
	`scientific`,
	`other`
]), a$2 = i$2.enum, o$2 = object({
	value: string$1(),
	description: string$1().optional(),
	inputSchema: any(),
	outputSchema: any()
}), s$2 = object({
	toolId: string$1(),
	parentId: string$1().optional(),
	name: t$4,
	description: t$4,
	toolDescription: string$1(),
	versionList: array(o$2).optional(),
	tags: array(i$2).optional(),
	icon: string$1(),
	author: string$1().optional(),
	tutorialUrl: url().optional(),
	readmeUrl: url().optional(),
	secretInputConfig: array(l$2).optional(),
	handler: any(),
	filename: string$1(),
	etag: string$1().nonempty().optional(),
	permission: array(t$2).optional()
}), c$2 = object({
	...s$2.omit({
		parentId: !0,
		versionList: !0,
		handler: !0
	}).shape,
	toolId: string$1().refine((e) => !e.includes(`/`)),
	children: array(s$2).min(1)
}), l$1 = object({
	...s$2.shape,
	...c$2.shape
}), u = object({
	...c$2.omit({ readmeUrl: !0 }).shape,
	icon: string$1().optional(),
	versionList: array(o$2).optional(),
	children: array(object({
		...s$2.omit({
			parentId: !0,
			readmeUrl: !0
		}).shape,
		icon: string$1().optional()
	})).optional()
}), d = object({
	...s$2.omit({
		filename: !0,
		readmeUrl: !0,
		handler: !0,
		etag: !0,
		parentId: !0
	}).shape,
	toolId: string$1().optional(),
	toolDescription: string$1().optional(),
	versionList: array(o$2).min(1).optional(),
	tags: array(i$2).optional(),
	icon: string$1().optional(),
	author: string$1().optional(),
	tutorialUrl: url().optional(),
	secretInputConfig: array(l$2).optional()
}).transform((e) => ({
	...e,
	toolDescription: e.toolDescription ?? e.description.en
})), f = object({
	...c$2.omit({
		filename: !0,
		etag: !0,
		children: !0,
		readmeUrl: !0
	}).shape,
	toolId: string$1().optional(),
	toolDescription: string$1().optional(),
	tags: array(i$2).optional(),
	icon: string$1().optional(),
	author: string$1().optional(),
	tutorialUrl: url().optional(),
	secretInputConfig: array(l$2).optional()
}), p = l$1.pick({
	toolId: !0,
	parentId: !0,
	name: !0,
	description: !0,
	toolDescription: !0,
	author: !0,
	tags: !0,
	icon: !0,
	tutorialUrl: !0,
	readmeUrl: !0,
	secretInputConfig: !0,
	etag: !0,
	versionList: !0,
	permission: !0
}), m = p.omit({
	secretInputConfig: !0,
	toolDescription: !0,
	versionList: !0
}), h = object({
	name: t$4,
	description: t$4,
	icon: string$1().optional()
}), g = object({
	type: literal(`tool`),
	toolId: string$1().optional(),
	name: t$4,
	description: t$4,
	toolDescription: t$4.optional(),
	version: string$1(),
	versionDescription: t$4.optional(),
	tags: array(i$2).optional(),
	icon: string$1().optional(),
	author: string$1().optional(),
	tutorialUrl: url().optional(),
	secretInputConfig: array(l$2).optional(),
	children: record(string$1(), h).optional()
});

//#endregion
//#region ../../../../../helpers/dist/tools/constants.js
const t$1 = {
	[a$2.tools]: {
		en: `tools`,
		"zh-CN": `工具`,
		"zh-Hant": `工具`
	},
	[a$2.search]: {
		en: `search`,
		"zh-CN": `搜索`,
		"zh-Hant": `搜尋`
	},
	[a$2.multimodal]: {
		en: `multimodal`,
		"zh-CN": `多模态`,
		"zh-Hant": `多模態`
	},
	[a$2.communication]: {
		en: `communication`,
		"zh-CN": `通信`,
		"zh-Hant": `通訊`
	},
	[a$2.finance]: {
		en: `finance`,
		"zh-CN": `金融`,
		"zh-Hant": `金融`
	},
	[a$2.design]: {
		en: `design`,
		"zh-CN": `设计`,
		"zh-Hant": `設計`
	},
	[a$2.productivity]: {
		en: `productivity`,
		"zh-CN": `生产力`,
		"zh-Hant": `生產力`
	},
	[a$2.news]: {
		en: `news`,
		"zh-CN": `新闻`,
		"zh-Hant": `新聞`
	},
	[a$2.entertainment]: {
		en: `entertainment`,
		"zh-CN": `娱乐`,
		"zh-Hant": `娛樂`
	},
	[a$2.social]: {
		en: `social`,
		"zh-CN": `社交`,
		"zh-Hant": `社群`
	},
	[a$2.scientific]: {
		en: `scientific`,
		"zh-CN": `科学`,
		"zh-Hant": `科學`
	},
	[a$2.other]: {
		en: `other`,
		"zh-CN": `其他`,
		"zh-Hant": `其他`
	}
}, n$2 = `system/plugin/tools`, r$2 = `system/plugin/files`;

//#endregion
//#region ../../../../../helpers/dist/tools/schemas/req.js
const t = object({
	error: union([string$1(), record(string$1(), any())]).optional(),
	output: record(string$1(), any()).optional()
}), n$1 = object({
	user: object({
		id: string$1(),
		username: string$1(),
		contact: string$1(),
		membername: string$1(),
		teamName: string$1(),
		teamId: string$1(),
		name: string$1()
	}),
	app: object({
		id: string$1(),
		name: string$1()
	}),
	tool: object({
		id: string$1(),
		version: string$1(),
		prefix: string$1().optional(),
		accessToken: string$1().optional()
	}),
	time: string$1()
}), r$1 = _enum([
	`response`,
	`error`,
	`stream`
]), i$1 = r$1.enum, a$1 = _enum([`answer`, `fastAnswer`]), o$1 = a$1.enum, s$1 = object({
	type: a$1,
	content: string$1()
}), c$1 = discriminatedUnion(`type`, [
	object({
		type: i$1.response,
		data: t
	}),
	object({
		type: i$1.stream,
		data: s$1
	}),
	object({
		type: i$1.error,
		data: string$1()
	})
]);

//#endregion
//#region ../../../../../helpers/dist/datasets/schemas.js
const n = {
	customApi: `custom-api`,
	feishu: `feishu`,
	yuque: `yuque`
}, r = _enum([
	`yuque`,
	`feishu`,
	`custom-api`
]), i = _enum([
	`input`,
	`password`,
	`select`,
	`tree-select`
]), a = object({
	key: string$1(),
	label: t$4,
	type: i,
	required: boolean$1().optional(),
	placeholder: t$4.optional(),
	description: t$4.optional(),
	options: array(object({
		label: t$4,
		value: string$1()
	})).optional()
}), o = object({
	sourceId: r,
	name: t$4,
	icon: string$1(),
	iconOutline: string$1().optional(),
	description: t$4.optional(),
	courseUrl: string$1().optional()
}), s = o.extend({ formFields: array(a) }), c = object({
	id: string$1(),
	rawId: string$1().optional(),
	parentId: string$1().nullable().optional(),
	name: string$1(),
	type: _enum([`file`, `folder`]),
	updateTime: string$1().optional(),
	createTime: string$1().optional(),
	hasChild: boolean$1().optional()
}), l = object({
	title: string$1().optional(),
	rawText: string$1().optional(),
	previewUrl: string$1().optional()
});

//#endregion
//#region .build-temp/src/schemas.ts
const InputSchema = object({});
const OutputSchema = object({});

//#endregion
//#region .build-temp/src/tool.ts
async function handler(_, ctx) {
	await e$1(5e3);
	return {};
}

//#endregion
//#region .build-temp/index.ts
const plugin = new r$5();
plugin.registerTool(n$9(InputSchema, OutputSchema, handler));

//#endregion
export { plugin };
