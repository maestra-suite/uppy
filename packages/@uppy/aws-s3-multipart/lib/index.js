let _Symbol$for;
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
import BasePlugin from '@uppy/core/lib/BasePlugin.js';
import { RequestClient } from '@uppy/companion-client';
import EventManager from '@uppy/utils/lib/EventManager';
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue';
import { filterNonFailedFiles, filterFilesToEmitUploadStarted } from '@uppy/utils/lib/fileFilters';
import { createAbortError } from '@uppy/utils/lib/AbortController';
import MultipartUploader, { pausingUploadReason } from './MultipartUploader.js';
import createSignedURL from './createSignedURL.js';
const packageJson = {
  "version": "3.9.0"
};
const firebase = require('firebase/compat/app').default;
const auth = firebase.auth();
function assertServerError(res) {
  if (res && res.error) {
    const error = new Error(res.message);
    Object.assign(error, res.error);
    throw error;
  }
  return res;
}
function removeMetaProperty(object) {
  if (!object) return false;
  // add more here?
  const {
    name,
    ...newFileObject
  } = object;
  return newFileObject;
}
function removeMetadataFromURL(urlString) {
  const urlObject = new URL(urlString);
  urlObject.search = '';
  urlObject.hash = '';
  return urlObject.href;
}

/**
 * Computes the expiry time for a request signed with temporary credentials. If
 * no expiration was provided, or an invalid value (e.g. in the past) is
 * provided, undefined is returned. This function assumes the client clock is in
 * sync with the remote server, which is a requirement for the signature to be
 * validated for AWS anyway.
 *
 * @param {import('../types/index.js').AwsS3STSResponse['credentials']} credentials
 * @returns {number | undefined}
 */
