const express = require('express')

const { startDownUpload } = require('../helpers/upload')
const { prepareStream } = require('../helpers/utils')
const { validateURL } = require('../helpers/request')
const { getURLMeta, getProtectedGot } = require('../helpers/request')
const logger = require('../logger')
// @ts-ignore
const request = require('request')
const tls = require('tls')
const fs = require('fs');
const path = require('path');
const caBundlePath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '__spotlightr_com.ca-bundle');
const ca = fs.readFileSync(caBundlePath);
const trustedCAs = [
  ...tls.rootCertificates,
  ca
]

function identifyLinkType(url) {
  const hostname = new URL(url).hostname;
  const pathname = new URL(url).pathname;

  // Normalize hostname (e.g., remove 'www.')
  const normalizedHostname = hostname.replace(/^www\./, '');

  // List of substrings or regex patterns to match supported sites (focus on larger platforms)
  const supportedPatterns = [
    /vimeo\.com/,  // Vimeo
    /dailymotion\.com/,  // Dailymotion
    /soundcloud\.com/,  // SoundCloud (for audio)
    /tiktok\.com/,  // TikTok
    /twitch\.tv/,  // Twitch
    /facebook\.com/,  // Facebook
    /instagram\.com/,  // Instagram
    /vevo\.com/,  // Vevo
    /twitter\.com/,  // Twitter
    /linkedin\.com/,  // LinkedIn (for video posts)
  ];

  // Handle YouTube specifically
  if (normalizedHostname === 'youtube.com' || normalizedHostname === 'youtu.be') {
    // Check if it's a YouTube Shorts or a special type
    if (pathname.includes('/shorts')) {
      return 'yt-dlp-supported'; // Use yt-dlp for YouTube Shorts
    } else {
      return 'ytdl-youtube'; // Use ytdl-core for regular YouTube videos
    }
  }

  // Check if the URL matches any known patterns
  for (let pattern of supportedPatterns) {
    if (pattern.test(normalizedHostname) || pattern.test(pathname)) {
      return 'yt-dlp-supported';
    }
  }

  // Check for direct URL (assumed to be direct if not yt-dlp supported)
  return 'direct-url';
}

function matchYoutubeUrl(url) {
  var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  if(url.match(p)){
      return url.match(p)[1];
  }
  return false;
}

/**
 * @callback downloadCallback
 * @param {Error} err
 * @param {string | Buffer | Buffer[]} chunk
 */

/**
 * Downloads the content in the specified url, and passes the data
 * to the callback chunk by chunk.
 *
 * @param {string} url
 * @param {boolean} blockLocalIPs
 * @param {string} traceId
 * @returns {Promise}
 */
const downloadURL = async (url, blockLocalIPs, traceId) => {
  // TODO in next major, rename all blockLocalIPs to allowLocalUrls and invert the bool, to make it consistent
  // see discussion https://github.com/transloadit/uppy/pull/4554/files#r1268677162

  // add CA somehow?
  // ca: trustedCAs

  try {
    const protectedGot = getProtectedGot({ url, blockLocalIPs })
    const stream = protectedGot.stream.get(url, { responseType: 'json' })
    await prepareStream(stream)
    return stream
  } catch (err) {
    logger.error(err, 'controller.url.download.error', traceId)
    throw err
  }
}

function fetchYouTubeVideoMetadata(videoUrl) {
  const endpoints = [
    "https://us-east4-maestro-218920.cloudfunctions.net/getYoutubeURLMeta2",
    "https://us-east4-maestro-218920.cloudfunctions.net/getYoutubeURLMeta",
    // "https://us-east4-maestro-218920.cloudfunctions.net/getYoutubeURLMetaNew",
    "https://us-central1-maestro-218920.cloudfunctions.net/getYoutubeURLMeta5",
    "https://us-east1-maestro-218920.cloudfunctions.net/getYoutubeURLMeta3",
    "https://us-west1-maestro-218920.cloudfunctions.net/getYoutubeURLMeta4",
    "https://us-east4-maestro-218920.cloudfunctions.net/getYoutubeURLMetaNew",
  ]

  const baseOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoUrl }),
  };

  return new Promise((resolve, reject) => {
    const tryFetch = (endpointIndex) => {
      if (endpointIndex >= endpoints.length) {
        reject(new Error('All endpoints failed.'));
        return;
      }

      const options = {
        ...baseOptions,
        url: endpoints[endpointIndex],
      };

      request(options, (error, response, body) => {
        if (error) {
          console.error('Error fetching YouTube video metadata:', error);
          reject(error);
          return;
        }

        if (response && response.statusCode === 200) {
          const data = JSON.parse(body);
          resolve({
            videoID: data.videoID,
            name: data.name,
            type: data.type,
            size: data.size,
          });
        } else if (response && (response.statusCode === 403 || response.statusCode === 500)) {
          console.warn(`Access forbidden at endpoint ${endpoints[endpointIndex]}. Trying next endpoint...`);
          tryFetch(endpointIndex + 1);
        } else {
          reject(new Error(`Failed to fetch metadata. Status code: ${response ? response.statusCode : 'N/A'}`));
        }
      });
    };

    tryFetch(0);
  });
}

/**
 * Fetches the size and content type of a URL
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
 const meta = async (req, res) => {
  try {
    logger.debug('URL file import handler running', null, req.id)
    let url = req.body.url
    const { allowLocalUrls } = req.companion.options
    if (!validateURL(url, allowLocalUrls)) {
      logger.debug('Invalid request body detected. Exiting url meta handler.', null, req.id)
      return res.status(400).json({ error: 'Invalid request body' })
    }

    const urlType = identifyLinkType(url);
    const urlMeta = urlType === 'direct-url' ? await getURLMeta(url, !allowLocalUrls) : await fetchYouTubeVideoMetadata(url);
    // const urlMeta =await fetchYouTubeVideoMetadata(url)

    return res.json(urlMeta)
  }
  catch(err) {
    logger.error(err, 'controller.url.meta.error', req.id)
    return res.status(err.status || 500).json({ message: 'failed to fetch URL metadata' })
  }
}

/**
 * Handles the reques of import a file from a remote URL, and then
 * subsequently uploading it to the specified destination.
 *
 * @param {object} req expressJS request object
 * @param {object} res expressJS response object
 */
const get = async (req, res) => {
  logger.debug('URL file import handler running', null, req.id)
  const { allowLocalUrls } = req.companion.options
  let url = req.body.url
  let isYoutubeUrl = false
  if (!validateURL(url, allowLocalUrls)) {
    logger.debug('Invalid request body detected. Exiting url import handler.', null, req.id)
    res.status(400).json({ error: 'Invalid request body' })
    return
  }
  const urlType = identifyLinkType(url);

  async function getSize() {
    if (req.body.size) {
      return req.body.size //early exit with front end cached data
    }
    const { size } = urlType === 'direct-url' ? await getURLMeta(url, !allowLocalUrls) : await fetchYouTubeVideoMetadata(url);
    return size;
  }

  try {
    if (urlType !== 'direct-url') {
      startDownUpload({ req, res, getSize, download: false, externalUrl: url, urlType })
    }
    else {
      async function download() {
        return downloadURL(url, !allowLocalUrls, req.id)
      }
      await startDownUpload({ req, res, getSize, download, externalUrl: false, urlType: 'direct-url' });
    }
  } catch (err) {
    logger.error(err, 'controller.url.error', req.id)
    res.status(err.status || 500).json({ message: 'failed to fetch URL' })
  }
}

module.exports = () => express.Router()
  .post('/meta', express.json(), meta)
  .post('/get', express.json(), get)
