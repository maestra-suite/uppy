function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

const {
  AbortController,
  createAbortError
} = require('@uppy/utils/lib/AbortController');

const delay = require('@uppy/utils/lib/delay');

const MB = 1024 * 1024;
const defaultOptions = {
  limit: 1,
  retryDelays: [0, 1000, 3000, 5000],

  getChunkSize(file) {
    return Math.ceil(file.size / 10000);
  },

  onStart() {},

  onProgress() {},

  onPartComplete() {},

  onSuccess() {},

  onError(err) {
    throw err;
  }

};

function ensureInt(value) {
  if (typeof value === 'string') {
    return parseInt(value, 10);
  }

  if (typeof value === 'number') {
    return value;
  }

  throw new TypeError('Expected a number');
}

var _aborted = /*#__PURE__*/_classPrivateFieldLooseKey("aborted");

var _initChunks = /*#__PURE__*/_classPrivateFieldLooseKey("initChunks");

var _createUpload = /*#__PURE__*/_classPrivateFieldLooseKey("createUpload");

var _resumeUpload = /*#__PURE__*/_classPrivateFieldLooseKey("resumeUpload");

var _uploadParts = /*#__PURE__*/_classPrivateFieldLooseKey("uploadParts");

var _retryable = /*#__PURE__*/_classPrivateFieldLooseKey("retryable");

var _prepareUploadParts = /*#__PURE__*/_classPrivateFieldLooseKey("prepareUploadParts");

var _uploadPartRetryable = /*#__PURE__*/_classPrivateFieldLooseKey("uploadPartRetryable");

var _uploadPart = /*#__PURE__*/_classPrivateFieldLooseKey("uploadPart");

var _onPartProgress = /*#__PURE__*/_classPrivateFieldLooseKey("onPartProgress");

var _onPartComplete = /*#__PURE__*/_classPrivateFieldLooseKey("onPartComplete");

var _uploadPartBytes = /*#__PURE__*/_classPrivateFieldLooseKey("uploadPartBytes");

var _completeUpload = /*#__PURE__*/_classPrivateFieldLooseKey("completeUpload");

var _abortUpload = /*#__PURE__*/_classPrivateFieldLooseKey("abortUpload");

var _onError = /*#__PURE__*/_classPrivateFieldLooseKey("onError");

class MultipartUploader {
  constructor(file, options) {
    Object.defineProperty(this, _onError, {
      value: _onError2
    });
    Object.defineProperty(this, _abortUpload, {
      value: _abortUpload2
    });
    Object.defineProperty(this, _completeUpload, {
      value: _completeUpload2
    });
    Object.defineProperty(this, _uploadPartBytes, {
      value: _uploadPartBytes2
    });
    Object.defineProperty(this, _onPartComplete, {
      value: _onPartComplete2
    });
    Object.defineProperty(this, _onPartProgress, {
      value: _onPartProgress2
    });
    Object.defineProperty(this, _uploadPart, {
      value: _uploadPart2
    });
    Object.defineProperty(this, _uploadPartRetryable, {
      value: _uploadPartRetryable2
    });
    Object.defineProperty(this, _prepareUploadParts, {
      value: _prepareUploadParts2
    });
    Object.defineProperty(this, _retryable, {
      value: _retryable2
    });
    Object.defineProperty(this, _uploadParts, {
      value: _uploadParts2
    });
    Object.defineProperty(this, _resumeUpload, {
      value: _resumeUpload2
    });
    Object.defineProperty(this, _createUpload, {
      value: _createUpload2
    });
    Object.defineProperty(this, _initChunks, {
      value: _initChunks2
    });
    Object.defineProperty(this, _aborted, {
      value: _aborted2
    });
    this.options = { ...defaultOptions,
      ...options
    }; // Use default `getChunkSize` if it was null or something

    if (!this.options.getChunkSize) {
      this.options.getChunkSize = defaultOptions.getChunkSize;
    }

    this.file = file;
    this.abortController = new AbortController();
    this.key = this.options.key || null;
    this.uploadId = this.options.uploadId || null;
    this.parts = []; // Do `this.createdPromise.then(OP)` to execute an operation `OP` _only_ if the
    // upload was created already. That also ensures that the sequencing is right
    // (so the `OP` definitely happens if the upload is created).
    //
    // This mostly exists to make `#abortUpload` work well: only sending the abort request if
    // the upload was already created, and if the createMultipartUpload request is still in flight,
    // aborting it immediately after it finishes.

    this.createdPromise = Promise.reject(); // eslint-disable-line prefer-promise-reject-errors

    this.isPaused = false;
    this.partsInProgress = 0;
    this.chunks = null;
    this.chunkState = null;

    _classPrivateFieldLooseBase(this, _initChunks)[_initChunks]();

    this.createdPromise.catch(() => {}); // silence uncaught rejection warning
  }
  /**
   * Was this upload aborted?
   *
   * If yes, we may need to throw an AbortError.
   *
   * @returns {boolean}
   */