function getExpiry(credentials) {
  const expirationDate = credentials.Expiration;
  if (expirationDate) {
    const timeUntilExpiry = Math.floor((new Date(expirationDate) - Date.now()) / 1000);
    if (timeUntilExpiry > 9) {
      return timeUntilExpiry;
    }
  }
  return undefined;
}
function getAllowedMetadata(_ref) {
  let {
    meta,
    allowedMetaFields,
    querify = false
  } = _ref;
  const metaFields = allowedMetaFields != null ? allowedMetaFields : Object.keys(meta);
  if (!meta) return {};
  return Object.fromEntries(metaFields.filter(key => meta[key] != null).map(key => {
    const realKey = querify ? `metadata[${key}]` : key;
    const value = String(meta[key]);
    return [realKey, value];
  }));
}
function throwIfAborted(signal) {
  if (signal != null && signal.aborted) {
    throw createAbortError('The operation was aborted', {
      cause: signal.reason
    });
  }
}
var _abortMultipartUpload = /*#__PURE__*/_classPrivateFieldLooseKey("abortMultipartUpload");
var _cache = /*#__PURE__*/_classPrivateFieldLooseKey("cache");
var _createMultipartUpload = /*#__PURE__*/_classPrivateFieldLooseKey("createMultipartUpload");
var _fetchSignature = /*#__PURE__*/_classPrivateFieldLooseKey("fetchSignature");
var _getUploadParameters = /*#__PURE__*/_classPrivateFieldLooseKey("getUploadParameters");
var _listParts = /*#__PURE__*/_classPrivateFieldLooseKey("listParts");
var _previousRetryDelay = /*#__PURE__*/_classPrivateFieldLooseKey("previousRetryDelay");
var _requests = /*#__PURE__*/_classPrivateFieldLooseKey("requests");
var _retryDelays = /*#__PURE__*/_classPrivateFieldLooseKey("retryDelays");
var _sendCompletionRequest = /*#__PURE__*/_classPrivateFieldLooseKey("sendCompletionRequest");
var _setS3MultipartState = /*#__PURE__*/_classPrivateFieldLooseKey("setS3MultipartState");
var _uploadPartBytes = /*#__PURE__*/_classPrivateFieldLooseKey("uploadPartBytes");
var _getFile = /*#__PURE__*/_classPrivateFieldLooseKey("getFile");
var _shouldRetry = /*#__PURE__*/_classPrivateFieldLooseKey("shouldRetry");
var _nonMultipartUpload = /*#__PURE__*/_classPrivateFieldLooseKey("nonMultipartUpload");
class HTTPCommunicationQueue {
  constructor(_requests2, options, setS3MultipartState, getFile) {
    Object.defineProperty(this, _nonMultipartUpload, {
      value: _nonMultipartUpload2
    });
    Object.defineProperty(this, _shouldRetry, {
      value: _shouldRetry2
    });
    Object.defineProperty(this, _abortMultipartUpload, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _cache, {
      writable: true,
      value: new WeakMap()
    });
    Object.defineProperty(this, _createMultipartUpload, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _fetchSignature, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _getUploadParameters, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _listParts, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _previousRetryDelay, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _requests, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _retryDelays, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _sendCompletionRequest, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _setS3MultipartState, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _uploadPartBytes, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _getFile, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _requests)[_requests] = _requests2;
    _classPrivateFieldLooseBase(this, _setS3MultipartState)[_setS3MultipartState] = setS3MultipartState;
    _classPrivateFieldLooseBase(this, _getFile)[_getFile] = getFile;
    this.setOptions(options);
  }
  setOptions(options) {
    const requests = _classPrivateFieldLooseBase(this, _requests)[_requests];
    if ('abortMultipartUpload' in options) {
      _classPrivateFieldLooseBase(this, _abortMultipartUpload)[_abortMultipartUpload] = requests.wrapPromiseFunction(options.abortMultipartUpload, {
        priority: 1
      });
    }
    if ('createMultipartUpload' in options) {
      _classPrivateFieldLooseBase(this, _createMultipartUpload)[_createMultipartUpload] = requests.wrapPromiseFunction(options.createMultipartUpload, {
        priority: -1
      });
    }
    if ('signPart' in options) {
      _classPrivateFieldLooseBase(this, _fetchSignature)[_fetchSignature] = requests.wrapPromiseFunction(options.signPart);
    }
    if ('listParts' in options) {
      _classPrivateFieldLooseBase(this, _listParts)[_listParts] = requests.wrapPromiseFunction(options.listParts);
    }
    if ('completeMultipartUpload' in options) {
      _classPrivateFieldLooseBase(this, _sendCompletionRequest)[_sendCompletionRequest] = requests.wrapPromiseFunction(options.completeMultipartUpload, {
        priority: 1
      });
    }
    if ('retryDelays' in options) {
      var _options$retryDelays;
      _classPrivateFieldLooseBase(this, _retryDelays)[_retryDelays] = (_options$retryDelays = options.retryDelays) != null ? _options$retryDelays : [];
    }
    if ('uploadPartBytes' in options) {
      _classPrivateFieldLooseBase(this, _uploadPartBytes)[_uploadPartBytes] = requests.wrapPromiseFunction(options.uploadPartBytes, {
        priority: Infinity
      });
    }
    if ('getUploadParameters' in options) {
      _classPrivateFieldLooseBase(this, _getUploadParameters)[_getUploadParameters] = requests.wrapPromiseFunction(options.getUploadParameters);
    }
  }
  async getUploadId(file, signal) {
    let cachedResult;
    // As the cache is updated asynchronously, there could be a race condition
    // where we just miss a new result so we loop here until we get nothing back,
    // at which point it's out turn to create a new cache entry.
    while ((cachedResult = _classPrivateFieldLooseBase(this, _cache)[_cache].get(file.data)) != null) {
      try {
        return await cachedResult;
      } catch {
        // In case of failure, we want to ignore the cached error.
        // At this point, either there's a new cached value, or we'll exit the loop a create a new one.
      }
    }
    const promise = _classPrivateFieldLooseBase(this, _createMultipartUpload)[_createMultipartUpload](_classPrivateFieldLooseBase(this, _getFile)[_getFile](file), signal);
    const abortPromise = () => {
      promise.abort(signal.reason);
      _classPrivateFieldLooseBase(this, _cache)[_cache].delete(file.data);
    };
    signal.addEventListener('abort', abortPromise, {
      once: true
    });
    _classPrivateFieldLooseBase(this, _cache)[_cache].set(file.data, promise);
    promise.then(async result => {
      signal.removeEventListener('abort', abortPromise);
      _classPrivateFieldLooseBase(this, _setS3MultipartState)[_setS3MultipartState](file, result);
      _classPrivateFieldLooseBase(this, _cache)[_cache].set(file.data, result);
    }, () => {
      signal.removeEventListener('abort', abortPromise);
      _classPrivateFieldLooseBase(this, _cache)[_cache].delete(file.data);
    });
    return promise;
  }
  async abortFileUpload(file) {
    const result = _classPrivateFieldLooseBase(this, _cache)[_cache].get(file.data);
    if (result == null) {
      // If the createMultipartUpload request never was made, we don't
      // need to send the abortMultipartUpload request.
      return;
    }
    // Remove the cache entry right away for follow-up requests do not try to
    // use the soon-to-be aborted chached values.
    _classPrivateFieldLooseBase(this, _cache)[_cache].delete(file.data);
    _classPrivateFieldLooseBase(this, _setS3MultipartState)[_setS3MultipartState](file, Object.create(null));
    let awaitedResult;
    try {
      awaitedResult = await result;
    } catch {
      // If the cached result rejects, there's nothing to abort.
      return;
    }
    await _classPrivateFieldLooseBase(this, _abortMultipartUpload)[_abortMultipartUpload](_classPrivateFieldLooseBase(this, _getFile)[_getFile](file), awaitedResult);
  }
  /**
   * @param {import("@uppy/core").UppyFile} file
   * @param {import("../types/chunk").Chunk[]} chunks
   * @param {AbortSignal} signal
   * @returns {Promise<void>}
   */
  async uploadFile(file, chunks, signal) {
    throwIfAborted(signal);
    if (chunks.length === 1 && !chunks[0].shouldUseMultipart) {
      return _classPrivateFieldLooseBase(this, _nonMultipartUpload)[_nonMultipartUpload](file, chunks[0], signal);
    }
    const {
      uploadId,
      key
    } = await this.getUploadId(file, signal);
    throwIfAborted(signal);
    try {
      const parts = await Promise.all(chunks.map((chunk, i) => this.uploadChunk(file, i + 1, chunk, signal)));
      throwIfAborted(signal);
      return await _classPrivateFieldLooseBase(this, _sendCompletionRequest)[_sendCompletionRequest](_classPrivateFieldLooseBase(this, _getFile)[_getFile](file), {
        key,
        uploadId,
        parts,
        signal
      }, signal).abortOn(signal);
    } catch (err) {
      if ((err == null ? void 0 : err.cause) !== pausingUploadReason && (err == null ? void 0 : err.name) !== 'AbortError') {
        // We purposefully don't wait for the promise and ignore its status,
        // because we want the error `err` to bubble up ASAP to report it to the
        // user. A failure to abort is not that big of a deal anyway.
        this.abortFileUpload(file);
      }
      throw err;
    }
  }
  restoreUploadFile(file, uploadIdAndKey) {
    _classPrivateFieldLooseBase(this, _cache)[_cache].set(file.data, uploadIdAndKey);
  }
  async resumeUploadFile(file, chunks, signal) {
    throwIfAborted(signal);
    if (chunks.length === 1 && chunks[0] != null && !chunks[0].shouldUseMultipart) {
      return _classPrivateFieldLooseBase(this, _nonMultipartUpload)[_nonMultipartUpload](file, chunks[0], signal);
    }
    const {
      uploadId,
      key
    } = await this.getUploadId(file, signal);
    throwIfAborted(signal);
    const alreadyUploadedParts = await _classPrivateFieldLooseBase(this, _listParts)[_listParts](_classPrivateFieldLooseBase(this, _getFile)[_getFile](file), {
      uploadId,
      key,
      signal
    }, signal).abortOn(signal);
    throwIfAborted(signal);
    const parts = await Promise.all(chunks.map((chunk, i) => {
      const partNumber = i + 1;
      const alreadyUploadedInfo = alreadyUploadedParts.find(_ref2 => {
        let {
          PartNumber
        } = _ref2;
        return PartNumber === partNumber;
      });
      if (alreadyUploadedInfo == null) {
        return this.uploadChunk(file, partNumber, chunk, signal);
      }
      // Already uploaded chunks are set to null. If we are restoring the upload, we need to mark it as already uploaded.
      chunk == null || chunk.setAsUploaded == null ? void 0 : chunk.setAsUploaded();
      return {
        PartNumber: partNumber,
        ETag: alreadyUploadedInfo.ETag
      };
    }));
    throwIfAborted(signal);
    return _classPrivateFieldLooseBase(this, _sendCompletionRequest)[_sendCompletionRequest](_classPrivateFieldLooseBase(this, _getFile)[_getFile](file), {
      key,
      uploadId,
      parts,
      signal
    }, signal).abortOn(signal);
  }

