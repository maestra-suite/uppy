const { h, Component } = require('preact')

class UrlUI extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isFetching: false,
      progress: 0,
    }
    this.progressInterval = null
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    this.input.value = ''
  }

  componentWillUnmount () {
    this.stopProgress()
  }

  startProgress () {
    this.setState({ progress: 0 })
    this.progressInterval = setInterval(() => {
      this.setState((state) => {
        const increment = (90 - state.progress) * 0.1;
        const newProgress = Math.min(state.progress + Math.max(increment, 0.5), 90);
        return { progress: newProgress };
      })
    }, 200)
  }

  stopProgress () {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
      this.progressInterval = null
    }
  }

  handleAddFile () {
    const url = this.input.value
    if (!url) return

    if (this.state.isFetching) {
      return
    }

    this.setState({ isFetching: true })
    this.startProgress()

    this.props.addFile(url).then(() => {
      this.stopProgress()
      this.setState({ progress: 100 })
      setTimeout(() => {
        this.setState({ isFetching: false, progress: 0 })
      }, 300)
    }).catch(() => {
      this.stopProgress()
      this.setState({ isFetching: false, progress: 0 })
    })
  }

  handleKeyPress (ev) {
    if (ev.keyCode === 13) {
      this.handleAddFile()
    }
  }

  handleClick () {
    this.handleAddFile()
  }

  render () {
    const { isFetching, progress } = this.state

    return (
      <div className="uppy-Url">
        <div className="uppy-Url-form">
          <input
            className="uppy-u-reset uppy-c-textInput uppy-Url-input"
            type="text"
            aria-label={this.props.i18n('enterUrlToImport')}
            placeholder={this.props.i18n('enterUrlToImport')}
            onKeyUp={this.handleKeyPress}
            ref={(input) => { this.input = input }}
            data-uppy-super-focusable
            disabled={isFetching}
          />
          <button
            className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
            type="button"
            onClick={this.handleClick}
            disabled={isFetching}
          >
            {isFetching ? this.props.i18n('importing') : this.props.i18n('import')}
          </button>
        </div>
        {isFetching && (
          <div className="uppy-Url-progress">
            <div className="uppy-Url-progress-track">
              <div
                className="uppy-Url-progress-bar"
                style={{ width: `${progress}%`, left: 0 }}
              />
            </div>
            <span className="uppy-Url-progress-percent">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    )
  }
}

module.exports = UrlUI