  start() {
    this.isPaused = false;

    if (this.uploadId) {
      _classPrivateFieldLooseBase(this, _resumeUpload)[_resumeUpload]();
    } else {
      _classPrivateFieldLooseBase(this, _createUpload)[_createUpload]();
    }
  }

  pause() {
    this.abortController.abort(); // Swap it out for a new controller, because this instance may be resumed later.

    this.abortController = new AbortController();
    this.isPaused = true;
  }

  abort(opts) {
    var _opts;

    if (opts === void 0) {
      opts = undefined;
    }

    if ((_opts = opts) != null && _opts.really) _classPrivateFieldLooseBase(this, _abortUpload)[_abortUpload]();else this.pause();
  }

}

function _aborted2() {
  return this.abortController.signal.aborted;
}

function _initChunks2() {
  const chunks = [];
  const desiredChunkSize = this.options.getChunkSize(this.file); // at least 5MB per request, at most 10k requests

  const minChunkSize = Math.max(5 * MB, Math.ceil(this.file.size / 10000));
  const chunkSize = Math.max(desiredChunkSize, minChunkSize); // Upload zero-sized files in one zero-sized chunk

  if (this.file.size === 0) {
    chunks.push(this.file);
  } else {
    for (let i = 0; i < this.file.size; i += chunkSize) {
      const end = Math.min(this.file.size, i + chunkSize);
      chunks.push(this.file.slice(i, end));
    }
  }

  this.chunks = chunks;
  this.chunkState = chunks.map(() => ({
    uploaded: 0,
    busy: false,
    done: false
  }));
}

function _createUpload2() {
  this.createdPromise = Promise.resolve().then(() => this.options.createMultipartUpload());
  return this.createdPromise.then(result => {
    if (_classPrivateFieldLooseBase(this, _aborted)[_aborted]()) throw createAbortError();
    const valid = typeof result === 'object' && result && typeof result.uploadId === 'string' && typeof result.key === 'string';

    if (!valid) {
      throw new TypeError('AwsS3/Multipart: Got incorrect result from `createMultipartUpload()`, expected an object `{ uploadId, key }`.');
    }

    this.key = result.key;
    this.uploadId = result.uploadId;
    this.options.onStart(result);

    _classPrivateFieldLooseBase(this, _uploadParts)[_uploadParts]();
  }).catch(err => {
    _classPrivateFieldLooseBase(this, _onError)[_onError](err);
  });
}

async function _resumeUpload2() {
  try {
    const parts = await this.options.listParts({
      uploadId: this.uploadId,
      key: this.key
    });
    if (_classPrivateFieldLooseBase(this, _aborted)[_aborted]()) throw createAbortError();
    parts.forEach(part => {
      const i = part.PartNumber - 1;
      this.chunkState[i] = {
        uploaded: ensureInt(part.Size),
        etag: part.ETag,
        done: true
      }; // Only add if we did not yet know about this part.

      if (!this.parts.some(p => p.PartNumber === part.PartNumber)) {
        this.parts.push({
          PartNumber: part.PartNumber,
          ETag: part.ETag
        });
      }
    });

    _classPrivateFieldLooseBase(this, _uploadParts)[_uploadParts]();
  } catch (err) {
    _classPrivateFieldLooseBase(this, _onError)[_onError](err);
  }
}

