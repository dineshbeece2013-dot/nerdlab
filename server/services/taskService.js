const fs = require('fs');
const path = require('path');

class TaskService {
  static getTaskHtmlContent(relativeFilePath) {
    const fullPath = path.join(__dirname, '..', relativeFilePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Task HTML file not found at path: ${relativeFilePath}`);
    }
    return fs.readFileSync(fullPath, 'utf8');
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
