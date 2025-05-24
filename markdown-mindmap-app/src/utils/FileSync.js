
import { debounce } from 'lodash';

export class FileSync {
  constructor(onChange) {
    this.onChange = debounce(onChange, 300);
    this.watchedFiles = new Set();
  }

  watchFile(filePath) {
    if (!this.watchedFiles.has(filePath)) {
      this.watchedFiles.add(filePath);
      // Implementation for file watching will go here
    }
  }

  updateContent(content) {
    this.onChange(content);
  }
}
