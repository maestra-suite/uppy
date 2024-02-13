const {
  h,
  Component
} = require('preact');

const UILeftPane = require('./ui-left.js');

module.exports = class YouplugUI extends Component {
  constructor(props) {
    super(props);
    this.i18n = props.i18n;
    this.uppy = props.uppy;
    this.logout = props.logout;
    this.retriever = props.retriever;
    this.prevToken = props.prevToken;
    this.nextToken = props.nextToken;
  }

  componentDidMount() {}

  render() {
    return h(UILeftPane, {
      i18n: this.i18n,
      uppy: this.uppy,
      logout: this.logout,
      retriever: this.retriever,
      prevToken: this.prevToken,
      nextToken: this.nextToken
    });
  }

};