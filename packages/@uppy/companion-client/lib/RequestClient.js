'use strict';

// eslint-disable-next-line import/no-extraneous-dependencies
let _Symbol$for;
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
import pRetry, { AbortError } from 'p-retry';
import fetchWithNetworkError from '@uppy/utils/lib/fetchWithNetworkError';
import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause';
import emitSocketProgress from '@uppy/utils/lib/emitSocketProgress';
import getSocketHost from '@uppy/utils/lib/getSocketHost';
import AuthError from './AuthError.js';
const packageJson = {
  "version": "3.6.0"
}; // Remove the trailing slash so we can always safely append /xyz.
function stripSlash(url) {
  return url.replace(/\/$/, '');
}
const retryCount = 10; // set to a low number, like 2 to test manual user retries
const socketActivityTimeoutMs = 5 * 60 * 1000; // set to a low number like 10000 to test this

const authErrorStatusCode = 401;
class HttpError extends Error {
  constructor(_ref) {
    let {
      statusCode,
      message
    } = _ref;
    super(message);
    this.statusCode = void 0;
    this.statusCode = statusCode;
  }
}
async function handleJSONResponse(res) {
  if (res.status === authErrorStatusCode) {
    throw new AuthError();
  }
  if (res.ok) {
    return res.json();
  }
  let errMsg = `Failed request with status: ${res.status}. ${res.statusText}`;
  try {
    const errData = await res.json();
    errMsg = errData.message ? `${errMsg} message: ${errData.message}` : errMsg;
    errMsg = errData.requestId ? `${errMsg} request-Id: ${errData.requestId}` : errMsg;
  } catch {
    /* if the response contains invalid JSON, let's ignore the error */
  }
  throw new HttpError({
    statusCode: res.status,
    message: errMsg
  });
}

