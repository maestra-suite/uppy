function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
import { UIPlugin } from '@uppy/core';
import emaFilter from '@uppy/utils/lib/emaFilter';
import getTextDirection from '@uppy/utils/lib/getTextDirection';
import statusBarStates from './StatusBarStates.js';
import StatusBarUI from "./StatusBarUI.js";
const packageJson = {
  "version": "3.2.5"
};
import locale from './locale.js';
const speedFilterHalfLife = 2000;
const ETAFilterHalfLife = 2000;
function getUploadingState(error, isAllComplete, recoveredState, files) {
  if (error) {
    return statusBarStates.STATE_ERROR;
  }
  if (isAllComplete) {
    return statusBarStates.STATE_COMPLETE;
  }
  if (recoveredState) {
    return statusBarStates.STATE_WAITING;
  }
  let state = statusBarStates.STATE_WAITING;
  const fileIDs = Object.keys(files);
  for (let i = 0; i < fileIDs.length; i++) {
    const {
      progress
    } = files[fileIDs[i]];
    // If ANY files are being uploaded right now, show the uploading state.
    if (progress.uploadStarted && !progress.uploadComplete) {
      return statusBarStates.STATE_UPLOADING;
    }
    // If files are being preprocessed AND postprocessed at this time, we show the
    // preprocess state. If any files are being uploaded we show uploading.
    if (progress.preprocess && state !== statusBarStates.STATE_UPLOADING) {
      state = statusBarStates.STATE_PREPROCESSING;
    }
    // If NO files are being preprocessed or uploaded right now, but some files are
    // being postprocessed, show the postprocess state.
    if (progress.postprocess && state !== statusBarStates.STATE_UPLOADING && state !== statusBarStates.STATE_PREPROCESSING) {
      state = statusBarStates.STATE_POSTPROCESSING;
    }
  }
  return state;
}

/**
 * StatusBar: renders a status bar with upload/pause/resume/cancel/retry buttons,
 * progress percentage and time remaining.
 */
