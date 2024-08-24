const { h, Component } = require('preact')

class UrlUI extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isFetching: false, // Add state to track the fetch status
    }
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount () {
    this.input.value = ''
  }

  handleAddFile () {
    const url = this.input.value
    if (!url) return

    if (this.state.isFetching) {
      return
    }

    this.setState({ isFetching: true }) // Set state to fetching

    this.props.addFile(url).then(() => {
      this.setState({ isFetching: false }) // Reset state when done
    }).catch(() => {
      this.setState({ isFetching: false }) // Reset state on error
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
    return (
      <div className="uppy-Url">
        <input
          className="uppy-u-reset uppy-c-textInput uppy-Url-input"
          type="text"
          aria-label={this.props.i18n('enterUrlToImport')}
          placeholder={this.props.i18n('enterUrlToImport')}
          onKeyUp={this.handleKeyPress}
          ref={(input) => { this.input = input }}
          data-uppy-super-focusable
        />
        <button
          className="uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Url-importButton"
          type="button"
          onClick={this.handleClick}
        >
          {this.state.isFetching ? 'Importing' : this.props.i18n('import')}
        </button>
      </div>
    )
  }
}

module.exports = UrlUI
