
import { debounce } from 'lodash';

export class FileSync {
  constructor(onChange) {
    this.onChange = debounce(onChange, 300);
    this.watchedFiles = new Set();
    this.lastContent = '';
  }

  watchFile(filePath) {
    if (!this.watchedFiles.has(filePath)) {
      this.watchedFiles.add(filePath);
      this.startFileWatch(filePath);
    }
  }

  startFileWatch(filePath) {
    setInterval(() => {
      fetch(filePath)
        .then(response => response.text())
        .then(content => {
          if (content !== this.lastContent) {
            this.lastContent = content;
            this.onChange(content);
          }
        });
    }, 1000);
  }

  updateContent(content) {
    this.lastContent = content;
    this.onChange(content);
  }
}
