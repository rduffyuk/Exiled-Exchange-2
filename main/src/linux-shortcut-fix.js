// Linux-specific shortcut fixes for Issue #513
// Ensures proper keyboard hook initialization on Linux

const { app } = require('electron');

// Linux-specific uIOhook initialization
if (process.platform === 'linux') {
  // Ensure proper permissions and initialization
  process.env.DISPLAY = process.env.DISPLAY || ':0';
  
  // Add delay for Linux X11 initialization
  const originalStart = require('uiohook-napi').uIOhook.start;
  require('uiohook-napi').uIOhook.start = function() {
    setTimeout(() => {
      try {
        originalStart.call(this);
        console.log('Linux shortcuts initialized successfully');
      } catch (error) {
        console.error('Linux shortcuts initialization failed:', error);
        console.log('Running without sandbox may be required for shortcuts on Linux');
      }
    }, 1000); // 1 second delay for Linux
  };
}

module.exports = {};