function _uploadParts2() {
  if (this.isPaused) return; // All parts are uploaded.

  if (this.chunkState.every(state => state.done)) {
    _classPrivateFieldLooseBase(this, _completeUpload)[_completeUpload]();

    return;
  } // For a 100MB file, with the default min chunk size of 5MB and a limit of 10:
  //
  // Total 20 parts
  // ---------
  // Need 1 is 10
  // Need 2 is 5
  // Need 3 is 5


  const need = this.options.limit - this.partsInProgress;
  const completeChunks = this.chunkState.filter(state => state.done).length;
  const remainingChunks = this.chunks.length - completeChunks;
  let minNeeded = Math.ceil(this.options.limit / 2);

  if (minNeeded > remainingChunks) {
    minNeeded = remainingChunks;
  }

  if (need < minNeeded) return;
  const candidates = [];

  for (let i = 0; i < this.chunkState.length; i++) {
    const state = this.chunkState[i]; // eslint-disable-next-line no-continue

    if (state.done || state.busy) continue;
    candidates.push(i);

    if (candidates.length >= need) {
      break;
    }
  }

  if (candidates.length === 0) return;

  _classPrivateFieldLooseBase(this, _prepareUploadParts)[_prepareUploadParts](candidates).then(result => {
    candidates.forEach(index => {
      const partNumber = index + 1;
      const prePreparedPart = {
        url: result.presignedUrls[partNumber],
        headers: result.headers
      };

      _classPrivateFieldLooseBase(this, _uploadPartRetryable)[_uploadPartRetryable](index, prePreparedPart).then(() => {
        _classPrivateFieldLooseBase(this, _uploadParts)[_uploadParts]();
      }, err => {
        _classPrivateFieldLooseBase(this, _onError)[_onError](err);
      });
    });
  });
}

function _retryable2(_ref) {
  let {
    before,
    attempt,
    after
  } = _ref;
  const {
    retryDelays
  } = this.options;
  const {
    signal
  } = this.abortController;
  if (before) before();

  function shouldRetry(err) {
    if (err.source && typeof err.source.status === 'number') {
      const {
        status
      } = err.source; // 0 probably indicates network failure

      return status === 0 || status === 409 || status === 423 || status >= 500 && status < 600;
    }

    return false;
  }

  const doAttempt = retryAttempt => attempt().catch(err => {
    if (_classPrivateFieldLooseBase(this, _aborted)[_aborted]()) throw createAbortError();

    if (shouldRetry(err) && retryAttempt < retryDelays.length) {
      return delay(retryDelays[retryAttempt], {
        signal
      }).then(() => doAttempt(retryAttempt + 1));
    }

    throw err;
  });

  return doAttempt(0).then(result => {
    if (after) after();
    return result;
  }, err => {
    if (after) after();
    throw err;
  });
}

async function _prepareUploadParts2(candidates) {
  candidates.forEach(i => {
    this.chunkState[i].busy = true;
  });
  const result = await _classPrivateFieldLooseBase(this, _retryable)[_retryable]({
    attempt: () => this.options.prepareUploadParts({
      key: this.key,
      uploadId: this.uploadId,
      partNumbers: candidates.map(index => index + 1),
      chunks: candidates.reduce((chunks, candidate) => ({ ...chunks,
        // Use the part number as the index
        [candidate + 1]: this.chunks[candidate]
      }), {})
    })
  });

  if (typeof (result == null ? void 0 : result.presignedUrls) !== 'object') {
    throw new TypeError('AwsS3/Multipart: Got incorrect result from `prepareUploadParts()`, expected an object `{ presignedUrls }`.');
  }

  return result;
}

function _uploadPartRetryable2(index, prePreparedPart) {
  return _classPrivateFieldLooseBase(this, _retryable)[_retryable]({
    before: () => {
      this.partsInProgress += 1;
    },
    attempt: () => _classPrivateFieldLooseBase(this, _uploadPart)[_uploadPart](index, prePreparedPart),
    after: () => {
      this.partsInProgress -= 1;
    }
  });
}

