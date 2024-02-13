const {
  h
} = require('preact');

const FilePreview = require('../../FilePreview');

const MetaErrorMessage = require('../MetaErrorMessage');

const getFileTypeIcon = require('../../../utils/getFileTypeIcon');

const getYouTubeID = require('get-youtube-id');

function matchYoutubeUrl(url) {
  var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

  if (url.match(p)) {
    return url.match(p)[1];
  }

  return false;
}

module.exports = function FilePreviewAndLink(props) {
  var _props$file, _props$file$remote, _props$file$remote$bo;

  let thumbnail = false;
  const url = props == null ? void 0 : (_props$file = props.file) == null ? void 0 : (_props$file$remote = _props$file.remote) == null ? void 0 : (_props$file$remote$bo = _props$file$remote.body) == null ? void 0 : _props$file$remote$bo.url;

  if (url && matchYoutubeUrl(url)) {
    const videoID = getYouTubeID(url, {
      fuzzy: false
    });
    thumbnail = `https://img.youtube.com/vi/${videoID}/default.jpg`;
  }

  return h("div", {
    class: "uppy-Dashboard-Item-previewInnerWrap",
    style: {
      background: thumbnail ? `url(${thumbnail})` : getFileTypeIcon(props.file.type).color,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    }
  }, props.showLinkToFileUploadResult && props.file.uploadURL && h("a", {
    className: "uppy-Dashboard-Item-previewLink",
    href: props.file.uploadURL,
    rel: "noreferrer noopener",
    target: "_blank",
    "aria-label": props.file.meta.name
  }, h("span", {
    hidden: true
  }, props.file.meta.name)), !thumbnail && h(FilePreview, {
    file: props.file
  }), h(MetaErrorMessage, {
    file: props.file,
    i18n: props.i18n,
    toggleFileCard: props.toggleFileCard,
    metaFields: props.metaFields
  }));
};