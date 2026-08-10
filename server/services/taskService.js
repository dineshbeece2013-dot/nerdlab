const fs = require('fs');
const path = require('path');

class TaskService {
  /**
   * A lab is either a single .html file or a directory bundle containing
   * index.html plus its own assets (ADR-010). Bundles are served statically so
   * their relative paths resolve; single files are still sent inline.
   */
  static resolveLab(relativeFilePath) {
    if (!relativeFilePath) return { kind: 'missing' };
    const fullPath = path.resolve(__dirname, '..', relativeFilePath);
    const tasksRoot = path.resolve(__dirname, '..', 'tasks');

    // Never resolve outside server/tasks, whatever the database says.
    if (fullPath !== tasksRoot && !fullPath.startsWith(tasksRoot + path.sep)) {
      return { kind: 'missing' };
    }
    if (!fs.existsSync(fullPath)) return { kind: 'missing' };

    if (fs.statSync(fullPath).isDirectory()) {
      if (!fs.existsSync(path.join(fullPath, 'index.html'))) {
        return { kind: 'invalid', reason: 'bundle has no index.html' };
      }
      // e.g. tasks/docker/compose-quest -> /labs/docker/compose-quest/index.html
      const rel = relativeFilePath.replace(/\\/g, '/').replace(/^tasks\//, '').replace(/\/+$/, '');
      return { kind: 'bundle', url: `/labs/${rel}/index.html`, fullPath };
    }
    return { kind: 'file', fullPath };
  }

  static getTaskHtmlContent(relativeFilePath) {
    const lab = this.resolveLab(relativeFilePath);
    if (lab.kind === 'bundle') {
      // Reading index.html inline would break every relative asset in the bundle.
      throw new Error(`Task ${relativeFilePath} is a bundle — load it from ${lab.url}`);
    }
    if (lab.kind !== 'file') {
      throw new Error(`Task HTML file not found at path: ${relativeFilePath}`);
    }
    return fs.readFileSync(lab.fullPath, 'utf8');
  }

  static saveTaskHtmlFile(categorySlug, taskFileName, htmlContent) {
    const dirPath = path.join(__dirname, '..', 'tasks', categorySlug);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const fullPath = path.join(dirPath, taskFileName);
    fs.writeFileSync(fullPath, htmlContent, 'utf8');
    return `tasks/${categorySlug}/${taskFileName}`;
  }

  static deleteTaskHtmlFile(relativeFilePath) {
    if (!relativeFilePath) return false;

    const tasksRoot = path.join(__dirname, '..', 'tasks');
    const fullPath = path.resolve(__dirname, '..', relativeFilePath);

    // Refuse to delete anything outside the tasks directory
    if (!fullPath.startsWith(tasksRoot + path.sep)) {
      return false;
    }

    if (!fs.existsSync(fullPath)) return false;
    fs.unlinkSync(fullPath);
    return true;
  }
}

module.exports = TaskService;
