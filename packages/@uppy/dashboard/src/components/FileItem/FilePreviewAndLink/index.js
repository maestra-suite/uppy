const { h } = require('preact')
const getYouTubeID = require('get-youtube-id')
const FilePreview = require('../../FilePreview')
const MetaErrorMessage = require('../MetaErrorMessage')
const getFileTypeIcon = require('../../../utils/getFileTypeIcon')

function matchYoutubeUrl (url) {
  const p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
  if (url.match(p)) {
    return url.match(p)[1]
  }
  return false
}

module.exports = function FilePreviewAndLink (props) {
  let thumbnail = false
  const url = props?.file?.remote?.body?.url
  if (props?.file?.meta?.thumbnail) {
    thumbnail = props.file.meta.thumbnail
  } else if (url && matchYoutubeUrl(url)) {
    const videoID = getYouTubeID(url, { fuzzy: false })
    thumbnail = `https://img.youtube.com/vi/${videoID}/default.jpg`
  }

  return (
    <div
      class="uppy-Dashboard-Item-previewInnerWrap"
      style={{ background: thumbnail ? `url(${thumbnail})` : getFileTypeIcon(props.file.type).color, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
    >
      {
        props.showLinkToFileUploadResult
        && props.file.uploadURL
          && (
          <a
            className="uppy-Dashboard-Item-previewLink"
            href={props.file.uploadURL}
            rel="noreferrer noopener"
            target="_blank"
            aria-label={props.file.meta.name}
          >
            <span hidden>{props.file.meta.name}</span>
          </a>
          )
      }
      {
        !thumbnail
        && <FilePreview file={props.file} />
      }
      <MetaErrorMessage
        file={props.file}
        i18n={props.i18n}
        toggleFileCard={props.toggleFileCard}
        metaFields={props.metaFields}
      />
    </div>
  )
}
