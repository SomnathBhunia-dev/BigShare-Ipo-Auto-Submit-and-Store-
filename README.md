# BigShare IPO Allotment Checker v3.0

![Version](https://img.shields.io/badge/version-3.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A powerful, modern Chrome Extension to automate the process of checking IPO allotment status on the BigShare Online portal. Designed for efficiency and aesthetics, it supports bulk checking, persistent storage, and visual analytics.

## 🚀 Features

- **Automated Bulk Checking**: Process multiple application numbers in one go. The extension handles the form submission automatically, prompting you only for the CAPTCHA.
- **Persistent Storage**: Never lose your results. All fetched statuses are saved locally and persist across browser restarts.
- **Smart Sorting**:
  - **Companies**: The most recently updated IPO company always appears at the top of your list.
  - **Results**: Individual application results are stored in the order they were processed.
- **Visual Analytics**:
  - **Pie Charts**: Instantly visualize your allotment success rate (Allotted vs. Not Allotted) for each company with beautiful, color-coded pie charts.
  - **Detailed Legends**: Clear breakdown of allotment statistics.
- **Premium UI/UX**:
  - **Dark Mode**: A sleek, modern dark interface with glassmorphism effects.
  - **Responsive Design**: Fully optimized for both desktop and mobile screens.
- **Race Condition Handling**: Robust backend logic ensures no data is lost when processing multiple IDs rapidly.

## 🤝 Supported Brokers

Currently, the extension supports automatic ID extraction for the following brokers:

- **Groww**: IDs starting with `GROWW` followed by 11 alphanumeric characters.
- **Zerodha**: IDs starting with 2 letters followed by 12 digits (e.g., `KX0830...`).

*Note: You can manually enter other IDs, but the auto-extraction regex is optimized for these formats.*

## 📱 Mobile Support

Yes! You can use this extension on your Android phone.

1.  Download **Kiwi Browser** from the Google Play Store (it supports Chrome Extensions).
2.  Follow the **Installation** steps below to load the extension into Kiwi Browser.
3.  Navigate to the BigShare IPO status page and use the extension just like on Desktop.

## 🛠️ Installation

### For Developers / Manual Installation

1.  **Download the Extension**:
    - Download the project as a ZIP file from GitHub.
    - Extract the ZIP file to a folder on your computer.
2.  **Open Chrome Extensions**:
    - Navigate to `chrome://extensions/` in your browser.
    - Toggle **Developer mode** in the top right corner.
3.  **Load Unpacked**:
    - Click on **Load unpacked**.
    - Select the directory where you cloned/downloaded this project.
4.  **Pin & Use**:
    - Pin the extension to your toolbar for easy access.

## 📖 Usage

1.  **Navigate**: Go to the [BigShare IPO Status Page](https://ipo.bigshareonline.com/IPO_Status.html).
2.  **Open Extension**: Click the extension icon.
3.  **Input IDs**: Paste your application IDs (bulk text is supported).
4.  **Start**: Click **Check Status**.
5.  **CAPTCHA**: The script will fill the ID and highlight the CAPTCHA box. Enter the CAPTCHA code when prompted.
6.  **View Results**: Results will be saved and displayed instantly in the popup with visual charts.

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3 (Variables, Flexbox, Glassmorphism), JavaScript (ES6+)
- **Backend**: Chrome Extension API (Manifest V3), Service Workers (`background.js`)
- **Storage**: `chrome.storage.local` for persistent data.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
#
