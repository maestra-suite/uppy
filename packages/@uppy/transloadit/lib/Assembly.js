function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
import Emitter from 'component-emitter';
import has from '@uppy/utils/lib/hasProperty';
import NetworkError from '@uppy/utils/lib/NetworkError';
import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError';
const ASSEMBLY_UPLOADING = 'ASSEMBLY_UPLOADING';
const ASSEMBLY_EXECUTING = 'ASSEMBLY_EXECUTING';
const ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED';
const statusOrder = [ASSEMBLY_UPLOADING, ASSEMBLY_EXECUTING, ASSEMBLY_COMPLETED];

/**
 * Check that an assembly status is equal to or larger than some desired status.
 * It checks for things that are larger so that a comparison like this works,
 * when the old assembly status is UPLOADING but the new is FINISHED:
 *
 * !isStatus(oldStatus, ASSEMBLY_EXECUTING) && isStatus(newState, ASSEMBLY_EXECUTING)
 *
 * …so that we can emit the 'executing' event even if the execution step was so
 * fast that we missed it.
 */
function isStatus(status, test) {
  return statusOrder.indexOf(status) >= statusOrder.indexOf(test);
}
var _rateLimitedQueue = /*#__PURE__*/_classPrivateFieldLooseKey("rateLimitedQueue");
var _fetchWithNetworkError = /*#__PURE__*/_classPrivateFieldLooseKey("fetchWithNetworkError");
var _previousFetchStatusStillPending = /*#__PURE__*/_classPrivateFieldLooseKey("previousFetchStatusStillPending");
var _sse = /*#__PURE__*/_classPrivateFieldLooseKey("sse");
var _onFinished = /*#__PURE__*/_classPrivateFieldLooseKey("onFinished");
var _connectServerSentEvents = /*#__PURE__*/_classPrivateFieldLooseKey("connectServerSentEvents");
var _onError = /*#__PURE__*/_classPrivateFieldLooseKey("onError");
var _beginPolling = /*#__PURE__*/_classPrivateFieldLooseKey("beginPolling");
var _fetchStatus = /*#__PURE__*/_classPrivateFieldLooseKey("fetchStatus");
var _diffStatus = /*#__PURE__*/_classPrivateFieldLooseKey("diffStatus");
class TransloaditAssembly extends Emitter {
  constructor(assembly, rateLimitedQueue) {
    super();

    // The current assembly status.
    /**
     * Diff two assembly statuses, and emit the events necessary to go from `prev`
     * to `next`.
     *
     * @param {object} prev The previous assembly status.
     * @param {object} next The new assembly status.
     */
    Object.defineProperty(this, _diffStatus, {
      value: _diffStatus2
    });
    /**
     * Reload assembly status. Useful if SSE doesn't work.
     *
     * Pass `diff: false` to avoid emitting diff events, instead only emitting
     * 'status'.
     */
    Object.defineProperty(this, _fetchStatus, {
      value: _fetchStatus2
    });
    /**
     * Begin polling for assembly status changes. This sends a request to the
     * assembly status endpoint every so often, if SSE connection failed.
     * If the SSE connection fails or takes a long time, we won't miss any
     * events.
     */
    Object.defineProperty(this, _beginPolling, {
      value: _beginPolling2
    });
    Object.defineProperty(this, _onError, {
      value: _onError2
    });
    Object.defineProperty(this, _connectServerSentEvents, {
      value: _connectServerSentEvents2
    });
    Object.defineProperty(this, _onFinished, {
      value: _onFinished2
    });
    Object.defineProperty(this, _rateLimitedQueue, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _fetchWithNetworkError, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _previousFetchStatusStillPending, {
      writable: true,
      value: false
    });
    Object.defineProperty(this, _sse, {
      writable: true,
      value: void 0
    });
    this.status = assembly;
    // The interval timer for full status updates.
    this.pollInterval = null;
    // Whether this assembly has been closed (finished or errored)
    this.closed = false;
    _classPrivateFieldLooseBase(this, _rateLimitedQueue)[_rateLimitedQueue] = rateLimitedQueue;
    _classPrivateFieldLooseBase(this, _fetchWithNetworkError)[_fetchWithNetworkError] = rateLimitedQueue.wrapPromiseFunction(fetchWithNetworkError);
  }
  connect() {
    _classPrivateFieldLooseBase(this, _connectServerSentEvents)[_connectServerSentEvents]();
    _classPrivateFieldLooseBase(this, _beginPolling)[_beginPolling]();
  }
  update() {
    return _classPrivateFieldLooseBase(this, _fetchStatus)[_fetchStatus]({
      diff: true
    });
  }

