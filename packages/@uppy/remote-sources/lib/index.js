function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
import { BasePlugin } from '@uppy/core';
import Dropbox from '@uppy/dropbox';
import GoogleDrive from '@uppy/google-drive';
import Instagram from '@uppy/instagram';
import Facebook from '@uppy/facebook';
import OneDrive from '@uppy/onedrive';
import Box from '@uppy/box';
import Unsplash from '@uppy/unsplash';
import Url from '@uppy/url';
import Zoom from '@uppy/zoom';
const packageJson = {
  "version": "1.1.0"
};
const availablePlugins = {
  // Using a null-prototype object to avoid prototype pollution.
  __proto__: null,
  Box,
  Dropbox,
  Facebook,
  GoogleDrive,
  Instagram,
  OneDrive,
  Unsplash,
  Url,
  Zoom
};
var _installedPlugins = /*#__PURE__*/_classPrivateFieldLooseKey("installedPlugins");
export default class RemoteSources extends BasePlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    Object.defineProperty(this, _installedPlugins, {
      writable: true,
      value: new Set()
    });
    this.id = this.opts.id || 'RemoteSources';
    this.type = 'preset';
    const defaultOptions = {
      sources: Object.keys(availablePlugins)
    };
    this.opts = {
      ...defaultOptions,
      ...opts
    };
    if (this.opts.companionUrl == null) {
      throw new Error('Please specify companionUrl for RemoteSources to work, see https://uppy.io/docs/remote-sources#companionUrl');
    }
  }
  setOptions(newOpts) {
    this.uninstall();
    super.setOptions(newOpts);
    this.install();
  }
  install() {
    this.opts.sources.forEach(pluginId => {
      const optsForRemoteSourcePlugin = {
        ...this.opts,
        sources: undefined
      };
      const plugin = availablePlugins[pluginId];
      if (plugin == null) {
        const pluginNames = Object.keys(availablePlugins);
        const formatter = new Intl.ListFormat('en', {
          style: 'long',
          type: 'disjunction'
        });
        throw new Error(`Invalid plugin: "${pluginId}" is not one of: ${formatter.format(pluginNames)}.`);
      }
      this.uppy.use(plugin, optsForRemoteSourcePlugin);
      // `plugin` is a class, but we want to track the instance object
      // so we have to do `getPlugin` here.
      _classPrivateFieldLooseBase(this, _installedPlugins)[_installedPlugins].add(this.uppy.getPlugin(pluginId));
    });
  }
  uninstall() {
    for (const plugin of _classPrivateFieldLooseBase(this, _installedPlugins)[_installedPlugins]) {
      this.uppy.removePlugin(plugin);
    }
    _classPrivateFieldLooseBase(this, _installedPlugins)[_installedPlugins].clear();
  }
}
RemoteSources.VERSION = packageJson.version;