  /**
   *
   * @param {import("@uppy/core").UppyFile} file
   * @param {number} partNumber
   * @param {import("../types/chunk").Chunk} chunk
   * @param {AbortSignal} signal
   * @returns {Promise<object>}
   */
  async uploadChunk(file, partNumber, chunk, signal) {
    throwIfAborted(signal);
    const {
      uploadId,
      key
    } = await this.getUploadId(file, signal);
    const signatureRetryIterator = _classPrivateFieldLooseBase(this, _retryDelays)[_retryDelays].values();
    const chunkRetryIterator = _classPrivateFieldLooseBase(this, _retryDelays)[_retryDelays].values();
    const shouldRetrySignature = () => {
      const next = signatureRetryIterator.next();
      if (next == null || next.done) {
        return null;
      }
      return next.value;
    };
    for (;;) {
      throwIfAborted(signal);
      const chunkData = chunk.getData();
      const {
        onProgress,
        onComplete
      } = chunk;
      let signature;
      try {
        signature = await _classPrivateFieldLooseBase(this, _fetchSignature)[_fetchSignature](_classPrivateFieldLooseBase(this, _getFile)[_getFile](file), {
          uploadId,
          key,
          partNumber,
          body: chunkData,
          signal
        }).abortOn(signal);
      } catch (err) {
        const timeout = shouldRetrySignature();
        if (timeout == null || signal.aborted) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, timeout));
        // eslint-disable-next-line no-continue
        continue;
      }
      throwIfAborted(signal);
      try {
        return {
          PartNumber: partNumber,
          ...(await _classPrivateFieldLooseBase(this, _uploadPartBytes)[_uploadPartBytes]({
            signature,
            body: chunkData,
            size: chunkData.size,
            onProgress,
            onComplete,
            signal
          }).abortOn(signal))
        };
      } catch (err) {
        if (!(await _classPrivateFieldLooseBase(this, _shouldRetry)[_shouldRetry](err, chunkRetryIterator))) throw err;
      }
    }
  }
}
async function _shouldRetry2(err, retryDelayIterator) {
  var _err$source;
  const requests = _classPrivateFieldLooseBase(this, _requests)[_requests];
  const status = err == null || (_err$source = err.source) == null ? void 0 : _err$source.status;

  // TODO: this retry logic is taken out of Tus. We should have a centralized place for retrying,
  // perhaps the rate limited queue, and dedupe all plugins with that.
  if (status == null) {
    return false;
  }
  if (status === 403 && err.message === 'Request has expired') {
    if (!requests.isPaused) {
      // We don't want to exhaust the retryDelayIterator as long as there are
      // more than one request in parallel, to give slower connection a chance
      // to catch up with the expiry set in Companion.
      if (requests.limit === 1 || _classPrivateFieldLooseBase(this, _previousRetryDelay)[_previousRetryDelay] == null) {
        const next = retryDelayIterator.next();
        if (next == null || next.done) {
          return false;
        }
        // If there are more than 1 request done in parallel, the RLQ limit is
        // decreased and the failed request is requeued after waiting for a bit.
        // If there is only one request in parallel, the limit can't be
        // decreased, so we iterate over `retryDelayIterator` as we do for
        // other failures.
        // `#previousRetryDelay` caches the value so we can re-use it next time.
        _classPrivateFieldLooseBase(this, _previousRetryDelay)[_previousRetryDelay] = next.value;
      }
      // No need to stop the other requests, we just want to lower the limit.
      requests.rateLimit(0);
      await new Promise(resolve => setTimeout(resolve, _classPrivateFieldLooseBase(this, _previousRetryDelay)[_previousRetryDelay]));
    }
  } else if (status === 429) {
    // HTTP 429 Too Many Requests => to avoid the whole download to fail, pause all requests.
    if (!requests.isPaused) {
      const next = retryDelayIterator.next();
      if (next == null || next.done) {
        return false;
      }
      requests.rateLimit(next.value);
    }
  } else if (status > 400 && status < 500 && status !== 409) {
    // HTTP 4xx, the server won't send anything, it's doesn't make sense to retry
    return false;
  } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    // The navigator is offline, let's wait for it to come back online.
    if (!requests.isPaused) {
      requests.pause();
      window.addEventListener('online', () => {
        requests.resume();
      }, {
        once: true
      });
    }
  } else {
    // Other error code means the request can be retried later.
    const next = retryDelayIterator.next();
    if (next == null || next.done) {
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, next.value));
  }
  return true;
}
async function _nonMultipartUpload2(file, chunk, signal) {
  const {
    method = 'POST',
    url,
    fields,
    headers
  } = await _classPrivateFieldLooseBase(this, _getUploadParameters)[_getUploadParameters](_classPrivateFieldLooseBase(this, _getFile)[_getFile](file), {
    signal
  }).abortOn(signal);
  let body;
  const data = chunk.getData();
  if (method.toUpperCase() === 'POST') {
    const formData = new FormData();
    Object.entries(fields).forEach(_ref10 => {
      let [key, value] = _ref10;
      return formData.set(key, value);
    });
    formData.set('file', data);
    body = formData;
  } else {
    body = data;
  }
  const {
    onProgress,
    onComplete
  } = chunk;
  const result = await _classPrivateFieldLooseBase(this, _uploadPartBytes)[_uploadPartBytes]({
    signature: {
      url,
      headers,
      method
    },
    body,
    size: data.size,
    onProgress,
    onComplete,
    signal
  }).abortOn(signal);
  return 'location' in result ? result : {
    location: removeMetadataFromURL(url),
    ...result
  };
}
var _companionCommunicationQueue = /*#__PURE__*/_classPrivateFieldLooseKey("companionCommunicationQueue");
var _client = /*#__PURE__*/_classPrivateFieldLooseKey("client");
var _cachedTemporaryCredentials = /*#__PURE__*/_classPrivateFieldLooseKey("cachedTemporaryCredentials");
var _getTemporarySecurityCredentials = /*#__PURE__*/_classPrivateFieldLooseKey("getTemporarySecurityCredentials");
var _setS3MultipartState2 = /*#__PURE__*/_classPrivateFieldLooseKey("setS3MultipartState");
var _getFile2 = /*#__PURE__*/_classPrivateFieldLooseKey("getFile");
var _uploadLocalFile = /*#__PURE__*/_classPrivateFieldLooseKey("uploadLocalFile");
var _getCompanionClientArgs = /*#__PURE__*/_classPrivateFieldLooseKey("getCompanionClientArgs");
var _upload = /*#__PURE__*/_classPrivateFieldLooseKey("upload");
var _setCompanionHeaders = /*#__PURE__*/_classPrivateFieldLooseKey("setCompanionHeaders");
var _setResumableUploadsCapability = /*#__PURE__*/_classPrivateFieldLooseKey("setResumableUploadsCapability");
var _resetResumableCapability = /*#__PURE__*/_classPrivateFieldLooseKey("resetResumableCapability");
_Symbol$for = Symbol.for('uppy test: getClient');
export default class AwsS3Multipart extends BasePlugin {
  constructor(uppy, opts) {
    var _this$opts$rateLimite;
    super(uppy, opts);
    // eslint-disable-next-line class-methods-use-this
    Object.defineProperty(this, _getCompanionClientArgs, {
      value: _getCompanionClientArgs2
    });
    Object.defineProperty(this, _uploadLocalFile, {
      value: _uploadLocalFile2
    });
    Object.defineProperty(this, _getTemporarySecurityCredentials, {
      value: _getTemporarySecurityCredentials2
    });
    Object.defineProperty(this, _companionCommunicationQueue, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _client, {
      writable: true,
      value: void 0
    });
    /**
     * @type {import("../types").AwsS3STSResponse | Promise<import("../types").AwsS3STSResponse>}
     */
    Object.defineProperty(this, _cachedTemporaryCredentials, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _setS3MultipartState2, {
      writable: true,
      value: (file, _ref3) => {
        let {
          key,
          uploadId
        } = _ref3;
        const cFile = this.uppy.getFile(file.id);
        if (cFile == null) {
          // file was removed from store
          return;
        }
        this.uppy.setFileState(file.id, {
          s3Multipart: {
            ...cFile.s3Multipart,
            key,
            uploadId
          }
        });
      }
    });
    Object.defineProperty(this, _getFile2, {
      writable: true,
      value: file => {
        return this.uppy.getFile(file.id) || file;
      }
    });
    Object.defineProperty(this, _upload, {
      writable: true,
      value: async fileIDs => {
        if (fileIDs.length === 0) return undefined;
        const files = this.uppy.getFilesByIds(fileIDs);
        const filesFiltered = filterNonFailedFiles(files);
        const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered);
        this.uppy.emit('upload-start', filesToEmit);
        const promises = filesFiltered.map(file => {
          if (file.isRemote) {
            const getQueue = () => this.requests;
            _classPrivateFieldLooseBase(this, _setResumableUploadsCapability)[_setResumableUploadsCapability](false);
            const controller = new AbortController();
            const removedHandler = removedFile => {
              if (removedFile.id === file.id) controller.abort();
            };
            this.uppy.on('file-removed', removedHandler);
            const uploadPromise = file.remote.requestClient.uploadRemoteFile(file, _classPrivateFieldLooseBase(this, _getCompanionClientArgs)[_getCompanionClientArgs](file), {
              signal: controller.signal,
              getQueue
            });
            this.requests.wrapSyncFunction(() => {
              this.uppy.off('file-removed', removedHandler);
            }, {
              priority: -1
            })();
            return uploadPromise;
          }
          return _classPrivateFieldLooseBase(this, _uploadLocalFile)[_uploadLocalFile](file);
        });
        const upload = await Promise.all(promises);
        // After the upload is done, another upload may happen with only local files.
        // We reset the capability so that the next upload can use resumable uploads.
        _classPrivateFieldLooseBase(this, _setResumableUploadsCapability)[_setResumableUploadsCapability](true);
        return upload;
      }
    });
    Object.defineProperty(this, _setCompanionHeaders, {
      writable: true,
      value: () => {
        _classPrivateFieldLooseBase(this, _client)[_client].setCompanionHeaders(this.opts.companionHeaders);
      }
    });
    Object.defineProperty(this, _setResumableUploadsCapability, {
      writable: true,
      value: boolean => {
        const {
          capabilities
        } = this.uppy.getState();
        this.uppy.setState({
          capabilities: {
            ...capabilities,
            resumableUploads: boolean
          }
        });
      }
    });
    Object.defineProperty(this, _resetResumableCapability, {
      writable: true,
      value: () => {
        _classPrivateFieldLooseBase(this, _setResumableUploadsCapability)[_setResumableUploadsCapability](true);
      }
    });
    this.type = 'uploader';
    this.id = this.opts.id || 'AwsS3Multipart';
    this.title = 'AWS S3 Multipart';
    _classPrivateFieldLooseBase(this, _client)[_client] = new RequestClient(uppy, opts);
    const defaultOptions = {
      // TODO: null here means “include all”, [] means include none.
      // This is inconsistent with @uppy/aws-s3 and @uppy/transloadit
      allowedMetaFields: null,
      limit: 6,
      shouldUseMultipart: file => file.size !== 0,
      // TODO: Switch default to:
      // eslint-disable-next-line no-bitwise
      // shouldUseMultipart: (file) => file.size >> 10 >> 10 > 100,
      retryDelays: [0, 1000, 3000, 5000],
      createMultipartUpload: this.createMultipartUpload.bind(this),
      listParts: this.listParts.bind(this),
      abortMultipartUpload: this.abortMultipartUpload.bind(this),
      completeMultipartUpload: this.completeMultipartUpload.bind(this),
      getTemporarySecurityCredentials: false,
      signPart: opts != null && opts.getTemporarySecurityCredentials ? this.createSignedURL.bind(this) : this.signPart.bind(this),
      uploadPartBytes: AwsS3Multipart.uploadPartBytes,
      getUploadParameters: opts != null && opts.getTemporarySecurityCredentials ? this.createSignedURL.bind(this) : this.getUploadParameters.bind(this),
      companionHeaders: {}
    };
    this.opts = {
      ...defaultOptions,
      ...opts
    };
    if ((opts == null ? void 0 : opts.prepareUploadParts) != null && opts.signPart == null) {
      this.opts.signPart = async (file, _ref4) => {
        let {
          uploadId,
          key,
          partNumber,
          body,
          signal
        } = _ref4;
        const {
          presignedUrls,
          headers
        } = await opts.prepareUploadParts(file, {
          uploadId,
          key,
          parts: [{
            number: partNumber,
            chunk: body
          }],
          signal
        });
        return {
          url: presignedUrls == null ? void 0 : presignedUrls[partNumber],
          headers: headers == null ? void 0 : headers[partNumber]
        };
      };
    }

