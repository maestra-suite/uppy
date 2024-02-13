var _class, _temp;

const {
  UIPlugin
} = require('@uppy/core');

const {
  h
} = require('preact');

const axios = require('axios');

const UIScreen = require('./ui.js');

const PermScreen = require('./perm.js');

const locale = require('./locale.js');

const GTAP = "https://accounts.google.com/gsi/client";
const GAPI = "https://apis.google.com/js/client:platform.js";
/**
 * Youplug
 */

module.exports = (_temp = _class = class Youplug extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.type = 'acquirer';
    this.uppy = uppy;
    this.id = this.opts.id || 'Youplug';
    this.title = this.opts.title || 'Youplug';
    this.provider = "youtube";
    this.credentials = opts.credentials;

    this.icon = () => h(TheIcon, null);

    this.clientConfig = {
      'cookie_policy': 'single_host_origin',
      'discoveryDocs': 'https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest',
      'scope': 'profile email https://www.googleapis.com/auth/youtubepartner'
    };
    this.clientConfig.clientId = this.credentials.web.client_id;
    this.permConfig = {
      'client_id': this.credentials.web.client_id,
      'discoveryDocs': this.clientConfig.discoveryDocs,
      'apiKey': 'AIzaSyDYKgIZni9Jm-qbu4pMuOxaB6899RFu6dY',
      'scope': this.clientConfig.scope,
      'ux_mode': 'popup',
      'fetch_basic_profile': true,
      'redirect_uri': this.credentials.web.redirect_uris[0],
      'cookie_policy': this.clientConfig.cookie_policy
    };
    this.uppy.setState({
      user: '',
      videos: null,
      selectedVideo: '',
      selectedLang: 'en',
      authed: false,
      modalOpen: false,
      permOK: false,
      gapiReady: false,
      mountedReady: false,
      activeToken: null,
      prevToken: '',
      nextToken: ''
    }); // Set default options and locale

    this.defaultLocale = locale;
    const defaultOptions = {
      type: 'acquirer',
      id: this.id,
      title: this.title
    };
    this.opts = { ...defaultOptions,
      ...opts
    };
    this.i18nInit();
    this.install = this.install.bind(this);
    this.uninstall = this.uninstall.bind(this);
    this.onMount = this.onMount.bind(this);
    this.onSignInX = this.onSignInX.bind(this);
    this.stateVideos = this.stateVideos.bind(this);
    this.afterModalOpened = this.afterModalOpened.bind(this);
    this.afterModalClosed = this.afterModalClosed.bind(this);
    this.render = this.render.bind(this);
    this.logout = this.logout.bind(this);
    this.retriever = this.retriever.bind(this);
  }

  install() {
    if (this.target) {
      this.mount(this.target, this);
    }

    this.onMount();
    console.log('onInstall');
  }

  uninstall() {
    this.unmount();
  }

  base64urlDecode(str) {
    return new Buffer(this.base64urlUnescape(str), 'base64').toString();
  }

  base64urlUnescape(str) {
    str += Array(5 - str.length % 4).join('=');
    return str.replace(/\-/g, '+').replace(/_/g, '/');
  }

  onGapiLoad() {
    window.gapi.load('client');
  }

  onMount() {
    if (!this.uppy.getState().gapiReady) {
      //      console.log('onMount once');
      const metatag = document.createElement('script');
      metatag.setAttribute('name', 'google-signin-client_id');
      metatag.setAttribute('content', this.credentials.web.client_id);
      document.getElementsByTagName('head')[0].appendChild(metatag);
      const scriptGAPI = document.createElement('script');
      scriptGAPI.defer = true;
      scriptGAPI.async = true;
      scriptGAPI.src = GAPI;

      scriptGAPI.onload = event => this.onGapiLoad();

      document.body.appendChild(scriptGAPI);
      const scriptGTAP = document.createElement('script');
      scriptGTAP.defer = true;
      scriptGTAP.async = true;
      scriptGTAP.src = GTAP; //      script.onload = (event) => this.onGapiLoad();

      document.body.appendChild(scriptGTAP);
      this.uppy.on('dashboard:modal-open', () => this.afterModalOpened());
      this.uppy.on('dashboard:modal-closed', () => this.afterModalClosed());
      this.uppy.setState({
        gapiReady: true
      });
    }
  }

  onSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('lang', 'en');
    formData.append('code', this.props.code);
    formData.append('tokens', this.props.tokens);
    formData.append('uid', this.props.uid);
    formData.append('id', 'hf0YXTefxj8');
    formData.append('theFile', this.state.theFile);
    axios.post("http://localhost:3000/api/captions/set", formData, {}).then(res => {//      console.log(res)
    });
  }

  onSignInX(gRes) {
    var segments = gRes.credential.split('.');

    if (segments.length !== 3) {
      throw new Error('Not enough or too many segments');
    } // All segment should be base64


    var headerSeg = segments[0];
    var payloadSeg = segments[1];
    var signatureSeg = segments[2]; // base64 decode and parse JSON

    var header = JSON.parse(this.base64urlDecode(headerSeg));
    var payload = JSON.parse(this.base64urlDecode(payloadSeg));
    const response = {
      token: gRes.credential,
      header: header,
      payload: payload,
      signature: signatureSeg
    };
    console.log('ClientID check ' + (response.payload.aud === this.permConfig.client_id ? 'is ok.' : 'has failed.'));
    console.log('ISS check ' + (response.payload.iss === 'https://accounts.google.com' || response.payload.iss === 'accounts.google.com' ? 'is ok.' : 'has failed.'));
    window.gapi.auth2.authorize({
      apiKey: this.permConfig.apiKey,
      client_id: this.credentials.web.client_id,
      prompt: 'select_account',
      response_type: 'permission id_token token code',
      // Access Token.
      scope: this.clientConfig.scope,
      login_hint: gRes.credential.email
    }, authorizeResult => {
      if (authorizeResult.error === 'immediate_failed') {
        alert('You need to select user to successfully authorize this application to continue.');
      } else if (authorizeResult.error === 'popup_closed_by_user') {
        alert('The authorization popup shouldnt be blocked or closed to function properly.');
      } else if (authorizeResult.error === 'access_denied') {
        alert('You denied the permission to the scopes required by the authorization flow.');
      } else if (authorizeResult.error === 'idpiframe_initialization_failed') {
        alert('Sorry, you are using an unsupported environment.');
      } // return;
      // const options = new gapi.auth2.SigninOptionsBuilder();
      // options.setPrompt('select_account');


      this.retriever();
    });
  }

  retriever() {
    let pagingFlag = false;
    window.gapi.client.init({
      'apiKey': this.permConfig.apiKey,
      'discoveryDocs': [this.clientConfig.discoveryDocs]
    }).then(() => this.getChannelList()).then(response => {
      return this.getUploadedList(response.result.items)}).then(response => {
      if (response.result.pageInfo) {
        pagingFlag = response.result.pageInfo.totalResults > response.result.pageInfo.resultsPerPage ? true : false;
      }
      return response;
    }).then(response => {
      if (response.result.nextPageToken) {
        this.uppy.setState({
          nextToken: response.result.nextPageToken
        });
      }

      if (response.result.prevPageToken) {
        this.uppy.setState({
          prevToken: response.result.prevPageToken
        });
      }

      return response;
    }).then(response => this.getCaptionList(response.result.items)).then(videos => this.stateVideos(videos)).catch(e => console.dir(e));
  }

  getChannelList() {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await window.gapi.client.youtube.channels.list({
          'mine': true,
          'part': 'snippet,contentDetails,statistics',
          'maxResults': 50
        });
        resolve(res)
      }
      catch(error) {
        reject(error)
      }
    })
  }

  getUploadedList(items) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!items || !items[0] || !items[0].id) {
          return resolve({
            result: {
              items: []
            }
          })
        }
        const channelId = items[0].id;
        console.log('channel id is:' + channelId);
        const uploadsId = items[0].contentDetails.relatedPlaylists.uploads;
        console.log('uploads channel id is:' + uploadsId);
        const baseReq = {
          'playlistId': uploadsId,
          'part': 'id,contentDetails,snippet,status',
          'maxResults': 10
        };
        const pageReq = this.uppy.getState().activeToken ? {
          'pageToken': this.uppy.getState().activeToken
        } : {};
        const listVal = await window.gapi.client.youtube.playlistItems.list({ ...baseReq,
          ...pageReq
        });
        resolve(listVal)
      }
      catch(error) {
        reject(error)
      }
    })
    
  }

  crunchCaptions(capSet) {
    let caps = {};

    for (let idx in capSet.result.items) {
      caps[capSet.result.items[idx].snippet.language] = capSet.result.items[idx].id;
    }

    return JSON.stringify(caps);
  }

  getCaptionList(items) {
    let playList = [];

    for (let vidx in items) {
      const pita = {
        'vdId': items[vidx].contentDetails.videoId,
        'tmbd': items[vidx].snippet.thumbnails.default.url,
        'tmbm': items[vidx].snippet.thumbnails.medium.url,
        'titl': items[vidx].snippet.title,
        'date': items[vidx].contentDetails.videoPublishedAt,
        'stat': items[vidx].status.privacyStatus //            'cpts': enced

      };
      playList.push(pita);
    } // end of for in ... responsePlId.result.items


    return playList;
  }

  stateVideos(incoming) {
    this.uppy.setState({
      authed: true,
      videos: incoming
    });
  }

  logout(e) {
    e.preventDefault();
    this.gapi.auth2.init(this.permConfig).then(auth => {
      auth.signOut();
      this.uppy.setState({
        user: '',
        videos: null,
        authed: false,
        modalOpen: false,
        permOK: false,
        prevToken: '',
        nextToken: ''
      });
      this.uppy.logout(); //      this.forceUpdate();
    });
  }

  listPlugins() {
    this.uppy.iteratePlugins((cur, index, arr) => console.dir(cur));
  }

  afterModalOpened() {
    const dash = this.uppy.getPlugin('react:DashboardModal') || this.uppy.getPlugin('react:Dashboard') || this.uppy.getPlugin('Dashboard');

    if (dash && !this.uppy.getState().mountedReady) {
      this.parent = dash;
      this.el = dash.addTarget(this.uppy.getPlugin(this.id));
      this.onMount();
      this.uppy.setState({
        'mountedReady': true
      });
    }
  }

  afterModalClosed() {
    this.uppy.setState({
      authed: false
    });
    console.log('onModal close');
  }

  render() {
    return this.uppy.getState().authed ? h(UIScreen, {
      i18n: this.i18n,
      logout: this.logout,
      uppy: this.uppy,
      retriever: this.retriever,
      prev: this.uppy.getState().prevToken,
      next: this.uppy.getState().nextToken
    }) : h(PermScreen, {
      i18n: this.i18n,
      cid: this.permConfig.client_id,
      onSignIn: this.onSignInX,
      account_id: this.account_id
    });
  }

}, _class.VERSION = "1.1.0", _temp);

function TheIcon() {
  return h("svg", {
    width: "1200",
    height: "800",
    viewBox: "-35.20005 -41.33325 305.0671 247.9995",
    xmlns: "http://www.w3.org/2000/svg",
    className: "uppy-Youplug-icon"
  }, [
    h("path", {
      d: "M229.763 25.817c-2.699-10.162-10.65-18.165-20.748-20.881C190.716 0 117.333 0 117.333 0S43.951 0 25.651 4.936C15.553 7.652 7.6 15.655 4.903 25.817 0 44.236 0 82.667 0 82.667s0 38.429 4.903 56.85C7.6 149.68 15.553 157.681 25.65 160.4c18.3 4.934 91.682 4.934 91.682 4.934s73.383 0 91.682-4.934c10.098-2.718 18.049-10.72 20.748-20.882 4.904-18.421 4.904-56.85 4.904-56.85s0-38.431-4.904-56.85",
      fill: "#ff0000"
    }),
    h("path", {
      d: "M93.333 117.559l61.333-34.89-61.333-34.894",
      fill: "#fff"
    })
  ]);
}