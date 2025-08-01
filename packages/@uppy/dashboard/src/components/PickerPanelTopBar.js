const { h } = require('preact')

const uploadStates = {
  STATE_ERROR: 'error',
  STATE_WAITING: 'waiting',
  STATE_PREPROCESSING: 'preprocessing',
  STATE_UPLOADING: 'uploading',
  STATE_POSTPROCESSING: 'postprocessing',
  STATE_COMPLETE: 'complete',
  STATE_PAUSED: 'paused',
}

function getUploadingState (isAllErrored, isAllComplete, isAllPaused, files = {}) {
  if (isAllErrored) {
    return uploadStates.STATE_ERROR
  }

  if (isAllComplete) {
    return uploadStates.STATE_COMPLETE
  }

  if (isAllPaused) {
    return uploadStates.STATE_PAUSED
  }

  let state = uploadStates.STATE_WAITING
  const fileIDs = Object.keys(files)
  for (let i = 0; i < fileIDs.length; i++) {
    const { progress } = files[fileIDs[i]]
    // If ANY files are being uploaded right now, show the uploading state.
    if (progress.uploadStarted && !progress.uploadComplete) {
      return uploadStates.STATE_UPLOADING
    }
    // If files are being preprocessed AND postprocessed at this time, we show the
    // preprocess state. If any files are being uploaded we show uploading.
    if (progress.preprocess && state !== uploadStates.STATE_UPLOADING) {
      state = uploadStates.STATE_PREPROCESSING
    }
    // If NO files are being preprocessed or uploaded right now, but some files are
    // being postprocessed, show the postprocess state.
    if (progress.postprocess && state !== uploadStates.STATE_UPLOADING && state !== uploadStates.STATE_PREPROCESSING) {
      state = uploadStates.STATE_POSTPROCESSING
    }
  }
  return state
}

function PanelTopBar (props) {
  let { allowNewUpload } = props

  if (allowNewUpload && props.maxNumberOfFiles) {
    allowNewUpload = props.totalFileCount < props.maxNumberOfFiles
  }

  return (
    <div className="uppy-DashboardContent-bar">
      {allowNewUpload && (
        <button
          class="uppy-DashboardContent-addMore"
          type="button"
          aria-label={props.i18n('addMoreFiles')}
          title={props.i18n('addMoreFiles')}
          onClick={() => props.toggleAddFilesPanel(true)}
        >
          <svg aria-hidden="true" focusable="false" class="uppy-c-icon" width="15" height="15" viewBox="0 0 15 15">
            <path d="M8 6.5h6a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H8v6a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V8h-6a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h6v-6A.5.5 0 0 1 7 0h.5a.5.5 0 0 1 .5.5v6z" />
          </svg>
          <span class="uppy-DashboardContent-addMoreCaption">{props.i18n('addMore')}</span>
        </button>
      )}
      <div className="uppy-topBarRightContainer">
        <div className="uppy-AlignText">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="infoIcon feather feather-info"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            {props.i18n('alignWithText')}<span className="uppy-AlignText-Optional">({props.i18n('optionalTXTFile')})</span>
          </span>
          <div
            id="uppy-AlignText-Tooltip"
            className="uppy-AlignText-Tooltip"
            role="tooltip"
            aria-hidden="true"
          >
            {props.i18n('elevenlabsForcedAlignment')}
          </div>
        </div>
        <div className="uppy-SpeakerCount">{props.i18n('speakerCount')}</div>
      </div>
    </div>
  )
}

module.exports = PanelTopBar