    /**
     * Simultaneous upload limiting is shared across all uploads with this plugin.
     *
     * @type {RateLimitedQueue}
     */
    this.requests = (_this$opts$rateLimite = this.opts.rateLimitedQueue) != null ? _this$opts$rateLimite : new RateLimitedQueue(this.opts.limit);
    _classPrivateFieldLooseBase(this, _companionCommunicationQueue)[_companionCommunicationQueue] = new HTTPCommunicationQueue(this.requests, this.opts, _classPrivateFieldLooseBase(this, _setS3MultipartState2)[_setS3MultipartState2], _classPrivateFieldLooseBase(this, _getFile2)[_getFile2]);
    this.uploaders = Object.create(null);
    this.uploaderEvents = Object.create(null);
    this.uploaderSockets = Object.create(null);
  }
  [_Symbol$for]() {
    return _classPrivateFieldLooseBase(this, _client)[_client];
  }
  setOptions(newOptions) {
    _classPrivateFieldLooseBase(this, _companionCommunicationQueue)[_companionCommunicationQueue].setOptions(newOptions);
    super.setOptions(newOptions);
    _classPrivateFieldLooseBase(this, _setCompanionHeaders)[_setCompanionHeaders]();
  }

  /**
   * Clean up all references for a file's upload: the MultipartUploader instance,
   * any events related to the file, and the Companion WebSocket connection.
   *
   * Set `opts.abort` to tell S3 that the multipart upload is cancelled and must be removed.
   * This should be done when the user cancels the upload, not when the upload is completed or errored.
   */
  resetUploaderReferences(fileID, opts) {
    if (opts === void 0) {
      opts = {};
    }
    if (this.uploaders[fileID]) {
      this.uploaders[fileID].abort({
        really: opts.abort || false
      });
      this.uploaders[fileID] = null;
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID].remove();
      this.uploaderEvents[fileID] = null;
    }
    if (this.uploaderSockets[fileID]) {
      this.uploaderSockets[fileID].close();
      this.uploaderSockets[fileID] = null;
    }
  }

  // TODO: make this a private method in the next major
  assertHost(method) {
    if (!this.opts.companionUrl) {
      throw new Error(`Expected a \`companionUrl\` option containing a Companion address, or if you are not using Companion, a custom \`${method}\` implementation.`);
    }
  }
  async createMultipartUpload(file, signal) {
    this.assertHost('createMultipartUpload');
    throwIfAborted(signal);
    const metadata = getAllowedMetadata({
      meta: file.meta,
      allowedMetaFields: this.opts.allowedMetaFields
    });
    const idToken = await auth.currentUser.getIdToken(true);
    return _classPrivateFieldLooseBase(this, _client)[_client].post('s3/multipart', {
      filename: file.name,
      idToken,
      type: file.type,
      metadata: removeMetaProperty(metadata)
    }, {
      signal
    }).then(assertServerError);
  }
  listParts(file, _ref5, signal) {
    let {
      key,
      uploadId
    } = _ref5;
    this.assertHost('listParts');
    throwIfAborted(signal);
    const filename = encodeURIComponent(key);
    return _classPrivateFieldLooseBase(this, _client)[_client].get(`s3/multipart/${uploadId}?key=${filename}`, {
      signal
    }).then(assertServerError);
  }
  completeMultipartUpload(file, _ref6, signal) {
    let {
      key,
      uploadId,
      parts
    } = _ref6;
    this.assertHost('completeMultipartUpload');
    throwIfAborted(signal);
    const filename = encodeURIComponent(key);
    const uploadIdEnc = encodeURIComponent(uploadId);
    return _classPrivateFieldLooseBase(this, _client)[_client].post(`s3/multipart/${uploadIdEnc}/complete?key=${filename}`, {
      parts
    }, {
      signal
    }).then(assertServerError);
  }
  async createSignedURL(file, options) {
    const data = await _classPrivateFieldLooseBase(this, _getTemporarySecurityCredentials)[_getTemporarySecurityCredentials](options);
    const expires = getExpiry(data.credentials) || 604800; // 604 800 is the max value accepted by AWS.

    const {
      uploadId,
      key,
      partNumber,
      signal
    } = options;

    // Return an object in the correct shape.
    return {
      method: 'PUT',
      expires,
      fields: {},
      url: `${await createSignedURL({
        accountKey: data.credentials.AccessKeyId,
        accountSecret: data.credentials.SecretAccessKey,
        sessionToken: data.credentials.SessionToken,
        expires,
        bucketName: data.bucket,
        Region: data.region,
        Key: key != null ? key : `${crypto.randomUUID()}-${file.name}`,
        uploadId,
        partNumber,
        signal
      })}`,
      // Provide content type header required by S3
      headers: {
        'Content-Type': file.type
      }
    };
  }
  signPart(file, _ref7) {
    let {
      uploadId,
      key,
      partNumber,
      signal
    } = _ref7;
    this.assertHost('signPart');
    throwIfAborted(signal);
    if (uploadId == null || key == null || partNumber == null) {
      throw new Error('Cannot sign without a key, an uploadId, and a partNumber');
    }
    const filename = encodeURIComponent(key);
    return _classPrivateFieldLooseBase(this, _client)[_client].get(`s3/multipart/${uploadId}/${partNumber}?key=${filename}`, {
      signal
    }).then(assertServerError);
  }
  abortMultipartUpload(file, _ref8, signal) {
    let {
      key,
      uploadId
    } = _ref8;
    this.assertHost('abortMultipartUpload');
    const filename = encodeURIComponent(key);
    const uploadIdEnc = encodeURIComponent(uploadId);
    return _classPrivateFieldLooseBase(this, _client)[_client].delete(`s3/multipart/${uploadIdEnc}?key=${filename}`, undefined, {
      signal
    }).then(assertServerError);
  }
  getUploadParameters(file, options) {
    const {
      meta
    } = file;
    const {
      type,
      name: filename
    } = meta;
    const metadata = getAllowedMetadata({
      meta,
      allowedMetaFields: this.opts.allowedMetaFields,
      querify: true
    });
    const query = new URLSearchParams({
      filename,
      type,
      ...metadata
    });
    return _classPrivateFieldLooseBase(this, _client)[_client].get(`s3/params?${query}`, options);
  }
  static async uploadPartBytes(_ref9) {
    let {
      signature: {
        url,
        expires,
        headers,
        method = 'PUT'
      },
      body,
      size = body.size,
      onProgress,
      onComplete,
      signal
    } = _ref9;
    throwIfAborted(signal);
    if (url == null) {
      throw new Error('Cannot upload to an undefined URL');
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      if (headers) {
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
      }
      xhr.responseType = 'text';
      if (typeof expires === 'number') {
        xhr.timeout = expires * 1000;
      }
      function onabort() {
        xhr.abort();
      }
      function cleanup() {
        signal.removeEventListener('abort', onabort);
      }
      signal.addEventListener('abort', onabort);
      xhr.upload.addEventListener('progress', ev => {
        onProgress(ev);
      });
      xhr.addEventListener('abort', () => {
        cleanup();
        reject(createAbortError());
      });
      xhr.addEventListener('timeout', () => {
        cleanup();
        const error = new Error('Request has expired');
        error.source = {
          status: 403
        };
        reject(error);
      });
      xhr.addEventListener('load', ev => {
        cleanup();
        if (ev.target.status === 403 && ev.target.responseText.includes('<Message>Request has expired</Message>')) {
          const error = new Error('Request has expired');
          error.source = ev.target;
          reject(error);
          return;
        }
        if (ev.target.status < 200 || ev.target.status >= 300) {
          const error = new Error('Non 2xx');
          error.source = ev.target;
          reject(error);
          return;
        }

        // todo make a proper onProgress API (breaking change)
        onProgress == null ? void 0 : onProgress({
          loaded: size,
          lengthComputable: true
        });

        // NOTE This must be allowed by CORS.
        const etag = ev.target.getResponseHeader('ETag');
        const location = ev.target.getResponseHeader('Location');
        if (method.toUpperCase() === 'POST' && location === null) {
          // Not being able to read the Location header is not a fatal error.
          // eslint-disable-next-line no-console
          console.warn('AwsS3/Multipart: Could not read the Location header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.');
        }
        if (etag === null) {
          reject(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. See https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'));
          return;
        }
        onComplete == null ? void 0 : onComplete(etag);
        resolve({
          ETag: etag,
          ...(location ? {
            location
          } : undefined)
        });
      });
      xhr.addEventListener('error', ev => {
        cleanup();
        const error = new Error('Unknown error');
        error.source = ev.target;
        reject(error);
      });
      xhr.send(body);
    });
  }
  install() {
    _classPrivateFieldLooseBase(this, _setResumableUploadsCapability)[_setResumableUploadsCapability](true);
    this.uppy.addPreProcessor(_classPrivateFieldLooseBase(this, _setCompanionHeaders)[_setCompanionHeaders]);
    this.uppy.addUploader(_classPrivateFieldLooseBase(this, _upload)[_upload]);
    this.uppy.on('cancel-all', _classPrivateFieldLooseBase(this, _resetResumableCapability)[_resetResumableCapability]);
  }
  uninstall() {
    this.uppy.removePreProcessor(_classPrivateFieldLooseBase(this, _setCompanionHeaders)[_setCompanionHeaders]);
    this.uppy.removeUploader(_classPrivateFieldLooseBase(this, _upload)[_upload]);
    this.uppy.off('cancel-all', _classPrivateFieldLooseBase(this, _resetResumableCapability)[_resetResumableCapability]);
  }
}
async function _getTemporarySecurityCredentials2(options) {
  throwIfAborted(options == null ? void 0 : options.signal);
  if (_classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials] == null) {
    // We do not await it just yet, so concurrent calls do not try to override it:
    if (this.opts.getTemporarySecurityCredentials === true) {
      this.assertHost('getTemporarySecurityCredentials');
      _classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials] = _classPrivateFieldLooseBase(this, _client)[_client].get('s3/sts', null, options).then(assertServerError);
    } else {
      _classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials] = this.opts.getTemporarySecurityCredentials(options);
    }
    _classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials] = await _classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials];
    setTimeout(() => {
      // At half the time left before expiration, we clear the cache. That's
      // an arbitrary tradeoff to limit the number of requests made to the
      // remote while limiting the risk of using an expired token in case the
      // clocks are not exactly synced.
      // The HTTP cache should be configured to ensure a client doesn't request
      // more tokens than it needs, but this timeout provides a second layer of
      // security in case the HTTP cache is disabled or misconfigured.
      _classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials] = null;
    }, (getExpiry(_classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials].credentials) || 0) * 500);
  }
  return _classPrivateFieldLooseBase(this, _cachedTemporaryCredentials)[_cachedTemporaryCredentials];
}
function _uploadLocalFile2(file) {
  var _this = this;
  return new Promise((resolve, reject) => {
    const onProgress = (bytesUploaded, bytesTotal) => {
      this.uppy.emit('upload-progress', file, {
        uploader: this,
        bytesUploaded,
        bytesTotal
      });
    };
    const onError = err => {
      this.uppy.log(err);
      this.uppy.emit('upload-error', file, err);
      this.resetUploaderReferences(file.id);
      reject(err);
    };
    const onSuccess = result => {
      const uploadResp = {
        body: {
          ...result
        },
        uploadURL: result.location
      };
      this.resetUploaderReferences(file.id);
      this.uppy.emit('upload-success', _classPrivateFieldLooseBase(this, _getFile2)[_getFile2](file), uploadResp);
      if (result.location) {
        this.uppy.log(`Download ${file.name} from ${result.location}`);
      }
      resolve();
    };
    const onPartComplete = part => {
      this.uppy.emit('s3-multipart:part-uploaded', _classPrivateFieldLooseBase(this, _getFile2)[_getFile2](file), part);
    };
    const upload = new MultipartUploader(file.data, {
      // .bind to pass the file object to each handler.
      companionComm: _classPrivateFieldLooseBase(this, _companionCommunicationQueue)[_companionCommunicationQueue],
      log: function () {
        return _this.uppy.log(...arguments);
      },
      getChunkSize: this.opts.getChunkSize ? this.opts.getChunkSize.bind(this) : null,
      onProgress,
      onError,
      onSuccess,
      onPartComplete,
      file,
      shouldUseMultipart: this.opts.shouldUseMultipart,
      ...file.s3Multipart
    });
    this.uploaders[file.id] = upload;
    const eventManager = new EventManager(this.uppy);
    this.uploaderEvents[file.id] = eventManager;
    eventManager.onFileRemove(file.id, removed => {
      upload.abort();
      this.resetUploaderReferences(file.id, {
        abort: true
      });
      resolve(`upload ${removed.id} was removed`);
    });
    eventManager.onCancelAll(file.id, function (_temp) {
      let {
        reason
      } = _temp === void 0 ? {} : _temp;
      if (reason === 'user') {
        upload.abort();
        _this.resetUploaderReferences(file.id, {
          abort: true
        });
      }
      resolve(`upload ${file.id} was canceled`);
    });
    eventManager.onFilePause(file.id, isPaused => {
      if (isPaused) {
        upload.pause();
      } else {
        upload.start();
      }
    });
    eventManager.onPauseAll(file.id, () => {
      upload.pause();
    });
    eventManager.onResumeAll(file.id, () => {
      upload.start();
    });
    upload.start();
  });
}
function _getCompanionClientArgs2(file) {
  return {
    ...file.remote.body,
    protocol: 's3-multipart',
    size: file.data.size,
    metadata: removeMetaProperty(file.meta)
  };
}
AwsS3Multipart.VERSION = packageJson.version;