var _lastUpdateTime = /*#__PURE__*/_classPrivateFieldLooseKey("lastUpdateTime");
var _previousUploadedBytes = /*#__PURE__*/_classPrivateFieldLooseKey("previousUploadedBytes");
var _previousSpeed = /*#__PURE__*/_classPrivateFieldLooseKey("previousSpeed");
var _previousETA = /*#__PURE__*/_classPrivateFieldLooseKey("previousETA");
var _computeSmoothETA = /*#__PURE__*/_classPrivateFieldLooseKey("computeSmoothETA");
var _onUploadStart = /*#__PURE__*/_classPrivateFieldLooseKey("onUploadStart");
export default class StatusBar extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    Object.defineProperty(this, _computeSmoothETA, {
      value: _computeSmoothETA2
    });
    Object.defineProperty(this, _lastUpdateTime, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _previousUploadedBytes, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _previousSpeed, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _previousETA, {
      writable: true,
      value: void 0
    });
    this.startUpload = () => {
      return this.uppy.upload().catch(() => {
        // Error logged in Core
      });
    };
    Object.defineProperty(this, _onUploadStart, {
      writable: true,
      value: () => {
        const {
          recoveredState
        } = this.uppy.getState();
        _classPrivateFieldLooseBase(this, _previousSpeed)[_previousSpeed] = null;
        _classPrivateFieldLooseBase(this, _previousETA)[_previousETA] = null;
        if (recoveredState) {
          _classPrivateFieldLooseBase(this, _previousUploadedBytes)[_previousUploadedBytes] = Object.values(recoveredState.files).reduce((pv, _ref) => {
            let {
              progress
            } = _ref;
            return pv + progress.bytesUploaded;
          }, 0);

          // We don't set `#lastUpdateTime` at this point because the upload won't
          // actually resume until the user asks for it.

          this.uppy.emit('restore-confirmed');
          return;
        }
        _classPrivateFieldLooseBase(this, _lastUpdateTime)[_lastUpdateTime] = performance.now();
        _classPrivateFieldLooseBase(this, _previousUploadedBytes)[_previousUploadedBytes] = 0;
      }
    });
    this.id = this.opts.id || 'StatusBar';
    this.title = 'StatusBar';
    this.type = 'progressindicator';
    this.defaultLocale = locale;

    // set default options, must be kept in sync with @uppy/react/src/StatusBar.js
    const defaultOptions = {
      target: 'body',
      hideUploadButton: false,
      hideRetryButton: false,
      hidePauseResumeButton: false,
      hideCancelButton: false,
      showProgressDetails: false,
      hideAfterFinish: true,
      doneButtonHandler: null
    };
    this.opts = {
      ...defaultOptions,
      ...opts
    };
    this.i18nInit();
    this.render = this.render.bind(this);
    this.install = this.install.bind(this);
  }
  render(state) {
    const {
      capabilities,
      files,
      allowNewUpload,
      totalProgress,
      error,
      recoveredState
    } = state;
    const {
      newFiles,
      startedFiles,
      completeFiles,
      isUploadStarted,
      isAllComplete,
      isAllErrored,
      isAllPaused,
      isUploadInProgress,
      isSomeGhost
    } = this.uppy.getObjectOfFilesPerState();

    // If some state was recovered, we want to show Upload button/counter
    // for all the files, because in this case it’s not an Upload button,
    // but “Confirm Restore Button”
    const newFilesOrRecovered = recoveredState ? Object.values(files) : newFiles;
    const resumableUploads = !!capabilities.resumableUploads;
    const supportsUploadProgress = capabilities.uploadProgress !== false;
    let totalSize = 0;
    let totalUploadedSize = 0;
    startedFiles.forEach(file => {
      totalSize += file.progress.bytesTotal || 0;
      totalUploadedSize += file.progress.bytesUploaded || 0;
    });
    const totalETA = _classPrivateFieldLooseBase(this, _computeSmoothETA)[_computeSmoothETA]({
      uploaded: totalUploadedSize,
      total: totalSize,
      remaining: totalSize - totalUploadedSize
    });
    return StatusBarUI({
      error,
      uploadState: getUploadingState(error, isAllComplete, recoveredState, state.files || {}),
      allowNewUpload,
      totalProgress,
      totalSize,
      totalUploadedSize,
      isAllComplete: false,
      isAllPaused,
      isAllErrored,
      isUploadStarted,
      isUploadInProgress,
      isSomeGhost,
      recoveredState,
      complete: completeFiles.length,
      newFiles: newFilesOrRecovered.length,
      numUploads: startedFiles.length,
      totalETA,
      files,
      i18n: this.i18n,
      uppy: this.uppy,
      startUpload: this.startUpload,
      doneButtonHandler: this.opts.doneButtonHandler,
      resumableUploads,
      supportsUploadProgress,
      showProgressDetails: this.opts.showProgressDetails,
      hideUploadButton: this.opts.hideUploadButton,
      hideRetryButton: this.opts.hideRetryButton,
      hidePauseResumeButton: this.opts.hidePauseResumeButton,
      hideCancelButton: this.opts.hideCancelButton,
      hideAfterFinish: this.opts.hideAfterFinish,
      isTargetDOMEl: this.isTargetDOMEl
    });
  }
  onMount() {
    // Set the text direction if the page has not defined one.
    const element = this.el;
    const direction = getTextDirection(element);
    if (!direction) {
      element.dir = 'ltr';
    }
  }
  install() {
    const {
      target
    } = this.opts;
    if (target) {
      this.mount(target, this);
    }
    this.uppy.on('upload', _classPrivateFieldLooseBase(this, _onUploadStart)[_onUploadStart]);

    // To cover the use case where the status bar is installed while the upload
    // has started, we set `lastUpdateTime` right away.
    _classPrivateFieldLooseBase(this, _lastUpdateTime)[_lastUpdateTime] = performance.now();
    _classPrivateFieldLooseBase(this, _previousUploadedBytes)[_previousUploadedBytes] = this.uppy.getFiles().reduce((pv, file) => pv + file.progress.bytesUploaded, 0);
  }
  uninstall() {
    this.unmount();
    this.uppy.off('upload', _classPrivateFieldLooseBase(this, _onUploadStart)[_onUploadStart]);
  }
}
function _computeSmoothETA2(totalBytes) {
  var _classPrivateFieldLoo, _classPrivateFieldLoo2;
  if (totalBytes.total === 0 || totalBytes.remaining === 0) {
    return 0;
  }

  // When state is restored, lastUpdateTime is still nullish at this point.
  (_classPrivateFieldLoo2 = (_classPrivateFieldLoo = _classPrivateFieldLooseBase(this, _lastUpdateTime))[_lastUpdateTime]) != null ? _classPrivateFieldLoo2 : _classPrivateFieldLoo[_lastUpdateTime] = performance.now();
  const dt = performance.now() - _classPrivateFieldLooseBase(this, _lastUpdateTime)[_lastUpdateTime];
  if (dt === 0) {
    var _classPrivateFieldLoo3;
    return Math.round(((_classPrivateFieldLoo3 = _classPrivateFieldLooseBase(this, _previousETA)[_previousETA]) != null ? _classPrivateFieldLoo3 : 0) / 100) / 10;
  }
  const uploadedBytesSinceLastTick = totalBytes.uploaded - _classPrivateFieldLooseBase(this, _previousUploadedBytes)[_previousUploadedBytes];
  _classPrivateFieldLooseBase(this, _previousUploadedBytes)[_previousUploadedBytes] = totalBytes.uploaded;

  // uploadedBytesSinceLastTick can be negative in some cases (packet loss?)
  // in which case, we wait for next tick to update ETA.
  if (uploadedBytesSinceLastTick <= 0) {
    var _classPrivateFieldLoo4;
    return Math.round(((_classPrivateFieldLoo4 = _classPrivateFieldLooseBase(this, _previousETA)[_previousETA]) != null ? _classPrivateFieldLoo4 : 0) / 100) / 10;
  }
  const currentSpeed = uploadedBytesSinceLastTick / dt;
  const filteredSpeed = _classPrivateFieldLooseBase(this, _previousSpeed)[_previousSpeed] == null ? currentSpeed : emaFilter(currentSpeed, _classPrivateFieldLooseBase(this, _previousSpeed)[_previousSpeed], speedFilterHalfLife, dt);
  _classPrivateFieldLooseBase(this, _previousSpeed)[_previousSpeed] = filteredSpeed;
  const instantETA = totalBytes.remaining / filteredSpeed;
  const updatedPreviousETA = Math.max(_classPrivateFieldLooseBase(this, _previousETA)[_previousETA] - dt, 0);
  const filteredETA = _classPrivateFieldLooseBase(this, _previousETA)[_previousETA] == null ? instantETA : emaFilter(instantETA, updatedPreviousETA, ETAFilterHalfLife, dt);
  _classPrivateFieldLooseBase(this, _previousETA)[_previousETA] = filteredETA;
  _classPrivateFieldLooseBase(this, _lastUpdateTime)[_lastUpdateTime] = performance.now();
  return Math.round(filteredETA / 100) / 10;
}
StatusBar.VERSION = packageJson.version;