// todo pull out into core instead?
const allowedHeadersCache = new Map();
var _companionHeaders = /*#__PURE__*/_classPrivateFieldLooseKey("companionHeaders");
var _getUrl = /*#__PURE__*/_classPrivateFieldLooseKey("getUrl");
var _requestSocketToken = /*#__PURE__*/_classPrivateFieldLooseKey("requestSocketToken");
var _awaitRemoteFileUpload = /*#__PURE__*/_classPrivateFieldLooseKey("awaitRemoteFileUpload");
_Symbol$for = Symbol.for('uppy test: getCompanionHeaders');
export default class RequestClient {
  constructor(uppy, opts) {
    /**
     * This method will ensure a websocket for the specified file and returns a promise that resolves
     * when the file has finished downloading, or rejects if it fails.
     * It will retry if the websocket gets disconnected
     * 
     * @param {{ file: UppyFile, queue: RateLimitedQueue, signal: AbortSignal }} file
     */
    Object.defineProperty(this, _awaitRemoteFileUpload, {
      value: _awaitRemoteFileUpload2
    });
    Object.defineProperty(this, _getUrl, {
      value: _getUrl2
    });
    Object.defineProperty(this, _companionHeaders, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _requestSocketToken, {
      writable: true,
      value: async _ref2 => {
        let {
          file,
          postBody,
          signal
        } = _ref2;
        if (file.remote.url == null) {
          throw new Error('Cannot connect to an undefined URL');
        }
        const res = await this.post(file.remote.url, {
          ...file.remote.body,
          ...postBody
        }, signal);
        return res.token;
      }
    });
    this.uppy = uppy;
    this.opts = opts;
    this.onReceiveResponse = this.onReceiveResponse.bind(this);
    _classPrivateFieldLooseBase(this, _companionHeaders)[_companionHeaders] = opts == null ? void 0 : opts.companionHeaders;
  }
  setCompanionHeaders(headers) {
    _classPrivateFieldLooseBase(this, _companionHeaders)[_companionHeaders] = headers;
  }
  [_Symbol$for]() {
    return _classPrivateFieldLooseBase(this, _companionHeaders)[_companionHeaders];
  }
  get hostname() {
    const {
      companion
    } = this.uppy.getState();
    const host = this.opts.companionUrl;
    return stripSlash(companion && companion[host] ? companion[host] : host);
  }
  async headers() {
    const defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Uppy-Versions': `@uppy/companion-client=${RequestClient.VERSION}`
    };
    return {
      ...defaultHeaders,
      ..._classPrivateFieldLooseBase(this, _companionHeaders)[_companionHeaders]
    };
  }
  onReceiveResponse(_ref3) {
    let {
      headers
    } = _ref3;
    const state = this.uppy.getState();
    const companion = state.companion || {};
    const host = this.opts.companionUrl;

    // Store the self-identified domain name for the Companion instance we just hit.
    if (headers.has('i-am') && headers.get('i-am') !== companion[host]) {
      this.uppy.setState({
        companion: {
          ...companion,
          [host]: headers.get('i-am')
        }
      });
    }
  }
  /*
    Preflight was added to avoid breaking change between older Companion-client versions and
    newer Companion versions and vice-versa. Usually the break will manifest via CORS errors because a
    version of companion-client could be sending certain headers to a version of Companion server that
    does not support those headers. In which case, the default preflight would lead to CORS.
    So to avoid those errors, we do preflight ourselves, to see what headers the Companion server
    we are communicating with allows. And based on that, companion-client knows what headers to
    send and what headers to not send.
     The preflight only happens once throughout the life-cycle of a certain
    Companion-client <-> Companion-server pair (allowedHeadersCache).
    Subsequent requests use the cached result of the preflight.
    However if there is an error retrieving the allowed headers, we will try again next time
  */
  async preflight(path) {
    const allowedHeadersCached = allowedHeadersCache.get(this.hostname);
    if (allowedHeadersCached != null) return allowedHeadersCached;
    const fallbackAllowedHeaders = ['accept', 'content-type', 'uppy-auth-token'];
    const promise = (async () => {
      try {
        const response = await fetch(_classPrivateFieldLooseBase(this, _getUrl)[_getUrl](path), {
          method: 'OPTIONS'
        });
        const header = response.headers.get('access-control-allow-headers');
        if (header == null || header === '*') {
          allowedHeadersCache.set(this.hostname, fallbackAllowedHeaders);
          return fallbackAllowedHeaders;
        }
        this.uppy.log(`[CompanionClient] adding allowed preflight headers to companion cache: ${this.hostname} ${header}`);
        const allowedHeaders = header.split(',').map(headerName => headerName.trim().toLowerCase());
        allowedHeadersCache.set(this.hostname, allowedHeaders);
        return allowedHeaders;
      } catch (err) {
        this.uppy.log(`[CompanionClient] unable to make preflight request ${err}`, 'warning');
        // If the user gets a network error or similar, we should try preflight
        // again next time, or else we might get incorrect behaviour.
        allowedHeadersCache.delete(this.hostname); // re-fetch next time
        return fallbackAllowedHeaders;
      }
    })();
    allowedHeadersCache.set(this.hostname, promise);
    return promise;
  }
  async preflightAndHeaders(path) {
    const [allowedHeaders, headers] = await Promise.all([this.preflight(path), this.headers()]);
    // filter to keep only allowed Headers
    return Object.fromEntries(Object.entries(headers).filter(_ref4 => {
      let [header] = _ref4;
      if (!allowedHeaders.includes(header.toLowerCase())) {
        this.uppy.log(`[CompanionClient] excluding disallowed header ${header}`);
        return false;
      }
      return true;
    }));
  }

  /** @protected */
  async request(_ref5) {
    let {
      path,
      method = 'GET',
      data,
      skipPostResponse,
      signal
    } = _ref5;
    try {
      const headers = await this.preflightAndHeaders(path);
      const response = await fetchWithNetworkError(_classPrivateFieldLooseBase(this, _getUrl)[_getUrl](path), {
        method,
        signal,
        headers,
        credentials: this.opts.companionCookiesRule || 'same-origin',
        body: data ? JSON.stringify(data) : null
      });
      if (!skipPostResponse) this.onReceiveResponse(response);
      return await handleJSONResponse(response);
    } catch (err) {
      // pass these through
      if (err instanceof AuthError || err.name === 'AbortError') throw err;
      throw new ErrorWithCause(`Could not ${method} ${_classPrivateFieldLooseBase(this, _getUrl)[_getUrl](path)}`, {
        cause: err
      });
    }
  }
  async get(path, options) {
    if (options === void 0) {
      options = undefined;
    }
    // TODO: remove boolean support for options that was added for backward compatibility.
    // eslint-disable-next-line no-param-reassign
    if (typeof options === 'boolean') options = {
      skipPostResponse: options
    };
    return this.request({
      ...options,
      path
    });
  }
  async post(path, data, options) {
    if (options === void 0) {
      options = undefined;
    }
    // TODO: remove boolean support for options that was added for backward compatibility.
    // eslint-disable-next-line no-param-reassign
    if (typeof options === 'boolean') options = {
      skipPostResponse: options
    };
    return this.request({
      ...options,
      path,
      method: 'POST',
      data
    });
  }
  async delete(path, data, options) {
    if (data === void 0) {
      data = undefined;
    }
    // TODO: remove boolean support for options that was added for backward compatibility.
    // eslint-disable-next-line no-param-reassign
    if (typeof options === 'boolean') options = {
      skipPostResponse: options
    };
    return this.request({
      ...options,
      path,
      method: 'DELETE',
      data
    });
  }

  /**
   * Remote uploading consists of two steps:
   * 1. #requestSocketToken which starts the download/upload in companion and returns a unique token for the upload.
   * Then companion will halt the upload until:
   * 2. #awaitRemoteFileUpload is called, which will open/ensure a websocket connection towards companion, with the
   * previously generated token provided. It returns a promise that will resolve/reject once the file has finished
   * uploading or is otherwise done (failed, canceled)
   * 
   * @param {*} file 
   * @param {*} reqBody 
   * @param {*} options 
   * @returns 
   */
  async uploadRemoteFile(file, reqBody, options) {
    var _this = this;
    if (options === void 0) {
      options = {};
    }
    try {
      const {
        signal,
        getQueue
      } = options;
      return await pRetry(async () => {
        var _this$uppy$getFile;
        // if we already have a serverToken, assume that we are resuming the existing server upload id
        const existingServerToken = (_this$uppy$getFile = this.uppy.getFile(file.id)) == null ? void 0 : _this$uppy$getFile.serverToken;
        if (existingServerToken != null) {
          this.uppy.log(`Connecting to exiting websocket ${existingServerToken}`);
          return _classPrivateFieldLooseBase(this, _awaitRemoteFileUpload)[_awaitRemoteFileUpload]({
            file,
            queue: getQueue(),
            signal
          });
        }
        const queueRequestSocketToken = getQueue().wrapPromiseFunction(async function () {
          try {
            return await _classPrivateFieldLooseBase(_this, _requestSocketToken)[_requestSocketToken](...arguments);
          } catch (outerErr) {
            // throwing AbortError will cause p-retry to stop retrying
            if (outerErr instanceof AuthError) throw new AbortError(outerErr);
            if (outerErr.cause == null) throw outerErr;
            const err = outerErr.cause;
            const isRetryableHttpError = () => [408, 409, 429, 418, 423].includes(err.statusCode) || err.statusCode >= 500 && err.statusCode <= 599 && ![501, 505].includes(err.statusCode);
            if (err instanceof HttpError && !isRetryableHttpError()) throw new AbortError(err);

            // p-retry will retry most other errors,
            // but it will not retry TypeError (except network error TypeErrors)
            throw err;
          }
        }, {
          priority: -1
        });
        const serverToken = await queueRequestSocketToken({
          file,
          postBody: reqBody,
          signal
        }).abortOn(signal);
        if (!this.uppy.getFile(file.id)) return undefined; // has file since been removed?

        this.uppy.setFileState(file.id, {
          serverToken
        });
        return _classPrivateFieldLooseBase(this, _awaitRemoteFileUpload)[_awaitRemoteFileUpload]({
          file: this.uppy.getFile(file.id),
          // re-fetching file because it might have changed in the meantime
          queue: getQueue(),
          signal
        });
      }, {
        retries: retryCount,
        signal,
        onFailedAttempt: err => this.uppy.log(`Retrying upload due to: ${err.message}`, 'warning')
      });
    } catch (err) {
      // this is a bit confusing, but note that an error with the `name` prop set to 'AbortError' (from AbortController)
      // is not the same as `p-retry` `AbortError`
      if (err.name === 'AbortError') {
        // The file upload was aborted, it’s not an error
        return undefined;
      }
      this.uppy.emit('upload-error', file, err);
      throw err;
    }
  }
}
function _getUrl2(url) {
  if (/^(https?:|)\/\//.test(url)) {
    return url;
  }
  return `${this.hostname}/${url}`;
}
async function _awaitRemoteFileUpload2(_ref6) {
  let {
    file,
    queue,
    signal
  } = _ref6;
  let removeEventHandlers;
  const {
    capabilities
  } = this.uppy.getState();
  try {
    return await new Promise((resolve, reject) => {
      const token = file.serverToken;
      const host = getSocketHost(file.remote.companionUrl);

      /** @type {WebSocket} */
      let socket;
      /** @type {AbortController?} */
      let socketAbortController;
      let activityTimeout;
      let {
        isPaused
      } = file;
      const socketSend = (action, payload) => {
        if (socket == null || socket.readyState !== socket.OPEN) {
          var _socket;
          this.uppy.log(`Cannot send "${action}" to socket ${file.id} because the socket state was ${String((_socket = socket) == null ? void 0 : _socket.readyState)}`, 'warning');
          return;
        }
        socket.send(JSON.stringify({
          action,
          payload: payload != null ? payload : {}
        }));
      };
      function sendState() {
        if (!capabilities.resumableUploads) return;
        if (isPaused) socketSend('pause');else socketSend('resume');
      }
      const createWebsocket = async () => {
        if (socketAbortController) socketAbortController.abort();
        socketAbortController = new AbortController();
        const onFatalError = err => {
          var _socketAbortControlle;
          // Remove the serverToken so that a new one will be created for the retry.
          this.uppy.setFileState(file.id, {
            serverToken: null
          });
          (_socketAbortControlle = socketAbortController) == null || _socketAbortControlle.abort == null ? void 0 : _socketAbortControlle.abort();
          reject(err);
        };

        // todo instead implement the ability for users to cancel / retry *currently uploading files* in the UI
        function resetActivityTimeout() {
          clearTimeout(activityTimeout);
          if (isPaused) return;
          activityTimeout = setTimeout(() => onFatalError(new Error('Timeout waiting for message from Companion socket')), socketActivityTimeoutMs);
        }
        try {
          await queue.wrapPromiseFunction(async () => {
            // eslint-disable-next-line promise/param-names
            const reconnectWebsocket = async () => new Promise((resolveSocket, rejectSocket) => {
              socket = new WebSocket(`${host}/api/${token}`);
              resetActivityTimeout();
              socket.addEventListener('close', () => {
                socket = undefined;
                rejectSocket(new Error('Socket closed unexpectedly'));
              });
              socket.addEventListener('error', error => {
                this.uppy.log(`Companion socket error ${JSON.stringify(error)}, closing socket`, 'warning');
                socket.close(); // will 'close' event to be emitted
              });

              socket.addEventListener('open', () => {
                sendState();
              });
              socket.addEventListener('message', e => {
                resetActivityTimeout();
                try {
                  const {
                    action,
                    payload
                  } = JSON.parse(e.data);
                  switch (action) {
                    case 'progress':
                      {
                        emitSocketProgress(this, payload, file);
                        break;
                      }
                    case 'success':
                      {
                        var _socketAbortControlle2;
                        this.uppy.emit('upload-success', file, {
                          uploadURL: payload.url
                        });
                        (_socketAbortControlle2 = socketAbortController) == null || _socketAbortControlle2.abort == null ? void 0 : _socketAbortControlle2.abort();
                        resolve();
                        break;
                      }
                    case 'error':
                      {
                        const {
                          message
                        } = payload.error;
                        throw Object.assign(new Error(message), {
                          cause: payload.error
                        });
                      }
                    default:
                      this.uppy.log(`Companion socket unknown action ${action}`, 'warning');
                  }
                } catch (err) {
                  onFatalError(err);
                }
              });
              const closeSocket = () => {
                this.uppy.log(`Closing socket ${file.id}`, 'info');
                clearTimeout(activityTimeout);
                if (socket) socket.close();
                socket = undefined;
              };
              socketAbortController.signal.addEventListener('abort', () => {
                closeSocket();
              });
            });
            await pRetry(reconnectWebsocket, {
              retries: retryCount,
              signal: socketAbortController.signal,
              onFailedAttempt: () => {
                if (socketAbortController.signal.aborted) return; // don't log in this case
                this.uppy.log(`Retrying websocket ${file.id}`, 'info');
              }
            });
          })().abortOn(socketAbortController.signal);
        } catch (err) {
          if (socketAbortController.signal.aborted) return;
          onFatalError(err);
        }
      };
      const pause = newPausedState => {
        if (!capabilities.resumableUploads) return;
        isPaused = newPausedState;
        if (socket) sendState();
        if (newPausedState) {
          var _socketAbortControlle3;
          // Remove this file from the queue so another file can start in its place.
          (_socketAbortControlle3 = socketAbortController) == null || _socketAbortControlle3.abort == null ? void 0 : _socketAbortControlle3.abort(); // close socket to free up the request for other uploads
        } else {
          // Resuming an upload should be queued, else you could pause and then
          // resume a queued upload to make it skip the queue.
          createWebsocket();
        }
      };
      const onFileRemove = targetFile => {
        var _socketAbortControlle4;
        if (!capabilities.individualCancellation) return;
        if (targetFile.id !== file.id) return;
        socketSend('cancel');
        (_socketAbortControlle4 = socketAbortController) == null || _socketAbortControlle4.abort == null ? void 0 : _socketAbortControlle4.abort();
        this.uppy.log(`upload ${file.id} was removed`, 'info');
        resolve();
      };
      const onCancelAll = _ref7 => {
        var _socketAbortControlle5;
        let {
          reason
        } = _ref7;
        if (reason === 'user') {
          socketSend('cancel');
        }
        (_socketAbortControlle5 = socketAbortController) == null || _socketAbortControlle5.abort == null ? void 0 : _socketAbortControlle5.abort();
        this.uppy.log(`upload ${file.id} was canceled`, 'info');
        resolve();
      };
      const onFilePausedChange = (targetFileId, newPausedState) => {
        if (targetFileId !== file.id) return;
        pause(newPausedState);
      };
      const onPauseAll = () => pause(true);
      const onResumeAll = () => pause(false);
      this.uppy.on('file-removed', onFileRemove);
      this.uppy.on('cancel-all', onCancelAll);
      this.uppy.on('upload-pause', onFilePausedChange);
      this.uppy.on('pause-all', onPauseAll);
      this.uppy.on('resume-all', onResumeAll);
      removeEventHandlers = () => {
        this.uppy.off('file-removed', onFileRemove);
        this.uppy.off('cancel-all', onCancelAll);
        this.uppy.off('upload-pause', onFilePausedChange);
        this.uppy.off('pause-all', onPauseAll);
        this.uppy.off('resume-all', onResumeAll);
      };
      signal.addEventListener('abort', () => {
        var _socketAbortControlle6;
        (_socketAbortControlle6 = socketAbortController) == null ? void 0 : _socketAbortControlle6.abort();
      });
      createWebsocket();
    });
  } finally {
    removeEventHandlers == null ? void 0 : removeEventHandlers();
  }
}
RequestClient.VERSION = packageJson.version;