function _uploadPart2(index, prePreparedPart) {
  this.chunkState[index].busy = true;
  const valid = typeof (prePreparedPart == null ? void 0 : prePreparedPart.url) === 'string';

  if (!valid) {
    throw new TypeError('AwsS3/Multipart: Got incorrect result for `prePreparedPart`, expected an object `{ url }`.');
  }

  const {
    url,
    headers
  } = prePreparedPart;

  if (_classPrivateFieldLooseBase(this, _aborted)[_aborted]()) {
    this.chunkState[index].busy = false;
    throw createAbortError();
  }

  return _classPrivateFieldLooseBase(this, _uploadPartBytes)[_uploadPartBytes](index, url, headers);
}

function _onPartProgress2(index, sent) {
  this.chunkState[index].uploaded = ensureInt(sent);
  const totalUploaded = this.chunkState.reduce((n, c) => n + c.uploaded, 0);
  this.options.onProgress(totalUploaded, this.file.size);
}

function _onPartComplete2(index, etag) {
  this.chunkState[index].etag = etag;
  this.chunkState[index].done = true;
  const part = {
    PartNumber: index + 1,
    ETag: etag
  };
  this.parts.push(part);
  this.options.onPartComplete(part);
}

function _uploadPartBytes2(index, url, headers) {
  const body = this.chunks[index];
  const {
    signal
  } = this.abortController;
  let defer;
  const promise = new Promise((resolve, reject) => {
    defer = {
      resolve,
      reject
    };
  });
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', url, true);

  if (headers) {
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key]);
    });
  }

  xhr.responseType = 'text';

  function cleanup() {
    // eslint-disable-next-line no-use-before-define
    signal.removeEventListener('abort', onabort);
  }

  function onabort() {
    xhr.abort();
  }

  signal.addEventListener('abort', onabort);
  xhr.upload.addEventListener('progress', ev => {
    if (!ev.lengthComputable) return;

    _classPrivateFieldLooseBase(this, _onPartProgress)[_onPartProgress](index, ev.loaded, ev.total);
  });
  xhr.addEventListener('abort', () => {
    cleanup();
    this.chunkState[index].busy = false;
    defer.reject(createAbortError());
  });
  xhr.addEventListener('load', ev => {
    cleanup();
    this.chunkState[index].busy = false;

    if (ev.target.status < 200 || ev.target.status >= 300) {
      const error = new Error('Non 2xx');
      error.source = ev.target;
      defer.reject(error);
      return;
    } // This avoids the net::ERR_OUT_OF_MEMORY in Chromium Browsers.


    this.chunks[index] = null;

    _classPrivateFieldLooseBase(this, _onPartProgress)[_onPartProgress](index, body.size, body.size); // NOTE This must be allowed by CORS.


    const etag = ev.target.getResponseHeader('ETag');

    if (etag === null) {
      defer.reject(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'));
      return;
    }

    _classPrivateFieldLooseBase(this, _onPartComplete)[_onPartComplete](index, etag);

    defer.resolve();
  });
  xhr.addEventListener('error', ev => {
    cleanup();
    this.chunkState[index].busy = false;
    const error = new Error('Unknown error');
    error.source = ev.target;
    defer.reject(error);
  });
  xhr.send(body);
  return promise;
}

async function _completeUpload2() {
  // Parts may not have completed uploading in sorted order, if limit > 1.
  this.parts.sort((a, b) => a.PartNumber - b.PartNumber);

  try {
    const result = await this.options.completeMultipartUpload({
      key: this.key,
      uploadId: this.uploadId,
      parts: this.parts
    });
    this.options.onSuccess(result);
  } catch (err) {
    _classPrivateFieldLooseBase(this, _onError)[_onError](err);
  }
}

function _abortUpload2() {
  this.abortController.abort();
  this.createdPromise.then(() => {
    this.options.abortMultipartUpload({
      key: this.key,
      uploadId: this.uploadId
    });
  }, () => {// if the creation failed we do not need to abort
  });
}

function _onError2(err) {
  if (err && err.name === 'AbortError') {
    return;
  }

  this.options.onError(err);
}

module.exports = MultipartUploader;