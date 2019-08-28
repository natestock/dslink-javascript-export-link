const fs = require("fs");
const path = require("path");
const { DSLink, RootNode, ActionNode, Permission, DsError } = require("dslink");

class ExportNodes extends ActionNode {
  constructor(path, provider) {
    super(path, provider,
      Permission.CONFIG
    );
  }

  initialize() {
    this.setConfig('$params', [{ name: 'dslink', type: 'string' }]);
    this.setConfig('$columns', [{ name: 'output', type: 'string' }]);
  }

  onInvoke(params) {
    let { dslink } = params;
    if (typeof dslink !== 'string' || dslink.includes('.')) {
      return new DsError('invalidInput', { msg: 'invalid dslink' });
    }
    let nodeJsonPath = path.join(__dirname, `../${dslink}/nodes.json`);
    try {
      let data = fs.readFileSync(nodeJsonPath, { encoding: 'utf8' });
      return { output: data };
    } catch (e) {
      return new DsError('failed', { msg: 'failed to open nodes.json' });
    }
  }
}


class ImportNodes extends ActionNode {
  constructor(path, provider) {
    super(path, provider,
      Permission.CONFIG
    );
  }

  initialize() {
    this.setConfig('$params', [{ name: 'dslink', type: 'string' }, { name: 'data', type: 'string' }]);
  }

  onInvoke(params) {
    let { dslink, data } = params;
    if (typeof dslink !== 'string' || dslink.includes('.')) {
      return new DsError('invalidInput', { msg: 'invalid dslink' });
    }
    try {
      let parsedData = JSON.parse(data);
      if (parsedData.constructor !== Object) {
        throw new Error();
      }
    } catch (e) {
      return new DsError('invalidInput', { msg: 'invalid data' });
    }
    let nodeJsonPath = path.join(__dirname, `../${dslink}/nodes.json`);
    try {
      fs.writeFileSync(nodeJsonPath, data);
    } catch (e) {
      return new DsError('failed', { msg: 'failed to save nodes.json' });
    }
  }
}


function main() {
  // create a root node
  let rootNode = new RootNode();

  // add child to root
  rootNode.createChild('export', ExportNodes);
  rootNode.createChild('import', ImportNodes);

  // create the link
  let link = new DSLink('export-link', { rootNode });

  link.connect();
}

main();
