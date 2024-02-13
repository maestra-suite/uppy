const {
  h,
  Component
} = require('preact');

const {
  useState
} = require('preact/hooks');

module.exports = class UILeftPane extends Component {
  constructor(props) {
    super(props);
    this.i18n = props.i18n;
    this.uppy = props.uppy;
    this.logout = props.logout;
    this.retriever = props.retriever;
    this.prevToken = props.prevToken;
    this.nextToken = props.nextToken;
    this.formSend = this.formSend.bind(this);
  }

  formSend(event) {
    event.preventDefault();
    let Urls = [];
    const YOUTUBE_BASEURL = 'https://www.youtube.com/watch?v=';
    const selectedItems = [...document.querySelectorAll('input[type=checkbox]:checked')].map(selectedVid => Urls.push(YOUTUBE_BASEURL + selectedVid.getAttribute('value')));
    Urls.map(item => this.uppy.getPlugin('Url').addFile(item)); // .then(this.uppy.upload);
    //        this.uppy.getPlugin('Url').addFile('https://example.com/myfile.pdf').then(this.uppy.upload);
  }

  render() {
    return h("form", {
      onSubmit: this.formSend,
      className: 'uppy-Youplug-listForm'
    }, [h("input", {
      type: "submit",
      value: "Next",
      className: "uppy-DashboardContent-back uppy-Youplug-next-button"
    }), h(ThumbsList, {
      uppy: this.uppy,
      prevToken: this.prevToken,
      nextToken: this.nextToken,
      retriever: this.retriever,
      videos: this.uppy.getState().videos
    })]);
  }

};

const ThumbsList = props => {
  let gallery;
  let lngs = [];

  if (props.videos) {
    gallery = props.videos.map((item, idx) => {
      // const dateText = moment(item.date).format('MMMM Do YYYY')
      const dateText = item.date;

      if (item.cpts) {
        item.cpts.forEach(function (el, ix) {
          lngs[ix] = el.lang;
        });
      }

      return h("li", {
        className: "uppy-Youplug-listItem"
      }, [h("input", {
        type: "checkbox",
        value: item.vdId,
        name: "selectedVideos",
        className: 'uppy-Youplug-listItem-checkbox'
      }), h("img", {
        src: item.tmbm,
        width: "50",
        height: "40"
      }), h("div", {
        className: 'uppy-Youplug-listItem-textContainer'
      }, h("span", {
        className: 'uppy-Dashboard-Item-name'
      }, item.titl), h("span", {
        className: 'uppy-Dashboard-Item-status uppy-Dashboard-Item-statusSize'
      }, dateText))]);
    });
  }

  const cleanClasses = () => {
    var pW = document.querySelector('.pagination-wrapper');
    if (pW.classList.contains('transition-next')) pW.classList.remove('transition-next');
    if (pW.classList.contains('transition-prev')) pW.classList.remove('transition-prev');
  };

  const doPagingUI = (event, token) => {
    if (token) {
      var pW = document.querySelector('.pagination-wrapper'); //    pW.classList.add('transition-'+(this.classList.contains('btn--prev') ? 'prev' : 'next'));
      //    var tOut = setTimeout(this.cleanClasses, 500);

      props.uppy.setState({
        'activeToken': token,
        'videos': null,
        'prevToken': null,
        'nextToken': null
      });
      props.retriever();
    }
  };

  return props.uppy.getState().prevToken === '' && props.uppy.getState().nextToken === '' ? h('ul', {
    className: "uppy-Youplug-listContainer"
  }, gallery) : h('ul', {
    className: "uppy-Youplug-listContainer"
  }, [gallery, h('div', {
    className: "uppy-Dashboard-paging"
  }, [//        h('div', { className: "pagination-wrapper"}, [
  h('div', {
    className: "pagination-controller",
    style: "width:78px;",
    onClick: e => doPagingUI(e, props.uppy.getState().prevToken)
  }, [h('svg', {
    className: "btn btn--prev",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg"
  }, [h('path', {
    d: "M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"
  }), h('path', {
    d: "M0-.5h24v24H0z",
    fill: "none"
  })])]),
  /*
            h('div', { className: "pagination-container"}, [
              h('div', { className: "little-dot  little-dot--first"}),
              h('div', { className: "little-dot"}, [
                h('div', { className: "big-dot-container"}, [
                  h('div', { className: "big-dot"})
                ]),
              ]),
            ]),
  */
  h('div', {
    className: "pagination-controller",
    style: "width:78px;",
    onClick: e => doPagingUI(e, props.uppy.getState().nextToken)
  }, [h('svg', {
    className: "btn btn--next",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg"
  }, [h('path', {
    d: "M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"
  }), h('path', {
    d: "M0-.25h24v24H0z",
    fill: "none"
  })])]) //        ])
  ])]);
};