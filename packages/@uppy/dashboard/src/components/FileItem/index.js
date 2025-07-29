const { h, Component } = require('preact')
const classNames = require('classnames')
const shallowEqual = require('is-shallow-equal')
const FilePreviewAndLink = require('./FilePreviewAndLink')
const FileProgress = require('./FileProgress')
const FileInfo = require('./FileInfo')
const Buttons = require('./Buttons')

module.exports = class FileItem extends Component {
  constructor (props) {
    super(props)
    this.state = {
      speakers: props.file.meta.speakerCount || 1,
    }
  }

  componentDidMount () {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  shouldComponentUpdate (nextProps) {
    return !shallowEqual(this.props, nextProps)
  }

  componentDidUpdate () {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }

    if (file?.meta?.speakerCount && file?.meta?.speakerCount !== this.state.speakers) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        speakers: file.meta.speakerCount,
      })
    }
  }

  componentWillUnmount () {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleCancelThumbnail(file)
    }
  }

  setSpeakers = (event) => {
    this.setState({
      speakers: event.target.value,
    })
    const { file } = this.props
    if (file && file.id) {
      this.props.uppy.setFileMeta(file.id, {
        speakerCount: event.target.value,
      })
    }
  }

  setElevenlabsForcedAlignmentFile = (event) => {
    const { file } = this.props
    if (file && file.id) {
      let forcedAlignmentFile = event.target.files[0]

      console.log('forcedAlignmentFile', forcedAlignmentFile)

      if (forcedAlignmentFile) {
        forcedAlignmentFile = forcedAlignmentFile.text()
        console.log('forcedAlignmentFile TEXT', forcedAlignmentFile)

        this.props.uppy.setFileMeta(file.id, {
          forcedAlignment: forcedAlignmentFile,
        })
      }
    }
  }

  render () {
    const { file } = this.props

    const isProcessing = file.progress.preprocess || file.progress.postprocess
    const isUploaded = file.progress.uploadComplete && !isProcessing && !file.error
    const uploadInProgressOrComplete = file.progress.uploadStarted || isProcessing
    const uploadInProgress = (file.progress.uploadStarted && !file.progress.uploadComplete) || isProcessing
    const error = file.error || false

    // File that Golden Retriever was able to partly restore (only meta, not blob),
    // users still need to re-add it, so it’s a ghost
    const { isGhost } = file

    let showRemoveButton = this.props.individualCancellation
      ? !isUploaded
      : !uploadInProgress && !isUploaded

    if (isUploaded && this.props.showRemoveButtonAfterComplete) {
      showRemoveButton = true
    }

    const speakerCountOptions = [
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4' },
      { value: 5, label: '5' },
      { value: 6, label: '6' },
      { value: 7, label: '7' },
      { value: 8, label: '8' },
      { value: 9, label: '9' },
      { value: 'auto', label: 'Auto' },
    ]

    const dashboardItemClass = classNames({
      'uppy-Dashboard-Item': true,
      'is-inprogress': uploadInProgress && !this.props.recoveredState,
      'is-processing': isProcessing,
      'is-complete': isUploaded,
      'is-error': !!error,
      'is-resumable': this.props.resumableUploads,
      'is-noIndividualCancellation': !this.props.individualCancellation,
      'is-ghost': isGhost,
    })

    return (
      <div
        className={dashboardItemClass}
        id={`uppy_${file.id}`}
        role={this.props.role}
      >
        <div className="uppy-Dashboard-Item-preview">
          <FilePreviewAndLink
            file={file}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            i18n={this.props.i18n}
            toggleFileCard={this.props.toggleFileCard}
            metaFields={this.props.metaFields}
          />
          <FileProgress
            uppy={this.props.uppy}
            file={file}
            error={error}
            isUploaded={isUploaded}
            hideRetryButton={this.props.hideRetryButton}
            hideCancelButton={this.props.hideCancelButton}
            hidePauseResumeButton={this.props.hidePauseResumeButton}
            recoveredState={this.props.recoveredState}
            showRemoveButtonAfterComplete={this.props.showRemoveButtonAfterComplete}
            resumableUploads={this.props.resumableUploads}
            individualCancellation={this.props.individualCancellation}
            i18n={this.props.i18n}
          />
        </div>
        <div className="uppy-Dashboard-Item-fileInfoAndButtons">
          <FileInfo
            file={file}
            id={this.props.id}
            acquirers={this.props.acquirers}
            containerWidth={this.props.containerWidth}
            i18n={this.props.i18n}
            toggleAddFilesPanel={this.props.toggleAddFilesPanel}
            toggleFileCard={this.props.toggleFileCard}
            metaFields={this.props.metaFields}
          />
          <Buttons
            file={file}
            metaFields={this.props.metaFields}
            showLinkToFileUploadResult={this.props.showLinkToFileUploadResult}
            showRemoveButton={showRemoveButton}
            canEditFile={this.props.canEditFile}
            uploadInProgressOrComplete={uploadInProgressOrComplete}
            toggleFileCard={this.props.toggleFileCard}
            openFileEditor={this.props.openFileEditor}
            uppy={this.props.uppy}
            i18n={this.props.i18n}
          />
          {file?.meta?.isElevenlabsTranscript && (
          <div className="uppy-Dashboard-Item-ElevenLabsFileInputWrapper">
            <input
              className="uppy-Dashboard-Item-ElevenLabsFileInput"
              type="file"
              accept=".txt"
              onChange={this.setElevenlabsForcedAlignmentFile}
              ref={(input) => { this.elevenlabsFileInput = input }}
              style={{ display: 'none' }}
            />
            <button
              className="uppy-Dashboard-Item-ElevenLabsFileBtn"
              type="button"
              onClick={() => this.elevenlabsFileInput?.click()}
            >
              Text File
            </button>
          </div>
          )}
          <div class="uppy-DropDown-SpeakerCount">
            <select class="uppy-Dropdown-SpeakerCount-Select" value={this.state.speakers} onChange={this.setSpeakers}>
              {
                speakerCountOptions.map((option) => {
                  return (
                    <option value={option.value} key={option.value} id={`uppy_speakerCount_${option.value}`}>
                      {option.label}
                    </option>
                  )
                })
              }
            </select>
          </div>
        </div>
      </div>
    )
  }
}
