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
      isElevenlabsTranscript: props.file.meta.isElevenlabsTranscript || false,
    }
  }

  componentDidMount () {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }
  }

  shouldComponentUpdate (nextProps) {
    // eslint-disable-next-line max-len
    return !shallowEqual(this.props, nextProps) || this.state.isElevenlabsTranscript !== nextProps.file.meta.isElevenlabsTranscript || this.state.speakers !== nextProps.file.meta.speakerCount
  }

  componentDidUpdate (prevProps) {
    const { file } = this.props
    if (!file.preview) {
      this.props.handleRequestThumbnail(file)
    }

    if (file?.meta?.speakerCount && file?.meta?.speakerCount !== prevProps.file.meta.speakerCount && file?.meta?.speakerCount !== this.state.speakers) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        speakers: file.meta.speakerCount,
      })
    }

    if (file?.meta?.isElevenlabsTranscript !== prevProps.file.meta.isElevenlabsTranscript && file?.meta?.isElevenlabsTranscript !== this.state.isElevenlabsTranscript) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        isElevenlabsTranscript: file.meta.isElevenlabsTranscript,
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

  setElevenlabsForcedAlignmentFile = async (event) => {
    const { file } = this.props
    if (file && file.id) {
      const forcedAlignmentFile = event.target.files[0]

      if (forcedAlignmentFile && forcedAlignmentFile.name.endsWith('.txt')) {
        try {
          const text = await forcedAlignmentFile.text()

          this.props.uppy.setFileMeta(file.id, {
            forcedAlignment: text,
            forcedAlignmentFileName: forcedAlignmentFile.name,
          })
        } catch (err) {
          console.error('Error reading .txt file:', err)
        }
      } else {
        console.warn('Selected file is not a .txt file')
      }
    }
  }

  removeElevenlabsForcedAlignmentFile = () => {
    const { file } = this.props
    if (file && file.id) {
      this.props.uppy.setFileMeta(file.id, {
        forcedAlignment: null,
        forcedAlignmentFileName: null,
      })
      // Reset the file input
      if (this.elevenlabsFileInput) {
        this.elevenlabsFileInput.value = ''
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
      { value: 'auto', label: 'Auto' },
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4' },
      { value: 5, label: '5' },
      { value: 6, label: '6' },
      { value: 7, label: '7' },
      { value: 8, label: '8' },
      { value: 9, label: '9' },
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
          {this.state.isElevenlabsTranscript && !file.meta?.isSubtitleFile && (
          <div className="uppy-Dashboard-Item-ElevenLabsFileInputWrapper">
            <input
              className="uppy-Dashboard-Item-ElevenLabsFileInput"
              type="file"
              accept=".txt"
              onChange={this.setElevenlabsForcedAlignmentFile}
              ref={(input) => { this.elevenlabsFileInput = input }}
              style={{ display: 'none' }}
            />
            {file.meta.forcedAlignmentFileName ? (
              <div className="uppy-Dashboard-Item-ElevenLabsFileBtn">
                <span className="uppy-Dashboard-Item-ElevenLabsFileName">
                  {file.meta.forcedAlignmentFileName}
                </span>
                <div className="uppy-Dashboard-Item-ElevenLabsFileRemove" type="button" onClick={this.removeElevenlabsForcedAlignmentFile} title="Remove file">
                  ×
                </div>
              </div>
            ) : (
              <button
                className="uppy-Dashboard-Item-ElevenLabsFileBtn"
                type="button"
                onClick={() => this.elevenlabsFileInput?.click()}
              >
                Upload Text to Align (.txt)
              </button>
            )}
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
