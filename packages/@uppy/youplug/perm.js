const {
  h,
  Component
} = require('preact');

module.exports = class YouplugPerm extends Component {
  constructor(props) {
    super(props); // console.log('UI:construct');

    this.i18n = props.i18n;
    this.cid = props.cid;
    this.onSignIn = props.onSignIn;
    this.handleCredentialResponse = this.handleCredentialResponse.bind(this);
  }

  componentDidMount() {
    const script = document.createElement('script');
    script.defer = true;
    script.async = true;
    script.src = "https://accounts.google.com/gsi/client";
    document.body.appendChild(script);
    google.accounts.id.initialize({
      client_id: this.cid,
      auto_select: true,
      callback: this.handleCredentialResponse
    });
    google.accounts.id.prompt(notification => {
      if (notification.isNotDisplayed()) {
        console.log(notification.getNotDisplayedReason());
      } else if (notification.isSkippedMoment()) {
        console.log(notification.getSkippedReason());
      } else if (notification.isDismissedMoment()) {
        console.log(notification.getDismissedReason());
      }
    });
    google.accounts.id.renderButton(document.getElementById("buttonDiv"), {
      theme: "outline",
      size: "large"
    } // Customization attributes
    );
    google.accounts.id.prompt();
  }

  handleCredentialResponse(response) {
    this.onSignIn(response); //    const decodedToken = jwt_decode(response.credential);
    //    console.log({...decodedToken});
  }

  render() {
    return h("div", {
      className: "uppy-Youplug-loginMenuContainer"
    }, h("div", {
      className: "uppy-Provider-authIcon Youplug"
    }, h("svg", {
      width: "300",
      height: "300",
      viewBox: "0 0 300 300",
      xmlns: "http://www.w3.org/2000/svg"
    }, h("path", {
      d: "M 149.9375 79.222656 C 149.9375 79.222656 86.718651 79.222715 70.851562 83.345703 C 62.355775 85.719505 55.360154 92.715203 52.986328 101.33594 C 48.863375 117.20304 48.863281 150.0625 48.863281 150.0625 C 48.863281 150.0625 48.863375 183.0467 52.986328 198.66406 C 55.360154 207.28468 62.230834 214.15544 70.851562 216.5293 C 86.843592 220.77718 149.9375 220.77734 149.9375 220.77734 C 149.9375 220.77734 213.28168 220.77729 229.14844 216.6543 C 237.76923 214.28049 244.63977 207.53464 246.88867 198.78906 C 251.1366 183.04674 251.13672 150.1875 251.13672 150.1875 C 251.13672 150.1875 251.26156 117.20304 246.88867 101.33594 C 244.63977 92.715203 237.76923 85.844606 229.14844 83.595703 C 213.28168 79.222856 149.9375 79.222656 149.9375 79.222656 z M 129.82227 119.70312 L 182.42188 150.0625 L 129.82227 180.29688 L 129.82227 119.70312 z",
      fill: "white"
    }))), h("div", {
      className: "uppy-Provider-authTitle"
    }, "Authenticate with your YouTube", h("br", null), "account to select files."), h("div", {
      id: "buttonDiv",
      className: "uppy-Youplug-loginButton"
    }));
  }

};