import { h } from 'preact';
import { UIPlugin } from '@uppy/core';
import { Provider } from '@uppy/companion-client';
import { ProviderViews } from '@uppy/provider-views';
const packageJson = {
  "version": "2.1.3"
};
import locale from './locale.js';
export default class Zoom extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = this.opts.id || 'Zoom';
    Provider.initPlugin(this, opts);
    this.title = this.opts.title || 'Zoom';
    this.icon = () => h("svg", {
      "aria-hidden": "true",
      focusable: "false",
      width: "32",
      height: "32",
      viewBox: "0 0 32 32"
    }, h("path", {
      d: "M24.5 11.125l-2.75 2.063c-.473.353-.75.91-.75 1.5v3.124c0 .59.277 1.147.75 1.5l2.75 2.063a.938.938 0 001.5-.75v-8.75a.938.938 0 00-1.5-.75zm-4.75 9.5c0 1.035-.84 1.875-1.875 1.875H9.75A3.75 3.75 0 016 18.75v-6.875C6 10.84 6.84 10 7.875 10H16a3.75 3.75 0 013.75 3.75v6.875z",
      fill: "#2E8CFF",
      "fill-rule": "evenodd"
    }));
    this.provider = new Provider(uppy, {
      companionUrl: this.opts.companionUrl,
      companionHeaders: this.opts.companionHeaders,
      companionKeysParams: this.opts.companionKeysParams,
      companionCookiesRule: this.opts.companionCookiesRule,
      provider: 'zoom',
      pluginId: this.id
    });
    this.defaultLocale = locale;
    this.i18nInit();
    this.title = this.i18n('pluginNameZoom');
    this.onFirstRender = this.onFirstRender.bind(this);
    this.render = this.render.bind(this);
  }
  install() {
    this.view = new ProviderViews(this, {
      provider: this.provider
    });
    const {
      target
    } = this.opts;
    if (target) {
      this.mount(target, this);
    }
  }
  uninstall() {
    this.view.tearDown();
    this.unmount();
  }
  onFirstRender() {
    return Promise.all([this.provider.fetchPreAuthToken(), this.view.getFolder()]);
  }
  render(state) {
    return this.view.render(state);
  }
}
Zoom.VERSION = packageJson.version;