  /**
   * Update this assembly's status with a full new object. Events will be
   * emitted for status changes, new files, and new results.
   *
   * @param {object} next The new assembly status object.
   */
  updateStatus(next) {
    _classPrivateFieldLooseBase(this, _diffStatus)[_diffStatus](this.status, next);
    this.status = next;
  }
  /**
   * Stop updating this assembly.
   */
  close() {
    this.closed = true;
    if (_classPrivateFieldLooseBase(this, _sse)[_sse]) {
      _classPrivateFieldLooseBase(this, _sse)[_sse].close();
      _classPrivateFieldLooseBase(this, _sse)[_sse] = null;
    }
    clearInterval(this.pollInterval);
    this.pollInterval = null;
  }
}
function _onFinished2() {
  this.emit('finished');
  this.close();
}
function _connectServerSentEvents2() {
  _classPrivateFieldLooseBase(this, _sse)[_sse] = new EventSource(`${this.status.websocket_url}?assembly=${this.status.assembly_id}`);
  _classPrivateFieldLooseBase(this, _sse)[_sse].addEventListener('open', () => {
    // if server side events works, we don't need websockets anymore (it's just a fallback)
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    clearInterval(this.pollInterval);
    this.pollInterval = null;
  });

  /*
   * The event "message" is a special case, as it
   * will capture events without an event field
   * as well as events that have the specific type
   * other event type.
   */
  _classPrivateFieldLooseBase(this, _sse)[_sse].addEventListener('message', e => {
    if (e.data === 'assembly_finished') {
      _classPrivateFieldLooseBase(this, _onFinished)[_onFinished]();
    }
    if (e.data === 'assembly_uploading_finished') {
      this.emit('executing');
    }
    if (e.data === 'assembly_upload_meta_data_extracted') {
      this.emit('metadata');
      _classPrivateFieldLooseBase(this, _fetchStatus)[_fetchStatus]({
        diff: false
      });
    }
  });
  _classPrivateFieldLooseBase(this, _sse)[_sse].addEventListener('assembly_upload_finished', e => {
    const file = JSON.parse(e.data);
    this.emit('upload', file);
    this.status.uploads.push(file);
  });
  _classPrivateFieldLooseBase(this, _sse)[_sse].addEventListener('assembly_result_finished', e => {
    var _this$status$results, _this$status$results$;
    const [stepName, result] = JSON.parse(e.data);
    this.emit('result', stepName, result);
    ((_this$status$results$ = (_this$status$results = this.status.results)[stepName]) != null ? _this$status$results$ : _this$status$results[stepName] = []).push(result);
  });
  _classPrivateFieldLooseBase(this, _sse)[_sse].addEventListener('assembly_execution_progress', e => {
    const details = JSON.parse(e.data);
    this.emit('execution-progress', details);
  });
  _classPrivateFieldLooseBase(this, _sse)[_sse].addEventListener('assembly_error', e => {
    try {
      _classPrivateFieldLooseBase(this, _onError)[_onError](JSON.parse(e.data));
    } catch {
      _classPrivateFieldLooseBase(this, _onError)[_onError]({
        msg: e.data
      });
    }
    // Refetch for updated status code
    _classPrivateFieldLooseBase(this, _fetchStatus)[_fetchStatus]({
      diff: false
    });
  });
}
function _onError2(status) {
  this.emit('error', Object.assign(new Error(status.msg), status));
  this.close();
}
function _beginPolling2() {
  this.pollInterval = setInterval(() => {
    _classPrivateFieldLooseBase(this, _fetchStatus)[_fetchStatus]();
  }, 2000);
}
async function _fetchStatus2(_temp) {
  let {
    diff = true
  } = _temp === void 0 ? {} : _temp;
  if (this.closed || _classPrivateFieldLooseBase(this, _rateLimitedQueue)[_rateLimitedQueue].isPaused || _classPrivateFieldLooseBase(this, _previousFetchStatusStillPending)[_previousFetchStatusStillPending]) return;
  try {
    _classPrivateFieldLooseBase(this, _previousFetchStatusStillPending)[_previousFetchStatusStillPending] = true;
    const response = await _classPrivateFieldLooseBase(this, _fetchWithNetworkError)[_fetchWithNetworkError](this.status.assembly_ssl_url);
    _classPrivateFieldLooseBase(this, _previousFetchStatusStillPending)[_previousFetchStatusStillPending] = false;
    if (this.closed) return;
    if (response.status === 429) {
      _classPrivateFieldLooseBase(this, _rateLimitedQueue)[_rateLimitedQueue].rateLimit(2000);
      return;
    }
    if (!response.ok) {
      _classPrivateFieldLooseBase(this, _onError)[_onError](new NetworkError(response.statusText));
      return;
    }
    const status = await response.json();
    // Avoid updating if we closed during this request's lifetime.
    if (this.closed) return;
    this.emit('status', status);
    if (diff) {
      this.updateStatus(status);
    } else {
      this.status = status;
    }
  } catch (err) {
    _classPrivateFieldLooseBase(this, _onError)[_onError](err);
  }
}
function _diffStatus2(prev, next) {
  const prevStatus = prev.ok;
  const nextStatus = next.ok;
  if (next.error && !prev.error) {
    return _classPrivateFieldLooseBase(this, _onError)[_onError](next);
  }

  // Desired emit order:
  //  - executing
  //  - (n × upload)
  //  - metadata
  //  - (m × result)
  //  - finished
  // The below checks run in this order, that way even if we jump from
  // UPLOADING straight to FINISHED all the events are emitted as expected.

  const nowExecuting = isStatus(nextStatus, ASSEMBLY_EXECUTING) && !isStatus(prevStatus, ASSEMBLY_EXECUTING);
  if (nowExecuting) {
    // Without SSE, this is our only way to tell if uploading finished.
    // Hence, we emit this just before the 'upload's and before the 'metadata'
    // event for the most intuitive ordering, corresponding to the _usual_
    // ordering (if not guaranteed) that you'd get on SSE.
    this.emit('executing');
  }

  // Find new uploaded files.
  Object.keys(next.uploads).filter(upload => !has(prev.uploads, upload)).forEach(upload => {
    this.emit('upload', next.uploads[upload]);
  });
  if (nowExecuting) {
    this.emit('metadata');
  }

  // Find new results.
  Object.keys(next.results).forEach(stepName => {
    const nextResults = next.results[stepName];
    const prevResults = prev.results[stepName];
    nextResults.filter(n => !prevResults || !prevResults.some(p => p.id === n.id)).forEach(result => {
      this.emit('result', stepName, result);
    });
  });
  if (isStatus(nextStatus, ASSEMBLY_COMPLETED) && !isStatus(prevStatus, ASSEMBLY_COMPLETED)) {
    this.emit('finished');
  }
  return undefined;
}
export default TransloaditAssembly;