import { h } from 'preact';
import FilePreview from "../../FilePreview.js";
import MetaErrorMessage from "../MetaErrorMessage.js";
import getFileTypeIcon from "../../../utils/getFileTypeIcon.js";
const getYouTubeID = require('get-youtube-id');
function matchYoutubeUrl(url) {
  var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  if (url.match(p)) {
    return url.match(p)[1];
  }
  return false;
}
export default function FilePreviewAndLink(props) {
  var _props$file;
  const {
    file,
    i18n,
    toggleFileCard,
    metaFields,
    showLinkToFileUploadResult
  } = props;
  const white = 'rgba(255, 255, 255, 0.5)';
  const previewBackgroundColor = file.preview ? white : getFileTypeIcon(props.file.type).color;
  let thumbnail = false;
  const url = props == null || (_props$file = props.file) == null || (_props$file = _props$file.remote) == null || (_props$file = _props$file.body) == null ? void 0 : _props$file.url;
  if (url && matchYoutubeUrl(url)) {
    const videoID = getYouTubeID(url, {
      fuzzy: false
    });
    thumbnail = `https://img.youtube.com/vi/${videoID}/default.jpg`;
  }
  return h("div", {
    className: "uppy-Dashboard-Item-previewInnerWrap",
    style: {
      backgroundColor: previewBackgroundColor
    }
  }, showLinkToFileUploadResult && file.uploadURL && h("a", {
    className: "uppy-Dashboard-Item-previewLink",
    href: file.uploadURL,
    rel: "noreferrer noopener",
    target: "_blank",
    "aria-label": file.meta.name
  }, h("span", {
    hidden: true
  }, file.meta.name)), !thumbnail && h(FilePreview, {
    file: file
  }), h(MetaErrorMessage, {
    file: file,
    i18n: i18n,
    toggleFileCard: toggleFileCard,
    metaFields: metaFields
  }));
}